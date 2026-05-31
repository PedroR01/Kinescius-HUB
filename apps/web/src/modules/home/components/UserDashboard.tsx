import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { btnBase, btnSecondary, formCardClass } from "@/lib/ks-page-styles";
import { AuthPageLayout } from "@/modules/auth/components/AuthPageLayout";
import { useAuthSession } from "@/modules/auth/hooks/useAuthSession";
import { getDashboardActions } from "../data/dashboardActions";
import { ConfirmLogoutModal } from "./ConfirmLogoutModal";
import { DashboardActionList } from "./DashboardActionList";

export function UserDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isHydrated, clearSession } = useAuthSession();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      navigate({ to: "/iniciarSesion", replace: true });
    }
  }, [isHydrated, isAuthenticated, navigate]);

  if (!isHydrated || !isAuthenticated) {
    return null;
  }

  const handleConfirmLogout = () => {
    clearSession();
    setIsLogoutModalOpen(false);
    navigate({ to: "/", replace: true });
  };

  return (
    <>
      <AuthPageLayout
        title={isAdmin ? "Panel de administración" : "Tu panel"}
        subtitle={
          isAdmin
            ? "Gestioná las operaciones del centro"
            : "Accedé a las funcionalidades de tu cuenta"
        }
      >
        <section className={formCardClass}>
          <h2 className="m-0 mb-2 font-outfit text-[22px] font-bold tracking-[-0.5px] text-ks-text-dark">
            Bienvenido a Kinescius
          </h2>
          <p className="m-0 text-[15px] leading-relaxed text-ks-gray-text">
            Kinescius es un centro de rehabilitación. Desde acá podés acceder a las herramientas
            disponibles para tu cuenta.
          </p>
        </section>

        <DashboardActionList actions={getDashboardActions(isAdmin)} />

        <section className={formCardClass}>
          <button
            type="button"
            className={cn(btnBase, btnSecondary, "w-full")}
            onClick={() => setIsLogoutModalOpen(true)}
          >
            Cerrar sesión
          </button>
        </section>
      </AuthPageLayout>

      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}
