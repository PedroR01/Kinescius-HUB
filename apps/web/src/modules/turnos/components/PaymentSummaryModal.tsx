import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { btnBase, btnPrimary, btnSecondary } from "@/lib/ks-page-styles";
import { CLASS_PRICE } from "@/lib/constants";
import { buildClasePayload } from "@/lib/clase-payload";
import { EASE_OUT } from "@/lib/motion";
import type { ClassSlot } from "@/lib/class-interface";
import {
  createMercadoPagoPreference,
  inscribirConSaldoAFavor,
} from "@/api/payments";

type PaymentSummaryModalProps = {
  isOpen: boolean;
  items: ClassSlot[];
  montoAFavor: number;
  clienteId: number | null;
  allowRemove?: boolean;
  onClose: () => void;
  onRemoveItem?: (key: string) => void;
  onPaymentStarted?: (paidKeys: string[]) => void;
  onSuccess: (paidKeys: string[], newSaldo?: number) => void;
};

function formatCurrency(amount: number) {
  return amount.toLocaleString("es-AR");
}

export function PaymentSummaryModal({
  isOpen,
  items,
  montoAFavor,
  clienteId,
  allowRemove = false,
  onClose,
  onRemoveItem,
  onPaymentStarted,
  onSuccess,
}: PaymentSummaryModalProps) {
  const [applyMontoAFavor, setApplyMontoAFavor] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApplyMontoAFavor(false);
      setErrorMessage(null);
      setIsPaying(false);
    }
  }, [isOpen, items]);

  const subtotal = items.length * CLASS_PRICE;
  const montoAplicado = applyMontoAFavor ? Math.min(montoAFavor, subtotal) : 0;
  const totalFinal = subtotal - montoAplicado;

  const payLabel = useMemo(() => {
    if (isPaying) return "Procesando...";
    if (totalFinal === 0) return "Confirmar inscripción";
    return `Pagar $${formatCurrency(totalFinal)}`;
  }, [isPaying, totalFinal]);

  const handlePay = async () => {
    if (!clienteId || items.length === 0) {
      setErrorMessage("No se pudo identificar tu cuenta. Por favor, iniciá sesión.");
      return;
    }

    setIsPaying(true);
    setErrorMessage(null);

    try {
      const clases = items.map((slot) => buildClasePayload(slot.source));
      const paidKeys = items.map((slot) => slot.key);

      if (totalFinal === 0) {
        const result = await inscribirConSaldoAFavor({
          clienteId,
          clases: clases.map((c) => ({ id: c.id })),
          montoAFavorAplicado: montoAplicado,
        });
        toast.success("¡Inscripción confirmada con tu saldo a favor!");
        onSuccess(paidKeys, result.saldoRestante);
        onClose();
        return;
      }

      const { initPoint } = await createMercadoPagoPreference({
        clases,
        clienteId,
        montoAFavorAplicado: montoAplicado,
      });

      toast.success(
        items.length === 1
          ? "Clase lista para el proceso de pago."
          : `${items.length} clases listas para el proceso de pago.`
      );

      onPaymentStarted?.(paidKeys);
      window.open(initPoint, "_blank", "noopener");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo iniciar el pago. Intentá de nuevo.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsPaying(false);
    }
  };

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
          aria-labelledby="payment-modal-title"
        >
          <motion.div
            className="max-h-[85vh] w-full max-w-[520px] overflow-y-auto rounded-ks-lg bg-white p-7 shadow-[0_20px_60px_rgba(26,58,42,0.18)]"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={EASE_OUT}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4 border-b-[1.5px] border-ks-gray-soft pb-4">
              <h2
                id="payment-modal-title"
                className="m-0 font-outfit text-lg font-bold text-ks-text-dark"
              >
                Resumen de inscripción
              </h2>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-ks-full border-none bg-ks-gray-soft text-sm text-ks-gray-text transition-colors duration-150 hover:bg-ks-green-pale hover:text-ks-green-dark"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-ks-gray-text">No hay clases seleccionadas.</p>
            ) : (
              <ul className="m-0 grid list-none gap-2.5 p-0">
                {items.map((slot) => (
                  <li
                    key={slot.key}
                    className="flex items-center justify-between rounded-ks-md border-[1.5px] border-ks-gray-soft bg-ks-off-white px-4 py-3"
                  >
                    <div>
                      <p className="m-0 font-outfit text-[15px] font-semibold text-ks-text-dark">
                        {slot.className}
                      </p>
                      <p className="m-0 mt-0.5 text-[13px] text-ks-gray-text">
                        {slot.date} · {slot.time} hs
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-outfit text-sm font-semibold text-ks-green-mid">
                        ${formatCurrency(CLASS_PRICE)}
                      </span>
                      {allowRemove && onRemoveItem ? (
                        <button
                          type="button"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-ks-full border-none bg-ks-gray-soft text-ks-gray-text transition-colors hover:bg-ks-red-soft hover:text-ks-red"
                          onClick={() => onRemoveItem(slot.key)}
                          aria-label="Quitar del carrito"
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 grid gap-2 border-t-[1.5px] border-ks-gray-soft pt-4 text-sm">
              <div className="flex justify-between text-ks-gray-text">
                <span>
                  Subtotal ({items.length} × ${formatCurrency(CLASS_PRICE)})
                </span>
                <span className="font-semibold text-ks-text-dark">
                  ${formatCurrency(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-ks-gray-text">
                <span>Saldo a favor disponible</span>
                <span className="font-semibold text-ks-green-mid">
                  ${formatCurrency(montoAFavor)}
                </span>
              </div>

              <label
                className={cn(
                  "mt-1 flex cursor-pointer items-center gap-3 rounded-ks-md border-[1.5px] px-4 py-3 transition-colors",
                  montoAFavor > 0
                    ? "border-ks-gray-soft bg-ks-off-white hover:border-ks-green-light"
                    : "cursor-not-allowed border-ks-gray-soft bg-ks-gray-soft opacity-60"
                )}
              >
                <input
                  type="checkbox"
                  className="size-4 accent-ks-green-mid"
                  checked={applyMontoAFavor}
                  disabled={montoAFavor <= 0 || isPaying}
                  onChange={(e) => setApplyMontoAFavor(e.target.checked)}
                />
                <span className="font-outfit text-sm font-medium text-ks-text-dark">
                  Usar saldo a favor
                </span>
              </label>

              {montoAplicado > 0 ? (
                <div className="flex justify-between text-ks-green-mid">
                  <span>Descuento por saldo a favor</span>
                  <span className="font-semibold">-${formatCurrency(montoAplicado)}</span>
                </div>
              ) : null}

              <div className="flex justify-between pt-1 font-outfit text-base font-bold text-ks-text-dark">
                <span>Total a pagar</span>
                <span className="text-ks-green-mid">${formatCurrency(totalFinal)}</span>
              </div>
            </div>

            {errorMessage ? (
              <p className="mt-4 rounded-ks-md border border-[rgba(192,57,43,0.3)] bg-ks-red-soft px-4 py-3 text-sm font-medium text-ks-red">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={cn(btnBase, btnSecondary, "sm:px-5")}
                onClick={onClose}
                disabled={isPaying}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={cn(btnBase, btnPrimary, "sm:px-5")}
                onClick={() => void handlePay()}
                disabled={isPaying || items.length === 0 || !clienteId}
              >
                {payLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
