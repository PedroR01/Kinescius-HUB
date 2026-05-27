import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/clientes')({
  component: RouteComponent,
})

type Cliente = {
  id_cliente: number
  nombre: string
  apellido: string
  dni: string
  mail: string
}

function RouteComponent() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadClientes = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:3000/clases/clientes')

      if (!response.ok) {
        throw new Error('Error al obtener clientes')
      }

      const data = await response.json()

      const clientesData = Array.isArray(data)
        ? data
        : data.clientes ?? []

      setClientes(clientesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClientes()
  }, [])

  return (
    <main className="min-h-screen bg-white px-8 py-14">

      <section className="mx-auto max-w-7xl">
        <div className="mb-20 text-center">
          <div className="mx-auto mb-6 h-2 w-40 rounded-full bg-[#2DBE7F]" />

          <h1 className="text-6xl font-black tracking-tight text-[#0d1f18]">
            Clientes
          </h1>

          <p className="mt-5 text-xl text-[#0d1f18]/70">
            Centro de rehabilitación Kinescius
          </p>

          <button
            onClick={loadClientes}
            disabled={loading}
            className="mt-10 rounded-full bg-[#2DBE7F] px-10 py-4 text-lg font-bold text-[#0d1f18] shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Actualizar lista'}
          </button>
        </div>

        {error && (
          <div className="mb-10 rounded-[30px] border border-red-200 bg-red-50 p-6 text-center text-red-600 shadow-sm">
            {error}
          </div>
        )}

        {!loading && clientes.length === 0 && (
          <div className="rounded-[40px] bg-[#f0faf5] p-24 text-center shadow-xl">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl">
              👤
            </div>

            <h2 className="text-3xl font-bold text-[#0d1f18]">
              No hay clientes inscriptos
            </h2>

            <p className="mt-4 text-[#0d1f18]/70">
              Cuando existan clientes registrados aparecerán aquí.
            </p>
          </div>
        )}

        {clientes.length > 0 && (
          <div className="mb-12 flex justify-center">
            <div className="rounded-full bg-[#f0faf5] px-8 py-4 text-sm font-bold text-[#2DBE7F] shadow-md">
              Total de clientes: {clientes.length}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-14 md:grid-cols-2 xl:grid-cols-3">
          {clientes.map((cliente) => (
            <button
              key={cliente.id_cliente}
              className="group relative overflow-hidden rounded-[42px] bg-[#f0faf5] p-10 text-left shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#2DBE7F]/15 blur-3xl transition-all duration-500 group-hover:scale-150"></div>

              <div className="relative z-10 flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#2DBE7F] text-2xl font-black text-[#0d1f18] shadow-lg">
                  {cliente.nombre.charAt(0)}
                  {cliente.apellido.charAt(0)}
                </div>

                <div>
                  <h2 className="text-2xl font-black text-[#0d1f18]">
                    {cliente.nombre}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-[#0d1f18]/70">
                    {cliente.apellido}
                  </p>
                </div>
              </div>

              <div className="relative z-10 my-7 h-[2px] rounded-full bg-[#2DBE7F]"></div>

              <div className="relative z-10 space-y-5">
                <div className="rounded-[24px] bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2DBE7F]">
                    DNI
                  </p>

                  <p className="mt-2 text-lg font-semibold text-[#0d1f18]">
                    {cliente.dni}
                  </p>
                </div>

                <div className="rounded-[24px] bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2DBE7F]">
                    Mail
                  </p>

                  <p className="mt-2 truncate text-lg font-semibold text-[#0d1f18]">
                    {cliente.mail}
                  </p>
                </div>
              </div>

              <div className="relative z-10 mt-8 flex items-center justify-between">
                <span className="rounded-full bg-white px-5 py-2 text-xs font-black text-[#0d1f18]">
                  Cliente #{cliente.id_cliente}
                </span>

                <div className="h-4 w-4 rounded-full bg-[#2DBE7F] shadow-lg shadow-[#2DBE7F]"></div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}