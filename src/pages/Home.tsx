import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import PaperCharm from "../components/PaperCharm";
import { getCategoryIconComponent } from "../components/CategoryShapes";
import ProductCard from "../components/ProductCard";
import ReviewsSection from "../components/ReviewsSection";
import Reveal from "../components/Reveal";
import Marquee from "../components/Marquee";
import StatCounter from "../components/StatCounter";
import NewsletterForm from "../components/NewsletterForm";
import { useProducts } from "../hooks/useCatalog";
import { fetchStorefront, type StorefrontSettings } from "../lib/api";

import skullDiceCharm from "../assets/charizard charm new.png";
import gachaPouch from "../assets/gacha pouch.png";
import batmanFairyCharm from "../assets/batman and batfairy.png";
import lipbalmCharm from "../assets/lip bam charm.png";
import batmanCharm from "../assets/fairy.png";

const heroCharms = [
  { image: gachaPouch, style: "top-[7%] left-[-3%] md:top-[8%] md:left-[6%]", size: 430, float: 4.5, tilt: -7 },
  { image: batmanFairyCharm, style: "bottom-[10%] left-[-5%] md:bottom-auto md:top-[62%] md:left-[3%]", size: 450, float: 5.5, tilt: 5 },
  { image: lipbalmCharm, style: "top-[7%] right-[-3%] md:top-[14%] md:right-[7%]", size: 400, float: 6, tilt: 6 },
  { image: batmanCharm, style: "bottom-[10%] right-[-5%] md:bottom-auto md:top-[64%] md:right-[9%]", size: 310, float: 5, tilt: -4 },
];

const categoryCopy: Record<string, string> = {
  "Bag Charms": "Clip-on characters for your everyday carry.",
  "Charm Tins": "Pocket-sized cases for your collection.",
};

