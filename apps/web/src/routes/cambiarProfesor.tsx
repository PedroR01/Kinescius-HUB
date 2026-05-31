import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

type Clase = {
  id: number
  fecha: string
  hora: string
  tipo: string | null
  profesor_dni?: string | null
}

type Profesor = {
  id: number
  nombre: string | null
  apellido: string | null
  dni: string | null
}

function formatDate(fecha: string) {
  const [year, month, day] = fecha.split('T')[0].split('-')
  return `${Number(day)}/${Number(month)}/${year}`
}

function formatTime(hora: string) {
  return hora.replace(/:00$/, 'hs')
}

function getHoy() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const Route = createFileRoute('/cambiarProfesor')({
  component: RouteComponent,
})

function RouteComponent() {
  const [clases, setClases] = useState<Clase[]>([])
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null)
  const [selectedProfesorId, setSelectedProfesorId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProfesores, setLoadingProfesores] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fecha, setFecha] = useState(getHoy())

  useEffect(() => {
    void loadClases()
  }, [])

  const loadClases = async () => {
    setLoading(true)
    setError(null)
    setSelectedClase(null)
    setSelectedProfesorId(null)
    setProfesores([])
    try {
      const params = new URLSearchParams()
      if (fecha) params.append('startDate', fecha)
      if (fecha) params.append('endDate', fecha)

      const res = await fetch(`http://localhost:3000/admin/clases?${params.toString()}`)
      const data = await res.json()
      setClases(data ?? [])
    } catch {
      setError('Error al cargar las clases')
    } finally {
      setLoading(false)
    }
  }

  const loadProfesoresDisponibles = async (clase: Clase) => {
    setLoadingProfesores(true)
    setProfesores([])
    setSelectedProfesorId(null)
    try {
      const fechaClase = clase.fecha.split('T')[0]
      const params = new URLSearchParams({ fecha: fechaClase, hora: clase.hora })
      const res = await fetch(
        `http://localhost:3000/admin/clases/profesores/disponibles?${params.toString()}`
      )
      const data = await res.json()
      setProfesores(data?.profesores ?? [])
    } catch {
      setError('Error al cargar los profesores disponibles')
    } finally {
      setLoadingProfesores(false)
    }
  }

  const handleClaseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value)
    const clase = clases.find((c) => c.id === id) ?? null
    setSelectedClase(clase)
    setMessage(null)
    setError(null)
    if (clase) void loadProfesoresDisponibles(clase)
  }

  const handleCambiar = async () => {
    if (!selectedClase || !selectedProfesorId) return

    const confirmed = window.confirm(
      `¿Confirmás el cambio de profesor para la clase ${selectedClase.id}?`
    )
    if (!confirmed) return

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(
        `http://localhost:3000/admin/clases/${selectedClase.id}/cambiar-profesor`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profesorId: selectedProfesorId }),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      setMessage(data?.message ?? 'Profesor actualizado correctamente')
      setSelectedClase(null)
      setSelectedProfesorId(null)
      setProfesores([])
      void loadClases()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const selectStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(45,190,127,0.35)',
    background: '#fff',
    marginTop: '6px',
  }

  return (
    <main className="page-shell">
      <section className="hero-card" style={{ background: '#f0faf5' }}>
        <h1>Cambiar profesor</h1>
        <p>Seleccioná una clase y asigná un nuevo profesor.</p>
      </section>

      <section className="form-card" style={{ background: '#f0faf5' }}>
        {error && <p className="status-badge full">{error}</p>}
        {message && <p className="status-badge success">{message}</p>}

        <div className="field-row" style={{ marginBottom: '16px' }}>
          <label>
            Fecha
            <input
              type="date"
              value={fecha}
              min={getHoy()}
              onChange={e => setFecha(e.target.value)}
              style={{ ...selectStyle, cursor: 'pointer' }}
            />
          </label>
        </div>

        <div className="actions-row" style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className="button button-primary"
            onClick={() => void loadClases()}
            disabled={loading}
            style={{ background: '#2DBE7F', color: '#0d1f18' }}
          >
            {loading ? 'Cargando...' : 'Buscar clases'}
          </button>
          {fecha !== getHoy() && (
            <button
              type="button"
              onClick={() => {
                setFecha(getHoy())
                setClases([])
                setSelectedClase(null)
                setProfesores([])
              }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(45,190,127,0.4)',
                color: '#2DBE7F',
                borderRadius: '100px',
                padding: '8px 18px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="field-column">
            <label>
              Clase
              <select
                value={selectedClase?.id ?? ''}
                onChange={handleClaseSelect}
                style={selectStyle}
              >
                <option value="">-- Seleccioná una clase --</option>
                {clases.map((clase) => (
                  <option key={clase.id} value={clase.id}>
                    #{clase.id} — {formatDate(clase.fecha)} {formatTime(clase.hora)} — {clase.tipo ?? 'Sin tipo'}
                  </option>
                ))}
              </select>
            </label>

            {selectedClase && (
              <label>
                Nuevo profesor
                {loadingProfesores ? (
                  <p style={{ marginTop: '8px', color: '#2DBE7F', fontSize: '14px' }}>
                    Cargando profesores disponibles...
                  </p>
                ) : (
                  <select
                    value={selectedProfesorId ?? ''}
                    onChange={(e) => setSelectedProfesorId(Number(e.target.value))}
                    style={selectStyle}
                  >
                    <option value="">
                      {profesores.length === 0
                        ? '— Sin profesores disponibles para este horario —'
                        : '-- Seleccioná un profesor --'}
                    </option>
                    {profesores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.apellido} — DNI {p.dni}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            )}

            {selectedClase && selectedProfesorId && (
              <div className="actions-row">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={handleCambiar}
                  disabled={saving}
                  style={{ background: '#2DBE7F', color: '#0d1f18' }}
                >
                  {saving ? 'Guardando...' : 'Confirmar cambio'}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}