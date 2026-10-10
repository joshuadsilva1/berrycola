import { useEffect, useState } from "react";
import { ImagePlus, Plus, Save, Trash2, ArrowUp, ArrowDown} from "lucide-react";
import { 
  fetchStorefront, 
  updateStorefront, 
  fetchCategories, 
  uploadImage,
  type StorefrontSettings,
  type Slide
} from "../../lib/api"; 
import ProductImage from "../../components/ProductImage";

const inputClass =
  "w-full border border-espresso/15 rounded-xl px-3 py-2 text-sm bg-cream focus:outline-none focus:border-cola-red";

export default function AdminStorefront() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingUrl, setUploadingUrl] = useState(false);

  useEffect(() => {
    async function loadStorefrontData() {
      try {
        const [configData, catData] = await Promise.all([
          fetchStorefront(),
          fetchCategories()
        ]);
        
        setSettings({
          sliderSlides: configData.sliderSlides || [],
          trendingMode: configData.trendingMode || "manual",
          trendingCategories: configData.trendingCategories || [],
          categoryImages: configData.categoryImages || {},
          customCategories: configData.customCategories || [],
          splashEnabled: configData.splashEnabled ?? true,
        });
        
        setDbCategories(catData as unknown as string[]); 
      } catch (error) {
        console.error("Failed to load storefront data:", error);
      }
    }
    loadStorefrontData();
  }, []);

  if (!settings) return <div className="p-8 text-espresso/50 text-sm">Loading storefront settings...</div>;

  const allCategories = Array.from(new Set([...dbCategories, ...settings.customCategories]));

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
    try { callback(await uploadImage(file)); } 
    catch (err) { alert("Upload failed"); } 
    finally { setUploadingUrl(false); }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (name && !allCategories.includes(name)) {
      setSettings({ ...settings, customCategories: [...settings.customCategories, name] });
      setNewCatName("");
    }
  };

  const updateCatImage = (cat: string, url: string) => {
    setSettings({ ...settings, categoryImages: { ...settings.categoryImages, [cat]: url } });
  };

  const toggleTrending = (cat: string) => {
    const next = settings.trendingCategories.includes(cat)
      ? settings.trendingCategories.filter((c) => c !== cat)
      : [...settings.trendingCategories, cat];
    setSettings({ ...settings, trendingCategories: next });
  };

  const moveTrending = (index: number, direction: number) => {
    const next = [...settings.trendingCategories];
    const [item] = next.splice(index, 1);
    next.splice(index + direction, 0, item);
    setSettings({ ...settings, trendingCategories: next });
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-20 mt-24 px-4 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-espresso">Storefront</h1>
          <p className="text-sm text-espresso/60">Manage your homepage layout and settings.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-espresso text-cream px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-espresso/90 disabled:opacity-50">
          <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Hero Slider */}
      <section className="bg-cream border border-espresso/10 p-6 rounded-3xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-espresso">Homepage Hero Slider</h2>
          <button onClick={addSlide} className="flex items-center gap-1.5 text-sm font-semibold text-cola-red hover:underline">
            <Plus size={15} /> Add Slide
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {settings.sliderSlides.map((slide, i) => (
            <div key={i} className="flex items-start gap-4 p-4 border border-espresso/10 rounded-2xl">
              <label className="relative w-32 h-20 rounded-xl overflow-hidden border-2 border-dashed border-espresso/20 flex items-center justify-center cursor-pointer hover:border-cola-red transition-colors shrink-0">
                {slide.imageUrl ? <img src={slide.imageUrl} alt="Slide preview" className="object-cover w-full h-full" /> : <ImagePlus size={24} className="text-espresso/30" />}
                {uploadingUrl && !slide.imageUrl && <span className="absolute inset-0 bg-cream/70 flex items-center justify-center text-xs">...</span>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, (url) => updateSlide(i, { imageUrl: url })); e.target.value = ""; }} />
              </label>

              <div className="flex-1 flex flex-col gap-3">
                <input placeholder="Slide Text (e.g. New Arrivals)" value={slide.title} onChange={(e) => updateSlide(i, { title: e.target.value })} className={inputClass} />
                <input placeholder="Link URL (e.g. /shop?category=Tins)" value={slide.link} onChange={(e) => updateSlide(i, { link: e.target.value })} className={inputClass} />
              </div>

              <button onClick={() => removeSlide(i)} className="w-10 h-10 flex items-center justify-center rounded-full text-espresso/40 hover:text-cola-red hover:bg-cola-red/5 transition-colors shrink-0">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Unified Categories & Trending Section */}
      <section className="bg-cream border border-espresso/10 p-6 rounded-3xl flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-espresso">Categories & Homepage Layout</h2>
          <p className="text-xs text-espresso/60 mt-1">Add cover photos, pick what shows on the homepage, and reorder them.</p>
        </div>

        <form onSubmit={handleAddCategory} className="flex gap-3">
          <input type="text" placeholder="New Category Name (e.g., Diwali Specials)..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className={inputClass} />
          <button type="submit" disabled={!newCatName.trim()} className="shrink-0 bg-espresso text-cream px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">Add Category</button>
        </form>

        <div className="flex flex-col gap-3 mt-2">
          {/* Trending Categories First */}
          {settings.trendingCategories.map((cat, i) => (
            <CategoryRow key={cat} cat={cat} index={i} isTrending={true} />
          ))}
          
          {/* Other Categories Second */}
          {allCategories.filter(c => !settings.trendingCategories.includes(c)).map((cat) => (
            <CategoryRow key={cat} cat={cat} index={-1} isTrending={false} />
          ))}
          
          {allCategories.length === 0 && <p className="text-sm text-espresso/50 italic py-2">No categories found or created yet.</p>}
        </div>
      </section>
    </div>
  );

  // Helper row component
  function CategoryRow({ cat, index, isTrending }: { cat: string, index: number, isTrending: boolean }) {
    const imageUrl = settings?.categoryImages[cat] || "";
    const isCustom = settings?.customCategories.includes(cat);

    const handleDelete = () => {
      if (!settings) return;
      if (confirm(`Remove "${cat}"?`)) {
        setSettings({
          ...settings,
          customCategories: settings.customCategories.filter(c => c !== cat),
          trendingCategories: settings.trendingCategories.filter(c => c !== cat),
        });
      }
    };

    return (
      <div className="flex items-center gap-4 p-3 bg-white border border-espresso/10 rounded-2xl shadow-sm">
        <label className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-dashed border-espresso/20 flex items-center justify-center cursor-pointer hover:border-cola-red transition-colors shrink-0">
          {imageUrl ? <ProductImage url={imageUrl} alt={cat} /> : <ImagePlus size={16} className="text-espresso/30" />}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, (url) => updateCatImage(cat, url)); e.target.value = ""; }} />
        </label>
        
        <div className="flex-1 font-semibold text-espresso">{cat}</div>

        <label className="flex items-center gap-2 cursor-pointer border-r border-espresso/10 pr-4 mr-2">
          <input type="checkbox" className="w-4 h-4 accent-cola-red" checked={isTrending} onChange={() => toggleTrending(cat)} />
          <span className="text-xs text-espresso/70 font-semibold">On Homepage</span>
        </label>

        {isTrending && (
          <div className="flex items-center gap-1 border-r border-espresso/10 pr-2 mr-2">
            <button disabled={index === 0} onClick={() => moveTrending(index, -1)} className="p-1.5 text-espresso/40 hover:text-espresso disabled:opacity-30"><ArrowUp size={16} /></button>
            <button disabled={index === settings!.trendingCategories.length - 1} onClick={() => moveTrending(index, 1)} className="p-1.5 text-espresso/40 hover:text-espresso disabled:opacity-30"><ArrowDown size={16} /></button>
          </div>
        )}

        {isCustom ? (
          <button onClick={handleDelete} className="p-2 text-espresso/40 hover:text-cola-red transition-colors"><Trash2 size={16} /></button>
        ) : (
          <div className="w-8" />
        )}
      </div>
    );
  }
}