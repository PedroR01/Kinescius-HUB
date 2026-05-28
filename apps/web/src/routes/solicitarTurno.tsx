import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

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

const btnBase =
  'font-outfit inline-block cursor-pointer rounded-full border-none px-7 py-[13px] text-[15px] font-semibold tracking-[0.2px] no-underline transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:transform-none'

const btnPrimary =
  'bg-[linear-gradient(135deg,var(--ks-green-mid)_0%,var(--ks-green-light)_100%)] text-white shadow-[0_4px_16px_rgba(45,106,79,0.35)] hover:shadow-[0_8px_24px_rgba(45,106,79,0.45)]'

const btnSecondary =
  'border border-[rgba(82,183,136,0.3)] bg-ks-gray-soft text-ks-green-dark'

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
  return date
    .toLocaleDateString('es-AR', { weekday: 'short' })
    .replace('.', '')
    .replace(/^\w/, (c) => c.toUpperCase())
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
      className={cn(
        'flex flex-col gap-1 rounded-ks-md border-[1.5px] p-[18px_16px] transition-all duration-[180ms]',
        slot.sinCupo
          ? 'cursor-default border-ks-gray-soft bg-ks-gray-soft opacity-70'
          : 'cursor-pointer border-ks-gray-soft bg-ks-off-white hover:-translate-y-0.5 hover:border-ks-green-light hover:shadow-[0_2px_8px_rgba(26,58,42,0.08)]',
        isSelected &&
          !slot.sinCupo &&
          'border-ks-green-mid bg-ks-green-pale shadow-[0_0_0_3px_rgba(82,183,136,0.2)]',
      )}
      onClick={() => !slot.sinCupo && onSelect(slot)}
      role={slot.sinCupo ? undefined : 'button'}
      tabIndex={slot.sinCupo ? undefined : 0}
      onKeyDown={(e) => e.key === 'Enter' && !slot.sinCupo && onSelect(slot)}
    >
      <div
        className={cn(
          'font-outfit text-[22px] font-bold tracking-[-0.5px] text-ks-text-dark',
          slot.sinCupo && 'text-ks-gray-text',
        )}
      >
        {slot.time} hs
      </div>
      <div className="mb-2 text-[13px] font-normal text-ks-gray-text">{slot.className}</div>
      {slot.sinCupo ? (
        <>
          <span className="inline-flex w-fit items-center gap-[5px] rounded-ks-full bg-black/6 px-2.5 py-1 font-outfit text-xs font-semibold text-ks-gray-text">
            Sin cupo
          </span>
          <button
            type="button"
            className={cn(
              'mt-2 block w-full cursor-pointer rounded-ks-full border-[1.5px] px-3 py-[7px] text-center font-outfit text-xs font-semibold transition-colors duration-150',
              isWaited
                ? 'border-[rgba(82,183,136,0.4)] bg-ks-green-pale text-ks-green-mid'
                : 'border-[rgba(192,57,43,0.3)] bg-ks-red-soft text-ks-red hover:border-ks-red hover:bg-[#fbd0cd]',
            )}
            onClick={(e) => {
              e.stopPropagation()
              onWaitList(slot)
            }}
          >
            {isWaited ? '✓ En lista de espera' : 'Unirse a lista de espera'}
          </button>
        </>
      ) : slot.cupo === 1 ? (
        <span className="inline-flex w-fit items-center gap-[5px] rounded-ks-full bg-[rgba(255,180,0,0.15)] px-2.5 py-1 font-outfit text-xs font-semibold text-[#a67c00]">
          ¡Solo 1!
        </span>
      ) : (
        <span className="inline-flex w-fit items-center gap-[5px] rounded-ks-full bg-ks-green-pale px-2.5 py-1 font-outfit text-xs font-semibold text-ks-green-mid">
          {slot.cupo} lugares
        </span>
      )}
    </div>
  )
}

