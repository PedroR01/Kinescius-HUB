import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn, formatDate, formatDateLabel, formatDayLabel, formatTime } from "@/lib/utils";
import type { ClassSlot } from "@/lib/class-interface";
import { CartFloatingBar } from "@/modules/turnos/components/CartFloatingBar";
import { ClassesGrid } from "@/modules/turnos/components/ClassesGrid";
import { PaymentSummaryModal } from "@/modules/turnos/components/PaymentSummaryModal";
import { useCheckoutFlow } from "@/modules/turnos/hooks/useCheckoutFlow";
import { useClassCart } from "@/modules/turnos/hooks/useClassCart";
import { usePaymentBroadcast } from "@/modules/turnos/hooks/usePaymentBroadcast";
import { useTurnosData } from "@/modules/turnos/hooks/useTurnosData";
import { useWaitList } from "@/modules/turnos/hooks/useWaitList";
import { useClienteId } from "@/hooks/useClienteId";
import { CLASS_PRICE } from "@/lib/constants";
import {
  pageMainClass,
  heroSectionClass,
  formCardClass,
} from "@/lib/ks-page-styles";
import { BackPreviousRouteButton } from "@/components/BackPreviousRouteButton";

export const Route = createFileRoute("/solicitarTurno")({
  component: RouteComponent,
});

