import { useEffect, useState } from "react";
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Check,
} from "lucide-react";
import {
  fetchStorefront,
  updateStorefront,
  type ProductPageDetails,
  type StaticDetailItem,
} from "../../lib/api";

const ICON_OPTIONS: {
  value: StaticDetailItem["icon"];
  label: string;
  Icon: typeof Truck;
}[] = [
  { value: "Truck", label: "Shipping Truck", Icon: Truck },
  { value: "RotateCcw", label: "Returns Arrow", Icon: RotateCcw },
  { value: "ShieldCheck", label: "Shield Check", Icon: ShieldCheck },
  { value: "Clock", label: "Delivery Clock", Icon: Clock },
  { value: "Sparkles", label: "Sparkles", Icon: Sparkles },
];

export default function ProductPageDetailsEditor() {
  const [details, setDetails] = useState<ProductPageDetails>({
    defaultDeliveryMinDays: null,
    defaultDeliveryMaxDays: null,
    defaultDeliveryMinDate: "",
    defaultDeliveryMaxDate: "",
    shippingNote: "",
    returnPolicy: "",
    warrantyNote: "",
    customItems: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStorefront()
      .then((sf) => {
        const d = sf.productPageDetails || {};
        setDetails({
          defaultDeliveryMinDays: d.defaultDeliveryMinDays ?? null,
          defaultDeliveryMaxDays: d.defaultDeliveryMaxDays ?? null,
          defaultDeliveryMinDate: d.defaultDeliveryMinDate ?? "",
          defaultDeliveryMaxDate: d.defaultDeliveryMaxDate ?? "",
          shippingNote: d.shippingNote ?? "",
          returnPolicy: d.returnPolicy ?? "",
          warrantyNote: d.warrantyNote ?? "",
          customItems: d.customItems ?? [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedToast(false);
    try {
      await updateStorefront({
        productPageDetails: {
          defaultDeliveryMinDays:
            details.defaultDeliveryMinDays != null &&
            String(details.defaultDeliveryMinDays) !== ""
              ? Number(details.defaultDeliveryMinDays)
              : null,
          defaultDeliveryMaxDays:
            details.defaultDeliveryMaxDays != null &&
            String(details.defaultDeliveryMaxDays) !== ""
              ? Number(details.defaultDeliveryMaxDays)
              : null,
          defaultDeliveryMinDate: details.defaultDeliveryMinDate?.trim() || null,
          defaultDeliveryMaxDate: details.defaultDeliveryMaxDate?.trim() || null,
          shippingNote: details.shippingNote?.trim() || "",
          returnPolicy: details.returnPolicy?.trim() || "",
          warrantyNote: details.warrantyNote?.trim() || "",
          customItems: details.customItems ?? [],
        },
      });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch (err: any) {
      setError(err?.message || "Failed to save product page details.");
    } finally {
      setSaving(false);
    }
  };

  const addCustomItem = () => {
    const nextItem: StaticDetailItem = {
      id: `detail-${Date.now()}`,
      icon: "Sparkles",
      title: "",
      description: "",
    };
    setDetails((prev) => ({
      ...prev,
      customItems: [...(prev.customItems ?? []), nextItem],
    }));
  };

  const updateCustomItem = (
    index: number,
    patch: Partial<StaticDetailItem>
  ) => {
    setDetails((prev) => {
      const list = [...(prev.customItems ?? [])];
      list[index] = { ...list[index], ...patch };
      return { ...prev, customItems: list };
    });
  };

  const removeCustomItem = (index: number) => {
    setDetails((prev) => ({
      ...prev,
      customItems: (prev.customItems ?? []).filter((_, i) => i !== index),
    }));
  };

  const inputClass =
    "w-full border-2 border-[#1e1a18] rounded-xl px-3.5 py-2.5 text-sm bg-white text-espresso focus:outline-none focus:border-cola-red";
  const labelClass =
    "flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-espresso/75";

  if (loading) {
    return (
      <div className="p-6 text-sm text-espresso/50">
        Loading product page static details…
      </div>
    );
  }

  return (
    <section className="bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_5px_0_#1e1a18] rounded-3xl p-6 sm:p-8">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-[#1e1a18]/20 pb-4">
          <div>
            <h2 className="font-display text-2xl text-espresso">
              Product Page Static Details
            </h2>
            <p className="text-xs text-espresso/65 mt-1">
              Configure the default shipping window, return policy, and static info rows displayed under every product page.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 hover:bg-[#b81d1d] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          >
            {savedToast ? <Check size={15} /> : <Save size={15} />}
            {saving ? "Saving…" : savedToast ? "Saved!" : "Save Details"}
          </button>
        </div>

        {/* Default Delivery Time & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <label className={labelClass}>
            Default Min Delivery (Days)
            <input
              type="number"
              min={0}
              placeholder="e.g. 3"
              value={details.defaultDeliveryMinDays ?? ""}
              onChange={(e) =>
                setDetails((d) => ({
                  ...d,
                  defaultDeliveryMinDays:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Default Max Delivery (Days)
            <input
              type="number"
              min={0}
              placeholder="e.g. 5"
              value={details.defaultDeliveryMaxDays ?? ""}
              onChange={(e) =>
                setDetails((d) => ({
                  ...d,
                  defaultDeliveryMaxDays:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Default Min Delivery Date
            <input
              type="date"
              value={details.defaultDeliveryMinDate ?? ""}
              onChange={(e) =>
                setDetails((d) => ({
                  ...d,
                  defaultDeliveryMinDate: e.target.value,
                }))
              }
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Default Max Delivery Date
            <input
              type="date"
              value={details.defaultDeliveryMaxDate ?? ""}
              onChange={(e) =>
                setDetails((d) => ({
                  ...d,
                  defaultDeliveryMaxDate: e.target.value,
                }))
              }
              className={inputClass}
            />
          </label>
        </div>

        {/* Standard Static Policy Lines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className={labelClass}>
            Shipping Policy Text
            <input
              type="text"
              placeholder="e.g. Free shipping on orders over ₹999"
              value={details.shippingNote ?? ""}
              onChange={(e) =>
                setDetails((d) => ({ ...d, shippingNote: e.target.value }))
              }
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Return &amp; Exchange Policy
            <input
              type="text"
              placeholder="e.g. Easy 7-day returns & exchanges"
              value={details.returnPolicy ?? ""}
              onChange={(e) =>
                setDetails((d) => ({ ...d, returnPolicy: e.target.value }))
              }
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Quality / Care Note
            <input
              type="text"
              placeholder="e.g. Tarnish-resistant, everyday wear tested"
              value={details.warrantyNote ?? ""}
              onChange={(e) =>
                setDetails((d) => ({ ...d, warrantyNote: e.target.value }))
              }
              className={inputClass}
            />
          </label>
        </div>

        {/* Custom Additional Static Rows */}
        <div className="pt-2 border-t border-[#1e1a18]/15 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-espresso/75">
              Additional Static Detail Rows
            </span>
            <button
              type="button"
              onClick={addCustomItem}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 text-xs font-semibold text-espresso hover:text-cola-red cursor-pointer"
            >
              <Plus size={13} />
              Add Row
            </button>
          </div>

          {(details.customItems ?? []).map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-2xl bg-white border-2 border-[#1e1a18]"
            >
              <select
                value={item.icon}
                onChange={(e) =>
                  updateCustomItem(idx, {
                    icon: e.target.value as StaticDetailItem["icon"],
                  })
                }
                className="border-2 border-[#1e1a18] rounded-xl px-3 py-2 text-xs font-semibold bg-[#fbf5e9] text-espresso focus:outline-none"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Heading (e.g. Packaging)"
                value={item.title}
                onChange={(e) =>
                  updateCustomItem(idx, { title: e.target.value })
                }
                className="sm:w-48 border-2 border-[#1e1a18] rounded-xl px-3 py-2 text-xs font-semibold bg-[#fbf5e9] text-espresso focus:outline-none"
              />

              <input
                type="text"
                placeholder="Details (e.g. Ships in a collectible BerryCola tin)"
                value={item.description}
                onChange={(e) =>
                  updateCustomItem(idx, { description: e.target.value })
                }
                className="flex-1 w-full border-2 border-[#1e1a18] rounded-xl px-3 py-2 text-xs bg-[#fbf5e9] text-espresso focus:outline-none"
              />

              <button
                type="button"
                onClick={() => removeCustomItem(idx)}
                className="w-8 h-8 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red shrink-0 cursor-pointer"
                aria-label="Remove detail row"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {error && <p className="text-xs font-semibold text-cola-red">{error}</p>}
      </form>
    </section>
  );
}

