import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { fetchOrderUpdates, markOrdersSeen, type OrderUpdate } from "../lib/api";

interface OrderUpdatesValue {
  updates: OrderUpdate[];
  markSeen: () => Promise<void>;
}

const OrderUpdatesContext = createContext<OrderUpdatesValue>({
  updates: [],
  markSeen: async () => {},
});

// Re-check for news this often while the site is open, on top of every
// page change.
const POLL_MS = 2 * 60 * 1000;

export function OrderUpdatesProvider({ children }: { children: ReactNode }) {
  const { firebaseUser } = useAuth();
  const { pathname } = useLocation();
  const [updates, setUpdates] = useState<OrderUpdate[]>([]);
  // Bumped by markSeen so a check that was already in flight can't bring
  // back the alert the customer just cleared.
  const generation = useRef(0);

  useEffect(() => {
    if (!firebaseUser) return;
    let cancelled = false;
    const load = () => {
      const started = generation.current;
      fetchOrderUpdates()
        .then((data) => {
          if (!cancelled && started === generation.current) setUpdates(data);
        })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [firebaseUser, pathname]);

  const markSeen = useCallback(async () => {
    generation.current += 1;
    setUpdates([]);
    await markOrdersSeen().catch(() => {});
  }, []);

  return (
    <OrderUpdatesContext.Provider value={{ updates: firebaseUser ? updates : [], markSeen }}>
      {children}
    </OrderUpdatesContext.Provider>
  );
}

export function useOrderUpdates() {
  return useContext(OrderUpdatesContext);
}
