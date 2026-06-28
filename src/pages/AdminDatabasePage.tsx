import { useCallback, useEffect, useState } from "react";
import { apiRequest, isLocalApp } from "../utils/api";

type AdminAccount = {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export function AdminDatabasePage({ authToken }: { authToken: string }) {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [error, setError] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const isLocal = isLocalApp();

  const loadAccounts = useCallback(async () => {
    setError("");
    try {
      const result = await apiRequest<{ accounts: AdminAccount[] }>("/api/admin/accounts", { token: authToken });
      setAccounts(result.accounts);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }, [authToken]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadAccounts();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadAccounts]);

  async function createAccount() {
    setError("");
    try {
      await apiRequest("/api/admin/accounts", {
        body: {
          username: newUsername,
          password: newPassword,
          isAdmin: newIsAdmin,
        },
        method: "POST",
        token: authToken,
      });
      setNewUsername("");
      setNewPassword("");
      setNewIsAdmin(false);
      await loadAccounts();
    } catch (createError) {
      setError((createError as Error).message);
    }
  }

  async function updateAccount(account: AdminAccount, password: string) {
    setError("");
    try {
      await apiRequest(`/api/admin/accounts/${account.id}`, {
        body: {
          username: account.username,
          password,
          isAdmin: account.is_admin,
        },
        method: "PUT",
        token: authToken,
      });
      await loadAccounts();
    } catch (updateError) {
      setError((updateError as Error).message);
    }
  }

  async function deleteAccount(accountId: string) {
    setError("");
    try {
      await apiRequest(`/api/admin/accounts/${accountId}`, {
        method: "DELETE",
        token: authToken,
      });
      await loadAccounts();
    } catch (deleteError) {
      setError((deleteError as Error).message);
    }
  }

  return (
    <section className="admin-page" aria-label="Database admin">
      {error && <p className="error-message">{error}</p>}
      <article className="admin-card">
        <h2>Accounts</h2>
        {isLocal ? (
          <div className="admin-create-row">
            <input
              placeholder="Username"
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
            />
            <input
              placeholder="Password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <label>
              <input checked={newIsAdmin} type="checkbox" onChange={(event) => setNewIsAdmin(event.target.checked)} />
              Admin
            </label>
            <button disabled={!newUsername.trim() || !newPassword} type="button" onClick={() => void createAccount()}>
              Create
            </button>
          </div>
        ) : (
          <p className="admin-note">Account creation is only available locally.</p>
        )}
        <div className="admin-account-list">
          {accounts.map((account) => (
            <AdminAccountRow
              account={account}
              key={account.id}
              onDelete={() => void deleteAccount(account.id)}
              onSave={(nextAccount, password) => void updateAccount(nextAccount, password)}
            />
          ))}
        </div>
      </article>
    </section>
  );
}

type AdminAccountRowProps = {
  account: AdminAccount;
  onDelete: () => void;
  onSave: (account: AdminAccount, password: string) => void;
};

function AdminAccountRow({ account, onDelete, onSave }: AdminAccountRowProps) {
  const [username, setUsername] = useState(account.username);
  const [isAdmin, setIsAdmin] = useState(account.is_admin);
  const [password, setPassword] = useState("");

  return (
    <article className="admin-account-row">
      <input value={username} onChange={(event) => setUsername(event.target.value)} />
      <input
        placeholder="New password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <label>
        <input checked={isAdmin} type="checkbox" onChange={(event) => setIsAdmin(event.target.checked)} />
        Admin
      </label>
      <button type="button" onClick={() => onSave({ ...account, username, is_admin: isAdmin }, password)}>
        Save
      </button>
      <button type="button" onClick={onDelete}>
        Delete
      </button>
    </article>
  );
}
