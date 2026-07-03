import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { X, TrendingUp, TrendingDown, Users, Percent, CalendarClock, BarChart3, Info } from 'lucide-react'
import { API_BASE } from '@/lib/constants'
import { BackPreviousRouteButton } from '@/components/BackPreviousRouteButton'
import type { KinesciusClass } from '@/lib/class-interface'
import { formatDate, formatTime, normalizeFecha, getMinFecha } from '@/lib/utils'
import { DatePicker } from '@/components/DatePicker'

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

export const Route = createFileRoute('/verEstadisticas')({
  component: RouteComponent,
})

function RouteComponent() {
  const [classes, setClasses] = useState<ClaseConProfesor[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(getMinFecha())
  const [endDate, setEndDate] = useState('')

  const [statsClassId, setStatsClassId] = useState<number | null>(null)
  const [statsClassLabel, setStatsClassLabel] = useState<string | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [stats, setStats] = useState<Estadisticas | null>(null)

  const loadClasses = async () => {
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      let url = `${API_BASE}/admin/clases`
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url)
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      const clases = (data ?? []) as ClaseConProfesor[]
      const clasesVisibles = clases.filter((clase) => isClaseVisibleParaHoyOFuturo(clase.fecha))
      setClasses(clasesVisibles)

      if (clasesVisibles.length === 0) {
        setMessage('No hay clases en el rango seleccionado.')
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadClasses()
  }, [])

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

  const closeStats = () => {
    setStatsClassId(null)
    setStatsClassLabel(null)
    setStats(null)
    setStatsError(null)
  }

  const classCards = useMemo(
    () =>
      classes.map((clase) => (
        <div
          key={clase.id}
          className="bg-white rounded-ks-lg p-5 shadow-[0_10px_30px_rgba(26,58,42,0.10)] border border-ks-gray-border flex flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-base font-semibold text-ks-green-dark leading-tight">
              {clase.tipo ?? 'Sin tipo'}
            </span>
            <span className="flex items-center gap-1 text-xs text-ks-gray-text whitespace-nowrap mt-0.5">
              <CalendarClock className="h-3.5 w-3.5" />
              {formatDate(clase.fecha)} · {formatTime(clase.hora)}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-ks-gray-text">
              Profesor: <span className="text-ks-green-dark font-medium">{getNombreProfesor(clase)}</span>
            </span>
            <span className="text-ks-gray-text">
              Cupo: <span className="text-ks-green-dark font-medium">{clase.cupo ?? 'N/A'}</span>
            </span>
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 bg-ks-green-dark text-white rounded-ks-full p-3 text-sm font-medium hover:opacity-90 transition-opacity"
            onClick={() => void openStats(clase)}
          >
            <BarChart3 className="h-4 w-4" />
            Ver estadísticas
          </button>
        </div>
      )),
    [classes]
  )

  return (
    <main className="page-shell">
      <BackPreviousRouteButton className="mb-4" />

      <section className="bg-ks-off-white rounded-ks-lg p-6 shadow-[0_20px_60px_rgba(26,58,42,0.18)]">
        <h1>Estadísticas de clases</h1>
        <p>Seleccioná una clase para ver la concurrencia histórica de esa actividad.</p>
      </section>

      <section className="bg-ks-off-white rounded-ks-lg p-6 shadow-[0_20px_60px_rgba(26,58,42,0.18)]">
        <div className="field-column">
          <div className="flex items-end gap-4 flex-wrap">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Fecha desde
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                minDate={getMinFecha()}
                placeholder="Fecha desde..."
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Fecha hasta
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                minDate={startDate || getMinFecha()}
                placeholder="Fecha hasta..."
              />
            </label>
          </div>

          <div className="actions-row">
            <button
              className="bg-ks-green-dark text-white rounded-ks-full p-4"
              type="button"
              onClick={() => void loadClasses()}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Visualizar clases'}
            </button>

            {(startDate !== getMinFecha() || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate(getMinFecha())
                  setEndDate('')
                  setClasses([])
                  setMessage(null)
                }}
                className="bg-transparent border border-ks-green-light text-ks-green-light rounded-ks-full p-4 cursor-pointer text-sm"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {error ? <p className="status-badge full">{error}</p> : null}
        {message ? <p className="status-badge success">{message}</p> : null}

        {classes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {classCards}
          </div>
        ) : null}
      </section>

      {statsClassId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeStats}
        >
          <div
            className="bg-ks-off-white rounded-ks-lg p-6 shadow-[0_20px_60px_rgba(26,58,42,0.18)] w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-ks-green-dark">
                  Historial de "{statsClassLabel}"
                </h2>
              </div>
              <button
                type="button"
                onClick={closeStats}
                className="text-ks-gray-text hover:text-ks-green-dark transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {statsLoading ? (
              <p className="text-sm text-ks-gray-text py-8 text-center">Cargando estadísticas...</p>
            ) : null}

            {statsError ? <p className="status-badge full">{statsError}</p> : null}

            {stats && !stats.hayEstadisticas ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Info className="h-8 w-8 text-ks-gray-text" />
                <p className="text-sm text-ks-gray-text max-w-xs">{stats.message}</p>
              </div>
            ) : null}

            {stats && stats.hayEstadisticas ? (
              <div className="flex flex-col gap-5">
                {/* Explicación: qué se está mostrando y por qué */}
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-ks-lg p-3">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Esta clase todavía no sucedió, así que no tiene datos propios. Lo que ves abajo es
                    el historial de las <strong>{stats.totalClasesPrevias} clases anteriores</strong> de
                    tipo <strong>"{stats.tipo}"</strong>, para estimar cuánta gente suele venir.
                  </p>
                </div>

                {/* Números resumen */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-ks-lg p-4 border border-ks-gray-border flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-ks-gray-text text-xs">
                      <Users className="h-3.5 w-3.5" />
                      Promedio de inscriptos
                    </div>
                    <span className="text-2xl font-bold text-ks-green-dark">
                      {stats.promedioInscriptos}
                    </span>
                  </div>

                  <div className="bg-white rounded-ks-lg p-4 border border-ks-gray-border flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-ks-gray-text text-xs">
                      <Percent className="h-3.5 w-3.5" />
                      Ocupación promedio
                    </div>
                    <span className="text-2xl font-bold text-ks-green-dark">
                      {stats.promedioOcupacion !== null ? `${stats.promedioOcupacion}%` : '—'}
                    </span>
                  </div>
                </div>

                {/* Detalle: TODAS las clases previas, con barra de ocupación */}
                <div>
                  <p className="text-xs font-medium text-ks-gray-text uppercase tracking-wide mb-2">
                    Clase por clase
                  </p>
                  <div className="flex flex-col gap-2">
                    {stats.detalle.map((c) => {
                      const esMax = c.id === stats.claseMasConcurrida.id
                      const esMin = c.id === stats.claseMenosConcurrida.id
                      const pct = c.ocupacion ?? 0

                      return (
                        <div
                          key={c.id}
                          className={`rounded-ks-lg p-3 border ${
                            esMax
                              ? 'bg-emerald-50 border-emerald-200'
                              : esMin
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-white border-ks-gray-border'
                          }`}
                        >
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="flex items-center gap-1.5 text-ks-green-dark font-medium">
                              {esMax ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> : null}
                              {esMin ? <TrendingDown className="h-3.5 w-3.5 text-amber-600" /> : null}
                              {formatDate(c.fecha)} · {formatTime(c.hora)}
                            </span>
                            <span className="text-ks-gray-text text-xs">
                              {c.inscriptos}/{c.cupo ?? '—'} inscriptos
                            </span>
                          </div>
                          <div className="w-full h-2 bg-ks-gray-soft rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                esMax ? 'bg-emerald-500' : esMin ? 'bg-amber-500' : 'bg-ks-green-light'
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
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