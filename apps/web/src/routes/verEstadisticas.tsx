import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  X,
  TrendingUp,
  TrendingDown,
  CalendarClock,
  BarChart3,
  Info,
  Wallet,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { API_BASE } from '@/lib/constants'
import { BackPreviousRouteButton } from '@/components/BackPreviousRouteButton'
import type { KinesciusClass } from '@/lib/class-interface'
import { formatDate, formatTime, normalizeFecha, getMinFecha } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

function isClaseVisibleParaHoyOFuturo(fecha: string) {
  const normalizedFecha = normalizeFecha(fecha)
  if (!normalizedFecha) return false
  return normalizedFecha >= getMinFecha()
}

type ClaseConProfesor = KinesciusClass & { profesor_nombre?: string | null }

function getNombreProfesor(clase: ClaseConProfesor) {
  return clase.profesor_nombre ?? clase.profesor ?? 'Sin profesor'
}

// --- Tipos para las estadísticas ---
type ClaseDetalle = {
  id: number
  fecha: string
  hora: string
  cupo: number | null
  inscriptos: number
  ocupacion: number | null
}

type Estadisticas =
  | { hayEstadisticas: false; message: string }
  | {
      hayEstadisticas: true
      message: string
      tipo: string
      totalClasesPrevias: number
      promedioInscriptos: number
      promedioOcupacion: number | null
      claseMasConcurrida: ClaseDetalle
      claseMenosConcurrida: ClaseDetalle
      detalle: ClaseDetalle[]
    }

type AbonadoResumen = {
  id: number | string
  nombre: string
  apellido: string
  mail: string
}

type GeneralResumen = {
  mes: string
  pagos: {
    hayInformacionPagos: boolean
    totalAbonados: number
    pagaron: AbonadoResumen[]
    faltantes: AbonadoResumen[]
  }
  actividadPorConcurrencia: {
    tipo: string
    inscriptos: number
  }[]
}

export const Route = createFileRoute('/verEstadisticas')({
  component: RouteComponent,
})

// ---------- Subcomponentes ----------

function SkeletonCard() {
  return (
    <div className="bg-white rounded-ks-lg p-4 border border-ks-gray-border flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-3.5 w-28 bg-ks-gray-soft rounded" />
        <div className="h-3 w-20 bg-ks-gray-soft rounded" />
      </div>
      <div className="h-3 w-32 bg-ks-gray-soft rounded" />
      <div className="h-9 w-full bg-ks-gray-soft rounded-ks-full" />
    </div>
  )
}

function SkeletonStatBlock() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-14 w-full bg-ks-gray-soft rounded-ks-lg" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-ks-gray-soft rounded-ks-lg" />
        <div className="h-16 bg-ks-gray-soft rounded-ks-lg" />
      </div>
      <div className="h-40 w-full bg-ks-gray-soft rounded-ks-lg" />
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Info className="h-6 w-6 text-ks-gray-text" aria-hidden="true" />
      <p className="text-sm text-ks-gray-text max-w-xs">{label}</p>
    </div>
  )
}

