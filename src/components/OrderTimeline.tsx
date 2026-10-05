import { MapPin } from "lucide-react";
import type { OrderEvent } from "../lib/api";

export default function OrderTimeline({ events }: { events: OrderEvent[] }) {
  if (events.length === 0) return null;

  return (
    <ol className="relative flex flex-col gap-4 pl-5">
      <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-espresso/10" />
      {events.map((event, i) => (
        <li key={event.id} className="relative">
          <span
            className={`absolute -left-5 top-1 w-[11px] h-[11px] rounded-full border-2 border-cream ${
              i === 0 ? "bg-cola-red" : "bg-espresso/25"
            }`}
          />
          <p className={`text-sm ${i === 0 ? "text-espresso font-semibold" : "text-espresso/75"}`}>
            {event.description}
          </p>
          <p className="text-xs text-espresso/45 flex flex-wrap items-center gap-x-2">
            {new Date(event.occurredAt).toLocaleString(undefined, {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
            {event.location && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={11} /> {event.location}
              </span>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}
