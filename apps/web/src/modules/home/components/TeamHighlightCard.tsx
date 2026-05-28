import { motion } from "motion/react";
import { Users } from "lucide-react";
import { EASE_OUT, fadeUp } from "@/lib/motion";

export function TeamHighlightCard() {
  return (
    <motion.article
      variants={fadeUp}
      transition={EASE_OUT}
      whileHover={{ y: -4 }}
      className="flex h-full flex-col justify-center rounded-2xl bg-main/10 p-6 sm:p-8"
    >
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-main/15 text-main">
        <Users className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="font-heading text-xl font-bold text-dark-accent sm:text-2xl">
        Trabajo en equipo para tu bienestar
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        Cada tratamiento es diseñado junto a nuestro equipo para lograr tu mejor recuperación.
      </p>
    </motion.article>
  );
}
