import { useEffect, useState } from "react";
import { Plus, Trash2, Tag, Percent, IndianRupee } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import { fetchAdminPromos, createPromo, updatePromo, deletePromo, type PromoCode } from "../../lib/api";

const inputClass = "w-full border border-espresso/15 rounded-xl px-3 py-2 text-sm bg-cream focus:outline-none focus:border-cola-red";

export default function AdminPromos() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Promo Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchAdminPromos().then(setPromos).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const newPromo = await createPromo({
        code: code.toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: minOrder ? Number(minOrder) : null,
        isActive: true,
      });
      setPromos([newPromo, ...promos]);
      setCode("");
      setDiscountValue("");
      setMinOrder("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (promo: PromoCode) => {
    const updated = await updatePromo(promo.id, { isActive: !promo.isActive });
    setPromos(promos.map(p => p.id === promo.id ? updated : p));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    await deletePromo(id);
    setPromos(promos.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen px-5 sm:px-8 pt-28 pb-20 max-w-5xl mx-auto">
      <AdminNav />
      <div className="mb-8">
        <h1 className="font-display text-3xl text-espresso">Promo Codes</h1>
        <p className="text-sm text-espresso/60 mt-1">Create and manage discounts for your customers.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* CREATE FORM */}
        <div className="md:col-span-1 bg-cream border border-espresso/10 p-6 rounded-3xl h-fit">
          <h2 className="text-lg font-semibold text-espresso mb-4">New Promo Code</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-espresso/60">
              Code Name
              <input required value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. DIWALI20" className={inputClass} />
            </label>

            <div className="flex gap-2 p-1 bg-espresso/5 rounded-xl">
              <button type="button" onClick={() => setDiscountType("percentage")} className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold ${discountType === "percentage" ? "bg-cream shadow text-espresso" : "text-espresso/50"}`}>
                <Percent size={14} /> Percentage
              </button>
              <button type="button" onClick={() => setDiscountType("fixed")} className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold ${discountType === "fixed" ? "bg-cream shadow text-espresso" : "text-espresso/50"}`}>
                <IndianRupee size={14} /> Fixed Amount
              </button>
            </div>

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-espresso/60">
              {discountType === "percentage" ? "Discount %" : "Discount Amount (₹)"}
              <input required type="number" min="1" max={discountType === "percentage" ? "100" : undefined} value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "15" : "200"} className={inputClass} />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-espresso/60">
              Minimum Order Value (₹) - Optional
              <input type="number" min="1" value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="e.g. 1500" className={inputClass} />
            </label>

            <button disabled={busy || !code || !discountValue} className="mt-2 bg-espresso text-cream py-2.5 rounded-xl text-sm font-semibold hover:bg-espresso/90 disabled:opacity-50 flex items-center justify-center gap-2">
              <Plus size={16} /> Create Code
            </button>
          </form>
        </div>

        {/* PROMO LIST */}
        <div className="md:col-span-2 flex flex-col gap-3">
          {loading ? <p className="text-sm text-espresso/50">Loading codes...</p> : promos.length === 0 ? <p className="text-sm text-espresso/50 italic">No promo codes created yet.</p> : null}
          
          {promos.map(promo => (
            <div key={promo.id} className={`flex items-center gap-4 p-4 border rounded-2xl transition-colors ${promo.isActive ? 'bg-white border-espresso/10 shadow-sm' : 'bg-espresso/5 border-transparent opacity-60'}`}>
              <div className="w-12 h-12 rounded-xl bg-cola-red/10 flex items-center justify-center text-cola-red shrink-0">
                <Tag size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-espresso text-lg">{promo.code}</h3>
                  {!promo.isActive && <span className="text-[10px] uppercase font-bold bg-espresso/20 px-2 py-0.5 rounded text-espresso">Paused</span>}
                </div>
                <p className="text-sm text-espresso/70">
                  {promo.discountType === "percentage" ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`}
                  {promo.minOrderValue ? ` on orders over ₹${promo.minOrderValue}` : ' on any order'}
                </p>
                <p className="text-xs text-espresso/40 mt-1">Used {promo.usageCount} times</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer border-r border-espresso/10 pr-4 mr-2">
                <input type="checkbox" className="w-4 h-4 accent-cola-red" checked={promo.isActive} onChange={() => toggleActive(promo)} />
                <span className="text-xs text-espresso/70 font-semibold">Active</span>
              </label>

              <button onClick={() => handleDelete(promo.id)} className="p-2 text-espresso/40 hover:text-cola-red transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}