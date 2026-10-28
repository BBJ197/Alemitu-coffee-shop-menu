import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminSession } from "./hooks";

/** Renders the nested admin routes only for a signed-in admin. */
export default function RequireAdmin() {
  const session = useAdminSession();
  const location = useLocation();

  if (session.isPending) {
    return (
      <main id="main" className="admin-auth">
        <p role="status">Checking your session…</p>
      </main>
    );
  }

  // A network or server failure is not the same as "signed out": don't bounce
  // someone who may well be signed in to the login page.
  if (session.isError) {
    return (
      <main id="main" className="admin-auth">
        <div className="admin-card" role="alert">
          <h1>Couldn't check your session</h1>
          <p>The server didn't answer. Check your connection and try again.</p>
          <button
            type="button"
            className="admin-button"
            onClick={() => void session.refetch()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!session.data) {
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  }

  return <Outlet />;
}
