import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

type Clase = {
  id: number
  tipo: string | null
  fecha: string
  hora: string
  cupo: number | null
}

type CountResponse = {
  claseId: number
  count: number
}

type Persona = {
  nombre: string
  apellido: string
  dni: string
  email: string
}

type ModalData =
  | { type: 'single'; clase: Clase; claseIndex: number; count: number; personas: Persona[] }
  | { type: 'all'; results: { claseId: number; tipo: string | null; index: number; count: number }[] }

export const Route = createFileRoute('/listaEspera')({
  component: () => <RouteComponent />,
})

function formatFecha(fecha: string) {
  const [year, month, day] = fecha.split('T')[0].split('-').map(Number)
  return `${day}/${month}/${year}`
}

function formatHora(hora: string) {
  const [hh, mm] = hora.split(':')
  return `${hh}:${mm}hs`
}

function RouteComponent() {
  const [clases, setClases] = useState<Clase[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [modal, setModal] = useState<ModalData | null>(null)

  const apiBase = 'http://localhost:3000'

  useEffect(() => {
    const fetchClases = async () => {
      try {
        const res = await fetch(`${apiBase}/clases`)
        if (!res.ok) throw new Error(`Error al cargar clases: ${res.status}`)
        const data = (await res.json()) as Clase[]
        setClases(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    void fetchClases()
  }, [])

  const handleViewWaitList = async (clase: Clase, index: number) => {
    setActionLoading(true)
    try {
      const [countRes, personasRes] = await Promise.all([
        fetch(`${apiBase}/listaEspera/clase/${clase.id}/count`),
        fetch(`${apiBase}/listaEspera/clase/${clase.id}`),
      ])
      if (!countRes.ok) throw new Error('Error al consultar lista de espera')
      if (!personasRes.ok) throw new Error('Error al consultar personas')
      const countData = (await countRes.json()) as CountResponse
      const personas = (await personasRes.json()) as Persona[]
      setModal({ type: 'single', clase, claseIndex: index + 1, count: countData.count, personas })
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleViewAll = async () => {
    setActionLoading(true)
    try {
      const results = await Promise.all(
        clases.map(async (clase, idx) => {
          try {
            const res = await fetch(`${apiBase}/listaEspera/clase/${clase.id}/count`)
            if (!res.ok) return null
            const data = (await res.json()) as CountResponse
            return data.count > 0
              ? { claseId: clase.id, tipo: clase.tipo, index: idx + 1, count: data.count }
              : null
          } catch { return null }
        })
      )
      const filtered = results.filter(Boolean) as { claseId: number; tipo: string | null; index: number; count: number }[]
      setModal({ type: 'all', results: filtered })
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <h1>Lista de espera</h1>
        <p>Consultá quién está esperando por clase en el centro Kinescius.</p>
      </section>

      {!loading && !error && clases.length > 0 && (
        <section className="form-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--gray-text)' }}>
            {clases.length} clase{clases.length !== 1 ? 's' : ''} encontrada{clases.length !== 1 ? 's' : ''}
          </p>
          <button className="button button-primary" type="button" onClick={handleViewAll} disabled={actionLoading}>
            {actionLoading ? 'Cargando...' : 'Ver todas las listas de espera'}
          </button>
        </section>
      )}

      {loading && (
        <section className="message-card">
          <p>Cargando clases...</p>
        </section>
      )}

      {error && (
        <section className="message-card" style={{ borderColor: 'rgba(192,57,43,0.3)', background: 'var(--red-soft)' }}>
          <p style={{ color: 'var(--red)' }}>{error}</p>
        </section>
      )}

      {!loading && !error && (
        <section className="form-card">
          <p className="section-label">CLASES</p>
          <div style={{ display: 'grid', gap: 12 }}>
            {clases.map((clase, idx) => (
              <div key={clase.id} className="clase-row">
                <div>
                  <p className="clase-row-title">Clase {idx + 1} — {clase.tipo ?? 'Sin tipo'}</p>
                  <p className="clase-row-sub">{formatFecha(clase.fecha)} · {formatHora(clase.hora)}</p>
                </div>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => handleViewWaitList(clase, idx)}
                  disabled={actionLoading}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Ver lista de espera
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>

            {modal.type === 'single' && (
              <>
                <div className="modal-header">
                  <div>
                    <h2 className="modal-title">Clase {modal.claseIndex} — {modal.clase.tipo ?? 'Sin tipo'}</h2>
                    <p className="modal-sub">{formatFecha(modal.clase.fecha)} · {formatHora(modal.clase.hora)}</p>
                  </div>
                  <button className="modal-close" onClick={() => setModal(null)} aria-label="Cerrar">✕</button>
                </div>
                <div className="cupo-badge disponible-badge" style={{ marginBottom: 16 }}>
                  {modal.count > 0 ? `${modal.count} persona${modal.count !== 1 ? 's' : ''} en espera` : 'Sin lista de espera'}
                </div>
                {modal.personas.length > 0 ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {modal.personas.map((p, i) => (
                      <div key={i} className="persona-card">
                        <p className="persona-name">{p.nombre} {p.apellido}</p>
                        <p className="persona-detail">DNI: {p.dni}</p>
                        <p className="persona-detail">{p.email}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 14, color: 'var(--gray-text)' }}>No hay personas en la lista de espera.</p>
                )}
              </>
            )}

            {modal.type === 'all' && (
              <>
                <div className="modal-header">
                  <h2 className="modal-title">Todas las listas de espera</h2>
                  <button className="modal-close" onClick={() => setModal(null)} aria-label="Cerrar">✕</button>
                </div>
                {modal.results.length === 0 ? (
                  <p style={{ fontSize: 14, color: 'var(--gray-text)' }}>No hay listas de espera activas.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {modal.results.map(r => (
                      <div key={r.claseId} className="persona-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p className="persona-name">Clase {r.index} — {r.tipo ?? 'Sin tipo'}</p>
                        <span className="cupo-badge solo-badge">{r.count} en espera</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <button className="button button-primary" type="button" onClick={() => setModal(null)} style={{ marginTop: 20, width: '100%' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}