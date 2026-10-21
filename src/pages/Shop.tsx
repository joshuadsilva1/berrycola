import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import ProductCard from "../components/ProductCard";
import Reveal from "../components/Reveal";
import { getCategoryIconComponent } from "../components/CategoryShapes";
import type { Category } from "../data/products";
import { useProducts } from "../hooks/useCatalog";
import { fetchStorefront, type StorefrontSettings } from "../lib/api";
import { track } from "../lib/analytics";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") as Category | null;
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const { data: products, loading, error } = useProducts(activeCategory);

  const [storefront, setStorefront] = useState<StorefrontSettings | null>(null);

  useEffect(() => {
    fetchStorefront().then(setStorefront).catch(console.error);
  }, []);

  const allowedCategories = useMemo(() => {
    if (storefront && storefront.trendingCategories.length > 0) {
      return storefront.trendingCategories;
    }
    return Array.from(new Set((products ?? []).map((p) => p.category).filter(Boolean)));
  }, [storefront, products]);

  const filtered = useMemo(() => {
    const allowedSet = new Set(allowedCategories);
    let list = (products ?? []).filter((p) => !activeCategory ? allowedSet.has(p.category) || listAllFallback(products ?? [], allowedSet) : true);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, sort, activeCategory, allowedCategories]);

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
          <div className="flex flex-wrap items-end gap-5">
            <button onClick={() => setCategory(null)} className="group flex flex-col items-center gap-2">
              <span
                className={`flex items-center justify-center w-14 h-14 rounded-full border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] group-active:translate-y-0.5 transition-all ${
                  !activeCategory
                    ? "bg-cola-red text-[#fbf5e9] scale-105"
                    : "bg-[#fbf5e9] text-espresso group-hover:text-cola-red"
                }`}
              >
                <LayoutGrid size={20} />
              </span>
              <span className={`text-xs font-semibold ${!activeCategory ? "text-espresso" : "text-espresso/60"}`}>
                All
              </span>
            </button>

            {allowedCategories.map((cat) => {
              const catVisual = storefront?.categoryImages?.[cat];
              const Icon = getCategoryIconComponent(catVisual);
              const isActive = activeCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="group flex flex-col items-center gap-2"
                >
                  {catVisual ? (
                    Icon ? (
                      <span
                        className={`flex items-center justify-center w-14 h-14 rounded-full border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] group-active:translate-y-0.5 transition-all ${
                          isActive
                            ? "bg-cola-red text-[#fbf5e9] scale-105"
                            : "bg-[#fbf5e9] text-espresso group-hover:text-cola-red"
                        }`}
                      >
                        <Icon size={20} />
                      </span>
                    ) : (
                      <span
                        className={`flex items-center justify-center w-14 h-14 rounded-full border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] group-active:translate-y-0.5 transition-all p-2.5 ${
                          isActive
                            ? "bg-cola-red/15 scale-105"
                            : "bg-[#fbf5e9] group-hover:bg-cream"
                        }`}
                      >
                        <img
                          src={catVisual}
                          alt={cat}
                          className="w-full h-full object-contain"
                        />
                      </span>
                    )
                  ) : null}
                  <span
                    className={`text-xs font-semibold transition-all ${
                      !catVisual
                        ? `px-4 py-2 rounded-full border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] group-active:translate-y-0.5 ${
                            isActive
                              ? "bg-cola-red text-[#fbf5e9]"
                              : "bg-[#fbf5e9] text-espresso group-hover:text-cola-red"
                          }`
                        : isActive
                          ? "text-espresso"
                          : "text-espresso/60"
                    }`}
                  >
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="text-xs font-semibold uppercase tracking-wider rounded-full px-4 py-2.5 bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] text-espresso focus:outline-none hover:text-cola-red cursor-pointer transition-all"
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

function listAllFallback(products: { category: string }[], allowedSet: Set<string>) {
  return !products.some((p) => allowedSet.has(p.category));
}