function RouteComponent() {
  const [selectedDate, setSelectedDate] = useState("");
  const [viewAll, setViewAll] = useState(false);

  const { clienteId, error: clienteError, isLoading: clienteLoading } = useClienteId();
  const {
    cartItems,
    cartCount,
    addToCart,
    removeFromCart,
    removePaidFromCart,
    isInCart,
  } = useClassCart();

  const {
    classes,
    loading,
    error,
    enrolledClassIds,
    montoAFavor,
    clasesAFavor,
    setMontoAFavor,
    refresh,
  } = useTurnosData(clienteId);

  const { waitList, handleAddWaitList } = useWaitList(clienteId);

  const {
    checkoutItems,
    isPaymentModalOpen,
    checkoutFromCart,
    handleEnroll,
    handleAddToCart,
    handleCartCheckout,
    handlePaymentSuccess,
    handleRemoveFromCheckout,
    closeCheckout,
  } = useCheckoutFlow({
    clienteId,
    enrolledClassIds,
    classes,
    cartItems,
    addToCart,
    removeFromCart,
    removePaidFromCart,
    onRefresh: refresh,
    setMontoAFavor,
  });

  const handlePaymentCompleted = useCallback(() => {
    refresh();
    toast.success("¡Pago confirmado! Tu inscripción fue procesada correctamente.");
  }, [refresh]);

  usePaymentBroadcast(handlePaymentCompleted);

  useEffect(() => {
    if (!selectedDate && classes.length > 0) {
      setSelectedDate(formatDate(classes[0].fecha));
    }
  }, [classes, selectedDate]);

  const displayError = error ?? clienteError;
  const isLoading = loading || clienteLoading;

  const appointmentSlots = useMemo<ClassSlot[]>(() => {
    return classes.map((clase) => {
      const cupo = clase.cupo ?? 0;
      return {
        key: `${clase.id}`,
        date: formatDate(clase.fecha),
        dateLabel: formatDateLabel(clase.fecha),
        dayLabel: formatDayLabel(clase.fecha),
        time: formatTime(clase.hora),
        className: clase.tipo ?? "Clase",
        price: CLASS_PRICE,
        cupo,
        full: cupo <= 0,
        sinCupo: cupo <= 0,
        favorAmount: montoAFavor,
        source: clase,
        profesor: clase.profesor ?? null,
      };
    });
  }, [classes, montoAFavor]);

  const dates = useMemo(() => {
    const seen = new Set<string>();
    return appointmentSlots.filter((slot) => {
      if (seen.has(slot.date)) return false;
      seen.add(slot.date);
      return true;
    });
  }, [appointmentSlots]);

  return (
    <main className={pageMainClass}>
      <BackPreviousRouteButton />

      <section className={heroSectionClass}>
        <h1 className="relative m-0 mb-2 font-outfit text-[38px] font-bold tracking-[-1px] text-white max-sm:text-[28px]">
          Reservá tu clase
        </h1>
        <p className="relative text-[15px] font-light text-white/72">
          Elegí el día y la clase que querés tomar en Kinescius
        </p>
        <p className="relative mt-3 text-[14px] font-medium text-white/90">
          Todas las clases tienen el mismo valor:{" "}
          <strong className="text-white">${(CLASS_PRICE * 2).toLocaleString("es-AR")}</strong>
          <span className="mt-1 block text-[13px] font-light text-white/72">
            * En caso de ser abonado se le aplicará un 20% de descuento al pagar la totalidad de la clase presencialmente.
          </span>
        </p>
        <p className="relative mt-3 text-[14px] font-medium text-white/90">
          La reserva del turno tiene un costo de seña inicial del 50% del valor de la clase:{" "}
          <strong className="text-white">${CLASS_PRICE.toLocaleString("es-AR")}</strong>
        </p>
      </section>

      <section className={formCardClass}>
        <div className="mb-4 flex items-center justify-between">
          <p className="m-0 font-outfit text-[11px] font-bold tracking-[1.5px] text-ks-gray-text">
            SELECCIONÁ EL DÍA
          </p>
          <button
            type="button"
            className={cn(
              "cursor-pointer rounded-ks-full border-[1.5px] px-4 py-[7px] font-outfit text-xs font-semibold whitespace-nowrap transition-all duration-180ms",
              viewAll
                ? "border-ks-green-dark bg-ks-green-dark text-white"
                : "border-[rgba(82,183,136,0.4)] bg-ks-off-white text-ks-green-mid hover:border-ks-green-light hover:bg-ks-green-pale"
            )}
            onClick={() => setViewAll((current) => !current)}
          >
            {viewAll ? "Ver por día" : "Ver todas las clases"}
          </button>
        </div>

        {isLoading ? (
          <p className="py-2 text-sm text-ks-gray-text">Cargando clases...</p>
        ) : displayError ? (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-ks-full border border-[rgba(192,57,43,0.2)] bg-ks-red-soft px-3.5 py-[7px] font-outfit text-[13px] font-semibold text-ks-red">
            {displayError}
          </p>
        ) : !viewAll ? (
          <div className="flex flex-wrap gap-2.5">
            {dates.map((slot) => (
              <button
                key={slot.date}
                type="button"
                className={cn(
                  "flex min-w-[68px] cursor-pointer flex-col items-center rounded-ks-full border-[1.5px] px-[18px] py-2.5 font-outfit transition-all duration-180ms",
                  selectedDate === slot.date
                    ? "border-ks-green-dark bg-ks-green-dark text-white shadow-[0_4px_14px_rgba(26,58,42,0.25)]"
                    : "border-ks-gray-soft bg-ks-off-white hover:border-ks-green-light hover:bg-ks-green-pale"
                )}
                onClick={() => setSelectedDate(slot.date)}
              >
                <span className="text-sm font-semibold">{slot.dayLabel}</span>
                <span
                  className={cn(
                    "mt-0.5 text-[11px] font-normal",
                    selectedDate === slot.date ? "opacity-100" : "opacity-70"
                  )}
                >
                  {slot.dateLabel}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {!isLoading && !displayError && (
        <section className={formCardClass}>
          <p className="mb-4 font-outfit text-[11px] font-bold tracking-[1.5px] text-ks-gray-text">
            {viewAll ? "TODAS LAS CLASES DISPONIBLES" : "CLASES DISPONIBLES"}
          </p>

          <ClassesGrid
            viewAll={viewAll}
            dates={dates}
            appointmentSlots={appointmentSlots}
            selectedDate={selectedDate}
            enrolledClassIds={enrolledClassIds}
            waitList={waitList}
            isInCart={isInCart}
            onEnroll={handleEnroll}
            onAddToCart={handleAddToCart}
            onWaitList={handleAddWaitList}
          />
        </section>
      )}

      <CartFloatingBar count={cartCount} clasesAFavor={clasesAFavor} onCheckout={handleCartCheckout} />

      <PaymentSummaryModal
        isOpen={isPaymentModalOpen}
        items={checkoutItems}
        montoAFavor={montoAFavor}
        clasesAFavor={clasesAFavor}
        clienteId={clienteId}
        allowRemove={checkoutFromCart}
        onClose={closeCheckout}
        onRemoveItem={handleRemoveFromCheckout}
        onPaymentStarted={removePaidFromCart}
        onSuccess={handlePaymentSuccess}
      />
    </main>
  );
}