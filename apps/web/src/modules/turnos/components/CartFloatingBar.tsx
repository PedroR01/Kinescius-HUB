import { AnimatePresence, motion } from "motion/react";
import { ShoppingCartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnBase, btnPrimary } from "@/lib/ks-page-styles";
import { CLASS_PRICE } from "@/lib/constants";

type CartFloatingBarProps = {
  count: number;
  clasesAFavor?: number;
  onCheckout: () => void;
};

function formatCurrency(amount: number) {
  return amount.toLocaleString("es-AR");
}

export function CartFloatingBar({ count, clasesAFavor = 0, onCheckout }: CartFloatingBarProps) {
  const clasesFavorAplicadas = Math.min(count, clasesAFavor);
  const clasesRestantes = count - clasesFavorAplicadas;
  const subtotal = clasesRestantes * CLASS_PRICE;

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
        >
          <div className="flex w-full max-w-[520px] items-center justify-between gap-4 rounded-ks-lg border border-[rgba(82,183,136,0.25)] bg-white px-5 py-3.5 shadow-[0_8px_30px_rgba(18,156,108,0.25)]">
            <div className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-ks-full bg-ks-green-pale text-ks-green-mid">
                <ShoppingCartIcon className="size-5" aria-hidden />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-ks-full bg-ks-green-dark px-1 font-outfit text-[11px] font-bold text-white">
                  {count}
                </span>
              </span>
              <div>
                <p className="m-0 font-outfit text-sm font-semibold text-ks-text-dark">
                  {count} clase{count > 1 ? "s" : ""} en el carrito
                </p>
                <p className="m-0 text-xs text-ks-gray-text">${formatCurrency(subtotal)}</p>
              </div>
            </div>
            <button
              type="button"
              className={cn(btnBase, btnPrimary, "px-5 py-2.5 text-sm")}
              onClick={onCheckout}
            >
              Ver resumen
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
