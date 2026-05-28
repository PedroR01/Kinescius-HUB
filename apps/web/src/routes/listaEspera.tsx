import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

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

const btnBase =
  'font-outfit inline-block cursor-pointer rounded-full border-none px-7 py-[13px] text-[15px] font-semibold tracking-[0.2px] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:transform-none'

const btnPrimary =
  'bg-[linear-gradient(135deg,var(--ks-green-mid)_0%,var(--ks-green-light)_100%)] text-white shadow-[0_4px_16px_rgba(45,106,79,0.35)] hover:shadow-[0_8px_24px_rgba(45,106,79,0.45)]'

const btnSecondary =
  'border border-[rgba(82,183,136,0.3)] bg-ks-gray-soft text-ks-green-dark'

const formCardClass =
  'rounded-ks-lg border border-[rgba(82,183,136,0.18)] bg-white p-7 shadow-[0_8px_32px_rgba(26,58,42,0.12)] animate-ks-slide-up max-sm:p-5'

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
          } catch {
            return null
          }
        }),
      )
      const filtered = results.filter(Boolean) as {
        claseId: number
        tipo: string | null
        index: number
        count: number
      }[]
      setModal({ type: 'all', results: filtered })
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <main
      className={cn(
        'mx-auto grid min-h-svh max-w-[760px] gap-4 px-6 pt-10 pb-16 font-dm-sans text-ks-gray-text antialiased',
        'bg-[radial-gradient(ellipse_80%_50%_at_10%_0%,rgba(82,183,136,0.12)_0%,transparent_60%),radial-gradient(ellipse_60%_40%_at_90%_100%,rgba(183,224,85,0.1)_0%,transparent_55%),var(--ks-off-white)]',
        'max-sm:px-4 max-sm:pt-5 max-sm:pb-12',
      )}
    >
      <section
        className={cn(
          'ks-hero-card relative overflow-hidden rounded-ks-lg px-10 py-12 shadow-[0_20px_60px_rgba(26,58,42,0.18)] animate-ks-slide-up',
          'bg-[linear-gradient(135deg,var(--ks-green-dark)_0%,var(--ks-green-mid)_60%,var(--ks-green-light)_100%)]',
          'max-sm:px-6 max-sm:py-8',
        )}
      >
        <h1 className="relative m-0 mb-2 font-outfit text-[38px] font-bold tracking-[-1px] text-white max-sm:text-[28px]">
          Lista de espera
        </h1>
        <p className="relative text-[15px] font-light text-white/72">
          Consultá quién está esperando por clase en el centro Kinescius.
        </p>
      </section>

      {!loading && !error && clases.length > 0 && (
        <section className={cn(formCardClass, 'flex flex-wrap items-center justify-between gap-3')}>
          <p className="m-0 text-sm text-ks-gray-text">
            {clases.length} clase{clases.length !== 1 ? 's' : ''} encontrada
            {clases.length !== 1 ? 's' : ''}
          </p>
          <button
            className={cn(btnBase, btnPrimary)}
            type="button"
            onClick={handleViewAll}
            disabled={actionLoading}
          >
            {actionLoading ? 'Cargando...' : 'Ver todas las listas de espera'}
          </button>
        </section>
      )}

      {loading && (
        <section
          className={cn(
            'animate-ks-slide-up rounded-ks-md border border-[rgba(82,183,136,0.25)] px-5 py-4',
            'bg-[linear-gradient(135deg,rgba(82,183,136,0.08),rgba(183,224,85,0.08))]',
          )}
        >
          <p className="text-sm leading-relaxed font-medium text-ks-green-dark">Cargando clases...</p>
        </section>
      )}

      {error && (
        <section className="animate-ks-slide-up rounded-ks-md border border-[rgba(192,57,43,0.3)] bg-ks-red-soft px-5 py-4">
          <p className="text-sm leading-relaxed font-medium text-ks-red">{error}</p>
        </section>
      )}

      {!loading && !error && (
        <section className={formCardClass}>
          <p className="mb-4 font-outfit text-[11px] font-bold tracking-[1.5px] text-ks-gray-text">CLASES</p>
          <div className="grid gap-3">
            {clases.map((clase, idx) => (
              <div
                key={clase.id}
                className="flex items-center justify-between gap-4 rounded-ks-md border-[1.5px] border-ks-gray-soft bg-ks-off-white p-4 transition-colors duration-150 hover:border-[rgba(82,183,136,0.4)]"
              >
                <div>
                  <p className="m-0 mb-1 font-outfit text-[15px] font-semibold text-ks-text-dark">
                    Clase {idx + 1} — {clase.tipo ?? 'Sin tipo'}
                  </p>
                  <p className="m-0 text-[13px] text-ks-gray-text">
                    {formatFecha(clase.fecha)} · {formatHora(clase.hora)}
                  </p>
                </div>
                <button
                  className={cn(btnBase, btnSecondary, 'whitespace-nowrap')}
                  type="button"
                  onClick={() => handleViewWaitList(clase, idx)}
                  disabled={actionLoading}
                >
                  Ver lista de espera
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-[1000] flex animate-ks-fade-in items-center justify-center bg-[rgba(15,36,25,0.45)] p-6"
          onClick={() => setModal(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-[520px] overflow-y-auto rounded-ks-lg bg-white p-7 shadow-[0_20px_60px_rgba(26,58,42,0.18)] animate-ks-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {modal.type === 'single' && (
              <>
                <div className="mb-4 flex items-start justify-between gap-4 border-b-[1.5px] border-ks-gray-soft pb-4">
                  <div>
                    <h2 className="m-0 mb-1 font-outfit text-lg font-bold text-ks-text-dark">
                      Clase {modal.claseIndex} — {modal.clase.tipo ?? 'Sin tipo'}
                    </h2>
                    <p className="m-0 text-[13px] text-ks-gray-text">
                      {formatFecha(modal.clase.fecha)} · {formatHora(modal.clase.hora)}
                    </p>
                  </div>
                  <button
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-ks-full border-none bg-ks-gray-soft text-sm text-ks-gray-text transition-colors duration-150 hover:bg-ks-green-pale hover:text-ks-green-dark"
                    onClick={() => setModal(null)}
                    aria-label="Cerrar"
                  >
                    ✕
                  </button>
                </div>
                <span className="mb-4 inline-flex w-fit items-center gap-[5px] rounded-ks-full bg-ks-green-pale px-2.5 py-1 font-outfit text-xs font-semibold text-ks-green-mid">
                  {modal.count > 0
                    ? `${modal.count} persona${modal.count !== 1 ? 's' : ''} en espera`
                    : 'Sin lista de espera'}
                </span>
                {modal.personas.length > 0 ? (
                  <div className="grid gap-2.5">
                    {modal.personas.map((p, i) => (
                      <div
                        key={i}
                        className="rounded-ks-md border-[1.5px] border-ks-gray-soft bg-ks-off-white px-4 py-3.5"
                      >
                        <p className="m-0 mb-1 font-outfit text-[15px] font-semibold text-ks-text-dark">
                          {p.nombre} {p.apellido}
                        </p>
                        <p className="m-0 mt-0.5 text-[13px] text-ks-gray-text">DNI: {p.dni}</p>
                        <p className="m-0 mt-0.5 text-[13px] text-ks-gray-text">{p.email}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ks-gray-text">No hay personas en la lista de espera.</p>
                )}
              </>
            )}

            {modal.type === 'all' && (
              <>
                <div className="mb-4 flex items-start justify-between gap-4 border-b-[1.5px] border-ks-gray-soft pb-4">
                  <h2 className="m-0 font-outfit text-lg font-bold text-ks-text-dark">
                    Todas las listas de espera
                  </h2>
                  <button
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-ks-full border-none bg-ks-gray-soft text-sm text-ks-gray-text transition-colors duration-150 hover:bg-ks-green-pale hover:text-ks-green-dark"
                    onClick={() => setModal(null)}
                    aria-label="Cerrar"
                  >
                    ✕
                  </button>
                </div>
                {modal.results.length === 0 ? (
                  <p className="text-sm text-ks-gray-text">No hay listas de espera activas.</p>
                ) : (
                  <div className="grid gap-2.5">
                    {modal.results.map((r) => (
                      <div
                        key={r.claseId}
                        className="flex items-center justify-between rounded-ks-md border-[1.5px] border-ks-gray-soft bg-ks-off-white px-4 py-3.5"
                      >
                        <p className="m-0 font-outfit text-[15px] font-semibold text-ks-text-dark">
                          Clase {r.index} — {r.tipo ?? 'Sin tipo'}
                        </p>
                        <span className="inline-flex w-fit items-center gap-[5px] rounded-ks-full bg-[rgba(255,180,0,0.15)] px-2.5 py-1 font-outfit text-xs font-semibold text-[#a67c00]">
                          {r.count} en espera
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <button
              className={cn(btnBase, btnPrimary, 'mt-5 w-full')}
              type="button"
              onClick={() => setModal(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
