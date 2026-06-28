import { useState } from "react";

type AuthProvider = "local" | "neon";

type LoginPageProps = {
  localAuthEnabled: boolean;
  neonAuthEnabled: boolean;
  neonSignUpEnabled: boolean;
  onLocalLogin: (username: string, password: string) => Promise<void>;
  onNeonLogin: (email: string, password: string) => Promise<void>;
  onNeonSignUp: (email: string, password: string) => Promise<void>;
};

function LoginPage({
  localAuthEnabled,
  neonAuthEnabled,
  neonSignUpEnabled,
  onLocalLogin,
  onNeonLogin,
  onNeonSignUp,
}: LoginPageProps) {
  const initialMode = neonAuthEnabled ? "neon" : "local";
  const [mode, setMode] = useState<AuthProvider>(initialMode);
  const [username, setUsername] = useState(initialMode === "neon" ? "" : "admin");
  const [password, setPassword] = useState(initialMode === "neon" ? "" : "admin");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isNeonMode = mode === "neon";

  return (
    <main className="login-shell">
      <form
        className="login-panel"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          setIsSubmitting(true);
          console.info("[auth] Login submit", {
            mode,
            neonAuthEnabled,
            signUp: isSignUp && isNeonMode,
          });
          const submit = isNeonMode
            ? isSignUp && neonSignUpEnabled
              ? onNeonSignUp(username, password)
              : onNeonLogin(username, password)
            : localAuthEnabled
              ? onLocalLogin(username, password)
              : Promise.reject(new Error("Local admin login is only available locally."));

          submit.catch((loginError: Error) => setError(loginError.message)).finally(() => setIsSubmitting(false));
        }}
      >
        <div>
          <h1>Tabletop Battles</h1>
          <p>Log in to continue.</p>
        </div>
        {neonAuthEnabled && localAuthEnabled && (
          <div className="login-mode-tabs" role="tablist" aria-label="Login type">
            <button
              aria-selected={mode === "neon"}
              onClick={() => {
                setMode("neon");
                setUsername("");
                setPassword("");
                setError("");
              }}
              role="tab"
              type="button"
            >
              Neon
            </button>
            <button
              aria-selected={mode === "local"}
              onClick={() => {
                setMode("local");
                setUsername("admin");
                setPassword("admin");
                setError("");
              }}
              role="tab"
              type="button"
            >
              Local Admin
            </button>
          </div>
        )}
        <label>
          <span>{isNeonMode ? "Email" : "Username"}</span>
          <input
            autoComplete={isNeonMode ? "email" : "username"}
            type={isNeonMode ? "email" : "text"}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          <span>Password</span>
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p className="error-message">{error}</p>}
        <button disabled={isSubmitting} type="submit">
          {isSubmitting
            ? isSignUp && isNeonMode && neonSignUpEnabled
              ? "Creating..."
              : "Logging in..."
            : isSignUp && isNeonMode && neonSignUpEnabled
              ? "Create Account"
              : "Log In"}
        </button>
        {isNeonMode && neonSignUpEnabled && (
          <button
            className="login-link-button"
            onClick={() => {
              setError("");
              setIsSignUp((current) => !current);
            }}
            type="button"
          >
            {isSignUp ? "Already have a Neon account? Log in" : "Need a Neon account? Create one"}
          </button>
        )}
      </form>
    </main>
  );
}

export default LoginPage;
