import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { Loader } from "../components/ui/Loader";

const HomePage = lazy(() => import("../features/studio/HomePage"));
const BookingPage = lazy(() => import("../features/booking/BookingPage"));
const WorksPage = lazy(() => import("../features/works/WorksPage"));
const AdminLayout = lazy(() =>
  import("../layouts/AdminLayout").then((module) => ({
    default: module.AdminLayout,
  })),
);
const LoginPage = lazy(() => import("../pages/admin/LoginPage"));
const AdminDashboardPage = lazy(
  () => import("../pages/admin/AdminDashboardPage"),
);
const AdminBookingsPage = lazy(
  () => import("../pages/admin/AdminBookingsPage"),
);
const AdminSchedulePage = lazy(
  () => import("../pages/admin/AdminSchedulePage"),
);
const AdminAvailabilityPage = lazy(
  () => import("../pages/admin/AdminAvailabilityPage"),
);
const AdminSettingsPage = lazy(
  () => import("../pages/admin/AdminSettingsPage"),
);
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

function LegacyReceipt() {
  const { state } = useLocation();
  return <Navigate to="/booking" replace state={state} />;
}

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="route-loading">
          <Loader label="Opening the studio" />
        </div>
      }
    >
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="works" element={<WorksPage />} />
          <Route path="gallery" element={<Navigate to="/works" replace />} />
          <Route path="about" element={<Navigate to="/#about" replace />} />
          <Route path="contact" element={<Navigate to="/#contact" replace />} />
          <Route
            path="availability"
            element={<Navigate to="/booking" replace />}
          />
          <Route path="booking/confirmation" element={<LegacyReceipt />} />
          <Route
            path="privacy-policy"
            element={<Navigate to="/?privacy=1#contact" replace />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="admin/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="schedule" element={<AdminSchedulePage />} />
            <Route path="availability" element={<AdminAvailabilityPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
