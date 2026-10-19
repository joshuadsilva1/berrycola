import type { Category, Crop, Product } from "../data/products";
import { auth } from "./firebase";

function resolveApiBase(): string {
  const candidates = [import.meta.env.API_BASE_URL, import.meta.env.VITE_API_BASE_URL];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim() && c.trim() !== "undefined") {
      return c.trim().replace(/\/+$/, "");
    }
  }
  return "https://berrycola-backend.onrender.com/api";
}

const API_BASE = resolveApiBase();

export function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("icon:") || trimmed.startsWith("data:")) return trimmed;
  const match = trimmed.match(/\/api\/uploads\/([^?#]+)/);
  if (match?.[1]) {
    return `${API_BASE}/uploads/${match[1]}`;
  }
  return trimmed;
}

function normalizeProduct(p: Product): Product {
  return {
    ...p,
    imageUrl: resolveImageUrl(p.imageUrl),
    variants: p.variants?.map((v) => ({
      ...v,
      imageUrl: resolveImageUrl(v.imageUrl) ?? null,
    })),
    gallery: p.gallery?.map((g) => ({
      ...g,
      imageUrl: resolveImageUrl(g.imageUrl) ?? null,
    })),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (init?.body) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!auth.currentUser && typeof (auth as any).authStateReady === "function") {
    await (auth as any).authStateReady();
  }
  const user = auth.currentUser;
  if (!user) throw new Error("You need to be signed in for that.");
  const idToken = await user.getIdToken();
  try {
    return await request<T>(path, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${idToken}`,
      },
    });
  } catch (err) {
    if ((err as Error).message?.includes("401") || (err as Error).message?.toLowerCase().includes("expired")) {
      const freshToken = await user.getIdToken(true);
      return request<T>(path, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${freshToken}`,
        },
      });
    }
    throw err;
  }
}

export async function fetchProducts(category?: Category | null): Promise<Product[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const list = await request<Product[]>(`/products${query}`);
  return list.map(normalizeProduct);
}

export async function fetchProduct(id: string): Promise<Product> {
  const item = await request<Product>(`/products/${id}`);
  return normalizeProduct(item);
}

export function fetchCategories(): Promise<Category[]> {
  return request<Category[]>("/categories");
}

export function submitContact(payload: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) {
  return request("/contact", { method: "POST", body: JSON.stringify(payload) });
}

export function subscribeNewsletter(email: string) {
  return request("/newsletter", { method: "POST", body: JSON.stringify({ email }) });
}

export interface OrderPayload {
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items: { productId: string; variantId?: string; quantity: number }[];
  promoCode?: string;
}

export interface Order {
  id: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress?: string | null;
  subtotal: number;
  promoCode?: string | null;
  discountAmount?: number;
  discountTotal?: number;
  total?: number;
  status: string;
  carrier: string | null;
  trackingId: string | null;
  trackingUrl: string | null;
  createdAt: string;
  items: {
    productId: string;
    name: string | null;
    variantId: string | null;
    variantLabel: string | null;
    quantity: number;
    unitPrice: number;
  }[];
  // Newest first.
  events: OrderEvent[];
  // Something happened since the customer last opened their orders.
  hasUpdate: boolean;
}

export interface OrderEvent {
  id: number;
  status: string | null;
  description: string;
  location: string | null;
  source: "admin" | "courier";
  occurredAt: string;
}

export interface OrderUpdate {
  id: string;
  status: string;
  latest: string;
}

export function placeOrder(payload: OrderPayload) {
  return authRequest<Order>("/orders", { method: "POST", body: JSON.stringify(payload) });
}

export function fetchMyOrders() {
  return authRequest<Order[]>("/orders/mine");
}

export function fetchOrderUpdates() {
  return authRequest<OrderUpdate[]>("/orders/mine/updates");
}

export function markOrdersSeen() {
  return authRequest<void>("/orders/mine/seen", { method: "POST" });
}

