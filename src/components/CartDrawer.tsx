import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Minus, Trash2, Volume2, VolumeX, Printer, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth, isProfileComplete } from "../context/AuthContext";
import { variantPrice } from "../data/products";

const PAPER_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.06'/%3E%3C/svg%3E")`;

// Mechanical typewriter audio files
const KEY_SOUND_MP3 = "https://actions.google.com/sounds/v1/office/typewriter_key.ogg";
const BELL_SOUND_MP3 = "https://actions.google.com/sounds/v1/office/typewriter_bell.ogg";
const FEED_SOUND_MP3 = "https://actions.google.com/sounds/v1/office/typewriter_mechanical_2.ogg";

// X-coordinates for the 4 staggered rows of cream keys in the SVG illustration
const KEY_ROW_1 = [106, 140, 174, 208, 242, 276, 310, 344, 378, 412, 446, 480];
const KEY_ROW_2 = [118, 152, 186, 220, 254, 288, 322, 356, 390, 424, 458, 490];
const KEY_ROW_3 = [98, 134, 170, 206, 242, 278, 314, 350, 386, 422, 458, 492];
const KEY_ROW_4 = [96, 134, 172, 210, 248, 286, 324, 362, 400, 438, 474];

export default function CartDrawer() {
  const cart = useCart() as any;
  const { firebaseUser, profile } = useAuth();
  const navigate = useNavigate();
  const [muted, setMuted] = useState(false);
  const [typedSubtitle, setTypedSubtitle] = useState("");
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const fullSubtitle = "old memory of new charms ....";

  // Flexible bindings to support CartContext structure (lines)
  const isOpen: boolean = cart.isOpen ?? cart.isCartOpen ?? cart.open ?? false;
  const closeCart: () => void = cart.closeCart ?? cart.onClose ?? (() => cart.setIsOpen?.(false));
  const rawItems: any[] = cart.lines ?? cart.items ?? cart.cartItems ?? [];

  const audioCtxRef = useRef<AudioContext | null>(null);
  const keyAudioRef = useRef<HTMLAudioElement | null>(null);
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    keyAudioRef.current = new Audio(KEY_SOUND_MP3);
    keyAudioRef.current.volume = 0.55;
    bellAudioRef.current = new Audio(BELL_SOUND_MP3);
    bellAudioRef.current.volume = 0.65;
  }, []);

  const getAudioContext = () => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Plays crisp mechanical typewriter strike (MP3 + WebAudio mechanical transient)
  const playTypewriterKey = (keyId?: string) => {
    if (keyId) {
      setPressedKey(keyId);
      setTimeout(() => setPressedKey(null), 120);
    }
    if (muted) return;

    if (keyAudioRef.current) {
      const clone = keyAudioRef.current.cloneNode() as HTMLAudioElement;
      clone.volume = 0.45;
      clone.playbackRate = 0.92 + Math.random() * 0.18;
      clone.play().catch(() => {});
    }

    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const bufferSize = Math.floor(ctx.sampleRate * 0.035);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.006));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1700 + Math.random() * 400, now);
      filter.Q.setValueAtTime(2.2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {}
  };

  // Plays vintage typewriter carriage return "Ding!" bell
  const playCarriageBell = () => {
    if (muted) return;

    if (bellAudioRef.current) {
      const clone = bellAudioRef.current.cloneNode() as HTMLAudioElement;
      clone.volume = 0.5;
      clone.play().catch(() => {});
    }

    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(2150, now);
      osc2.frequency.setValueAtTime(4300, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.65);
      osc2.stop(now + 0.65);
    } catch {}
  };

  useEffect(() => {
    if (!isOpen) {
      setTypedSubtitle("");
      return;
    }

    if (!muted) {
      const feedAudio = new Audio(FEED_SOUND_MP3);
      feedAudio.volume = 0.35;
      feedAudio.play().catch(() => {});
    }

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedSubtitle(fullSubtitle.slice(0, i));
      if (i % 2 === 0) playTypewriterKey();
      if (i >= fullSubtitle.length) {
        clearInterval(interval);
        playCarriageBell();
      }
    }, 55);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleQtyChange = (item: any, delta: number) => {
    playTypewriterKey();
    const key = item.key ?? item.product?.id ?? item.id;
    const currentQty = item.qty ?? item.quantity ?? 1;
    const nextQty = currentQty + delta;

    if (nextQty <= 0) {
      handleRemove(item);
      return;
    }

    if (cart.setQty) cart.setQty(key, nextQty);
    else if (cart.updateQuantity) cart.updateQuantity(key, nextQty);
    else if (cart.updateQty) cart.updateQty(key, nextQty);
    else if (delta > 0 && cart.addItem) cart.addItem(item.product ?? item, item.variant ?? null, 1);
  };

  const handleRemove = (item: any) => {
    playCarriageBell();
    const key = item.key ?? item.product?.id ?? item.id;
    if (cart.removeItem) cart.removeItem(key);
    else if (cart.removeFromCart) cart.removeFromCart(key);
  };

  const handleCheckout = () => {
    if (rawItems.length === 0) {
      playTypewriterKey("space");
      closeCart();
      navigate("/shop");
      return;
    }
    playCarriageBell();
    closeCart();
    if (!firebaseUser) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    if (!isProfileComplete(profile)) {
      navigate("/account", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  const subtotal =
    cart.subtotal ??
    cart.total ??
    rawItems.reduce((sum: number, item: any) => {
      const product = item.product ?? item;
      const price = product ? variantPrice(product, item.variant) : (item.price ?? 0);
      const qty = item.qty ?? item.quantity ?? 1;
      return sum + price * qty;
    }, 0);

  // Helper to render each 3D cream illustrated keycap with black line art
  const renderKeycap = (x: number, y: number, w = 24, id = `${x}-${y}`) => {
    const isPressed = pressedKey === id;
    const dy = isPressed ? 2 : 0;
    return (
      <g
        key={id}
        onClick={() => playTypewriterKey(id)}
        className="cursor-pointer"
        transform={`translate(0, ${dy})`}
      >
        {/* Bottom 3D cream key cylinder */}
        <rect
          x={x}
          y={y + 4}
          width={w}
          height={10}
          rx={4}
          fill="#dfd3be"
          stroke="#1e1a18"
          strokeWidth="2"
        />
        {/* Top cream keycap face */}
        <rect
          x={x}
          y={y}
          width={w}
          height={9}
          rx={4}
          fill="#fbf5e9"
          stroke="#1e1a18"
          strokeWidth="2"
        />
      </g>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
              .font-typewriter { font-family: 'Courier Prime', 'Courier New', monospace; }
            `}
          </style>

          {/* Soft Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playTypewriterKey();
              closeCart();
            }}
            className="fixed inset-0 bg-espresso/45 backdrop-blur-sm z-50 cursor-pointer"
          />

          {/* Slide-Up Illustrated Typewriter & Paper Container */}
          <motion.aside
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[520px] z-50 flex flex-col justify-end pointer-events-none overflow-hidden"
          >
            {/* Top Floating Controls (Mute & Close) */}
            <div className="absolute top-4 right-5 z-50 flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setMuted((m) => !m)}
                title={muted ? "Unmute typewriter" : "Mute typewriter"}
                className="w-9 h-9 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all"
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button
                onClick={() => {
                  playTypewriterKey();
                  closeCart();
                }}
                aria-label="Close bag"
                className="w-9 h-9 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1. THE PAPER SHEET (Sticking up out of the illustrated typewriter) */}
            <motion.div
              initial={{ y: 240 }}
              animate={{ y: 0 }}
              exit={{ y: 240 }}
              transition={{ type: "spring", damping: 24, stiffness: 160, delay: 0.06 }}
              className="relative mx-auto w-[68%] sm:w-[325px] h-[64vh] -mb-10 bg-[#fcf9f2] border-2 border-[#1e1a18] shadow-[0_-6px_25px_rgba(0,0,0,0.15)] flex flex-col justify-between px-5 sm:px-6 pt-5 pb-14 z-20 pointer-events-auto overflow-hidden"
            >
              {/* Paper Grain Texture */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-65"
                style={{ backgroundImage: PAPER_TEXTURE }}
              />

              {/* TOP TYPED HEADER */}
              <div className="relative z-10">
                <div className="flex justify-between items-baseline font-typewriter text-[11px] tracking-tight text-espresso pb-1.5 border-b border-espresso/70">
                  <span>berrycola.2026</span>
                  <span>charm manifest</span>
                </div>
              </div>

              {/* MIDDLE SCROLLABLE RECEIPT / BAG ITEMS */}
              <div className="relative z-10 flex-1 overflow-y-auto my-3 pr-1 space-y-3.5 font-typewriter">
                {rawItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8 text-espresso/60">
                    <p className="text-sm font-bold">[ blank sheet ]</p>
                    <p className="text-xs mt-1.5 max-w-[200px] leading-relaxed">
                      Your typewriter spool is empty. Add charms to print your manifest.
                    </p>
                  </div>
                ) : (
                  rawItems.map((item: any, idx: number) => {
                    const product = item.product ?? item;
                    const key = item.key ?? product.id ?? idx;
                    const name = product.name ?? product.title ?? "BerryCola Charm";
                    const variantLabel = item.variant?.label;
                    const price = product ? variantPrice(product, item.variant) : (item.price ?? 0);
                    const qty = item.qty ?? item.quantity ?? 1;
                    const image =
                      item.variant?.imageUrl ??
                      product.imageUrl ??
                      product.image ??
                      product.images?.[0];

                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start justify-between gap-2.5 border-b border-dashed border-espresso/30 pb-2.5 text-espresso"
                      >
                        {image && (
                          <img
                            src={image}
                            alt={name}
                            className="w-10 h-10 object-cover rounded-sm border border-[#1e1a18] bg-white p-0.5 shrink-0"
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline gap-1">
                            <h4 className="text-[12px] font-bold truncate uppercase tracking-tight">
                              {name}
                            </h4>
                            <span className="text-[12px] font-bold shrink-0">
                              ₹{(price * qty).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <p className="text-[10px] text-espresso/65">
                            {variantLabel ? `${variantLabel} · ` : ""}unit: ₹{price.toLocaleString("en-IN")}
                          </p>

                          <div className="flex items-center justify-between mt-1.5">
                            <div className="inline-flex items-center gap-1.5 bg-espresso/5 border border-[#1e1a18]/40 px-1.5 py-0.5 rounded-sm text-[11px]">
                              <button
                                onClick={() => handleQtyChange(item, -1)}
                                className="hover:text-cola-red transition-colors px-0.5"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="font-bold min-w-[14px] text-center">{qty}</span>
                              <button
                                onClick={() => handleQtyChange(item, 1)}
                                className="hover:text-cola-red transition-colors px-0.5"
                                aria-label="Increase quantity"
                              >
                                <Plus size={10} />
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemove(item)}
                              className="text-[10px] uppercase text-espresso/50 hover:text-cola-red flex items-center gap-0.5 transition-colors"
                            >
                              <Trash2 size={10} /> [del]
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* BOTTOM TYPED FOOTER */}
              <div className="relative z-10 font-typewriter text-espresso pt-1">
                {rawItems.length > 0 && (
                  <div className="flex justify-between items-baseline text-xs font-bold mb-1.5">
                    <span>total due:</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="text-[11px] tracking-tight text-espresso/90 pb-1 border-b border-dotted border-espresso/80 flex justify-between">
                  <span>berrycola studio</span>
                  <span>items: {cart.count ?? rawItems.length}</span>
                </div>

                {rawItems.length > 0 ? (
                  <button
                    onClick={handleCheckout}
                    className="mt-2.5 w-full py-2.5 px-3 rounded-lg bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] hover:bg-[#b81d1d] active:translate-y-0.5 transition-all flex items-center justify-between gap-2 font-sans font-extrabold text-xs uppercase cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Printer size={14} className="shrink-0" />
                      Print Receipt & Checkout
                    </span>
                    <span className="inline-flex items-center gap-1 bg-[#1e1a18]/20 px-2 py-0.5 rounded text-[11px]">
                      ₹{subtotal.toLocaleString("en-IN")}
                      <ArrowRight size={13} />
                    </span>
                  </button>
                ) : (
                  <div className="text-[11px] tracking-tight text-espresso/85 mt-1.5 min-h-[16px]">
                    {typedSubtitle}
                    <span className="animate-pulse">_</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* 2. ILLUSTRATED VINTAGE RED TYPEWRITER (Exact match to your vector image, in BerryCola Red) */}
            <div className="relative w-full z-30 pointer-events-auto select-none">
              <svg
                viewBox="0 0 600 320"
                className="w-full h-auto drop-shadow-[0_-8px_20px_rgba(0,0,0,0.22)] overflow-visible"
              >
                {/* --- LEFT CARRIAGE RETURN LEVER & PLATEN KNOB (From reference drawing) --- */}
                <g
                  onClick={playCarriageBell}
                  className="cursor-pointer hover:brightness-110 transition-all"
                >
                  {/* Angled metal return arm */}
                  <path
                    d="M 118 45 L 92 22 L 85 40 L 65 25 L 22 48 L 8 28 L 24 22 L 32 36 L 68 15 L 82 28 L 90 12 L 122 36 Z"
                    fill="#9da3a8"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {/* Left grey platen wheel */}
                  <ellipse
                    cx="78"
                    cy="58"
                    rx="12"
                    ry="22"
                    fill="#8c9298"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                  />
                  <ellipse
                    cx="83"
                    cy="58"
                    rx="8"
                    ry="18"
                    fill="#aeb4ba"
                    stroke="#1e1a18"
                    strokeWidth="2"
                  />
                  {/* Left carriage block */}
                  <rect
                    x="92"
                    y="38"
                    width="28"
                    height="32"
                    rx="3"
                    fill="#9da3a8"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                  />
                </g>

                {/* --- RIGHT CARRIAGE MECHANISM & PLATEN WHEEL --- */}
                <g onClick={() => playTypewriterKey()} className="cursor-pointer">
                  <path
                    d="M 480 40 L 505 40 L 505 16 L 522 16 L 522 35 L 542 42 L 542 68 L 480 68 Z"
                    fill="#9da3a8"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {/* Right grey platen wheel */}
                  <ellipse
                    cx="556"
                    cy="58"
                    rx="12"
                    ry="22"
                    fill="#8c9298"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                  />
                  <ellipse
                    cx="552"
                    cy="58"
                    rx="8"
                    ry="18"
                    fill="#aeb4ba"
                    stroke="#1e1a18"
                    strokeWidth="2"
                  />
                </g>

                {/* --- PAPER BAIL BAR & BLACK RUBBER ROLLERS (Crosses across the bottom of the paper) --- */}
                <g>
                  {/* Red side tabs behind bar */}
                  <rect
                    x="116"
                    y="28"
                    width="18"
                    height="30"
                    fill="#b81d1d"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="466"
                    y="28"
                    width="24"
                    height="30"
                    fill="#b81d1d"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                  />
                  {/* Horizontal silver bail rod */}
                  <rect
                    x="118"
                    y="33"
                    width="370"
                    height="7"
                    fill="#d8dde2"
                    stroke="#1e1a18"
                    strokeWidth="2.2"
                  />
                  {/* Left & Right black rubber rollers on the bar */}
                  <rect
                    x="148"
                    y="29"
                    width="32"
                    height="14"
                    rx="3"
                    fill="#2b2927"
                    stroke="#1e1a18"
                    strokeWidth="2.2"
                  />
                  <rect
                    x="426"
                    y="29"
                    width="32"
                    height="14"
                    rx="3"
                    fill="#2b2927"
                    stroke="#1e1a18"
                    strokeWidth="2.2"
                  />
                </g>

                {/* --- CENTER TYPEBAR & RIBBON GUIDE NOTCH --- */}
                <g>
                  {/* Dark inner platen slot */}
                  <rect
                    x="220"
                    y="52"
                    width="160"
                    height="26"
                    fill="#2b2927"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                  />
                  {/* Silver central type-guide forks */}
                  <path
                    d="M 278 65 L 290 65 L 290 48 L 302 48 L 302 76 L 314 76 L 314 48 L 326 48 L 326 65 L 338 65"
                    fill="none"
                    stroke="#d8dde2"
                    strokeWidth="5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 278 65 L 290 65 L 290 48 L 302 48 L 302 76 L 314 76 L 314 48 L 326 48 L 326 65 L 338 65"
                    fill="none"
                    stroke="#1e1a18"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </g>

                {/* --- MAIN ILLUSTRATED RED TYPEWRITER CHASSIS (Matches reference shape & black outlines) --- */}
                <g>
                  {/* Outer lower chassis body (BerryCola Red) */}
                  <path
                    d="M 92 54 L 228 54 L 228 74 L 372 74 L 372 54 L 508 54 C 534 66, 550 88, 552 115 L 570 272 C 574 298, 558 312, 532 312 L 68 312 C 42 312, 26 298, 30 272 L 48 115 C 50 88, 66 66, 92 54 Z"
                    fill="#d51f1f"
                    stroke="#1e1a18"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />

                  {/* Angled side bevels of the central notch (darker crimson shade) */}
                  <polygon
                    points="228,54 172,74 228,74"
                    fill="#a31515"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  <polygon
                    points="372,54 428,74 372,74"
                    fill="#a31515"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  {/* Top Hood Panel (Slightly lighter warm red for two-tone illustrated depth) */}
                  <path
                    d="M 92 54 L 228 54 L 172 74 L 428 74 L 372 54 L 508 54 C 524 68, 530 88, 526 112 L 74 112 C 70 88, 76 68, 92 54 Z"
                    fill="#e23c3c"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  {/* Front Hood Faceplate */}
                  <polygon
                    points="74,112 526,112 518,162 82,162"
                    fill="#c81e1e"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  {/* Subtle BerryCola stamp on the front red hood */}
                  <text
                    x="300"
                    y="142"
                    textAnchor="middle"
                    className="font-typewriter text-[13px] font-bold tracking-[0.35em] fill-[#fbf5e9]"
                    style={{ paintOrder: "stroke", stroke: "#1e1a18", strokeWidth: "3px" }}
                  >
                    BERRYCOLA
                  </text>

                  {/* Left & Right inner chassis framing lines */}
                  <path
                    d="M 82 162 L 50 282 C 50 290, 58 294, 72 294 L 528 294 C 542 294, 550 290, 550 282 L 518 162"
                    fill="#b31919"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                </g>

                {/* --- DARK CHARCOAL KEYBOARD WELL --- */}
                <path
                  d="M 90 162 L 510 162 L 542 268 C 544 278, 535 284, 522 284 L 444 284 L 438 294 L 162 294 L 156 284 L 78 284 C 65 284, 56 278, 58 268 Z"
                  fill="#252321"
                  stroke="#1e1a18"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />

                {/* --- 4 STAGGERED ROWS OF 3D CREAM ILLUSTRATED KEYS --- */}
                {KEY_ROW_1.map((x, i) => renderKeycap(x, 154, 23, `r1-${i}`))}
                {KEY_ROW_2.map((x, i) => renderKeycap(x, 180, 23, `r2-${i}`))}
                {KEY_ROW_3.map((x, i) => renderKeycap(x, 206, 24, `r3-${i}`))}
                {KEY_ROW_4.map((x, i) =>
                  renderKeycap(x, 232, i === KEY_ROW_4.length - 1 ? 38 : 25, `r4-${i}`)
                )}

                {/* --- WIDE CREAM SPACEBAR (Acts as the interactive CHECKOUT / PRINT ORDER bar!) --- */}
                <g
                  onClick={handleCheckout}
                  className={`cursor-pointer transition-transform ${
                    rawItems.length === 0 ? "opacity-75" : "hover:brightness-105 active:translate-y-0.5"
                  }`}
                >
                  {/* Spacebar 3D lower lip */}
                  <rect
                    x="136"
                    y="264"
                    width="328"
                    height="28"
                    rx="9"
                    fill={rawItems.length > 0 ? "#8f1414" : "#dfd3be"}
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                  />
                  {/* Spacebar top surface */}
                  <rect
                    x="136"
                    y="255"
                    width="328"
                    height="24"
                    rx="8"
                    fill="#fbf5e9"
                    stroke="#1e1a18"
                    strokeWidth="2.5"
                  />
                  {/* Spacebar Action Label */}
                  <text
                    x="300"
                    y="271"
                    textAnchor="middle"
                    className="font-typewriter text-[13px] font-bold uppercase tracking-[0.18em] fill-[#1e1a18]"
                  >
                    {rawItems.length > 0
                      ? `CHECKOUT · PRINT ORDER →`
                      : "KEEP BROWSING →"}
                  </text>
                </g>
              </svg>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}