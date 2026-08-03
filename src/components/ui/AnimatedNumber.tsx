import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  className,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 22, mass: 0.6 });
  const display = useTransform(spring, (v) =>
    `${v.toLocaleString("fr-FR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`,
  );
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return display.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
  }, [display]);

  return (
    <motion.span ref={ref} className={className}>
      {value.toLocaleString("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </motion.span>
  );
}
