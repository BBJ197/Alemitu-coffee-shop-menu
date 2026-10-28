import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAdminSession, useLogin } from "./hooks";
import { loginErrorMessage } from "./loginError";

/** Only ever return to an admin page; anything else falls back to the dashboard. */
function landingPath(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === "string" &&
    from.startsWith("/admin") &&
    !from.startsWith("/admin/login")
    ? from
    : "/admin";
}

export default function AdminLoginPage() {
  const session = useAdminSession();
  const login = useLogin();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Already signed in, or just signed in: the session cache holds the admin.
  if (session.data) {
    return <Navigate to={landingPath(location.state)} replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login.mutate({ email: email.trim(), password });
  }

  return (
    <main id="main" className="admin-auth">
      <form className="admin-card" onSubmit={handleSubmit}>
        <h1>Staff sign-in</h1>
        <p>Manage the Alemitu Coffee menu.</p>

        <div className="admin-field">
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {login.isError && (
          <p role="alert" className="admin-error">
            {loginErrorMessage(login.error)}
          </p>
        )}

        <button
          type="submit"
          className="admin-button"
          disabled={login.isPending}
        >
          {login.isPending ? "Signing in…" : "Sign in"}
        </button>

        <Link className="admin-link" to="/menu">
          View the public menu
        </Link>
      </form>
    </main>
  );
}
