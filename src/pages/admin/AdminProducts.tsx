import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import CharmIcon from "../../components/CharmIcon";
import PhotosEditor, { newEntry, type PhotoEntry, type PhotoMode } from "../../components/admin/PhotosEditor";
import { categories, type GalleryImage, type Product, type ProductVariant } from "../../data/products";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
  type ImageInput,
  type ProductInput,
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

function toForm(product?: Product): FormState {
  const hasOptions = !!product?.variants?.length;
  return {
    name: product?.name ?? "",
    category: product?.category ?? categories[0],
    price: product ? String(product.price) : "",
    compareAt: product?.compareAt ? String(product.compareAt) : "",
    blurb: product?.blurb ?? "",
    badge: product?.badge ?? "",
    imageUrl: product?.imageUrl ?? "",
    imageLabel: product?.imageLabel ?? "",
    inStock: product?.inStock !== false,
    photoMode: hasOptions ? "options" : "gallery",
    photos: ((hasOptions ? product?.variants : product?.gallery) ?? []).map(toEntry),
  };
}

function toInput(form: FormState): ProductInput {
  return {
    name: form.name.trim(),
    category: form.category,
    price: Number(form.price),
    compareAt: form.compareAt ? Number(form.compareAt) : null,
    blurb: form.blurb.trim(),
    badge: form.badge || null,
    imageUrl: form.imageUrl || null,
    imageLabel: form.imageLabel.trim() || null,
    inStock: form.inStock,
    // Only one list is in use at a time; clear the other.
    variants: form.photoMode === "options" ? form.photos.map((e) => toImageInput(e, true)) : [],
    gallery: form.photoMode === "gallery" ? form.photos.map((e) => toImageInput(e, false)) : [],
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // null = list view, "new" = create form, otherwise the product being edited.
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setError("Couldn't load products."))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="min-h-screen px-5 sm:px-8 pt-28 pb-20 max-w-6xl mx-auto">
      <AdminNav />

      {editing ? (
        <ProductForm
          product={editing === "new" ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h1 className="font-display text-3xl text-espresso">Products</h1>
            <button
              onClick={() => setEditing("new")}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-cola-red text-cream text-sm font-semibold hover:bg-cola-red-dark"
            >
              <Plus size={16} /> New product
            </button>
          </div>

          {loading && <p className="text-espresso/50 text-sm">Loading…</p>}
          {error && <p className="text-cola-red text-sm">{error}</p>}

          <div className="flex flex-col gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => setEditing(product)}
                className="flex items-center gap-4 border border-espresso/10 rounded-2xl p-3 pr-5 text-left hover:border-espresso/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-espresso/5 flex items-center justify-center shrink-0">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <CharmIcon icon={product.icon} gradient={product.gradient} size={40} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-espresso truncate">{product.name}</p>
                  <p className="text-xs text-espresso/50">{product.category}</p>
                </div>
                {product.inStock === false && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-cola-red bg-cola-red/10 px-2.5 py-1 rounded-full">
                    Out of stock
                  </span>
                )}
                <span className="text-sm font-semibold text-espresso">₹{product.price}</span>
              </button>
            ))}
            {!loading && !error && products.length === 0 && (
              <p className="text-espresso/50 text-sm">No products yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ProductForm({
  product,
  onCancel,
  onSaved,
  onDeleted,
}: {
  product?: Product;
  onCancel: () => void;
  onSaved: (product: Product) => void;
  onDeleted: (id: string) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(product));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const inputClass =
    "w-full border border-espresso/15 rounded-xl px-3 py-2.5 text-sm bg-cream focus:outline-none focus:border-cola-red";
  const labelClass = "flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-espresso/60";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl text-espresso">{product ? "Edit product" : "New product"}</h1>
        {product && (
          <Link to={`/product/${product.id}`} className="text-sm text-cola-red font-semibold hover:underline">
            View in shop →
          </Link>
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

        <label className="flex items-center gap-2.5 text-sm text-espresso">
          <input
            type="checkbox"
            checked={form.inStock}
            onChange={(e) => set("inStock", e.target.checked)}
            className="w-4 h-4 accent-cola-red"
          />
          In stock
        </label>

        {error && <p className="text-cola-red text-sm">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            disabled={busy || uploading}
            className="px-6 py-2.5 rounded-full bg-cola-red text-cream text-sm font-semibold hover:bg-cola-red-dark disabled:opacity-40"
          >
            {busy ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2.5 text-sm text-espresso/60 hover:text-espresso">
            Cancel
          </button>
          {product && (
            <button
              type="button"
              disabled={busy}
              onClick={handleDelete}
              className="ml-auto px-4 py-2.5 text-sm text-espresso/50 hover:text-cola-red disabled:opacity-40"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
