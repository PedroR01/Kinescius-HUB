import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { CheckIcon, PlusIcon, ShoppingCartIcon } from "lucide-react";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "../components/ui/item";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/pagarClase")({
  component: RouteComponent
});

type Clase = {
  id: number;
  fecha: string;
  hora: string;
  tipo: string | null;
  cupo: number | null;
  QR: string | null;
  id_listaEspera: number | null;
  id_profesor: number | null;
  id_administrador: number | null;
};

type ClasePayload = {
  id: number;
  fecha: string;
  hora: string;
};

function formatDate(fecha: string) {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function formatTime(hora: string) {
  return hora.replace(/:00$/, "hs");
}

// Convierte los datos de la clase en un formato compatible con la API de pago
function buildClasePayload(clase: Clase): ClasePayload {
  return {
    id: clase.id,
    fecha: formatDate(clase.fecha),
    hora: formatTime(clase.hora)
  };
}

const API_BASE = "http://localhost:3000";

const SPRING = { type: "spring", stiffness: 380, damping: 22 } as const;

function RouteComponent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [classes, setClasses] = useState<Clase[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [isPaying, setIsPaying] = useState(false);
  const [isPayButtonVisible, setIsPayButtonVisible] = useState(false);

  const payButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchClasses = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        const response = await fetch(`${API_BASE}/clases`, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Error al cargar clases: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as Clase[];
        setClasses(data);
        setSelectedIds(new Set());
      } catch (error) {
        if (controller.signal.aborted) return;
        setFetchError(
          error instanceof Error ? error.message : "Error desconocido al cargar las clases."
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchClasses();
    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    const channel = new BroadcastChannel("kinescius-payment");
    channel.onmessage = (e: MessageEvent<{ type: string }>) => {
      if (e.data?.type === "payment-completed") setRefreshKey((k) => k + 1);
    };
    return () => channel.close();
  }, []);

  // Effect para mostrar el botón de pago antes.
  useEffect(() => {
    const element = payButtonRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsPayButtonVisible(entry?.isIntersecting ?? false),
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isLoading, fetchError, classes.length]);

  const selectedCount = selectedIds.size;
  const isAllSelected = classes.length > 0 && selectedCount === classes.length;

  // Guarda las clases a pagar en un formato compatible con la API de pago (payload)
  const selectedPayload = useMemo<ClasePayload[]>(
    () => classes.filter((clase) => selectedIds.has(clase.id)).map(buildClasePayload),
    [classes, selectedIds]
  );

  const handlePay = useCallback(async () => {
    if (selectedPayload.length === 0) return;

    setIsPaying(true);
    const toastId = toast.loading(
      selectedPayload.length === 1
        ? "Iniciando pago de 1 clase..."
        : `Iniciando pago de ${selectedPayload.length} clases...`
    );

    try {
      // Punto de integración — payload listo para la API de pago
      console.log("PagarClase: payload para API de pago", { clases: selectedPayload });

      const response = await fetch(`${API_BASE}/api/mercadopago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clases: selectedPayload })
      });

      if (!response.ok) {
        throw new Error(
          `Error al crear la preferencia de pago: ${response.status} ${response.statusText}`
        );
      }

      type CreatePreferenceResponse = {
        initPoint: string;
      };

      const data = (await response.json()) as CreatePreferenceResponse;
      if (!data.initPoint?.startsWith("https://")) {
        throw new Error("La API no devolvió una URL de pago válida.");
      }

      toast.success(
        selectedPayload.length === 1
          ? "Clase lista para el proceso de pago."
          : `${selectedPayload.length} clases listas para el proceso de pago.`,
        { id: toastId }
      );

      window.open(data.initPoint, "_blank", "noopener");
    } catch (error) {
      console.error("PagarClase: error al crear la preferencia de pago", error);
      toast.error(
        error instanceof Error ? error.message : "No se pudo iniciar el pago. Intentá de nuevo.",
        { id: toastId }
      );
    } finally {
      setIsPaying(false);
    }
  }, [selectedPayload]);

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((previous) => {
      if (classes.length === 0) return previous;
      if (previous.size === classes.length) return new Set();
      return new Set(classes.map((clase) => clase.id));
    });
  }, [classes]);

  const showFloatingButton = selectedCount > 0 && !isPayButtonVisible;

  return (
    <div className="container mx-auto">
      <section className="bg-foreground text-text-h pb-10">
        <h1>Pagar clase</h1>
        <p>Elegí una o varias clases y continuá con el proceso de pago.</p>
      </section>

      <section className="form-card text-left">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando clases desde el servidor...</p>
        ) : null}

        {fetchError ? (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {fetchError}
          </p>
        ) : null}

        {!isLoading && !fetchError && classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay clases disponibles para pagar.</p>
        ) : null}

        {!isLoading && !fetchError && classes.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer select-none items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  aria-label="Seleccionar todas las clases"
                  className="size-4 cursor-pointer accent-main"
                />
                Seleccionar todas
                <span className="text-muted-foreground">
                  ({selectedCount}/{classes.length})
                </span>
              </label>
            </div>

            <ul className="mt-4 grid list-none gap-3 p-0">
              {classes.map((clase) => {
                const isSelected = selectedIds.has(clase.id);

                return (
                  <li key={clase.id}>
                    <Item
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-colors duration-150",
                        isSelected && "border-accent-border bg-main/5"
                      )}
                      onClick={() => toggleSelection(clase.id)}
                      role="checkbox"
                      aria-checked={isSelected}
                    >
                      <ItemContent className="gap-1">
                        <ItemTitle className="text-text uppercase font-bold">
                          {clase.tipo ?? "Clase"} - {clase.id}
                        </ItemTitle>
                        <ItemDescription>
                          {formatDate(clase.fecha)} · {formatTime(clase.hora)}
                          {clase.cupo !== null ? ` · ${clase.cupo} cupos` : ""}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <motion.div
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full border transition-colors duration-150",
                            isSelected
                              ? "border-main bg-main text-text-h"
                              : "border-border bg-transparent text-muted-foreground"
                          )}
                          animate={{ scale: isSelected ? 1 : 0.88 }}
                          transition={SPRING}
                        >
                          {isSelected ? (
                            <CheckIcon className="size-3.5" />
                          ) : (
                            <PlusIcon className="size-3.5" />
                          )}
                        </motion.div>
                      </ItemActions>
                    </Item>
                  </li>
                );
              })}
            </ul>

            <div ref={payButtonRef} className="my-6 flex justify-end">
              <Button
                variant="primary"
                size="md"
                disabled={selectedCount === 0 || isPaying}
                onClick={() => void handlePay()}
              >
                <ShoppingCartIcon className="size-4" />
                {isPaying
                  ? "Procesando..."
                  : selectedCount === 0
                    ? "Seleccioná una clase"
                    : `Pagar ${selectedCount} clase${selectedCount > 1 ? "s" : ""}`}
              </Button>
            </div>
          </>
        ) : null}
      </section>

      <AnimatePresence>
        {showFloatingButton ? (
          <motion.div
            className="fixed bottom-6 left-0 right-0 z-50 flex justify-center"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={SPRING}
          >
            <Button
              variant="primary"
              size="md"
              disabled={isPaying}
              onClick={() => void handlePay()}
              className="shadow-[0_8px_30px_rgba(18,156,108,0.45)]"
            >
              <ShoppingCartIcon className="size-4" />
              {isPaying
                ? "Procesando..."
                : `Pagar ${selectedCount} clase${selectedCount > 1 ? "s" : ""}`}
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
