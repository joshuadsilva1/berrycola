import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock3, ExternalLink, MapPin, RefreshCw, ShoppingBag, Truck } from "lucide-react";
import OrderStatusTracker from "./OrderStatusTracker";
import { fetchMyOrders, syncMyOrderTracking, type Order } from "../lib/api";
import { STATUS_LABELS } from "../lib/orderStatus";
import { useOrderUpdates } from "../context/OrderUpdatesContext";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function trackingPageUrl(url: string | null, trackingId: string) {
  const fallback = `https://shiprocket.co/tracking/${encodeURIComponent(trackingId)}`;
  try {
    const parsed = new URL(url || fallback);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : fallback;
  } catch {
    return fallback;
  }
}

export default function CustomerOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const trackingOpen = searchParams.get("track");
  const { markSeen } = useOrderUpdates();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setError(null);
    try {
      setOrders(await fetchMyOrders());
      return true;
    } catch (err) {
      setError((err as Error).message || "Couldn't load your orders.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders().then((loaded) => { if (loaded) void markSeen(); });
  }, [loadOrders, markSeen]);

  useEffect(() => {
    if (!trackingOpen || loading) return;
    document.getElementById(`order-card-${trackingOpen}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [trackingOpen, loading, orders]);

  const refreshTracking = async (orderId: string) => {
    setRefreshing(orderId);
    setError(null);
    setNotice(null);
    try {
      const updated = await syncMyOrderTracking(orderId);
      setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
      setNotice(`Tracking refreshed for order #${orderId.slice(0, 8).toUpperCase()}.`);
    } catch (err) {
      setError((err as Error).message || "Couldn't refresh tracking.");
    } finally {
      setRefreshing(null);
    }
  };

  return (
    <section className="min-h-screen w-full max-w-4xl mx-auto px-5 sm:px-8 pt-28 pb-20 text-left" aria-labelledby="customer-orders-title">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cola-red">Your BerryCola history</p>
          <h2 id="customer-orders-title" className="font-display text-3xl text-espresso mt-1">My orders</h2>
          <p className="text-sm text-espresso/60 mt-1">Order updates and shipment scans appear here.</p>
        </div>
        <button
          type="button"
          onClick={() => { setLoading(true); void loadOrders(); }}
          disabled={loading || Boolean(refreshing)}
          className="inline-flex items-center gap-2 rounded-full border-2 border-[#1e1a18] bg-[#fbf5e9] px-4 py-2 text-xs font-bold uppercase tracking-wide text-espresso shadow-[0_2px_0_#1e1a18] disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh orders
        </button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-cola-red/30 bg-cola-red/10 px-4 py-3 text-sm text-cola-red">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>}
      {loading && orders.length === 0 && <p className="py-8 text-center text-sm text-espresso/55">Loading your orders…</p>}
      {!loading && !error && orders.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-espresso/20 bg-[#fbf5e9]/70 px-6 py-10 text-center">
          <ShoppingBag className="mx-auto text-cola-red" size={28} />
          <h3 className="font-display text-xl text-espresso mt-3">No orders yet</h3>
          <p className="text-sm text-espresso/60 mt-1">Your placed orders will show up here.</p>
        </div>
      )}

      <div className="space-y-5">
        {orders.map((order) => {
          const lastLocationEvent = order.events.find((event) =>
            event.source === "courier" && (event.location || event.latitude != null || event.longitude != null)
          );
          const latestMapEvent = order.events.find((event) =>
            event.source === "courier" && event.latitude != null && event.longitude != null
          );
          const coordinates = latestMapEvent?.latitude != null && latestMapEvent.longitude != null
            ? { latitude: latestMapEvent.latitude, longitude: latestMapEvent.longitude }
            : null;
          const mapEmbedUrl = coordinates
            ? `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitude - 0.012},${coordinates.latitude - 0.008},${coordinates.longitude + 0.012},${coordinates.latitude + 0.008}&layer=mapnik&marker=${coordinates.latitude}%2C${coordinates.longitude}`
            : null;
          const mapLinkUrl = coordinates
            ? `https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=14/${coordinates.latitude}/${coordinates.longitude}`
            : null;
          const displayedLocation = lastLocationEvent?.location || (
            coordinates ? `Scan coordinates: ${coordinates.latitude}, ${coordinates.longitude}` : "Courier scan location"
          );
          return (
          <article id={`order-card-${order.id}`} key={order.id} className="rounded-3xl border-2 border-[#1e1a18] bg-[#fbf5e9] p-5 sm:p-6 shadow-[0_4px_0_#1e1a18]">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-espresso/10 pb-4">
              <div>
                <p className="font-display text-lg text-espresso">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-espresso/60">
                  <Clock3 size={13} /> Placed {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex rounded-full border border-espresso/15 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-espresso">
                  {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] ?? order.status.replaceAll("_", " ")}
                </span>
                {order.refundStatus && <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Refund {order.refundStatus}</p>}
                <p className="mt-1.5 text-sm font-bold text-espresso">₹{(order.total ?? order.subtotal).toLocaleString("en-IN")}</p>
              </div>
            </header>

            <ul className="py-4 space-y-1.5 text-sm text-espresso/80">
              {order.items.map((item, index) => (
                <li key={`${item.productId}-${item.variantId ?? ""}-${index}`} className="flex justify-between gap-4">
                  <span>{item.quantity} × {item.name ?? item.productId}{item.variantLabel ? ` · ${item.variantLabel}` : ""}</span>
                  <span className="shrink-0">₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>

            <OrderStatusTracker order={order} />

            {order.trackingId && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-expanded={trackingOpen === order.id}
                    onClick={() => setSearchParams((current) => {
                      const next = new URLSearchParams(current);
                      if (next.get("track") === order.id) next.delete("track");
                      else next.set("track", order.id);
                      return next;
                    })}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#1e1a18] bg-cola-red px-4 py-2 text-xs font-bold uppercase tracking-wide text-cream shadow-[0_2px_0_#1e1a18] hover:bg-[#b81d1d]"
                  >
                    <Truck size={13} />
                    {trackingOpen === order.id ? "Hide tracking details" : "Track Package"}
                  </button>
                  <a
                    href={trackingPageUrl(order.trackingUrl, order.trackingId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#1e1a18] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-espresso shadow-[0_2px_0_#1e1a18] hover:bg-[#fbf5e9]"
                  >
                    <ExternalLink size={13} />
                    Track from website
                  </a>
                </div>
                {trackingOpen === order.id && (
                  <button
                    type="button"
                    onClick={() => void refreshTracking(order.id)}
                    disabled={Boolean(refreshing)}
                    className="ml-3 inline-flex items-center gap-2 rounded-full border-2 border-[#1e1a18] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-espresso shadow-[0_2px_0_#1e1a18] disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={refreshing === order.id ? "animate-spin" : ""} />
                    {refreshing === order.id ? "Checking…" : "Refresh tracking"}
                  </button>
                )}
              </div>
            )}

            {trackingOpen === order.id && order.events.length > 0 && (
              <div className="mt-5 border-t border-espresso/10 pt-4">
                <div className="mb-4 rounded-2xl border border-cola-red/20 bg-white px-4 py-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-espresso/55">
                    <MapPin size={13} className="text-cola-red" /> Last scanned location
                  </p>
                  {lastLocationEvent ? (
                    <>
                      <p className="mt-1 break-words text-sm font-semibold text-espresso">
                        {displayedLocation}
                      </p>
                      <p className="mt-0.5 text-xs text-espresso/55">{lastLocationEvent.description} · {formatDate(lastLocationEvent.occurredAt)}</p>
                      {mapEmbedUrl && mapLinkUrl ? (
                        <div className="mt-3 overflow-hidden rounded-xl border border-espresso/10">
                          <iframe
                            title={`Courier scan location for order ${order.id.slice(0, 8)}`}
                            src={mapEmbedUrl}
                            loading="lazy"
                            className="h-52 w-full border-0"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#fbf5e9] px-3 py-2">
                            <span className="text-[10px] text-espresso/55">Map pin shows the scan from {formatDate(latestMapEvent!.occurredAt)}, not continuous live GPS.</span>
                            <a href={mapLinkUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-cola-red hover:underline">
                              Open map
                            </a>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] text-espresso/50">The courier shared the scan location as text, without map coordinates.</p>
                      )}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-espresso/60">The courier hasn’t shared a location scan yet.</p>
                  )}
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-espresso">Latest updates</h3>
                <ol className="mt-3 space-y-3">
                  {order.events.slice(0, 6).map((event) => (
                    <li key={event.id} className="flex gap-3 text-sm">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${event.source === "courier" ? "bg-cola-red" : "bg-espresso/35"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-espresso">{event.description}</p>
                        <p className="text-xs text-espresso/55">{formatDate(event.occurredAt)}</p>
                        {event.location && <p className="mt-0.5 flex items-start gap-1 text-xs text-espresso/65"><MapPin size={12} className="mt-0.5 shrink-0 text-cola-red" /> <span className="break-words">{event.location}</span></p>}
                      </div>
                      {event.source === "courier" && <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-cola-red">Shiprocket</span>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {trackingOpen === order.id && order.events.length === 0 && (
              <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-espresso/60">
                No tracking scans yet. Check back after the courier picks up your package.
              </p>
            )}
          </article>
          );
        })}
      </div>
    </section>
  );
}
