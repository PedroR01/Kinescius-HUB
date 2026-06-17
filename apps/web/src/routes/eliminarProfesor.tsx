import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/constants";
import { BackPreviousRouteButton } from "@/components/BackPreviousRouteButton";

export const Route = createFileRoute("/eliminarProfesor")({
  component: RouteComponent,
});

const GREEN = "#2DBE7F";
const TEXT = "#0d1f18";
const CARD = "#f0faf5";

type Profesor = {
  id: number;
  nombre: string | null;
  apellido: string | null;
  dni: string | null;
  tieneClasesFuturas: boolean;
};

function RouteComponent() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loadingProfesores, setLoadingProfesores] = useState(true);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProfesores = async () => {
    setLoadingProfesores(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/clases/profesores/con-disponibilidad`
      );
      const data = await res.json();
      setProfesores(data?.profesores ?? []);
    } catch {
      setProfesores([]);
    } finally {
      setLoadingProfesores(false);
    }
  };

  useEffect(() => {
    void fetchProfesores();
  }, []);

  const handleEliminar = async (profesor: Profesor) => {
    if (profesor.tieneClasesFuturas) {
      setMessage(null);
      setError(
        `${profesor.nombre ?? ""} ${profesor.apellido ?? ""} tiene clases futuras asignadas y no puede ser eliminado.`
      );
      return;
    }

    setEliminandoId(profesor.id);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/admin/clases/profesores/${profesor.id}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message ?? data?.error ?? "Error desconocido");
      } else {
        setMessage(data?.message ?? "Profesor eliminado correctamente");
        await fetchProfesores();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        padding: "40px 24px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <BackPreviousRouteButton className="relative z-10 mb-6" />
      <div
        style={{
          position: "absolute",
          top: "-80px",
          right: "-80px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(45,190,127,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(45,190,127,0.1)",
          border: "1px solid rgba(45,190,127,0.3)",
          borderRadius: "100px",
          padding: "5px 14px",
          marginBottom: "24px",
        }}
      >
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: GREEN,
            boxShadow: `0 0 8px ${GREEN}`,
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: GREEN,
          }}
        >
          Admin
        </span>
      </div>

      <h1
        style={{
          margin: "0 0 6px",
          fontSize: "36px",
          fontWeight: 700,
          color: TEXT,
          letterSpacing: "-0.01em",
        }}
      >
        Eliminar{" "}
        <span style={{ color: GREEN, fontStyle: "italic" }}>profesor</span>
      </h1>
      <p
        style={{
          margin: "0 0 32px",
          fontSize: "14px",
          fontWeight: 300,
          color: "rgba(13,31,24,0.55)",
        }}
      >
        Seleccioná un profesor para darlo de baja del sistema.
      </p>
      <div
        style={{
          width: "36px",
          height: "2px",
          background: GREEN,
          boxShadow: `0 0 10px ${GREEN}88`,
          marginBottom: "32px",
        }}
      />

      {message && (
        <p
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(45,190,127,0.12)",
            border: "1px solid rgba(45,190,127,0.3)",
            color: GREEN,
            fontSize: "13px",
            maxWidth: "480px",
          }}
        >
          ✓ {message}
        </p>
      )}
      {error && (
        <p
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(220,50,50,0.1)",
            border: "1px solid rgba(220,50,50,0.3)",
            color: "#ff6b6b",
            fontSize: "13px",
            maxWidth: "480px",
          }}
        >
          ✕ {error}
        </p>
      )}

      {loadingProfesores ? (
        <p style={{ color: "rgba(13,31,24,0.4)", fontSize: "14px" }}>
          Cargando profesores...
        </p>
      ) : profesores.length === 0 ? (
        <p style={{ color: "rgba(13,31,24,0.4)", fontSize: "14px" }}>
          No hay profesores registrados.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxWidth: "480px",
          }}
        >
          {profesores.map((profesor) => {
            const bloqueado = profesor.tieneClasesFuturas;
            const eliminando = eliminandoId === profesor.id;

            return (
              <div
                key={profesor.id}
                style={{
                  background: CARD,
                  border: `1px solid ${bloqueado ? "rgba(220,50,50,0.2)" : "rgba(45,190,127,0.15)"}`,
                  borderRadius: "16px",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: "14px",
                      color: TEXT,
                    }}
                  >
                    {profesor.nombre} {profesor.apellido}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "12px",
                      color: "rgba(13,31,24,0.45)",
                    }}
                  >
                    DNI: {profesor.dni ?? "-"}
                  </p>
                  {bloqueado && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "11px",
                        color: "#ff6b6b",
                        fontWeight: 500,
                      }}
                    >
                      Tiene clases futuras asignadas
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleEliminar(profesor)}
                  disabled={eliminando}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: bloqueado
                      ? "rgba(220,50,50,0.12)"
                      : eliminando
                      ? "rgba(220,50,50,0.3)"
                      : "#e53e3e",
                    color: bloqueado
                      ? "#ff6b6b"
                      : eliminando
                      ? "rgba(13,31,24,0.4)"
                      : "#fff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: eliminando ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    transition: "background 0.2s",
                  }}
                >
                  {eliminando ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}