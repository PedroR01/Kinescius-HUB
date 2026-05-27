import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/crearClase')({
  component: RouteComponent,
})

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
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function DatePicker({ value, onChange }: { value: string, onChange: (v: string) => void }) {
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
    ? new Date(value + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
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
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 100,
          background: '#fff',
          border: '1px solid rgba(45,190,127,0.3)',
          borderRadius: '14px',
          padding: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
          width: '280px',
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
                padding: '4px 0', letterSpacing: '0.04em'
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
                <div
                  key={day}
                  onClick={() => handleDay(day)}
                  style={{
                    textAlign: 'center',
                    padding: '6px 2px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: disabled ? 'default' : 'pointer',
                    fontWeight: isSelected ? 700 : 400,
                    background: isSelected ? GREEN : isToday ? 'rgba(45,190,127,0.1)' : 'transparent',
                    color: isSelected ? '#fff' : disabled ? 'rgba(13,31,24,0.2)' : TEXT,
                    border: isToday && !isSelected ? `1px solid ${GREEN}` : '1px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!disabled) (e.currentTarget.style.background = isSelected ? GREEN : 'rgba(45,190,127,0.12)') }}
                  onMouseLeave={e => { if (!disabled) (e.currentTarget.style.background = isSelected ? GREEN : isToday ? 'rgba(45,190,127,0.1)' : 'transparent') }}
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

const horasDisponibles = Array.from({ length: 12 }, (_, index) => {
  const hour = index + 8
  return `${String(hour).padStart(2, '0')}:00`
})

const cuposDisponibles = Array.from({ length: 50 }, (_, index) => index + 1)

function RouteComponent() {
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('15:00')
  const [tipo, setTipo] = useState('')
  const [profesorDni, setProfesorDni] = useState('')
  const [cupo, setCupo] = useState('10')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    const [hour] = hora.split(':').map(Number)
    if (Number.isNaN(hour) || hour < 8 || hour > 19) {
      setError('La hora debe estar entre 08:00 y 19:00')
      setLoading(false)
      return
    }

    const parsedCupo = Number.parseInt(cupo, 10)
    if (Number.isNaN(parsedCupo) || parsedCupo < 1 || parsedCupo > 50) {
      setError('El cupo debe estar entre 1 y 50')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:3000/admin/clases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, hora, tipo, profesorDni, cupo: parsedCupo })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data?.message ?? data?.error ?? 'Error desconocido')
      } else {
        setMessage(data?.message ?? 'Clase creada correctamente')
        setFecha('')
        setHora('15:00')
        setTipo('')
        setProfesorDni('')
        setCupo('10')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#ffffff",
      padding: "40px 24px",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "-80px", right: "-80px",
        width: "300px", height: "300px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,190,127,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        background: "rgba(45,190,127,0.1)",
        border: "1px solid rgba(45,190,127,0.3)",
        borderRadius: "100px", padding: "5px 14px",
        marginBottom: "24px",
      }}>
        <span style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: GREEN, boxShadow: `0 0 8px ${GREEN}`,
          display: "inline-block",
        }} />
        <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN }}>
          Admin
        </span>
      </div>

      <h1 style={{ margin: "0 0 6px", fontSize: "36px", fontWeight: 700, color: TEXT, letterSpacing: "-0.01em" }}>
        Crear <span style={{ color: GREEN, fontStyle: "italic" }}>clase</span>
      </h1>
      <p style={{ margin: "0 0 32px", fontSize: "14px", fontWeight: 300, color: "rgba(13,31,24,0.55)" }}>
        Completá los datos y presioná Crear clase.
      </p>

      <div style={{ width: "36px", height: "2px", background: GREEN, boxShadow: `0 0 10px ${GREEN}88`, marginBottom: "32px" }} />

      <div style={{
        background: CARD,
        border: "1px solid rgba(45,190,127,0.15)",
        borderRadius: "20px",
        padding: "28px 24px",
        maxWidth: "480px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}>
        <label style={labelStyle}>
          Fecha
          <DatePicker value={fecha} onChange={setFecha} />
        </label>

        <label style={labelStyle}>
          Hora
          <select value={hora} onChange={e => setHora(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">Seleccionar...</option>
            {horasDisponibles.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </label>

        <label style={labelStyle}>
          Tipo de clase
          <select value={tipo} onChange={e => setTipo(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">Seleccionar...</option>
            <option value="zona media">Zona Media</option>
            <option value="zona superior">Zona Superior</option>
            <option value="zona inferior">Zona Inferior</option>
          </select>
        </label>

        <label style={labelStyle}>
          DNI Profesor
          <input value={profesorDni} onChange={e => setProfesorDni(e.target.value)} placeholder="44657889" style={inputStyle} />
        </label>

        <label style={labelStyle}>
          Cupo
          <select value={cupo} onChange={e => setCupo(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">Seleccionar...</option>
            {cuposDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          onClick={handleSubmit}
          style={{
            marginTop: "4px", padding: "12px", borderRadius: "12px", border: "none",
            background: loading ? "rgba(45,190,127,0.4)" : GREEN,
            color: TEXT, fontSize: "14px", fontWeight: 700, letterSpacing: "0.04em",
            cursor: loading ? "not-allowed" : "pointer", transition: "opacity 0.2s",
          }}
        >
          {loading ? 'Creando...' : 'Crear clase'}
        </button>

        {message && (
          <p style={{ margin: 0, padding: "12px 16px", borderRadius: "10px", background: "rgba(45,190,127,0.12)", border: "1px solid rgba(45,190,127,0.3)", color: GREEN, fontSize: "13px" }}>
            ✓ {message}
          </p>
        )}
        {error && (
          <p style={{ margin: 0, padding: "12px 16px", borderRadius: "10px", background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.3)", color: "#ff6b6b", fontSize: "13px" }}>
            ✕ {error}
          </p>
        )}
      </div>
    </main>
  )
}