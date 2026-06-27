import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { API_BASE } from '@/lib/constants'
import { BackPreviousRouteButton } from '@/components/BackPreviousRouteButton'
import DatePicker from '@/components/DatePicker'
import type { KinesciusClass } from '@/lib/class-interface'
import type { User } from '@/lib/user-interface'
import { formatClassLabel, formatDate, formatTime } from '@/lib/utils'

export const Route = createFileRoute('/verClases')({
  component: RouteComponent,
})

type Mode = 'todas' | 'filtrar'

function RouteComponent() {
  const [mode, setMode] = useState<Mode>('todas')
  const [classes, setClasses] = useState<KinesciusClass[]>([])
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadClasses = async (overrideMode?: Mode) => {
    const currentMode = overrideMode ?? mode
    setLoading(true)
    setHasLoaded(false)
    setError(null)

    try {
      let url = `${API_BASE}/admin/clases`
      if (currentMode === 'filtrar') {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        if (params.toString()) url += `?${params.toString()}`
      }

      const response = await fetch(url)
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      setClasses((data ?? []) as KinesciusClass[])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
      setClasses([])
    } finally {
      setLoading(false)
      setHasLoaded(true)
    }
  }

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    setStartDate('')
    setEndDate('')
    setClasses([])
    setHasLoaded(false)
    setError(null)
  }

  const classRows = useMemo(
    () => classes.map(clase => (
      <tr key={clase.id}>
        <td>{formatDate(clase.fecha)}</td>
        <td>{formatTime(clase.hora)}</td>
        <td>{clase.tipo ?? 'Sin tipo'}</td>
        <td>{clase.profesor ?? 'Sin profesor'}</td>
        <td>{clase.cupo ?? 'N/A'}</td>
      </tr>
    )),
    [classes]
  )

  return (
    <main className='min-h-screen bg-white p-10 box-border'>
      <BackPreviousRouteButton className="mb-6" />
      <h1 className='text-(--text-style) mb-6'>Ver clases</h1>

      <div className='bg-(--card-style) rounded-2xl p-6 mb-6'>
        <div className='inline-flex bg-emerald-50/10 rounded-full p-1 gap-1 mb-4'>
          <button
            type="button"
            onClick={() => {
              if (mode === 'todas') {
                void loadClasses('todas')
              } else {
                handleModeChange('todas')
              }
            }}
            className={`toggle-base ${mode === 'todas' ? 'bg-(--green) text-white' : 'bg-transparent text-(--green)'}`}
          >
            {loading && mode === 'todas' ? 'Cargando...' : 'Ver todas'}
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('filtrar')}
            className={`toggle-base ${mode === 'filtrar' ? 'bg-(--green) text-white' : 'bg-transparent text-(--green)'}`}
          >
            Filtrar por fechas
          </button>
        </div>

        {mode === 'filtrar' && (
          <div>
            <div className='flex gap-4 flex-wrap mb-4'>
              <label className='label'>
                Fecha desde
                <DatePicker value={startDate} onChange={setStartDate} />
              </label>
              <label className='label'>
                Fecha hasta
                <DatePicker value={endDate} onChange={setEndDate} />
              </label>
            </div>
            <div className='flex gap-3'>
              <button
                type="button"
                onClick={() => void loadClasses()}
                disabled={loading}
                className='bg-(--green) text-white border-none rounded-lg px-4 py-2 font-semibold text-sm cursor-pointer'
              >
                {loading ? 'Cargando...' : 'Visualizar clases'}
              </button>
              <button
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); setClasses([]); setHasLoaded(false); setError(null) }}
                className='bg-transparent border border-emerald-300 rounded-lg px-4 py-2 font-semibold text-sm cursor-pointer'
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className='text-red-500 mb-4'>{error}</p>
      )}

      {loading && (
        <p className='text-(--green)'>Cargando...</p>
      )}

      {!loading && hasLoaded && classes.length === 0 && !error && (
        <p className='text-gray-500 text-sm'>
          No hay clases para mostrar.
        </p>
      )}

      {!loading && classes.length > 0 && (
        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr>
                <th className='text-left p-2.5 text-(--green) font-semibold text-xs tracking-wide uppercase'>Fecha</th>
                <th className='text-left p-2.5 text-(--green) font-semibold text-xs tracking-wide uppercase'>Hora</th>
                <th className='text-left p-2.5 text-(--green) font-semibold text-xs tracking-wide uppercase'>Actividad</th>
                <th className='text-left p-2.5 text-(--green) font-semibold text-xs tracking-wide uppercase'>Profesor</th>
                <th className='text-left p-2.5 text-(--green) font-semibold text-xs tracking-wide uppercase'>Cupo</th>
              </tr>
            </thead>
            <tbody>{classRows}</tbody>
          </table>
        </div>
      )}
    </main>
  )
}