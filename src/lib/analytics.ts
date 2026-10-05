// First-party analytics. Events are queued and sent in small batches (and
// flushed with sendBeacon when the tab is hidden, so nothing is lost when a
// shopper leaves). Visitors are an anonymous random id kept in the browser;
// a session ends after 30 minutes without activity.

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001/api";
const ENDPOINT = `${API_BASE}/analytics/events`;
const VISITOR_KEY = "bc-visitor";
const SESSION_KEY = "bc-session";
const SESSION_GAP_MS = 30 * 60 * 1000;
const FLUSH_MS = 4000;

interface QueuedEvent {
  name: string;
  path: string;
  productId?: string;
  value?: number;
  props?: Record<string, string | number | boolean | null | undefined>;
}

interface SessionState {
  id: string;
  last: number;
  referrer: string | null;
  utm: { source?: string; medium?: string; campaign?: string };
}

let enabled = true;
let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
// In-memory fallbacks for when storage is blocked (private mode etc).
let memoryVisitor: string | null = null;
let memorySession: SessionState | null = null;
// document.referrer describes how this page load began, so only the first
// session of a page load may claim it.
let referrerUsed = false;

function randomId() {
  return crypto.randomUUID?.().replace(/-/g, "") ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked — the in-memory copy still works for this page load.
  }
}

function visitorId(): string {
  const stored = readStorage(VISITOR_KEY) ?? memoryVisitor;
  if (stored) return stored;
  const id = randomId();
  memoryVisitor = id;
  writeStorage(VISITOR_KEY, id);
  return id;
}

function utmFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") ?? params.get("ref") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
  };
}

// Current session, starting a new one after a long gap or when the visitor
// arrives from a new campaign link.
function session(): SessionState {
  const now = Date.now();
  let current = memorySession;
  const raw = readStorage(SESSION_KEY);
  if (raw) {
    try {
      current = JSON.parse(raw) as SessionState;
    } catch {
      current = null;
    }
  }
  const utm = utmFromUrl();
  const newCampaign = utm.source && utm.source !== current?.utm.source;
  if (!current || now - current.last > SESSION_GAP_MS || newCampaign) {
    current = { id: randomId(), last: now, referrer: referrerUsed ? null : document.referrer || null, utm };
  }
  referrerUsed = true;
  current.last = now;
  memorySession = current;
  writeStorage(SESSION_KEY, JSON.stringify(current));
  return current;
}

/** Ids sent with API calls so server-side events (orders, sign-ups) join up
 * with the shopper's browsing. */
export function analyticsHeaders(): Record<string, string> {
  if (!enabled) return {};
  return { "X-Visitor-Id": visitorId(), "X-Session-Id": session().id };
}

/** Admins browsing their own shop shouldn't skew the numbers. */
export function setAnalyticsEnabled(value: boolean) {
  enabled = value;
  if (!value) queue = [];
}

function flush(useBeacon = false) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!queue.length || !enabled) return;
  const current = session();
  const body = JSON.stringify({
    visitorId: visitorId(),
    sessionId: current.id,
    context: { referrer: current.referrer, utm: current.utm },
    events: queue.splice(0, 50),
  });
  // text/plain keeps this a "simple" request: no CORS preflight, and
  // sendBeacon is allowed to send it while the page unloads.
  const blob = new Blob([body], { type: "text/plain" });
  if (useBeacon && navigator.sendBeacon?.(ENDPOINT, blob)) return;
  fetch(ENDPOINT, { method: "POST", body: blob, keepalive: true }).catch(() => {});
}

export function track(name: string, data: Omit<QueuedEvent, "name" | "path"> = {}) {
  if (!enabled || typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return;
  queue.push({ name, path, ...data });
  if (queue.length >= 20) flush();
  else if (!timer) timer = setTimeout(() => flush(), FLUSH_MS);
}

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
  window.addEventListener("pagehide", () => flush(true));
}
