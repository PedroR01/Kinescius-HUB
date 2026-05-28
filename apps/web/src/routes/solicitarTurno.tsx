import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from "react"

type Clase = {
  id: number
  fecha: string
  hora: string
  tipo: string | null
  cupo: number | null
  QR: string | null
  id_listaEspera: number | null
  id_profesor: number | null
  id_administrador: number | null
}

type AppointmentSlot = {
  key: string
  date: string
  dateLabel: string
  dayLabel: string
  time: string
  className: string
  price: number
  cupo: number
  full: boolean
  sinCupo: boolean
  favorAmount: number
  source: Clase
}

function formatDate(fecha: string) {
  const [year, month, day] = fecha.split('T')[0].split('-').map(Number)
  return `${day}/${month}/${year}`
}

function formatDateLabel(fecha: string) {
  const [, month, day] = fecha.split('T')[0].split('-').map(Number)
  return `${day}/${month}`
}

function formatDayLabel(fecha: string) {
  const date = new Date(fecha.split('T')[0] + 'T12:00:00')
  return date.toLocaleDateString('es-AR', { weekday: 'short' })
    .replace('.', '')
    .replace(/^\w/, c => c.toUpperCase())
}

function formatTime(hora: string) {
  const [hh, mm] = hora.split(':')
  return `${hh}:${mm}`
}

export const Route = createFileRoute('/solicitarTurno')({
  component: RouteComponent,
})

function ClassCard({
  slot,
  isSelected,
  isWaited,
  onSelect,
  onWaitList,
}: {
  slot: AppointmentSlot
  isSelected: boolean
  isWaited: boolean
  onSelect: (slot: AppointmentSlot) => void
  onWaitList: (slot: AppointmentSlot) => void
}) {
  return (
    <div
      className={`class-card${slot.sinCupo ? ' sin-cupo' : ''}${isSelected && !slot.sinCupo ? ' selected' : ''}`}
      onClick={() => !slot.sinCupo && onSelect(slot)}
      role={slot.sinCupo ? undefined : 'button'}
      tabIndex={slot.sinCupo ? undefined : 0}
      onKeyDown={e => e.key === 'Enter' && !slot.sinCupo && onSelect(slot)}
    >
      <div className="class-time">{slot.time} hs</div>
      <div className="class-name">{slot.className}</div>
      {slot.sinCupo ? (
        <>
          <div className="cupo-badge sin-cupo-badge">
            <span className="cupo-icon">Sin cupo</span>
          </div>
          <button
            type="button"
            className={`btn-espera-card${isWaited ? ' waited' : ''}`}
            onClick={e => { e.stopPropagation(); onWaitList(slot) }}
          >
            {isWaited ? '✓ En lista de espera' : 'Unirse a lista de espera'}
          </button>
        </>
      ) : slot.cupo === 1 ? (
        <div className="cupo-badge solo-badge">¡Solo 1!</div>
      ) : (
        <div className="cupo-badge disponible-badge">{slot.cupo} lugares</div>
      )}
    </div>
  )
}

