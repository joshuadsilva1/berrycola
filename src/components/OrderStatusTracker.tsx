import { Check, Truck } from "lucide-react";
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
  const latestCourierUpdate = order.events.find((event) => event.source === "courier");

  return (
    <div>
      {/* Progress Bar Status Steps */}
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

      {/* Shiprocket Tracking Section */}
      {(order.trackingId || order.carrier) && (
        <div className="mt-6 p-4 rounded-xl border border-espresso/10 bg-white shadow-sm">
          <div>
            <h4 className="text-xs font-bold uppercase text-espresso tracking-wide flex items-center gap-1.5">
              <Truck size={14} className="text-cola-red" /> 
              Shipping Details
            </h4>
            <div className="mt-1 text-[11px] text-espresso/70 flex flex-col gap-0.5">
              {order.carrier && (
                <span>Carrier: <span className="font-semibold text-espresso">{order.carrier}</span></span>
              )}
              {order.trackingId && (
                <span>Tracking ID: <span className="font-semibold text-espresso">{order.trackingId}</span></span>
              )}
            </div>
          </div>
          {latestCourierUpdate && (
            <div className="mt-3 rounded-lg bg-[#fbf5e9] px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-cola-red">Latest shipment update</p>
              <p className="mt-0.5 text-sm font-semibold text-espresso">{latestCourierUpdate.description}</p>
              {(latestCourierUpdate.location || latestCourierUpdate.occurredAt) && (
                <p className="mt-0.5 text-xs text-espresso/55">
                  {latestCourierUpdate.location}{latestCourierUpdate.location && latestCourierUpdate.occurredAt ? " · " : ""}
                  {latestCourierUpdate.occurredAt ? new Date(latestCourierUpdate.occurredAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : ""}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
