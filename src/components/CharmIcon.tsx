import {
  GlassWater,
  Camera,
  Disc3,
  Ticket,
  Link2,
  KeyRound,
  Star,
  Heart,
  Sparkles,
  Package,
  Gem,
  Shirt,
  Trophy,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  GlassWater,
  Camera,
  Disc3,
  Ticket,
  Link2,
  KeyRound,
  Star,
  Heart,
  Sparkles,
  Package,
  Gem,
  Shirt,
  Trophy,
};

interface CharmIconProps {
  icon: string;
  gradient: [string, string];
  size?: number;
  className?: string;
}

export default function CharmIcon({ icon, gradient, size = 96, className = "" }: CharmIconProps) {
  const Icon = ICONS[icon] ?? Sparkles;
  const id = `${icon}-${gradient[0].replace("#", "")}`;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* jump ring */}
      <span
        className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border-[3px]"
        style={{ width: size * 0.22, height: size * 0.22, borderColor: "#42424055" }}
      />
      <svg viewBox="0 0 100 100" width={size} height={size} className="relative drop-shadow-[0_10px_18px_rgba(60,38,32,0.22)]">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
          <radialGradient id={`${id}-shine`} cx="35%" cy="28%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill={`url(#${id})`} />
        <circle cx="50" cy="50" r="46" fill={`url(#${id}-shine)`} />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#fffffe" strokeOpacity="0.35" strokeWidth="1.5" />
      </svg>
      <Icon
        size={size * 0.36}
        strokeWidth={1.75}
        className="absolute text-cream"
        style={{ color: "#fffffe" }}
      />
    </div>
  );
}
