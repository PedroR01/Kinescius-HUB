import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { EASE_OUT, fadeUp } from "@/lib/motion";

interface HeroFeatureItemProps {
  icon: LucideIcon;
  title: string;
}

export function HeroFeatureItem({ icon: Icon, title }: HeroFeatureItemProps) {
  return (
    <motion.li
      variants={fadeUp}
      transition={EASE_OUT}
      className="flex items-center justify-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-(--shadow) sm:gap-3.5 sm:px-5 sm:py-4"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-main/10 text-main">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-left text-sm font-semibold text-dark-accent sm:text-[0.95rem]">
        {title}
      </span>
    </motion.li>
  );
}
