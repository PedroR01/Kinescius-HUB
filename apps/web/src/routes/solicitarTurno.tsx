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
  time: string
  className: string
  price: number
  full: boolean
  favorAmount: number
  source: Clase
}

function formatDate(fecha: string) {
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return fecha
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function formatTime(hora: string) {
  return hora.replace(/:00$/, "hs")
}

export const Route = createFileRoute('/solicitarTurno')({
  component: RouteComponent,
})

function RouteComponent() {
  const [classes, setClasses] = useState<Clase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [className, setClassName] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [phase, setPhase] = useState<"idle" | "confirmFavor" | "payment" | "completed">("idle")
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null)
  const [enrollments, setEnrollments] = useState<string[]>([])
  const [waitList, setWaitList] = useState<string[]>([])

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true)
      setError(null)

      const apiBase = "http://localhost:3000"
      console.log("solicitarTurno: fetching clases from", apiBase || '/clases')

      try {
        const response = await fetch(`${apiBase}/clases`)
        console.log("solicitarTurno: fetch response", response.status, response.statusText)

        if (!response.ok) {
          throw new Error(`Error al cargar clases: ${response.status} ${response.statusText}`)
        }

        const data = (await response.json()) as Clase[]
        console.log("solicitarTurno: clases data", data)
        setClasses(data)

        if (data.length > 0) {
          const firstSlot = data[0]
          setDate(formatDate(firstSlot.fecha))
          setTime(formatTime(firstSlot.hora))
          setClassName(firstSlot.tipo ?? 'Clase')
        }
      } catch (fetchError) {
        console.error(fetchError)
        setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    void fetchClasses()
  }, [])

  const appointmentSlots = useMemo<AppointmentSlot[]>(() => {
    return classes.map((clase) => ({
      key: `${clase.id}`,
      date: formatDate(clase.fecha),
      time: formatTime(clase.hora),
      className: clase.tipo ?? 'Clase',
      price: 100,
      full: clase.cupo !== null && clase.cupo <= 0,
      favorAmount: 0,
      source: clase,
    }))
  }, [classes])

  const dates = useMemo(() => [...new Set(appointmentSlots.map((slot) => slot.date))], [appointmentSlots])
  const classesByDate = useMemo(
    () => appointmentSlots.filter((slot) => slot.date === date),
    [appointmentSlots, date]
  )
  const times = useMemo(
    () => [...new Set(classesByDate.map((slot) => slot.time))],
    [classesByDate]
  )
  const classNames = useMemo(
    () => [...new Set(appointmentSlots.map((slot) => slot.className))],
    [appointmentSlots]
  )

  useEffect(() => {
    if (date && times.length > 0 && !times.includes(time)) {
      setTime(times[0])
    }
  }, [date, time, times])

  useEffect(() => {
    if (classNames.length > 0 && !classNames.includes(className)) {
      setClassName(classNames[0])
    }
  }, [classNames, className])

  const currentSlot = useMemo(
    () => appointmentSlots.find((slot) => slot.date === date && slot.time === time && slot.className === className) ?? null,
    [appointmentSlots, date, time, className]
  )

  const priceToPay = currentSlot ? currentSlot.price / 2 : 0

  const handleSolicitarTurno = () => {
    if (!currentSlot) {
      setMessage('Seleccione una clase válida.')
      return
    }

    if (currentSlot.full) {
      setMessage('Cupo de la clase lleno. Usted ha sido añadido a la lista de espera si presiona el botón correspondiente.')
      return
    }

    setSelectedSlot(currentSlot)

    if (currentSlot.favorAmount > 0) {
      setPhase('confirmFavor')
      setMessage(`Este cliente tiene monto a favor de $${currentSlot.favorAmount}. Confirme si desea aplicarlo.`)
      return
    }

    setPhase('payment')
    setMessage(`Calculando monto a pagar... El monto a pagar es $${priceToPay}. Seleccione método de pago.`)
  }

  const handleAddWaitList = () => {
    if (!currentSlot) {
      setMessage('Seleccione una clase válida.')
      return
    }

    if (!currentSlot.full) {
      setMessage("Esta clase todavía tiene cupo. Use 'Solicitar turno' para inscribirse.")
      return
    }

    const waitKey = `${currentSlot.date} ${currentSlot.time} ${currentSlot.className}`
    if (!waitList.includes(waitKey)) {
      setWaitList((list) => [...list, waitKey])
    }
    setMessage('Cupo de la clase lleno. Usted ha sido añadido a la lista de espera.')
  }

  const handleConfirmFavor = (apply: boolean) => {
    if (!selectedSlot) {
      setMessage('No hay una clase seleccionada.')
      return
    }

    if (apply) {
      setPhase('completed')
      const entry = `${selectedSlot.date} ${selectedSlot.time} ${selectedSlot.className}`
      setEnrollments((list) => [...list, entry])
      setMessage(`Turno solicitado. Se aplicó el monto a favor de $${selectedSlot.favorAmount}.`)
      return
    }

    setPhase('payment')
    setMessage(`Monto a pagar $${priceToPay}. Seleccione un método de pago.`)
  }

  const handlePayment = (method: string) => {
    if (!selectedSlot) {
      setMessage('Seleccione la clase antes de elegir un método de pago.')
      return
    }

    const appointmentKey = `${selectedSlot.date} ${selectedSlot.time} ${selectedSlot.className}`
    setPhase('completed')
    setEnrollments((list) => [...list, appointmentKey])
    setMessage(`Turno solicitado. Método de pago: ${method}.`)
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <h1>Solicitar turno</h1>
        <p>Completa los datos para reservar tu clase en el centro Kinescius.</p>
      </section>

      <section className="form-card">
        <div className="field-row">
          <label>
            Día
            <select value={date} onChange={(event) => setDate(event.target.value)}>
              {dates.length === 0 ? <option value="">Cargando...</option> : dates.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Hora
            <select value={time} onChange={(event) => setTime(event.target.value)}>
              {times.length === 0 ? <option value="">Cargando...</option> : times.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Clase
            <select value={className} onChange={(event) => setClassName(event.target.value)}>
              {classNames.length === 0 ? <option value="">Cargando...</option> : classNames.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="actions-row">
          <button className="button button-primary" type="button" onClick={handleSolicitarTurno} disabled={loading || !currentSlot}>
            Solicitar turno
          </button>
          <button className="button button-secondary" type="button" onClick={handleAddWaitList} disabled={loading || !currentSlot}>
            Acceder a lista de espera
          </button>
        </div>

        {error ? <p className="status-badge full">{error}</p> : null}
        {loading ? <p>Cargando clases desde el servidor...</p> : null}

        <div className="status-card">
          <h2>Estado actual</h2>
          <p>
            {currentSlot ? (
              <>
                Clase: <strong>{currentSlot.className}</strong> — Día: <strong>{currentSlot.date}</strong> —
                Hora: <strong>{currentSlot.time}</strong>
              </>
            ) : (
              'Selecciona una fecha, hora y clase.'
            )}
          </p>
          {currentSlot?.full && <p className="status-badge full">Esta clase está completa</p>}
          {currentSlot?.favorAmount ? (
            <p className="status-badge favor">Monto a favor disponible: ${currentSlot.favorAmount}</p>
          ) : null}
        </div>

        {phase === 'confirmFavor' && selectedSlot ? (
          <div className="modal-card">
            <p>
              El cliente tiene <strong>${selectedSlot.favorAmount}</strong> de monto a favor. ¿Desea aplicarlo?
            </p>
            <div className="actions-row">
              <button className="button button-primary" type="button" onClick={() => handleConfirmFavor(true)}>
                Aplicar monto a favor
              </button>
              <button className="button button-secondary" type="button" onClick={() => handleConfirmFavor(false)}>
                Pagar sin monto a favor
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'payment' && selectedSlot ? (
          <div className="modal-card">
            <p>Monto a pagar: <strong>${priceToPay}</strong></p>
            <p>Elige un método de pago simulado:</p>
            <div className="actions-row">
              <button className="button button-primary" type="button" onClick={() => handlePayment('tarjeta')}>Tarjeta</button>
              <button className="button button-secondary" type="button" onClick={() => handlePayment('transferencia')}>Transferencia</button>
            </div>
          </div>
        ) : null}

        {message ? (
          <div className="message-card">
            <p>{message}</p>
          </div>
        ) : null}
      </section>

      <section className="info-card">
        <div>
          <h2>Turnos inscriptos</h2>
          <ul>
            {enrollments.length === 0 ? <li>No hay inscripciones aún.</li> : enrollments.map((entry) => <li key={entry}>{entry}</li>)}
          </ul>
        </div>
        <div>
          <h2>Lista de espera</h2>
          <ul>
            {waitList.length === 0 ? <li>No hay lista de espera.</li> : waitList.map((entry) => <li key={entry}>{entry}</li>)}
          </ul>
        </div>
      </section>

      <section className="form-card">
        <Link to="/" className="button button-secondary">
          Volver al inicio
        </Link>
      </section>
    </main>
  )
}
