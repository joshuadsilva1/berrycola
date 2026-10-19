import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Check, Clock, GripVertical, Package, Plus, Share2 } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import CharmIcon from "../../components/CharmIcon";
import PhotosEditor, { newEntry, type PhotoEntry, type PhotoMode } from "../../components/admin/PhotosEditor";
import ProductPageDetailsEditor from "../../components/admin/ProductPageDetailsEditor";
import { categories as defaultCategories, type GalleryImage, type Product, type ProductVariant } from "../../data/products";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  fetchStorefront,
  reorderProducts,
  updateProduct,
  updateStorefront,
  type ImageInput,
  type ProductInput,
  type StorefrontSettings,
} from "../../lib/api";

const BADGES = ["New", "Bestseller", "Limited"];

interface FormState {
  name: string;
  category: string;
  price: string;
  compareAt: string;
  blurb: string;
  badge: string;
  imageUrl: string;
  imageLabel: string;
  inStock: boolean;
  stockQuantity: string;
  deliveryMinDays: string;
  deliveryMaxDays: string;
  deliveryMinDate: string;
  deliveryMaxDate: string;
  photoMode: PhotoMode;
  photos: PhotoEntry[];
}

function toEntry(item: ProductVariant | GalleryImage): PhotoEntry {
  const variant = item as ProductVariant;
  return newEntry({
    key: `saved-${item.id}`,
    id: item.id,
    label: item.label,
    source: item.crop ? "zoom" : "upload",
    imageUrl: item.imageUrl ?? "",
    ...(item.crop ? { crop: item.crop } : {}),
    price: variant.price != null ? String(variant.price) : "",
    inStock: variant.inStock !== false,
  });
}

function toImageInput(entry: PhotoEntry, isOption: boolean): ImageInput {
  const input: ImageInput = {
    id: entry.id,
    label: entry.label.trim(),
    imageUrl: entry.source === "upload" ? entry.imageUrl || null : null,
    crop: entry.source === "zoom" ? entry.crop : null,
  };
  if (isOption) {
    input.price = entry.price ? Number(entry.price) : null;
    input.inStock = entry.inStock;
  }
  return input;
}

function toForm(product?: Product, availableCategories: string[] = defaultCategories): FormState {
  const hasOptions = !!product?.variants?.length;
  return {
    name: product?.name ?? "",
    category: product?.category ?? availableCategories[0] ?? defaultCategories[0],
    price: product ? String(product.price) : "",
    compareAt: product?.compareAt ? String(product.compareAt) : "",
    blurb: product?.blurb ?? "",
    badge: product?.badge ?? "",
    imageUrl: product?.imageUrl ?? "",
    imageLabel: product?.imageLabel ?? "",
    inStock: product?.inStock !== false,
    stockQuantity: product?.stockQuantity != null ? String(product.stockQuantity) : "",
    deliveryMinDays: product?.deliveryMinDays != null ? String(product.deliveryMinDays) : "",
    deliveryMaxDays: product?.deliveryMaxDays != null ? String(product.deliveryMaxDays) : "",
    deliveryMinDate: product?.deliveryMinDate ?? "",
    deliveryMaxDate: product?.deliveryMaxDate ?? "",
    photoMode: hasOptions ? "options" : "gallery",
    photos: ((hasOptions ? product?.variants : product?.gallery) ?? []).map(toEntry),
  };
}

