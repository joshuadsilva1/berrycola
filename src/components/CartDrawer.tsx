import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CharmIcon from "./CharmIcon";
import ProductImage, { imageFor } from "./ProductImage";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { placeOrder } from "../lib/api";
import { variantPrice } from "../data/products";
import { track } from "../lib/analytics";

export default function CartDrawer() {
  const { isOpen, closeCart, lines, setQty, removeItem, subtotal, clearCart } = useCart();
  const { firebaseUser, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"cart" | "details" | "placing" | "done">("cart");
  const [details, setDetails] = useState({ name: "", email: "", phone: "" });
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDetails((d) => ({
        name: d.name || profile.name || "",
        email: d.email || profile.email || "",
        phone: d.phone || profile.phone || "",
      }));
    }
  }, [profile]);

  const resetAndClose = () => {
    closeCart();
    setTimeout(() => {
      setStep("cart");
      setOrderId(null);
    }, 300);
  };

  const goToCheckout = () => {
    track("checkout_start", { value: subtotal, props: { signedIn: !!firebaseUser } });
    if (!firebaseUser) {
      closeCart();
      navigate("/login", { state: { from: "/" } });
      return;
    }
    setStep("details");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("placing");
    setOrderError(null);
    try {
      const order = (await placeOrder({
        customer: details,
        items: lines.map((l) => ({
          productId: l.product.id,
          variantId: l.variant?.id,
          quantity: l.qty,
        })),
      })) as { id: string };
      setOrderId(order.id);
      setStep("done");
      clearCart();
    } catch {
      setOrderError("Couldn't place your order — please try again.");
      setStep("details");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAndClose}
            className="fixed inset-0 bg-espresso/50 backdrop-blur-sm z-[90]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-cream z-[95] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-espresso/10">
              <h2 className="font-display text-xl text-espresso">
                {step === "done" ? "Order Placed" : step === "details" ? "Checkout" : "Your Bag"}
              </h2>
              <button onClick={resetAndClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-espresso/5">
                <X size={20} />
              </button>
            </div>

            {step === "done" ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
                <div className="w-14 h-14 rounded-full bg-cola-red/10 flex items-center justify-center text-cola-red font-display text-2xl">
                  ✓
                </div>
                <h3 className="font-display text-xl text-espresso">Thank you, {details.name.split(" ")[0]}!</h3>
                <p className="text-espresso/60 text-sm max-w-xs">
                  Your order <span className="text-espresso font-medium">#{orderId?.slice(0, 8)}</span> is
                  in. We'll email {details.email} with tracking once it ships.
                </p>
                <button
                  onClick={resetAndClose}
                  className="mt-2 text-sm font-semibold text-cola-red hover:underline"
                >
                  Continue shopping
                </button>
              </div>
            ) : lines.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-espresso/50 px-6 text-center">
                <ShoppingBag size={36} strokeWidth={1.2} />
                <p>Your bag is empty. Time to start a collection.</p>
                <Link
                  to="/shop"
                  onClick={closeCart}
                  className="mt-2 text-sm font-semibold text-cola-red hover:underline"
                >
                  Shop charms
                </Link>
              </div>
            ) : step === "details" || step === "placing" ? (
              <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col px-6 py-5 gap-4">
                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className="text-xs text-espresso/50 hover:text-cola-red self-start"
                >
                  ← Back to bag
                </button>
                <input
                  required
                  placeholder="Full name"
                  value={details.name}
                  onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                  className="border border-espresso/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cola-red bg-cream"
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  value={details.email}
                  onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
                  className="border border-espresso/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cola-red bg-cream"
                />
                <input
                  placeholder="Phone (optional)"
                  value={details.phone}
                  onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
                  className="border border-espresso/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cola-red bg-cream"
                />

                {orderError && <p className="text-cola-red text-xs">{orderError}</p>}

                <div className="mt-auto pt-4 border-t border-espresso/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-espresso/60">Subtotal</span>
                    <span className="font-display text-lg text-espresso">₹{subtotal}</span>
                  </div>
                  <button
                    disabled={step === "placing"}
                    className="w-full py-3.5 rounded-full bg-cola-red text-cream font-semibold tracking-wide hover:bg-cola-red-dark transition-colors disabled:opacity-60"
                  >
                    {step === "placing" ? "Placing order…" : "Place Order"}
                  </button>
                  <p className="text-center text-[11px] text-espresso/40 mt-3">
                    No payment collected here — we'll follow up by email to confirm delivery details.
                  </p>
                </div>
              </form>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                  {lines.map((line) => {
                    const image =
                      (line.variant && imageFor(line.variant, line.product.imageUrl)) ??
                      (line.product.imageUrl ? { url: line.product.imageUrl, crop: null } : null);
                    return (
                    <motion.div
                      key={line.key}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex gap-4"
                    >
                      <div className="shrink-0 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center">
                        {image ? (
                          <ProductImage url={image.url} crop={image.crop} alt={line.product.name} />
                        ) : (
                          <CharmIcon icon={line.product.icon} gradient={line.product.gradient} size={64} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-sm text-espresso leading-snug">{line.product.name}</p>
                            {line.variant && (
                              <p className="text-xs text-espresso/60 mt-0.5">{line.variant.label}</p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(line.key)}
                            className="text-espresso/40 hover:text-cola-red text-xs"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-xs text-espresso/50 mt-0.5">₹{variantPrice(line.product, line.variant)}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => setQty(line.key, line.qty - 1)}
                            className="w-6 h-6 rounded-full border border-espresso/20 flex items-center justify-center hover:border-cola-red hover:text-cola-red"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm w-4 text-center">{line.qty}</span>
                          <button
                            onClick={() => setQty(line.key, line.qty + 1)}
                            className="w-6 h-6 rounded-full border border-espresso/20 flex items-center justify-center hover:border-cola-red hover:text-cola-red"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
                </div>

                <div className="px-6 py-5 border-t border-espresso/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-espresso/60">Subtotal</span>
                    <span className="font-display text-lg text-espresso">₹{subtotal}</span>
                  </div>
                  <button
                    onClick={goToCheckout}
                    className="w-full py-3.5 rounded-full bg-cola-red text-cream font-semibold tracking-wide hover:bg-cola-red-dark transition-colors"
                  >
                    Checkout
                  </button>
                  <p className="text-center text-[11px] text-espresso/40 mt-3">
                    Shipping &amp; taxes calculated at checkout
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
