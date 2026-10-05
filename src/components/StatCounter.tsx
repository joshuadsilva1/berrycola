import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

export default function StatCounter({
  value,
  suffix = "",
  label,
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  label: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 24, stiffness: 60 });

  useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, motionValue, value]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      if (ref.current) ref.current.textContent = latest.toFixed(decimals) + suffix;
    });
  }, [spring, suffix, decimals]);

  return (
    <div className="text-center">
      <span ref={ref} className="font-display text-4xl sm:text-5xl text-cream block">
        0{suffix}
      </span>
      <p className="text-cream/50 text-xs uppercase tracking-[0.2em] mt-2">{label}</p>
    </div>
  );
}
