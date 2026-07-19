import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { btnBase, btnSecondary, formCardClass } from "@/lib/ks-page-styles";
import { AuthPageLayout } from "@/modules/auth/components/AuthPageLayout";
import { useAuthSession, useCurrentUserProfile } from "@/modules/auth/hooks/useAuthSession";
import { getDashboardActions } from "../data/dashboardActions";
import { ConfirmLogoutModal } from "./ConfirmLogoutModal";
import { DashboardActionList } from "./DashboardActionList";

export function UserDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, role, isHydrated, clearSession } = useAuthSession();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { userProfile } = useCurrentUserProfile();
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      navigate({ to: "/iniciarSesion", search: { redirect: undefined }, replace: true });
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
        username={userProfile?.nombre || ""}
        showBackButton={true}
        title={
          role === "admin"
            ? "Panel de administración"
            : role === "profesor"
              ? "Panel del profesor"
              : "Tu panel"
        }
        subtitle={
          role === "admin"
            ? "Gestioná las operaciones del centro"
            : role === "profesor"
              ? "Generá códigos QR para registrar asistencia"
              : "Accedé a las funcionalidades de tu cuenta"
        }
      >

        <DashboardActionList actions={getDashboardActions(role)} />

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
