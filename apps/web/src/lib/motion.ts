import type { Transition, Variants } from "motion/react";

export const EASE_OUT: Transition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1]
};

export const SPRING_SOFT: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 28
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 }
};

export const staggerContainer = (stagger = 0.12, delay = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: stagger, delayChildren: delay }
  }
});

export const viewportOnce = {
  once: true,
  margin: "-60px" as const
};
