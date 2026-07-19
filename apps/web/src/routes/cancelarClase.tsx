import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/constants";
import { BackPreviousRouteButton } from "@/components/BackPreviousRouteButton";
import type { KinesciusClass } from "@/lib/class-interface";
import { formatDate, formatTime, normalizeFecha, getMinFecha } from "@/lib/utils";
import { DatePicker } from "@/components/DatePicker";

function isClaseVisibleParaHoyOFuturo(fecha: string) {
  const normalizedFecha = normalizeFecha(fecha);
  if (!normalizedFecha) return false;
  return normalizedFecha >= getMinFecha();
}

export const Route = createFileRoute("/cancelarClase")({
  component: RouteComponent
});

function RouteComponent() {
  const [classes, setClasses] = useState<KinesciusClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(getMinFecha());
  const [endDate, setEndDate] = useState("");

  const loadClasses = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      let url = `${API_BASE}/admin/clases`;
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`);
      }

      const clases = (data ?? []) as KinesciusClass[];
      const clasesVisibles = clases.filter((clase) => isClaseVisibleParaHoyOFuturo(clase.fecha));
      setClasses(clasesVisibles);

      if (clasesVisibles.length === 0) {
        setMessage("No hay clases en el rango seleccionado.");
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Error desconocido");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClasses();
  }, []);

  const cancelClass = async (id: number) => {
    const confirmed = window.confirm(`¿Confirmás la cancelación de la clase?`);
    if (!confirmed) return;

    setCancelingId(id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/admin/clases/${id}/cancelar`, { method: "PATCH" });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`);
      }

      setClasses((currentClasses) => currentClasses.filter((clase) => clase.id !== id));
      setMessage(data?.message ?? `Clase cancelada correctamente`);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Error desconocido");
    } finally {
      setCancelingId(null);
    }
  };

  const classRows = useMemo(
    () =>
      classes.map((clase, index) => (
        <tr
          key={clase.id}
          className={`border-b border-ks-gray-border last:border-b-0 ${
            index % 2 === 1 ? "bg-ks-off-white/60" : "bg-transparent"
          }`}
        >
          <td className="py-4 px-4 text-sm text-ks-gray-text whitespace-nowrap">
            {formatDate(clase.fecha)}
          </td>
          <td className="py-4 px-4 text-sm text-ks-gray-text whitespace-nowrap">
            {formatTime(clase.hora)}
          </td>
          <td className="py-4 px-4 text-sm text-ks-gray-text">{clase.tipo ?? "Sin tipo"}</td>
          <td className="py-4 px-4 text-sm font-medium text-ks-green-dark">
            {clase.profesor ?? "Sin profesor"}
          </td>
          <td className="py-4 px-4 text-sm text-ks-gray-text text-center">{clase.cupo ?? "N/A"}</td>
          <td className="py-4 px-4 text-right">
            <button
              type="button"
              className="bg-ks-gray-soft text-ks-gray-text border border-ks-gray-border rounded-ks-full px-5 py-2 text-sm font-medium hover:bg-ks-gray-border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => cancelClass(clase.id)}
              disabled={cancelingId === clase.id}
            >
              {cancelingId === clase.id ? "Cancelando..." : "Cancelar"}
            </button>
          </td>
        </tr>
      )),
    [classes, cancelingId]
  );

  return (
    <main className="page-shell max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      <BackPreviousRouteButton className="mb-2" />

      <section className="bg-ks-off-white rounded-ks-lg p-6 shadow-[0_20px_60px_rgba(26,58,42,0.18)]">
        <h1 className="text-2xl font-semibold text-ks-green-dark mb-1">Cancelar clase</h1>
        <p className="text-sm text-ks-gray-text">
          Seleccioná una clase programada para cancelarla.
        </p>
      </section>

      <section className="bg-ks-off-white rounded-ks-lg p-6 shadow-[0_20px_60px_rgba(26,58,42,0.18)] flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-4 flex-wrap">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ks-gray-text">
              Fecha desde
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                minDate={getMinFecha()}
                placeholder="Fecha desde..."
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ks-gray-text">
              Fecha hasta
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                minDate={startDate || getMinFecha()}
                placeholder="Fecha hasta..."
              />
            </label>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              className="bg-ks-green-dark text-white rounded-ks-full px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              type="button"
              onClick={() => void loadClasses()}
              disabled={loading}
            >
              {loading ? "Cargando..." : "Visualizar clases"}
            </button>

            {(startDate !== getMinFecha() || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate(getMinFecha());
                  setEndDate("");
                  setClasses([]);
                  setMessage(null);
                }}
                className="bg-transparent border border-ks-green-light text-ks-green-light rounded-ks-full px-6 py-3 text-sm font-medium hover:bg-ks-green-light/10 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {error ? (
          <p className="rounded-ks-lg bg-red-50 text-red-600 text-sm px-4 py-3 border border-red-200">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-ks-lg bg-ks-green-light/10 text-ks-green-dark text-sm px-4 py-3 border border-ks-green-light/30">
            {message}
          </p>
        ) : null}

        {classes.length > 0 ? (
          <div className="rounded-ks-lg border border-ks-gray-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-ks-green-dark/5 border-b border-ks-gray-border">
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-ks-gray-text">
                      Fecha
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-ks-gray-text">
                      Hora
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-ks-gray-text">
                      Actividad
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-ks-gray-text">
                      Profesor
                    </th>
                    <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wide text-ks-gray-text">
                      Cupo
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wide text-ks-gray-text">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>{classRows}</tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
