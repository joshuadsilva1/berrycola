import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import ProductCard from "../components/ProductCard";
import Reveal from "../components/Reveal";
import { CategoryShape } from "../components/CategoryShapes";
import { categories, type Category } from "../data/products";
import { useProducts } from "../hooks/useCatalog";
import { track } from "../lib/analytics";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") as Category | null;
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const { data: products, loading, error } = useProducts(activeCategory);

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, sort]);

  const setCategory = (cat: Category | null) => {
    track("shop_filter", { props: { category: cat ?? "All" } });
    if (!cat) return setSearchParams({});
    setSearchParams({ category: cat });
  };

  return (
    <div className="pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-cola-red font-semibold mb-2">Full Collection</p>
          <h1 className="font-display text-4xl sm:text-5xl text-espresso">
            {activeCategory ?? "All Charms"}
          </h1>
          <p className="text-espresso/55 mt-3 max-w-lg">
            {loading ? "Loading…" : `${filtered.length} charm${filtered.length !== 1 ? "s" : ""}`} · designed to clip,
            swap, and carry every day.
          </p>
        </Reveal>

        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div className="flex flex-wrap gap-5">
            <button onClick={() => setCategory(null)} className="group flex flex-col items-center gap-2">
              <span
                className={`flex items-center justify-center w-14 h-14 rounded-full border transition-all ${
                  !activeCategory
                    ? "bg-espresso border-espresso text-cream scale-110"
                    : "border-espresso/15 text-espresso/50 group-hover:border-espresso/40 group-hover:text-espresso/80"
                }`}
              >
                <LayoutGrid size={20} />
              </span>
              <span className={`text-xs font-medium ${!activeCategory ? "text-espresso" : "text-espresso/50"}`}>
                All
              </span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="group flex flex-col items-center gap-2"
              >
                <motion.span
                  className="flex items-center justify-center"
                  animate={{ scale: activeCategory === cat ? 1.12 : 1, opacity: activeCategory === cat ? 1 : 0.55 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CategoryShape category={cat} size={56} />
                </motion.span>
                <span className={`text-xs font-medium ${activeCategory === cat ? "text-espresso" : "text-espresso/50"}`}>
                  {cat}
                </span>
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="text-sm border border-espresso/15 rounded-full px-4 py-2 bg-cream text-espresso/80 focus:outline-none focus:border-cola-red"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        {loading && <p className="text-espresso/50 py-16 text-center">Loading charms…</p>}
        {error && (
          <p className="text-cola-red py-16 text-center">
            Couldn't reach the shop right now. Is the backend running?
          </p>
        )}

        {!loading && !error && (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-7">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
