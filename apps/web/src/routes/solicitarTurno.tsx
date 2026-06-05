import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn, formatDate, formatDateLabel, formatDayLabel, formatTime } from "@/lib/utils";
import type { Class, ClassSlot } from "@/lib/class-interface";
import ClassCard from "@/modules/turnos/components/classCard";
import { CartFloatingBar } from "@/modules/turnos/components/CartFloatingBar";
import { PaymentSummaryModal } from "@/modules/turnos/components/PaymentSummaryModal";
import { useClassCart } from "@/modules/turnos/hooks/useClassCart";
import { useClienteId } from "@/hooks/useClienteId";
import { API_BASE, CLASS_PRICE } from "@/lib/constants";
import { fetchMontoAFavor } from "@/api/payments";
import { BackPreviousRouteButton } from "@/components/BackPreviousRouteButton";import {
  pageMainClass,
  heroSectionClass,
  formCardClass,
} from "@/lib/ks-page-styles";

export const Route = createFileRoute("/solicitarTurno")({
  component: RouteComponent,
});

interface MisClaseInscripcion {
  id_clase: number;
}

function RouteComponent() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [waitList, setWaitList] = useState<string[]>([]);
  const [montoAFavor, setMontoAFavor] = useState(0);
  const [viewAll, setViewAll] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [enrolledClassIds, setEnrolledClassIds] = useState<Set<number>>(() => new Set());

  const [checkoutItems, setCheckoutItems] = useState<ClassSlot[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [checkoutFromCart, setCheckoutFromCart] = useState(false);

  const { clienteId, error: clienteError, isLoading: clienteLoading } = useClienteId();
  const {
    cartItems,
    cartCount,
    addToCart,
    removeFromCart,
    removePaidFromCart,
    isInCart,
  } = useClassCart();

  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/clases`);
        if (!response.ok) throw new Error(`Error al cargar clases: ${response.status}`);
        const data = (await response.json()) as Class[];
        setClasses(data);
        setSelectedDate((current) =>
          current || (data.length > 0 ? formatDate(data[0].fecha) : "")
        );
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    void loadClasses();
  }, [refreshKey]);

  useEffect(() => {
    if (!clienteId) return;
    void fetchMontoAFavor(clienteId).then(setMontoAFavor);
  }, [clienteId, refreshKey]);

  useEffect(() => {
    if (!clienteId) {
      setEnrolledClassIds(new Set());
      return;
    }
    const loadEnrollments = async () => {
      try {
        const response = await fetch(`${API_BASE}/shifts/mis-clases/${clienteId}`);
        if (!response.ok) return;
        const data = (await response.json()) as MisClaseInscripcion[];
        setEnrolledClassIds(new Set(data.map((item) => item.id_clase)));
        console.log(data);
      } catch {
        setEnrolledClassIds(new Set());
      }
    };
    void loadEnrollments();
  }, [clienteId, refreshKey]);

  useEffect(() => {
    const channel = new BroadcastChannel("kinescius-payment");
    channel.onmessage = (e: MessageEvent<{ type: string }>) => {
      if (e.data?.type === "payment-completed") {
        setRefreshKey((k) => k + 1);
        setMessage("¡Pago confirmado! Tu inscripción fue procesada correctamente.");
      }
    };
    return () => channel.close();
  }, []);

  useEffect(() => {
    if (clienteError) {
      setError(clienteError);
    }
  }, [clienteError]);

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
    return appointmentSlots.filter((s) => {
      if (seen.has(s.date)) return false;
      seen.add(s.date);
      return true;
    });
  }, [appointmentSlots]);

  const classesByDate = useMemo(
    () => appointmentSlots.filter((slot) => slot.date === selectedDate),
    [appointmentSlots, selectedDate]
  );

  const handleAddWaitList = async (slot: ClassSlot) => {
    if (!clienteId) {
      setMessage("No se pudo identificar tu cuenta. Por favor, iniciá sesión.");
      return;
    }
    console.log("clienteId:", clienteId);
    const waitKey = `${slot.date} ${slot.time}hs ${slot.className}`;
    try {
      const res = await fetch(`${API_BASE}/listaEspera/clase/${slot.source.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId }),
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      if (!waitList.includes(waitKey)) {
        setWaitList((list) => [...list, waitKey]);
      }
      setMessage(
        `Fuiste añadido a la lista de espera para ${slot.className} el ${slot.date} a las ${slot.time}hs.`
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al unirse a lista de espera");
    }
  };

  const openCheckout = (items: ClassSlot[], fromCart: boolean) => {
    if (!clienteId) {
      setMessage("No se pudo identificar tu cuenta. Por favor, iniciá sesión.");
      return;
    }
    setCheckoutItems(items);
    setCheckoutFromCart(fromCart);
    setIsPaymentModalOpen(true);
  };

  const handleEnroll = (slot: ClassSlot) => {
    if (enrolledClassIds.has(slot.source.id)) return;
    openCheckout([slot], false);
  };

  const handleAddToCart = (slot: ClassSlot) => {
    if (enrolledClassIds.has(slot.source.id)) return;
    const added = addToCart(slot);
    if (added) {
      toast.success("Clase agregada al carrito");
    } else {
      removeFromCart(slot.key);
      toast.info(`${slot.className} quitada del carrito`);
    }
  };

  const handleCartCheckout = () => {
    openCheckout(cartItems, true);
  };

  const handlePaymentSuccess = (paidKeys: string[], newSaldo?: number) => {
    removePaidFromCart(paidKeys);
    if (newSaldo !== undefined) {
      setMontoAFavor(newSaldo);
    }
    setRefreshKey((k) => k + 1);
    setCheckoutItems([]);
  };

  const handleRemoveFromCheckout = (key: string) => {
    removeFromCart(key);
    setCheckoutItems((prev) => {
      const next = prev.filter((slot) => slot.key !== key);
      if (next.length === 0) setIsPaymentModalOpen(false);
      return next;
    });
  };

  const handleToggleViewAll = () => {
    setViewAll((v) => !v);
    setMessage(null);
  };

  const renderClassCard = (slot: ClassSlot) => (
    <ClassCard
      key={slot.key}
      slot={slot}
      isEnrolled={enrolledClassIds.has(slot.source.id)}
      isWaited={waitList.includes(`${slot.date} ${slot.time}hs ${slot.className}`)}
      isInCart={isInCart(slot.key)}
      onEnroll={handleEnroll}
      onAddToCart={handleAddToCart}
      onWaitList={handleAddWaitList}
    />
  );

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
            onClick={handleToggleViewAll}
          >
            {viewAll ? "Ver por día" : "Ver todas las clases"}
          </button>
        </div>

        {loading || clienteLoading ? (
          <p className="py-2 text-sm text-ks-gray-text">Cargando clases...</p>
        ) : error ? (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-ks-full border border-[rgba(192,57,43,0.2)] bg-ks-red-soft px-3.5 py-[7px] font-outfit text-[13px] font-semibold text-ks-red">
            {error}
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
                onClick={() => {
                  setSelectedDate(slot.date);
                  setMessage(null);
                }}
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

      {!loading && !error && (
        <section className={formCardClass}>
          <p className="mb-4 font-outfit text-[11px] font-bold tracking-[1.5px] text-ks-gray-text">
            {viewAll ? "TODAS LAS CLASES DISPONIBLES" : "CLASES DISPONIBLES"}
          </p>

          {viewAll ? (
            dates.length === 0 ? (
              <p className="py-2 text-sm text-ks-gray-text">No hay clases disponibles.</p>
            ) : (
              <div className="flex flex-col gap-6">
                {dates.map((dateSlot) => {
                  const slotsForDate = appointmentSlots.filter((s) => s.date === dateSlot.date);
                  return (
                    <div key={dateSlot.date}>
                      <div className="mb-3 border-b-[1.5px] border-ks-gray-soft pb-2">
                        <span className="font-outfit text-[13px] font-bold tracking-[0.5px] text-ks-green-dark capitalize">
                          {dateSlot.dayLabel} {dateSlot.dateLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 max-sm:grid-cols-2">
                        {slotsForDate.map(renderClassCard)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : classesByDate.length === 0 ? (
            <p className="py-2 text-sm text-ks-gray-text">No hay clases para este día.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 max-sm:grid-cols-2">
              {classesByDate.map(renderClassCard)}
            </div>
          )}
        </section>
      )}

      {message && toast.error(message)}

      <CartFloatingBar count={cartCount} onCheckout={handleCartCheckout} />

      <PaymentSummaryModal
        isOpen={isPaymentModalOpen}
        items={checkoutItems}
        montoAFavor={montoAFavor}
        clienteId={clienteId}
        allowRemove={checkoutFromCart}
        onClose={() => setIsPaymentModalOpen(false)}
        onRemoveItem={handleRemoveFromCheckout}
        onPaymentStarted={removePaidFromCart}
        onSuccess={handlePaymentSuccess}
      />
    </main>
  );
}