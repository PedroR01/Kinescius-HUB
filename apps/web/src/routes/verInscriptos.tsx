import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/verInscriptos')({
  component: RouteComponent,
})

const GREEN = "#2DBE7F"
const TEXT = "#0d1f18"
const CARD = "#f0faf5"

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  fontSize: "12px",
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: GREEN,
}

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
  cursor: "pointer",
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

type Clase = {
  id: number
  fecha: string
  hora: string
  tipo: string | null
}

type Inscripto = {
  clienteId: number
  nombre: string | null
  apellido: string | null
  dni: string | null
  mail: string | null
  estado: string | null
}

function formatDate(fecha: string) {
  const [year, month, day] = fecha.split('T')[0].split('-')
  return `${Number(day)}/${Number(month)}/${year}`
}

function formatTime(hora: string) {
  return hora.replace(/:00$/, 'hs')
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
    <div style={{ position: 'relative', marginTop: '6px' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          ...inputStyle,
          marginTop: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          color: value ? TEXT : 'rgba(13,31,24,0.35)',
        }}
      >
        <span>{displayValue || placeholder}</span>
        <span style={{ fontSize: '12px', opacity: 0.5 }}>▼</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
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
                padding: '4px 0', letterSpacing: '0.04em'
              }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isSelected = value === dateStr
              const isDisabled = (!!minDate && dateStr < minDate) || (!!maxDate && dateStr > maxDate)
              const date = new Date(viewYear, viewMonth, day)
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

