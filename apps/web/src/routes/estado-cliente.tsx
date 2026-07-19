import { updateSuscripcionCancelada } from '@/api/payments'
import { btnBase, btnDanger, btnPrimary, btnSecondary, formCardClass } from '@/lib/ks-page-styles'
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout'
import { createFileRoute } from '@tanstack/react-router'
import { useCurrentUserProfile, useEstadoCliente } from '@/modules/auth/hooks/useAuthSession'
import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'
import { ConfirmSubscriptionCancelModal } from '@/modules/home/components/ConfirmSubscriptionCancelModal'
import { SubscriptionPaymentModal } from '@/modules/turnos/components/SubscriptionPaymentModal'
import { toast } from 'sonner'

export const Route = createFileRoute('/estado-cliente')({
  component: RouteComponent,
})

const MS_PER_DAY = 1000 * 60 * 60 * 24
const MIN_DAYS_TO_RENEW = 30

function daysSincePayment(fechaPago: string | null | undefined): number | null {
  if (!fechaPago) return null
  const paymentDate = new Date(fechaPago)
  if (Number.isNaN(paymentDate.getTime())) return null
  const diffMs = Date.now() - paymentDate.getTime()
  return Math.floor(diffMs / MS_PER_DAY)
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('h-4 rounded bg-ks-gray-soft', className)} />
}

function EstadoClienteSkeleton() {
  return (
    <section className={formCardClass} aria-busy="true" aria-label="Cargando estado de cuenta">
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="flex flex-col gap-3">
          <SkeletonLine className="h-7 w-52" />
          <ul className="grid grid-cols-2 gap-3">
            <SkeletonLine className="w-full" />
            <SkeletonLine className="w-3/4" />
            <SkeletonLine className="w-5/6" />
            <SkeletonLine className="w-2/3" />
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <SkeletonLine className="h-7 w-56" />
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <SkeletonLine className="w-40" />
              <SkeletonLine className="h-8 w-36 rounded-full" />
              <SkeletonLine className="h-8 w-40 rounded-full" />
            </div>
            <SkeletonLine className="w-64" />
            <SkeletonLine className="w-52" />
            <SkeletonLine className="w-44" />
          </div>
        </div>
      </div>
    </section>
  )
}

function RouteComponent() {
  const { userProfile, isLoading: isLoadingProfile } = useCurrentUserProfile();
  const { estadoCliente, isLoading: isLoadingEstado, refetchEstadoCliente } = useEstadoCliente();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] = useState(false);
  const [isAbortingCancel, setIsAbortingCancel] = useState(false);

  const isLoading = isLoadingProfile || isLoadingEstado;
  const isAbonado = userProfile?.rol === 3;
  const hasPendingCancel = Boolean(estadoCliente?.cancelado);
  const daysSinceLastPayment = useMemo(
    () => daysSincePayment(estadoCliente?.fecha_pago),
    [estadoCliente?.fecha_pago],
  );
  const canRenewSubscription =
    isAbonado && daysSinceLastPayment !== null && daysSinceLastPayment >= MIN_DAYS_TO_RENEW;

  const handleAbortCancel = async () => {
    if (!userProfile?.id) {
      toast.error("No se pudo identificar tu cuenta. Por favor, iniciá sesión.");
      return;
    }

    setIsAbortingCancel(true);
    try {
      await updateSuscripcionCancelada(userProfile.id, false);
      toast.success("Cancelación abortada. Tu suscripción sigue activa.");
      await refetchEstadoCliente();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo abortar la cancelación. Intentá de nuevo.";
      toast.error(message);
    } finally {
      setIsAbortingCancel(false);
    }
  };

  return (<AuthPageLayout title="Estado de cuenta" subtitle="Ver información y estado de tu cuenta" showBackButton={true}>
    {isLoading ? (
      <EstadoClienteSkeleton />
    ) : (
      <section className={formCardClass}>
        <h2 className="text-2xl font-bold">Información personal</h2>
        <ul className="grid grid-cols-2 gap-2">
          <li>Apellido y nombre: <span className="font-bold">{userProfile?.apellido} {userProfile?.nombre}</span></li>
          <li>DNI: <span className="font-bold">{userProfile?.dni}</span></li>
          <li>Email: <span className="font-bold">{userProfile?.mail}</span></li>
          <li>Teléfono: <span className="font-bold">{userProfile?.telefono || 'No tiene teléfono registrado'}</span></li>
        </ul>
        <h2 className="text-2xl font-bold">Información suscripción</h2>
        <ul className="flex flex-col gap-2">
          <li className="flex flex-row flex-wrap gap-2 items-center">
            <p>Estado de la cuenta: <span className="font-bold">{isAbonado ? 'Abonado' : 'No abonado'}</span></p>
            {isAbonado && hasPendingCancel ? (
              <button
                type="button"
                className={cn(btnBase, btnSecondary, "size-4 text-xs w-fit flex items-center justify-center")}
                onClick={() => void handleAbortCancel()}
                disabled={isAbortingCancel}
              >
                {isAbortingCancel ? 'Procesando...' : 'Abortar cancelación'}
              </button>
            ) : (
              <button
                type="button"
                className={cn(btnBase, isAbonado ? btnDanger : btnSecondary, "size-4 text-xs w-fit flex items-center justify-center")}
                onClick={() => { isAbonado ? setIsCancelSubscriptionModalOpen(true) : setIsPaymentModalOpen(true) }}
              >
                {isAbonado ? 'Cancelar suscripción' : 'Comprar suscripción'}
              </button>
            )}
            {isAbonado ? (
              <button
                type="button"
                className={cn(btnBase, btnPrimary, "size-4 text-xs w-fit flex items-center justify-center")}
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={!canRenewSubscription}
                title={
                  canRenewSubscription
                    ? undefined
                    : `Podés renovar a partir de ${MIN_DAYS_TO_RENEW} días desde el último pago`
                }
              >
                Renovar suscripción
              </button>
            ) : null}
          </li>
          {isAbonado && hasPendingCancel ? (
            <li className="text-sm text-ks-gray-text">
              Tenés una cancelación solicitada. Se efectuará al vencimiento de tu suscripción.
            </li>
          ) : null}

          <li>Fecha de último pago: <span className="font-bold">{estadoCliente?.fecha_pago ? new Date(estadoCliente.fecha_pago).toLocaleDateString() : 'No tiene pago de suscripción registrado'}</span></li>
          {estadoCliente?.fecha_pago ?
            <>
              <li>Fecha de fin de la suscripción: <span className="font-bold">{new Date(estadoCliente.fecha_fin).toLocaleDateString()}</span></li>
              <li>Clases a favor sin usar: <span className="font-bold">{estadoCliente?.clases_utilizadas}/3</span></li>
            </> : null}
          <li>Saldo a favor: <span className="font-bold">{estadoCliente?.monto_favor}</span></li>
        </ul>
      </section>
    )}
    <SubscriptionPaymentModal
      isOpen={isPaymentModalOpen}
      clienteId={userProfile?.id ?? null}
      onClose={() => setIsPaymentModalOpen(false)}
      onPaymentStarted={() => { setIsPaymentModalOpen(false) }}
    />
    <ConfirmSubscriptionCancelModal
      isOpen={isCancelSubscriptionModalOpen}
      clienteId={userProfile?.id ?? null}
      onClose={() => setIsCancelSubscriptionModalOpen(false)}
      onConfirm={() => {
        setIsCancelSubscriptionModalOpen(false);
        void refetchEstadoCliente();
      }}
    />
  </AuthPageLayout>)
}
