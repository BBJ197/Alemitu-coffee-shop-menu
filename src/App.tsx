import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import MenuPage from "./pages/MenuPage";
import NotFoundPage from "./pages/NotFoundPage";

// Admin code is a separate chunk, so customers never download it.
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AdminRoutes = lazy(() => import("./admin/AdminRoutes"));

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={null}>
              <LandingPage />
            </Suspense>
          }
        />
        <Route path="/menu" element={<MenuPage />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<p role="status">Loading…</p>}>
              <AdminRoutes />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
