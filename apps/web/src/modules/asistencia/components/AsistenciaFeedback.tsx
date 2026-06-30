import { cn } from "@/lib/utils";
import { feedbackErrorClass, feedbackSuccessClass } from "@/lib/ks-page-styles";

export type AsistenciaFeedbackStatus = "loading" | "success" | "error";

type AsistenciaFeedbackProps = {
  status: AsistenciaFeedbackStatus;
  message: string;
  claseInfo?: {
    fecha: string;
    hora: string;
    tipo: string;
  } | null;
};

export function AsistenciaFeedback({
  status,
  message,
  claseInfo,
}: AsistenciaFeedbackProps) {
  if (status === "loading") {
    return (
      <section className="rounded-ks-lg border border-[rgba(82,183,136,0.18)] bg-white p-7 text-center shadow-[0_8px_32px_rgba(26,58,42,0.12)]">
        <p className="m-0 text-[15px] text-ks-gray-text">Registrando asistencia...</p>
      </section>
    );
  }

  const isSuccess = status === "success";

  return (
    <section
      className={cn(
        "rounded-ks-lg p-7 shadow-[0_8px_32px_rgba(26,58,42,0.12)]",
        isSuccess ? feedbackSuccessClass : feedbackErrorClass,
      )}
    >
      <h2
        className={cn(
          "m-0 mb-2 font-outfit text-[22px] font-bold tracking-[-0.5px]",
          isSuccess ? "text-ks-green-dark" : "text-red-700",
        )}
      >
        {isSuccess ? "Asistencia registrada" : "No se pudo registrar"}
      </h2>
      <p className="m-0 text-[15px] leading-relaxed text-ks-gray-text">{message}</p>
      {isSuccess && claseInfo && (
        <div className="mt-4 rounded-ks-md border border-[rgba(82,183,136,0.2)] bg-white/70 p-4 text-left text-sm text-ks-gray-text">
          <p className="m-0">
            <strong>Clase:</strong> {claseInfo.tipo}
          </p>
          <p className="m-0 mt-1">
            <strong>Fecha:</strong> {claseInfo.fecha}
          </p>
          <p className="m-0 mt-1">
            <strong>Horario:</strong> {claseInfo.hora.slice(0, 5)} hs
          </p>
        </div>
      )}
    </section>
  );
}
