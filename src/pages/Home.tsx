import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import PaperCharm from "../components/PaperCharm";
import { CategoryShape } from "../components/CategoryShapes";
import ProductCard from "../components/ProductCard";
import Reveal from "../components/Reveal";
import Marquee from "../components/Marquee";
import StatCounter from "../components/StatCounter";
import NewsletterForm from "../components/NewsletterForm";
import { categories } from "../data/products";
import { useProducts } from "../hooks/useCatalog";

// 1. Import all your new PNGs from the assets folder
import skullDiceCharm from "../assets/charm-skull-dice.png";
import fairyCharm from "../assets/fairy.png";
import batmanCharm from "../assets/batman.png";
import marlboroCharm from "../assets/marlboro.png";

// 2. Update the heroCharms array to use the imported images
const heroCharms = [
 // Increased size from 70 to 140
  { image: fairyCharm, style: "top-[8%] left-[6%]", size: 250, float: 4.5, tilt: -7 },
  
  // Increased size from 50 to 120
  { image: batmanCharm, style: "top-[62%] left-[3%]", size: 250, float: 5.5, tilt: 5 },
  
  // Increased size from 58 to 130
  { image: marlboroCharm, style: "top-[14%] right-[7%]", size: 270, float: 6, tilt: 6 },
  
  // Increased size from 90 to 150
  { image: skullDiceCharm, style: "top-[64%] right-[9%]", size: 290, float: 5, tilt: -4 },
];

const categoryCopy: Record<string, string> = {
  "Bag Charms": "Clip-on characters for your everyday carry.",
  "Carabiners": "Steel clips built to hold your whole world.",
  "Phone Charms": "Wrist straps and charms for your phone.",
  "Chains & Necklaces": "Chunky chains, ready to layer.",
  "Charm Tins": "Pocket-sized cases for your collection.",
};

