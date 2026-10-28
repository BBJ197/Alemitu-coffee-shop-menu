import { Navigate, Route, Routes } from "react-router-dom";
import "./admin.css";
import AdminHome from "./AdminHome";
import AdminLayout from "./AdminLayout";
import AdminItemFormPage from "./AdminItemFormPage";
import AdminItemsPage from "./AdminItemsPage";
import AdminLoginPage from "./AdminLoginPage";
import AdminSettingsPage from "./AdminSettingsPage";
import RequireAdmin from "./RequireAdmin";

/** Mounted at /admin/* and loaded lazily, so none of this ships to customers. */
export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="items" element={<AdminItemsPage />} />
          <Route path="items/new" element={<AdminItemFormPage />} />
          <Route path="items/:id/edit" element={<AdminItemFormPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
