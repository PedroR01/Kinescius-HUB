import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { btnBase, btnPrimary, btnSecondary } from "@/lib/ks-page-styles";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";
import { EASE_OUT } from "@/lib/motion";
import {
    createSuscripcionPreference,
} from "@/api/payments";

type SubscriptionPaymentModalProps = {
    isOpen: boolean;
    clienteId: number | null;
    onClose: () => void;
    onPaymentStarted?: () => void;
};

function formatCurrency(amount: number) {
    return amount.toLocaleString("es-AR");
}

export function SubscriptionPaymentModal({
    isOpen,
    clienteId,
    onClose,
    onPaymentStarted,
}: SubscriptionPaymentModalProps) {
    const [isPaying, setIsPaying] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setErrorMessage(null);
            setIsPaying(false);
        }
    }, [isOpen]);

    const totalFinal = SUBSCRIPTION_PRICE;

    const payLabel = useMemo(() => {
        if (isPaying) return "Procesando...";
        return `Pagar $${formatCurrency(totalFinal)}`;
    }, [isPaying, totalFinal]);

    const handlePay = async () => {
        if (!clienteId) {
            setErrorMessage("No se pudo identificar tu cuenta. Por favor, iniciá sesión.");
            return;
        }

        setIsPaying(true);
        setErrorMessage(null);

        try {
            const { initPoint } = await createSuscripcionPreference(clienteId);

            window.open(initPoint, "_blank", "noopener");
            onPaymentStarted?.();
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
                    className="fixed inset-0 z-1000 flex items-center justify-center bg-[rgba(15,36,25,0.45)] p-6"
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
                                Resumen de suscripción
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
                        <ul className="pt-1 font-outfit text-base font-bold text-ks-text-dark">
                            <li className="flex items-center justify-between">
                                <span>Total a pagar</span>
                                <span className="text-ks-green-mid">${formatCurrency(totalFinal)}</span>
                            </li>
                        </ul>

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
                                disabled={isPaying || !clienteId}
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
