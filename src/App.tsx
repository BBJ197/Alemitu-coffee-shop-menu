import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MenuPage from "./pages/MenuPage";

// Admin code is a separate chunk, so customers never download it.
const AdminRoutes = lazy(() => import("./admin/AdminRoutes"));

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<p role="status">Loading…</p>}>
              <AdminRoutes />
            </Suspense>
          }
        />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </>
  );
}
