import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { AuthPageLayout } from "@/modules/auth/components/AuthPageLayout";
import { useAuthSession } from "@/modules/auth/hooks/useAuthSession";
import { QRScanner } from "@/modules/asistencia/components/QRScanner";
import { AsistenciaFeedback } from "@/modules/asistencia/components/AsistenciaFeedback";
import { useRegistrarAsistencia } from "@/modules/asistencia/hooks/useAsistencia";
import { formCardClass } from "@/lib/ks-page-styles";

export const Route = createFileRoute("/escanear-asistencia")({
  component: EscanearAsistenciaPage,
});

function EscanearAsistenciaPage() {
  const { isAuthenticated } = useAuthSession();
  const registrarMutation = useRegistrarAsistencia();
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScan = useCallback(
    (token: string) => {
      const authToken = localStorage.getItem("miToken");
      if (!authToken) {
        setScanError("Debés iniciar sesión para registrar asistencia.");
        return;
      }

      registrarMutation.mutate(
        { token, authToken },
        {
          onError: (error) => setScanError(error.message),
        },
      );
    },
    [registrarMutation],
  );

  if (!isAuthenticated) {
    return (
      <AuthPageLayout title="Escanear asistencia" subtitle="Iniciá sesión para continuar">
        <AsistenciaFeedback
          status="error"
          message="Debés iniciar sesión para registrar tu asistencia."
        />
      </AuthPageLayout>
    );
  }

  if (registrarMutation.isSuccess) {
    return (
      <AuthPageLayout title="Escanear asistencia" subtitle="Lectura completada">
        <AsistenciaFeedback
          status="success"
          message={registrarMutation.data.message}
          claseInfo={registrarMutation.data.clase}
        />
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title="Escanear asistencia"
      subtitle="Apuntá la cámara al código QR de la clase"
      showBackButton
    >
      <section className={formCardClass}>
        <QRScanner
          onScan={handleScan}
          onError={(message) => setScanError(message)}
        />
        {scanError && (
          <p className="mt-4 text-sm text-red-700">{scanError}</p>
        )}
        {registrarMutation.isPending && (
          <p className="mt-4 text-sm text-ks-gray-text">Registrando asistencia...</p>
        )}
      </section>
    </AuthPageLayout>
  );
}
