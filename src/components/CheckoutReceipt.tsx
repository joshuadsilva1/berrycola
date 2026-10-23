import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  UserCheck,
} from "lucide-react";
import logo from "../assets/berrycola-logo.jpg";
import receiptPrintWav from "../assets/receipt-print.wav";
import { useCart } from "../context/CartContext";
import { useAuth, isProfileComplete } from "../context/AuthContext";
import { variantPrice } from "../data/products";
import { placeOrder, type Order } from "../lib/api";

const BARCODE_PATTERN = [
  3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2,
  3, 1, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2,
];

const TOP_PEEK_BARCODE = [
  2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 1, 3, 1,
  2, 2, 1, 3, 1, 1, 2, 3, 1, 2,
];

interface ReceiptItemSnapshot {
  key: string;
  productId: string;
  variantId?: string | null;
  name: string;
  variantLabel?: string;
  qty: number;
  unitPrice: number;
  imageUrl?: string;
}

const LAST_RECEIPT_STORAGE_KEY = "bc-last-printed-receipt";

export default function CheckoutReceipt() {
  const cart = useCart();
  const { firebaseUser, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [muted, setMuted] = useState(false);
  const [printKey, setPrintKey] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [customerNote, setCustomerNote] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [completedOrder, setCompletedOrder] = useState<Order | null>(() => {
    try {
      const saved = sessionStorage.getItem(LAST_RECEIPT_STORAGE_KEY);
      if (saved && cart.lines.length === 0) {
        return JSON.parse(saved).order ?? null;
      }
    } catch {}
    return null;
  });

  const [printedItemsSnapshot, setPrintedItemsSnapshot] = useState<
    ReceiptItemSnapshot[] | null
  >(() => {
    try {
      const saved = sessionStorage.getItem(LAST_RECEIPT_STORAGE_KEY);
      if (saved && cart.lines.length === 0) {
        return JSON.parse(saved).items ?? null;
      }
    } catch {}
    return null;
  });

  const printAudioRef = useRef<HTMLAudioElement | null>(null);
  const printSoundTimerRef = useRef<number | null>(null);

  // Build current receipt items from either completed order snapshot or live cart
  const liveItems: ReceiptItemSnapshot[] = cart.lines.map((line) => ({
    key: line.key,
    productId: line.product.id,
    variantId: line.variant?.id ?? null,
    name: line.product.name,
    variantLabel: line.variant?.label,
    qty: line.qty,
    unitPrice: variantPrice(line.product, line.variant),
    imageUrl: line.variant?.imageUrl || line.product.imageUrl,
  }));

  const displayItems = printedItemsSnapshot ?? liveItems;

  const rawSubtotal = displayItems.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0
  );
  const discountAmount = completedOrder?.discountTotal ?? completedOrder?.discountAmount ?? 0;
  const finalTotal = completedOrder?.total ?? Math.max(0, rawSubtotal - discountAmount);

  const heroImage =
    displayItems.find((item) => item.imageUrl)?.imageUrl || logo;

  const playReceiptPrintSound = () => {
    if (muted) return;
    try {
      if (!printAudioRef.current) {
        printAudioRef.current = new Audio(receiptPrintWav);
      }
      const audio = printAudioRef.current;
      audio.volume = 0.85;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {
      // Ignore playback errors
    }
  };

  const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

  const triggerReprint = () => {
    setIsPrinting(true);
    setPrintKey((k) => k + 1);
    playReceiptPrintSound();
    if (printSoundTimerRef.current) {
      window.clearTimeout(printSoundTimerRef.current);
    }
    printSoundTimerRef.current = window.setTimeout(() => {
      setIsPrinting(false);
    }, 2350);
  };

  // Orders are created only after the customer explicitly starts checkout.
  useEffect(() => {
    if (displayItems.length > 0 && printKey === 0) {
      triggerReprint();
    }

    return () => {
      if (printAudioRef.current) {
        printAudioRef.current.pause();
      }
      if (printSoundTimerRef.current) {
        window.clearTimeout(printSoundTimerRef.current);
      }
    };
  }, []);

  const handleProceedToPayment = async () => {
    if (!firebaseUser || !profile || !liveItems.length || isPlacingOrder || completedOrder) return;
    setIsPlacingOrder(true);
    setOrderError(null);
    
    const snapshot = [...liveItems];
    setPrintedItemsSnapshot(snapshot);

    try {
      // 1. Load Razorpay SDK first
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error("Razorpay failed to load. Please check your internet connection.");
      }

      // 2. Create the order in your database (Status will be pending/unpaid initially)
      const order = await placeOrder({
        customer: {
          name: profile.name || firebaseUser.displayName || "Collector",
          email: profile.email || firebaseUser.email || "",
          phone: profile.phone || firebaseUser.phoneNumber || undefined,
          address: profile.address || undefined,
          city: profile.city || undefined,
          state: profile.state || undefined,
          pincode: profile.pincode || undefined,
        },
        items: snapshot.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? undefined,
          quantity: item.qty,
        })),
        customerNote: customerNote.trim() || undefined,
      });

      // 3. Define backend API base URL
      const API_BASE = import.meta.env.DEV ? "http://127.0.0.1:5001/api" : "/api";

      // 4. Request a Razorpay Order ID from your backend
      const rzpOrderResponse = await fetch(`${API_BASE}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: finalTotal, 
          receipt: order.id // Pass your DB order ID to link them
        }), 
      });
      const rzpOrderData = await rzpOrderResponse.json();

      if (rzpOrderData.error) {
        throw new Error("Failed to initialize payment gateway.");
      }

      // 5. Open the Razorpay Payment Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Your public Razorpay Key ID
        amount: rzpOrderData.amount,
        currency: rzpOrderData.currency,
        name: "BerryCola",
        description: "BerryCola Order",
        order_id: rzpOrderData.id,
        handler: async function (response: any) {
          try {
            // 6. Payment successful on frontend! Verify signature with backend
            const verifyRes = await fetch(`${API_BASE}/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.status === "success") {
              // 7. VERIFIED! Now we show the receipt and clear the cart
              setCompletedOrder(order);
              cart.clearCart();
              try {
                sessionStorage.setItem(LAST_RECEIPT_STORAGE_KEY, JSON.stringify({ order, items: snapshot }));
              } catch {}
              triggerReprint();
            } else {
              setOrderError("Payment verification failed! Please contact support.");
            }
          } catch (err) {
            setOrderError("Error verifying payment.");
          }
        },
        prefill: {
          name: profile.name || firebaseUser.displayName || "",
          email: profile.email || firebaseUser.email || "",
          contact: profile.phone || firebaseUser.phoneNumber || "",
        },
        theme: {
          color: "#d51f1f", // BerryCola Red
        },
      };

      const rzp = new (window as any).Razorpay(options);
      
      // Handle if user closes the modal or payment fails
      rzp.on("payment.failed", function (response: any) {
        setOrderError(`Payment failed: ${response.error.description}`);
      });
      
      rzp.open();

    } catch (err: any) {
      setPrintedItemsSnapshot(null);
      setOrderError(err?.message || "Couldn't prepare your order.");
    } finally {
      // Re-enable the button so they can try again if they closed the popup
      setIsPlacingOrder(false); 
    }
  };

  // Redirect unauthenticated users to login first
  if (!authLoading && !firebaseUser) {
    return <Navigate to="/login" state={{ from: "/checkout" }} replace />;
  }

  // Redirect users who haven't completed their profile yet to /account first
  if (!authLoading && profile && !isProfileComplete(profile)) {
    return <Navigate to="/account" state={{ from: "/checkout" }} replace />;
  }

  // Format date & time like reference receipt: 2026.10.19 04:42 (IST)
  const nowDate = completedOrder?.createdAt
    ? new Date(completedOrder.createdAt)
    : new Date();
  const formattedDateDots = `${nowDate.getFullYear()}.${String(
    nowDate.getMonth() + 1
  ).padStart(2, "0")}.${String(nowDate.getDate()).padStart(2, "0")}`;
  const formattedTime = nowDate.toLocaleTimeString("en-IN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const receiptOrderId = completedOrder?.id
    ? completedOrder.id.slice(0, 8).toUpperCase()
    : "PRINTING";

  const customerDisplayName =
    profile?.name || firebaseUser?.displayName || "BERRYCOLA COLLECTOR";
  const customerAddressLine = [profile?.address, profile?.city, profile?.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="relative min-h-screen bg-[#efeeea] text-[#141414] pt-24 pb-24 overflow-x-hidden select-none">
      {/* Condensed & Monospace Receipt Fonts */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Oswald:wght@700&display=swap');
          .font-receipt-mono { font-family: 'Courier Prime', 'Courier New', monospace; }
          .font-receipt-condensed { font-family: 'Oswald', 'Impact', 'Arial Narrow', sans-serif; }
        `}
      </style>

      <audio ref={printAudioRef} src={receiptPrintWav} preload="auto" />

      {/* KIOSK METAL PANEL TEXTURE & VERTICAL SEAMS (Matches reference kiosk booth) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1px, transparent 1px, transparent 4px)",
        }}
      />

      {/* Left vertical kiosk seam */}
      <div className="pointer-events-none fixed top-0 bottom-0 left-4 sm:left-12 md:left-[16%] w-[2px] bg-gradient-to-r from-black/20 via-black/5 to-white/80 z-10" />

      {/* Right vertical kiosk seam */}
      <div className="pointer-events-none fixed top-0 bottom-0 right-4 sm:right-12 md:right-[16%] w-[2px] bg-gradient-to-r from-black/20 via-black/5 to-white/80 z-10" />

      {/* Bottom Horizontal Kiosk Panel Seam & Dual Metal Latches (Matches reference image bottom) */}
      <div className="pointer-events-none absolute bottom-16 inset-x-0 h-[3px] bg-gradient-to-b from-black/25 via-black/10 to-white/80 z-0">
        <div className="absolute top-3 left-6 sm:left-16 md:left-[18%] w-12 h-5 rounded-full bg-gradient-to-b from-[#9e9e9e] via-[#707070] to-[#4a4a4a] border border-[#3d3d3d] shadow-[0_2px_4px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.6)]" />
        <div className="absolute top-3 right-6 sm:right-16 md:right-[18%] w-12 h-5 rounded-full bg-gradient-to-b from-[#9e9e9e] via-[#707070] to-[#4a4a4a] border border-[#3d3d3d] shadow-[0_2px_4px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.6)]" />
      </div>

      {/* Top Floating Tactile Keycap Controls */}
      <div className="relative z-30 max-w-2xl mx-auto px-4 mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/shop")}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 text-xs font-extrabold uppercase  text-espresso hover:text-cola-red transition-all cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back to Shop
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/account")}
            title="View Collector Profile"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 text-xs font-extrabold uppercase  text-espresso hover:text-cola-red transition-all cursor-pointer"
          >
            <UserCheck size={14} />
            Profile
          </button>

          <button
            onClick={triggerReprint}
            title="Re-print receipt with sound"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 text-xs font-extrabold uppercase  text-espresso hover:text-cola-red transition-all cursor-pointer"
          >
            <RotateCcw size={14} className={isPrinting ? "animate-spin" : ""} />
            Re-Print
          </button>

          <button
            onClick={() => {
              setMuted((m) => {
                const next = !m;
                if (next && printAudioRef.current) {
                  printAudioRef.current.pause();
                }
                return next;
              });
            }}
            title={muted ? "Unmute printer sound" : "Mute printer sound"}
            aria-label={muted ? "Unmute printer sound" : "Mute printer sound"}
            className="w-9 h-9 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all cursor-pointer"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>

      {orderError && (
        <div className="relative z-30 max-w-md mx-auto mb-4 px-4">
          <p className="bg-cola-red/10 border-2 border-cola-red text-cola-red text-xs font-bold px-4 py-2.5 rounded-xl text-center">
            {orderError}
          </p>
        </div>
      )}

      <section className="relative z-30 max-w-md mx-auto mb-8 px-4">
        <div className="rounded-2xl bg-[#fbf5e9] border-2 border-[#1e1a18] p-5 shadow-[0_4px_0_#1e1a18]">
          <h1 className="font-display text-xl text-espresso">Your order</h1>
          <label htmlFor="customer-order-note" className="block mt-4 mb-1.5 text-xs font-semibold uppercase tracking-wide text-espresso/75">
            Note for the BerryCola team <span className="normal-case font-normal">(optional)</span>
          </label>
          <textarea
            id="customer-order-note"
            value={customerNote}
            onChange={(event) => setCustomerNote(event.target.value)}
            maxLength={2000}
            rows={3}
            disabled={Boolean(completedOrder)}
            placeholder="Gift message, customization request, delivery instructions…"
            className="w-full resize-y rounded-xl border-2 border-[#1e1a18]/25 bg-white px-3 py-2.5 text-sm text-espresso outline-none focus:border-cola-red disabled:opacity-60"
          />
          {completedOrder ? (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-300 p-3 text-sm text-amber-950">
              Order #{completedOrder.id.slice(0, 8).toUpperCase()} is prepared. Razorpay checkout can be connected here once the Razorpay key and server payment-order endpoint are configured.
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={!liveItems.length || isPlacingOrder}
                className="mt-4 w-full rounded-full bg-cola-red px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? "Preparing order…" : "Continue to payment"}
              </button>
              <p className="mt-2 text-center text-[11px] text-espresso/60">
                Your order is checked against live prices and stock before payment.
              </p>
            </>
          )}
        </div>
      </section>

      {/* =====================================================================
          1. KIOSK FLUORESCENT LIGHTBOX SIGN & CHROME DISPENSER SLOT
         ===================================================================== */}
      <div className="relative flex flex-col items-center px-4">
        {/* Outer Chrome Bezel of Backlit Sign (Matches reference lightbox) */}
        <div
          onClick={triggerReprint}
          title="Click to re-print receipt"
          className="relative z-20 w-full max-w-[410px] rounded-[3px] p-[7px] bg-gradient-to-b from-[#e4e4e4] via-[#ffffff] to-[#b5b5b5] border border-[#9e9e9e] shadow-[0_14px_28px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.12)] cursor-pointer"
        >
          {/* Second Inner Metallic Step Bezel */}
          <div className="p-[5px] bg-gradient-to-b from-[#bdbdbd] via-[#e8e8e8] to-[#9a9a9a] border border-[#8a8a8a] shadow-inner">
            {/* Frosted Backlit Acrylic Panel with Dual Fluorescent Tubes */}
            <div className="relative h-[126px] bg-gradient-to-b from-[#e9eef2] via-[#f7fafe] to-[#e5eaee] border border-[#b0b5b9] shadow-[inset_0_2px_10px_rgba(0,0,0,0.12)] flex items-center justify-center overflow-hidden">
              {/* Top glowing fluorescent tube */}
              <div className="absolute top-[24px] left-3 right-3 h-[16px] rounded-full bg-white shadow-[0_0_22px_10px_rgba(255,255,255,0.98),0_0_40px_16px_rgba(220,238,255,0.85)] blur-[1px]" />
              {/* Bottom glowing fluorescent tube */}
              <div className="absolute bottom-[24px] left-3 right-3 h-[16px] rounded-full bg-white shadow-[0_0_22px_10px_rgba(255,255,255,0.98),0_0_40px_16px_rgba(220,238,255,0.85)] blur-[1px]" />

              {/* Subtle acrylic horizontal diffusion sheen */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/[0.04] via-transparent to-black/[0.04] pointer-events-none" />

              {/* Original BerryCola Logo + Brand Font (Luckiest Guy / font-display) */}
              <div className="relative z-10 flex items-center gap-3.5 px-4">
                <img
                  src={logo}
                  alt="BerryCola"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-md border-2 border-[#1e1a18] shrink-0"
                />
                <span className="font-display text-3xl sm:text-4xl tracking-wide text-espresso drop-shadow-[0_2px_8px_rgba(255,255,255,0.95)] pt-1">
                  BerryCola
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            2. CHROME DISPENSER SLOT + THERMAL RECEIPT EMERGING FROM INSIDE SLIT
           ===================================================================== */}
        <div className="relative mt-6 w-full max-w-[380px] flex flex-col items-center">
          {/* Upper Chrome Lip & Recessed Dark Cavity (Behind paper exit lip) */}
          <div className="relative z-10 w-full h-[42px] rounded-[3px] p-[4px] bg-gradient-to-b from-[#ededed] via-[#cccccc] to-[#8a8a8a] border border-[#767676] shadow-[0_8px_18px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.95)]">
            {/* Inner recessed steel cavity */}
            <div className="w-full h-full bg-gradient-to-b from-[#1a1a1a] via-[#2b2b2b] to-[#bcbcbc] rounded-[2px] px-2 flex flex-col justify-between shadow-[inset_0_5px_10px_rgba(0,0,0,0.9)]">
              {/* Top dark thermal exit slit */}
              <div className="w-full h-[14px] bg-[#0e0e0e] rounded-t-[1px] border-b border-white/10" />
              {/* Lower chrome roller bar (paper curves OVER this bar!) */}
              <div className="w-full h-[10px] bg-gradient-to-b from-[#ffffff] via-[#d4d4d4] to-[#7a7a7a] border-t border-white rounded-b-[1px] flex items-center justify-between px-1">
                <div className="w-2.5 h-3 bg-gradient-to-b from-[#e0e0e0] to-[#555] border border-[#333] -mt-2" />
                <div className="w-2.5 h-3 bg-gradient-to-b from-[#e0e0e0] to-[#555] border border-[#333] -mt-2" />
              </div>
            </div>
          </div>

          {/* Upper Chrome Overhang Lip (z-30 so the paper emerges from UNDER this top metal lip!) */}
          <div className="pointer-events-none absolute top-0 inset-x-0 h-[15px] z-30 rounded-t-[3px] p-[4px] pb-0 bg-gradient-to-b from-[#f0f0f0] to-[#c8c8c8] border-t border-x border-[#767676]">
            <div className="w-full h-full bg-gradient-to-b from-[#111111] to-[#262626] shadow-[0_3px_6px_rgba(0,0,0,0.65)]" />
          </div>

          {/* RECEIPT PAPER FEED CHUTE (Clipped strictly at the upper slit line y=15px, z-20 so it curves OVER the lower chrome roller bar) */}
          <div className="relative z-20 w-full flex justify-center -mt-[27px] overflow-hidden pt-[2px] pb-16 px-3">
            <div className="w-full max-w-[308px] overflow-hidden pb-12 px-3 -mx-3">
              <motion.div
                key={printKey}
                initial={{ y: "-102%", x: 0 }}
                animate={{
                  y: [
                    "-102%",
                    "-84%",
                    "-82%",
                    "-62%",
                    "-60%",
                    "-38%",
                    "-36%",
                    "-14%",
                    "-12%",
                    "0%",
                  ],
                  x: [0, -0.6, 0.5, -0.5, 0.4, -0.5, 0.4, -0.3, 0.2, 0],
                }}
                transition={{
                  duration: 2.25,
                  times: [0, 0.14, 0.19, 0.36, 0.41, 0.6, 0.65, 0.82, 0.87, 1],
                  ease: "linear",
                }}
                style={{
                  background:
                    "linear-gradient(180deg, #bdbcb8 0px, #dfdeda 7px, #ffffff 19px, #faf9f5 36px, #faf9f5 100%)",
                }}
                className="relative w-full text-[#141414] shadow-[0_22px_42px_rgba(0,0,0,0.24),0_4px_12px_rgba(0,0,0,0.12)] border-x border-black/10 pb-8 pt-2.5 flex flex-col items-center"
              >
                {/* Top Cylindrical Slot Shadow (Simulates paper curving out of the dark slot over the roller) */}
                <div
                  className="pointer-events-none absolute top-0 inset-x-0 h-7 z-20"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.16) 35%, rgba(255,255,255,0.65) 72%, transparent 100%)",
                  }}
                />

                {/* Subtle thermal paper grain overlay */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-multiply"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  }}
                />

                {/* Top Peek Barcode (Just underneath the metal dispenser lip, matching reference photo) */}
                <div className="w-full px-6 flex flex-col items-center mb-3 opacity-85 relative z-10">
                  <div className="flex h-3.5 w-full justify-between items-stretch gap-[1.5px] overflow-hidden">
                    {TOP_PEEK_BARCODE.map((w, i) => (
                      <div
                        key={i}
                        className={i % 2 === 0 ? "bg-[#181818]" : "bg-transparent"}
                        style={{ flexGrow: w }}
                      />
                    ))}
                  </div>
                </div>

                {/* GIANT CONDENSED HEADLINE */}
                <div className="px-5 text-center flex flex-col items-center mt-1 relative z-10">
                  <h2 className="font-receipt-condensed font-bold text-[44px] leading-[0.88] tracking-[-0.02em] text-[#121212] uppercase scale-y-110">
                    BERRY
                    <br />
                    GOOD!
                  </h2>
                  <p className="font-sans font-extrabold text-[11px] tracking-[0.06em] mt-2.5 uppercase text-[#161616]">
                    Have a BerryCola day!
                  </p>
                </div>

                {/* Double-bar Divider */}
                <div className="w-full px-4 text-center font-receipt-mono text-[10px] text-[#333] tracking-[0.08em] my-2.5 overflow-hidden whitespace-nowrap">
                  ====================================
                </div>

                {/* Order & Customer Metadata */}
                <div className="px-5 w-full font-receipt-mono text-[10.5px] leading-[1.45] text-[#181818]">
                  <p className="text-center uppercase font-bold ">
                    {customerDisplayName} · [ORDER #{receiptOrderId}]
                  </p>
                  <p className="text-center uppercase text-[10px] text-[#333]">
                    {formattedDateDots} {formattedTime} (IST)
                  </p>
                  {customerAddressLine && (
                    <p className="text-center uppercase text-[9.5px] text-[#444] mt-0.5 truncate">
                      SHIP TO: {customerAddressLine}
                    </p>
                  )}

                  <div className="w-full text-center text-[#444] tracking-[0.08em] overflow-hidden whitespace-nowrap my-2">
                    ------------------------------------
                  </div>

                  {/* Line Items */}
                  {displayItems.length === 0 ? (
                    <div className="py-3 text-center text-[#555]">
                      <p className="uppercase font-bold">NO ITEMS IN BAG YET</p>
                      <p className="text-[9.5px] mt-0.5">
                        Add charms from the shop to print your order
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-0.5">
                      {displayItems.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-baseline justify-between gap-2 text-[10.5px]"
                        >
                          <span className="uppercase font-bold truncate max-w-[155px]">
                            {item.name}
                            {item.variantLabel ? ` (${item.variantLabel})` : ""}
                          </span>
                          <div className="flex items-baseline gap-2.5 shrink-0">
                            <span className="uppercase">X {item.qty}</span>
                            <span className="font-bold min-w-[44px] text-right">
                              ₹{(item.unitPrice * item.qty).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="w-full text-center text-[#444] tracking-[0.08em] overflow-hidden whitespace-nowrap my-2">
                    ------------------------------------
                  </div>

                  {/* Totals Block */}
                  <div className="space-y-1 text-[10.5px]">
                    <div className="flex justify-between items-baseline font-bold text-[12px]">
                      <span>TOTAL</span>
                      <span>₹{finalTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* TILTED PRODUCT IMAGE IN THE CENTER OF THE RECEIPT */}
                <div className="w-full flex justify-center items-center my-6 px-6 relative">
                  <div className="relative group">
                    <img
                      src={heroImage}
                      alt="BerryCola Charm"
                      className="h-32 w-28 object-cover rounded-[3px] bg-white p-1.5 border border-black/15 shadow-[0_10px_20px_rgba(0,0,0,0.22)] -rotate-12 transition-transform duration-300 group-hover:-rotate-6"
                    />
                    {displayItems.length > 1 && (
                      <span className="absolute -bottom-2 -right-3 px-2 py-0.5 rounded-full bg-[#181818] text-[#faf9f5] font-receipt-mono text-[9px] font-bold  shadow">
                        +{displayItems.length - 1} MORE
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Dashed Divider */}
                <div className="w-full px-4 text-center font-receipt-mono text-[10px] text-[#444] tracking-[0.08em] mb-2 overflow-hidden whitespace-nowrap">
                  ------------------------------------
                </div>

                {/* Bottom Date Stamp + Tall Barcode + Official Footer */}
                <div className="px-6 w-full flex flex-col items-center">
                  <p className="font-receipt-mono text-[9.5px] tracking-[0.14em] text-center text-[#222] mb-2.5">
                    ######## {formattedDateDots} ########
                  </p>

                  {/* High-contrast vertical barcode */}
                  <div className="flex h-12 w-full justify-between items-stretch gap-[1.5px] px-1 mb-2">
                    {BARCODE_PATTERN.map((width, i) => (
                      <div
                        key={i}
                        className={i % 2 === 0 ? "bg-[#141414]" : "bg-transparent"}
                        style={{ flexGrow: width }}
                      />
                    ))}
                  </div>

                  <p className="font-receipt-mono text-[9.5px] text-center text-[#333] ">
                    {completedOrder
                      ? `'Thank You' Order #${completedOrder.id.slice(0, 8).toUpperCase()}`
                      : `'BerryCola' Official Receipt`}
                  </p>
                </div>

                {/* Serrated Thermal Tear-Off Teeth at Bottom Edge */}
                <div
                  className="pointer-events-none absolute -bottom-[7px] inset-x-0 h-[8px]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 5px 8px, transparent 5px, #faf9f5 5.5px)",
                    backgroundSize: "10px 8px",
                  }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
