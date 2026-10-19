import { useEffect, useState } from "react";
import { Crop as CropIcon, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
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
  "w-full border border-espresso/15 rounded-xl px-3 py-2 text-sm bg-cream focus:outline-none focus:border-cola-red";

export default function AdminStorefront() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);
  const [saving, setSaving] = useState(false);
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
        });
      } catch (error) {
        console.error("Failed to load storefront data:", error);
      }
    }
    loadStorefrontData();
  }, []);

  if (!settings) {
    return <div className="p-8 pt-28 max-w-4xl mx-auto text-espresso/50 text-sm">Loading storefront settings...</div>;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStorefront(settings);
      alert("Storefront updated successfully!");
    } catch (err) {
      alert("Failed to save. See console.");
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display text-espresso">Storefront</h1>
            <p className="text-sm text-espresso/60 mt-1">Manage slider content, product categories, and product page details.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || uploadingUrl}
            className="flex items-center gap-2 bg-espresso text-cream px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-espresso/90 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {uploadError && (
          <p className="text-xs font-semibold text-cola-red bg-cola-red/10 border border-cola-red/25 rounded-xl px-4 py-2.5">
            {uploadError}
          </p>
        )}

        {/* Hero Slider */}
        <section className="bg-cream border border-espresso/10 p-6 rounded-3xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-espresso">Hero Slider</h2>
            <button onClick={addSlide} className="flex items-center gap-1.5 text-sm font-semibold text-cola-red hover:underline">
              <Plus size={15} /> Add Slide
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {settings.sliderSlides.map((slide, i) => (
              <div key={i} className="flex items-start gap-4 p-4 border border-espresso/10 rounded-2xl bg-white">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
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
                    className="relative w-32 h-20 rounded-xl overflow-hidden border-2 border-dashed border-espresso/20 flex items-center justify-center cursor-pointer hover:border-cola-red transition-colors"
                    title="Click or drag & drop slide image"
                  >
                    {slide.imageUrl ? (
                      <img src={slide.imageUrl} alt="Slide preview" className="object-cover w-full h-full" />
                    ) : (
                      <ImagePlus size={24} className="text-espresso/30" />
                    )}
                    {uploadingUrl && !slide.imageUrl && (
                      <span className="absolute inset-0 bg-cream/70 flex items-center justify-center text-xs">...</span>
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
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fbf5e9] border border-[#1e1a18] shadow-[0_1.5px_0_#1e1a18] text-[10px] font-semibold text-espresso hover:text-cola-red cursor-pointer"
                    >
                      <CropIcon size={10} /> Resize
                    </button>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  <input
                    placeholder="Slide Text (e.g. New Arrivals)"
                    value={slide.title}
                    onChange={(e) => updateSlide(i, { title: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    placeholder="Link URL (e.g. /shop?category=Charm+Tins)"
                    value={slide.link}
                    onChange={(e) => updateSlide(i, { link: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <button
                  onClick={() => removeSlide(i)}
                  className="w-9 h-9 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Categories Table Component */}
        <CategoriesTable
          trendingCategories={settings.trendingCategories}
          customCategories={settings.customCategories}
          categoryImages={settings.categoryImages}
          uploadingUrl={uploadingUrl}
          onUploadImage={handleImageUpload}
          onChange={(patch) => setSettings({ ...settings, ...patch })}
        />

        {/* Product Page Static Details Editor */}
        <ProductPageDetailsEditor
          details={settings.productPageDetails || {}}
          onChange={(productPageDetails) => setSettings({ ...settings, productPageDetails })}
        />
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