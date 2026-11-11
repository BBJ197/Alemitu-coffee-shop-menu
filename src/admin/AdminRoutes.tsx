import { Navigate, Route, Routes } from "react-router-dom";
import "./admin.css";
import AdminCategoriesPage from "./categories/AdminCategoriesPage";
import AdminHome from "./dashboard/AdminHome";
import AdminLayout from "./AdminLayout";
import AdminItemFormPage from "./items/AdminItemFormPage";
import AdminItemsPage from "./items/AdminItemsPage";
import AdminLoginPage from "./auth/AdminLoginPage";
import AdminMessagesPage from "./messages/AdminMessagesPage";
import AdminQrPage from "./qr/AdminQrPage";
import AdminSettingsPage from "./settings/AdminSettingsPage";
import AdminTagsPage from "./tags/AdminTagsPage";
import RequireAdmin from "./auth/RequireAdmin";

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
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="tags" element={<AdminTagsPage />} />
          <Route path="messages" element={<AdminMessagesPage />} />
          <Route path="qr" element={<AdminQrPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
