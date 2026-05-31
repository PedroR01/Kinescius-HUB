import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnBase, btnPrimary, btnSecondary } from "@/lib/ks-page-styles";
import { EASE_OUT } from "@/lib/motion";

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmLogoutModal({ isOpen, onClose, onConfirm }: ConfirmLogoutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(15,36,25,0.45)] p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={EASE_OUT}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          <motion.div
            className="w-full max-w-[420px] rounded-ks-lg bg-white p-7 shadow-[0_20px_60px_rgba(26,58,42,0.18)]"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={EASE_OUT}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ks-full bg-[rgba(255,180,0,0.15)] text-[#a67c00]">
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2
                  id="logout-modal-title"
                  className="m-0 font-outfit text-lg font-bold text-ks-text-dark"
                >
                  ¿Cerrar sesión?
                </h2>
                <p className="mt-2 m-0 text-sm leading-relaxed text-ks-gray-text">
                  Vas a salir de tu cuenta en Kinescius. Podrás volver a iniciar sesión cuando
                  quieras.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button type="button" className={cn(btnBase, btnSecondary, "sm:px-5")} onClick={onClose}>
                Cancelar
              </button>
              <button type="button" className={cn(btnBase, btnPrimary, "sm:px-5")} onClick={onConfirm}>
                Sí, cerrar sesión
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
