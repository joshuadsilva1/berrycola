import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, ShieldCheck, Truck, ChevronRight } from "lucide-react";
import CharmIcon from "../components/CharmIcon";
import ProductCard from "../components/ProductCard";
import ProductGallery, { type GallerySlide } from "../components/ProductGallery";
import ProductImage, { imageFor } from "../components/ProductImage";
import { track } from "../lib/analytics";
import Reveal from "../components/Reveal";
import { useCart } from "../context/CartContext";
import { useProduct, useProducts } from "../hooks/useCatalog";
import { variantPrice, type Product as ProductType } from "../data/products";

export default function Product() {
  const { id } = useParams();
  const { data: product, loading, error } = useProduct(id);

  if (loading) {
    return <div className="pt-40 pb-24 text-center text-espresso/50">Loading charm…</div>;
  }
  if (error || !product) {
    return (
      <div className="pt-40 pb-24 text-center text-cola-red">
        Couldn't find that charm. Is the backend running?
      </div>
    );
  }

  // Keyed so the chosen option, quantity and photo reset when moving between products.
  return <ProductDetail key={product.id} product={product} />;
}

function ProductDetail({ product }: { product: ProductType }) {
  const { data: categoryProducts } = useProducts(product.category);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = variants.find((v) => v.id === selectedId) ?? null;

  // Main photo first, then one named photo per option (or per gallery
  // image) — either its own photo or a zoom into the main one.
  const slides: GallerySlide[] = [];
  if (product.imageUrl) {
    slides.push({
      url: product.imageUrl,
      label: product.imageLabel ?? (hasVariants ? "All options" : null),
    });
  }
  const slideIndexByVariant = new Map<string, number>();
  for (const v of variants) {
    const image = imageFor(v, product.imageUrl);
    if (image) {
      slideIndexByVariant.set(v.id, slides.length);
      slides.push({ ...image, label: v.label });
    }
  }
  if (!hasVariants) {
    for (const g of product.gallery ?? []) {
      const image = imageFor(g, product.imageUrl);
      if (image) slides.push({ ...image, label: g.label });
    }
  }
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    track("product_view", { productId: product.id, value: product.price });
  }, [product.id, product.price]);

  const selectVariant = (variantId: string) => {
    setSelectedId(variantId);
    const variant = variants.find((v) => v.id === variantId);
    track("option_select", { productId: product.id, props: { label: variant?.label } });
    const index = slideIndexByVariant.get(variantId);
    if (index !== undefined) setSlideIndex(index);
  };

  // Swiping onto an option's photo selects that option.
  const handleSlideChange = (index: number) => {
    setSlideIndex(index);
    track("image_view", { productId: product.id, props: { label: slides[index]?.label ?? `Photo ${index + 1}` } });
    const variant = variants.find((v) => slideIndexByVariant.get(v.id) === index);
    if (variant && variant.inStock !== false) setSelectedId(variant.id);
  };

  const prices = variants.map((v) => variantPrice(product, v));
  const lowestPrice = Math.min(...prices);
  const priceLabel = selected
    ? `₹${variantPrice(product, selected)}`
    : hasVariants && prices.some((p) => p !== lowestPrice)
      ? `From ₹${lowestPrice}`
      : `₹${hasVariants ? lowestPrice : product.price}`;

  const productSoldOut = product.inStock === false;
  const canAdd = !productSoldOut && (!hasVariants || selected !== null);
  const related = (categoryProducts ?? []).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex items-center gap-1.5 text-xs text-espresso/45 mb-8">
          <Link to="/" className="hover:text-cola-red">Home</Link>
          <ChevronRight size={12} />
          <Link to="/shop" className="hover:text-cola-red">Shop</Link>
          <ChevronRight size={12} />
          <span className="text-espresso/70">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-14 items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="sticky top-28"
          >
            {product.badge && (
              <span className="absolute top-6 left-6 z-20 text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-cola-red text-cream">
                {product.badge}
              </span>
            )}
            {slides.length > 0 ? (
              <ProductGallery
                slides={slides}
                index={slideIndex}
                onIndexChange={handleSlideChange}
                alt={product.name}
                showThumbnails={!hasVariants}
              />
            ) : (
              <div className="aspect-square rounded-[2rem] bg-gradient-to-br from-[#f7f0ec] to-[#efe2db] flex items-center justify-center overflow-hidden">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <CharmIcon icon={product.icon} gradient={product.gradient} size={220} />
                </motion.div>
              </div>
            )}
          </motion.div>

          <Reveal>
            <p className="text-xs uppercase tracking-[0.25em] text-cola-red font-semibold mb-3">{product.category}</p>
            <h1 className="font-display text-4xl text-espresso mb-4">{product.name}</h1>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl font-semibold text-espresso">{priceLabel}</span>
              {product.compareAt && (
                <span className="text-lg text-espresso/40 line-through">₹{product.compareAt}</span>
              )}
            </div>
            <p className="text-espresso/65 leading-relaxed mb-8">{product.blurb}</p>

            {hasVariants && (
              <div className="mb-8">
                <p className="text-sm text-espresso/60 mb-3">
                  Choose one:{" "}
                  <span className="font-semibold text-espresso">{selected?.label ?? "—"}</span>
                </p>
                <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Options">
                  {variants.map((v) => {
                    const isSelected = v.id === selectedId;
                    const soldOut = v.inStock === false;
                    const image = imageFor(v, product.imageUrl);
                    return (
                      <button
                        key={v.id}
                        role="radio"
                        aria-checked={isSelected}
                        disabled={soldOut}
                        onClick={() => selectVariant(v.id)}
                        className={`flex items-center gap-2.5 rounded-2xl border-2 p-1.5 pr-4 text-sm transition-colors ${
                          isSelected
                            ? "border-cola-red text-espresso"
                            : "border-espresso/12 text-espresso/75 hover:border-espresso/30"
                        } ${soldOut ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {image ? (
                          <span className="block w-11 h-11 rounded-xl overflow-hidden">
                            <ProductImage url={image.url} crop={image.crop} alt="" />
                          </span>
                        ) : (
                          <span className="w-2" />
                        )}
                        <span className="flex flex-col items-start leading-tight">
                          <span className={`font-medium ${soldOut ? "line-through" : ""}`}>{v.label}</span>
                          {soldOut ? (
                            <span className="text-[11px] text-espresso/50">Sold out</span>
                          ) : (
                            v.price != null &&
                            v.price !== product.price && (
                              <span className="text-[11px] text-espresso/50">₹{v.price}</span>
                            )
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-espresso/15 rounded-full">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center hover:text-cola-red"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-11 h-11 flex items-center justify-center hover:text-cola-red"
                >
                  <Plus size={14} />
                </button>
              </div>
              <motion.button
                whileTap={canAdd ? { scale: 0.96 } : undefined}
                disabled={!canAdd}
                onClick={() => addItem(product, selected, qty)}
                className="flex-1 bg-espresso text-cream py-3.5 rounded-full font-semibold tracking-wide hover:bg-cola-red transition-colors disabled:opacity-40 disabled:hover:bg-espresso disabled:cursor-not-allowed"
              >
                {productSoldOut ? "Sold out" : canAdd ? "Add to Bag" : "Choose an option"}
              </motion.button>
            </div>

            <div className="flex flex-col gap-3 border-t border-espresso/10 pt-6">
              <div className="flex items-center gap-3 text-sm text-espresso/60">
                <Truck size={16} className="text-cola-red" /> Free shipping over ₹999
              </div>
              <div className="flex items-center gap-3 text-sm text-espresso/60">
                <ShieldCheck size={16} className="text-cola-red" /> Tarnish-resistant, everyday wear tested
              </div>
            </div>
          </Reveal>
        </div>

        {related.length > 0 && (
          <section className="mt-28">
            <Reveal>
              <h2 className="font-display text-2xl sm:text-3xl text-espresso mb-8">You might also like</h2>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-7">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
