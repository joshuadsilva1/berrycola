import CharmIcon from "./CharmIcon";

interface PaperCharmProps {
  icon?: string;
  gradient?: [string, string];
  image?: string;
  size: number;
  tilt?: number;
}

export default function PaperCharm({ icon, gradient, image, size, tilt = 0 }: PaperCharmProps) {
  if (image) {
    return (
      <img
        src={image}
        alt=""
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
          transform: `rotate(${tilt}deg)`,
          filter: "drop-shadow(0 10px 14px rgba(60,38,32,0.32))",
        }}
      />
    );
  }

  const stroke = Math.max(3, Math.round(size * 0.05));

  return (
    <div className="relative" style={{ width: size, height: size, transform: `rotate(${tilt}deg)` }}>
      <div
        className="absolute rounded-full bg-cream"
        style={{ inset: -stroke, boxShadow: "0 10px 14px rgba(60,38,32,0.32)" }}
      />
      <CharmIcon icon={icon!} gradient={gradient!} size={size} className="relative" />
    </div>
  );
}
