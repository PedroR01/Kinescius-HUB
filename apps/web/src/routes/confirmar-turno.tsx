import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/constants";
import type { KinesciusClass } from "@/lib/class-interface";

export const Route = createFileRoute("/confirmar-turno")({
  component: ConfirmarTurnoPage
});

function ConfirmarTurnoPage() {
  const { token, claseId, clienteId } = Route.useSearch() as {
    token: string;
    claseId: string;
    clienteId: string;
  };

  const [clase, setClase] = useState<KinesciusClass | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    const validar = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/confirmar-turno/validar?token=${token}&claseId=${claseId}&clienteId=${clienteId}`
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.message);
        } else {
          setClase(data.clase);
        }
      } catch {
        setError("Error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };
    validar();
  }, [token, claseId, clienteId]);

  const handleConfirmar = async () => {
    setConfirmando(true);
    try {
      const res = await fetch(`${API_BASE}/confirmar-turno`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: Number(clienteId),
          claseId: Number(claseId),
          token
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setExito(true);
      }
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setConfirmando(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-svh flex items-center justify-center p-6 bg-ks-off-white">
        <p className="text-ks-gray-text text-sm">Validando tu enlace...</p>
      </div>
    );

  if (exito)
    return (
      <div className="min-h-svh flex items-center justify-center p-6 bg-ks-off-white">
        <div className="bg-white rounded-ks-lg p-6 shadow-[0_20px_60px_rgba(26,58,42,0.18)]">
          <h2 className="text-ks-green-dark text-2xl font-bold">✅ Turno solicitado</h2>
          <p className="text-ks-gray-text text-sm">Tu turno fue confirmado exitosamente.</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-svh flex items-center justify-center p-6 bg-ks-off-white">
        <div className="bg-white rounded-ks-lg p-6 shadow-[0_20px_60px_rgba(26,58,42,0.18)]">
          <h2 className="text-ks-red text-2xl font-bold">❌ Error</h2>
          <p className="text-ks-gray-text text-sm">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-ks-off-white">
      <div className="bg-white rounded-ks-lg p-6 shadow-[0_20px_60px_rgba(26,58,42,0.18)]">
        <h2 style={{ color: "#1a6b4a", marginBottom: 8 }}>Confirmar turno</h2>
        <p className="text-ks-gray-text text-sm">Estás por reservar tu lugar en:</p>

        <div className="bg-ks-gray-soft rounded-ks-md p-4">
          <p>
            <strong>Tipo:</strong> {clase?.tipo}
          </p>
          <p>
            <strong>Fecha:</strong> {clase?.fecha}
          </p>
          <p>
            <strong>Horario:</strong> {clase?.hora?.substring(0, 5)} hs
          </p>
        </div>

        <p className="text-ks-gray-text text-sm">
          Para confirmar debés abonar la seña correspondiente.
        </p>

        <button
          onClick={handleConfirmar}
          disabled={confirmando}
          className="bg-ks-green-dark text-white rounded-ks-full p-4"
        >
          {confirmando ? "Procesando..." : "Confirmar turno"}
        </button>
      </div>
    </div>
  );
}
