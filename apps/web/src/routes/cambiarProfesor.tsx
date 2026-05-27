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
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return fecha
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function formatTime(hora: string) {
  return hora.replace(/:00$/, 'hs')
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
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [clasesRes, profesoresRes] = await Promise.all([
        fetch('http://localhost:3000/admin/clases'),
        fetch('http://localhost:3000/admin/clases/profesores'),
      ])

      const clasesData = await clasesRes.json()
      const profesoresData = await profesoresRes.json()

      setClases(clasesData ?? [])
      setProfesores(profesoresData?.profesores ?? [])
    } catch {
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
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
      void loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
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

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="field-column">

            {/* Selector de clase */}
            <label>
              Clase
              <select
                value={selectedClase?.id ?? ''}
                onChange={(e) => {
                  const id = Number(e.target.value)
                  const clase = clases.find((c) => c.id === id) ?? null
                  setSelectedClase(clase)
                  setSelectedProfesorId(null)
                  setMessage(null)
                  setError(null)
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(45,190,127,0.35)',
                  background: '#fff',
                  marginTop: '6px',
                }}
              >
                <option value="">-- Seleccioná una clase --</option>
                {clases.map((clase) => (
                  <option key={clase.id} value={clase.id}>
                    #{clase.id} — {formatDate(clase.fecha)} {formatTime(clase.hora)} — {clase.tipo ?? 'Sin tipo'}
                  </option>
                ))}
              </select>
            </label>

            {/* Selector de profesor */}
            {selectedClase && (
              <label>
                Nuevo profesor
                <select
                  value={selectedProfesorId ?? ''}
                  onChange={(e) => setSelectedProfesorId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(45,190,127,0.35)',
                    background: '#fff',
                    marginTop: '6px',
                  }}
                >
                  <option value="">-- Seleccioná un profesor --</option>
                  {profesores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellido} — DNI {p.dni}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Botón confirmar */}
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