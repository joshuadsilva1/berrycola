import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductImage from "./ProductImage";
import type { Crop } from "../data/products";

export interface GallerySlide {
  url: string;
  label?: string | null;
  crop?: Crop | null;
}

// Swipeable product images. The parent owns the current index so a variant
// picker can jump to its photo, and swiping onto a variant photo can select it.
export default function ProductGallery({
  slides,
  index,
  onIndexChange,
  alt,
  showThumbnails = true,
}: {
  slides: GallerySlide[];
  index: number;
  onIndexChange: (index: number) => void;
  alt: string;
  showThumbnails?: boolean;
}) {
  // Track which way to slide when the index changes (React's "adjust state
  // when a prop changes" pattern).
  const [previous, setPrevious] = useState(index);
  const [direction, setDirection] = useState(0);
  if (index !== previous) {
    setPrevious(index);
    setDirection(index > previous ? 1 : -1);
  }

  const goTo = (next: number) => onIndexChange((next + slides.length) % slides.length);

  const current = slides[index] ?? slides[0];
  const hasMultiple = slides.length > 1;
  const [ratiosByUrl, setRatiosByUrl] = useState<Record<string, number>>({});

  const activeRatio =
    current.crop && current.crop.zoom > 1
      ? 1
      : ratiosByUrl[current.url] ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative w-full max-h-[680px] mx-auto rounded-[2rem] bg-gradient-to-br from-[#f7f0ec] to-[#efe2db] overflow-hidden transition-[aspect-ratio] duration-300"
        style={{ aspectRatio: String(activeRatio) }}
        tabIndex={hasMultiple ? 0 : undefined}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") goTo(index - 1);
          if (e.key === "ArrowRight") goTo(index + 1);
        }}
      >
        <img
          src={current.url}
          alt=""
          aria-hidden="true"
          className="hidden"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              const r = Math.min(Math.max(img.naturalWidth / img.naturalHeight, 0.5), 2.0);
              setRatiosByUrl((prev) =>
                prev[current.url] === r ? prev : { ...prev, [current.url]: r },
              );
            }
          }}
        />
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            drag={hasMultiple ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) goTo(index + 1);
              else if (info.offset.x > 60) goTo(index - 1);
            }}
            className={`absolute inset-0 ${hasMultiple ? "cursor-grab active:cursor-grabbing" : ""}`}
          >
            <ProductImage
              url={current.url}
              crop={current.crop}
              alt={current.label ? `${alt} , ${current.label}` : alt}
            />
          </motion.div>
        </AnimatePresence>

        {hasMultiple && (
          <>
            <button
              onClick={() => goTo(index - 1)}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-[calc(-50%+2px)] text-espresso flex items-center justify-center hover:text-cola-red transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => goTo(index + 1)}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-[calc(-50%+2px)] text-espresso flex items-center justify-center hover:text-cola-red transition-all"
            >
              <ChevronRight size={18} />
            </button>
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-xs font-medium px-3 py-1 rounded-full bg-espresso/75 text-cream">
              {current.label ?? `${index + 1} / ${slides.length}`}
            </span>
          </>
        )}
      </div>

      {hasMultiple && showThumbnails && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {slides.map((slide, i) => (
            <button
              key={slide.url + i}
              onClick={() => goTo(i)}
              aria-label={`Show ${slide.label ?? `image ${i + 1}`}`}
              aria-current={i === index}
              className="shrink-0 w-20 flex flex-col items-center gap-1.5"
            >
              <span
                className={`block w-20 h-20 rounded-2xl overflow-hidden border-2 transition-colors ${
                  i === index ? "border-cola-red" : "border-transparent hover:border-espresso/20"
                }`}
              >
                <ProductImage url={slide.url} crop={slide.crop} alt="" />
              </span>
              {slide.label && (
                <span
                  className={`text-[11px] leading-tight text-center line-clamp-2 ${
                    i === index ? "text-espresso font-medium" : "text-espresso/55"
                  }`}
                >
                  {slide.label}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
