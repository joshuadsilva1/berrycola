import { useRef } from "react";
import { Move } from "lucide-react";
import ProductImage from "../ProductImage";
import type { Crop } from "../../data/products";

const MIN_ZOOM = 1.2;
const MAX_ZOOM = 5;

export function clampCrop(crop: Crop): Crop {
  const zoom = Math.min(Math.max(crop.zoom, MIN_ZOOM), MAX_ZOOM);
  const half = 0.5 / zoom;
  return {
    zoom,
    x: Math.min(Math.max(crop.x, half), 1 - half),
    y: Math.min(Math.max(crop.y, half), 1 - half),
  };
}

// Drag to move, slider to zoom. The big square is exactly what the customer
// will see; the small one shows where that sits on the full photo.
export default function CropPicker({
  url,
  crop,
  onChange,
}: {
  url: string;
  crop: Crop;
  onChange: (crop: Crop) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; start: Crop } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: crop };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !frame.current) return;
    const size = frame.current.clientWidth;
    const { start } = drag.current;
    // Dragging the photo right should reveal more of its left side.
    onChange(
      clampCrop({
        ...start,
        x: start.x - (e.clientX - drag.current.x) / (size * start.zoom),
        y: start.y - (e.clientY - drag.current.y) / (size * start.zoom),
      }),
    );
  };

  const box = 100 / crop.zoom;

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div
        ref={frame}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        className="relative w-48 h-48 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none border border-espresso/15"
      >
        <ProductImage url={url} crop={crop} alt="Zoomed area" />
        <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-semibold bg-espresso/75 text-cream px-2 py-1 rounded-full pointer-events-none">
          <Move size={11} /> Drag to move
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-espresso/15">
          <ProductImage url={url} alt="Full photo" />
          <span
            className="absolute border-2 border-cola-red rounded-sm shadow-[0_0_0_999px_rgba(60,38,32,0.35)]"
            style={{
              width: `${box}%`,
              height: `${box}%`,
              left: `${(crop.x - 0.5 / crop.zoom) * 100}%`,
              top: `${(crop.y - 0.5 / crop.zoom) * 100}%`,
            }}
          />
        </div>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-espresso/60">
          Zoom {crop.zoom.toFixed(1)}×
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.1}
            value={crop.zoom}
            onChange={(e) => onChange(clampCrop({ ...crop, zoom: Number(e.target.value) }))}
            className="w-24 accent-cola-red"
          />
        </label>
      </div>
    </div>
  );
}
