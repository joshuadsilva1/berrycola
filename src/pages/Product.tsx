import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Check, ChevronRight, Clock, Info, Minus, Package, Plus, RotateCcw, Share2, ShieldCheck, Truck } from "lucide-react";
import CharmIcon from "../components/CharmIcon";
import ProductCard from "../components/ProductCard";
import ProductGallery, { type GallerySlide } from "../components/ProductGallery";
import ProductImage, { imageFor } from "../components/ProductImage";
import ReviewsSection from "../components/ReviewsSection";
import { track } from "../lib/analytics";
import Reveal from "../components/Reveal";
import { useCart } from "../context/CartContext";
import { useProduct, useProducts } from "../hooks/useCatalog";
import { fetchStorefront, type ProductPageDetails } from "../lib/api";
import { variantPrice, type Product as ProductType } from "../data/products";

function formatDateReadable(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [pageDetails, setPageDetails] = useState<ProductPageDetails | null>(null);
  const { addItem } = useCart();

  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = variants.find((v) => v.id === selectedId) ?? null;

  useEffect(() => {
    fetchStorefront()
      .then((s) => setPageDetails(s.productPageDetails ?? {}))
      .catch(() => setPageDetails({}));
  }, []);

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

  const handleShare = () => {
    const url = `${window.location.origin}/product/${product.id}`;
    if (navigator.share) {
      navigator.share({ title: product.name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const prices = variants.map((v) => variantPrice(product, v));
  const lowestPrice = Math.min(...prices);
  const priceLabel = selected
    ? `₹${variantPrice(product, selected)}`
    : hasVariants && prices.some((p) => p !== lowestPrice)
      ? `From ₹${lowestPrice}`
      : `₹${hasVariants ? lowestPrice : product.price}`;

  const maxStock = product.stockQuantity != null ? product.stockQuantity : null;
  const productSoldOut = product.inStock === false || (maxStock !== null && maxStock <= 0);
  const canAdd = !productSoldOut && (!hasVariants || selected !== null);
  const related = (categoryProducts ?? []).filter((p) => p.id !== product.id).slice(0, 4);

  // Resolve delivery window from product fields or admin storefront defaults
  const minDays = product.deliveryMinDays ?? pageDetails?.defaultMinDays ?? null;
  const maxDays = product.deliveryMaxDays ?? pageDetails?.defaultMaxDays ?? null;
  const minDate = product.deliveryMinDate || pageDetails?.defaultMinDate || null;
  const maxDate = product.deliveryMaxDate || pageDetails?.defaultMaxDate || null;

  const hasDeliveryDays = minDays !== null || maxDays !== null;
  const hasDeliveryDates = Boolean(minDate || maxDate);
  const shippingNote = pageDetails?.shippingNote?.trim() || "";
  const returnPolicy = pageDetails?.returnPolicy?.trim() || "";
  const warrantyNote = pageDetails?.warrantyNote?.trim() || "";
  const customItems = (pageDetails?.customItems ?? []).filter(
    (item) => item.title?.trim() || item.value?.trim(),
  );

  const hasAnyStaticDetail =
    hasDeliveryDays ||
    hasDeliveryDates ||
    Boolean(shippingNote) ||
    Boolean(returnPolicy) ||
    Boolean(warrantyNote) ||
    customItems.length > 0;

  return (
    <div className="pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex items-center gap-1.5 text-xs text-espresso/55 mb-8">
          <Link to="/" className="hover:text-cola-red">Home</Link>
          <ChevronRight size={12} />
          <Link to="/shop" className="hover:text-cola-red">Shop</Link>
          <ChevronRight size={12} />
          <span className="text-espresso/80 font-medium">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-14 items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="sticky top-28 relative"
          >
            {product.badge && (
              <span className="absolute top-5 left-5 z-20 text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18]">
                {product.badge}
              </span>
            )}
            <button
              type="button"
              onClick={handleShare}
              title={copiedLink ? "Link copied!" : "Share product link"}
              aria-label="Share product"
              className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all cursor-pointer"
            >
              {copiedLink ? <Check size={16} className="text-green-700" /> : <Share2 size={16} />}
            </button>
            {slides.length > 0 ? (
              <ProductGallery
                slides={slides}
                index={slideIndex}
                onIndexChange={handleSlideChange}
                alt={product.name}
                showThumbnails={!hasVariants}
              />
            ) : (
              <div className="aspect-square rounded-[2rem] bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_5px_0_#1e1a18] flex items-center justify-center overflow-hidden">
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
            <div className="flex flex-wrap items-baseline gap-3 mb-6">
              <span className="text-2xl font-semibold text-espresso">{priceLabel}</span>
              {product.compareAt && (
                <span className="text-lg text-espresso/40 line-through">₹{product.compareAt}</span>
              )}
              {maxStock !== null && (
                <span
                  className={`ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] ${
                    maxStock > 0 ? "bg-[#fbf5e9] text-espresso" : "bg-cola-red text-[#fbf5e9]"
                  }`}
                >
                  <Package size={12} />
                  {maxStock > 0 ? `${maxStock} in stock` : "Out of stock"}
                </span>
              )}
            </div>
            <p className="text-espresso/70 leading-relaxed mb-8">{product.blurb}</p>

            {hasVariants && (
              <div className="mb-8">
                <p className="text-sm text-espresso/65 mb-3">
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
                        className={`flex items-center gap-2.5 rounded-2xl border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 p-1.5 pr-4 text-sm transition-all ${
                          isSelected
                            ? "bg-cola-red text-[#fbf5e9]"
                            : "bg-[#fbf5e9] text-espresso hover:text-cola-red"
                        } ${soldOut ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {image ? (
                          <span className="block w-11 h-11 rounded-xl overflow-hidden border border-[#1e1a18]/30 bg-white">
                            <ProductImage url={image.url} crop={image.crop} alt="" />
                          </span>
                        ) : (
                          <span className="w-2" />
                        )}
                        <span className="flex flex-col items-start leading-tight">
                          <span className={`font-medium ${soldOut ? "line-through" : ""}`}>{v.label}</span>
                          {soldOut ? (
                            <span className={`text-[11px] ${isSelected ? "text-[#fbf5e9]/80" : "text-espresso/50"}`}>Sold out</span>
                          ) : (
                            v.price != null &&
                            v.price !== product.price && (
                              <span className={`text-[11px] ${isSelected ? "text-[#fbf5e9]/80" : "text-espresso/50"}`}>₹{v.price}</span>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => (maxStock !== null ? Math.min(maxStock, q + 1) : q + 1))}
                  disabled={maxStock !== null && qty >= maxStock}
                  className="w-10 h-10 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all disabled:opacity-40 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
              <motion.button
                whileTap={canAdd ? { scale: 0.98 } : undefined}
                disabled={!canAdd}
                onClick={() => addItem(product, selected, qty)}
                className="flex-1 bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_4px_0_#1e1a18] active:translate-y-0.5 py-3.5 rounded-full font-semibold tracking-wide hover:bg-[#b81d1d] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {productSoldOut ? "Sold out" : canAdd ? "Add to Bag" : "Choose an option"}
              </motion.button>
            </div>

            {hasAnyStaticDetail && (
              <div className="flex flex-col gap-3 border-t border-espresso/10 pt-6">
                {hasDeliveryDays && (
                  <div className="flex items-center gap-3 text-sm text-espresso/75">
                    <span className="w-8 h-8 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] flex items-center justify-center text-espresso shrink-0">
                      <Clock size={14} />
                    </span>
                    <span>
                      <strong className="text-espresso">Estimated Delivery Time:</strong>{" "}
                      {minDays !== null && maxDays !== null
                        ? `${minDays}–${maxDays} business days`
                        : minDays !== null
                          ? `From ${minDays} business days`
                          : `Up to ${maxDays} business days`}
                    </span>
                  </div>
                )}

                {hasDeliveryDates && (
                  <div className="flex items-center gap-3 text-sm text-espresso/75">
                    <span className="w-8 h-8 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] flex items-center justify-center text-espresso shrink-0">
                      <Calendar size={14} />
                    </span>
                    <span>
                      <strong className="text-espresso">Delivery Window:</strong>{" "}
                      {minDate && maxDate
                        ? `${formatDateReadable(minDate)} – ${formatDateReadable(maxDate)}`
                        : minDate
                          ? `Earliest by ${formatDateReadable(minDate)}`
                          : `Latest by ${formatDateReadable(maxDate!)}`}
                    </span>
                  </div>
                )}

                {shippingNote && (
                  <div className="flex items-center gap-3 text-sm text-espresso/75">
                    <span className="w-8 h-8 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] flex items-center justify-center text-espresso shrink-0">
                      <Truck size={14} />
                    </span>
                    <span>{shippingNote}</span>
                  </div>
                )}

                {returnPolicy && (
                  <div className="flex items-center gap-3 text-sm text-espresso/75">
                    <span className="w-8 h-8 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] flex items-center justify-center text-espresso shrink-0">
                      <RotateCcw size={14} />
                    </span>
                    <span>{returnPolicy}</span>
                  </div>
                )}

                {warrantyNote && (
                  <div className="flex items-center gap-3 text-sm text-espresso/75">
                    <span className="w-8 h-8 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] flex items-center justify-center text-espresso shrink-0">
                      <ShieldCheck size={14} />
                    </span>
                    <span>{warrantyNote}</span>
                  </div>
                )}

                {customItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-espresso/75">
                    <span className="w-8 h-8 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] flex items-center justify-center text-espresso shrink-0">
                      <Info size={14} />
                    </span>
                    <span>
                      {item.title?.trim() ? (
                        <>
                          <strong className="text-espresso">{item.title.trim()}:</strong> {item.value}
                        </>
                      ) : (
                        item.value
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Reveal>
        </div>
      </div>

      {/* VERIFIED BUYER REVIEWS SECTION */}
      <div className="mt-16">
        <ReviewsSection productId={product.id} productName={product.name} />
      </div>

      {related.length > 0 && (
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <section className="mt-12">
            <Reveal>
              <h2 className="font-display text-2xl sm:text-3xl text-espresso mb-8">You might also like</h2>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-7">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
