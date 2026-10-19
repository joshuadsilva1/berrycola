import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Plus, Share2 } from "lucide-react";
import CharmIcon from "./CharmIcon";
import type { Product } from "../data/products";
import { useCart } from "../context/CartContext";

const badgeStyles: Record<string, string> = {
  New: "bg-[#fbf5e9] text-espresso",
  Bestseller: "bg-cola-red text-[#fbf5e9]",
  Limited: "bg-rose text-[#fbf5e9]",
};

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addItem } = useCart();
  const [copied, setCopied] = useState(false);
  const [isNonSquare, setIsNonSquare] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.id}`;
    if (navigator.share) {
      navigator.share({ title: product.name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      className="group relative"
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-square rounded-3xl bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_4px_0_#1e1a18] flex items-center justify-center overflow-hidden transition-transform">
          {product.badge && (
            <span
              className={`absolute top-3.5 left-3.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] z-10 ${badgeStyles[product.badge] ?? "bg-[#fbf5e9] text-espresso"}`}
            >
              {product.badge}
            </span>
          )}

          <button
            type="button"
            onClick={handleShare}
            title={copied ? "Link copied!" : "Share product link"}
            aria-label={`Share ${product.name}`}
            className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all duration-200 cursor-pointer"
          >
            {copied ? <Check size={13} className="text-green-700" /> : <Share2 size={13} />}
          </button>

          {product.imageUrl ? (
            <motion.img
              src={product.imageUrl}
              alt={product.name}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                  setIsNonSquare(Math.abs(img.naturalWidth / img.naturalHeight - 1) > 0.08);
                }
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`w-full h-full ${isNonSquare ? "object-contain" : "object-cover"}`}
            />
          ) : (
            <motion.div
              whileHover={{ scale: 1.08, rotate: -4 }}
              transition={{ type: "spring", stiffness: 260, damping: 15 }}
            >
              <CharmIcon icon={product.icon} gradient={product.gradient} size={112} />
            </motion.div>
          )}

          {product.inStock === false || (product.stockQuantity != null && product.stockQuantity <= 0) ? (
            <span className="absolute top-3.5 left-3.5 text-[10px] font-semibold uppercase tracking-wide bg-espresso text-cream px-2.5 py-1 rounded-full border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] z-10">
              Sold out
            </span>
          ) : (
            <motion.button
              onClick={(e) => {
                // Products with options need a choice first, so let the click
                // fall through to the product page link.
                if (product.variants?.length) return;
                e.preventDefault();
                addItem(product);
              }}
              initial={{ opacity: 0, y: 8 }}
              whileHover={{ scale: 1.06 }}
              className="absolute bottom-3.5 right-3.5 w-10 h-10 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300"
              aria-label={product.variants?.length ? `Choose options for ${product.name}` : `Add ${product.name} to cart`}
            >
              <Plus size={18} />
            </motion.button>
          )}
        </div>

        <div className="mt-4 flex items-start justify-between gap-2 px-0.5">
          <div>
            <h3 className="font-display text-[16px] text-espresso leading-snug">{product.name}</h3>
            <p className="text-xs text-espresso/55 mt-0.5">{product.category}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="font-semibold text-espresso text-[15px]">₹{product.price}</span>
            {product.compareAt && (
              <span className="block text-xs text-espresso/40 line-through">₹{product.compareAt}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
