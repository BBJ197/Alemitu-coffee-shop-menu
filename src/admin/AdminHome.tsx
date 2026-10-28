import { Link } from "react-router-dom";

export default function AdminHome() {
  return (
    <>
      <h1>Dashboard</h1>
      <p>You're signed in.</p>
      <p>
        <Link className="admin-link" to="/admin/items">
          Manage menu items
        </Link>
      </p>
    </>
  );
}
