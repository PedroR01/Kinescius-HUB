import {
  btnBase,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
} from "@/lib/ks-page-styles";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useRegistrarAsistenciaManual } from "@/modules/asistencia/hooks/useAsistencia";
import { UserRoundCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

type ManualAttendanceModalProps = {
  isOpen: boolean;
  claseId: number | null;
  claseLabel: string;
  onClose: () => void;
};

export function ManualAttendanceModal({
  isOpen,
  claseId,
  claseLabel,
  onClose,
}: ManualAttendanceModalProps) {
  const [identificador, setIdentificador] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const registrarMutation = useRegistrarAsistenciaManual();

  useEffect(() => {
    if (isOpen) {
      return;
    }
    setIdentificador("");
    setErrorMessage(null);
  }, [isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const authToken = localStorage.getItem("miToken");
    if (!authToken || !claseId) {
      setErrorMessage("No se pudo identificar tu sesión. Volvé a iniciar sesión.");
      return;
    }

    const valor = identificador.trim();
    if (!valor) {
      setErrorMessage("Ingresá el DNI o el mail del cliente.");
      return;
    }

    setErrorMessage(null);
    registrarMutation.mutate(
      { claseId, identificador: valor, authToken },
      {
        onSuccess: (data) => {
          const nombreCompleto = [data.cliente.nombre, data.cliente.apellido]
            .filter(Boolean)
            .join(" ");
          toast.success(
            nombreCompleto
              ? `Presente registrado para ${nombreCompleto}.`
              : "Presente registrado correctamente.",
          );
          onClose();
        },
        onError: (error) => {
          const message =
            error instanceof Error
              ? error.message
              : "No se pudo registrar la asistencia.";
          setErrorMessage(message);
        },
      },
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-1000 flex items-center justify-center bg-[rgba(15,36,25,0.45)] p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={EASE_OUT}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-attendance-title"
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
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ks-full bg-[rgba(82,183,136,0.15)] text-ks-green-mid">
                <UserRoundCheck className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2
                  id="manual-attendance-title"
                  className="m-0 font-outfit text-lg font-bold text-ks-text-dark"
                >
                  Asistencia manual
                </h2>
                <p className="mt-2 m-0 text-sm leading-relaxed text-ks-gray-text">
                  Registrá el presente de un cliente inscripto en{" "}
                  <span className="font-semibold text-ks-text-dark">{claseLabel}</span>{" "}
                  con su DNI o mail.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="identificador-cliente" className={labelClass}>
                  DNI O MAIL
                </label>
                <input
                  id="identificador-cliente"
                  type="text"
                  autoComplete="off"
                  autoFocus
                  value={identificador}
                  onChange={(event) => {
                    setIdentificador(event.target.value);
                    if (errorMessage) {
                      setErrorMessage(null);
                    }
                  }}
                  placeholder="Ej: 40111222 o cliente@mail.com"
                  className={inputClass}
                  disabled={registrarMutation.isPending}
                />
              </div>

              {errorMessage ? (
                <p className="m-0 rounded-ks-md border border-[rgba(192,57,43,0.3)] bg-ks-red-soft px-4 py-3 text-sm font-medium text-ks-red">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className={cn(btnBase, btnSecondary, "sm:px-5")}
                  onClick={onClose}
                  disabled={registrarMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={cn(btnBase, btnPrimary, "sm:px-5")}
                  disabled={registrarMutation.isPending || !claseId}
                >
                  {registrarMutation.isPending
                    ? "Registrando..."
                    : "Dar presente"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
