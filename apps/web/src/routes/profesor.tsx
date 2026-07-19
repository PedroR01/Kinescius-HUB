import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Clock, QrCode, UserRoundCheck } from "lucide-react";
import { AuthPageLayout } from "@/modules/auth/components/AuthPageLayout";
import { useAuthSession } from "@/modules/auth/hooks/useAuthSession";
import { QRDisplay } from "@/modules/asistencia/components/QRDisplay";
import { ManualAttendanceModal } from "@/modules/asistencia/components/ManualAttendanceModal";
import { useGenerarTokenAsistencia } from "@/modules/asistencia/hooks/useAsistencia";
import {
  getClasesProfesor,
  type ClaseProfesor,
  type GenerarTokenResponse,
} from "@/api/asistencia";
import { cn } from "@/lib/utils";
import { btnBase, btnPrimary, btnSecondary, formCardClass } from "@/lib/ks-page-styles";

export const Route = createFileRoute("/profesor")({
  component: ProfesorPage,
});

function getClaseQrExistente(clase: ClaseProfesor): GenerarTokenResponse | null {
  if (!clase.QR) {
    return null;
  }
  const token = ""; // Este campo no se usa en el front, TODO: Remover la url inicial de la cadena y dejar el token.
  return {
    qrUrl: clase.QR,
    token,
    expiresAt: clase.ventanaHasta,
  };
}

function ProfesorPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isProfesor, isHydrated } = useAuthSession();
  const generarTokenMutation = useGenerarTokenAsistencia();
  const [clases, setClases] = useState<ClaseProfesor[]>([]);
  const [isLoadingClases, setIsLoadingClases] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrActivo, setQrActivo] = useState<GenerarTokenResponse | null>(null);
  const [claseSeleccionada, setClaseSeleccionada] = useState<ClaseProfesor | null>(
    null,
  );
  const [claseAsistenciaManual, setClaseAsistenciaManual] =
    useState<ClaseProfesor | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!isAuthenticated || !isProfesor) {
      navigate({ to: "/iniciarSesion", search: { redirect: undefined }, replace: true });
      return;
    }

    const authToken = localStorage.getItem("miToken");
    if (!authToken) {
      setIsLoadingClases(false);
      return;
    }

    let cancelled = false;

    getClasesProfesor(authToken)
      .then((data) => {
        if (!cancelled) {
          setClases(data);
          const claseConQr = data.find(
            (clase) =>
              getClaseQrExistente(clase) !== null && horarioHabilitadoQR(clase.hora),
          );
          if (claseConQr) {
            setClaseSeleccionada(claseConQr);
            setQrActivo(getClaseQrExistente(claseConQr));
          }
        }
      })
      .catch((fetchError: Error) => {
        if (!cancelled) {
          setError(fetchError.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingClases(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isHydrated, isProfesor, navigate]);

  const handleGenerarQr = (clase: ClaseProfesor) => {
    const authToken = localStorage.getItem("miToken");
    if (!authToken) {
      return;
    }

    setError(null);
    setClaseSeleccionada(clase);

    // Evita el POST si ya existe un QR para la clase.
    const qrExistente = getClaseQrExistente(clase);
    console.log(qrExistente);
    if (qrExistente) {
      setQrActivo(qrExistente);
      console.log("QR existente");
      return;
    }

    console.log("Generando nuevo QR");
    generarTokenMutation.mutate(
      { claseId: clase.id, authToken },
      {
        onSuccess: (data) => setQrActivo(data),
        onError: (mutationError) => {
          setQrActivo(null);
          setError(mutationError.message);
          console.log(mutationError);
        },
      },
    );
  };

  // Para testea la asistencia, llamar al metodo en el parametro disabled: de los botones y reemplazarlo por !clase.puedeGenerarQr, poniendo !horarioHabilitadoQR(clase.hora)
  const horarioHabilitadoQR = (hora: string): boolean => {
    const ahora = new Date();
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    const [horaClase, minutosClase] = hora.split(":").map(Number);
    const minutosClaseTotal = horaClase * 60 + minutosClase;
    const diferencia = minutosClaseTotal - minutosActuales;

    console.log("100 minutos antes de la clase y 100 minutos después de la clase");
    // Habilitado desde 100 min antes hasta 100 min después del inicio (no tiene en cuenta los dias, para testear la asistencia)
    return diferencia >= -300 && diferencia <= 300;
  };

  return (
    <AuthPageLayout
      title="Panel del profesor"
      subtitle="Generá el código QR de asistencia para tus clases"
      showBackButton
    >
      {error ? (
        <section className="rounded-ks-md border border-[rgba(192,57,43,0.3)] bg-ks-red-soft px-5 py-4 text-sm text-red-700">
          {error}
        </section>
      ) : (
        <section className={formCardClass}>
          <h2 className="m-0 mb-4 font-outfit text-[22px] font-bold tracking-[-0.5px] text-ks-text-dark">
            Mis próximas clases
          </h2>

          {isLoadingClases ? (
            <p className="m-0 text-sm text-ks-gray-text">Cargando clases...</p>
          ) : clases.length === 0 ? (
            <p className="m-0 text-sm text-ks-gray-text">
              No tenés clases asignadas próximamente.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {clases.map((clase) => (
                <article
                  key={clase.id}
                  className="rounded-ks-md border border-[rgba(82,183,136,0.18)] bg-ks-off-white p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-ks-gray-text">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-4" />
                      {clase.fecha}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-4" />
                      {clase.hora.slice(0, 5)} hs
                    </span>
                    <span>{clase.tipo ?? "Clase"}</span>
                  </div>
                  <div className="flex flex-row flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={
                        !horarioHabilitadoQR(clase.hora) ||
                        generarTokenMutation.isPending ||
                        qrActivo !== null
                      }
                      onClick={() => handleGenerarQr(clase)}
                      className={cn(btnBase, btnPrimary)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <QrCode className="size-4" />
                        {clase.QR
                          ? "Ver QR"
                          : generarTokenMutation.isPending &&
                            claseSeleccionada?.id === clase.id
                            ? "Generando..."
                            : "Generar QR"}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={!horarioHabilitadoQR(clase.hora)}
                      onClick={() => setClaseAsistenciaManual(clase)}
                      className={cn(btnBase, btnSecondary)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <UserRoundCheck className="size-4" />
                        Asistencia manual
                      </span>
                    </button>
                  </div>
                  {!clase.puedeGenerarQr && (
                    <p className="m-0 mt-2 text-xs text-ks-gray-text">
                      Disponible desde 5 minutos antes del inicio hasta 15 minutos
                      después.
                    </p>
                  )}

                  {
                    (qrActivo &&
                      claseSeleccionada?.id === clase.id && (
                        <section className={cn(formCardClass, "mt-3")}>
                          <h3 className="m-0 mb-4 font-outfit text-lg font-semibold text-ks-text-dark">
                            QR de asistencia — {claseSeleccionada.tipo ?? "Clase"}
                          </h3>
                          <QRDisplay
                            qrUrl={qrActivo.qrUrl}
                            expiresAt={qrActivo.expiresAt}
                          />
                        </section>
                      )
                    )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <ManualAttendanceModal
        isOpen={claseAsistenciaManual !== null}
        claseId={claseAsistenciaManual?.id ?? null}
        claseLabel={
          claseAsistenciaManual
            ? `${claseAsistenciaManual.tipo ?? "Clase"} · ${claseAsistenciaManual.fecha} ${claseAsistenciaManual.hora.slice(0, 5)} hs`
            : "esta clase"
        }
        onClose={() => setClaseAsistenciaManual(null)}
      />
    </AuthPageLayout>
  );
}