function RouteComponent() {
  const [classes, setClasses] = useState<Clase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null)
  const [phase, setPhase] = useState<"idle" | "confirmFavor" | "payment" | "completed">("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<string[]>([])
  const [waitList, setWaitList] = useState<string[]>([])
  const [montoAFavor, setMontoAFavor] = useState(0)
  const [viewAll, setViewAll] = useState(false)

  const API_BASE = "http://localhost:3000"
  const CLIENTE_ID = 1

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE}/clases`)
        if (!response.ok) throw new Error(`Error al cargar clases: ${response.status}`)
        const data = (await response.json()) as Clase[]
        setClasses(data)
        if (data.length > 0) {
          setSelectedDate(formatDate(data[0].fecha))
        }
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    void fetchClasses()
  }, [])

  useEffect(() => {
    const fetchMontoAFavor = async () => {
      try {
        const res = await fetch(`${API_BASE}/clases/cliente/${CLIENTE_ID}/monto-a-favor`)
        if (!res.ok) return
        const data = await res.json()
        setMontoAFavor(Number(data.monto_a_favor) ?? 0)
      } catch {
        // si falla, queda en 0
      }
    }
    void fetchMontoAFavor()
  }, [])

  const appointmentSlots = useMemo<AppointmentSlot[]>(() => {
    return classes.map((clase) => {
      const cupo = clase.cupo ?? 0
      return {
        key: `${clase.id}`,
        date: formatDate(clase.fecha),
        dateLabel: formatDateLabel(clase.fecha),
        dayLabel: formatDayLabel(clase.fecha),
        time: formatTime(clase.hora),
        className: clase.tipo ?? 'Clase',
        price: 100,
        cupo,
        full: cupo <= 0,
        sinCupo: cupo <= 0,
        favorAmount: montoAFavor,
        source: clase,
      }
    })
  }, [classes, montoAFavor])

  const dates = useMemo(() => {
    const seen = new Set<string>()
    return appointmentSlots.filter(s => {
      if (seen.has(s.date)) return false
      seen.add(s.date)
      return true
    })
  }, [appointmentSlots])

  const classesByDate = useMemo(
    () => appointmentSlots.filter(slot => slot.date === selectedDate),
    [appointmentSlots, selectedDate]
  )

  const handleSelectSlot = (slot: AppointmentSlot) => {
    if (slot.sinCupo) return
    setSelectedSlot(slot)
    setMessage(null)
    setPhase('idle')
    if (slot.favorAmount > 0) {
      setPhase('confirmFavor')
    } else {
      setPhase('payment')
    }
  }

  const handleAddWaitList = (slot: AppointmentSlot) => {
    const waitKey = `${slot.date} ${slot.time}hs ${slot.className}`
    if (!waitList.includes(waitKey)) {
      setWaitList(list => [...list, waitKey])
    }
    setMessage(`Fuiste añadido a la lista de espera para ${slot.className} el ${slot.date} a las ${slot.time}hs.`)
  }

  const handleConfirmFavor = (apply: boolean) => {
    if (!selectedSlot) return
    if (apply) {
      void (async () => {
        try {
          setMessage('Enviando inscripción...')
          const res = await fetch(`${API_BASE}/clases/${selectedSlot.source.id}/turnos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clienteId: CLIENTE_ID, estado: 'pagado' }),
          })
          if (res.status === 409) throw new Error('Ya estás inscripto en esta clase.')
          if (!res.ok) throw new Error(`Error: ${res.status}`)
          await res.json()
          setPhase('completed')
          const entry = `${selectedSlot.date} ${selectedSlot.time}hs ${selectedSlot.className}`
          setEnrollments(list => [...list, entry])
          setMessage(`¡Turno confirmado! Se aplicó el monto a favor de $${selectedSlot.favorAmount}.`)
        } catch (err) {
          setMessage(err instanceof Error ? err.message : 'Error al crear turno')
        }
      })()
      return
    }
    setPhase('payment')
  }

  const handlePayment = async (method: string) => {
    if (!selectedSlot) return
    try {
      setMessage('Procesando pago...')
      const res = await fetch(`${API_BASE}/clases/${selectedSlot.source.id}/turnos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: CLIENTE_ID, estado: 'pagado' }),
      })
      if (res.status === 409) throw new Error('Ya estás inscripto en esta clase.')
      if (!res.ok) throw new Error(`Error: ${res.status}`)
      await res.json()
      const entry = `${selectedSlot.date} ${selectedSlot.time}hs ${selectedSlot.className}`
      setPhase('completed')
      setEnrollments(list => [...list, entry])
      setMessage(`¡Turno confirmado! Método de pago: ${method}.`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al procesar pago')
    }
  }

  const priceToPay = selectedSlot ? selectedSlot.price / 2 : 0

  const handleToggleViewAll = () => {
    setViewAll(v => !v)
    setSelectedSlot(null)
    setPhase('idle')
    setMessage(null)
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <h1>Reservá tu clase</h1>
        <p>Elegí el día y la clase que querés tomar en Kinescius</p>
      </section>

      <section className="form-card">
        <div className="day-strip-header">
          <p className="section-label">SELECCIONÁ EL DÍA</p>
          <button
            type="button"
            className={`btn-ver-todas${viewAll ? ' active' : ''}`}
            onClick={handleToggleViewAll}
          >
            {viewAll ? 'Ver por día' : 'Ver todas las clases'}
          </button>
        </div>

        {loading ? (
          <p className="loading-text">Cargando clases...</p>
        ) : error ? (
          <p className="status-badge full">{error}</p>
        ) : !viewAll ? (
          <div className="day-strip">
            {dates.map(slot => (
              <button
                key={slot.date}
                type="button"
                className={`day-pill${selectedDate === slot.date ? ' active' : ''}`}
                onClick={() => {
                  setSelectedDate(slot.date)
                  setSelectedSlot(null)
                  setPhase('idle')
                  setMessage(null)
                }}
              >
                <span className="day-name">{slot.dayLabel}</span>
                <span className="day-date">{slot.dateLabel}</span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {!loading && !error && (
        <section className="form-card">
          <p className="section-label">
            {viewAll ? 'TODAS LAS CLASES DISPONIBLES' : 'CLASES DISPONIBLES'}
          </p>

          {viewAll ? (
            dates.length === 0 ? (
              <p className="loading-text">No hay clases disponibles.</p>
            ) : (
              <div className="all-classes-list">
                {dates.map(dateSlot => {
                  const slotsForDate = appointmentSlots.filter(s => s.date === dateSlot.date)
                  return (
                    <div key={dateSlot.date} className="date-group">
                      <div className="date-group-heading">
                        <span className="date-group-label">
                          {dateSlot.dayLabel} {dateSlot.dateLabel}
                        </span>
                      </div>
                      <div className="classes-grid">
                        {slotsForDate.map(slot => (
                          <ClassCard
                            key={slot.key}
                            slot={slot}
                            isSelected={selectedSlot?.key === slot.key}
                            isWaited={waitList.includes(`${slot.date} ${slot.time}hs ${slot.className}`)}
                            onSelect={handleSelectSlot}
                            onWaitList={handleAddWaitList}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            classesByDate.length === 0 ? (
              <p className="loading-text">No hay clases para este día.</p>
            ) : (
              <div className="classes-grid">
                {classesByDate.map(slot => (
                  <ClassCard
                    key={slot.key}
                    slot={slot}
                    isSelected={selectedSlot?.key === slot.key}
                    isWaited={waitList.includes(`${slot.date} ${slot.time}hs ${slot.className}`)}
                    onSelect={handleSelectSlot}
                    onWaitList={handleAddWaitList}
                  />
                ))}
              </div>
            )
          )}
        </section>
      )}

      {phase === 'confirmFavor' && selectedSlot && (
        <section className="form-card modal-card">
          <p>Tenés <strong>${selectedSlot.favorAmount}</strong> de monto a favor. ¿Querés aplicarlo?</p>
          <div className="actions-row">
            <button className="button button-primary" type="button" onClick={() => handleConfirmFavor(true)}>
              Aplicar monto a favor
            </button>
            <button className="button button-secondary" type="button" onClick={() => handleConfirmFavor(false)}>
              Pagar sin monto a favor
            </button>
          </div>
        </section>
      )}

      {phase === 'payment' && selectedSlot && (
        <section className="form-card modal-card">
          <p>Monto a pagar: <strong>${priceToPay}</strong></p>
          <p>Elegí un método de pago:</p>
          <div className="actions-row">
            <button className="button button-primary" type="button" onClick={() => handlePayment('tarjeta')}>
              Tarjeta
            </button>
            <button className="button button-secondary" type="button" onClick={() => handlePayment('transferencia')}>
              Transferencia
            </button>
          </div>
        </section>
      )}

      {message && (
        <section className="message-card">
          <p>{message}</p>
        </section>
      )}

      <section className="form-card">
        <Link to="/" className="button button-secondary">
          ← Volver al inicio
        </Link>
      </section>
    </main>
  )
}