export default function Home() {
  const { data: products } = useProducts();
  const bestsellers = (products ?? []).filter((p) => p.badge === "Bestseller").slice(0, 4);

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "radial-gradient(circle at 50% 20%, #fbe9e4 0%, #fffffe 55%)" }}
        />
        {heroCharms.map((c, i) => (
          <motion.div
            key={i}
            className={`hidden md:block absolute ${c.style}`}
            animate={{ y: [0, -18, 0], rotate: [0, 6, 0] }}
            transition={{ duration: c.float, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          >
            <PaperCharm image={c.image} size={c.size} tilt={c.tilt} />
          </motion.div>
        ))}

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-block text-xs uppercase tracking-[0.3em] text-cola-red font-semibold mb-5"
          >
            New Drop · Bag Charms Collection
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-balance text-5xl sm:text-6xl md:text-7xl leading-[1.05] text-espresso"
          >
            Small charms.
            <br />
            <span className="text-cola-red">Big statements.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="mt-6 text-espresso/60 text-lg max-w-xl mx-auto text-balance"
          >
            Hand-finished charms designed to be clipped, swapped, and carried
            on everything — bags, belt loops, phones, keys. Build a lineup
            that's entirely, unmistakably yours.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 bg-espresso text-cream px-8 py-4 rounded-full font-semibold tracking-wide hover:bg-cola-red transition-colors"
            >
              Shop the Drop
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold tracking-wide text-espresso border border-espresso/15 hover:border-espresso/40 transition-colors"
            >
              Our Story
            </Link>
          </motion.div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="bg-espresso py-3">
        <Marquee speed={22}>
          {["Free shipping over ₹999", "New drop every Friday", "Made to stack", "5,000+ five-star reviews"].map(
            (t, i) => (
              <span key={i} className="mx-6 text-cream/80 text-sm uppercase tracking-[0.2em] flex items-center gap-6">
                {t}
                <span className="w-1.5 h-1.5 rounded-full bg-cola-red" />
              </span>
            )
          )}
        </Marquee>
      </div>

      {/* BESTSELLERS */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-24">
        <Reveal className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cola-red font-semibold mb-2">Fan Favorites</p>
            <h2 className="font-display text-3xl sm:text-4xl text-espresso">Bestselling Charms</h2>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-espresso/70 hover:text-cola-red flex items-center gap-1.5">
            View all <ArrowRight size={14} />
          </Link>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-7">
          {bestsellers.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-[#f7f0ec] py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-cola-red font-semibold mb-2">Explore</p>
            <h2 className="font-display text-3xl sm:text-4xl text-espresso">Shop by Collection</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((cat, i) => (
              <Reveal key={cat} delay={i * 0.08}>
                <Link to={`/shop?category=${encodeURIComponent(cat)}`} className="group block text-center">
                  <motion.div
                    className="flex justify-center mb-5"
                    whileHover={{ scale: 1.08, rotate: -3 }}
                    transition={{ type: "spring", stiffness: 260 }}
                  >
                    <CategoryShape category={cat} size={128} />
                  </motion.div>
                  <h3 className="font-display text-lg text-espresso">{cat}</h3>
                  <p className="text-sm text-espresso/50 mt-1.5">{categoryCopy[cat]}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND STORY / STATS */}
      <section className="relative bg-espresso py-28 overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(circle at 80% 20%, #d51f1f22 0%, transparent 60%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-14 items-center">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.25em] text-cola-red font-semibold mb-4">The BerryCola Story</p>
            <h2 className="font-display text-3xl sm:text-4xl text-cream leading-tight mb-6">
              Born from a bottle cap. Built for the stack.
            </h2>
            <p className="text-cream/60 leading-relaxed mb-4">
              BerryCola started with one charm — a tiny enamel bottle cap that
              wouldn't stop selling out. Today we design every charm in-house,
              testing weight, shine, and jingle until it feels right in the hand.
            </p>
            <p className="text-cream/60 leading-relaxed mb-8">
              No mass-produced plastic. No knockoffs. Just charms worth
              collecting, one clip at a time.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-cream font-semibold border-b border-cola-red pb-1 hover:gap-3 transition-all"
            >
              Read the full story <ArrowRight size={16} />
            </Link>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="grid grid-cols-2 gap-8 bg-cream/5 rounded-3xl p-10 border border-cream/10">
              <StatCounter value={52} suffix="K+" label="Charms Shipped" />
              <StatCounter value={4.9} suffix="/5" label="Average Rating" decimals={1} />
              <StatCounter value={120} suffix="+" label="Charm Designs" />
              <StatCounter value={18} suffix="K+" label="Bags Charmed" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="mx-auto max-w-6xl px-6 py-20 grid sm:grid-cols-3 gap-8">
        {[
          { icon: Truck, title: "Fast, Free Shipping", copy: "On every order over ₹999, delivered pan-India." },
          { icon: ShieldCheck, title: "Built to Last", copy: "Tarnish-resistant plating, tested for everyday wear." },
          { icon: RotateCcw, title: "Easy 15-Day Returns", copy: "Not the one? Send it back, no questions asked." },
        ].map((item, i) => (
          <Reveal key={item.title} delay={i * 0.1} className="text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#f7f0ec] flex items-center justify-center mb-4">
              <item.icon size={22} className="text-cola-red" />
            </div>
            <h3 className="font-display text-lg text-espresso mb-1.5">{item.title}</h3>
            <p className="text-sm text-espresso/55">{item.copy}</p>
          </Reveal>
        ))}
      </section>

      {/* NEWSLETTER CTA */}
      <section className="relative mx-4 sm:mx-8 mb-24 rounded-[2rem] overflow-hidden bg-cola-red">
        <div className="absolute inset-0 opacity-15" style={{ background: "radial-gradient(circle at 15% 30%, #fff 0%, transparent 45%)" }} />
        <div className="relative px-8 py-16 sm:py-20 text-center">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl text-cream mb-4 text-balance">
              Get first access to every drop
            </h2>
            <p className="text-cream/80 max-w-md mx-auto mb-8">
              Join the list for early access, restock alerts, and the occasional
              secret discount.
            </p>
            <div className="max-w-md mx-auto bg-cream rounded-full p-1.5 shadow-xl">
              <NewsletterForm variant="light" />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
