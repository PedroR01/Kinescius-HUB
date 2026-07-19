import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { API_BASE } from "@/lib/constants";
import { BackPreviousRouteButton } from "@/components/BackPreviousRouteButton";
import { DatePicker } from "@/components/DatePicker";
import type { KinesciusClass } from "@/lib/class-interface";
import type { UserData } from "@/lib/user-interface";
import { formatDate, formatTime, getTodayDate } from "@/lib/utils";

export const Route = createFileRoute("/cambiarProfesor")({
  component: RouteComponent
});

function RouteComponent() {
  const navigate = useNavigate();
  const [clases, setClases] = useState<KinesciusClass[]>([]);
  const [profesores, setProfesores] = useState<UserData[]>([]);
  const [selectedClase, setSelectedClase] = useState<KinesciusClass | null>(null);
  const [selectedProfesorId, setSelectedProfesorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfesores, setLoadingProfesores] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fecha, setFecha] = useState(getTodayDate());
  const [hasBuscado, setHasBuscado] = useState(false);

  const loadClases = async () => {
    setLoading(true);
    setError(null);
    setSelectedClase(null);
    setSelectedProfesorId(null);
    setProfesores([]);
    try {
      const params = new URLSearchParams();
      if (fecha) params.append("startDate", fecha);
      if (fecha) params.append("endDate", fecha);

      const res = await fetch(`${API_BASE}/admin/clases?${params.toString()}`);
      const data = await res.json();
      setClases(data ?? []);
      setHasBuscado(true);
    } catch {
      setError("Error al cargar las clases");
    } finally {
      setLoading(false);
    }
  };

  const loadProfesoresDisponibles = async (clase: KinesciusClass) => {
    setLoadingProfesores(true);
    setProfesores([]);
    setSelectedProfesorId(null);
    try {
      const fechaClase = clase.fecha.split("T")[0];
      const params = new URLSearchParams({ fecha: fechaClase, hora: clase.hora });
      const res = await fetch(
        `${API_BASE}/admin/clases/profesores/disponibles?${params.toString()}`
      );
      const data = await res.json();
      setProfesores(data?.profesores ?? []);
    } catch {
      setError("Error al cargar los profesores disponibles");
    } finally {
      setLoadingProfesores(false);
    }
  };

  const handleClaseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    const clase = clases.find((c) => c.id === id) ?? null;
    setSelectedClase(clase);
    setMessage(null);
    setError(null);
    if (clase) void loadProfesoresDisponibles(clase);
  };

  const handleCambiar = async () => {
    if (!selectedClase || !selectedProfesorId) return;

    const confirmed = window.confirm(
      `¿Confirmás el cambio de profesor para la clase del ${formatDate(selectedClase.fecha)} a las ${formatTime(selectedClase.hora)}?`
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_BASE}/admin/clases/${selectedClase.id}/cambiar-profesor`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profesorId: selectedProfesorId })
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`);
      }

      setMessage(data?.message ?? "Profesor actualizado correctamente");
      setSelectedClase(null);
      setSelectedProfesorId(null);
      setProfesores([]);
      void loadClases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page-shell">
      <BackPreviousRouteButton className="mb-4" />
      <section className="ks-hero-card">
        <h1>Cambiar profesor</h1>
        <p>Seleccioná una clase y asigná un nuevo profesor.</p>
      </section>

      <section className="bg-ks-off-white rounded-ks-lg p-6 shadow-[0_20px_60px_rgba(26,58,42,0.18)]">
        {error && <p className="status-badge full">{error}</p>}

        {message && (
          <div className="mb-4">
            <p className="status-badge success">{message}</p>
            <button
              type="button"
              onClick={() => void navigate({ to: "/verClases" })}
              className="bg-transparent border border-ks-green-light text-ks-green-light rounded-ks-full p-4 cursor-pointer text-sm font-medium"
            >
              Ver clases →
            </button>
          </div>
        )}

        <div className="mb-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Fecha
            <DatePicker
              value={fecha}
              onChange={(v) => {
                setFecha(v);
                setHasBuscado(false);
                setClases([]);
                setSelectedClase(null);
                setProfesores([]);
              }}
              minDate={getTodayDate()}
              placeholder="Seleccionar fecha..."
            />
          </label>
        </div>

        <div className="mb-4">
          <button
            type="button"
            className="button button-primary"
            onClick={() => void loadClases()}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Buscar clases"}
          </button>
          {fecha !== getTodayDate() && (
            <button
              type="button"
              onClick={() => {
                setFecha(getTodayDate());
                setClases([]);
                setSelectedClase(null);
                setProfesores([]);
                setHasBuscado(false);
              }}
              className="bg-transparent border border-ks-green-light text-ks-green-light rounded-ks-full p-4 cursor-pointer text-sm font-medium"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {loading && <p>Cargando...</p>}

        {!loading && hasBuscado && clases.length === 0 && (
          <p className="status-badge full">No hay clases programadas para el día seleccionado.</p>
        )}

        {!loading && hasBuscado && clases.length > 0 && (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Clase
              <select
                value={selectedClase?.id ?? ""}
                onChange={handleClaseSelect}
                className="input"
              >
                <option value="">-- Seleccioná una clase --</option>
                {clases.map((clase) => (
                  <option key={clase.id} value={clase.id}>
                    {formatTime(clase.hora)} — {clase.tipo ?? "Sin tipo"} —{" "}
                    {clase.profesor ?? "Sin profesor"}
                  </option>
                ))}
              </select>
            </label>

            {selectedClase && (
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Nuevo profesor
                {loadingProfesores ? (
                  <p className="text-sm text-ks-green-light mt-2 mb-0">
                    Cargando profesores disponibles...
                  </p>
                ) : (
                  <select
                    value={selectedProfesorId ?? ""}
                    onChange={(e) => setSelectedProfesorId(Number(e.target.value))}
                    className="input"
                  >
                    <option value="">
                      {profesores.length === 0
                        ? "— Sin profesores disponibles para este horario —"
                        : "-- Seleccioná un profesor --"}
                    </option>
                    {profesores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.apellido} — DNI {p.dni}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            )}

            {selectedClase && selectedProfesorId && (
              <div className="mb-4">
                <button
                  type="button"
                  className="bg-ks-green-dark text-white rounded-ks-full p-4"
                  onClick={handleCambiar}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Confirmar cambio"}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
