import type { Crop } from "../data/products";

// Renders a photo filling its (square) container, optionally zoomed into one
// area. The same maths is used by the admin zoom picker, so customers see
// exactly the area the admin chose.
export default function ProductImage({
  url,
  crop,
  alt,
  className = "",
}: {
  url: string;
  crop?: Crop | null;
  alt: string;
  className?: string;
}) {
  if (!crop || crop.zoom <= 1) {
    return <img src={url} alt={alt} draggable={false} className={`w-full h-full object-cover ${className}`} />;
  }
  const size = crop.zoom * 100;
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <img
        src={url}
        alt={alt}
        draggable={false}
        className="absolute max-w-none object-cover"
        style={{
          width: `${size}%`,
          height: `${size}%`,
          left: `${(0.5 - crop.x * crop.zoom) * 100}%`,
          top: `${(0.5 - crop.y * crop.zoom) * 100}%`,
        }}
      />
    </div>
  );
}

/** Which photo + zoom an option/gallery entry shows. */
export function imageFor(
  item: { imageUrl?: string | null; crop?: Crop | null },
  mainUrl?: string | null,
): { url: string; crop: Crop | null } | null {
  if (item.crop && mainUrl) return { url: mainUrl, crop: item.crop };
  if (item.imageUrl) return { url: item.imageUrl, crop: null };
  return null;
}
