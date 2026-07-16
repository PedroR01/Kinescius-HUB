import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  btnBase,
  btnPrimary,
  formCardClass,
  fieldStackClass,
  labelClass,
  inputClass,
} from '@/lib/ks-page-styles'
import { AuthPageLayout } from '@/modules/auth/components/AuthPageLayout'
import { AuthFeedback } from '@/modules/auth/components/AuthFeedback'
import { API_BASE } from '@/lib/constants'

export const Route = createFileRoute('/recordatorios')({
  component: RecordatoriosPage,
})

function RecordatoriosPage() {
  // Estado para recordatorio de turno
  const [horarioTurno, setHorarioTurno] = useState<string>('15:45')
  const [horarioTurnoNuevo, setHorarioTurnoNuevo] = useState<string>('15:45')
  const [guardandoTurno, setGuardandoTurno] = useState(false)
  const [messageTurno, setMessageTurno] = useState('')
  const [errorTurno, setErrorTurno] = useState('')

  // Estado para recordatorio de pago
  const [horarioPago, setHorarioPago] = useState<string>('15:45')
  const [horarioPagoNuevo, setHorarioPagoNuevo] = useState<string>('15:45')
  const [guardandoPago, setGuardandoPago] = useState(false)
  const [messagePago, setMessagePago] = useState('')
  const [errorPago, setErrorPago] = useState('')

  const [cargando, setCargando] = useState(true)
  const [errorGeneral, setErrorGeneral] = useState('')

  useEffect(() => {
    const cargarHorarios = async () => {
      setCargando(true)
      setErrorGeneral('')
      try {
        const res = await fetch(`${API_BASE}/recordatorios/horarios`)
        const data = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(data?.message ?? `Error ${res.status}`)
        }

        // Turno
        const ht = String(data.turno.hora).padStart(2, '0')
        const mt = String(data.turno.minuto).padStart(2, '0')
        const turnoStr = `${ht}:${mt}`
        setHorarioTurno(turnoStr)
        setHorarioTurnoNuevo(turnoStr)

        // Pago
        const hp = String(data.pago.hora).padStart(2, '0')
        const mp = String(data.pago.minuto).padStart(2, '0')
        const pagoStr = `${hp}:${mp}`
        setHorarioPago(pagoStr)
        setHorarioPagoNuevo(pagoStr)
      } catch (err) {
        setErrorGeneral(err instanceof Error ? err.message : 'Error al cargar horarios')
      } finally {
        setCargando(false)
      }
    }
    void cargarHorarios()
  }, [])

  const hayCambioTurno = horarioTurnoNuevo !== horarioTurno
  const hayCambioPago = horarioPagoNuevo !== horarioPago

  const cambiarHorarioTurno = async () => {
    const [horaStr, minutoStr] = horarioTurnoNuevo.split(':')
    const hora = Number(horaStr)
    const minuto = Number(minutoStr)

    setGuardandoTurno(true)
    setMessageTurno('')
    setErrorTurno('')

    try {
      const res = await fetch(`${API_BASE}/recordatorios/horario`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hora, minuto }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message ?? `Error ${res.status}`)
      }

      setMessageTurno(data?.message ?? 'Horario cambiado con éxito')
      setHorarioTurno(horarioTurnoNuevo)
    } catch (err) {
      setErrorTurno(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setGuardandoTurno(false)
    }
  }

  const cambiarHorarioPago = async () => {
    const [horaStr, minutoStr] = horarioPagoNuevo.split(':')
    const hora = Number(horaStr)
    const minuto = Number(minutoStr)

    setGuardandoPago(true)
    setMessagePago('')
    setErrorPago('')

    try {
      const res = await fetch(`${API_BASE}/recordatorios/horario-pago`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hora, minuto }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message ?? `Error ${res.status}`)
      }

      setMessagePago(data?.message ?? 'Horario cambiado con éxito')
      setHorarioPago(horarioPagoNuevo)
    } catch (err) {
      setErrorPago(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setGuardandoPago(false)
    }
  }

  return (
    <AuthPageLayout
      title="Configurar recordatorios"
      subtitle="Configurá los horarios en que se envían automáticamente los recordatorios a los clientes."
      showBackButton
    >
      {cargando ? (
        <section className={formCardClass}>
          <p className="text-sm text-ks-gray-text">Cargando configuración…</p>
        </section>
      ) : errorGeneral ? (
        <AuthFeedback message="" error={errorGeneral} />
      ) : (
        <>
          {/* ── Sección: Recordatorio de Turno ── */}
          <section className={formCardClass}>
            <h3 className="m-0 mb-4 font-outfit text-[17px] font-bold tracking-tight text-ks-text-dark">
              Recordatorio de turno
            </h3>
            <p className="m-0 mb-5 text-[15px] leading-relaxed text-ks-gray-text">
              Horario actual de envío:{' '}
              <strong className="text-ks-text-dark">{horarioTurno} hs</strong>
            </p>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className={fieldStackClass}>
                <div>
                  <label className={labelClass} htmlFor="horario-turno">
                    NUEVO HORARIO
                  </label>
                  <input
                    id="horario-turno"
                    type="time"
                    value={horarioTurnoNuevo}
                    onChange={(e) => setHorarioTurnoNuevo(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => void cambiarHorarioTurno()}
                  disabled={!hayCambioTurno || guardandoTurno}
                  className={cn(btnBase, btnPrimary, 'w-full')}
                >
                  {guardandoTurno ? 'Guardando...' : 'Cambiar horario'}
                </button>
              </div>
            </form>

            <AuthFeedback message={messageTurno} error={errorTurno} />
          </section>

          {/* ── Sección: Recordatorio de Pago ── */}
          <section className={cn(formCardClass, 'mt-6')}>
            <h3 className="m-0 mb-4 font-outfit text-[17px] font-bold tracking-tight text-ks-text-dark">
              Recordatorio de pago
            </h3>
            <p className="m-0 mb-2 text-[14px] leading-relaxed text-ks-gray-text">

            </p>
            <p className="m-0 mb-5 text-[15px] leading-relaxed text-ks-gray-text">
              Horario actual de envío:{' '}
              <strong className="text-ks-text-dark">{horarioPago} hs</strong>
            </p>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className={fieldStackClass}>
                <div>
                  <label className={labelClass} htmlFor="horario-pago">
                    NUEVO HORARIO
                  </label>
                  <input
                    id="horario-pago"
                    type="time"
                    value={horarioPagoNuevo}
                    onChange={(e) => setHorarioPagoNuevo(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => void cambiarHorarioPago()}
                  disabled={!hayCambioPago || guardandoPago}
                  className={cn(btnBase, btnPrimary, 'w-full')}
                >
                  {guardandoPago ? 'Guardando...' : 'Cambiar horario'}
                </button>
              </div>
            </form>

            <AuthFeedback message={messagePago} error={errorPago} />
          </section>
        </>
      )}
    </AuthPageLayout>
  )
}
