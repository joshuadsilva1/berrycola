import { useEffect, useState } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import IntroSplash from "./components/IntroSplash";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { OrderUpdatesProvider } from "./context/OrderUpdatesContext";
import OrderUpdateBanner from "./components/OrderUpdateBanner";
import { RequireAdmin, RequireAuth } from "./components/ProtectedRoute";
import { track } from "./lib/analytics";
import { fetchStorefront } from "./lib/api";
import WhatsAppButton from "./components/WhatsAppButton";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Account from "./pages/Account";
import CheckoutReceipt from "./components/CheckoutReceipt";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminStorefront from "./pages/admin/AdminStorefront";
import AdminPromos from "./pages/admin/AdminPromos";
import ComingSoon from "./pages/ComingSoon";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageViewTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    track("page_view");
  }, [pathname]);
  return null;
}

function ContentGuard({ storeConfig, children }: { storeConfig: any; children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Wait until storefront config finishes fetching
  if (!storeConfig || loading) {
    return <div className="min-h-screen bg-cream" />;
  }

  const isAdmin = Boolean(profile?.isAdmin || user?.isAdmin || (user as any)?.is_admin || (user as any)?.role === "admin");
  const isAuthOrAdminRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/login");

  // Block non-admins from all storefront pages when comingSoon is active
  if (Boolean(storeConfig.comingSoon) && !isAdmin && !isAuthOrAdminRoute) {
    return <ComingSoon />;
  }

  return <>{children}</>;
}

let introPlayedThisVisit = false;

export default function App() {
  const [showIntro, setShowIntro] = useState<boolean>(() => !introPlayedThisVisit);
  const [storeConfig, setStoreConfig] = useState<any>(null);

  const unlockSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx: AudioContext = (window as any).__bcSharedAudioCtx || new AudioCtx();
        (window as any).__bcSharedAudioCtx = ctx;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
      }
    } catch {
      // Ignore if AudioContext is unavailable
    }
    (window as any).__bcAudioUnlocked = true;
    introPlayedThisVisit = true;
    window.dispatchEvent(new Event("bc-audio-unlocked"));
  };

  useEffect(() => {
    try {
      localStorage.removeItem("bc-intro-seen");
      sessionStorage.removeItem("bc-intro-seen");
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    fetchStorefront()
      .then((data) => {
        setStoreConfig(data);
        if (showIntro && (data.splashEnabled === false || data.comingSoon)) {
          introPlayedThisVisit = true;
          setShowIntro(false);
        }
      })
      .catch((err) => console.error("Failed to load storefront config:", err));
  }, [showIntro]);

  const finishIntro = () => {
    introPlayedThisVisit = true;
    setShowIntro(false);
  };

  return (
    <AuthProvider>
      <OrderUpdatesProvider>
        <CartProvider>
          <AnimatePresence>
            {showIntro && (
              <IntroSplash onFinish={finishIntro} onUnlockSound={unlockSound} />
            )}
          </AnimatePresence>

          <ScrollToTop />
          <PageViewTracker />

          <ContentGuard storeConfig={storeConfig}>
            <Navbar />
            <OrderUpdateBanner />
            <CartDrawer />

            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<Product />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/checkout" element={<CheckoutReceipt />} />

                <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />

                <Route path="/admin" element={<Navigate to="/admin/analytics" replace />} />
                <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
                <Route path="/admin/analytics" element={<RequireAdmin><AdminAnalytics /></RequireAdmin>} />
                <Route path="/admin/customers" element={<RequireAdmin><AdminCustomers /></RequireAdmin>} />
                <Route path="/admin/messages" element={<RequireAdmin><AdminMessages /></RequireAdmin>} />
                <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
                <Route path="/admin/storefront" element={<RequireAdmin><AdminStorefront /></RequireAdmin>} />
                <Route path="/admin/promos" element={<RequireAdmin><AdminPromos /></RequireAdmin>} />
              </Routes>
            </main>

            <WhatsAppButton />
            <Footer />
          </ContentGuard>
        </CartProvider>
      </OrderUpdatesProvider>
    </AuthProvider>
  );
}