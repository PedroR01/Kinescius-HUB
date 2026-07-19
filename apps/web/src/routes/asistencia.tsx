import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AuthPageLayout } from "@/modules/auth/components/AuthPageLayout";
import { useAuthSession } from "@/modules/auth/hooks/useAuthSession";
import { AsistenciaFeedback } from "@/modules/asistencia/components/AsistenciaFeedback";
import { registrarAsistencia } from "@/api/asistencia";

type AsistenciaSearch = {
  token: string;
};

export const Route = createFileRoute("/asistencia")({
  validateSearch: (search: Record<string, unknown>): AsistenciaSearch => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: AsistenciaPage,
});

function AsistenciaPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const { isAuthenticated, isHydrated } = useAuthSession();
  const hasRegisteredRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Procesando asistencia...");
  const [claseInfo, setClaseInfo] = useState<{
    fecha: string;
    hora: string;
    tipo: string;
  } | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("El código QR no contiene un token válido.");
      return;
    }

    if (!isAuthenticated) {
      navigate({
        to: "/iniciarSesion",
        search: { redirect: `/asistencia?token=${token}` },
        replace: true,
      });
      return;
    }

    if (hasRegisteredRef.current) {
      return;
    }

    const authToken = localStorage.getItem("miToken");
    if (!authToken) {
      return;
    }

    hasRegisteredRef.current = true;

    registrarAsistencia(token, authToken)
      .then((result) => {
        setStatus("success");
        setMessage(result.message);
        setClaseInfo(result.clase);
      })
      .catch((error: Error) => {
        setStatus("error");
        setMessage(error.message);
      });
  }, [isAuthenticated, isHydrated, navigate, token]);

  return (
    <AuthPageLayout
      title="Registro de asistencia"
      subtitle="Escaneá el código QR de tu clase para confirmar tu presencia"
      showBackButton
    >
      <AsistenciaFeedback status={status} message={message} claseInfo={claseInfo} />
    </AuthPageLayout>
  );
}
