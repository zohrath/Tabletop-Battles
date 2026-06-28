import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

loadLocalEnv();

const { createApiServer } = await import("./api.mjs");

const port = Number(process.env.API_PORT ?? 8787);
const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const server = createApiServer();

  server.listen(port, () => {
    console.log(`Tabletop Battles API listening on http://localhost:${port}`);
  });
}

function loadLocalEnv() {
  const envFile = ".env.local";

  if (!existsSync(envFile)) {
    return;
  }

  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(envFile);
    return;
  }

  const lines = readFileSync(envFile, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = unquoteEnvValue(rawValue);
  }
}

function unquoteEnvValue(value) {
  const quote = value[0];

  if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
    return value.slice(1, -1);
  }

  return value;
}
