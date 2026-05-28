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

function RouteComponent() {
  const [clases, setClases] = useState<Clase[]>([])
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null)
  const [inscriptos, setInscriptos] = useState<Inscripto[]>([])
  const [loadingClases, setLoadingClases] = useState(false)
  const [loadingInscriptos, setLoadingInscriptos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadClases()
  }, [])

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
        Seleccioná una clase para ver los inscriptos.
      </p>
      <div style={{ width: "36px", height: "2px", background: GREEN, boxShadow: `0 0 10px ${GREEN}88`, marginBottom: "32px" }} />

      <div style={{
        background: CARD, border: "1px solid rgba(45,190,127,0.15)",
        borderRadius: "20px", padding: "28px 24px", maxWidth: "600px",
        display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px"
      }}>
        <label style={labelStyle}>
          Clase
          {loadingClases ? (
            <p style={{ fontSize: '12px', color: 'rgba(13,31,24,0.4)', marginTop: '8px', marginBottom: 0 }}>Cargando clases...</p>
          ) : (
            <select
              value={selectedClase?.id ?? ''}
              onChange={(e) => {
                const id = Number(e.target.value)
                const clase = clases.find(c => c.id === id) ?? null
                setSelectedClase(clase)
                setInscriptos([])
                setError(null)
                setMessage(null)
                if (clase) void loadInscriptos(clase)
              }}
              style={inputStyle}
            >
              <option value="">-- Seleccioná una clase --</option>
              {clases.map(clase => (
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
                  <th style={{ textAlign: 'left', padding: '10px 14px', color: GREEN, fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nombre</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', color: GREEN, fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Apellido</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', color: GREEN, fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>DNI</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', color: GREEN, fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mail</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', color: GREEN, fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Estado</th>
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