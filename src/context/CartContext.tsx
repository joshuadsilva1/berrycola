import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { variantPrice, type Product, type ProductVariant } from "../data/products";
import { track } from "../lib/analytics";

// Each product + option pair is its own line, so a black tin and a white tin
// sit separately in the bag.
export interface CartLine {
  key: string;
  product: Product;
  variant: ProductVariant | null;
  qty: number;
}

function lineKey(product: Product, variant?: ProductVariant | null) {
  return variant ? `${product.id}::${variant.id}` : product.id;
}

interface CartContextValue {
  lines: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, variant?: ProductVariant | null, qty?: number) => void;
  removeItem: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clearCart: () => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (product: Product, variant: ProductVariant | null = null, qty = 1) => {
    const key = lineKey(product, variant);
    track("add_to_cart", {
      productId: product.id,
      value: variantPrice(product, variant) * qty,
      props: { option: variant?.label, qty },
    });
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l));
      }
      return [...prev, { key, product, variant, qty }];
    });
    setIsOpen(true);
  };

  const removeItem = (key: string) => {
    const line = lines.find((l) => l.key === key);
    if (line) {
      track("remove_from_cart", {
        productId: line.product.id,
        value: variantPrice(line.product, line.variant) * line.qty,
        props: { option: line.variant?.label },
      });
    }
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const setQty = (key: string, qty: number) => {
    if (qty <= 0) return removeItem(key);
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, qty } : l)));
  };

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty * variantPrice(l.product, l.variant), 0),
    [lines]
  );

  return (
    <CartContext.Provider
      value={{
        lines,
        isOpen,
        openCart: () => {
          track("cart_open", { props: { items: count } });
          setIsOpen(true);
        },
        closeCart: () => setIsOpen(false),
        addItem,
        removeItem,
        setQty,
        clearCart: () => setLines([]),
        count,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
