import { useEffect, useRef, useState } from "react";
import { Check, Crop as CropIcon, Maximize2, RotateCcw, X } from "lucide-react";

export type AspectPreset = "1:1" | "9:16" | "4:5" | "16:9" | "free";

interface CropBox {
  /** Normalized 0..1 coordinates relative to displayed image */
  x: number;
  y: number;
  w: number;
  h: number;
}

const PRESETS: { id: AspectPreset; label: string; ratio: number | null; hint: string }[] = [
  { id: "1:1", label: "1:1", ratio: 1, hint: "Square" },
  { id: "9:16", label: "9:16", ratio: 9 / 16, hint: "Vertical" },
  { id: "4:5", label: "4:5", ratio: 4 / 5, hint: "Portrait" },
  { id: "16:9", label: "16:9", ratio: 16 / 9, hint: "Landscape" },
  { id: "free", label: "Free", ratio: null, hint: "Any ratio" },
];

type DragHandle = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

export default function ImageResizerModal({
  imageSrc,
  initialPreset = "1:1",
  onCancel,
  onApply,
}: {
  imageSrc: string;
  initialPreset?: AspectPreset;
  onCancel: () => void;
  onApply: (file: File) => Promise<void> | void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 1000, h: 1000 });
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [preset, setPreset] = useState<AspectPreset>(initialPreset);
  const [box, setBox] = useState<CropBox>({ x: 0, y: 0, w: 1, h: 1 });
  const [imageScale, setImageScale] = useState<number>(1); // 0.5 to 1.5 (allows padding/shrinking image inside crop)
  const [bgFill, setBgFill] = useState<"transparent" | "#fbf5e9" | "#ffffff">("#fbf5e9");
  const [outputScale, setOutputScale] = useState<number>(1); // 0.25 to 2.0 multiplier on pixel dimensions
  const [saving, setSaving] = useState(false);

  const dragRef = useRef<{
    handle: DragHandle;
    startClientX: number;
    startClientY: number;
    startBox: CropBox;
    stageW: number;
    stageH: number;
  } | null>(null);

  // Compute crop box that fits a target aspect ratio (width / height in pixels)
  const computePresetBox = (targetRatio: number | null, natW: number, natH: number): CropBox => {
    if (!targetRatio || natW <= 0 || natH <= 0) {
      return { x: 0, y: 0, w: 1, h: 1 };
    }
    const imgRatio = natW / natH;
    // In normalized [0..1] coords: (w * natW) / (h * natH) = targetRatio
    // => w / h = targetRatio / imgRatio
    const normRatio = targetRatio / imgRatio;
    let w = 1;
    let h = 1;
    if (normRatio <= 1) {
      // Narrower than image
      w = normRatio;
      h = 1;
    } else {
      // Wider than image
      w = 1;
      h = 1 / normRatio;
    }
    return {
      x: (1 - w) / 2,
      y: (1 - h) / 2,
      w,
      h,
    };
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const nw = img.naturalWidth || 1000;
    const nh = img.naturalHeight || 1000;
    setNaturalSize({ w: nw, h: nh });
    setLoaded(true);
    setLoadError(null);
    const chosen = PRESETS.find((p) => p.id === preset);
    setBox(computePresetBox(chosen?.ratio ?? null, nw, nh));
  };

  const applyPreset = (nextPreset: AspectPreset) => {
    setPreset(nextPreset);
    const chosen = PRESETS.find((p) => p.id === nextPreset);
    setBox(computePresetBox(chosen?.ratio ?? null, naturalSize.w, naturalSize.h));
  };

  const handlePointerDown = (e: React.PointerEvent, handle: DragHandle) => {
    e.preventDefault();
    e.stopPropagation();
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startBox: { ...box },
      stageW: rect.width,
      stageH: rect.height,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { handle, startClientX, startClientY, startBox, stageW, stageH } = dragRef.current;
    if (stageW <= 0 || stageH <= 0) return;

    const dx = (e.clientX - startClientX) / stageW;
    const dy = (e.clientY - startClientY) / stageH;
    const MIN_SIZE = 0.08;

    const chosen = PRESETS.find((p) => p.id === preset);
    const targetRatio = chosen?.ratio ?? null;
    const imgRatio = naturalSize.w / naturalSize.h;
    const normRatio = targetRatio ? targetRatio / imgRatio : null; // w / h in normalized space

    if (handle === "move") {
      const nx = Math.min(Math.max(0, startBox.x + dx), 1 - startBox.w);
      const ny = Math.min(Math.max(0, startBox.y + dy), 1 - startBox.h);
      setBox({ ...startBox, x: nx, y: ny });
      return;
    }

    let x = startBox.x;
    let y = startBox.y;
    let w = startBox.w;
    let h = startBox.h;

    if (!normRatio) {
      // Free aspect ratio: independent edges/corners
      if (handle.includes("e")) {
        w = Math.min(Math.max(MIN_SIZE, startBox.w + dx), 1 - startBox.x);
      }
      if (handle.includes("s")) {
        h = Math.min(Math.max(MIN_SIZE, startBox.h + dy), 1 - startBox.y);
      }
      if (handle.includes("w")) {
        const maxLeftDelta = startBox.w - MIN_SIZE;
        const clampedDx = Math.min(Math.max(-startBox.x, dx), maxLeftDelta);
        x = startBox.x + clampedDx;
        w = startBox.w - clampedDx;
      }
      if (handle.includes("n")) {
        const maxTopDelta = startBox.h - MIN_SIZE;
        const clampedDy = Math.min(Math.max(-startBox.y, dy), maxTopDelta);
        y = startBox.y + clampedDy;
        h = startBox.h - clampedDy;
      }
      setBox({ x, y, w, h });
    } else {
      // Locked aspect ratio (1:1, 9:16, 4:5, 16:9)
      let deltaW = 0;
      if (handle === "se" || handle === "e" || handle === "ne") {
        deltaW = dx;
      } else if (handle === "sw" || handle === "w" || handle === "nw") {
        deltaW = -dx;
      } else if (handle === "s") {
        deltaW = dy * normRatio;
      } else if (handle === "n") {
        deltaW = -dy * normRatio;
      }

      let nextW = Math.max(MIN_SIZE, startBox.w + deltaW);
      let nextH = nextW / normRatio;

      if (nextH < MIN_SIZE) {
        nextH = MIN_SIZE;
        nextW = nextH * normRatio;
      }

      // Anchor point based on handle
      const anchorRight = handle.includes("w");
      const anchorBottom = handle.includes("n");

      let nextX = anchorRight ? startBox.x + startBox.w - nextW : startBox.x;
      let nextY = anchorBottom ? startBox.y + startBox.h - nextH : startBox.y;

      // Clamp within [0..1]
      if (nextX < 0) {
        nextX = 0;
        if (anchorRight) {
          nextW = startBox.x + startBox.w;
          nextH = nextW / normRatio;
        }
      }
      if (nextY < 0) {
        nextY = 0;
        if (anchorBottom) {
          nextH = startBox.y + startBox.h;
          nextW = nextH * normRatio;
        }
      }
      if (nextX + nextW > 1) {
        nextW = 1 - nextX;
        nextH = nextW / normRatio;
      }
      if (nextY + nextH > 1) {
        nextH = 1 - nextY;
        nextW = nextH * normRatio;
      }

      setBox({ x: nextX, y: nextY, w: nextW, h: nextH });
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const rawCropW = Math.max(1, Math.round(box.w * naturalSize.w));
  const rawCropH = Math.max(1, Math.round(box.h * naturalSize.h));
  const outW = Math.max(1, Math.round(rawCropW * outputScale));
  const outH = Math.max(1, Math.round(rawCropH * outputScale));

  const handleConfirm = async () => {
    if (!imgRef.current || !loaded) return;
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      // Cap max dimension at 2400px so uploads are super fast and never hit server limits
      const maxDim = 2400;
      let finalW = outW;
      let finalH = outH;
      if (finalW > maxDim || finalH > maxDim) {
        const ratio = Math.min(maxDim / finalW, maxDim / finalH);
        finalW = Math.max(1, Math.round(finalW * ratio));
        finalH = Math.max(1, Math.round(finalH * ratio));
      }

      canvas.width = finalW;
      canvas.height = finalH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      if (bgFill !== "transparent") {
        ctx.fillStyle = bgFill;
        ctx.fillRect(0, 0, finalW, finalH);
      } else {
        ctx.clearRect(0, 0, finalW, finalH);
      }

      const sx = box.x * naturalSize.w;
      const sy = box.y * naturalSize.h;
      const sw = box.w * naturalSize.w;
      const sh = box.h * naturalSize.h;

      // Apply imageScale (1.0 = normal crop fill, < 1.0 = zoomed out with padding, > 1.0 = zoomed in)
      const destW = finalW * imageScale;
      const destH = finalH * imageScale;
      const destX = (finalW - destW) / 2;
      const destY = (finalH - destH) / 2;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(imgRef.current, sx, sy, sw, sh, destX, destY, destW, destH);

      const mimeType = bgFill === "transparent" ? "image/png" : "image/jpeg";
      const ext = mimeType === "image/png" ? "png" : "jpg";

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Failed to encode resized image"))),
          mimeType,
          0.92,
        );
      });

      const file = new File([blob], `resized-${Date.now()}.${ext}`, { type: mimeType });
      await onApply(file);
    } catch (err) {
      setLoadError((err as Error).message || "Failed to resize image");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onCancel}
    >
      <div
        className="bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_8px_0_#1e1a18] rounded-3xl w-full max-w-2xl p-5 sm:p-6 flex flex-col gap-5 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] flex items-center justify-center">
              <CropIcon size={16} />
            </span>
            <div>
              <h3 className="font-display text-xl text-espresso">Resize & Crop Image</h3>
              <p className="text-xs text-espresso/60">
                Choose a preset ratio (1:1, 9:16, etc.) or Free ratio and drag handles to resize.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Aspect Ratio Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase  text-espresso/55 mr-1">
            Ratio:
          </span>
          {PRESETS.map((p) => {
            const active = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? "bg-cola-red text-[#fbf5e9]"
                    : "bg-[#fbf5e9] text-espresso hover:text-cola-red"
                }`}
              >
                <span>{p.label}</span>
                <span className={`text-[10px] ${active ? "text-[#fbf5e9]/80" : "text-espresso/45"}`}>
                  ({p.hint})
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setImageScale(1);
              setOutputScale(1);
              applyPreset(preset);
            }}
            title="Reset crop and scale"
            className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 text-espresso hover:text-cola-red flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        {/* Interactive Crop Stage */}
        <div className="w-full bg-[#1e1a18]/90 rounded-2xl p-4 flex items-center justify-center min-h-[280px] max-h-[420px] overflow-hidden select-none">
          {loadError ? (
            <p className="text-cola-red text-sm bg-cream px-4 py-2 rounded-xl">{loadError}</p>
          ) : (
            <div
              ref={stageRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative inline-block max-h-[380px] max-w-full touch-none"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop source"
                crossOrigin="anonymous"
                onLoad={handleImageLoad}
                onError={() => setLoadError("Could not load image for resizing.")}
                draggable={false}
                className="block max-h-[380px] max-w-full w-auto h-auto object-contain rounded-lg pointer-events-none select-none"
                style={{
                  transform: `scale(${imageScale})`,
                  transformOrigin: "center center",
                }}
              />

              {loaded && (
                <>
                  {/* Darkened outside mask + interactive crop frame */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "move")}
                    className="absolute border-2 border-[#fbf5e9] shadow-[0_0_0_9999px_rgba(20,14,12,0.62)] cursor-move"
                    style={{
                      left: `${box.x * 100}%`,
                      top: `${box.y * 100}%`,
                      width: `${box.w * 100}%`,
                      height: `${box.h * 100}%`,
                    }}
                  >
                    {/* Rule-of-thirds grid lines */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                      <div className="border-r border-b border-white/30" />
                      <div className="border-r border-b border-white/30" />
                      <div className="border-b border-white/30" />
                      <div className="border-r border-b border-white/30" />
                      <div className="border-r border-b border-white/30" />
                      <div className="border-b border-white/30" />
                      <div className="border-r border-white/30" />
                      <div className="border-r border-white/30" />
                      <div />
                    </div>

                    {/* Live dimensions pill inside crop box */}
                    <span className="absolute top-2 left-2 bg-[#1e1a18]/85 text-[#fbf5e9] text-[10px] font-semibold px-2 py-0.5 rounded-full pointer-events-none whitespace-nowrap">
                      {outW} × {outH}px ({preset.toUpperCase()})
                    </span>

                    {/* Corner handles */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, "nw")}
                      className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-cola-red border-2 border-[#fbf5e9] cursor-nwse-resize"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, "ne")}
                      className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-cola-red border-2 border-[#fbf5e9] cursor-nesw-resize"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, "sw")}
                      className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-cola-red border-2 border-[#fbf5e9] cursor-nesw-resize"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, "se")}
                      className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-cola-red border-2 border-[#fbf5e9] cursor-nwse-resize"
                    />

                    {/* Edge handles */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, "n")}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 rounded-full bg-[#fbf5e9] border border-[#1e1a18] cursor-ns-resize"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, "s")}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 rounded-full bg-[#fbf5e9] border border-[#1e1a18] cursor-ns-resize"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, "w")}
                      className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 rounded-full bg-[#fbf5e9] border border-[#1e1a18] cursor-ew-resize"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, "e")}
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 rounded-full bg-[#fbf5e9] border border-[#1e1a18] cursor-ew-resize"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Scale & Fit Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-cream/60 border border-espresso/10 rounded-2xl p-3.5">
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-espresso/65">
            <span className="flex items-center justify-between">
              <span>Image Zoom / Fit</span>
              <span className="text-espresso">{Math.round(imageScale * 100)}%</span>
            </span>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={imageScale}
              onChange={(e) => setImageScale(Number(e.target.value))}
              className="accent-cola-red"
            />
          </label>

          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-espresso/65">
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Maximize2 size={11} /> Output Size
              </span>
              <span className="text-espresso">
                {outW} × {outH}px
              </span>
            </span>
            <input
              type="range"
              min={0.25}
              max={1.5}
              step={0.05}
              value={outputScale}
              onChange={(e) => setOutputScale(Number(e.target.value))}
              className="accent-cola-red"
            />
          </label>

          <div className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-espresso/65">
            <span>Background Fill</span>
            <div className="flex items-center gap-1.5 pt-0.5">
              {(
                [
                  ["#fbf5e9", "Cream"],
                  ["#ffffff", "White"],
                  ["transparent", "Clear"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBgFill(val)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    bgFill === val
                      ? "border-cola-red bg-cola-red/10 text-cola-red"
                      : "border-espresso/15 bg-cream text-espresso/70"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-full text-sm font-semibold text-espresso/65 hover:text-espresso cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !loaded}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 text-sm font-semibold hover:bg-cola-red-dark disabled:opacity-50 cursor-pointer"
          >
            <Check size={16} />
            {saving ? "Applying & Uploading…" : "Apply Resize"}
          </button>
        </div>
      </div>
    </div>
  );
}

