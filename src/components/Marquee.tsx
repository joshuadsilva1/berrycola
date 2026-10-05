import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function Marquee({
  children,
  speed = 28,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div
        className="inline-flex"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        <span className="inline-flex">{children}</span>
        <span className="inline-flex" aria-hidden>{children}</span>
      </motion.div>
    </div>
  );
}