function toInput(form: FormState): ProductInput {
  const qty = form.stockQuantity.trim() !== "" ? Math.max(0, Number(form.stockQuantity)) : null;
  return {
    name: form.name.trim(),
    category: form.category,
    price: Number(form.price),
    compareAt: form.compareAt ? Number(form.compareAt) : null,
    blurb: form.blurb.trim(),
    badge: form.badge || null,
    imageUrl: form.imageUrl || null,
    imageLabel: form.imageLabel.trim() || null,
    inStock: qty !== null ? qty > 0 && form.inStock : form.inStock,
    stockQuantity: qty,
    deliveryMinDays: form.deliveryMinDays.trim() !== "" ? Math.max(0, Number(form.deliveryMinDays)) : null,
    deliveryMaxDays: form.deliveryMaxDays.trim() !== "" ? Math.max(0, Number(form.deliveryMaxDays)) : null,
    deliveryMinDate: form.deliveryMinDate.trim() || null,
    deliveryMaxDate: form.deliveryMaxDate.trim() || null,
    // Only one list is in use at a time; clear the other.
    variants: form.photoMode === "options" ? form.photos.map((e) => toImageInput(e, true)) : [],
    gallery: form.photoMode === "gallery" ? form.photos.map((e) => toImageInput(e, false)) : [],
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [storefront, setStorefront] = useState<StorefrontSettings | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSavedMsg, setDetailsSavedMsg] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // null = list view, "new" = create form, otherwise the product being edited.
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  // Drag-and-drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setError("Couldn't load products."))
      .finally(() => setLoading(false));

    fetchStorefront()
      .then((s) => {
        setStorefront({
          sliderSlides: s.sliderSlides || [],
          trendingMode: s.trendingMode || "manual",
          trendingCategories: s.trendingCategories || [],
          categoryImages: s.categoryImages || {},
          customCategories: s.customCategories || [],
          productPageDetails: s.productPageDetails || {},
        });
      })
      .catch(() => {});
  }, []);

  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set([
          ...defaultCategories,
          ...(storefront?.trendingCategories ?? []),
          ...(storefront?.customCategories ?? []),
        ].filter(Boolean)),
      ),
    [storefront],
  );

  const handleSaved = (saved: Product) => {
    setProducts((prev) =>
      prev.some((p) => p.id === saved.id)
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [...prev, saved],
    );
    setEditing(null);
  };

  const handleDeleted = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setEditing(null);
  };

  const handleShareProduct = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedId(product.id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === product.id ? null : curr));
    }, 2000);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dragOverId) {
      setDragOverId(id);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedId || e.dataTransfer.getData("text/plain");
    setDraggedId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;

    const fromIndex = products.findIndex((p) => p.id === sourceId);
    const toIndex = products.findIndex((p) => p.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...products];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setProducts(reordered);

    try {
      await reorderProducts(reordered.map((p) => p.id));
    } catch {
      setError("Failed to save new product order.");
    }
  };

  const handleSaveStaticDetails = async () => {
    if (!storefront) return;
    setSavingDetails(true);
    setDetailsSavedMsg(false);
    try {
      const updated = await updateStorefront(storefront);
      setStorefront(updated);
      setDetailsSavedMsg(true);
      setTimeout(() => setDetailsSavedMsg(false), 2500);
    } catch {
      setError("Failed to save product page details.");
    } finally {
      setSavingDetails(false);
    }
  };

  return (
    <div className="min-h-screen px-5 sm:px-8 pt-28 pb-20 max-w-6xl mx-auto">
      <AdminNav />

      {editing ? (
        <ProductForm
          product={editing === "new" ? undefined : editing}
          categories={availableCategories}
          onCancel={() => setEditing(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      ) : (
        <div className="flex flex-col gap-10">
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="font-display text-3xl text-espresso">Products</h1>
                <p className="text-xs text-espresso/55 mt-1">
                  Drag and drop products to reorder how they appear in the shop.
                </p>
              </div>
              <button
                onClick={() => setEditing("new")}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 text-sm font-semibold hover:bg-cola-red-dark cursor-pointer"
              >
                <Plus size={16} /> New product
              </button>
            </div>

            {loading && <p className="text-espresso/50 text-sm mt-4">Loading…</p>}
            {error && <p className="text-cola-red text-sm mt-4">{error}</p>}

            <div className="flex flex-col gap-3 mt-5">
              {products.map((product) => {
                const isDragging = draggedId === product.id;
                const isDragOver = dragOverId === product.id && draggedId !== product.id;
                const isCopied = copiedId === product.id;

                return (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, product.id)}
                    onDragOver={(e) => handleDragOver(e, product.id)}
                    onDragLeave={() => {
                      if (dragOverId === product.id) setDragOverId(null);
                    }}
                    onDrop={(e) => handleDrop(e, product.id)}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverId(null);
                    }}
                    onClick={() => setEditing(product)}
                    className={`flex items-center gap-3 sm:gap-4 border-2 rounded-2xl p-3 pr-4 text-left transition-all cursor-pointer bg-[#fbf5e9]/70 ${
                      isDragging
                        ? "opacity-40 scale-[0.99] border-cola-red"
                        : isDragOver
                          ? "border-cola-red bg-cola-red/5 shadow-[0_3px_0_#1e1a18]"
                          : "border-espresso/15 hover:border-espresso/40"
                    }`}
                  >
                    <div
                      className="text-espresso/40 hover:text-espresso cursor-grab active:cursor-grabbing p-1 shrink-0"
                      title="Drag to reorder"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical size={18} />
                    </div>

                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-espresso/5 flex items-center justify-center shrink-0 border border-espresso/10">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <CharmIcon icon={product.icon} gradient={product.gradient} size={40} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-display text-espresso truncate">{product.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-espresso/55">
                        <span>{product.category}</span>
                        {product.stockQuantity != null && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-espresso/5 text-espresso/75 font-medium">
                            <Package size={11} /> Qty: {product.stockQuantity}
                          </span>
                        )}
                        {(product.deliveryMinDays != null || product.deliveryMaxDays != null) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-espresso/5 text-espresso/70">
                            <Clock size={11} /> {product.deliveryMinDays ?? "?"}–{product.deliveryMaxDays ?? "?"}d
                          </span>
                        )}
                      </div>
                    </div>

                    {product.inStock === false && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-cola-red bg-cola-red/10 px-2.5 py-1 rounded-full shrink-0">
                        Out of stock
                      </span>
                    )}

                    <span className="text-sm font-semibold text-espresso shrink-0">₹{product.price}</span>

                    <button
                      type="button"
                      onClick={(e) => handleShareProduct(e, product)}
                      title="Copy product share link"
                      className="w-9 h-9 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all shrink-0 cursor-pointer"
                    >
                      {isCopied ? <Check size={15} className="text-green-700" /> : <Share2 size={15} />}
                    </button>
                  </div>
                );
              })}
              {!loading && !error && products.length === 0 && (
                <p className="text-espresso/50 text-sm">No products yet.</p>
              )}
            </div>
          </div>

          {/* Static Product Page Details Section for Admin */}
          {storefront && (
            <div className="border-t border-espresso/15 pt-8 flex flex-col gap-4">
              <ProductPageDetailsEditor
                details={storefront.productPageDetails || {}}
                onChange={(productPageDetails) =>
                  setStorefront((prev) => (prev ? { ...prev, productPageDetails } : prev))
                }
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveStaticDetails}
                  disabled={savingDetails}
                  className="px-6 py-2.5 rounded-full bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 text-sm font-semibold hover:bg-cola-red-dark disabled:opacity-50 cursor-pointer"
                >
                  {savingDetails ? "Saving details…" : "Save Product Page Details"}
                </button>
                {detailsSavedMsg && (
                  <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
                    <Check size={14} /> Saved! Reflected across all product pages.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductForm({
  product,
  categories,
  onCancel,
  onSaved,
  onDeleted,
}: {
  product?: Product;
  categories: string[];
  onCancel: () => void;
  onSaved: (product: Product) => void;
  onDeleted: (id: string) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(product, categories));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setPhotos = (update: (photos: PhotoEntry[]) => PhotoEntry[]) =>
    setForm((f) => ({ ...f, photos: update(f.photos) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const input = toInput(form);
      onSaved(product ? await updateProduct(product.id, input) : await createProduct(input));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    setError(null);
    setBusy(true);
    try {
      await deleteProduct(product.id);
      onDeleted(product.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copyShareLink = () => {
    if (!product) return;
    const url = `${window.location.origin}/product/${product.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const inputClass =
    "w-full border border-espresso/15 rounded-xl px-3 py-2.5 text-sm bg-cream focus:outline-none focus:border-cola-red";
  const labelClass = "flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-espresso/60";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl text-espresso">{product ? "Edit product" : "New product"}</h1>
        {product && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={copyShareLink}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 text-xs font-semibold text-espresso hover:text-cola-red transition-all cursor-pointer"
            >
              {copiedLink ? <Check size={14} className="text-green-700" /> : <Share2 size={14} />}
              {copiedLink ? "Link copied!" : "Share link"}
            </button>
            <Link to={`/product/${product.id}`} className="text-sm text-cola-red font-semibold hover:underline">
              View in shop →
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <label className={labelClass}>
          Name
          <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className={labelClass}>
            Category
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Badge
            <select value={form.badge} onChange={(e) => set("badge", e.target.value)} className={inputClass}>
              <option value="">None</option>
              {BADGES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Price (₹)
            <input
              required
              type="number"
              min={1}
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Compare-at price (₹, optional)
            <input
              type="number"
              min={1}
              value={form.compareAt}
              onChange={(e) => set("compareAt", e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        {/* Inventory / Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-espresso/10 pt-5">
          <label className={labelClass}>
            <span className="flex items-center gap-1.5">
              <Package size={13} /> Stock Quantity (optional)
            </span>
            <input
              type="number"
              min={0}
              placeholder="Leave blank for unlimited"
              value={form.stockQuantity}
              onChange={(e) => {
                const val = e.target.value;
                set("stockQuantity", val);
                if (val !== "" && Number(val) === 0) {
                  set("inStock", false);
                } else if (val !== "" && Number(val) > 0) {
                  set("inStock", true);
                }
              }}
              className={inputClass}
            />
          </label>

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2.5 text-sm text-espresso cursor-pointer">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => set("inStock", e.target.checked)}
                className="w-4 h-4 accent-cola-red"
              />
              In stock (Available for purchase)
            </label>
          </div>
        </div>

        {/* Delivery Time & Date Window */}
        <div className="flex flex-col gap-3 border-t border-espresso/10 pt-5">
          <div>
            <p className="font-display text-lg text-espresso">Delivery Time & Date</p>
            <p className="text-xs text-espresso/55">
              Set product-specific minimum and maximum delivery days or exact dates (overrides store defaults if set).
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> Min Delivery Time (Days)
              </span>
              <input
                type="number"
                min={0}
                placeholder="e.g. 3"
                value={form.deliveryMinDays}
                onChange={(e) => set("deliveryMinDays", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> Max Delivery Time (Days)
              </span>
              <input
                type="number"
                min={0}
                placeholder="e.g. 7"
                value={form.deliveryMaxDays}
                onChange={(e) => set("deliveryMaxDays", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} /> Min Delivery Date (optional)
              </span>
              <input
                type="date"
                value={form.deliveryMinDate}
                onChange={(e) => set("deliveryMinDate", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} /> Max Delivery Date (optional)
              </span>
              <input
                type="date"
                value={form.deliveryMaxDate}
                onChange={(e) => set("deliveryMaxDate", e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-espresso/10 pt-5">
          <p className="font-display text-lg text-espresso">Photos</p>
          <PhotosEditor
            mainUrl={form.imageUrl}
            mainLabel={form.imageLabel}
            mode={form.photoMode}
            entries={form.photos}
            onMainUrl={(url) => set("imageUrl", url)}
            onMainLabel={(label) => set("imageLabel", label)}
            onMode={(mode) => set("photoMode", mode)}
            onEntries={setPhotos}
            onBusyChange={setUploading}
            onError={setError}
          />
        </div>

        <label className={labelClass}>
          Description
          <textarea
            rows={3}
            value={form.blurb}
            onChange={(e) => set("blurb", e.target.value)}
            className={inputClass}
          />
        </label>

        {error && <p className="text-cola-red text-sm">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            disabled={busy || uploading}
            className="px-6 py-2.5 rounded-full bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 text-sm font-semibold hover:bg-cola-red-dark disabled:opacity-40 cursor-pointer"
          >
            {busy ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2.5 text-sm text-espresso/60 hover:text-espresso cursor-pointer">
            Cancel
          </button>
          {product && (
            <button
              type="button"
              disabled={busy}
              onClick={handleDelete}
              className="ml-auto px-4 py-2.5 text-sm text-espresso/50 hover:text-cola-red disabled:opacity-40 cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
