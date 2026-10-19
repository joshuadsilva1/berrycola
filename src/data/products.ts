export type Category = "Bag Charms" | "Carabiners" | "Phone Charms" | "Chains & Necklaces" | "Charm Tins" | (string & {});

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

export const products: Product[] = [
  {
    id: "berry-bottle-charm",
    name: "Berry Bottle Charm",
    category: "Bag Charms",
    price: 349,
    blurb: "Our signature mini bottle, cast in gloss enamel with a crimped metal cap.",
    icon: "GlassWater",
    gradient: ["#d51f1f", "#af7a6e"],
    badge: "Bestseller",
    imageUrl: "/products/berry-bottle-charm.jpg",
  },
  {
    id: "polaroid-cam-charm",
    name: "Polaroid Cam Charm",
    category: "Bag Charms",
    price: 349,
    blurb: "A pocket-sized camera charm with a working spin dial and clip-in flash.",
    icon: "Camera",
    gradient: ["#424240", "#3c2620"],
    badge: "New",
    imageUrl: "/products/polaroid-cam-charm.jpg",
  },
  {
    id: "cat-eye-bag-charm",
    name: "Cat Eye Bag Charm",
    category: "Bag Charms",
    price: 349,
    blurb: "A hand-set cat-eye cabochon charm with a clawed bezel, clipped for any bag.",
    icon: "Gem",
    gradient: ["#af7a6e", "#424240"],
    imageUrl: "/products/cat-eye-bag-charm.jpg",
  },
  {
    id: "cola-duo-charm",
    name: "Cola Duo Charm",
    category: "Bag Charms",
    price: 399,
    blurb: "Two mini soda cans, clipped side by side — share one with a friend.",
    icon: "GlassWater",
    gradient: ["#424240", "#d51f1f"],
    badge: "New",
    imageUrl: "/products/cola-duo-charm.jpg",
  },
  {
    id: "racing-jersey-charm",
    name: "Racing Jersey Charm",
    category: "Bag Charms",
    price: 299,
    blurb: "A mini racing jersey charm for the motorsport fans on your keys.",
    icon: "Trophy",
    gradient: ["#3c2620", "#d51f1f"],
    imageUrl: "/products/racing-jersey-charm.jpg",
  },
  {
    id: "football-jersey-charm",
    name: "Football Jersey Charm",
    category: "Bag Charms",
    price: 299,
    blurb: "A mini kit charm for match day, clipped wherever you carry your colours.",
    icon: "Shirt",
    gradient: ["#af7a6e", "#3c2620"],
    imageUrl: "/products/football-jersey-charm.jpg",
  },
  {
    id: "vinyl-record-charm",
    name: "Vinyl Record Charm",
    category: "Bag Charms",
    price: 299,
    blurb: "A brushed-matte record charm that actually spins on its jump ring.",
    icon: "Disc3",
    gradient: ["#3c2620", "#424240"],
  },
  {
    id: "ticket-stub-charm",
    name: "Ticket Stub Charm",
    category: "Bag Charms",
    price: 279,
    compareAt: 329,
    blurb: "An enamel ticket-stub charm with a hand-stamped serial number.",
    icon: "Ticket",
    gradient: ["#af7a6e", "#3c2620"],
    badge: "Limited",
  },
  {
    id: "carabiner-classic-steel",
    name: "Carabiner — Classic Steel",
    category: "Carabiners",
    price: 249,
    blurb: "A weighted stainless carabiner with a smooth, satisfying spring gate.",
    icon: "Link2",
    gradient: ["#424240", "#3c2620"],
    badge: "Bestseller",
  },
  {
    id: "carabiner-sunset",
    name: "Carabiner — Sunset",
    category: "Carabiners",
    price: 269,
    blurb: "Gradient anodised finish, fading from berry red to warm rose.",
    icon: "Link2",
    gradient: ["#d51f1f", "#af7a6e"],
    badge: "New",
  },
  {
    id: "carabiner-trio-pack",
    name: "Carabiner Trio Pack",
    category: "Carabiners",
    price: 599,
    compareAt: 720,
    blurb: "Three finishes, one pack — steel, espresso, and berry red.",
    icon: "KeyRound",
    gradient: ["#3c2620", "#af7a6e"],
  },
  {
    id: "berry-can-phone-charm",
    name: "Berry Can Phone Charm",
    category: "Phone Charms",
    price: 379,
    blurb: "A miniature soda can on a braided wrist strap, weighted for a good swing.",
    icon: "GlassWater",
    gradient: ["#d51f1f", "#a71414"],
    badge: "Bestseller",
    imageUrl: "/products/berry-can-phone-charm.jpg",
  },
  {
    id: "starstrap-phone-charm",
    name: "Star Strap Phone Charm",
    category: "Phone Charms",
    price: 329,
    blurb: "A pavé star charm on an adjustable beaded strap.",
    icon: "Star",
    gradient: ["#af7a6e", "#424240"],
  },
  {
    id: "heartlace-phone-charm",
    name: "Heartlace Phone Charm",
    category: "Phone Charms",
    price: 329,
    blurb: "Puffed heart charm with a soft lace-braid strap.",
    icon: "Heart",
    gradient: ["#d51f1f", "#af7a6e"],
    badge: "New",
  },
  {
    id: "curb-chain-necklace",
    name: "Curb Chain Necklace",
    category: "Chains & Necklaces",
    price: 799,
    compareAt: 950,
    blurb: "Chunky curb-link chain in brushed steel, ready for your own charms.",
    icon: "Link2",
    gradient: ["#3c2620", "#424240"],
    badge: "Bestseller",
  },
  {
    id: "cherry-drop-necklace",
    name: "Cherry Drop Necklace",
    category: "Chains & Necklaces",
    price: 549,
    blurb: "A fine box chain finished with a single glossy cherry drop.",
    icon: "Sparkles",
    gradient: ["#d51f1f", "#af7a6e"],
  },
  {
    id: "original-berry-tin",
    name: "Original Berry Tin",
    category: "Charm Tins",
    price: 449,
    blurb: "Our signature pocket tin for stashing spare charms and clips.",
    icon: "Package",
    gradient: ["#d51f1f", "#3c2620"],
    badge: "Bestseller",
  },
  {
    id: "midnight-tin",
    name: "Midnight Tin",
    category: "Charm Tins",
    price: 449,
    blurb: "Matte charcoal tin with a brushed steel hinge and mirror lid.",
    icon: "Package",
    gradient: ["#424240", "#3c2620"],
    badge: "New",
  },
];

export const categories: Category[] = [
  "Bag Charms",
  "Charm Tins",
];