export default function Home() {
  const { data: products, loading: productsLoading } = useProducts();
  const [storefront, setStorefront] = useState<StorefrontSettings | null>(null);

  useEffect(() => {
    fetchStorefront().then(setStorefront).catch(console.error);
  }, []);

  const homeCategories = useMemo(() => {
    if (storefront && storefront.trendingCategories.length > 0) {
      return storefront.trendingCategories;
    }
    return Array.from(new Set((products ?? []).map((p) => p.category).filter(Boolean)));
  }, [storefront, products]);

  const bestsellers = useMemo(() => {
    const all = products ?? [];
    const allowedSet = new Set(homeCategories);
    const inAllowed = all.filter((p) => allowedSet.has(p.category));
    const pool = inAllowed.length > 0 ? inAllowed : all;
    const tagged = pool.filter((p) => p.badge === "Bestseller");
    const rest = pool.filter((p) => p.badge !== "Bestseller");
    return [...tagged, ...rest].slice(0, 4);
  }, [products, homeCategories]);

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden pt-20 md:min-h-screen">
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 50% 20%, #fbe9e4 0%, #fffffe 55%)" }} />
        {heroCharms.map((c, i) => (
          <motion.div key={i} className={`absolute ${c.style}`} animate={{ y: [0, -18, 0], rotate: [0, 6, 0] }} transition={{ duration: c.float, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}>
            <PaperCharm image={c.image} size={c.size} tilt={c.tilt} className="home-hero-charm" />
          </motion.div>
        ))}

        <div className="relative z-10 mx-auto w-full max-w-4xl px-5 pt-20 text-center sm:px-6 sm:pt-16 md:pt-0">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="mb-5 inline-block rounded-full border-2 border-[#1e1a18] bg-[#fbf5e9] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cola-red shadow-[0_2px_0_#1e1a18] sm:mb-6 sm:px-4 sm:text-xs sm:tracking-[0.22em]">
            New Drop · Bag Charms Collection
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="font-display text-[clamp(2.35rem,9vw,3.75rem)] leading-[1.05] text-espresso sm:text-6xl md:text-7xl">
            <span className="block whitespace-nowrap">Small charms.</span>
            <span className="block whitespace-nowrap text-cola-red">Big statements.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }} className="mx-auto mt-4 max-w-[34ch] text-base font-normal leading-relaxed text-espresso/65 text-balance sm:mt-6 sm:max-w-xl sm:text-lg">
            Hand-finished charms designed to be clipped, swapped, and carried on everything, bags, belt loops, phones, keys. Build a lineup that's entirely, unmistakably yours.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }} className="mx-auto mt-6 grid max-w-[340px] grid-cols-2 items-center justify-center gap-3 sm:mt-10 sm:flex sm:max-w-none sm:flex-wrap sm:gap-4">
            <Link to="/shop" className="group inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border-2 border-[#1e1a18] bg-cola-red px-3 py-3 text-xs font-semibold tracking-wide text-[#fbf5e9] shadow-[0_4px_0_#1e1a18] transition-all hover:bg-[#b81d1d] active:translate-y-0.5 sm:gap-2 sm:px-8 sm:py-3.5 sm:text-base">
              Shop the Drop <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/about" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border-2 border-[#1e1a18] bg-[#fbf5e9] px-3 py-3 text-xs font-semibold tracking-wide text-espresso shadow-[0_4px_0_#1e1a18] transition-all hover:text-cola-red active:translate-y-0.5 sm:gap-2 sm:px-8 sm:py-3.5 sm:text-base">
              Our Story
            </Link>
          </motion.div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="bg-espresso border-y-2 border-[#1e1a18] py-3">
        <Marquee speed={22}>
          {["Free shipping over ₹999", "New drop every Friday", "Made to stack", "100% Verified Buyer Reviews"].map((t, i) => (
            <span key={i} className="mx-6 text-cream/85 text-sm uppercase tracking-[0.2em] flex items-center gap-6">
              {t} <span className="w-1.5 h-1.5 rounded-full bg-cola-red" />
            </span>
          ))}
        </Marquee>
      </div>

      {/* BESTSELLERS */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-24">
        <Reveal className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cola-red font-semibold mb-2">Fan Favorites</p>
            <h2 className="font-display text-3xl sm:text-4xl text-espresso">Bestselling Charms</h2>
          </div>
          <Link to="/shop" className="px-4 py-2 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 text-xs font-semibold uppercase  text-espresso hover:text-cola-red flex items-center gap-1.5 transition-all">
            View all <ArrowRight size={14} />
          </Link>
        </Reveal>
        {productsLoading ? (
          <p className="text-espresso/50 text-sm py-8">Loading bestselling charms…</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-7">
            {bestsellers.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* DYNAMIC CATEGORIES */}
      {homeCategories.length > 0 && (
        <section className="bg-[#f7f0ec] border-y-2 border-[#1e1a18]/15 py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="text-center mb-12">
              <p className="text-xs uppercase tracking-[0.25em] text-cola-red font-semibold mb-2">Explore</p>
              <h2 className="font-display text-3xl sm:text-4xl text-espresso">Shop by Collection</h2>
            </Reveal>
            <div className="flex flex-wrap justify-center gap-6">
              {homeCategories.map((cat, i) => {
                const coverValue = storefront?.categoryImages?.[cat];
                const Icon = getCategoryIconComponent(coverValue);
                const copy = categoryCopy[cat] || `Explore our latest collection of ${cat}.`;
                
                return (
                  <Reveal key={cat} delay={i * 0.08} className="w-full sm:w-64 md:w-72">
                    <Link
                      to={`/shop?category=${encodeURIComponent(cat)}`}
                      className="group flex flex-col items-center justify-center text-center h-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_5px_0_#1e1a18] hover:-translate-y-0.5 active:translate-y-0.5 rounded-3xl p-7 transition-all"
                    >
                      {coverValue && (
                        <motion.div
                          className="flex justify-center mb-4"
                          whileHover={{ scale: 1.06, rotate: -3 }}
                          transition={{ type: "spring", stiffness: 260 }}
                        >
                          {Icon ? (
                            <div className="w-20 h-20 rounded-full bg-white border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] flex items-center justify-center text-espresso group-hover:text-cola-red transition-all">
                              <Icon size={32} />
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-white border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] flex items-center justify-center p-3 transition-all">
                              <img
                                src={coverValue}
                                alt={cat}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                        </motion.div>
                      )}
                      <h3 className="font-display text-xl text-espresso group-hover:text-cola-red transition-colors">{cat}</h3>
                      <p className="text-sm text-espresso/60 mt-1.5">{copy}</p>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* VERIFIED BUYER REVIEWS SHOWCASE */}
      {storefront?.reviewSectionEnabled !== false && <ReviewsSection />}

      {/* BRAND STORY / STATS */}
      <section className="relative bg-espresso border-y-2 border-[#1e1a18] py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 80% 20%, #d51f1f22 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-14 items-center">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.25em] text-cola-red font-semibold mb-4">The BerryCola Story</p>
            <h2 className="font-display text-3xl sm:text-4xl text-cream leading-tight mb-6">Born from a bottle cap. Built for the stack.</h2>
            <p className="text-cream/65 leading-relaxed mb-4">BerryCola started with one charm, a tiny enamel bottle cap that wouldn't stop selling out. Today we design every charm in-house, testing weight, shine, and jingle until it feels right in the hand.</p>
            <p className="text-cream/65 leading-relaxed mb-8">No mass-produced plastic. No knockoffs. Just charms worth collecting, one clip at a time.</p>
            <Link to="/about" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#fbf5e9] text-espresso border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 text-sm font-semibold hover:text-cola-red transition-all">
              Read the full story <ArrowRight size={16} />
            </Link>
          </Reveal>
          <Reveal delay={0.15}>
            <div className={`grid ${storefront?.reviewSectionEnabled === false ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"} gap-8 bg-cream/5 rounded-3xl p-10 border-2 border-cream/20 shadow-[0_6px_0_rgba(0,0,0,0.35)]`}>
              <StatCounter
                value={storefront?.stats?.charmDesigns ?? (products ?? []).length}
                label="Charm Designs"
              />
              <StatCounter
                value={storefront?.stats?.collectionsCount ?? homeCategories.length}
                label="Collections"
              />
              <StatCounter
                value={storefront?.stats?.charmsShipped ?? 0}
                label="Charms Ordered"
              />
              {storefront?.reviewSectionEnabled !== false && (storefront?.stats?.averageRating != null ? (
                <StatCounter
                  value={storefront.stats.averageRating}
                  suffix="/5"
                  label="Verified Rating"
                  decimals={1}
                />
              ) : (
                <StatCounter
                  value={storefront?.stats?.totalReviews ?? 0}
                  label="Verified Reviews"
                />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* TRUST STRIP & NEWSLETTER CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 grid sm:grid-cols-3 gap-8">
        {[
          { icon: Truck, title: "Fast, Free Shipping", copy: "On every order over ₹999, delivered pan-India." },
          { icon: ShieldCheck, title: "Built to Last", copy: "Tarnish-resistant plating, tested for everyday wear." },
          { icon: RotateCcw, title: "Easy 15-Day Returns", copy: "Not the one? Send it back, no questions asked." },
        ].map((item, i) => (
          <Reveal key={item.title} delay={i * 0.1} className="text-center group bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_4px_0_#1e1a18] rounded-3xl p-7">
            <div className="w-14 h-14 mx-auto rounded-full bg-white border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] group-hover:-translate-y-0.5 flex items-center justify-center mb-4 text-espresso group-hover:text-cola-red transition-all">
              <item.icon size={22} />
            </div>
            <h3 className="font-display text-lg text-espresso mb-1.5">{item.title}</h3>
            <p className="text-sm text-espresso/60">{item.copy}</p>
          </Reveal>
        ))}
      </section>

      <section className="relative mx-4 sm:mx-8 mb-24 rounded-[2rem] overflow-hidden bg-cola-red border-2 border-[#1e1a18] shadow-[0_6px_0_#1e1a18]">
        <div className="absolute inset-0 opacity-15" style={{ background: "radial-gradient(circle at 15% 30%, #fff 0%, transparent 45%)" }} />
        <div className="relative px-8 py-16 sm:py-20 text-center">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl text-cream mb-4 text-balance">Get first access to every drop</h2>
            <p className="text-cream/85 max-w-md mx-auto mb-8">Join the list for early access, restock alerts, and the occasional secret discount.</p>
            <div className="max-w-md mx-auto bg-[#fbf5e9] rounded-full p-1.5 border-2 border-[#1e1a18] shadow-[0_4px_0_#1e1a18]"><NewsletterForm variant="light" /></div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
