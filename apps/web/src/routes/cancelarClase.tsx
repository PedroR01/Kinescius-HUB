import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { API_BASE } from '@/lib/constants'
import { BackPreviousRouteButton } from '@/components/BackPreviousRouteButton'

type Clase = {
  id: number
  fecha: string
  hora: string
  tipo: string | null
  profesor_nombre?: string | null
  cupo?: number | null
}

function formatDate(fecha: string) {
  const [year, month, day] = fecha.split('T')[0].split('-')
  return `${Number(day)}/${Number(month)}/${year}`
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
  if (trimmed.includes('T')) return trimmed.split('T')[0]
  if (trimmed.includes('/')) {
    const [day, month, year] = trimmed.split('/').map((part) => part.trim())
    if (day && month && year) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  return null
}

function isClaseVisibleParaHoyOFuturo(fecha: string) {
  const normalizedFecha = normalizeFecha(fecha)
  if (!normalizedFecha) return false
  return normalizedFecha >= getMinFecha()
}

export const Route = createFileRoute('/cancelarClase')({
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
  minWidth: '160px',
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

      const clases = (data ?? []) as Clase[]
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
          <td>{clase.profesor_nombre ?? 'Sin profesor'}</td>
          <td>{clase.cupo ?? 'N/A'}</td>
          <td>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => cancelClass(clase.id)}
              disabled={cancelingId === clase.id}
              style={{
                background: '#f0faf5',
                border: '1px solid rgba(45,190,127,0.25)',
                color: '#0d1f18',
              }}
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
      <section className="hero-card" style={{ background: '#f0faf5' }}>
        <h1>Cancelar clase</h1>
        <p>Seleccioná una clase programada para cancelarla.</p>
      </section>

      <section className="form-card" style={{ background: '#f0faf5' }}>
        <div className="field-column">
          <div className="field-row" style={{ alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 500 }}>
              Fecha desde
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                minDate={getMinFecha()}
                placeholder="Fecha desde..."
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 500 }}>
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
              className="button button-primary"
              type="button"
              onClick={() => void loadClasses()}
              disabled={loading}
              style={{ background: '#2DBE7F', color: '#0d1f18' }}
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
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {error ? <p className="status-badge full">{error}</p> : null}
        {message ? <p className="status-badge success">{message}</p> : null}

        {classes.length > 0 ? (
          <div className="table-card">
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