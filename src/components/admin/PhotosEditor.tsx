import { useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Images, Trash2, ZoomIn, Type } from "lucide-react";
import ProductImage from "../ProductImage";
import CropPicker, { clampCrop } from "./CropPicker";
import { uploadImage } from "../../lib/api";
import type { Crop } from "../../data/products";

export type PhotoMode = "gallery" | "options";

export interface PhotoEntry {
  key: string;
  id?: string;
  label: string;
  source: "upload" | "zoom" | "text";
  imageUrl: string;
  crop: Crop;
  // Options only.
  price: string;
  inStock: boolean;
}

const DEFAULT_CROP: Crop = { x: 0.5, y: 0.5, zoom: 2 };

let keySeed = 0;
export function newEntry(partial: Partial<PhotoEntry> = {}): PhotoEntry {
  keySeed += 1;
  return {
    key: `new-${keySeed}`,
    label: "",
    source: "upload",
    imageUrl: "",
    crop: DEFAULT_CROP,
    price: "",
    inStock: true,
    ...partial,
  };
}

function nameFromFile(file: File) {
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

const inputClass =
  "w-full border border-espresso/15 rounded-xl px-3 py-2 text-sm bg-cream focus:outline-none focus:border-cola-red";

export default function PhotosEditor({
  mainUrl,
  mainLabel,
  mode,
  entries,
  onMainUrl,
  onMainLabel,
  onMode,
  onEntries,
  onBusyChange,
  onError,
}: {
  mainUrl: string;
  mainLabel: string;
  mode: PhotoMode;
  entries: PhotoEntry[];
  onMainUrl: (url: string) => void;
  onMainLabel: (label: string) => void;
  onMode: (mode: PhotoMode) => void;
  onEntries: (update: (entries: PhotoEntry[]) => PhotoEntry[]) => void;
  onBusyChange: (busy: boolean) => void;
  onError: (message: string | null) => void;
}) {
  const [uploadingKeys, setUploadingKeys] = useState<Set<string>>(new Set());

  const setUploading = (key: string, on: boolean) =>
    setUploadingKeys((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      onBusyChange(next.size > 0);
      return next;
    });

  const upload = async (key: string, file: File, apply: (url: string) => void) => {
    onError(null);
    setUploading(key, true);
    try {
      apply(await uploadImage(file));
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setUploading(key, false);
    }
  };

  const update = (key: string, patch: Partial<PhotoEntry>) =>
    onEntries((list) => list.map((e) => (e.key === key ? { ...e, ...patch } : e)));

  const move = (index: number, delta: number) =>
    onEntries((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });

  // Several photos at once: each becomes its own named carousel entry.
  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const added = Array.from(files).map((file) => ({ file, entry: newEntry({ label: nameFromFile(file) }) }));
    onEntries((list) => [...list, ...added.map((a) => a.entry)]);
    for (const { file, entry } of added) {
      upload(entry.key, file, (url) => update(entry.key, { imageUrl: url }));
    }
  };

  const addZoom = () => onEntries((list) => [...list, newEntry({ source: "zoom" })]);
  
  // Add an empty text option
  const addTextOption = () => onEntries((list) => [...list, newEntry({ source: "text" })]);

  const isOptions = mode === "options";
  const noun = isOptions ? "option" : "photo";

  return (
    <div className="flex flex-col gap-5">
      {/* Main photo */}
      <div className="flex items-start gap-4">
        <label className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-dashed border-espresso/20 flex items-center justify-center cursor-pointer hover:border-cola-red transition-colors shrink-0">
          {mainUrl ? (
            <ProductImage url={mainUrl} alt="Main photo" />
          ) : (
            <ImagePlus size={28} className="text-espresso/30" />
          )}
          {uploadingKeys.has("main") && (
            <span className="absolute inset-0 bg-cream/70 flex items-center justify-center text-xs">Uploading…</span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload("main", file, onMainUrl);
              e.target.value = "";
            }}
          />
        </label>
        <div className="flex-1 flex flex-col gap-2">
          <p className="text-sm font-semibold text-espresso">Main photo</p>
          <p className="text-xs text-espresso/55">
            Shown first and on the shop grid. Zoomed views are cut from this photo.
          </p>
          <input
            placeholder={isOptions ? 'Name, e.g. "All options"' : "Name (optional)"}
            value={mainLabel}
            onChange={(e) => onMainLabel(e.target.value)}
            className={inputClass}
          />
          {mainUrl && (
            <button
              type="button"
              onClick={() => onMainUrl("")}
              className="self-start text-xs text-cola-red font-semibold hover:underline"
            >
              Remove main photo
            </button>
          )}
        </div>
      </div>

      {/* What the extra photos mean */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-espresso/60">Carousel photos / Options</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {(
            [
              ["gallery", "Just photos", "Extra named views of the same product."],
              ["options", "Customer picks one", "Each named photo or text block is an option they choose and buy."],
            ] as const
          ).map(([value, title, hint]) => (
            <button
              key={value}
              type="button"
              onClick={() => onMode(value)}
              className={`text-left rounded-xl border-2 px-3.5 py-2.5 transition-colors ${
                mode === value ? "border-cola-red bg-cola-red/5" : "border-espresso/12 hover:border-espresso/30"
              }`}
            >
              <span className="block text-sm font-semibold text-espresso">{title}</span>
              <span className="block text-xs text-espresso/55">{hint}</span>
            </button>
          ))}
        </div>
      </div>

      {entries.map((entry, i) => {
        const uploading = uploadingKeys.has(entry.key);
        const preview =
          entry.source === "zoom"
            ? mainUrl
              ? { url: mainUrl, crop: entry.crop }
              : null
            : entry.imageUrl && entry.source === "upload"
              ? { url: entry.imageUrl, crop: null }
              : null;
              
        return (
          <div key={entry.key} className="border border-espresso/10 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-xl overflow-hidden bg-espresso/5 shrink-0 flex items-center justify-center">
                {entry.source === "text" ? (
                  <Type size={18} className="text-espresso/30" />
                ) : preview ? (
                  <ProductImage url={preview.url} crop={preview.crop} alt="" />
                ) : (
                  <Images size={18} className="text-espresso/30" />
                )}
              </span>
              <input
                placeholder={`Name this ${noun} — customers see it as the option label`}
                value={entry.label}
                onChange={(e) => update(entry.key, { label: e.target.value })}
                className={inputClass}
              />
              <div className="flex shrink-0">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="w-8 h-8 flex items-center justify-center text-espresso/50 hover:text-espresso disabled:opacity-25"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={i === entries.length - 1}
                  onClick={() => move(i, 1)}
                  className="w-8 h-8 flex items-center justify-center text-espresso/50 hover:text-espresso disabled:opacity-25"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${noun}`}
                  onClick={() => onEntries((list) => list.filter((e) => e.key !== entry.key))}
                  className="w-8 h-8 flex items-center justify-center text-espresso/50 hover:text-cola-red"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="flex gap-1 bg-espresso/5 rounded-full p-1 self-start">
              {(
                [
                  ["upload", "Separate photo"],
                  ["zoom", "Zoom into main photo"],
                  ["text", "Text only"],
                ] as const
              ).map(([value, title]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    if (value === "zoom") {
                      update(entry.key, { source: value, crop: clampCrop(entry.crop) });
                    } else {
                      update(entry.key, { source: value });
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    entry.source === value ? "bg-cream text-espresso shadow-sm" : "text-espresso/55 hover:text-espresso"
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>

            {entry.source === "text" ? (
              <p className="text-xs text-espresso/55">No image required. Displayed as a text label/button.</p>
            ) : entry.source === "upload" ? (
              <label className="self-start flex items-center gap-2 text-sm font-semibold text-cola-red cursor-pointer hover:underline">
                <ImagePlus size={15} />
                {uploading ? "Uploading…" : entry.imageUrl ? "Replace photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(entry.key, file, (url) => update(entry.key, { imageUrl: url }));
                    e.target.value = "";
                  }}
                />
              </label>
            ) : mainUrl ? (
              <CropPicker url={mainUrl} crop={entry.crop} onChange={(crop) => update(entry.key, { crop })} />
            ) : (
              <p className="text-xs text-cola-red">Upload a main photo first to zoom into it.</p>
            )}

            {isOptions && (
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <label className="flex items-center gap-2 text-xs text-espresso/70">
                  Price (₹)
                  <input
                    type="number"
                    min={1}
                    placeholder="Same"
                    value={entry.price}
                    onChange={(e) => update(entry.key, { price: e.target.value })}
                    className="w-24 border border-espresso/15 rounded-lg px-2 py-1.5 text-sm bg-cream"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-espresso/70">
                  <input
                    type="checkbox"
                    checked={entry.inStock}
                    onChange={(e) => update(entry.key, { inStock: e.target.checked })}
                    className="w-4 h-4 accent-cola-red"
                  />
                  In stock
                </label>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-espresso/15 text-sm font-semibold text-espresso cursor-pointer hover:border-espresso/40">
          <ImagePlus size={15} /> Add photos
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addPhotos(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          onClick={addZoom}
          disabled={!mainUrl}
          title={mainUrl ? undefined : "Upload a main photo first"}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-espresso/15 text-sm font-semibold text-espresso hover:border-espresso/40 disabled:opacity-40"
        >
          <ZoomIn size={15} /> Add zoomed view
        </button>
        <button
          type="button"
          onClick={addTextOption}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-espresso/15 text-sm font-semibold text-espresso hover:border-espresso/40"
        >
          <Type size={15} /> Add text option
        </button>
      </div>
    </div>
  );
}