function RouteComponent() {
  const [clases, setClases] = useState<Clase[]>([])
  const [filteredClases, setFilteredClases] = useState<Clase[]>([])
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null)
  const [inscriptos, setInscriptos] = useState<Inscripto[]>([])
  const [loadingClases, setLoadingClases] = useState(false)
  const [loadingInscriptos, setLoadingInscriptos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    void loadClases()
  }, [])

  useEffect(() => {
    if (!fechaDesde && !fechaHasta) {
      setFilteredClases(clases)
      return
    }
    const filtered = clases.filter(c => {
      const fecha = c.fecha.split('T')[0]
      if (fechaDesde && fecha < fechaDesde) return false
      if (fechaHasta && fecha > fechaHasta) return false
      return true
    })
    setFilteredClases(filtered)
    setSelectedClase(prev => {
      if (!prev) return null
      const fecha = prev.fecha.split('T')[0]
      if (fechaDesde && fecha < fechaDesde) return null
      if (fechaHasta && fecha > fechaHasta) return null
      return prev
    })
    setInscriptos([])
    setError(null)
    setMessage(null)
  }, [fechaDesde, fechaHasta, clases])

  const loadClases = async () => {
    setLoadingClases(true)
    setError(null)
    try {
      const res = await fetch('http://localhost:3000/admin/clases')
      const data = await res.json()
      setClases(data ?? [])
    } catch {
      setError('Error al cargar las clases')
    } finally {
      setLoadingClases(false)
    }
  }

  const loadInscriptos = async (clase: Clase) => {
    if (!clase.tipo) {
      setError('La clase no tiene tipo asignado')
      return
    }
    setLoadingInscriptos(true)
    setError(null)
    setMessage(null)
    setInscriptos([])
    try {
      const res = await fetch(
        `http://localhost:3000/admin/clases/inscriptos?fecha=${clase.fecha}&tipo=${encodeURIComponent(clase.tipo)}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message ?? `Error ${res.status}`)
      const lista = data?.inscriptos ?? []
      setInscriptos(lista)
      setMessage(lista.length === 0 ? 'No hay inscriptos en esta clase.' : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoadingInscriptos(false)
    }
  }

  const clearFiltro = () => {
    setFechaDesde('')
    setFechaHasta('')
  }

  const hayFiltro = fechaDesde || fechaHasta

  return (
    <main style={{ minHeight: "100vh", background: "#ffffff", padding: "40px 24px", boxSizing: "border-box" }}>

      <div style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        background: "rgba(45,190,127,0.1)", border: "1px solid rgba(45,190,127,0.3)",
        borderRadius: "100px", padding: "5px 14px", marginBottom: "24px",
      }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}`, display: "inline-block" }} />
        <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN }}>Admin</span>
      </div>

      <h1 style={{ margin: "0 0 6px", fontSize: "36px", fontWeight: 700, color: TEXT, letterSpacing: "-0.01em" }}>
        Ver <span style={{ color: GREEN, fontStyle: "italic" }}>inscriptos</span>
      </h1>
      <p style={{ margin: "0 0 32px", fontSize: "14px", fontWeight: 300, color: "rgba(13,31,24,0.55)" }}>
        Filtrá por rango de fechas y seleccioná una clase para ver los inscriptos.
      </p>
      <div style={{ width: "36px", height: "2px", background: GREEN, boxShadow: `0 0 10px ${GREEN}88`, marginBottom: "32px" }} />

      <div style={{
        background: CARD, border: "1px solid rgba(45,190,127,0.15)",
        borderRadius: "20px", padding: "28px 24px", maxWidth: "600px",
        display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px"
      }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ ...labelStyle, marginBottom: 0 }}>Filtrar por fecha</span>
            {hayFiltro && (
              <button
                onClick={clearFiltro}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '11px', color: 'rgba(13,31,24,0.4)', letterSpacing: '0.06em',
                  textTransform: 'uppercase', padding: 0,
                }}
              >
                Limpiar ×
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "2px" }}>
            <label style={labelStyle}>
              Desde
              <DatePicker
                value={fechaDesde}
                onChange={(v) => {
                  setFechaDesde(v)
                  if (fechaHasta && v > fechaHasta) setFechaHasta('')
                }}
                placeholder="Cualquier fecha"
                maxDate={fechaHasta || undefined}
              />
            </label>
            <label style={labelStyle}>
              Hasta
              <DatePicker
                value={fechaHasta}
                onChange={setFechaHasta}
                placeholder="Cualquier fecha"
                minDate={fechaDesde || undefined}
              />
            </label>
          </div>
          {hayFiltro && (
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "rgba(13,31,24,0.45)" }}>
              {filteredClases.length} clase{filteredClases.length !== 1 ? 's' : ''} en el rango seleccionado
            </p>
          )}
        </div>

        <div style={{ height: "1px", background: "rgba(45,190,127,0.15)" }} />

        <label style={labelStyle}>
          Clase
          {loadingClases ? (
            <p style={{ fontSize: '12px', color: 'rgba(13,31,24,0.4)', marginTop: '8px', marginBottom: 0 }}>Cargando clases...</p>
          ) : (
            <select
              value={selectedClase?.id ?? ''}
              onChange={(e) => {
                const id = Number(e.target.value)
                const clase = filteredClases.find(c => c.id === id) ?? null
                setSelectedClase(clase)
                setInscriptos([])
                setError(null)
                setMessage(null)
                if (clase) void loadInscriptos(clase)
              }}
              style={inputStyle}
            >
              <option value="">-- Seleccioná una clase --</option>
              {filteredClases.map(clase => (
                <option key={clase.id} value={clase.id}>
                  #{clase.id} — {formatDate(clase.fecha)} {formatTime(clase.hora)} — {clase.tipo ?? 'Sin tipo'}
                </option>
              ))}
            </select>
          )}
        </label>

        {error && (
          <p style={{ margin: 0, padding: "12px 16px", borderRadius: "10px", background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.3)", color: "#ff6b6b", fontSize: "13px" }}>
            ✕ {error}
          </p>
        )}

        {message && (
          <p style={{ margin: 0, padding: "12px 16px", borderRadius: "10px", background: "rgba(45,190,127,0.12)", border: "1px solid rgba(45,190,127,0.3)", color: GREEN, fontSize: "13px" }}>
            {message}
          </p>
        )}
      </div>

      {loadingInscriptos && (
        <p style={{ color: 'rgba(13,31,24,0.4)', fontSize: '14px' }}>Cargando inscriptos...</p>
      )}

      {inscriptos.length > 0 && (
        <>
          <p style={{ fontSize: '13px', color: 'rgba(13,31,24,0.5)', marginBottom: '16px' }}>
            {inscriptos.length} inscripto/s en la clase
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid rgba(45,190,127,0.2)` }}>
                  {['Nombre', 'Apellido', 'DNI', 'Mail', 'Estado'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: GREEN, fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inscriptos.map((inscripto) => (
                  <tr key={inscripto.clienteId} style={{ borderBottom: '1px solid rgba(45,190,127,0.1)' }}>
                    <td style={{ padding: '12px 14px', color: TEXT }}>{inscripto.nombre ?? '-'}</td>
                    <td style={{ padding: '12px 14px', color: TEXT }}>{inscripto.apellido ?? '-'}</td>
                    <td style={{ padding: '12px 14px', color: TEXT }}>{inscripto.dni ?? '-'}</td>
                    <td style={{ padding: '12px 14px', color: TEXT }}>{inscripto.mail ?? '-'}</td>
                    <td style={{ padding: '12px 14px', color: TEXT }}>{inscripto.estado ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}