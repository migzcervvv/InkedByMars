import { useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { PageTransition } from "./components/layout/PageTransition";
import { ScrollToTop } from "./components/ui/ScrollToTop";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { AdminLayout } from "./layouts/AdminLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { loadFacebookSDK } from "./lib/facebook";
import HomePage from "./pages/HomePage";
import GalleryPage from "./pages/GalleryPage";
import BookingPage from "./pages/BookingPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LoginPage from "./pages/admin/LoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage";
import AdminSchedulePage from "./pages/admin/AdminSchedulePage";
import AdminAvailabilityPage from "./pages/admin/AdminAvailabilityPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

gsap.registerPlugin(ScrollTrigger);

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    loadFacebookSDK();
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <ScrollToTop />
      {!isAdminRoute && <ScrollProgress />}
      <CustomCursor />
      {!isAdminRoute && <Navbar />}
      <AnimatedRoutes />
      {!isAdminRoute && <Footer />}
    </LazyMotion>
  );
}

function PageWithTitle({ title, children }) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return children;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <ErrorBoundary key={location.pathname}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageWithTitle title="Inked By Mars - Tattoo Artist">
                <PageTransition>
                  <HomePage />
                </PageTransition>
              </PageWithTitle>
            }
          />
          <Route
            path="/gallery"
            element={
              <PageWithTitle title="Gallery - Inked By Mars">
                <PageTransition>
                  <GalleryPage />
                </PageTransition>
              </PageWithTitle>
            }
          />
          <Route
            path="/booking/confirmation"
            element={
              <PageWithTitle title="Booking Received - Inked By Mars">
                <PageTransition>
                  <BookingConfirmationPage />
                </PageTransition>
              </PageWithTitle>
            }
          />
          <Route
            path="/booking"
            element={
              <PageWithTitle title="Book a Session - Inked By Mars">
                <PageTransition>
                  <BookingPage />
                </PageTransition>
              </PageWithTitle>
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
          <Route
            path="/privacy-policy"
            element={
              <PageTransition>
                <PrivacyPolicy />
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
              <PageWithTitle title="Page Not Found - Inked By Mars">
                <PageTransition>
                  <NotFoundPage />
                </PageTransition>
              </PageWithTitle>
            }
          />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}

function ScrollProgress() {
  const progressRef = useRef(null);

  useEffect(() => {
    if (!progressRef.current) return undefined;

    const tween = gsap.to(progressRef.current, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.15 },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <div
      ref={progressRef}
      className="fixed left-0 top-0 z-[90] h-1 w-full origin-left scale-x-0 bg-red"
    />
  );
}

function CustomCursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return undefined;
    if (!dot.current || !ring.current) return undefined;

    const dotEl = dot.current;
    const ringEl = ring.current;

    // Hide until first move so they don't flash at (0,0)
    gsap.set([dotEl, ringEl], { autoAlpha: 0 });

    const dotX = gsap.quickTo(dotEl, "x", { duration: 0.05, ease: "none" });
    const dotY = gsap.quickTo(dotEl, "y", { duration: 0.05, ease: "none" });
    const ringX = gsap.quickTo(ringEl, "x", {
      duration: 0.15,
      ease: "power2.out",
    });
    const ringY = gsap.quickTo(ringEl, "y", {
      duration: 0.15,
      ease: "power2.out",
    });

    let initialized = false;

    const move = (event) => {
      dotX(event.clientX - 4);
      dotY(event.clientY - 4);
      ringX(event.clientX - 18);
      ringY(event.clientY - 18);

      if (!initialized) {
        gsap.to([dotEl, ringEl], { autoAlpha: 1, duration: 0.3 });
        initialized = true;
      }
    };

    const over = (event) => {
      const target = event.target.closest(
        'a,button,input,select,textarea,[role="button"]',
      );
      const image = event.target.closest("img");
      gsap.to(dotEl, { scale: target ? 0 : 1, duration: 0.2 });
      gsap.to(ringEl, {
        scale: target ? 2 : 1,
        backgroundColor: image ? "rgba(205,45,43,0.16)" : "transparent",
        duration: 0.2,
      });
    };

    const hide = () => {
      gsap.to([dotEl, ringEl], { autoAlpha: 0, duration: 0.2 });
    };

    const show = () => {
      if (initialized) {
        gsap.to([dotEl, ringEl], { autoAlpha: 1, duration: 0.2 });
      }
    };

    const resetOnEnter = () => {
      // Reset scale state so a frozen "hover" scale doesn't persist after re-entry
      gsap.to(dotEl, { scale: 1, duration: 0.2 });
      gsap.to(ringEl, {
        scale: 1,
        backgroundColor: "transparent",
        duration: 0.2,
      });
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    document.documentElement.addEventListener("mouseleave", hide);
    const handleEnter = () => {
      show();
      resetOnEnter();
    };

    document.documentElement.addEventListener("mouseenter", handleEnter);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("mouseleave", hide);
      document.documentElement.removeEventListener("mouseenter", handleEnter);
      gsap.killTweensOf([dotEl, ringEl]);
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
