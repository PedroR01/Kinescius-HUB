import { motion } from "motion/react";
import { AnchorButton, ButtonLink } from "@/components/ui/button";
import { EASE_OUT, fadeUp, staggerContainer } from "@/lib/motion";
import { HexagonDecoration } from "./HexagonDecoration";
import { HeroFeatureList } from "./HeroFeatureList";
import heroImage from "@/assets/hero.jpeg";

export function HomeHero() {
  return (
    <section
      id="sobre-nosotros"
      className="relative overflow-hidden  px-4 py-10 sm:px-6 sm:py-14 lg:py-20"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          animate="visible"
          className="order-2 lg:order-1"
        >
          <motion.h1
            variants={fadeUp}
            transition={EASE_OUT}
            className="font-heading text-3xl font-extrabold leading-[1.12] text-dark-accent sm:text-4xl lg:text-5xl"
          >
            Recupera tu movimiento.
            <span className="block text-main">Mejora tu vida.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={EASE_OUT}
            className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg"
          >
            En Kinescius contamos con un equipo de kinesiólogos especializados en tu bienestar y
            recuperación integral.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={EASE_OUT}
            className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap"
          >
            <ButtonLink to="/solicitarTurno" size="md" className="w-full justify-center sm:w-auto">
              Agenda tu evaluación
            </ButtonLink>
            <AnchorButton
              href="#tratamientos"
              variant="secondary"
              size="md"
              className="w-full justify-center sm:w-auto"
            >
              Conoce nuestros tratamientos
            </AnchorButton>
          </motion.div>

          <motion.div variants={fadeUp} transition={EASE_OUT} className="mt-8 sm:mt-10">
            <HeroFeatureList />
          </motion.div>
        </motion.div>

        <motion.div
          className="relative order-1 lg:order-2"
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...EASE_OUT, delay: 0.15 }}
        >
          <HexagonDecoration />
          <div className="relative mx-auto aspect-4/5 max-w-md overflow-hidden rounded-3xl bg-main/5 shadow-(--shadow) sm:max-w-lg lg:max-w-none">
            <motion.img
              src={heroImage}
              alt="Persona recuperando movilidad con acompañamiento kinesiológico"
              className="h-full w-full object-cover object-top"
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
