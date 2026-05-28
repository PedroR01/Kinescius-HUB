import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

type Clase = {
  id: number
  fecha: string
  hora: string
  tipo: string | null
  profesor_dni?: string | null
  cupo?: number | null
}

function formatDate(fecha: string) {
  const date = new Date(fecha)

  if (Number.isNaN(date.getTime())) {
    return fecha
  }

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function formatTime(hora: string) {
  return hora.replace(/:00$/, 'hs')
}

function getMinFecha() {
  const today = new Date()

  today.setHours(0, 0, 0, 0)

  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function normalizeFecha(fecha: string) {
  const trimmed = fecha.trim()

  if (!trimmed) return null

  if (trimmed.includes('T')) {
    return trimmed.split('T')[0]
  }

  if (trimmed.includes('/')) {

    const [day, month, year] = trimmed
      .split('/')
      .map((part) => part.trim())

    if (day && month && year) {

      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  return null
}

function isClaseVisibleParaHoyOFuturo(fecha: string) {

  const normalizedFecha = normalizeFecha(fecha)

  if (!normalizedFecha) return false

  return normalizedFecha >= getMinFecha()
}

function isWeekend(dateString: string) {

  if (!dateString) return false

  const date = new Date(dateString)

  const day = date.getDay()

  return day === 0 || day === 6
}

export const Route = createFileRoute('/cancelarClase')({
  component: RouteComponent,
})

function RouteComponent() {

  const [classes, setClasses] = useState<Clase[]>([])
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

      let url = 'http://localhost:3000/admin/clases'

      const params = new URLSearchParams()

      if (startDate) {
        params.append('startDate', startDate)
      }

      if (endDate) {
        params.append('endDate', endDate)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)

      const data =
        await response.json().catch(() => null)

      if (!response.ok) {

        throw new Error(
          data?.message ?? `Error ${response.status}`
        )

      }

      const clases = (data ?? []) as Clase[]

      const clasesVisibles =
        clases.filter((clase) =>
          isClaseVisibleParaHoyOFuturo(clase.fecha)
        )

      setClasses(clasesVisibles)

      if (clasesVisibles.length === 0) {

        setMessage(
          'No hay clases en el rango seleccionado.'
        )

      }

    } catch (fetchError) {

      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Error desconocido'
      )

      setClasses([])

    } finally {

      setLoading(false)

    }
  }

  useEffect(() => {
    void loadClasses()
  }, [])

  const cancelClass = async (id: number) => {

    const confirmed = window.confirm(
      `¿Confirmás la cancelación de la clase ${id}?`
    )

    if (!confirmed) return

    setCancelingId(id)
    setError(null)
    setMessage(null)

    try {

      const response = await fetch(
        `http://localhost:3000/admin/clases/${id}/cancelar`,
        {
          method: 'PATCH',
        }
      )

      const data =
        await response.json().catch(() => null)

      if (!response.ok) {

        throw new Error(
          data?.message ?? `Error ${response.status}`
        )

      }

      setClasses((currentClasses) =>
        currentClasses.filter(
          (clase) => clase.id !== id
        )
      )

      setMessage(
        data?.message
          ?? `Clase ${id} cancelada correctamente`
      )

    } catch (fetchError) {

      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Error desconocido'
      )

    } finally {

      setCancelingId(null)

    }
  }

  const classRows = useMemo(
    () =>

      classes.map((clase) => (

        <tr key={clase.id}>

          <td>{clase.id}</td>

          <td>{formatDate(clase.fecha)}</td>

          <td>{formatTime(clase.hora)}</td>

          <td>{clase.tipo ?? 'Sin tipo'}</td>

          <td>{clase.profesor_dni ?? 'Sin profesor'}</td>

          <td>{clase.cupo ?? 'N/A'}</td>

          <td>

            <button
              type="button"
              className="button button-secondary"
              onClick={() => cancelClass(clase.id)}
              disabled={cancelingId === clase.id}
              style={{
                background: "#f0faf5",
                border:
                  "1px solid rgba(45,190,127,0.25)",
                color: "#0d1f18"
              }}
            >
              {cancelingId === clase.id
                ? 'Cancelando...'
                : 'Cancelar'}
            </button>

          </td>

        </tr>

      )),

    [classes, cancelingId]
  )

  return (

    <main className="page-shell">

      <section
        className="hero-card"
        style={{ background: "#f0faf5" }}
      >

        <h1>Cancelar clase</h1>

        <p>
          Seleccioná una clase programada
          para cancelarla.
        </p>

      </section>

      <section
        className="form-card"
        style={{ background: "#f0faf5" }}
      >

        <div className="field-column">

          <div className="field-row">

            <label>
              Fecha desde

              <input
                type="date"
                value={startDate}
                min={getMinFecha()}
                onChange={(e) => {

                  const value = e.target.value

                  if (isWeekend(value)) {

                    setError(
                      'No se pueden seleccionar sábados ni domingos.'
                    )

                    return
                  }

                  setError(null)

                  setStartDate(value)

                }}
              />
            </label>

            <label>
              Fecha hasta

              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => {

                  const value = e.target.value

                  if (isWeekend(value)) {

                    setError(
                      'No se pueden seleccionar sábados ni domingos.'
                    )

                    return
                  }

                  setError(null)

                  setEndDate(value)

                }}
              />
            </label>

          </div>

          <div className="actions-row">

            <button
              className="button button-primary"
              type="button"
              onClick={() => void loadClasses()}
              disabled={loading}
              style={{
                background: "#2DBE7F",
                color: "#0d1f18"
              }}
            >
              {loading
                ? 'Cargando...'
                : 'Visualizar clases'}
            </button>

            {(startDate || endDate) && (

              <button
                type="button"
                onClick={() => {

                  setStartDate(getMinFecha())
                  setEndDate('')
                  setClasses([])
                  setMessage(null)

                }}
                style={{
                  background: "transparent",
                  border:
                    "1px solid rgba(45,190,127,0.4)",
                  color: "#2DBE7F",
                  borderRadius: "100px",
                  padding: "8px 18px",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                Limpiar filtros
              </button>

            )}

          </div>

        </div>

        {error ? (
          <p className="status-badge full">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="status-badge success">
            {message}
          </p>
        ) : null}

        {classes.length > 0 ? (

          <div className="table-card">

            <table>

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Actividad</th>
                  <th>Profesor DNI</th>
                  <th>Cupo</th>
                  <th>Acción</th>
                </tr>

              </thead>

              <tbody>
                {classRows}
              </tbody>

            </table>

          </div>

        ) : null}

      </section>

    </main>
  )
}