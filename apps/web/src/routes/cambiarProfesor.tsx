import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { API_BASE } from '@/lib/constants'

type Clase = {
  id: number
  fecha: string
  hora: string
  tipo: string | null
  profesor_nombre?: string | null
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

// ── DatePicker ────────────────────────────────────────────────────────────────

const GREEN = '#2DBE7F'
const TEXT = '#0d1f18'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const dpTriggerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(45,190,127,0.35)',
  background: '#ffffff',
  color: TEXT,
  fontSize: '14px',
  cursor: 'pointer',
  userSelect: 'none',
  minWidth: '200px',
  marginTop: '6px',
}

function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha...',
  minDate,
  maxDate,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minDate?: string
  maxDate?: string
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [open, setOpen] = useState(false)

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const handleDay = (day: number) => {
    const date = new Date(viewYear, viewMonth, day)
    const dow = date.getDay()
    if (dow === 0 || dow === 6) return // block weekends
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    if (minDate && dateStr < minDate) return
    if (maxDate && dateStr > maxDate) return
    onChange(dateStr)
    setOpen(false)
  }

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)} style={{ ...dpTriggerStyle, color: value ? TEXT : 'rgba(13,31,24,0.35)' }}>
        <span>{displayValue || placeholder}</span>
        <span style={{ fontSize: '11px', opacity: 0.5, marginLeft: '8px' }}>▼</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
          background: '#fff', border: '1px solid rgba(45,190,127,0.3)',
          borderRadius: '14px', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', width: '280px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: GREEN, padding: '4px 8px' }}>‹</button>
            <span style={{ fontWeight: 600, fontSize: '14px', color: TEXT }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: GREEN, padding: '4px 8px' }}>›</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {DAYS.map(d => (
              <div key={d} style={{
                textAlign: 'center', fontSize: '10px', fontWeight: 600,
                color: d === 'Dom' || d === 'Sáb' ? 'rgba(13,31,24,0.25)' : 'rgba(13,31,24,0.45)',
                padding: '4px 0', letterSpacing: '0.04em',
              }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />
              const date = new Date(viewYear, viewMonth, day)
              const dow = date.getDay()
              const isWeekend = dow === 0 || dow === 6
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isSelected = value === dateStr
              const isDisabled = isWeekend || (!!minDate && dateStr < minDate) || (!!maxDate && dateStr > maxDate)
              const isToday = date.getTime() === today.getTime()
              return (
                <div
                  key={day}
                  onClick={() => handleDay(day)}
                  style={{
                    textAlign: 'center', padding: '6px 2px', borderRadius: '8px', fontSize: '13px',
                    cursor: isDisabled ? 'default' : 'pointer',
                    fontWeight: isSelected ? 700 : 400,
                    background: isSelected ? GREEN : isToday ? 'rgba(45,190,127,0.1)' : 'transparent',
                    color: isSelected ? '#fff' : isDisabled ? 'rgba(13,31,24,0.2)' : TEXT,
                    border: isToday && !isSelected ? `1px solid ${GREEN}` : '1px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isDisabled) (e.currentTarget.style.background = isSelected ? GREEN : 'rgba(45,190,127,0.12)') }}
                  onMouseLeave={e => { if (!isDisabled) (e.currentTarget.style.background = isSelected ? GREEN : isToday ? 'rgba(45,190,127,0.1)' : 'transparent') }}
                >
                  {day}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── RouteComponent ────────────────────────────────────────────────────────────

function RouteComponent() {
  const navigate = useNavigate()
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
  const [hasBuscado, setHasBuscado] = useState(false)

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

      const res = await fetch(`${API_BASE}/admin/clases?${params.toString()}`)
      const data = await res.json()
      setClases(data ?? [])
      setHasBuscado(true)
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
        `${API_BASE}/admin/clases/profesores/disponibles?${params.toString()}`
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
      `¿Confirmás el cambio de profesor para la clase del ${formatDate(selectedClase.fecha)} a las ${formatTime(selectedClase.hora)}?`
    )
    if (!confirmed) return

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(
        `${API_BASE}/admin/clases/${selectedClase.id}/cambiar-profesor`,
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

        {message && (
          <div style={{ marginBottom: '16px' }}>
            <p className="status-badge success">{message}</p>
            <button
              type="button"
              onClick={() => void navigate({ to: '/verClases' })}
              style={{
                marginTop: '10px',
                background: 'transparent',
                border: '1px solid rgba(45,190,127,0.4)',
                color: '#2DBE7F',
                borderRadius: '100px',
                padding: '8px 18px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Ver clases →
            </button>
          </div>
        )}

        <div className="field-row" style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', fontWeight: 500 }}>
            Fecha
            <DatePicker
              value={fecha}
              onChange={(v) => {
                setFecha(v)
                setHasBuscado(false)
                setClases([])
                setSelectedClase(null)
                setProfesores([])
              }}
              minDate={getHoy()}
              placeholder="Seleccionar fecha..."
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
                setHasBuscado(false)
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

        {loading && <p>Cargando...</p>}

        {!loading && hasBuscado && clases.length === 0 && (
          <p className="status-badge full">
            No hay clases programadas para el día seleccionado.
          </p>
        )}

        {!loading && hasBuscado && clases.length > 0 && (
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
                    {formatTime(clase.hora)} — {clase.tipo ?? 'Sin tipo'} —{' '}
                    {clase.profesor_nombre ?? 'Sin profesor'}
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