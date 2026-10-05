import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchMyOrders, type Order } from "../lib/api";
import { STATUS_LABELS } from "../lib/orderStatus";
import OrderStatusTracker from "../components/OrderStatusTracker";
import OrderTimeline from "../components/OrderTimeline";
import { useOrderUpdates } from "../context/OrderUpdatesContext";

export default function Account() {
  const { profile, signOutUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { markSeen } = useOrderUpdates();

  useEffect(() => {
    fetchMyOrders()
      .then((data) => {
        setOrders(data);
        // They're looking at them now, so clear the site-wide alert.
        markSeen();
      })
      .catch(() => setError("Couldn't load your orders."))
      .finally(() => setLoading(false));
  }, [markSeen]);

  return (
    <div className="min-h-screen px-5 sm:px-8 pt-28 pb-20 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-3xl text-espresso mb-1">
            Hi{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-espresso/60">
            {profile?.email ?? profile?.phone ?? "Your account"}
          </p>
          {profile?.isAdmin && (
            <Link to="/admin/analytics" className="text-sm text-cola-red font-semibold hover:underline mt-2 inline-block">
              Go to admin dashboard →
            </Link>
          )}
        </div>
        <button
          onClick={signOutUser}
          className="text-sm text-espresso/50 hover:text-cola-red shrink-0"
        >
          Sign out
        </button>
      </div>

      <h2 className="font-display text-xl text-espresso mb-4">Your orders</h2>

      {loading && <p className="text-espresso/50 text-sm">Loading…</p>}
      {error && <p className="text-cola-red text-sm">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-espresso/50 text-center">
          <PackageSearch size={36} strokeWidth={1.2} />
          <p>No orders yet.</p>
          <Link to="/shop" className="text-sm font-semibold text-cola-red hover:underline">
            Start shopping
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`border rounded-3xl p-6 ${order.hasUpdate ? "border-cola-red/40" : "border-espresso/10"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <div>
                <p className="font-display text-lg text-espresso">Order #{order.id.slice(0, 8)}</p>
                <p className="text-xs text-espresso/50">
                  {new Date(order.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {order.hasUpdate && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-cream bg-cola-red px-3 py-1.5 rounded-full">
                    New update
                  </span>
                )}
                <span className="text-xs font-semibold uppercase tracking-wide text-espresso/60 bg-espresso/5 px-3 py-1.5 rounded-full">
                  {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] ?? order.status}
                </span>
              </div>
            </div>

            <OrderStatusTracker order={order} />

            {order.events.length > 0 && <OrderHistory order={order} />}

            <div className="mt-6 pt-5 border-t border-espresso/10 flex flex-col gap-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-espresso/80">
                    {item.name ?? item.productId}
                    {item.variantLabel ? ` (${item.variantLabel})` : ""} × {item.quantity}
                  </span>
                  <span className="text-espresso/60">₹{item.unitPrice * item.quantity}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold pt-2">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const COLLAPSED_EVENTS = 3;

function OrderHistory({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const events = expanded ? order.events : order.events.slice(0, COLLAPSED_EVENTS);

  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-espresso/50 mb-3">Tracking updates</p>
      <OrderTimeline events={events} />
      {order.events.length > COLLAPSED_EVENTS && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs font-semibold text-cola-red hover:underline"
        >
          {expanded ? "Show less" : `Show all ${order.events.length} updates`}
        </button>
      )}
    </div>
  );
}
