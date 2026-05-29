import { motion } from "motion/react";
import { Calendar } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EASE_OUT, fadeUp, staggerContainer } from "@/lib/motion";

export function RecoveryBanner() {
  return (
    <section
      id="tratamientos"
      className="px-4 py-10 sm:px-6 sm:py-14"
      aria-labelledby="recovery-banner-title"
    >
      <motion.div
        className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 rounded-3xl bg-gradient-to-r from-main to-light-accent px-6 py-10 text-center sm:flex-row sm:justify-between sm:gap-8 sm:px-10 sm:py-12 sm:text-left"
        variants={staggerContainer(0.12)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        <motion.div
          variants={fadeUp}
          transition={EASE_OUT}
          className="flex flex-col items-center gap-4 sm:flex-row sm:items-center"
        >
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/95 text-main shadow-sm">
            <Calendar className="h-7 w-7" aria-hidden />
          </span>
          <h2
            id="recovery-banner-title"
            className="max-w-md font-heading text-xl font-extrabold leading-snug text-white sm:text-2xl lg:text-3xl"
          >
            Da el primer paso hacia tu recuperación
          </h2>
        </motion.div>

        <motion.div variants={fadeUp} transition={EASE_OUT}>
          <ButtonLink to="/solicitarTurno" variant="inverse" size="md" className="min-w-[180px]">
            Agenda tu cita
          </ButtonLink>
        </motion.div>
      </motion.div>
    </section>
  );
}
