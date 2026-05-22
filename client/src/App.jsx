import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
} from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { PageTransition } from "./components/layout/PageTransition";
import { Loader } from "./components/ui/Loader";
import { ScrollToTop } from "./components/ui/ScrollToTop";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import { AdminLayout } from "./layouts/AdminLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";

gsap.registerPlugin(ScrollTrigger);

const HomePage = lazy(() => import("./pages/HomePage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const AvailabilityPage = lazy(() => import("./pages/AvailabilityPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const LoginPage = lazy(() => import("./pages/admin/LoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminBookingsPage = lazy(() => import("./pages/admin/AdminBookingsPage"));
const AdminSchedulePage = lazy(() => import("./pages/admin/AdminSchedulePage"));
const AdminAvailabilityPage = lazy(() => import("./pages/admin/AdminAvailabilityPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));

function App() {
  const [loaded, setLoaded] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <LazyMotion features={domAnimation}>
      {!loaded ? (
        <LoadingScreen onComplete={() => setLoaded(true)} />
      ) : (
        <>
          <ScrollToTop />
          {!isAdminRoute && <ScrollProgress />}
          {!isAdminRoute && <CustomCursor />}
          {!isAdminRoute && <Navbar />}
          <AnimatedRoutes />
          {!isAdminRoute && <Footer />}
        </>
      )}
    </LazyMotion>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Suspense fallback={<Loader label="Entering studio" />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <HomePage />
              </PageTransition>
            }
          />
          <Route
            path="/gallery"
            element={
              <PageTransition>
                <GalleryPage />
              </PageTransition>
            }
          />
          <Route
            path="/portfolio"
            element={
              <PageTransition>
                <GalleryPage />
              </PageTransition>
            }
          />
          <Route
            path="/booking"
            element={
              <PageTransition>
                <BookingPage />
              </PageTransition>
            }
          />
          <Route
            path="/availability"
            element={
              <PageTransition>
                <AvailabilityPage />
              </PageTransition>
            }
          />
          <Route
            path="/contact"
            element={
              <PageTransition>
                <ContactPage />
              </PageTransition>
            }
          />
          <Route
            path="/about"
            element={
              <PageTransition>
                <AboutPage />
              </PageTransition>
            }
          />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="schedule" element={<AdminSchedulePage />} />
              <Route path="availability" element={<AdminAvailabilityPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>
          <Route
            path="*"
            element={
              <PageTransition>
                <NotFoundPage />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

function ScrollProgress() {
  useEffect(() => {
    const tween = gsap.to(".scroll-progress", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.15 },
    });
    return () => tween.kill();
  }, []);

  return (
    <div className="scroll-progress fixed left-0 top-0 z-[90] h-1 w-full origin-left scale-x-0 bg-red" />
  );
}

function CustomCursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return undefined;
    const dotX = gsap.quickTo(dot.current, "x", {
      duration: 0.05,
      ease: "none",
    });
    const dotY = gsap.quickTo(dot.current, "y", {
      duration: 0.05,
      ease: "none",
    });
    const ringX = gsap.quickTo(ring.current, "x", {
      duration: 0.15,
      ease: "power2.out",
    });
    const ringY = gsap.quickTo(ring.current, "y", {
      duration: 0.15,
      ease: "power2.out",
    });

    const move = (event) => {
      dotX(event.clientX - 4);
      dotY(event.clientY - 4);
      ringX(event.clientX - 18);
      ringY(event.clientY - 18);
    };
    const over = (event) => {
      const target = event.target.closest(
        'a,button,input,select,textarea,[role="button"]',
      );
      const image = event.target.closest("img");
      gsap.to(dot.current, { scale: target ? 0 : 1, duration: 0.2 });
      gsap.to(ring.current, {
        scale: target ? 2 : 1,
        backgroundColor: image ? "rgba(205,45,43,0.16)" : "transparent",
        duration: 0.2,
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("mouseover", over);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("mouseover", over);
    };
  }, []);

  return (
    <>
      <span ref={dot} className="cursor-dot" />
      <span ref={ring} className="cursor-ring" />
    </>
  );
}

export default App;
