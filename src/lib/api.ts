import type { Category, Crop, Product } from "../data/products";
import { auth } from "./firebase";
import { analyticsHeaders } from "./analytics";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...analyticsHeaders(), ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("You need to be signed in for that.");
  const idToken = await user.getIdToken();
  return request<T>(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${idToken}`,
    },
  });
}

export function fetchProducts(category?: Category | null): Promise<Product[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return request<Product[]>(`/products${query}`);
}

export function fetchProduct(id: string): Promise<Product> {
  return request<Product>(`/products/${id}`);
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
  customer: { name: string; email: string; phone?: string };
  items: { productId: string; variantId?: string; quantity: number }[];
}

export interface Order {
  id: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  subtotal: number;
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

export function createProduct(payload: ProductInput) {
  return authRequest<Product>("/admin/products", { method: "POST", body: JSON.stringify(payload) });
}

export function updateProduct(id: string, payload: ProductInput) {
  return authRequest<Product>(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(id: string) {
  return authRequest<void>(`/admin/products/${id}`, { method: "DELETE" });
}

export async function uploadImage(file: File): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("You need to be signed in for that.");
  const form = new FormData();
  form.append("file", file);
  // Not via request(): the browser must set the multipart Content-Type itself.
  const res = await fetch(`${API_BASE}/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    body: form,
  });
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

export interface StorefrontSettings {
  splashEnabled: boolean;
  sliderSlides: Slide[];
  trendingCategories: string[];
  categoryImages: Record<string, string>;
}

// Public: Anyone can read the storefront settings (for the homepage)
export function fetchStorefront() {
  return request<StorefrontSettings>("/storefront");
}

// Admin: Only admins can save storefront settings
export function updateStorefront(payload: StorefrontSettings) {
  return authRequest<StorefrontSettings>("/admin/storefront", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export interface Slide {
  imageUrl: string;
  title: string;
  link: string;
}

export interface StorefrontSettings {
  sliderSlides: Slide[];
  trendingMode: "auto" | "manual";
  trendingCategories: string[];
  categoryImages: Record<string, string>;
  customCategories: string[]; // Stores categories created directly in the admin
}