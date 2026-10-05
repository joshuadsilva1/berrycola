import { useEffect, useState } from "react";
import {
  fetchAdminOrders,
  syncOrderTracking,
  updateOrderTracking,
  type Order,
  type TrackingUpdate,
} from "../../lib/api";
import OrderTimeline from "../../components/OrderTimeline";
import { ORDER_STATUSES, STATUS_LABELS } from "../../lib/orderStatus";
import AdminNav from "../../components/AdminNav";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = (q?: string) => {
    setLoading(true);
    fetchAdminOrders(q ? { q } : undefined)
      .then(setOrders)
      .catch(() => setError("Couldn't load orders."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search.trim() || undefined);
  };

  const replaceOrder = (updated: Order) =>
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

  const handleUpdate = async (id: string, payload: TrackingUpdate) => {
    replaceOrder(await updateOrderTracking(id, payload));
  };

  const handleSync = async (id: string) => {
    replaceOrder(await syncOrderTracking(id));
  };

  return (
    <div className="min-h-screen px-5 sm:px-8 pt-28 pb-20 max-w-6xl mx-auto">
      <AdminNav />
      <h1 className="font-display text-3xl text-espresso mb-6">Orders</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order id, name, or email"
          className="flex-1 border border-espresso/15 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-cola-red bg-cream"
        />
        <button className="px-5 py-2.5 rounded-full bg-cola-red text-cream text-sm font-semibold hover:bg-cola-red-dark">
          Search
        </button>
      </form>

      {loading && <p className="text-espresso/50 text-sm">Loading…</p>}
      {error && <p className="text-cola-red text-sm">{error}</p>}

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <AdminOrderRow key={order.id} order={order} onUpdate={handleUpdate} onSync={handleSync} />
        ))}
        {!loading && orders.length === 0 && (
          <p className="text-espresso/50 text-sm">No orders found.</p>
        )}
      </div>
    </div>
  );
}

function AdminOrderRow({
  order,
  onUpdate,
  onSync,
}: {
  order: Order;
  onUpdate: (id: string, payload: TrackingUpdate) => Promise<void>;
  onSync: (id: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(order.status);
  const [trackingId, setTrackingId] = useState(order.trackingId ?? "");
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Courier updates can change the status and carrier behind the form's back.
  const [lastSeen, setLastSeen] = useState(order);
  if (order !== lastSeen) {
    setLastSeen(order);
    setStatus(order.status);
    setCarrier(order.carrier ?? "");
    setTrackingUrl(order.trackingUrl ?? "");
  }

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      await onSync(order.id);
    } catch (err) {
      setSyncError((err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const dirty =
    status !== order.status ||
    trackingId !== (order.trackingId ?? "") ||
    carrier !== (order.carrier ?? "") ||
    trackingUrl !== (order.trackingUrl ?? "");

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onUpdate(order.id, { status, trackingId, carrier, trackingUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-espresso/10 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <p className="font-display text-espresso">#{order.id.slice(0, 8)}</p>
          <p className="text-xs text-espresso/50">
            {order.customerName} · {order.customerEmail}
            {order.customerPhone ? ` · ${order.customerPhone}` : ""}
          </p>
        </div>
        <span className="text-sm font-semibold text-espresso">₹{order.subtotal}</span>
      </div>

      <ul className="mb-4 flex flex-col gap-1 text-sm text-espresso/80">
        {order.items.map((item, i) => (
          <li key={i}>
            {item.quantity} × {item.name ?? item.productId}
            {item.variantLabel && (
              <span className="font-semibold text-espresso"> — {item.variantLabel}</span>
            )}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-espresso/15 rounded-xl px-3 py-2 text-sm bg-cream"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          placeholder="Carrier (e.g. Delhivery)"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="border border-espresso/15 rounded-xl px-3 py-2 text-sm bg-cream"
        />
        <input
          placeholder="Tracking ID"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          className="border border-espresso/15 rounded-xl px-3 py-2 text-sm bg-cream"
        />
        <input
          placeholder="Tracking URL (optional)"
          value={trackingUrl}
          onChange={(e) => setTrackingUrl(e.target.value)}
          className="border border-espresso/15 rounded-xl px-3 py-2 text-sm bg-cream"
        />
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button
          disabled={!dirty || saving}
          onClick={handleSave}
          className="px-4 py-2 rounded-full bg-cola-red text-cream text-xs font-semibold hover:bg-cola-red-dark disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-xs text-espresso/50">Saved — customer notified</span>}
        {order.trackingId && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 rounded-full border border-espresso/15 text-xs font-semibold text-espresso hover:border-espresso/40 disabled:opacity-40"
          >
            {syncing ? "Checking…" : "Refresh from Shiprocket"}
          </button>
        )}
        {order.events.length > 0 && (
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="ml-auto text-xs font-semibold text-cola-red hover:underline"
          >
            {showHistory ? "Hide history" : `History (${order.events.length})`}
          </button>
        )}
      </div>
      {syncError && <p className="text-cola-red text-xs mt-2">{syncError}</p>}
      {showHistory && (
        <div className="mt-4 pt-4 border-t border-espresso/10">
          <OrderTimeline events={order.events} />
        </div>
      )}
    </div>
  );
}
