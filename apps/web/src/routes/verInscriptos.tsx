import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { API_BASE } from '@/lib/constants'
import { BackPreviousRouteButton } from '@/components/BackPreviousRouteButton'
import DatePicker from '@/components/DatePicker'
import type { KinesciusClass } from '@/lib/class-interface'
import type { User } from '@/lib/user-interface'
import { formatClassLabel } from '@/lib/utils'

export const Route = createFileRoute('/verInscriptos')({
  component: RouteComponent,
})

function RouteComponent() {
  const [clases, setClases] = useState<KinesciusClass[]>([])
  const [filteredClases, setFilteredClases] = useState<KinesciusClass[]>([])
  const [selectedClase, setSelectedClase] = useState<KinesciusClass | null>(null)
  const [inscriptos, setInscriptos] = useState<User[]>([])
  const [loadingClases, setLoadingClases] = useState(false)
  const [loadingInscriptos, setLoadingInscriptos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [fechaFiltro, setFechaFiltro] = useState('')

  useEffect(() => {
    void loadClases()
  }, [])

  useEffect(() => {
    if (!fechaFiltro) {
      setFilteredClases(clases)
      return
    }
    const filtered = clases.filter(c => c.fecha.split('T')[0] === fechaFiltro)
    setFilteredClases(filtered)
    setSelectedClase(prev => {
      if (!prev) return null
      if (prev.fecha.split('T')[0] !== fechaFiltro) return null
      return prev
    })
    setInscriptos([])
    setError(null)
    setMessage(null)
  }, [fechaFiltro, clases])

  const loadClases = async () => {
    setLoadingClases(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/admin/clases`)
      const data = await res.json()
      setClases(data ?? [])
    } catch {
      setError('Error al cargar las clases')
    } finally {
      setLoadingClases(false)
    }
  }

  const loadInscriptos = async (clase: KinesciusClass) => {
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
        `${API_BASE}/admin/clases/inscriptos?fecha=${clase.fecha}&tipo=${encodeURIComponent(clase.tipo)}`
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
    setFechaFiltro('')
  }

  return (
    <main className='min-h-screen bg-white p-10 box-border'>
      <BackPreviousRouteButton className="mb-6" />

      <div className='inline-flex items-center gap-2 bg-emerald-50/10 border border-(--green) rounded-full p-2.5 mb-6'>
        <span className='w-2 h-2 rounded-full bg-(--green) shadow-[0_0_8px_var(--green)] inline-block' />
        <span className='text-xs font-medium tracking-wide uppercase text-(--green)'>Admin</span>
      </div>

      <h1 className='m-0 mb-1.5 text-3xl font-bold tracking-tight text-(--text-style)'>
        Ver <span className='font-italic text-(--green)'>inscriptos</span>
      </h1>
      <p className='m-0 mb-12 text-sm font-light text-gray-500'>
        Filtrá por día y seleccioná una clase para ver los inscriptos.
      </p>
      <div className='w-9 h-1 bg-(--green) shadow-[0_0_10px_var(--green)88] mb-12' />

      <div className='bg-(--card-style) border border-emerald-150 rounded-2xl p-7 max-w-600 flex flex-col gap-5 mb-12'>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="label mb-0">Filtrar por día</span>
            {fechaFiltro && (
              <button
                onClick={clearFiltro}
                className="bg-transparent border-none cursor-pointer text-xs text-gray-400 tracking-wide uppercase px-0"
              >
                Limpiar ×
              </button>
            )}
          </div>
          <DatePicker
            value={fechaFiltro}
            onChange={setFechaFiltro}
            placeholder="Cualquier fecha"
          />
          {fechaFiltro && (
            <p className="text-xs text-gray-500 mt-1">
              {filteredClases.length} clase{filteredClases.length !== 1 ? 's' : ''} en el día seleccionado
            </p>
          )}
        </div>

        <div className='h-px bg-emerald-150' />

        <label className="label">
          Clase
          {loadingClases ? (
            <p className='text-xs text-gray-400 mt-2 mb-0'>Cargando clases...</p>
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
            className='input'
            >
              <option value="">-- Seleccioná una clase --</option>
              {filteredClases.map(clase => (
                <option key={clase.id} value={clase.id}>
                  {formatClassLabel(clase)}
                </option>
              ))}
            </select>
          )}
        </label>

        {error && (
          <p className='m-0 p-3 rounded-lg bg-red-50/10 border border-red-300 text-red-500 text-sm'>
            ✕ {error}
          </p>
        )}

        {message && (
          <p className='m-0 p-3 rounded-lg bg-emerald-50/10 border border-emerald-300 text-emerald-500 text-sm'>
            {message}
          </p>
        )}
      </div>

      {loadingInscriptos && (
        <p className='text-gray-400 text-sm'>Cargando inscriptos...</p>
      )}

      {inscriptos.length > 0 && (
        <>
          <p className='text-sm text-gray-500 mb-4'>
            {inscriptos.length} inscripto/s en la clase
          </p>
          <div className='overflow-x-auto'>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr className='border-b border-emerald-200'>
                  {['Nombre', 'Apellido', 'DNI', 'Mail', 'Estado'].map(h => (
                    <th key={h} className='text-left p-2.5 text-(--green) font-semibold text-xs tracking-wide uppercase'>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inscriptos.map((inscripto) => (
                  <tr key={inscripto.id} className='border-b border-emerald-100'>
                    <td className='p-2.5 text-(--text-style)'>{inscripto.nombre ?? '-'}</td>
                    <td className='p-2.5 text-(--text-style)'>{inscripto.apellido ?? '-'}</td>
                    <td className='p-2.5 text-(--text-style)'>{inscripto.dni ?? '-'}</td>
                    <td className='p-2.5 text-(--text-style)'>{inscripto.mail ?? '-'}</td>
                    <td className='p-2.5 text-(--text-style)'>{inscripto.estado ?? '-'}</td>
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