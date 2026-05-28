import { motion } from "motion/react";
import { HERO_FEATURES } from "../data/heroFeatures";
import { HeroFeatureItem } from "./HeroFeatureItem";
import { staggerContainer, viewportOnce } from "@/lib/motion";

export function HeroFeatureList() {
  return (
    <motion.ul
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4"
      variants={staggerContainer(0.1, 0.35)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {HERO_FEATURES.map((feature) => (
        <HeroFeatureItem key={feature.title} icon={feature.icon} title={feature.title} />
      ))}
    </motion.ul>
  );
}
