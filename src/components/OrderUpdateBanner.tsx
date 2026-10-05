import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Package } from "lucide-react";
import { useOrderUpdates } from "../context/OrderUpdatesContext";

export default function OrderUpdateBanner() {
  const { updates } = useOrderUpdates();
  const { pathname } = useLocation();
  const show = updates.length > 0 && pathname !== "/account";
  const first = updates[0];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed top-[84px] inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
        >
          <Link
            to="/account"
            className="pointer-events-auto flex items-center gap-3 bg-espresso text-cream rounded-full pl-3 pr-5 py-2.5 shadow-lg text-sm hover:bg-cola-red transition-colors"
          >
            <span className="w-7 h-7 rounded-full bg-cola-red flex items-center justify-center shrink-0">
              <Package size={15} />
            </span>
            <span>
              {updates.length === 1 ? (
                <>
                  Order #{first.id.slice(0, 8)}: <span className="font-semibold">{first.latest}</span>
                </>
              ) : (
                <>
                  <span className="font-semibold">{updates.length} orders</span> have new updates
                </>
              )}
            </span>
            <span className="text-cream/70 hidden sm:inline">View →</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
