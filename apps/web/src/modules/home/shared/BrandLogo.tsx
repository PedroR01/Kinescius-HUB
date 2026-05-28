import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

export function BrandLogo({ className, compact = false }: BrandLogoProps) {
  return (
    <motion.a
      href="#inicio"
      className={cn("inline-flex items-center gap-2.5 sm:gap-3 text-left", className)}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <img
        src="/logo.png"
        alt="Kinescius"
        className={cn("shrink-0 object-contain", compact ? "h-9 w-9" : "h-10 w-10 sm:h-11 sm:w-11")}
      />
      <div className="leading-tight">
        <p className="font-heading text-base font-extrabold tracking-tight text-dark-accent sm:text-lg">
          KINESCIUS
        </p>
        {!compact && (
          <p className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-main sm:text-[0.65rem]">
            Centro de Rehabilitación
          </p>
        )}
      </div>
    </motion.a>
  );
}
