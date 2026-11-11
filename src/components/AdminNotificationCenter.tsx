import { useEffect, useMemo, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchAdminNotifications, type AdminNotification } from "../lib/api";

const STORAGE_KEY = "bc-admin-dismissed-notifications";

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export default function AdminNotificationCenter() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(readDismissed);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () => fetchAdminNotifications().then((rows) => {
      if (active) setItems(rows);
    }).catch(() => {});
    load();
    const timer = window.setInterval(load, 2 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const visible = useMemo(() => items.filter((item) => !dismissed.includes(item.id)), [items, dismissed]);

  const dismiss = (id: string) => {
    setDismissed((current) => {
      const next = Array.from(new Set([...current, id])).slice(-150);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const dismissAll = () => {
    setDismissed((current) => {
      const next = Array.from(new Set([...current, ...visible.map((item) => item.id)])).slice(-150);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`Admin notifications${visible.length ? `, ${visible.length} unread` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1e1a18] bg-[#fbf5e9] text-espresso shadow-[0_2px_0_#1e1a18]"
      >
        <Bell size={16} />
        {visible.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-cola-red px-1 text-[10px] font-bold text-white">{visible.length > 9 ? "9+" : visible.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(90vw,360px)] rounded-2xl border-2 border-[#1e1a18] bg-[#fbf5e9] p-3 text-espresso shadow-[0_5px_0_#1e1a18]">
          <div className="flex items-center justify-between px-1 pb-2">
            <h2 className="font-display text-lg">Admin notifications</h2>
            {visible.length > 0 && <button type="button" onClick={dismissAll} className="text-[10px] font-bold uppercase text-cola-red">Clear all</button>}
          </div>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {visible.map((item) => (
              <div key={item.id} className="flex items-start gap-2 rounded-xl border border-espresso/10 bg-white p-3">
                <Link to={item.kind === "message" ? "/admin/messages" : "/admin/orders"} onClick={() => { dismiss(item.id); setOpen(false); }} className="min-w-0 flex-1">
                  <span className="block text-xs font-bold">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-espresso/65">{item.detail}</span>
                  {item.createdAt && <time className="mt-1 block text-[10px] text-espresso/45">{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time>}
                </Link>
                <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(item.id)} className="shrink-0 rounded-full p-1 text-espresso/45 hover:bg-espresso/5 hover:text-espresso"><X size={14} /></button>
              </div>
            ))}
            {visible.length === 0 && <p className="px-2 py-6 text-center text-sm text-espresso/55">You're all caught up.</p>}
          </div>
          <button type="button" onClick={() => setOpen(false)} className="mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-espresso px-3 py-2 text-xs font-semibold text-cream"><Check size={13} /> Done</button>
        </div>
      )}
    </div>
  );
}
