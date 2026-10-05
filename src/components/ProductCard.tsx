import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import CharmIcon from "./CharmIcon";
import type { Product } from "../data/products";
import { useCart } from "../context/CartContext";

const badgeStyles: Record<string, string> = {
  New: "bg-charcoal text-cream",
  Bestseller: "bg-cola-red text-cream",
  Limited: "bg-rose text-espresso",
};

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addItem } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative"
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-cream to-[#f4ece7] border border-espresso/8 flex items-center justify-center overflow-hidden">
          {product.badge && (
            <span
              className={`absolute top-3.5 left-3.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full z-10 ${badgeStyles[product.badge]}`}
            >
              {product.badge}
            </span>
          )}
          {product.imageUrl ? (
            <motion.img
              src={product.imageUrl}
              alt={product.name}
              whileHover={{ scale: 1.06 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-full h-full object-cover"
            />
          ) : (
            <motion.div
              whileHover={{ scale: 1.08, rotate: -4 }}
              transition={{ type: "spring", stiffness: 260, damping: 15 }}
            >
              <CharmIcon icon={product.icon} gradient={product.gradient} size={112} />
            </motion.div>
          )}

          {product.inStock === false ? (
            <span className="absolute top-3.5 left-3.5 text-[10px] font-semibold uppercase tracking-wide bg-espresso text-cream px-2.5 py-1 rounded-full">
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
            className="absolute bottom-3.5 right-3.5 w-10 h-10 rounded-full bg-espresso text-cream flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300"
            aria-label={product.variants?.length ? `Choose options for ${product.name}` : `Add ${product.name} to cart`}
          >
            <Plus size={18} />
          </motion.button>
          )}
        </div>

        <div className="mt-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-[15px] text-espresso leading-snug">{product.name}</h3>
            <p className="text-xs text-espresso/50 mt-0.5">{product.category}</p>
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
