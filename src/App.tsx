import { useEffect, useState } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import IntroSplash from "./components/IntroSplash";
import { CategoryShapeDefs } from "./components/CategoryShapes";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
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
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminStorefront from "./pages/admin/AdminStorefront";
import AdminPromos from "./pages/admin/AdminPromos";

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

export default function App() {
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem("bc-intro-seen"));

  useEffect(() => {
    if (!showIntro) return;

    fetchStorefront()
      .then((data) => {
        if (data.splashEnabled === false) {
          setShowIntro(false);
          sessionStorage.setItem("bc-intro-seen", "1");
        }
      })
      .catch((err) => console.error("Failed to load storefront config:", err));
  }, [showIntro]);

  const finishIntro = () => {
    sessionStorage.setItem("bc-intro-seen", "1");
    setShowIntro(false);
  };

  return (
    <AuthProvider>
      <OrderUpdatesProvider>
        <CartProvider>
          <CategoryShapeDefs />
          <AnimatePresence>
            {showIntro && <IntroSplash onFinish={finishIntro} />}
          </AnimatePresence>

          <ScrollToTop />
          <PageViewTracker />
          
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
        </CartProvider>
      </OrderUpdatesProvider>
    </AuthProvider>
  );
}