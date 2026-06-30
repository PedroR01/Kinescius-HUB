import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ClassSlot, KinesciusClass } from "@/lib/class-interface";
import { formatDate, formatTime } from "@/lib/utils";

interface CheckoutFlowParams {
  clienteId: number | null;
  enrolledClassIds: Set<number>;
  classes: KinesciusClass[];
  cartItems: ClassSlot[];
  addToCart: (slot: ClassSlot) => boolean;
  removeFromCart: (key: string) => void;
  removePaidFromCart: (keys: string[]) => void;
  onRefresh: () => void;
  setMontoAFavor: (amount: number) => void;
}

function hasTimeConflict(
  slot: ClassSlot,
  classes: KinesciusClass[],
  enrolledClassIds: Set<number>
): boolean {
  return classes
    .filter((clase) => enrolledClassIds.has(clase.id))
    .some(
      (clase) =>
        formatDate(clase.fecha) === slot.date && formatTime(clase.hora) === slot.time
    );
}

export function useCheckoutFlow({
  clienteId,
  enrolledClassIds,
  classes,
  cartItems,
  addToCart,
  removeFromCart,
  removePaidFromCart,
  onRefresh,
  setMontoAFavor,
}: CheckoutFlowParams) {
  const [checkoutItems, setCheckoutItems] = useState<ClassSlot[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [checkoutFromCart, setCheckoutFromCart] = useState(false);

  const checkTimeConflict = useCallback(
    (slot: ClassSlot) => hasTimeConflict(slot, classes, enrolledClassIds),
    [classes, enrolledClassIds]
  );

  const openCheckout = useCallback(
    (items: ClassSlot[], fromCart: boolean) => {
      if (!clienteId) {
        toast.error("No se pudo identificar tu cuenta. Por favor, iniciá sesión.");
        return;
      }
      setCheckoutItems(items);
      setCheckoutFromCart(fromCart);
      setIsPaymentModalOpen(true);
    },
    [clienteId]
  );

  const closeCheckout = useCallback(() => {
    setIsPaymentModalOpen(false);
  }, []);

  const handleEnroll = useCallback(
    (slot: ClassSlot) => {
      if (enrolledClassIds.has(slot.source.id)) return;
      if (checkTimeConflict(slot)) {
        toast.error(`Ya tenés una clase a las ${slot.time}hs ese día.`);
        return;
      }
      openCheckout([slot], false);
    },
    [checkTimeConflict, enrolledClassIds, openCheckout]
  );

  const handleAddToCart = useCallback(
    (slot: ClassSlot) => {
      if (enrolledClassIds.has(slot.source.id)) return;
      if (checkTimeConflict(slot)) {
        toast.error(`Ya tenés una clase a las ${slot.time}hs ese día.`);
        return;
      }
      const added = addToCart(slot);
      if (added) {
        toast.success("Clase agregada al carrito");
      } else {
        removeFromCart(slot.key);
        toast.info(`${slot.className} quitada del carrito`);
      }
    },
    [addToCart, checkTimeConflict, enrolledClassIds, removeFromCart]
  );

  const handleCartCheckout = useCallback(() => {
    const conflictivo = cartItems.find(checkTimeConflict);
    if (conflictivo) {
      toast.error(
        `Ya tenés una clase a las ${conflictivo.time}hs el ${conflictivo.date}. Quitala del carrito antes de continuar.`
      );
      return;
    }
    openCheckout(cartItems, true);
  }, [cartItems, checkTimeConflict, openCheckout]);

  const handlePaymentSuccess = useCallback(
    (paidKeys: string[], newSaldo?: number) => {
      removePaidFromCart(paidKeys);
      if (newSaldo !== undefined) {
        setMontoAFavor(newSaldo);
      }
      onRefresh();
      setCheckoutItems([]);
    },
    [onRefresh, removePaidFromCart, setMontoAFavor]
  );

  const handleRemoveFromCheckout = useCallback(
    (key: string) => {
      removeFromCart(key);
      setCheckoutItems((prev) => {
        const next = prev.filter((slot) => slot.key !== key);
        if (next.length === 0) setIsPaymentModalOpen(false);
        return next;
      });
    },
    [removeFromCart]
  );

  return {
    checkoutItems,
    isPaymentModalOpen,
    checkoutFromCart,
    handleEnroll,
    handleAddToCart,
    handleCartCheckout,
    handlePaymentSuccess,
    handleRemoveFromCheckout,
    closeCheckout,
  };
}
