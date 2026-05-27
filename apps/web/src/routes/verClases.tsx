import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

type Clase = {
  id: number
  fecha: string
  hora: string
  tipo: string | null
  profesor_dni?: string | null
  cupo?: number | null
}

type Inscripto = {
  clienteId: number
  estado: string | null
  nombre: string | null
  apellido: string | null
  dni: string | null
  mail: string | null
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

  if (!trimmed) {
    return null
  }

  if (trimmed.includes('T')) {
    return trimmed.split('T')[0]
  }

  if (trimmed.includes('/')) {
    const [day, month, year] = trimmed.split('/').map((part) => part.trim())

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

  if (!normalizedFecha) {
    return false
  }

  return normalizedFecha >= getMinFecha()
}

export const Route = createFileRoute('/verClases')({
  component: RouteComponent,
})

function RouteComponent() {
  const [classes, setClasses] = useState<Clase[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inscriptosDate, setInscriptosDate] = useState('')
  const [inscriptosTipo, setInscriptosTipo] = useState('')
  const [inscriptosOptions, setInscriptosOptions] = useState<string[]>([])
  const [inscriptos, setInscriptos] = useState<Inscripto[]>([])
  const [inscriptosMessage, setInscriptosMessage] = useState<string | null>(null)
  const [inscriptosError, setInscriptosError] = useState<string | null>(null)
  const [inscriptosLoading, setInscriptosLoading] = useState(false)

  const loadClasses = async () => {
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`http://localhost:3000/clases?startDate=${encodeURIComponent(getMinFecha())}`)
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      const clases = (data ?? []) as Clase[]
      const clasesVisibles = clases.filter((clase) => isClaseVisibleParaHoyOFuturo(clase.fecha))
      setClasses(clasesVisibles)

      if (clasesVisibles.length === 0) {
        setMessage('No hay clases programadas para hoy o para los próximos días.')
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

  const loadInscriptosOptions = async (fecha: string) => {
    setInscriptosTipo('')
    setInscriptos([])
    setInscriptosMessage(null)
    setInscriptosError(null)

    if (!fecha) {
      setInscriptosOptions([])
      return
    }

    try {
      const response = await fetch(`http://localhost:3000/clases?startDate=${encodeURIComponent(fecha)}&endDate=${encodeURIComponent(fecha)}`)
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      const clases = (data ?? []) as Clase[]
      const tipos = [...new Set(clases.map((clase) => clase.tipo).filter((tipo): tipo is string => Boolean(tipo)))]
      setInscriptosOptions(tipos)

      if (tipos.length === 0) {
        setInscriptosMessage('No hay clases en el día ingresado')
      }
    } catch (fetchError) {
      setInscriptosOptions([])
      setInscriptosError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
    }
  }

  const viewInscriptos = async (event: React.FormEvent) => {
    event.preventDefault()
    setInscriptosLoading(true)
    setInscriptosMessage(null)
    setInscriptosError(null)
    setInscriptos([])

    if (!inscriptosDate || !inscriptosTipo) {
      setInscriptosError('Ingrese día y clase para ver los inscriptos.')
      setInscriptosLoading(false)
      return
    }

    try {
      const response = await fetch(`http://localhost:3000/clases/inscriptos?fecha=${encodeURIComponent(inscriptosDate)}&tipo=${encodeURIComponent(inscriptosTipo)}`)
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      const result = data as { message?: string; inscriptos?: Inscripto[] }
      setInscriptos(result.inscriptos ?? [])
      setInscriptosMessage(result.message ?? (result.inscriptos?.length ? null : 'No hay inscriptos en esa clase.'))
    } catch (fetchError) {
      setInscriptosError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
      setInscriptos([])
    } finally {
      setInscriptosLoading(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card" style={{ background: "#f0faf5" }}>
        <h1>Ver clases</h1>
        <p>Consultá las clases programadas para hoy o fechas futuras y revisá los inscriptos por día y clase.</p>
      </section>

      <section className="form-card" style={{ background: "#f0faf5" }}>
        <div className="field-column">
          <h2>Ver inscriptos</h2>
          <div className="field-row">
            <label>
              Día
              <input
                type="date"
                value={inscriptosDate}
                onChange={(event) => {
                  const nextDate = event.target.value
                  setInscriptosDate(nextDate)
                  void loadInscriptosOptions(nextDate)
                }}
              />
            </label>
            <label>
              Clase
              <select
                value={inscriptosTipo}
                onChange={(event) => setInscriptosTipo(event.target.value)}
                disabled={inscriptosOptions.length === 0}
              >
                <option value="">Seleccionar...</option>
                {inscriptosOptions.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="actions-row">
            <button
              className="button button-primary"
              type="button"
              onClick={viewInscriptos}
              disabled={inscriptosLoading}
              style={{ background: "#2DBE7F", color: "#0d1f18" }}
            >
              {inscriptosLoading ? 'Cargando...' : 'Ver inscriptos'}
            </button>
          </div>
        </div>

        {inscriptosError ? <p className="status-badge full">{inscriptosError}</p> : null}
        {inscriptosMessage ? <p className="status-badge success">{inscriptosMessage}</p> : null}

        {inscriptos.length > 0 ? (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Cliente ID</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>DNI</th>
                  <th>Mail</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {inscriptos.map((inscripto) => (
                  <tr key={`${inscripto.clienteId}-${inscripto.dni || inscripto.mail}`}>
                    <td>{inscripto.clienteId}</td>
                    <td>{inscripto.nombre ?? 'N/A'}</td>
                    <td>{inscripto.apellido ?? 'N/A'}</td>
                    <td>{inscripto.dni ?? 'N/A'}</td>
                    <td>{inscripto.mail ?? 'N/A'}</td>
                    <td>{inscripto.estado ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="form-card" style={{ background: "#f0faf5" }}>
        <div className="actions-row">
          <button
            className="button button-primary"
            type="button"
            onClick={() => void loadClasses()}
            disabled={loading}
            style={{ background: "#2DBE7F", color: "#0d1f18" }}
          >
            {loading ? 'Cargando...' : 'Actualizar clases'}
          </button>
        </div>

        {error ? <p className="status-badge full">{error}</p> : null}
        {message ? <p className="status-badge success">{message}</p> : null}

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
                </tr>
              </thead>
              <tbody>
                {classes.map((clase) => (
                  <tr key={clase.id}>
                    <td>{clase.id}</td>
                    <td>{clase.fecha}</td>
                    <td>{clase.hora}</td>
                    <td>{clase.tipo ?? 'Sin tipo'}</td>
                    <td>{clase.profesor_dni ?? 'Sin profesor'}</td>
                    <td>{clase.cupo ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  )
}
