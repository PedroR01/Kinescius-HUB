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
    <main className="min-h-screen bg-[#f6fffc] px-8 py-14">

      {/* CONTAINER */}
      <section className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-20 text-center">

          {/* LINEA DE COLOR */}
          <div className="mx-auto mb-6 h-2 w-40 rounded-full bg-gradient-to-r from-[#D6E600] via-[#63D471] to-[#00C9A7]" />

          <h1 className="text-6xl font-black tracking-tight text-[#00796B]">
            Clientes
          </h1>

          <p className="mt-5 text-xl text-[#7A7A7A]">
            Centro de rehabilitación Kinescius
          </p>

          <button
            onClick={loadClientes}
            disabled={loading}
            className="mt-10 rounded-full bg-gradient-to-r from-[#D6E600] via-[#63D471] to-[#00C9A7] px-10 py-4 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Actualizar lista'}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-10 rounded-[30px] border border-red-200 bg-red-50 p-6 text-center text-red-600 shadow-sm">
            {error}
          </div>
        )}

        {/* EMPTY */}
        {!loading && clientes.length === 0 && (
          <div className="rounded-[40px] bg-white p-24 text-center shadow-xl">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#E8FFF8] text-4xl">
              👤
            </div>

            <h2 className="text-3xl font-bold text-[#00796B]">
              No hay clientes inscriptos
            </h2>

            <p className="mt-4 text-[#7A7A7A]">
              Cuando existan clientes registrados aparecerán aquí.
            </p>
          </div>
        )}

        {/* TOTAL */}
        {clientes.length > 0 && (
          <div className="mb-12 flex justify-center">
            <div className="rounded-full bg-[#E8FFF8] px-8 py-4 text-sm font-bold text-[#00A896] shadow-md">
              Total de clientes: {clientes.length}
            </div>
          </div>
        )}

        {/* CLIENTES */}
        <div className="grid grid-cols-1 gap-14 md:grid-cols-2 xl:grid-cols-3">

          {clientes.map((cliente) => (
            <button
              key={cliente.id_cliente}
              className="group relative overflow-hidden rounded-[42px] bg-white p-10 text-left shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >

              {/* GLOW */}
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00C9A7]/20 blur-3xl transition-all duration-500 group-hover:scale-150"></div>

              {/* TOP */}
              <div className="relative z-10 flex items-center gap-5">

                {/* AVATAR */}
                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#D6E600] via-[#63D471] to-[#00C9A7] text-2xl font-black text-white shadow-lg">
                  {cliente.nombre.charAt(0)}
                  {cliente.apellido.charAt(0)}
                </div>

                {/* NAME */}
                <div>
                  <h2 className="text-2xl font-black text-[#00796B]">
                    {cliente.nombre}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-[#7A7A7A]">
                    {cliente.apellido}
                  </p>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="relative z-10 my-7 h-[2px] rounded-full bg-gradient-to-r from-[#D6E600] via-[#63D471] to-[#00C9A7]"></div>

              {/* INFO */}
              <div className="relative z-10 space-y-5">

                {/* DNI */}
                <div className="rounded-[24px] bg-[#F4FFFD] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00A896]">
                    DNI
                  </p>

                  <p className="mt-2 text-lg font-semibold text-[#404040]">
                    {cliente.dni}
                  </p>
                </div>

                {/* MAIL */}
                <div className="rounded-[24px] bg-[#F4FFFD] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00A896]">
                    Mail
                  </p>

                  <p className="mt-2 truncate text-lg font-semibold text-[#404040]">
                    {cliente.mail}
                  </p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="relative z-10 mt-8 flex items-center justify-between">

                <span className="rounded-full bg-[#E8FFF8] px-5 py-2 text-xs font-black text-[#00A896]">
                  Cliente #{cliente.id_cliente}
                </span>

                <div className="h-4 w-4 rounded-full bg-[#63D471] shadow-lg shadow-[#63D471]"></div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}