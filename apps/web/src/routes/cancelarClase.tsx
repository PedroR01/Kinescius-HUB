import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
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

export const Route = createFileRoute('/cancelarClase')({
  component: RouteComponent,
})

function RouteComponent() {
  const [classes, setClasses] = useState<KinesciusClass[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<number | null>(null)
  const [startDate, setStartDate] = useState(getMinFecha())
  const [endDate, setEndDate] = useState('')

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

      const clases = (data ?? []) as KinesciusClass[]
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

  const cancelClass = async (id: number) => {
    const confirmed = window.confirm(`¿Confirmás la cancelación de la clase?`)
    if (!confirmed) return

    setCancelingId(id)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(
        `${API_BASE}/admin/clases/${id}/cancelar`,
        { method: 'PATCH' }
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      setClasses((currentClasses) => currentClasses.filter((clase) => clase.id !== id))
      setMessage(data?.message ?? `Clase cancelada correctamente`)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
    } finally {
      setCancelingId(null)
    }
  }

  const classRows = useMemo(
    () =>
      classes.map((clase) => (
        <tr key={clase.id}>
          <td>{formatDate(clase.fecha)}</td>
          <td>{formatTime(clase.hora)}</td>
          <td>{clase.tipo ?? 'Sin tipo'}</td>
          <td>{clase.profesor ?? 'Sin profesor'}</td>
          <td>{clase.cupo ?? 'N/A'}</td>
          <td>
            <button
              type="button"
              className="bg-ks-gray-soft text-ks-gray-text border border-ks-gray-border rounded-ks-full p-4"
              onClick={() => cancelClass(clase.id)}
              disabled={cancelingId === clase.id}
            >
              {cancelingId === clase.id ? 'Cancelando...' : 'Cancelar'}
            </button>
          </td>
        </tr>
      )),
    [classes, cancelingId]
  )

  return (
    <main className="page-shell">
      <BackPreviousRouteButton className="mb-4" />
      <section className="bg-ks-off-white rounded-ks-lg p-6 shadow-[0_20px_60px_rgba(26,58,42,0.18)]">
        <h1>Cancelar clase</h1>
        <p>Seleccioná una clase programada para cancelarla.</p>
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
          <div className="bg-ks-off-white rounded-ks-lg p-6 shadow-[0_20px_60px_rgba(26,58,42,0.18)]">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Actividad</th>
                  <th>Profesor</th>
                  <th>Cupo</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>{classRows}</tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  )
}