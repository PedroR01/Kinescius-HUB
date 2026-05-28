import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/verClases')({
  component: RouteComponent,
})

type Clase = {
  id: number
  fecha: string
  hora: string
  tipo: string | null
  profesor_dni?: string | null
  cupo?: number | null
}

const GREEN = "#2DBE7F"
const TEXT = "#0d1f18"
const CARD = "#f0faf5"

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(45,190,127,0.25)",
  background: "#ffffff",
  color: TEXT,
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  marginTop: "6px",
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  fontSize: "12px",
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: GREEN,
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function DatePicker({
  value,
  onChange
}: {
  value: string
  onChange: (v: string) => void
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
    if (dow === 0 || dow === 6) return
    if (date < today) return
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
    setOpen(false)
  }

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('es-AR', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : ''

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={{ position: 'relative', marginTop: '6px' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          ...inputStyle,
          marginTop: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          color: value ? TEXT : 'rgba(13,31,24,0.35)',
        }}
      >
        <span>{displayValue || 'Seleccionar fecha...'}</span>
        <span style={{ fontSize: '12px', opacity: 0.5 }}>▼</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
          background: '#fff', border: '1px solid rgba(45,190,127,0.3)',
          borderRadius: '14px', padding: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)', width: '280px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: GREEN, padding: '4px 8px' }}>‹</button>
            <span style={{ fontWeight: 600, fontSize: '14px', color: TEXT }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: GREEN, padding: '4px 8px' }}>›</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {DAYS.map(d => (
              <div key={d} style={{
                textAlign: 'center', fontSize: '10px', fontWeight: 600, padding: '4px 0', letterSpacing: '0.04em',
                color: d === 'Dom' || d === 'Sáb' ? 'rgba(13,31,24,0.25)' : 'rgba(13,31,24,0.45)',
              }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />
              const date = new Date(viewYear, viewMonth, day)
              const dow = date.getDay()
              const isWeekend = dow === 0 || dow === 6
              const isPast = date < today
              const isSelected = value === `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = date.getTime() === today.getTime()
              const disabled = isWeekend || isPast
              return (
                <div key={day} onClick={() => handleDay(day)} style={{
                  textAlign: 'center', padding: '6px 2px', borderRadius: '8px', fontSize: '13px',
                  cursor: disabled ? 'default' : 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  background: isSelected ? GREEN : isToday ? 'rgba(45,190,127,0.1)' : 'transparent',
                  color: isSelected ? '#fff' : disabled ? 'rgba(13,31,24,0.2)' : TEXT,
                  border: isToday && !isSelected ? `1px solid ${GREEN}` : '1px solid transparent',
                }}>{day}</div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(fecha: string) {
  const date = new Date(fecha)
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function formatTime(hora: string) {
  return hora.replace(/:00$/, 'hs')
}

function RouteComponent() {
  const [classes, setClasses] = useState<Clase[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadClasses = async () => {
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      let url = 'http://localhost:3000/admin/clases'
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url)
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      setClasses((data ?? []) as Clase[])

      if ((data ?? []).length === 0) {
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

  const classRows = useMemo(
    () => classes.map(clase => (
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
    <main style={{ minHeight: "100vh", background: "#ffffff", padding: "40px 24px" }}>
      <h1 style={{ color: TEXT, marginBottom: '24px' }}>Ver clases</h1>

      <div style={{ background: CARD, borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <label style={labelStyle}>
            Fecha desde
            <DatePicker value={startDate} onChange={setStartDate} />
          </label>
          <label style={labelStyle}>
            Fecha hasta
            <DatePicker value={endDate} onChange={setEndDate} />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => void loadClasses()}
            disabled={loading}
            style={{
              background: GREEN, color: TEXT, border: 'none',
              borderRadius: '12px', padding: '12px 18px',
              cursor: 'pointer', fontWeight: 700
            }}
          >
            {loading ? 'Cargando...' : 'Visualizar clases'}
          </button>

          <button
            type="button"
            onClick={() => { setStartDate(''); setEndDate(''); setClasses([]); setMessage(null); setError(null) }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(45,190,127,0.3)',
              color: GREEN, borderRadius: '12px',
              padding: '12px 18px', cursor: 'pointer', fontWeight: 600
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {error && <p style={{ color: '#ff4d4f', marginBottom: '16px' }}>{error}</p>}
      {message && <p style={{ color: GREEN, marginBottom: '16px' }}>{message}</p>}

      {classes.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
      )}
    </main>
  )
}