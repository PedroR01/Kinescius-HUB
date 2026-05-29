import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EASE_OUT, fadeUp } from "@/lib/motion";
import { NAV_LINKS } from "../data/navLinks";
import { BrandLogo } from "../shared/BrandLogo";
import { NavLinks } from "../shared/NavLinks";
import { ConfirmLogoutModal } from "./ConfirmLogoutModal";
import { cn } from "@/lib/utils";
import { btnBase, btnSecondary } from "@/lib/ks-page-styles";
import { Link } from "@tanstack/react-router";

export function HomeNavbar() {
  const [estaLogueado, setEstaLogueado] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("miToken");
    if (token) {
      setEstaLogueado(true);
    }
  }, []);

  const confirmarCerrarSesion = () => {
    localStorage.removeItem("miToken");
    localStorage.removeItem("rol");
    setEstaLogueado(false);
    setIsLogoutModalOpen(false);
    closeMenu();
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <motion.header
        id="inicio"
        className="sticky top-0 z-50 border-b border-border/60 bg-surface/90 backdrop-blur-md"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={EASE_OUT}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <BrandLogo />

          <div className="hidden  lg:flex lg:items-center lg:gap-5">
            {estaLogueado ? (
              <Link to="/home" className="text-text-h/80">
                Home
              </Link>
            ) : null}
            <NavLinks className="text-text-h/80" links={NAV_LINKS} />
          </div>

          <div className="hidden lg:flex lg:flex-row lg:gap-2">
            {estaLogueado ? (
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                className={cn(btnBase, btnSecondary)}
              >
                Cerrar sesión
              </button>
            ) : (
              <>
                <ButtonLink to="/iniciarSesion" size="sm">
                  Iniciar sesión
                </ButtonLink>
                <ButtonLink variant="secondary" to="/registro" size="sm">
                  Registrarse
                </ButtonLink>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-main lg:hidden"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="border-t border-border/60 bg-surface px-4 pb-5 pt-3 lg:hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={EASE_OUT}
            >
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={EASE_OUT}
              >
                <NavLinks
                  links={NAV_LINKS}
                  orientation="vertical"
                  onNavigate={closeMenu}
                  className="mb-4"
                />
                <ButtonLink to="/solicitarTurno" size="sm" className="w-full justify-center">
                  Agenda tu cita
                </ButtonLink>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmarCerrarSesion}
      />
    </>
  );
}
