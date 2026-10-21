export type Category = string;

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  compareAt?: number;
  blurb: string;
  icon: string; // lucide icon name, resolved in <CharmIcon />
  gradient: [string, string];
  badge?: "New" | "Bestseller" | "Limited";
  imageUrl?: string | null;
  // Name of the main photo's carousel slide.
  imageLabel?: string | null;
  // Options the customer must pick exactly one of (e.g. black / white tin).
  variants?: ProductVariant[];
  // Extra named carousel photos (for products without options).
  gallery?: GalleryImage[];
  inStock?: boolean;
  stockQuantity?: number | null;
  sortOrder?: number;
  deliveryMinDays?: number | null;
  deliveryMaxDays?: number | null;
  deliveryMinDate?: string | null;
  deliveryMaxDate?: string | null;
}

// A zoomed-in view of the main photo: centre on (x, y) — fractions of the
// photo's width/height — and magnify by `zoom`.
export interface Crop {
  x: number;
  y: number;
  zoom: number;
}

export interface GalleryImage {
  id: string;
  label: string;
  imageUrl?: string | null;
  crop?: Crop | null;
}

export interface ProductVariant {
  id: string;
  label: string;
  imageUrl?: string | null;
  crop?: Crop | null;
  price?: number | null; // falls back to the product's price
  inStock?: boolean;
}

export function variantPrice(product: Product, variant?: ProductVariant | null) {
  return variant?.price ?? product.price;
}
