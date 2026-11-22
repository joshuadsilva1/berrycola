import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import type { OrderEvent } from "../lib/api";
import Pagination from "./Pagination";

export default function OrderTimeline({ events }: { events: OrderEvent[] }) {
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(events.length / perPage));
  useEffect(() => setPage((current) => Math.min(current, totalPages)), [totalPages]);
  if (events.length === 0) return null;

  return (
    <div>
    <ol className="relative flex flex-col gap-4 pl-5">
      <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-espresso/10" />
      {events.slice((page - 1) * perPage, page * perPage).map((event, i) => {
        const isLatest = page === 1 && i === 0;
        return (
        <li key={event.id} className="relative">
          <span
            className={`absolute -left-5 top-1 w-[11px] h-[11px] rounded-full border-2 border-cream ${
              isLatest ? "bg-cola-red" : "bg-espresso/25"
            }`}
          />
          <p className={`text-sm ${isLatest ? "text-espresso font-semibold" : "text-espresso/75"}`}>
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
        );
      })}
    </ol>
    <Pagination currentPage={page} totalPages={totalPages} totalItems={events.length} perPage={perPage} onPageChange={setPage} itemLabel="updates" />
    </div>
  );
}
