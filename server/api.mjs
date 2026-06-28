import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import http from "node:http";
import { URL } from "node:url";
import pg from "pg";

const { Pool } = pg;
const databaseUrl =
  process.env.STORAGE_TABLETOP_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgres://tabletop:tabletop@localhost:5436/tabletop_battles";
const pool = new Pool({ connectionString: databaseUrl });
const schemaReady = ensureSchema();

export function createApiServer() {
  return http.createServer(handleApiRequest);
}

export async function handleApiRequest(request, response) {
  try {
    await schemaReady;

    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

    if (request.method === "OPTIONS") {
      sendJson(response, 204, null);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/login") {
      await login(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/logout") {
      await logout(request, response);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/session") {
      sendJson(response, 200, { account: await requireAccount(request) });
      return;
    }

    if (url.pathname === "/api/admin/accounts") {
      await handleAccounts(request, response);
      return;
    }

    const accountMatch = url.pathname.match(/^\/api\/admin\/accounts\/([^/]+)$/);
    if (accountMatch) {
      await handleAccount(request, response, accountMatch[1]);
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    const status = error.status ?? 500;
    sendJson(response, status, {
      error: status === 500 ? "Internal server error" : error.message,
    });
    if (status === 500) {
      console.error(error);
    }
  }
}

async function ensureSchema() {
  await pool.query(`
    create table if not exists accounts (
      id text primary key,
      username text not null unique,
      password_hash text not null,
      password_salt text not null,
      is_admin boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  await pool.query(`
    create table if not exists account_sessions (
      token_hash text primary key,
      account_id text not null references accounts(id) on delete cascade,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null
    )
  `);

  const existingAdmin = await pool.query(
    "select id from accounts where username = $1",
    ["admin"],
  );

  if (existingAdmin.rowCount === 0) {
    const password = hashPassword("admin");
    await pool.query(
      `insert into accounts
        (id, username, password_hash, password_salt, is_admin)
       values ($1, $2, $3, $4, true)`,
      [randomUUID(), "admin", password.hash, password.salt],
    );
  }
}

async function login(request, response) {
  const body = await readJson(request);
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");

  if (!username || !password) {
    throw httpError(400, "Username and password are required");
  }

  const result = await pool.query(
    "select * from accounts where username = $1",
    [username],
  );
  const account = result.rows[0];

  if (!account || !verifyPassword(password, account.password_salt, account.password_hash)) {
    throw httpError(401, "Invalid username or password");
  }

  await pool.query("delete from account_sessions where expires_at < now()");

  const token = randomBytes(32).toString("hex");
  await pool.query(
    `insert into account_sessions (token_hash, account_id, expires_at)
     values ($1, $2, now() + interval '30 days')`,
    [hashToken(token), account.id],
  );

  sendJson(response, 200, { account: toPublicAccount(account), token });
}

async function logout(request, response) {
  const token = getBearerToken(request);

  if (token) {
    await pool.query("delete from account_sessions where token_hash = $1", [
      hashToken(token),
    ]);
  }

  sendJson(response, 200, { ok: true });
}

async function handleAccounts(request, response) {
  const account = await requireAdmin(request);

  if (request.method === "GET") {
    const result = await pool.query(
      `select id, username, is_admin, created_at, updated_at
       from accounts
       order by username asc`,
    );
    sendJson(response, 200, { accounts: result.rows });
    return;
  }

  if (request.method === "POST") {
    if (!isLocalRequest(request)) {
      throw httpError(403, "Account creation is only available locally");
    }

    const body = await readJson(request);
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const isAdmin = Boolean(body.isAdmin);

    if (!username || !password) {
      throw httpError(400, "Username and password are required");
    }

    const hashed = hashPassword(password);
    const result = await pool.query(
      `insert into accounts
        (id, username, password_hash, password_salt, is_admin)
       values ($1, $2, $3, $4, $5)
       returning id, username, is_admin, created_at, updated_at`,
      [randomUUID(), username, hashed.hash, hashed.salt, isAdmin],
    );
    sendJson(response, 201, { account: result.rows[0], currentAccount: account });
    return;
  }

  sendJson(response, 405, { error: "Method not allowed" });
}

async function handleAccount(request, response, accountId) {
  await requireAdmin(request);

  if (request.method === "PUT") {
    const body = await readJson(request);
    const username = String(body.username ?? "").trim();
    const isAdmin = Boolean(body.isAdmin);
    const password = String(body.password ?? "");

    if (!username) {
      throw httpError(400, "Username is required");
    }

    const existing = await pool.query("select * from accounts where id = $1", [
      accountId,
    ]);

    if (existing.rowCount === 0) {
      throw httpError(404, "Account not found");
    }

    if (password) {
      const hashed = hashPassword(password);
      await pool.query(
        `update accounts
         set username = $1, is_admin = $2, password_hash = $3,
             password_salt = $4, updated_at = now()
         where id = $5`,
        [username, isAdmin, hashed.hash, hashed.salt, accountId],
      );
    } else {
      await pool.query(
        `update accounts
         set username = $1, is_admin = $2, updated_at = now()
         where id = $3`,
        [username, isAdmin, accountId],
      );
    }

    const result = await pool.query(
      `select id, username, is_admin, created_at, updated_at
       from accounts where id = $1`,
      [accountId],
    );
    sendJson(response, 200, { account: result.rows[0] });
    return;
  }

  if (request.method === "DELETE") {
    const target = await pool.query(
      "select id, is_admin from accounts where id = $1",
      [accountId],
    );

    if (target.rowCount === 0) {
      throw httpError(404, "Account not found");
    }

    const adminCount = await pool.query(
      "select count(*)::int as count from accounts where is_admin = true",
    );

    if (target.rows[0].is_admin && adminCount.rows[0].count <= 1) {
      throw httpError(400, "Cannot delete the last admin account");
    }

    await pool.query("delete from accounts where id = $1", [accountId]);
    sendJson(response, 200, { ok: true });
    return;
  }

  sendJson(response, 405, { error: "Method not allowed" });
}

async function requireAccount(request) {
  const token = getBearerToken(request);

  if (!token) {
    throw httpError(401, "Not logged in");
  }

  const result = await pool.query(
    `select accounts.*
     from account_sessions
     join accounts on accounts.id = account_sessions.account_id
     where account_sessions.token_hash = $1
       and account_sessions.expires_at > now()`,
    [hashToken(token)],
  );
  const account = result.rows[0];

  if (!account) {
    throw httpError(401, "Not logged in");
  }

  return toPublicAccount(account);
}

async function requireAdmin(request) {
  const account = await requireAccount(request);

  if (!account.isAdmin) {
    throw httpError(403, "Admin account required");
  }

  return account;
}

function getBearerToken(request) {
  const authorization = request.headers.authorization ?? "";
  const match = authorization.match(/^Bearer (.+)$/);
  return match?.[1] ?? "";
}

function isLocalRequest(request) {
  const host = request.headers.host ?? "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  });

  response.end(payload === null ? "" : JSON.stringify(payload));
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return {
    salt,
    hash: scryptSync(password, salt, 64).toString("hex"),
  };
}

function verifyPassword(password, salt, expectedHash) {
  const actualHash = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (actualHash.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedBuffer);
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function toPublicAccount(account) {
  return {
    id: account.id,
    username: account.username,
    isAdmin: account.is_admin,
  };
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
