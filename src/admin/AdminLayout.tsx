import { Link, NavLink, Outlet } from "react-router-dom";
import { useAdminSession, useLogout } from "./hooks";

const groups = [
  {
    label: "Overview",
    links: [{ to: "/admin", label: "Dashboard", end: true }],
  },
  {
    label: "Menu",
    links: [
      { to: "/admin/items", label: "Items" },
      { to: "/admin/categories", label: "Categories" },
      { to: "/admin/tags", label: "Tags" },
    ],
  },
  {
    label: "Customers",
    links: [{ to: "/admin/messages", label: "Messages" }],
  },
  {
    label: "Tools",
    links: [
      { to: "/admin/qr", label: "QR code" },
      { to: "/admin/settings", label: "Account" },
    ],
  },
];

export default function AdminLayout() {
  const session = useAdminSession();
  const logout = useLogout();
  const initial = session.data?.email?.[0]?.toUpperCase() ?? "A";

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link to="/admin" className="admin-brand">
          <span className="admin-brand__mark" aria-hidden="true" />
          <span>Alemitu admin</span>
        </Link>
        <nav className="admin-nav" aria-label="Admin">
          {groups.map((g) => (
            <div key={g.label} className="admin-nav__group">
              <span className="admin-nav__label">{g.label}</span>
              {g.links.map((l) => (
                <NavLink key={l.to} to={l.to} end={"end" in l && l.end}>
                  <span>{l.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-user">
          <span className="admin-avatar" aria-hidden="true">
            {initial}
          </span>
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
      <div className="admin-content">
        {logout.isError && (
          <p role="alert" className="admin-error admin-error--bar">
            Couldn't sign out. Check your connection and try again.
          </p>
        )}
        <main id="main" className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
