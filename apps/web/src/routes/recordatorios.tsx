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
  const [horarioActual, setHorarioActual] = useState<string>('15:45')
  const [horarioNuevo, setHorarioNuevo] = useState<string>('15:45')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarHorarios = async () => {
      setCargando(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/recordatorios/horarios`)
        const data = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(data?.message ?? `Error ${res.status}`)
        }

        const h = String(data.hora).padStart(2, '0')
        const m = String(data.minuto).padStart(2, '0')
        const timeStr = `${h}:${m}`
        setHorarioActual(timeStr)
        setHorarioNuevo(timeStr)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar horarios')
      } finally {
        setCargando(false)
      }
    }
    void cargarHorarios()
  }, [])

  const hayCambio = horarioNuevo !== horarioActual

  const cambiarHorario = async () => {
    const [horaStr, minutoStr] = horarioNuevo.split(':')
    const hora = Number(horaStr)
    const minuto = Number(minutoStr)

    setGuardando(true)
    setMessage('')
    setError('')

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

      setMessage(data?.message ?? 'Horario cambiado con éxito')
      setHorarioActual(horarioNuevo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <AuthPageLayout
      title="Configurar recordatorios"
      subtitle="Elegí el horario en que se envían automáticamente los recordatorios de turno a los clientes."
      showBackButton
    >
      <section className={formCardClass}>
        {cargando ? (
          <p className="text-sm text-ks-gray-text">Cargando configuración…</p>
        ) : (
          <>
            <p className="m-0 mb-5 text-[15px] leading-relaxed text-ks-gray-text">
              Horario actual de envío:{' '}
              <strong className="text-ks-text-dark">{horarioActual} hs</strong>
            </p>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className={fieldStackClass}>
                <div>
                  <label className={labelClass} htmlFor="horario-recordatorio">
                    NUEVO HORARIO
                  </label>
                  <input
                    id="horario-recordatorio"
                    type="time"
                    value={horarioNuevo}
                    onChange={(e) => setHorarioNuevo(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => void cambiarHorario()}
                  disabled={!hayCambio || guardando}
                  className={cn(btnBase, btnPrimary, 'w-full')}
                >
                  {guardando ? 'Guardando...' : 'Cambiar horario'}
                </button>
              </div>
            </form>
          </>
        )}
      </section>

      <AuthFeedback message={message} error={error} />
    </AuthPageLayout>
  )
}
