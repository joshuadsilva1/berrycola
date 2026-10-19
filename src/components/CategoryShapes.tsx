import {
  ShoppingBag,
  Package,
  Sparkles,
  Gem,
  Heart,
  Star,
  Gift,
  KeyRound,
  Tag,
  Crown,
  Ticket,
  Camera,
  Disc3,
  GlassWater,
  Link2,
  Shirt,
  Trophy,
  Flame,
  Music,
  Smile,
  Zap,
  Box,
  Bookmark,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  ShoppingBag,
  Package,
  Box,
  Sparkles,
  Gem,
  Heart,
  Star,
  Gift,
  KeyRound,
  Tag,
  Crown,
  Ticket,
  Camera,
  Disc3,
  GlassWater,
  Link2,
  Shirt,
  Trophy,
  Flame,
  Music,
  Smile,
  Zap,
  Bookmark,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export function getCategoryIconComponent(value?: string | null): LucideIcon | null {
  if (!value) return null;
  if (value.startsWith("icon:")) {
    const name = value.slice(5);
    return CATEGORY_ICONS[name] ?? Sparkles;
  }
  if (CATEGORY_ICONS[value]) {
    return CATEGORY_ICONS[value];
  }
  return null;
}

export function CategoryShapeDefs() {
  return null;
}

export function CategoryShape({
  imageUrl,
  alt = "",
  size = 56,
  className = "",
}: {
  category?: string;
  imageUrl?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}) {
  if (!imageUrl) return null;

  const Icon = getCategoryIconComponent(imageUrl);
  if (Icon) {
    return (
      <div
        className={`rounded-full bg-cream border border-espresso/15 flex items-center justify-center text-espresso ${className}`}
        style={{ width: size, height: size }}
      >
        <Icon size={Math.round(size * 0.42)} />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`object-contain drop-shadow-[0_8px_12px_rgba(60,38,32,0.2)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}