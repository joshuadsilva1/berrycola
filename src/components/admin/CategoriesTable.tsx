import { useState } from "react";
import { ImagePlus, Trash2, ArrowUp, ArrowDown, X, Sparkles } from "lucide-react";
import {
  CATEGORY_ICONS,
  CATEGORY_ICON_NAMES,
  getCategoryIconComponent,
} from "../CategoryShapes";

const inputClass =
  "w-full border border-espresso/15 rounded-xl px-3 py-2 text-sm bg-cream focus:outline-none focus:border-cola-red";

const keycapSmClass =
  "w-8 h-8 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all disabled:opacity-30 disabled:pointer-events-none";

export interface CategoriesTableProps {
  trendingCategories: string[];
  customCategories: string[];
  categoryImages: Record<string, string>;
  uploadingUrl?: boolean;
  onUploadImage: (file: File, callback: (url: string) => void) => void;
  onChange: (patch: {
    trendingCategories?: string[];
    customCategories?: string[];
    categoryImages?: Record<string, string>;
  }) => void;
}

export default function CategoriesTable({
  trendingCategories,
  customCategories,
  categoryImages,
  uploadingUrl = false,
  onUploadImage,
  onChange,
}: CategoriesTableProps) {
  const [newCatName, setNewCatName] = useState("");
  const [newCatVisual, setNewCatVisual] = useState("");
  const [openIconPickerFor, setOpenIconPickerFor] = useState<string | null>(null);

  const allCategories = Array.from(
    new Set([...trendingCategories, ...customCategories]),
  );

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (name && !allCategories.includes(name)) {
      const nextImages = { ...categoryImages };
      if (newCatVisual) {
        nextImages[name] = newCatVisual;
      }
      onChange({
        customCategories: [...customCategories, name],
        trendingCategories: [...trendingCategories, name],
        categoryImages: nextImages,
      });
      setNewCatName("");
      setNewCatVisual("");
      setOpenIconPickerFor(null);
    }
  };

  const updateCatVisual = (cat: string, value: string) => {
    onChange({
      categoryImages: { ...categoryImages, [cat]: value },
    });
  };

  const removeCatVisual = (cat: string) => {
    const nextImages = { ...categoryImages };
    delete nextImages[cat];
    onChange({
      categoryImages: nextImages,
    });
  };

  const toggleTrending = (cat: string) => {
    const next = trendingCategories.includes(cat)
      ? trendingCategories.filter((c) => c !== cat)
      : [...trendingCategories, cat];
    onChange({ trendingCategories: next });
  };

  const moveTrending = (index: number, direction: number) => {
    const next = [...trendingCategories];
    const [item] = next.splice(index, 1);
    next.splice(index + direction, 0, item);
    onChange({ trendingCategories: next });
  };

  const handleDelete = (cat: string) => {
    if (confirm(`Remove "${cat}"?`)) {
      const nextImages = { ...categoryImages };
      delete nextImages[cat];
      onChange({
        customCategories: customCategories.filter((c) => c !== cat),
        trendingCategories: trendingCategories.filter((c) => c !== cat),
        categoryImages: nextImages,
      });
    }
  };

  const NewCatIcon = getCategoryIconComponent(newCatVisual);

  return (
    <section className="bg-cream border border-espresso/10 p-6 rounded-3xl flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-espresso">Categories</h2>

      <div className="flex flex-col gap-4">
        <form onSubmit={handleAddCategory} className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="relative shrink-0 flex items-center gap-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] flex items-center justify-center text-espresso">
                {newCatVisual ? (
                  NewCatIcon ? (
                    <NewCatIcon size={18} />
                  ) : (
                    <img src={newCatVisual} alt="New category" className="w-full h-full object-contain p-1.5" />
                  )
                ) : (
                  <span className="text-[9px] text-espresso/45 font-semibold">None</span>
                )}
              </div>
              {newCatVisual && (
                <button
                  type="button"
                  onClick={() => setNewCatVisual("")}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_1.5px_0_#1e1a18] text-espresso flex items-center justify-center hover:text-cola-red"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-espresso/70 hover:text-cola-red cursor-pointer flex items-center gap-1 uppercase">
                <ImagePlus size={11} /> PNG
                <input
                  type="file"
                  accept="image/png,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadImage(file, setNewCatVisual);
                    e.target.value = "";
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setOpenIconPickerFor(openIconPickerFor === "__new__" ? null : "__new__")}
                className="text-[10px] font-semibold text-espresso/70 hover:text-cola-red flex items-center gap-1 uppercase"
              >
                <Sparkles size={11} /> Icon
              </button>
            </div>
          </div>

          <input
            type="text"
            placeholder="New Category Name..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={!newCatName.trim() || uploadingUrl}
            className="shrink-0 bg-espresso text-cream px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            Add
          </button>
        </form>

        {openIconPickerFor === "__new__" && (
          <IconPickerGrid
            selected={newCatVisual}
            onSelect={(iconVal) => {
              setNewCatVisual(iconVal);
              setOpenIconPickerFor(null);
            }}
          />
        )}
      </div>

      <div className="overflow-x-auto border border-espresso/10 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-espresso/10 bg-cream/30 text-xs text-espresso/60 uppercase tracking-wider">
              <th className="p-3 font-semibold w-32">Visual</th>
              <th className="p-3 font-semibold">Category Name</th>
              <th className="p-3 font-semibold w-24 text-center">Active</th>
              <th className="p-3 font-semibold w-28 text-center">Order</th>
              <th className="p-3 font-semibold w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Active (Trending) Categories First */}
            {trendingCategories.map((cat, i) => (
              <CategoryRow
                key={cat}
                cat={cat}
                index={i}
                isTrending={true}
                totalTrending={trendingCategories.length}
                visualValue={categoryImages[cat] || ""}
                isPickerOpen={openIconPickerFor === cat}
                onTogglePicker={() => setOpenIconPickerFor(openIconPickerFor === cat ? null : cat)}
                onUpload={(file) => onUploadImage(file, (url) => updateCatVisual(cat, url))}
                onSelectIcon={(iconVal) => {
                  updateCatVisual(cat, iconVal);
                  setOpenIconPickerFor(null);
                }}
                onRemoveVisual={() => removeCatVisual(cat)}
                onToggleTrending={() => toggleTrending(cat)}
                onMove={(dir) => moveTrending(i, dir)}
                onDelete={() => handleDelete(cat)}
              />
            ))}

            {/* Inactive Categories Second */}
            {allCategories
              .filter((c) => !trendingCategories.includes(c))
              .map((cat) => (
                <CategoryRow
                  key={cat}
                  cat={cat}
                  index={-1}
                  isTrending={false}
                  totalTrending={trendingCategories.length}
                  visualValue={categoryImages[cat] || ""}
                  isPickerOpen={openIconPickerFor === cat}
                  onTogglePicker={() => setOpenIconPickerFor(openIconPickerFor === cat ? null : cat)}
                  onUpload={(file) => onUploadImage(file, (url) => updateCatVisual(cat, url))}
                  onSelectIcon={(iconVal) => {
                    updateCatVisual(cat, iconVal);
                    setOpenIconPickerFor(null);
                  }}
                  onRemoveVisual={() => removeCatVisual(cat)}
                  onToggleTrending={() => toggleTrending(cat)}
                  onMove={() => {}}
                  onDelete={() => handleDelete(cat)}
                />
              ))}

            {allCategories.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-sm text-espresso/50 italic">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CategoryRow({
  cat,
  index,
  isTrending,
  totalTrending,
  visualValue,
  isPickerOpen,
  onTogglePicker,
  onUpload,
  onSelectIcon,
  onRemoveVisual,
  onToggleTrending,
  onMove,
  onDelete,
}: {
  cat: string;
  index: number;
  isTrending: boolean;
  totalTrending: number;
  visualValue: string;
  isPickerOpen: boolean;
  onTogglePicker: () => void;
  onUpload: (file: File) => void;
  onSelectIcon: (iconVal: string) => void;
  onRemoveVisual: () => void;
  onToggleTrending: () => void;
  onMove: (direction: number) => void;
  onDelete: () => void;
}) {
  const Icon = getCategoryIconComponent(visualValue);

  return (
    <>
      <tr className="border-b border-espresso/5 last:border-0 hover:bg-cream/20 transition-colors group">
        <td className="p-3 align-middle">
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2.5px_0_#1e1a18] flex items-center justify-center text-espresso shrink-0">
              {visualValue ? (
                Icon ? (
                  <Icon size={18} />
                ) : (
                  <img src={visualValue} alt={cat} className="w-full h-full object-contain p-1.5 rounded-full" />
                )
              ) : (
                <span className="text-[9px] text-espresso/45 font-semibold">None</span>
              )}
              {visualValue && (
                <button
                  type="button"
                  onClick={onRemoveVisual}
                  title="Remove visual"
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#fbf5e9] border border-[#1e1a18] shadow-[0_1px_0_#1e1a18] text-espresso flex items-center justify-center hover:text-cola-red"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-espresso/60 hover:text-cola-red cursor-pointer flex items-center gap-1 uppercase">
                <ImagePlus size={10} /> PNG
                <input
                  type="file"
                  accept="image/png,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={onTogglePicker}
                className={`text-[10px] font-semibold flex items-center gap-1 uppercase transition-colors ${
                  isPickerOpen ? "text-cola-red" : "text-espresso/60 hover:text-cola-red"
                }`}
              >
                <Sparkles size={10} /> Icon
              </button>
            </div>
          </div>
        </td>
        <td className="p-3 align-middle">
          <div className="font-semibold text-sm text-espresso truncate">{cat}</div>
          <div className="text-[11px] text-espresso/45">
            {visualValue ? (Icon ? "Icon active" : "PNG active") : "No visual"}
          </div>
        </td>
        <td className="p-3 align-middle text-center">
          <input
            type="checkbox"
            className="w-4 h-4 accent-cola-red cursor-pointer"
            checked={isTrending}
            onChange={onToggleTrending}
          />
        </td>
        <td className="p-3 align-middle text-center">
          {isTrending ? (
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onMove(-1)}
                className={keycapSmClass}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                disabled={index === totalTrending - 1}
                onClick={() => onMove(1)}
                className={keycapSmClass}
              >
                <ArrowDown size={14} />
              </button>
            </div>
          ) : (
            <span className="text-espresso/30 text-sm">-</span>
          )}
        </td>
        <td className="p-3 align-middle text-center">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onDelete}
              className={keycapSmClass}
              title={`Delete ${cat}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
      {isPickerOpen && (
        <tr>
          <td colSpan={5} className="p-3 bg-cream/30 border-b border-espresso/10">
            <IconPickerGrid selected={visualValue} onSelect={onSelectIcon} />
          </td>
        </tr>
      )}
    </>
  );
}

export function IconPickerGrid({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (val: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5 p-2">
      {CATEGORY_ICON_NAMES.map((name) => {
        const Icon = CATEGORY_ICONS[name];
        const value = `icon:${name}`;
        const isSelected = selected === value;
        return (
          <button
            key={name}
            type="button"
            title={name}
            onClick={() => onSelect(value)}
            className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 transition-all ${
              isSelected
                ? "bg-cola-red text-[#fbf5e9]"
                : "bg-[#fbf5e9] text-espresso hover:text-cola-red"
            }`}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}

