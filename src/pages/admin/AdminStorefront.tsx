import { useEffect, useState } from "react";
import { Check, Crop as CropIcon, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import CategoriesTable from "../../components/admin/CategoriesTable";
import ImageResizerModal from "../../components/admin/ImageResizerModal";
import ProductPageDetailsEditor from "../../components/admin/ProductPageDetailsEditor";
import {
  fetchStorefront,
  updateStorefront,
  uploadImage,
  type StorefrontSettings,
  type Slide,
} from "../../lib/api";

const inputClass =
  "w-full border-2 border-[#1e1a18] rounded-xl px-3.5 py-2.5 text-sm bg-white text-espresso focus:outline-none focus:border-cola-red placeholder:text-espresso/40";

export default function AdminStorefront() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [uploadingUrl, setUploadingUrl] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resizingSlideIdx, setResizingSlideIdx] = useState<number | null>(null);

  useEffect(() => {
    async function loadStorefrontData() {
      try {
        const configData = await fetchStorefront();

        setSettings({
          sliderSlides: configData.sliderSlides || [],
          trendingMode: configData.trendingMode || "manual",
          trendingCategories: configData.trendingCategories || [],
          categoryImages: configData.categoryImages || {},
          customCategories: configData.customCategories || [],
          productPageDetails: configData.productPageDetails || {},
          comingSoon: configData.comingSoon || false,
        });
      } catch (error) {
        console.error("Failed to load storefront data:", error);
      }
    }
    loadStorefrontData();
  }, []);

  if (!settings) {
    return (
      <div className="min-h-screen px-5 sm:px-8 pt-28 pb-20 max-w-5xl mx-auto text-espresso/50 text-sm">
        <AdminNav />
        <div className="p-8 text-center">Loading storefront settings...</div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setUploadError(null);
    setSavedToast(false);
    try {
      await updateStorefront(settings);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch (err: any) {
      setUploadError(err?.message || "Failed to save storefront configuration.");
    } finally {
      setSaving(false);
    }
  };

  const updateSlide = (index: number, patch: Partial<Slide>) => {
    const next = [...settings.sliderSlides];
    next[index] = { ...next[index], ...patch };
    setSettings({ ...settings, sliderSlides: next });
  };

  const removeSlide = (index: number) => {
    setSettings({ ...settings, sliderSlides: settings.sliderSlides.filter((_, i) => i !== index) });
  };

  const addSlide = () => {
    setSettings({
      ...settings,
      sliderSlides: [...settings.sliderSlides, { imageUrl: "", title: "", link: "" }],
    });
  };

  const handleImageUpload = async (file: File, callback: (url: string) => void) => {
    setUploadingUrl(true);
    setUploadError(null);
    try {
      callback(await uploadImage(file));
    } catch (err) {
      setUploadError((err as Error).message || "Upload failed");
    } finally {
      setUploadingUrl(false);
    }
  };

  return (
    <div className="min-h-screen px-5 sm:px-8 pt-28 pb-20 max-w-5xl mx-auto">
      <AdminNav />

      <div className="flex flex-col gap-8">
        {/* Page Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display text-espresso">Storefront Management</h1>
            <p className="text-sm text-espresso/65 mt-1">
              Configure hero banners, product categories, static product page policies, and coming soon mode.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || uploadingUrl}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 hover:bg-[#b81d1d] text-xs font-semibold uppercase  transition-all cursor-pointer disabled:opacity-50"
          >
            {savedToast ? <Check size={16} /> : <Save size={16} />}
            {saving ? "Saving..." : savedToast ? "Saved!" : "Save Changes"}
          </button>
        </div>

        {uploadError && (
          <p className="text-xs font-semibold text-cola-red bg-cola-red/10 border-2 border-cola-red/30 shadow-[0_2px_0_#1e1a18] rounded-xl px-4 py-2.5">
            {uploadError}
          </p>
        )}

        {savedToast && (
          <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border-2 border-emerald-600 shadow-[0_2px_0_#1e1a18] rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Check size={14} className="text-emerald-700" /> Storefront configuration saved successfully!
          </p>
        )}

        {/* 1. Coming Soon Mode Section */}
        <section className="bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_5px_0_#1e1a18] rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-[#1e1a18]/20 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-2xl text-espresso">"Coming Soon" Mode</h2>
                <span
                  className={`text-[10px] font-extrabold uppercase  px-2.5 py-0.5 rounded-full border-2 border-[#1e1a18] shadow-[0_1.5px_0_#1e1a18] ${
                    settings.comingSoon
                      ? "bg-cola-red text-white"
                      : "bg-emerald-100 text-emerald-900"
                  }`}
                >
                  {settings.comingSoon ? "Active · Guests Blocked" : "Inactive · Storefront Live"}
                </span>
              </div>
              <p className="text-xs text-espresso/65 mt-1">
                When enabled, non-admin visitors see the launch teaser page instead of the storefront. Admins can always preview the store.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.comingSoon ?? false}
                onChange={(e) => setSettings({ ...settings, comingSoon: e.target.checked })}
              />
              <div className="w-14 h-8 bg-white peer-focus:outline-none rounded-full border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] peer peer-checked:after:translate-x-full peer-checked:after:border-[#1e1a18] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-[#fbf5e9] after:border-2 after:border-[#1e1a18] after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cola-red"></div>
            </label>
          </div>
        </section>

        {/* 2. Hero Slider Section */}
        <section className="bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_5px_0_#1e1a18] rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-[#1e1a18]/20 pb-4">
            <div>
              <h2 className="font-display text-2xl text-espresso">Hero Slider</h2>
              <p className="text-xs text-espresso/65 mt-1">
                Curate carousel promotional banners displayed at the top of the homepage.
              </p>
            </div>
            <button
              type="button"
              onClick={addSlide}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-espresso border-2 border-[#1e1a18] shadow-[0_2.5px_0_#1e1a18] active:translate-y-0.5 hover:text-cola-red text-xs font-semibold uppercase  transition-all cursor-pointer"
            >
              <Plus size={14} /> Add Slide
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {settings.sliderSlides.map((slide, i) => (
              <div
                key={i}
                className="bg-white border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4"
              >
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageUpload(file, (url) => updateSlide(i, { imageUrl: url }));
                    }}
                    className="relative w-36 h-24 rounded-xl overflow-hidden border-2 border-dashed border-[#1e1a18] bg-[#fbf5e9] flex items-center justify-center cursor-pointer hover:border-cola-red transition-colors shadow-inner"
                    title="Click or drag & drop slide image"
                  >
                    {slide.imageUrl ? (
                      <img src={slide.imageUrl} alt="Slide preview" className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-espresso/40">
                        <ImagePlus size={22} />
                        <span className="text-[10px] font-bold uppercase ">Upload</span>
                      </div>
                    )}
                    {uploadingUrl && !slide.imageUrl && (
                      <span className="absolute inset-0 bg-[#fbf5e9]/80 flex items-center justify-center text-xs font-bold">
                        ...
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, (url) => updateSlide(i, { imageUrl: url }));
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {slide.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setResizingSlideIdx(i)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_1.5px_0_#1e1a18] text-[10px] font-bold text-espresso hover:text-cola-red cursor-pointer"
                    >
                      <CropIcon size={11} /> Resize
                    </button>
                  )}
                </div>

                <div className="flex-1 w-full flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase  text-espresso/70">Slide Heading / Badge</span>
                    <input
                      placeholder="e.g. Handmade Charm Tins"
                      value={slide.title}
                      onChange={(e) => updateSlide(i, { title: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase  text-espresso/70">Target URL / Route</span>
                    <input
                      placeholder="e.g. /shop?category=Charm+Tins"
                      value={slide.link}
                      onChange={(e) => updateSlide(i, { link: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeSlide(i)}
                  className="w-10 h-10 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2.5px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all shrink-0 cursor-pointer self-start sm:self-center"
                  title="Remove Slide"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {settings.sliderSlides.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-[#1e1a18]/20 rounded-2xl bg-white text-sm text-espresso/50">
                No hero slides added yet. Click "+ Add Slide" above to introduce promotional banners.
              </div>
            )}
          </div>
        </section>

        {/* 3. Categories Table Component */}
        <CategoriesTable
          trendingCategories={settings.trendingCategories}
          customCategories={settings.customCategories}
          categoryImages={settings.categoryImages}
          uploadingUrl={uploadingUrl}
          onUploadImage={handleImageUpload}
          onChange={(patch) => setSettings({ ...settings, ...patch })}
        />

        {/* 4. Product Page Static Details Editor */}
        <ProductPageDetailsEditor />
      </div>

      {resizingSlideIdx !== null && settings.sliderSlides[resizingSlideIdx]?.imageUrl && (
        <ImageResizerModal
          imageSrc={settings.sliderSlides[resizingSlideIdx].imageUrl}
          initialPreset="16:9"
          onCancel={() => setResizingSlideIdx(null)}
          onApply={async (resizedFile) => {
            const idx = resizingSlideIdx;
            await handleImageUpload(resizedFile, (newUrl) => {
              updateSlide(idx, { imageUrl: newUrl });
              setResizingSlideIdx(null);
            });
          }}
        />
      )}
    </div>
  );
}