function SectionCard({
  title,
  action,
  children,
  id,
}: {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  id?: string
}) {
  return (
    <section
      className="bg-ks-off-white rounded-ks-lg border border-ks-gray-border p-6 flex flex-col gap-4"
      aria-labelledby={id}
    >
      {(title || action) && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          {title ? (
            <h2 id={id} className="text-sm font-semibold uppercase tracking-wide text-ks-gray-text">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

// Barra de progreso simple reutilizable
function ProgressBar({ value, colorClass }: { value: number; colorClass: string }) {
  return (
    <div className="w-full h-1.5 bg-ks-gray-soft rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${colorClass}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  )
}

// ---------- Componente principal ----------

function RouteComponent() {
  const [classes, setClasses] = useState<ClaseConProfesor[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Controla si se muestra el bloque de "Historial por clase" (listado + fichas)
  const [showHistorial, setShowHistorial] = useState(false)

  const [statsClassId, setStatsClassId] = useState<number | null>(null)
  const [statsClassLabel, setStatsClassLabel] = useState<string | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [stats, setStats] = useState<Estadisticas | null>(null)
  const [mesSeleccionado, setMesSeleccionado] = useState(() => new Date().toISOString().slice(0, 7))
  const [generalLoading, setGeneralLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Tab activa dentro del "Resumen general del mes"
  const [tabResumen, setTabResumen] = useState<'pagos' | 'actividad'>('pagos')

  const [general, setGeneral] = useState<GeneralResumen | null>(null)

  const modalRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  const loadClasses = useCallback(async () => {
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/admin/clases`)
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      const clases = (data ?? []) as ClaseConProfesor[]
      const clasesVisibles = clases.filter((clase) => isClaseVisibleParaHoyOFuturo(clase.fecha))
      setClasses(clasesVisibles)

      if (clasesVisibles.length === 0) {
        setMessage('No hay clases disponibles.')
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
      setClasses([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadGeneral = useCallback(async (mes: string) => {
    setGeneralLoading(true)
    setGeneralError(null)

    try {
      const response = await fetch(`${API_BASE}/admin/clases/estadisticas-generales?mes=${mes}`)
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      setGeneral(data)
    } catch (e) {
      setGeneralError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setGeneralLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadGeneral(mesSeleccionado)
  }, [mesSeleccionado, loadGeneral])

  // Sólo cargamos las clases cuando el usuario abre el bloque de historial
  useEffect(() => {
    if (showHistorial && classes.length === 0 && !loading) {
      void loadClasses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistorial])

  const openStats = async (clase: ClaseConProfesor) => {
    setStatsClassId(clase.id)
    setStatsClassLabel(clase.tipo ?? 'Sin tipo')
    setStats(null)
    setStatsError(null)
    setStatsLoading(true)

    try {
      const response = await fetch(`${API_BASE}/admin/clases/${clase.id}/estadisticas`)
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      setStats(data as Estadisticas)
    } catch (fetchError) {
      setStatsError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
    } finally {
      setStatsLoading(false)
    }
  }

  const closeStats = useCallback(() => {
    setStatsClassId(null)
    setStatsClassLabel(null)
    setStats(null)
    setStatsError(null)
  }, [])

  // Cerrar con ESC + bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    if (statsClassId === null) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeStats()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [statsClassId, closeStats])

  // Ratio de pagos para colorear el estado (verde / ámbar / rojo)
  // Sólo se calcula si hay información de pagos para el mes consultado
  const pagosRatio = useMemo(() => {
    if (!general || !general.pagos.hayInformacionPagos || general.pagos.totalAbonados === 0) return null
    return (general.pagos.pagaron.length / general.pagos.totalAbonados) * 100
  }, [general])

  const pagosEstado = useMemo(() => {
    if (pagosRatio === null) return null
    if (pagosRatio >= 80) return { color: 'bg-ks-green-dark', text: 'text-ks-green-dark', label: 'Al día' }
    if (pagosRatio >= 50) return { color: 'bg-amber-500', text: 'text-amber-600', label: 'Atención' }
    return { color: 'bg-red-500', text: 'text-red-600', label: 'Urgente' }
  }, [pagosRatio])

  const classCards = useMemo(
    () =>
      classes.map((clase) => (
        <div
          key={clase.id}
          className="relative bg-white rounded-ks-lg p-4 pl-5 border border-ks-gray-border flex flex-col gap-3 overflow-hidden transition-colors hover:border-ks-green-light"
        >
          <span
            className="absolute left-0 top-0 h-full w-1.5 bg-ks-green-light/70"
            aria-hidden="true"
          />

          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-ks-green-dark leading-tight">
              {clase.tipo ?? 'Sin tipo'}
            </span>
            <span className="flex items-center gap-1 text-xs text-ks-gray-text whitespace-nowrap mt-0.5">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDate(clase.fecha)} · {formatTime(clase.hora)}
            </span>
          </div>

          <span className="text-xs text-ks-gray-text">
            {getNombreProfesor(clase)} · Cupo {clase.cupo ?? 'N/A'}
          </span>

          <button
            type="button"
            className="flex items-center justify-center gap-2 bg-ks-green-dark text-white rounded-ks-full py-2.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ks-green-dark focus:ring-offset-2"
            onClick={() => void openStats(clase)}
          >
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Ver estadísticas
          </button>
        </div>
      )),
    [classes]
  )

  return (
    <main className="page-shell">
      <BackPreviousRouteButton className="mb-4" />

      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <div>
          <h1 className="text-xl font-bold text-ks-green-dark">Estadísticas de clases</h1>
          <p className="text-sm text-ks-gray-text mt-0.5">
            Pagos, concurrencia y ocupación de las clases del centro.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Resumen general del mes: Pagos / Actividad */}
        <SectionCard
          id="resumen-general-heading"
          title="Resumen general del mes"
          action={
            <label className="flex items-center gap-2 text-sm text-ks-gray-text">
              <span className="sr-only">Mes a consultar</span>
              <input
                type="month"
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="border border-ks-gray-border rounded-ks-full px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ks-green-dark"
              />
            </label>
          }
        >
          {generalLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
              <div className="h-16 bg-white rounded-ks-lg border border-ks-gray-border" />
              <div className="h-16 bg-white rounded-ks-lg border border-ks-gray-border" />
            </div>
          ) : null}

          {generalError ? (
            <p className="status-badge full" role="alert">
              {generalError}
            </p>
          ) : null}

          {!generalLoading && general ? (
            <>
              {/* Tabs */}
              <div className="flex gap-1 border-b border-ks-gray-border" role="tablist" aria-label="Resumen del mes">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tabResumen === 'pagos'}
                  onClick={() => setTabResumen('pagos')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ks-green-dark focus:ring-offset-1 rounded-t-md ${
                    tabResumen === 'pagos'
                      ? 'text-ks-green-dark border-b-2 border-ks-green-dark'
                      : 'text-ks-gray-text hover:text-ks-green-dark'
                  }`}
                >
                  <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                  Pagos
                  {pagosEstado && general.pagos.hayInformacionPagos && pagosEstado.label !== 'Al día' ? (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${pagosEstado.color}`}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tabResumen === 'actividad'}
                  onClick={() => setTabResumen('actividad')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ks-green-dark focus:ring-offset-1 rounded-t-md ${
                    tabResumen === 'actividad'
                      ? 'text-ks-green-dark border-b-2 border-ks-green-dark'
                      : 'text-ks-gray-text hover:text-ks-green-dark'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Actividad
                </button>
              </div>

              {/* Tab: Pagos */}
              {tabResumen === 'pagos' ? (
                <div className="flex flex-col gap-3" role="tabpanel">
                  {!general.pagos.hayInformacionPagos ? (
                    <EmptyState label="No hay información de pagos para este mes." />
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white rounded-ks-lg p-4 border border-ks-gray-border flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-ks-gray-text">Abonados que pagaron</span>
                            <CheckCircle2 className="h-4 w-4 text-ks-green-dark" aria-hidden="true" />
                          </div>
                          <div className="text-xl font-semibold text-ks-green-dark">
                            {general.pagos.pagaron.length}
                            <span className="text-sm font-normal text-ks-gray-text">
                              {' '}
                              / {general.pagos.totalAbonados}
                            </span>
                          </div>
                          {pagosRatio !== null && pagosEstado ? (
                            <ProgressBar value={pagosRatio} colorClass={pagosEstado.color} />
                          ) : null}
                        </div>

                        <div className="bg-white rounded-ks-lg p-4 border border-ks-gray-border flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-ks-gray-text">Abonados que faltan pagar</span>
                            {general.pagos.faltantes.length > 0 ? (
                              <AlertTriangle
                                className={`h-4 w-4 ${pagosEstado?.text ?? 'text-ks-gray-text'}`}
                                aria-hidden="true"
                              />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-ks-green-dark" aria-hidden="true" />
                            )}
                          </div>
                          <div
                            className={`text-xl font-semibold ${
                              general.pagos.faltantes.length > 0
                                ? pagosEstado?.text ?? 'text-ks-green-dark'
                                : 'text-ks-green-dark'
                            }`}
                          >
                            {general.pagos.faltantes.length}
                          </div>
                        </div>
                      </div>

                      {general.pagos.faltantes.length > 0 ? (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-ks-green-dark font-medium focus:outline-none focus:ring-2 focus:ring-ks-green-dark rounded">
                            Ver quiénes faltan pagar
                          </summary>
                          <ul className="mt-2 flex flex-col divide-y divide-ks-gray-border border border-ks-gray-border rounded-ks-lg overflow-hidden">
                            {general.pagos.faltantes.map((p) => (
                              <li key={p.id} className="text-ks-gray-text bg-white px-3 py-2 text-sm">
                                {p.nombre} {p.apellido} <span className="text-xs">— {p.mail}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : (
                        <p className="text-sm text-ks-gray-text flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-ks-green-dark" aria-hidden="true" />
                          Todos los abonados están al día.
                        </p>
                      )}
                    </>
                  )}
                </div>
              ) : null}

              {/* Tab: Actividad */}
              {tabResumen === 'actividad' ? (
                <div role="tabpanel">
                  {general.actividadPorConcurrencia.length === 0 ? (
                    <EmptyState label="No hubo inscripciones este mes." />
                  ) : (
                    <div className="bg-white rounded-ks-lg border border-ks-gray-border p-4">
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={general.actividadPorConcurrencia}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="tipo"
                            tick={{ fontSize: 12, fill: '#4b5f52' }}
                            tickLine={false}
                            axisLine={{ stroke: '#e5e7eb' }}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12, fill: '#4b5f52' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(26,58,42,0.05)' }}
                            contentStyle={{
                              borderRadius: 12,
                              border: '1px solid #e5e7eb',
                              fontSize: 13,
                            }}
                            formatter={(value: number) => [`${value} inscriptos`, '']}
                            labelStyle={{ color: '#1a3a2a', fontWeight: 600 }}
                          />
                          <Bar dataKey="inscriptos" radius={[6, 6, 0, 0]} maxBarSize={48}>
                            {general.actividadPorConcurrencia.map((entry, i) => (
                              <Cell key={entry.tipo} fill={i === 0 ? '#1a3a2a' : '#8fc9a5'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          ) : null}
        </SectionCard>

        {/* Selección de clase puntual para ver historial */}
        <SectionCard
          id="historial-heading"
          title="Historial por clase"
          action={
            showHistorial ? (
              <button
                type="button"
                onClick={() => setShowHistorial(false)}
                className="text-sm text-ks-gray-text hover:text-ks-green-dark transition-colors focus:outline-none focus:ring-2 focus:ring-ks-green-dark rounded px-2 py-1"
              >
                Ocultar
              </button>
            ) : undefined
          }
        >
          {!showHistorial ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-ks-gray-text">
                Elegí una clase para ver la concurrencia histórica de esa actividad.
              </p>
              <button
                type="button"
                onClick={() => setShowHistorial(true)}
                className="flex items-center gap-2 bg-ks-green-dark text-white rounded-ks-full px-5 py-2.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ks-green-dark focus:ring-offset-2"
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                Ver historial por clases
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-ks-gray-text -mt-1">
                Elegí una clase para ver la concurrencia histórica de esa actividad.
              </p>

              {error ? (
                <p className="status-badge full" role="alert">
                  {error}
                </p>
              ) : null}
              {message ? <p className="status-badge success">{message}</p> : null}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : classes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{classCards}</div>
              ) : null}
            </>
          )}
        </SectionCard>
      </div>

      {statsClassId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeStats}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stats-modal-title"
            className="bg-ks-off-white rounded-ks-lg border border-ks-gray-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <h2 id="stats-modal-title" className="text-base font-semibold text-ks-green-dark">
                Historial de "{statsClassLabel}"
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeStats}
                aria-label="Cerrar"
                className="text-ks-gray-text hover:text-ks-green-dark transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-ks-green-dark rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {statsLoading ? <SkeletonStatBlock /> : null}

            {statsError ? (
              <p className="status-badge full" role="alert">
                {statsError}
              </p>
            ) : null}

            {stats && !stats.hayEstadisticas ? <EmptyState label={stats.message} /> : null}

            {stats && stats.hayEstadisticas ? (
              <div className="flex flex-col gap-4">
                {/* Explicación: qué se está mostrando y por qué (celeste, como antes) */}
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-ks-lg p-3">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-xs text-blue-900 leading-relaxed">
                    Esta clase todavía no sucedió. Lo que ves abajo es el historial de las{' '}
                    <span className="font-medium">
                      {stats.totalClasesPrevias} clases anteriores
                    </span>{' '}
                    de tipo <span className="font-medium">"{stats.tipo}"</span>, para
                    estimar cuánta gente suele venir.
                  </p>
                </div>

                {/* Números resumen */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-ks-lg p-4 border border-ks-gray-border flex flex-col gap-1">
                    <span className="text-xs text-ks-gray-text">Promedio de inscriptos</span>
                    <span className="text-xl font-semibold text-ks-green-dark">
                      {stats.promedioInscriptos}
                    </span>
                  </div>

                  <div className="bg-white rounded-ks-lg p-4 border border-ks-gray-border flex flex-col gap-1">
                    <span className="text-xs text-ks-gray-text">Ocupación promedio</span>
                    <span className="text-xl font-semibold text-ks-green-dark">
                      {stats.promedioOcupacion !== null ? `${stats.promedioOcupacion}%` : '—'}
                    </span>
                  </div>
                </div>

                {/* Detalle: TODAS las clases previas, en formato tabla */}
                <div>
                  <p className="text-xs font-medium text-ks-gray-text uppercase tracking-wide mb-2">
                    Clase por clase
                  </p>
                  <div className="border border-ks-gray-border rounded-ks-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 bg-ks-off-white">
                          <tr className="text-left text-xs uppercase tracking-wide text-ks-gray-text">
                            <th className="py-2 px-3 font-medium">Fecha</th>
                            <th className="py-2 px-3 font-medium text-right">Inscriptos</th>
                            <th className="py-2 px-3 font-medium text-right">Ocupación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.detalle.map((c) => {
                            const esMax = c.id === stats.claseMasConcurrida.id
                            const esMin = c.id === stats.claseMenosConcurrida.id
                            const pct = c.ocupacion ?? 0

                            // Colores por fila: verde para la más concurrida, ámbar para la menos concurrida
                            const rowBg = esMax ? 'bg-green-50' : esMin ? 'bg-amber-50' : 'bg-white'
                            const barColor = esMax
                              ? 'bg-ks-green-dark'
                              : esMin
                                ? 'bg-amber-500'
                                : 'bg-ks-green-dark'
                            const iconColor = esMax
                              ? 'text-ks-green-dark'
                              : esMin
                                ? 'text-amber-600'
                                : 'text-ks-green-dark'

                            return (
                              <tr key={c.id} className={`${rowBg} border-t border-ks-gray-border`}>
                                <td className="py-2 px-3">
                                  <div className={`flex items-center gap-1.5 ${iconColor}`}>
                                    {esMax ? (
                                      <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    ) : null}
                                    {esMin ? (
                                      <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    ) : null}
                                    <span className="whitespace-nowrap">
                                      {formatDate(c.fecha)} · {formatTime(c.hora)}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-right text-ks-gray-text tabular-nums">
                                  {c.inscriptos}/{c.cupo ?? '—'}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="w-16 h-1.5 bg-ks-gray-soft rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${barColor}`}
                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-ks-gray-text w-9 text-right tabular-nums">
                                      {pct}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </main>
  )
}