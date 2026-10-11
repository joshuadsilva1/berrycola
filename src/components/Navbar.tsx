import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Search, User, LayoutDashboard } from "lucide-react";
import logo from "../assets/berrycola-logo.jpg";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useOrderUpdates } from "../context/OrderUpdatesContext";

// Updated to use hash links pointing to the folder sections
const NAV_LINKS = [
  { label: "Shop", href: "/#shop" },
  { label: "Bag Charms", href: "/#bag-charms" },
  { label: "Our Story", href: "/#our-story" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, openCart } = useCart();
  const { firebaseUser, profile } = useAuth();
  const { updates } = useOrderUpdates();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
          scrolled ? "bg-cream/90 backdrop-blur-md shadow-[0_1px_0_rgba(60,38,32,0.08)]" : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="BerryCola"
              className="w-10 h-10 rounded-full shadow-md transition-transform duration-300 group-hover:rotate-12"
            />
            <span className="font-display text-lg tracking-wide text-espresso hidden sm:block">
              BerryCola
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-9">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative text-[13px] font-medium uppercase tracking-[0.12em] text-espresso/80 hover:text-cola-red transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[1.5px] after:bg-cola-red hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              aria-label="Search"
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full text-espresso/80 hover:text-cola-red hover:bg-espresso/5 transition-colors"
            >
              <Search size={18} />
            </button>
            <Link
              to={firebaseUser ? "/account" : "/login"}
              aria-label={firebaseUser ? "Account" : "Login"}
              className="relative hidden sm:flex w-9 h-9 items-center justify-center rounded-full text-espresso/80 hover:text-cola-red hover:bg-espresso/5 transition-colors"
            >
              <User size={18} />
              {updates.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cola-red ring-2 ring-cream" />
              )}
            </Link>
            {profile?.isAdmin && (
              <Link
                to="/admin/analytics"
                aria-label="Admin dashboard"
                title="Admin dashboard"
                className="flex w-9 h-9 items-center justify-center rounded-full text-cola-red bg-cola-red/10 hover:bg-cola-red hover:text-cream transition-colors"
              >
                <LayoutDashboard size={18} />
              </Link>
            )}
            <button
              aria-label="Open cart"
              onClick={openCart}
              className="relative flex w-9 h-9 items-center justify-center rounded-full text-espresso/80 hover:text-cola-red hover:bg-espresso/5 transition-colors"
            >
              <ShoppingBag size={19} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 h-[18px] min-w-[18px] px-1 rounded-full bg-cola-red text-cream text-[10px] font-bold flex items-center justify-center"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden flex w-9 h-9 items-center justify-center text-espresso"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed top-20 inset-x-0 z-40 bg-cream/98 backdrop-blur-md shadow-lg md:hidden overflow-hidden"
          >
            <nav className="flex flex-col px-6 py-6 gap-1">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)} // Close menu when clicked
                    className="block py-3 text-lg font-display text-espresso border-b border-espresso/10"
                  >
                    {link.label}
                  </a>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.05 }}
              >
                <Link
                  to={firebaseUser ? "/account" : "/login"}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-lg font-display text-espresso border-b border-espresso/10"
                >
                  {firebaseUser ? "Account" : "Login"}
                </Link>
              </motion.div>
              {profile?.isAdmin && (
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (NAV_LINKS.length + 1) * 0.05 }}
                >
                  <Link
                    to="/admin/analytics"
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 text-lg font-display text-cola-red border-b border-espresso/10"
                  >
                    Admin dashboard
                  </Link>
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}