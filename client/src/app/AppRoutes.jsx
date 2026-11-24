import { lazy, Suspense, useLayoutEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { flushSync } from "react-dom";
import { ScrollToTop } from "../components/ui/ScrollToTop";

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
const AdminUsersPage = lazy(() => import("../features/admin/TeamAccountsPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

function LegacyReceipt() {
  const { state } = useLocation();
  return <Navigate to="/booking" replace state={state} />;
}

function LegacyAdmin({ path }) {
  const { search } = useLocation();
  return <Navigate to={{ pathname: path, search }} replace />;
}

function RouteReady({ ready }) {
  useLayoutEffect(() => { ready.current?.() })
  return <ScrollToTop />
}

export function AppRoutes() {
  const target = useLocation();
  const [page, setPage] = useState(target);
  const [showIntro, setShowIntro] = useState(target.pathname === "/");
  const ready = useRef(null);
  const changingPage = page.pathname !== target.pathname;

  useLayoutEffect(() => {
    if (!changingPage) return;
    const controller = new AbortController();
    const commit = () => {
      setShowIntro(false);
      setPage(target);
    };
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      commit();
      return;
    }
    const transition = document.startViewTransition(() => {
      if (controller.signal.aborted) return;
      return new Promise(resolve => {
        ready.current = resolve;
        controller.signal.addEventListener("abort", resolve, { once: true });
        flushSync(commit);
      });
    });
    return () => {
      controller.abort();
      transition.skipTransition();
    };
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Suspense fallback={null}>
      <Routes location={changingPage ? page : target}>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage showIntro={showIntro} />} />
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
            <Route element={<ProtectedRoute roles={['super_admin']} />}>
              <Route path="users" element={<AdminUsersPage />} />
            </Route>
            <Route path="schedule" element={<LegacyAdmin path="/admin/calendar" />} />
            <Route path="availability" element={<LegacyAdmin path="/admin/calendar" />} />
            <Route path="settings" element={<LegacyAdmin path="/admin/calendar" />} />
          </Route>
        </Route>
      </Routes>
      {!changingPage && <RouteReady ready={ready} />}
    </Suspense>
  );
}