export function fetchOrder(id: string) {
  return authRequest<Order>(`/orders/${id}`);
}

export function syncSession() {
  return authRequest("/auth/session", { method: "POST" });
}

export function fetchMe() {
  return authRequest("/me");
}

export interface ProfileUpdateInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
}

export function updateMyProfile(payload: ProfileUpdateInput) {
  return authRequest("/me", { method: "PATCH", body: JSON.stringify(payload) });
}

export function fetchAdminOrders(params?: { status?: string; q?: string }) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.q) search.set("q", params.q);
  const query = search.toString();
  return authRequest<Order[]>(`/admin/orders${query ? `?${query}` : ""}`);
}

export interface TrackingUpdate {
  status?: string;
  trackingId?: string;
  carrier?: string;
  trackingUrl?: string;
}

export function updateOrderTracking(id: string, payload: TrackingUpdate) {
  return authRequest<Order>(`/admin/orders/${id}/tracking`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function syncOrderTracking(id: string) {
  return authRequest<Order>(`/admin/orders/${id}/sync`, { method: "POST" });
}

export interface ProductInput {
  name?: string;
  category?: string;
  price?: number;
  compareAt?: number | null;
  blurb?: string;
  badge?: string | null;
  imageUrl?: string | null;
  imageLabel?: string | null;
  inStock?: boolean;
  variants?: ImageInput[];
  gallery?: ImageInput[];
  stockQuantity?: number | null;
  sortOrder?: number;
  deliveryMinDays?: number | null;
  deliveryMaxDays?: number | null;
  deliveryMinDate?: string | null;
  deliveryMaxDate?: string | null;
}

export interface ImageInput {
  id?: string;
  label: string;
  imageUrl?: string | null;
  crop?: Crop | null;
  // Options only.
  price?: number | null;
  inStock?: boolean;
}

export async function createProduct(payload: ProductInput) {
  return normalizeProduct(
    await authRequest<Product>("/admin/products", { method: "POST", body: JSON.stringify(payload) }),
  );
}

export async function updateProduct(id: string, payload: ProductInput) {
  return normalizeProduct(
    await authRequest<Product>(`/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  );
}

export async function reorderProducts(orderedIds: string[]) {
  const list = await authRequest<Product[]>("/admin/products/reorder", {
    method: "POST",
    body: JSON.stringify({ orderedIds }),
  });
  return list.map(normalizeProduct);
}

export function deleteProduct(id: string) {
  return authRequest<void>(`/admin/products/${id}`, { method: "DELETE" });
}

async function normalizeImageFile(file: File): Promise<File> {
  const validExt = /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name);
  if (validExt && file.size <= 5 * 1024 * 1024) {
    return file;
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 2200;
      let w = img.naturalWidth || 1000;
      let h = img.naturalHeight || 1000;
      if (w > maxDim || h > maxDim) {
        const scale = Math.min(maxDim / w, maxDim / h);
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const isPng = file.type === "image/png" || /\.png$/i.test(file.name);
      const mime = isPng ? "image/png" : "image/jpeg";
      const ext = isPng ? "png" : "jpg";
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = (file.name || "photo").replace(/\.[^.]+$/, "");
          resolve(new File([blob], `${baseName}.${ext}`, { type: mime }));
        },
        mime,
        0.92,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export async function uploadImage(file: File): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("You need to be signed in for that.");
  const prepared = await normalizeImageFile(file);
  const form = new FormData();
  form.append("file", prepared);
  let res: Response;
  try {
    // Not via request(): the browser must set the multipart Content-Type itself.
    res = await fetch(`${API_BASE}/admin/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      body: form,
    });
  } catch {
    throw new Error(`Could not connect to backend (${API_BASE}). Make sure "python run.py" is running.`);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Upload failed: ${res.status}`);
  return body.url;
}

export type AnalyticsRange = "today" | "7d" | "30d" | "90d" | "12m";

export interface LabelValue {
  label: string;
  value: number;
}

export interface AnalyticsKpis {
  visitors: number;
  sessions: number;
  pageviews: number;
  pagesPerSession: number | null;
  bounceRate: number | null;
  avgSessionSeconds: number | null;
  orders: number;
  revenue: number;
  avgOrderValue: number | null;
  conversionRate: number | null;
  addToCartRate: number | null;
  cartAbandonmentRate: number | null;
  signUps: number;
  newsletterSignups: number;
  contactMessages: number;
}

export interface AnalyticsReport {
  range: AnalyticsRange;
  start: string;
  end: string;
  granularity: "hour" | "day";
  kpis: AnalyticsKpis;
  previous: AnalyticsKpis;
  timeseries: { date: string; visitors: number; pageviews: number; orders: number; revenue: number }[];
  funnel: LabelValue[];
  pages: { path: string; views: number; visitors: number }[];
  landingPages: LabelValue[];
  products: {
    id: string;
    name: string;
    imageUrl: string | null;
    views: number;
    viewers: number;
    addToCarts: number;
    units: number;
    revenue: number;
    cartRate: number | null;
  }[];
  categoryRevenue: LabelValue[];
  optionsSold: LabelValue[];
  imageViews: LabelValue[];
  optionPicks: LabelValue[];
  sources: { label: string; sessions: number; orders: number; conversionRate: number | null }[];
  campaigns: LabelValue[];
  devices: LabelValue[];
  browsers: LabelValue[];
  os: LabelValue[];
  countries: LabelValue[];
  newVsReturning: { new: number; returning: number };
  heatmap: number[][];
  orderStatus: LabelValue[];
  fulfilment: { avgHoursToShip: number | null; avgHoursToDeliver: number | null; awaitingShipment: number };
  customers: {
    total: number;
    newInRange: number;
    withOrders: number;
    repeat: number;
    repeatRate: number | null;
    top: { name: string; email: string | null; orders: number; spend: number }[];
  };
  totals: { newsletterSubscribers: number; contactMessages: number; products: number; outOfStock: number };
}

export interface LiveAnalytics {
  activeVisitors: number;
  activePages: LabelValue[];
  feed: {
    id: number;
    name: string;
    path: string | null;
    product: string | null;
    label: string | null;
    value: number | null;
    device: string | null;
    source: string;
    country: string | null;
    at: string;
  }[];
}

export function fetchAnalytics(range: AnalyticsRange) {
  return authRequest<AnalyticsReport>(`/admin/analytics?range=${range}`);
}

export function fetchLiveAnalytics() {
  return authRequest<LiveAnalytics>("/admin/analytics/live");
}

export interface AdminCustomer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
  joinedAt: string | null;
  orders: number;
  spend: number;
  lastOrderAt: string | null;
}

export function fetchCustomers() {
  return authRequest<AdminCustomer[]>("/admin/customers");
}

export interface AdminMessages {
  messages: { id: number; name: string; email: string; subject: string | null; message: string; createdAt: string | null }[];
  subscribers: { email: string; createdAt: string | null }[];
}

export function fetchMessages() {
  return authRequest<AdminMessages>("/admin/messages");




}


// --- STOREFRONT TYPES & API ---
export interface Slide {
  imageUrl: string;
  title: string;
  link: string;
}

export interface StaticDetailItem {
  id: string;
  icon: "Truck" | "ShieldCheck" | "RotateCcw" | "Clock" | "Sparkles";
  title: string;
  description: string;
}

export interface ProductPageDetails {
  defaultDeliveryMinDays?: number | null;
  defaultDeliveryMaxDays?: number | null;
  defaultDeliveryMinDate?: string | null;
  defaultDeliveryMaxDate?: string | null;
  shippingNote?: string;
  returnPolicy?: string;
  warrantyNote?: string;
  customItems?: StaticDetailItem[];
}

export interface StorefrontSettings {
  splashEnabled?: boolean;
  sliderSlides: Slide[];
  trendingMode: "auto" | "manual";
  trendingCategories: string[];
  categoryImages: Record<string, string>;
  customCategories: string[]; // Stores categories created directly in the admin
  productPageDetails?: ProductPageDetails;
}

function normalizeStorefront(s: StorefrontSettings): StorefrontSettings {
  const categoryImages: Record<string, string> = {};
  for (const [k, v] of Object.entries(s.categoryImages ?? {})) {
    categoryImages[k] = resolveImageUrl(v) ?? v;
  }
  return {
    ...s,
    sliderSlides: (s.sliderSlides ?? []).map((slide) => ({
      ...slide,
      imageUrl: resolveImageUrl(slide.imageUrl) ?? slide.imageUrl,
    })),
    categoryImages,
  };
}

// Public: Anyone can read the storefront settings (for the homepage)
export async function fetchStorefront(): Promise<StorefrontSettings> {
  const s = await request<StorefrontSettings>("/storefront");
  return normalizeStorefront(s);
}

// Admin: Only admins can save storefront settings
export async function updateStorefront(payload: Partial<StorefrontSettings>): Promise<StorefrontSettings> {
  const s = await authRequest<StorefrontSettings>("/admin/storefront", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return normalizeStorefront(s);
}


// --- PROMO CODES ---
export interface PromoCode {
  id: number;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number | null;
  isActive: boolean;
  expiresAt: string | null;
  usageCount: number;
  createdAt: string;
}

export function fetchAdminPromos() {
  return authRequest<PromoCode[]>("/admin/promos");
}

export function createPromo(payload: Partial<PromoCode>) {
  return authRequest<PromoCode>("/admin/promos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePromo(id: number, payload: Partial<PromoCode>) {
  return authRequest<PromoCode>(`/admin/promos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deletePromo(id: number) {
  return authRequest<void>(`/admin/promos/${id}`, { method: "DELETE" });
}

export function validatePromo(code: string, subtotal: number) {
  return request<{code: string, discountAmount: number}>("/promos/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotal })
  });
}

// --- REVIEWS (VERIFIED BUYERS) ---
export interface ReviewItem {
  id: number;
  productId: string;
  productName?: string | null;
  userId?: string | null;
  orderId?: string | null;
  authorName: string;
  rating: number;
  title?: string | null;
  body: string;
  imageUrl?: string | null;
  verifiedPurchase: boolean;
  createdAt: string | null;
}

export interface ProductReviewsResponse {
  reviews: ReviewItem[];
  averageRating: number;
  totalCount: number;
  hasPurchased?: boolean;
  alreadyReviewed?: boolean;
  canReview?: boolean;
}

export function fetchAllReviews(productId?: string) {
  const q = productId ? `?productId=${encodeURIComponent(productId)}` : "";
  return request<ProductReviewsResponse>(`/reviews${q}`);
}

export async function fetchProductReviews(productId: string): Promise<ProductReviewsResponse> {
  const user = auth.currentUser;
  if (user) {
    try {
      const idToken = await user.getIdToken();
      return await request<ProductReviewsResponse>(`/products/${encodeURIComponent(productId)}/reviews`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
    } catch {
      // Fall back to unauthenticated fetch
    }
  }
  return request<ProductReviewsResponse>(`/products/${encodeURIComponent(productId)}/reviews`);
}

export function createProductReview(
  productId: string,
  payload: {
    rating: number;
    title?: string;
    body: string;
    imageUrl?: string;
    authorName?: string;
  }
) {
  return authRequest<ReviewItem>(`/products/${encodeURIComponent(productId)}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadReviewImage(file: File): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in to upload a review photo.");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/reviews/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Upload failed: ${res.status}`);
  return body.url;
}

export function deleteReview(reviewId: number) {
  return authRequest<void>(`/reviews/${reviewId}`, { method: "DELETE" });
}