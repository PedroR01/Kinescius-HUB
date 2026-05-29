import { createFileRoute } from '@tanstack/react-router'
import { CancelarTurno } from '../modules/turnos/components/cancelarTurnoModal'
import { CambiarTurno } from '../modules/turnos/components/cambiarTurnoModal'

export const Route = createFileRoute('/cancelarTurno')({
  component: RouteComponent,
})

function RouteComponent() {
  return (<div className="flex items-center justify-center h-screen">
    <CancelarTurno
      clienteId={1}
      claseId={1}
      fechaClase="2022-01-01"
      horaClase="12:00"
      actividad="Actividad"
      onCancelSuccess={() => { }}
      onClose={() => { }}
    />
    <CambiarTurno
      clienteId={1}
      claseActualId={1}
      fechaActual="2022-01-01"
      horaActual="12:00"
      actividad="Actividad"
      onChangeSuccess={() => { }}
      onClose={() => { }}
    />
  </div>)
}