function RouteComponent() {
  const [classes, setClasses] = useState<Clase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null)
  const [phase, setPhase] = useState<'idle' | 'confirmFavor' | 'payment' | 'completed'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [waitList, setWaitList] = useState<string[]>([])
  const [montoAFavor, setMontoAFavor] = useState(0)
  const [viewAll, setViewAll] = useState(false)

  const API_BASE = 'http://localhost:3000'
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
    return appointmentSlots.filter((s) => {
      if (seen.has(s.date)) return false
      seen.add(s.date)
      return true
    })
  }, [appointmentSlots])

  const classesByDate = useMemo(
    () => appointmentSlots.filter((slot) => slot.date === selectedDate),
    [appointmentSlots, selectedDate],
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
      setWaitList((list) => [...list, waitKey])
    }
    setMessage(
      `Fuiste añadido a la lista de espera para ${slot.className} el ${slot.date} a las ${slot.time}hs.`,
    )
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
          setMessage(
            `¡Turno confirmado! Se aplicó el monto a favor de $${selectedSlot.favorAmount}.`,
          )
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
      setPhase('completed')
      setMessage(`¡Turno confirmado! Método de pago: ${method}.`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al procesar pago')
    }
  }

  const priceToPay = selectedSlot ? selectedSlot.price / 2 : 0

  const handleToggleViewAll = () => {
    setViewAll((v) => !v)
    setSelectedSlot(null)
    setPhase('idle')
    setMessage(null)
  }

  const formCardClass =
    'rounded-ks-lg border border-[rgba(82,183,136,0.18)] bg-white p-7 shadow-[0_8px_32px_rgba(26,58,42,0.12)] animate-ks-slide-up max-sm:p-5'

  return (
    <main
      className={cn(
        'mx-auto grid min-h-svh max-w-[760px] gap-4 px-6 pt-10 pb-16 font-dm-sans text-ks-gray-text antialiased',
        'bg-[radial-gradient(ellipse_80%_50%_at_10%_0%,rgba(82,183,136,0.12)_0%,transparent_60%),radial-gradient(ellipse_60%_40%_at_90%_100%,rgba(183,224,85,0.1)_0%,transparent_55%),var(--ks-off-white)]',
        'max-sm:px-4 max-sm:pt-5 max-sm:pb-12',
      )}
    >
      <section
        className={cn(
          'ks-hero-card relative overflow-hidden rounded-ks-lg px-10 py-12 shadow-[0_20px_60px_rgba(26,58,42,0.18)] animate-ks-slide-up',
          'bg-[linear-gradient(135deg,var(--ks-green-dark)_0%,var(--ks-green-mid)_60%,var(--ks-green-light)_100%)]',
          'max-sm:px-6 max-sm:py-8',
        )}
      >
        <h1 className="relative m-0 mb-2 font-outfit text-[38px] font-bold tracking-[-1px] text-white max-sm:text-[28px]">
          Reservá tu clase
        </h1>
        <p className="relative text-[15px] font-light text-white/72">Elegí el día y la clase que querés tomar en Kinescius</p>
      </section>

      <section className={formCardClass}>
        <div className="mb-4 flex items-center justify-between">
          <p className="m-0 font-outfit text-[11px] font-bold tracking-[1.5px] text-ks-gray-text">
            SELECCIONÁ EL DÍA
          </p>
          <button
            type="button"
            className={cn(
              'cursor-pointer rounded-ks-full border-[1.5px] px-4 py-[7px] font-outfit text-xs font-semibold whitespace-nowrap transition-all duration-[180ms]',
              viewAll
                ? 'border-ks-green-dark bg-ks-green-dark text-white'
                : 'border-[rgba(82,183,136,0.4)] bg-ks-off-white text-ks-green-mid hover:border-ks-green-light hover:bg-ks-green-pale',
            )}
            onClick={handleToggleViewAll}
          >
            {viewAll ? 'Ver por día' : 'Ver todas las clases'}
          </button>
        </div>

        {loading ? (
          <p className="py-2 text-sm text-ks-gray-text">Cargando clases...</p>
        ) : error ? (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-ks-full border border-[rgba(192,57,43,0.2)] bg-ks-red-soft px-3.5 py-[7px] font-outfit text-[13px] font-semibold text-ks-red">
            {error}
          </p>
        ) : !viewAll ? (
          <div className="flex flex-wrap gap-2.5">
            {dates.map((slot) => (
              <button
                key={slot.date}
                type="button"
                className={cn(
                  'flex min-w-[68px] cursor-pointer flex-col items-center rounded-ks-full border-[1.5px] px-[18px] py-2.5 font-outfit transition-all duration-[180ms]',
                  selectedDate === slot.date
                    ? 'border-ks-green-dark bg-ks-green-dark text-white shadow-[0_4px_14px_rgba(26,58,42,0.25)]'
                    : 'border-ks-gray-soft bg-ks-off-white hover:border-ks-green-light hover:bg-ks-green-pale',
                )}
                onClick={() => {
                  setSelectedDate(slot.date)
                  setSelectedSlot(null)
                  setPhase('idle')
                  setMessage(null)
                }}
              >
                <span className="text-sm font-semibold">{slot.dayLabel}</span>
                <span
                  className={cn(
                    'mt-0.5 text-[11px] font-normal',
                    selectedDate === slot.date ? 'opacity-100' : 'opacity-70',
                  )}
                >
                  {slot.dateLabel}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {!loading && !error && (
        <section className={formCardClass}>
          <p className="mb-4 font-outfit text-[11px] font-bold tracking-[1.5px] text-ks-gray-text">
            {viewAll ? 'TODAS LAS CLASES DISPONIBLES' : 'CLASES DISPONIBLES'}
          </p>

          {viewAll ? (
            dates.length === 0 ? (
              <p className="py-2 text-sm text-ks-gray-text">No hay clases disponibles.</p>
            ) : (
              <div className="flex flex-col gap-6">
                {dates.map((dateSlot) => {
                  const slotsForDate = appointmentSlots.filter((s) => s.date === dateSlot.date)
                  return (
                    <div key={dateSlot.date}>
                      <div className="mb-3 border-b-[1.5px] border-ks-gray-soft pb-2">
                        <span className="font-outfit text-[13px] font-bold tracking-[0.5px] text-ks-green-dark capitalize">
                          {dateSlot.dayLabel} {dateSlot.dateLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 max-sm:grid-cols-2">
                        {slotsForDate.map((slot) => (
                          <ClassCard
                            key={slot.key}
                            slot={slot}
                            isSelected={selectedSlot?.key === slot.key}
                            isWaited={waitList.includes(
                              `${slot.date} ${slot.time}hs ${slot.className}`,
                            )}
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
          ) : classesByDate.length === 0 ? (
            <p className="py-2 text-sm text-ks-gray-text">No hay clases para este día.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 max-sm:grid-cols-2">
              {classesByDate.map((slot) => (
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
          )}
        </section>
      )}

      {phase === 'confirmFavor' && selectedSlot && (
        <section className={cn(formCardClass, 'animate-ks-slide-up')}>
          <p className="mb-1 text-[15px] leading-relaxed text-ks-text-dark">
            Tenés <strong className="text-ks-green-mid">${selectedSlot.favorAmount}</strong> de monto a
            favor. ¿Querés aplicarlo?
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className={cn(btnBase, btnPrimary)} type="button" onClick={() => handleConfirmFavor(true)}>
              Aplicar monto a favor
            </button>
            <button className={cn(btnBase, btnSecondary)} type="button" onClick={() => handleConfirmFavor(false)}>
              Pagar sin monto a favor
            </button>
          </div>
        </section>
      )}

      {phase === 'payment' && selectedSlot && (
        <section className={cn(formCardClass, 'animate-ks-slide-up')}>
          <p className="mb-1 text-[15px] leading-relaxed text-ks-text-dark">
            Monto a pagar: <strong className="text-ks-green-mid">${priceToPay}</strong>
          </p>
          <p className="mb-1 text-[15px] leading-relaxed text-ks-text-dark">Elegí un método de pago:</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className={cn(btnBase, btnPrimary)} type="button" onClick={() => handlePayment('tarjeta')}>
              Tarjeta
            </button>
            <button
              className={cn(btnBase, btnSecondary)}
              type="button"
              onClick={() => handlePayment('transferencia')}
            >
              Transferencia
            </button>
          </div>
        </section>
      )}

      {message && (
        <section
          className={cn(
            'animate-ks-slide-up rounded-ks-md border border-[rgba(82,183,136,0.25)] px-5 py-4',
            'bg-[linear-gradient(135deg,rgba(82,183,136,0.08),rgba(183,224,85,0.08))]',
          )}
        >
          <p className="text-sm leading-relaxed font-medium text-ks-green-dark">{message}</p>
        </section>
      )}

      <section className={formCardClass}>
        <Link to="/" className={cn(btnBase, btnSecondary)}>
          ← Volver al inicio
        </Link>
      </section>
    </main>
  )
}
