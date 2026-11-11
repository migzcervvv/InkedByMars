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
const AdminBookingsPage = lazy(
  () => import("../features/admin/bookings/BookingsPage"),
);
const AdminCalendarPage = lazy(
  () => import("../features/admin/calendar/CalendarPage"),
);
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

function LegacyReceipt() {
  const { state } = useLocation();
  return <Navigate to="/booking" replace state={state} />;
}

function LegacyAdmin({ path }) {
  const { search } = useLocation();
  return <Navigate to={{ pathname: path, search }} replace />;
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
            <Route index element={<LegacyAdmin path="/admin/bookings" />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="calendar" element={<AdminCalendarPage />} />
            <Route path="schedule" element={<LegacyAdmin path="/admin/calendar" />} />
            <Route path="availability" element={<LegacyAdmin path="/admin/calendar" />} />
            <Route path="settings" element={<LegacyAdmin path="/admin/calendar" />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
