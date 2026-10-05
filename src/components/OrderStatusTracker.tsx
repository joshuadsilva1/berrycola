import { Check } from "lucide-react";
import { ORDER_STATUS_STEPS, STATUS_LABELS, statusStepIndex } from "../lib/orderStatus";
import type { Order } from "../lib/api";

export default function OrderStatusTracker({ order }: { order: Order }) {
  if (order.status === "cancelled") {
    return (
      <div className="rounded-2xl bg-cola-red/10 text-cola-red text-sm font-medium px-4 py-3">
        Order cancelled
      </div>
    );
  }

  const activeIndex = Math.max(statusStepIndex(order.status), 0);

  return (
    <div>
      <div className="flex items-center">
        {ORDER_STATUS_STEPS.map((step, i) => {
          const done = i <= activeIndex;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                    done ? "bg-cola-red text-cream" : "bg-espresso/10 text-espresso/40"
                  }`}
                >
                  {done ? <Check size={14} /> : i + 1}
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wide text-center w-16 leading-tight ${
                    done ? "text-espresso" : "text-espresso/40"
                  }`}
                >
                  {STATUS_LABELS[step]}
                </span>
              </div>
              {i < ORDER_STATUS_STEPS.length - 1 && (
                <div
                  className={`h-[2px] flex-1 mx-1 mb-4 rounded-full transition-colors ${
                    i < activeIndex ? "bg-cola-red" : "bg-espresso/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {(order.trackingId || order.carrier) && (
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-espresso/70">
          {order.carrier && (
            <span>
              Carrier: <span className="text-espresso font-medium">{order.carrier}</span>
            </span>
          )}
          {order.trackingId && (
            <span>
              Tracking ID:{" "}
              {order.trackingUrl ? (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cola-red font-medium hover:underline"
                >
                  {order.trackingId}
                </a>
              ) : (
                <span className="text-espresso font-medium">{order.trackingId}</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
