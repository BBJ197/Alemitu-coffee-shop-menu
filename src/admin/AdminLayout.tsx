import { Link, Outlet } from "react-router-dom";
import { useAdminSession, useLogout } from "./hooks";

export default function AdminLayout() {
  const session = useAdminSession();
  const logout = useLogout();

  return (
    <>
      <header className="admin-header">
        <Link to="/admin" className="admin-brand">
          Alemitu admin
        </Link>
        <div className="admin-user">
          <span className="admin-email">{session.data?.email}</span>
          <button
            type="button"
            className="admin-button admin-button--quiet"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            Sign out
          </button>
        </div>
      </header>
      {logout.isError && (
        <p role="alert" className="admin-error admin-error--bar">
          Couldn't sign out. Check your connection and try again.
        </p>
      )}
      <main id="main" className="admin-main">
        <Outlet />
      </main>
    </>
  );
}
