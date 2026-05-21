import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

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

function formatDate(fecha: string) {
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return fecha
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function formatTime(hora: string) {
  return hora.replace(/:00$/, 'hs')
}

export const Route = createFileRoute('/verClases')({
  component: RouteComponent,
})

function RouteComponent() {
  const [classes, setClasses] = useState<Clase[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inscriptosDate, setInscriptosDate] = useState('')
  const [inscriptosTipo, setInscriptosTipo] = useState('')
  const [inscriptos, setInscriptos] = useState<Inscripto[]>([])
  const [inscriptosMessage, setInscriptosMessage] = useState<string | null>(null)
  const [inscriptosError, setInscriptosError] = useState<string | null>(null)
  const [inscriptosLoading, setInscriptosLoading] = useState(false)

  const viewClasses = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const url = new URL('http://localhost:3000/clases')

      if (startDate) url.searchParams.append('startDate', startDate)
      if (endDate) url.searchParams.append('endDate', endDate)

      const response = await fetch(url.toString())
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      const clases = (data ?? []) as Clase[]
      setClasses(clases)

      if (clases.length === 0) {
        setMessage(startDate || endDate ? 'No hay clases registradas en dicha fecha.' : 'No hay clases cargadas')
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const viewInscriptos = async (event: React.FormEvent) => {
    event.preventDefault()
    setInscriptosLoading(true)
    setInscriptosMessage(null)
    setInscriptosError(null)
    setInscriptos([])

    if (!inscriptosDate || !inscriptosTipo) {
      setInscriptosError('Ingrese fecha y clase para ver los inscriptos.')
      setInscriptosLoading(false)
      return
    }

    try {
      const url = new URL('http://localhost:3000/clases/inscriptos')
      url.searchParams.append('fecha', inscriptosDate)
      url.searchParams.append('tipo', inscriptosTipo)

      const response = await fetch(url.toString())
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
        </tr>
      )),
    [classes]
  )

  return (
    <main className="page-shell">
      <section className="hero-card">
        <h1>Ver clases (Admin)</h1>
        <p>Visualice todas las clases o filtre por rango de fechas.</p>
      </section>

      <section className="form-card">
        <form className="field-column" onSubmit={viewClasses}>
          <div className="field-row">
            <label>
              Fecha inicio
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label>
              Fecha fin
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>

          <div className="actions-row">
            <button className="button button-primary" type="submit" disabled={loading}>
              {loading ? 'Cargando...' : 'Visualizar clases'}
            </button>
            <Link to="/crearClase" className="button button-secondary">
              Crear clase
            </Link>
            <Link to="/solicitarTurno" className="button button-secondary">
              Solicitar turno
            </Link>
          </div>
        </form>

        <form className="field-column" onSubmit={viewInscriptos}>
          <h2>Ver inscriptos</h2>
          <div className="field-row">
            <label>
              Fecha
              <input
                type="date"
                value={inscriptosDate}
                onChange={(event) => setInscriptosDate(event.target.value)}
              />
            </label>
            <label>
              Clase
              <input
                type="text"
                value={inscriptosTipo}
                onChange={(event) => setInscriptosTipo(event.target.value)}
                placeholder="Ej: clase 1"
              />
            </label>
          </div>

          <div className="actions-row">
            <button className="button button-primary" type="submit" disabled={inscriptosLoading}>
              {inscriptosLoading ? 'Cargando...' : 'Ver inscriptos'}
            </button>
          </div>
        </form>

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
              <tbody>{classRows}</tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  )
}
