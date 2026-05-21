import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/crearClase')({
  component: RouteComponent,
})

const GREEN = "#2DBE7F"

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(45,190,127,0.25)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
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
  color: "rgba(45,190,127,0.8)",
}

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

    try {
      const response = await fetch('http://localhost:3000/clases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, hora, tipo, profesorDni, cupo: parseInt(cupo) })
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
      background: "#0d1f18",
      padding: "40px 24px",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* destellos */}
      <div style={{
        position: "absolute", top: "-80px", right: "-80px",
        width: "300px", height: "300px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,190,127,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* badge */}
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

      {/* título */}
      <h1 style={{
        margin: "0 0 6px",
        fontSize: "36px", fontWeight: 700,
        color: "#ffffff", letterSpacing: "-0.01em",
      }}>
        Crear <span style={{ color: GREEN, fontStyle: "italic" }}>clase</span>
      </h1>
      <p style={{ margin: "0 0 32px", fontSize: "14px", fontWeight: 300, color: "rgba(255,255,255,0.35)" }}>
        Completá los datos y presioná Crear clase.
      </p>

      {/* línea */}
      <div style={{ width: "36px", height: "2px", background: GREEN, boxShadow: `0 0 10px ${GREEN}88`, marginBottom: "32px" }} />

      {/* formulario */}
      <div style={{
        background: "rgba(45,190,127,0.05)",
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
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required style={inputStyle} />
        </label>

        <label style={labelStyle}>
          Hora
          <input type="time" value={hora} onChange={e => setHora(e.target.value)} required style={inputStyle} />
        </label>

        <label style={labelStyle}>
          Tipo de clase
          <select value={tipo} onChange={e => setTipo(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="" style={{ background: "#0d1f18" }}>Seleccionar...</option>
            <option value="zona media" style={{ background: "#0d1f18" }}>Zona Media</option>
            <option value="zona superior" style={{ background: "#0d1f18" }}>Zona Superior</option>
            <option value="zona inferior" style={{ background: "#0d1f18" }}>Zona Inferior</option>
          </select>
        </label>

        <label style={labelStyle}>
          DNI Profesor
          <input value={profesorDni} onChange={e => setProfesorDni(e.target.value)} placeholder="44657889" style={inputStyle} />
        </label>

        <label style={labelStyle}>
          Cupo
          <input type="number" value={cupo} onChange={e => setCupo(e.target.value)} min="1" required style={inputStyle} />
        </label>

        <button
          type="submit"
          disabled={loading}
          onClick={handleSubmit}
          style={{
            marginTop: "4px",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            background: loading ? "rgba(45,190,127,0.4)" : GREEN,
            color: "#0d1f18",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "opacity 0.2s",
          }}
        >
          {loading ? 'Creando...' : 'Crear clase'}
        </button>

        {message && (
          <p style={{
            margin: 0, padding: "12px 16px", borderRadius: "10px",
            background: "rgba(45,190,127,0.12)", border: "1px solid rgba(45,190,127,0.3)",
            color: GREEN, fontSize: "13px",
          }}>
            ✓ {message}
          </p>
        )}

        {error && (
          <p style={{
            margin: 0, padding: "12px 16px", borderRadius: "10px",
            background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.3)",
            color: "#ff6b6b", fontSize: "13px",
          }}>
            ✕ {error}
          </p>
        )}
      </div>
    </main>
  )
}