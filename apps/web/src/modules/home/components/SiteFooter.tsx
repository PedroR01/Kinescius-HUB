import { motion } from "motion/react";
import { Mail, MapPin, Phone } from "lucide-react";
import { EASE_OUT, fadeUp, staggerContainer } from "@/lib/motion";
import { CONTACT_INFO } from "../data/contact";
import { NAV_LINKS } from "../data/navLinks";
import { BrandLogo } from "../shared/BrandLogo";
import { NavLinks } from "../shared/NavLinks";
import { SocialLinks } from "../shared/SocialLinks";

export function SiteFooter() {
  return (
    <footer
      id="contacto"
      className="border-t border-border/70 bg-bg px-4 pb-8 pt-12 sm:px-6 sm:pt-16"
    >
      <motion.div
        className="mx-auto grid w-full max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        <motion.div variants={fadeUp} transition={EASE_OUT}>
          <BrandLogo />
        </motion.div>

        <motion.div variants={fadeUp} transition={EASE_OUT}>
          <h3 className="mb-3 font-heading text-base font-bold text-dark-accent">Enlaces</h3>
          <NavLinks className="text-text-h/60" links={NAV_LINKS} orientation="vertical" />
        </motion.div>

        <motion.div variants={fadeUp} transition={EASE_OUT}>
          <h3 className="mb-3 font-heading text-base font-bold text-dark-accent">Contacto</h3>
          <ul className="space-y-2.5 text-sm text-text-h/60">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-main" aria-hidden />
              <a href={`tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`} className="hover:text-main">
                {CONTACT_INFO.phone}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-main" aria-hidden />
              <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-main">
                {CONTACT_INFO.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-main" aria-hidden />
              <span>{CONTACT_INFO.address}</span>
            </li>
          </ul>
        </motion.div>

        <motion.div variants={fadeUp} transition={EASE_OUT}>
          <h3 className="mb-3 font-heading text-base font-bold text-dark-accent">Síguenos</h3>
          <SocialLinks />
        </motion.div>
      </motion.div>

      <motion.p
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={EASE_OUT}
        className="mx-auto mt-10 max-w-6xl border-t border-border/60 pt-6 text-center text-xs text-muted-foreground sm:text-sm"
      >
        © 2025 Kinescius Centro de Rehabilitación. Todos los derechos reservados.
      </motion.p>
    </footer>
  );
}
