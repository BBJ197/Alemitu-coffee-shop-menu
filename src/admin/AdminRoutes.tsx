import { Navigate, Route, Routes } from "react-router-dom";
import "./admin.css";
import AdminHome from "./AdminHome";
import AdminLayout from "./AdminLayout";
import AdminLoginPage from "./AdminLoginPage";
import RequireAdmin from "./RequireAdmin";

/** Mounted at /admin/* and loaded lazily, so none of this ships to customers. */
export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
