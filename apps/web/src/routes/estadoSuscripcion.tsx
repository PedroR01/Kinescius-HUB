import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { API_BASE } from '@/lib/constants'
import { BackPreviousRouteButton } from '@/components/BackPreviousRouteButton'

export const Route = createFileRoute('/estadoSuscripcion')({
   component: RouteComponent,
})

type Persona = {
   id: number
   nombre: string
   apellido: string
   dni: string
   mail: string
}

function PersonaCard({ persona }: { persona: Persona }) {
   return (
      <div className="rounded-[24px] bg-white p-5 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#2DBE7F] text-lg font-black text-[#0d1f18]">
               {persona.nombre?.charAt(0)}
               {persona.apellido?.charAt(0)}
            </div>
            <div>
               <p className="text-lg font-black text-[#0d1f18]">
                  {persona.nombre} {persona.apellido}
               </p>
               <p className="text-sm text-[#0d1f18]/70">{persona.dni}</p>
            </div>
         </div>
         <p className="mt-3 truncate text-sm font-medium text-[#0d1f18]/70">
            {persona.mail}
         </p>
      </div>
   )
}

function RouteComponent() {
   const [abonados, setAbonados] = useState<Persona[]>([])
   const [noAbonados, setNoAbonados] = useState<Persona[]>([])
   const [error, setError] = useState<string | null>(null)
   const [loading, setLoading] = useState(false)
   const [consultado, setConsultado] = useState(false)

   const loadEstadoSuscripcion = async () => {
      setLoading(true)
      setError(null)

      try {
         const response = await fetch(`${API_BASE}/admin/clases/estadoSuscripcion`)

         if (!response.ok) {
            throw new Error('Error al obtener el estado de suscripción')
         }

         const data = await response.json()

         setAbonados(data.abonados ?? [])
         setNoAbonados(data.noAbonados ?? [])
      } catch (err) {
         setError(err instanceof Error ? err.message : 'Error desconocido')
         setAbonados([])
         setNoAbonados([])
      } finally {
         setLoading(false)
         setConsultado(true)
      }
   }

   const sinUsuarios = consultado && !loading && abonados.length === 0 && noAbonados.length === 0

   return (
      <main className="min-h-screen bg-white px-8 py-14">
         <BackPreviousRouteButton className="mb-6" />

         <section className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
               <div className="mx-auto mb-6 h-2 w-40 rounded-full bg-[#2DBE7F]" />

               <h1 className="text-6xl font-black tracking-tight text-[#0d1f18]">
                  Estado de suscripción
               </h1>

               <p className="mt-5 text-xl text-[#0d1f18]/70">
                  Centro de rehabilitación Kinescius
               </p>

               <button
                  onClick={loadEstadoSuscripcion}
                  disabled={loading}
                  className="mt-10 rounded-full bg-[#2DBE7F] px-10 py-4 text-lg font-bold text-[#0d1f18] shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50"
               >
                  {loading ? 'Cargando...' : 'Ver estado de suscripción'}
               </button>
            </div>

            {error && (
               <div className="mb-10 rounded-[30px] border border-red-200 bg-red-50 p-6 text-center text-red-600 shadow-sm">
                  {error}
               </div>
            )}

            {sinUsuarios && (
               <div className="mb-10 rounded-[30px] border border-[#2DBE7F]/30 bg-[#f0faf5] p-8 text-center text-[#0d1f18]/70 shadow-sm">
                  No hay usuarios registrados
               </div>
            )}

            {consultado && !loading && !sinUsuarios && (
               <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">
                  <div>
                     <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-black text-[#0d1f18]">
                           Abonados
                        </h2>
                        <span className="rounded-full bg-[#f0faf5] px-5 py-2 text-sm font-bold text-[#2DBE7F]">
                           {abonados.length}
                        </span>
                     </div>
                     <div className="space-y-5">
                        {abonados.map((persona) => (
                           <PersonaCard key={persona.id} persona={persona} />
                        ))}
                     </div>
                  </div>

                  <div>
                     <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-black text-[#0d1f18]">
                           No abonados
                        </h2>
                        <span className="rounded-full bg-[#f0faf5] px-5 py-2 text-sm font-bold text-[#2DBE7F]">
                           {noAbonados.length}
                        </span>
                     </div>
                     <div className="space-y-5">
                        {noAbonados.map((persona) => (
                           <PersonaCard key={persona.id} persona={persona} />
                        ))}
                     </div>
                  </div>
               </div>
            )}
         </section>
      </main>
   )
}