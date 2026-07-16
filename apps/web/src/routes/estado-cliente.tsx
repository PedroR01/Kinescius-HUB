import { btnBase, btnDanger, btnSecondary, formCardClass } from '@/lib/ks-page-styles'
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout'
import { createFileRoute } from '@tanstack/react-router'
import { useCurrentUserProfile, useEstadoCliente } from '@/modules/auth/hooks/useAuthSession'
import { cn } from '@/lib/utils'
import { PaymentSummaryModal } from '@/modules/turnos/components/PaymentSummaryModal'
import { useState } from 'react'
import { ConfirmSubscriptionCancelModal } from '@/modules/home/components/ConfirmSubscriptionCancelModal'


export const Route = createFileRoute('/estado-cliente')({
  component: RouteComponent,
})

function RouteComponent() {
  const userProfile = useCurrentUserProfile();
  const estadoCliente = useEstadoCliente();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] = useState(false);

  const handleCancelSubscription = () => {
    setIsCancelSubscriptionModalOpen(true);
  }
  return (<AuthPageLayout title="Estado de cuenta" subtitle="Ver información y estado de tu cuenta" showBackButton={true}>
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
        <li className="flex flex-row gap-2 items-center">
          <p>Estado de la cuenta: <span className="font-bold">{userProfile?.rol === 2 ? 'Abonado' : 'No abonado'}</span></p>
          <button
            type="button"
            className={cn(btnBase, userProfile?.rol === 2 ? btnDanger : btnSecondary, "size-4 text-xs w-fit flex items-center justify-center")}
            onClick={() => {userProfile?.rol === 2 ? setIsCancelSubscriptionModalOpen(true) : setIsPaymentModalOpen(true)}}
          >
            {userProfile?.rol === 2 ? 'Cancelar suscripción' : 'Comprar suscripción'}
          </button>
          </li>
       
        <li>Fecha de último pago: <span className="font-bold">{ estadoCliente?.fecha_pago ? new Date(estadoCliente.fecha_pago).toLocaleDateString() : 'No tiene pago de suscripciónregistrado'}</span></li>
        {estadoCliente?.fecha_pago ? 
        <>
        <li>Fecha de fin de la suscripción: <span className="font-bold">{new Date(estadoCliente.fecha_fin).toLocaleDateString()}</span></li>
        <li>Clases utilizadas: <span className="font-bold">{estadoCliente?.clases_utilizadas}/3</span></li>
        </>: null}
        <li>Saldo a favor: <span className="font-bold">{estadoCliente?.monto_favor}</span></li>
      </ul>
    </section>
    <PaymentSummaryModal
        isOpen={isPaymentModalOpen}
        items={[]}
        montoAFavor={0}
        clienteId={userProfile?.id ?? null}
        allowRemove={false}
        onClose={() => setIsPaymentModalOpen(false)}
        onRemoveItem={() => {}}
        onPaymentStarted={() => {setIsPaymentModalOpen(false)}}
        onSuccess={() => {setIsPaymentModalOpen(false)}}
      />
      <ConfirmSubscriptionCancelModal
        isOpen={isCancelSubscriptionModalOpen}
        onClose={() => setIsCancelSubscriptionModalOpen(false)}
        onConfirm={() => {handleCancelSubscription()}}
      />
  </AuthPageLayout>)
}
