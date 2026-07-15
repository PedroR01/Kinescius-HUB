import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { formatDate, formatTime } from '@/lib/utils'
import { API_BASE } from '@/lib/constants'
import { BackPreviousRouteButton } from '@/components/BackPreviousRouteButton'
import { btnBase, btnPrimary, formCardClass } from '@/lib/ks-page-styles'
import { useClassFetcher } from '@/modules/turnos/hooks/useClassFetcher'

type EstadoPresentismo = 'presente' | 'ausente'

type Alumno = {
  nombre: string
  apellido: string
  dni: string
  estado: EstadoPresentismo
}

type Clase = {
  id: number
  fecha: string
  hora: string
  tipo?: string
}

const ESTADO_LABEL: Record<EstadoPresentismo, string> = {
  presente: 'Presente',
  ausente: 'Ausente',
}

const ESTADO_CLASS: Record<EstadoPresentismo, string> = {
  presente: 'bg-[rgba(82,183,136,0.15)] text-ks-green-mid',
  ausente: 'bg-[rgba(192,57,43,0.12)] text-ks-red',
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

// Cantidad de días del mes, contemplando años bisiestos
function diasDelMes(anio: number, mesIndex: number) {
  return new Date(anio, mesIndex + 1, 0).getDate()
}

// Día de la semana del 1° del mes, con la semana empezando en lunes (0=Lunes ... 6=Domingo)
function primerDiaSemana(anio: number, mesIndex: number) {
  const dow = new Date(anio, mesIndex, 1).getDay() // 0=Domingo ... 6=Sábado
  return (dow + 6) % 7
}

function toFecha(anio: number, mesIndex: number, dia: number) {
  return `${anio}-${pad2(mesIndex + 1)}-${pad2(dia)}`
}

export const Route = createFileRoute('/verPresentismo')({
  component: RouteComponent,
})

function RouteComponent() {
  const { classes: clases, loading, error } = useClassFetcher()

  const hoy = new Date()

  const [viewAnio, setViewAnio] = useState(hoy.getFullYear())
  const [viewMes, setViewMes] = useState(hoy.getMonth()) // 0-indexed
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [modal, setModal] = useState<{ clase: Clase; alumnos: Alumno[] } | null>(null)

  // Set de fechas (YYYY-MM-DD) que tienen al menos una clase, para pintar el calendario
  const fechasConClase = useMemo(() => new Set(clases.map((c) => c.fecha)), [clases])

  const celdas = useMemo(() => {
    const total = diasDelMes(viewAnio, viewMes)
    const offset = primerDiaSemana(viewAnio, viewMes)
    const arr: (number | null)[] = Array(offset).fill(null)
    for (let d = 1; d <= total; d++) arr.push(d)
    return arr
  }, [viewAnio, viewMes])

  const fechaHoy = toFecha(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

  const irMesAnterior = () => {
    if (viewMes === 0) {
      setViewMes(11)
      setViewAnio((a) => a - 1)
    } else {
      setViewMes((m) => m - 1)
    }
  }

  const irMesSiguiente = () => {
    if (viewMes === 11) {
      setViewMes(0)
      setViewAnio((a) => a + 1)
    } else {
      setViewMes((m) => m + 1)
    }
  }

  const clasesAMostrar = useMemo(() => {
    const lista = fechaSeleccionada ? clases.filter((c) => c.fecha === fechaSeleccionada) : clases
    return [...lista].sort((a, b) => {
      if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha)
      return a.hora.localeCompare(b.hora)
    })
  }, [clases, fechaSeleccionada])

  // Compara solo por fecha (sin hora) para saber si la clase ya se dio o todavía no
  const claseEsFutura = (clase: { fecha: string }) => {
    const hoyMedianoche = new Date()
    hoyMedianoche.setHours(0, 0, 0, 0)
    const fechaClase = new Date(`${clase.fecha}T00:00:00`)
    return fechaClase > hoyMedianoche
  }

  const handleVerPresentismo = async (clase: Clase) => {
    setActionLoadingId(clase.id)
    try {
      const res = await fetch(`${API_BASE}/presentismo/clase/${clase.id}`)
      if (!res.ok) throw new Error('Error al consultar presentismo')
      const alumnos = (await res.json()) as Alumno[]
      setModal({ clase, alumnos })
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <main className="mx-auto grid min-h-svh max-w-[760px] gap-4 px-6 pt-10 pb-16 font-dm-sans text-ks-gray-text antialiased max-sm:px-4 max-sm:pt-5 max-sm:pb-12">
      <BackPreviousRouteButton />

      <section className="ks-hero-card relative overflow-hidden rounded-ks-lg px-10 py-12 shadow-[0_20px_60px_rgba(26,58,42,0.18)] bg-[linear-gradient(135deg,var(--ks-green-dark)_0%,var(--ks-green-mid)_60%,var(--ks-green-light)_100%)] max-sm:px-6 max-sm:py-8">
        <h1 className="relative m-0 mb-2 font-outfit text-[38px] font-bold tracking-[-1px] text-white max-sm:text-[28px]">
          Presentismo
        </h1>
        <p className="relative text-[15px] font-light text-white/72">
          Consultá la asistencia de los alumnos por clase.
        </p>
      </section>

      {loading && (
        <section className={`${formCardClass} rounded-ks-md border border-[rgba(82,183,136,0.25)] px-5 py-4`}>
          <p className="text-sm font-medium text-ks-green-dark">Cargando clases...</p>
        </section>
      )}

      {error && (
        <section className="rounded-ks-md border border-[rgba(192,57,43,0.3)] bg-ks-red-soft px-5 py-4">
          <p className="text-sm font-medium text-ks-red">{error}</p>
        </section>
      )}

      {!loading && !error && (
        <>
          {/* Calendario */}
          <section className={formCardClass}>
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={irMesAnterior}
                aria-label="Mes anterior"
                className="flex h-8 w-8 items-center justify-center rounded-ks-full border-none bg-ks-gray-soft text-sm text-ks-gray-text hover:bg-ks-green-pale hover:text-ks-green-dark"
              >
                ‹
              </button>

              <span className="font-outfit text-sm font-bold tracking-[0.5px] text-ks-text-dark">
                {MESES[viewMes]} {viewAnio}
              </span>

              <button
                type="button"
                onClick={irMesSiguiente}
                aria-label="Mes siguiente"
                className="flex h-8 w-8 items-center justify-center rounded-ks-full border-none bg-ks-gray-soft text-sm text-ks-gray-text hover:bg-ks-green-pale hover:text-ks-green-dark"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {DIAS_SEMANA.map((d, i) => (
                <span key={i} className="py-1 font-outfit text-[11px] font-bold tracking-[1px] text-ks-gray-text/70">
                  {d}
                </span>
              ))}

              {celdas.map((dia, i) => {
                if (dia === null) return <span key={`vacio-${i}`} />

                const fecha = toFecha(viewAnio, viewMes, dia)
                const tieneClase = fechasConClase.has(fecha)
                const seleccionado = fechaSeleccionada === fecha
                const esHoy = fecha === fechaHoy

                return (
                  <button
                    key={fecha}
                    type="button"
                    onClick={() => setFechaSeleccionada(seleccionado ? null : fecha)}
                    className={[
                      'relative flex h-10 flex-col items-center justify-center gap-0.5 rounded-ks-md text-sm transition-colors',
                      seleccionado
                        ? 'bg-ks-green-mid font-semibold text-white'
                        : esHoy
                          ? 'border-[1.5px] border-ks-green-mid text-ks-text-dark hover:bg-ks-green-pale'
                          : 'text-ks-text-dark hover:bg-ks-green-pale',
                    ].join(' ')}
                  >
                    {dia}
                    <span
                      className={[
                        'h-1 w-1 rounded-full',
                        tieneClase ? (seleccionado ? 'bg-white' : 'bg-ks-green-mid') : 'bg-transparent',
                      ].join(' ')}
                    />
                  </button>
                )
              })}
            </div>

            {fechaSeleccionada && (
              <button
                type="button"
                onClick={() => setFechaSeleccionada(null)}
                className="mt-3 text-[13px] font-medium text-ks-green-mid hover:underline"
              >
                Ver todas las clases
              </button>
            )}
          </section>

          {/* Listado de clases */}
          <section className="grid gap-2.5">
            {clasesAMostrar.length === 0 ? (
              <div className={`${formCardClass} text-sm text-ks-gray-text`}>
                {fechaSeleccionada
                  ? 'No hay clases registradas para esa fecha.'
                  : 'Todavía no hay clases registradas.'}
              </div>
            ) : (
              clasesAMostrar.map((clase) => (
                <div
                  key={clase.id}
                  className={`${formCardClass} flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch`}
                >
                  <div>
                    <p className="m-0 font-outfit text-[15px] font-semibold text-ks-text-dark">
                      {clase.tipo ?? 'Clase'}
                    </p>
                    <p className="m-0 mt-0.5 text-[13px] text-ks-gray-text">
                      {formatDate(clase.fecha)} · {formatTime(clase.hora)}
                    </p>
                  </div>

                  <button
                    className={`${btnBase} ${btnPrimary} whitespace-nowrap max-sm:w-full`}
                    type="button"
                    disabled={actionLoadingId === clase.id}
                    onClick={() => handleVerPresentismo(clase)}
                  >
                    {actionLoadingId === clase.id ? 'Cargando...' : 'Ver presentismo'}
                  </button>
                </div>
              ))
            )}
          </section>
        </>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-1000 flex items-center justify-center bg-[rgba(15,36,25,0.45)] p-6"
          onClick={() => setModal(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-[520px] overflow-y-auto rounded-ks-lg bg-white p-7 shadow-[0_20px_60px_rgba(26,58,42,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b-[1.5px] border-ks-gray-soft pb-4">
              <div>
                <h2 className="m-0 mb-1 font-outfit text-lg font-bold text-ks-text-dark">
                  {modal.clase.tipo ?? 'Clase'} — {formatDate(modal.clase.fecha)}
                </h2>
                <p className="m-0 text-[13px] text-ks-gray-text">{formatTime(modal.clase.hora)}</p>
              </div>
              <button
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-ks-full border-none bg-ks-gray-soft text-sm text-ks-gray-text hover:bg-ks-green-pale hover:text-ks-green-dark"
                onClick={() => setModal(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {modal.alumnos.length === 0 ? (
              <p className="text-sm text-ks-gray-text">
                {claseEsFutura(modal.clase)
                  ? 'Esta clase todavía no se dio, no hay presentismo para mostrar.'
                  : 'No hay datos de asistencia registrados para esta clase.'}
              </p>
            ) : (
              <div className="grid gap-2.5">
                {modal.alumnos.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-ks-md border-[1.5px] border-ks-gray-soft bg-ks-off-white px-4 py-3.5"
                  >
                    <div>
                      <p className="m-0 font-outfit text-[15px] font-semibold text-ks-text-dark">
                        {a.nombre} {a.apellido}
                      </p>
                      <p className="m-0 mt-0.5 text-[13px] text-ks-gray-text">DNI: {a.dni}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-ks-full px-2.5 py-1 font-outfit text-xs font-semibold ${ESTADO_CLASS[a.estado]}`}>
                      {ESTADO_LABEL[a.estado]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button className={`${btnBase} ${btnPrimary} mt-5 w-full`} type="button" onClick={() => setModal(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}