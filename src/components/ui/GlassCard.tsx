import { motion } from "framer-motion";
import type { ReactNode } from "react";
import clsx from "clsx";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  glowColor?: "cyan" | "orange" | "green" | "none";
}

const glowMap: Record<NonNullable<GlassCardProps["glowColor"]>, string> = {
  cyan: "hover:shadow-[0_0_50px_-12px_rgba(34,232,255,0.35)]",
  orange: "hover:shadow-[0_0_50px_-12px_rgba(251,146,60,0.35)]",
  green: "hover:shadow-[0_0_50px_-12px_rgba(52,211,153,0.35)]",
  none: "",
};

export function GlassCard({
  children,
  className,
  delay = 0,
  glowColor = "cyan",
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className={clsx(
        "glass-panel p-5 transition-shadow duration-300",
        glowMap[glowColor],
        className,
      )}
    >
      <div className="glass-sheen" />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}
