import { useCallback, useEffect, useState } from "react";
import { Clock3, RefreshCw, ShoppingBag, Truck } from "lucide-react";
import OrderStatusTracker from "./OrderStatusTracker";
import { fetchMyOrders, syncMyOrderTracking, type Order } from "../lib/api";
import { STATUS_LABELS } from "../lib/orderStatus";

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

export default function CustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setError(null);
    try {
      setOrders(await fetchMyOrders());
    } catch (err) {
      setError((err as Error).message || "Couldn't load your orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

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
    <section className="w-full max-w-4xl mx-auto mt-12 text-left" aria-labelledby="customer-orders-title">
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
        {orders.map((order) => (
          <article key={order.id} className="rounded-3xl border-2 border-[#1e1a18] bg-[#fbf5e9] p-5 sm:p-6 shadow-[0_4px_0_#1e1a18]">
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

            {order.trackingId && order.status !== "delivered" && order.status !== "cancelled" && (
              <button
                type="button"
                onClick={() => void refreshTracking(order.id)}
                disabled={Boolean(refreshing)}
                className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-[#1e1a18] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-espresso shadow-[0_2px_0_#1e1a18] disabled:opacity-50"
              >
                {refreshing === order.id ? <RefreshCw size={13} className="animate-spin" /> : <Truck size={13} />}
                {refreshing === order.id ? "Checking Shiprocket…" : "Refresh shipment tracking"}
              </button>
            )}

            {order.events.length > 0 && (
              <div className="mt-5 border-t border-espresso/10 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-espresso">Latest updates</h3>
                <ol className="mt-3 space-y-3">
                  {order.events.slice(0, 6).map((event) => (
                    <li key={event.id} className="flex gap-3 text-sm">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${event.source === "courier" ? "bg-cola-red" : "bg-espresso/35"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-espresso">{event.description}</p>
                        <p className="text-xs text-espresso/55">{formatDate(event.occurredAt)}{event.location ? ` · ${event.location}` : ""}</p>
                      </div>
                      {event.source === "courier" && <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-cola-red">Shiprocket</span>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
