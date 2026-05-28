import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT, fadeUp, staggerContainer } from "@/lib/motion";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  className?: string;
  align?: "center" | "left";
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  className,
  align = "center"
}: SectionHeaderProps) {
  const isCentered = align === "center";

  return (
    <motion.header
      className={cn("max-w-2xl", isCentered && "mx-auto text-center", className)}
      variants={staggerContainer(0.14)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      <motion.p
        variants={fadeUp}
        transition={EASE_OUT}
        className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-main sm:text-sm"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={fadeUp}
        transition={EASE_OUT}
        className="font-heading text-2xl font-extrabold leading-tight text-dark-accent sm:text-3xl lg:text-4xl"
      >
        {title}
      </motion.h2>
      <motion.p
        variants={fadeUp}
        transition={EASE_OUT}
        className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base"
      >
        {subtitle}
      </motion.p>
    </motion.header>
  );
}
