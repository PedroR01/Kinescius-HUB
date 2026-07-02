import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { API_BASE } from '@/lib/constants'
import { BackPreviousRouteButton } from '@/components/BackPreviousRouteButton'

export const Route = createFileRoute('/eliminarProfesor')({
  component: RouteComponent,
})

const GREEN = "#2DBE7F"
const RED = "#ff6b6b"
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

type Profesor = {
  id: number
  nombre: string | null
  apellido: string | null
  dni: string | null
}

function RouteComponent() {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [loadingProfesores, setLoadingProfesores] = useState(false)
  const [profesorId, setProfesorId] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadProfesores = async () => {
    setLoadingProfesores(true)
    try {
      const res = await fetch(`${API_BASE}/admin/clases/profesores/activos`)
      const data = await res.json()
      setProfesores(data?.profesores ?? [])
    } catch {
      setProfesores([])
    } finally {
      setLoadingProfesores(false)
    }
  }

  useEffect(() => {
    void loadProfesores()
  }, [])

  const profesorSeleccionado = profesores.find(p => String(p.id) === profesorId)

  const isFormValid = profesorId !== ''

  const handleEliminarClick = () => {
    if (!isFormValid) return
    setMessage(null)
    setError(null)
    setConfirmando(true)
  }

  const handleConfirmar = async () => {
    if (!isFormValid) return
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(
        `${API_BASE}/admin/clases/profesores/${profesorId}/eliminar`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data?.message ?? data?.error ?? 'Error desconocido')
      } else {
        setMessage(data?.message ?? 'Profesor dado de baja correctamente')
        setProfesorId('')
        void loadProfesores()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red')
    } finally {
      setLoading(false)
      setConfirmando(false)
    }
  }

  const handleCancelar = () => {
    setConfirmando(false)
  }

  const isButtonDisabled = loading || !isFormValid

  return (
    <main style={{
      minHeight: "100vh", background: "#ffffff", padding: "40px 24px",
      boxSizing: "border-box", position: "relative", overflow: "hidden",
    }}>
      <BackPreviousRouteButton className="relative z-10 mb-6" />
      <div style={{
        position: "absolute", top: "-80px", right: "-80px",
        width: "300px", height: "300px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,190,127,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        background: "rgba(45,190,127,0.1)", border: "1px solid rgba(45,190,127,0.3)",
        borderRadius: "100px", padding: "5px 14px", marginBottom: "24px",
      }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}`, display: "inline-block" }} />
        <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN }}>Admin</span>
      </div>

      <h1 style={{ margin: "0 0 6px", fontSize: "36px", fontWeight: 700, color: TEXT, letterSpacing: "-0.01em" }}>
        Eliminar <span style={{ color: GREEN, fontStyle: "italic" }}>profesor</span>
      </h1>
      <p style={{ margin: "0 0 32px", fontSize: "14px", fontWeight: 300, color: "rgba(13,31,24,0.55)" }}>
        Seleccioná un profesor y presioná Eliminar profesor. La baja es lógica: el registro no se borra, solo se desactiva.
      </p>
      <div style={{ width: "36px", height: "2px", background: GREEN, boxShadow: `0 0 10px ${GREEN}88`, marginBottom: "32px" }} />

      <div style={{
        background: CARD, border: "1px solid rgba(45,190,127,0.15)",
        borderRadius: "20px", padding: "28px 24px", maxWidth: "480px",
        display: "flex", flexDirection: "column", gap: "20px",
      }}>
        <label style={labelStyle}>
          Profesor
          {loadingProfesores ? (
            <p style={{ fontSize: '12px', color: 'rgba(13,31,24,0.4)', marginTop: '8px', marginBottom: 0 }}>
              Cargando profesores...
            </p>
          ) : profesores.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'rgba(13,31,24,0.4)', marginTop: '8px', marginBottom: 0 }}>
              No hay profesores activos.
            </p>
          ) : (
            <select
              value={profesorId}
              onChange={e => { setProfesorId(e.target.value); setConfirmando(false); setMessage(null); setError(null) }}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">-- Seleccioná un profesor --</option>
              {profesores.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido} — DNI {p.dni}
                </option>
              ))}
            </select>
          )}
        </label>

        {!confirmando ? (
          <button
            type="button"
            disabled={isButtonDisabled}
            onClick={handleEliminarClick}
            title={!isFormValid ? 'Seleccioná un profesor para continuar' : undefined}
            style={{
              marginTop: "4px", padding: "12px", borderRadius: "12px", border: "none",
              background: isButtonDisabled ? "rgba(255,107,107,0.35)" : RED,
              color: isButtonDisabled ? "rgba(13,31,24,0.4)" : "#ffffff",
              fontSize: "14px", fontWeight: 700, letterSpacing: "0.04em",
              cursor: isButtonDisabled ? "not-allowed" : "pointer",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            Eliminar profesor
          </button>
        ) : (
          <div style={{
            padding: "16px", borderRadius: "12px",
            background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.3)",
            display: "flex", flexDirection: "column", gap: "12px",
          }}>
            <p style={{ margin: 0, fontSize: "13px", color: TEXT }}>
              ¿Confirmás dar de baja a{' '}
              <strong>{profesorSeleccionado?.nombre} {profesorSeleccionado?.apellido}</strong>
              {' '}(DNI {profesorSeleccionado?.dni})?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmar}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px", border: "none",
                  background: loading ? "rgba(255,107,107,0.4)" : RED,
                  color: "#ffffff", fontSize: "13px", fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? 'Eliminando...' : 'Confirmar baja'}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleCancelar}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px",
                  border: "1px solid rgba(13,31,24,0.2)", background: "#ffffff",
                  color: TEXT, fontSize: "13px", fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

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