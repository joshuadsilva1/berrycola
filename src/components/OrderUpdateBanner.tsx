import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Package, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useOrderUpdates } from "../context/OrderUpdatesContext";

export default function OrderUpdateBanner({ announcementVisible = false }: { announcementVisible?: boolean }) {
  const { updates } = useOrderUpdates();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const updateKey = updates.map((item) => `${item.id}:${item.latest}`).join("|");
  useEffect(() => setDismissed(false), [updateKey]);
  const show = updates.length > 0 && pathname !== "/account" && pathname !== "/orders" && !dismissed;
  const first = updates[0];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className={`fixed ${announcementVisible ? "top-[116px]" : "top-[84px]"} inset-x-0 z-40 flex justify-center px-4 pointer-events-none`}
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-espresso py-1.5 pl-3 pr-2 text-sm text-cream shadow-lg">
            <Link to={`/orders?track=${encodeURIComponent(first.id)}`} className="flex items-center gap-3 hover:text-[#ffdddd]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cola-red"><Package size={15} /></span>
              <span>{updates.length === 1 ? <>Order #{first.id.slice(0, 8)}: <span className="font-semibold">{first.latest}</span></> : <><span className="font-semibold">{updates.length} orders</span> have new updates</>}</span>
              <span className="hidden text-cream/70 sm:inline">View →</span>
            </Link>
            <button type="button" onClick={() => setDismissed(true)} aria-label="Close notification" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-cream/70 hover:bg-white/10 hover:text-white"><X size={14} /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
