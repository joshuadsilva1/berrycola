import type { Category } from "../data/products";

// Each path is authored in a 0..1 (objectBoundingBox) coordinate space, so a
// single <clipPath> definition scales correctly to any element size that
// references it via `clip-path: url(#id)`.
const PATHS: Record<string, string> = {
  bag: "M0.30,0.22 C0.30,0.08 0.36,0.02 0.42,0.02 C0.47,0.02 0.47,0.10 0.47,0.16 L0.47,0.22 L0.53,0.22 L0.53,0.16 C0.53,0.10 0.53,0.02 0.58,0.02 C0.64,0.02 0.70,0.08 0.70,0.22 L0.70,0.24 C0.82,0.24 0.90,0.30 0.90,0.40 L0.90,0.90 C0.90,0.95 0.86,0.98 0.80,0.98 L0.20,0.98 C0.14,0.98 0.10,0.95 0.10,0.90 L0.10,0.40 C0.10,0.30 0.18,0.24 0.30,0.24 Z",
  pants: "M0.15,0.02 L0.85,0.02 L0.85,0.20 L0.78,0.98 L0.58,0.98 L0.52,0.42 L0.48,0.42 L0.42,0.98 L0.22,0.98 L0.15,0.20 Z",
  phone: "M0.08,0.08 Q0.08,0.02 0.16,0.02 L0.42,0.02 L0.42,0.06 Q0.42,0.08 0.44,0.08 L0.56,0.08 Q0.58,0.08 0.58,0.06 L0.58,0.02 L0.84,0.02 Q0.92,0.02 0.92,0.08 L0.92,0.92 Q0.92,0.98 0.84,0.98 L0.16,0.98 Q0.08,0.98 0.08,0.92 Z",
  pendant: "M0.42,0.16 Q0.42,0.04 0.50,0.04 Q0.58,0.04 0.58,0.16 L0.58,0.20 Q0.80,0.24 0.80,0.45 L0.80,0.85 Q0.80,0.98 0.65,0.98 L0.35,0.98 Q0.20,0.98 0.20,0.85 L0.20,0.45 Q0.20,0.24 0.42,0.20 Z",
  tin: "M0.05,0.03 L0.95,0.03 L0.95,0.20 L0.90,0.20 L0.90,0.92 Q0.90,0.98 0.83,0.98 L0.17,0.98 Q0.10,0.98 0.10,0.92 L0.10,0.20 L0.05,0.20 Z",
};

export const CATEGORY_SHAPE: Record<Category, { id: string; gradient: [string, string] }> = {
  "Bag Charms": { id: "bag", gradient: ["#d51f1f", "#a71414"] },
  "Carabiners": { id: "pants", gradient: ["#4a6178", "#293845"] },
  "Phone Charms": { id: "phone", gradient: ["#424240", "#3c2620"] },
  "Chains & Necklaces": { id: "pendant", gradient: ["#af7a6e", "#6b4a42"] },
  "Charm Tins": { id: "tin", gradient: ["#d51f1f", "#3c2620"] },
};

export function CategoryShapeDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        {Object.entries(PATHS).map(([id, d]) => (
          <clipPath id={`shape-${id}`} clipPathUnits="objectBoundingBox" key={id}>
            <path d={d} />
          </clipPath>
        ))}
      </defs>
    </svg>
  );
}

export function CategoryShape({
  category,
  size = 120,
  className = "",
}: {
  category: Category;
  size?: number;
  className?: string;
}) {
  const { id, gradient } = CATEGORY_SHAPE[category];
  const gid = `shape-fill-${id}`;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        clipPath: `url(#shape-${id})`,
        filter: "drop-shadow(0 12px 16px rgba(60,38,32,0.28))",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${gid})`} />
      </svg>
    </div>
  );
}
