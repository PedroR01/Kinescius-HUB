import { motion } from "motion/react";
import { EASE_OUT, fadeUp } from "@/lib/motion";
import type { Professional } from "../data/professionals";
import { LinkedInIcon } from "../shared/SocialIcons";

interface ProfessionalCardProps {
  professional: Professional;
}

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
  return (
    <motion.article
      variants={fadeUp}
      transition={EASE_OUT}
      whileHover={{ y: -4 }}
      className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow-(--shadow)"
    >
      <div className="aspect-4/5 overflow-hidden bg-main/5">
        <img
          src={professional.imageUrl}
          alt={`Retrato de ${professional.name}`}
          className="h-full w-full object-cover object-top"
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-heading text-lg font-bold text-main">{professional.name}</h3>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground">{professional.role}</p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-text-h/80">{professional.bio}</p>

        <a
          href={professional.linkedInUrl}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`LinkedIn de ${professional.name}`}
          className="mt-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-main transition-colors hover:bg-main/10"
        >
          <LinkedInIcon className="h-4 w-4" />
        </a>
      </div>
    </motion.article>
  );
}
