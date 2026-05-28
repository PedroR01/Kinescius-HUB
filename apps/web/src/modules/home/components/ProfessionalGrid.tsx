import { motion } from "motion/react";
import { PROFESSIONALS } from "../data/professionals";
import { ProfessionalCard } from "./ProfessionalCard";
import { TeamHighlightCard } from "./TeamHighlightCard";
import { staggerContainer, viewportOnce } from "@/lib/motion";

export function ProfessionalGrid() {
  return (
    <motion.div
      className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
      variants={staggerContainer(0.1, 0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {PROFESSIONALS.map((professional) => (
        <ProfessionalCard key={professional.id} professional={professional} />
      ))}
      <TeamHighlightCard />
    </motion.div>
  );
}
