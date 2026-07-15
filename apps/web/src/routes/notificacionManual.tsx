import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { API_BASE } from '@/lib/constants'
import { BackPreviousRouteButton } from '@/components/BackPreviousRouteButton'

interface Cliente {
  id: number
  nombre: string
  apellido: string
  dni: string
  mail: string
}

export const Route = createFileRoute('/notificacionManual')({
  component: RouteComponent,
})

function RouteComponent() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [clienteId, setClienteId] = useState<number | ''>('')
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadClientes = async () => {
    setLoadingClientes(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/admin/clases/clientes`)
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      setClientes((data?.clientes ?? []) as Cliente[])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
      setClientes([])
    } finally {
      setLoadingClientes(false)
    }
  }

  useEffect(() => {
    void loadClientes()
  }, [])

  const clienteSeleccionado = useMemo(
    () => clientes.find((cliente) => cliente.id === clienteId) ?? null,
    [clientes, clienteId]
  )

  const puedeEnviar =
    clienteId !== '' && asunto.trim().length > 0 && mensaje.trim().length > 0 && !enviando

  const enviarNotificacion = async () => {
    if (clienteId === '') return

    const confirmed = window.confirm(
      `¿Confirmás el envío del mail a ${clienteSeleccionado?.nombre ?? 'este cliente'} ${clienteSeleccionado?.apellido ?? ''}?`
    )
    if (!confirmed) return

    setEnviando(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/admin/clases/notificacion-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId,
          asunto: asunto.trim(),
          mensaje: mensaje.trim(),
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Error ${response.status}`)
      }

      setMessage(data?.message ?? 'Notificación enviada correctamente')
      setAsunto('')
      setMensaje('')
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="page-shell">
      <BackPreviousRouteButton className="mb-4" />
      <section className="bg-ks-off-white rounded-ks-lg p-6 shadow-[0_20px_60px_rgba(26,58,42,0.18)]">
        <h1>Enviar notificación manual</h1>
        <p>Seleccioná un cliente y escribí el mensaje que querés enviarle por mail.</p>
      </section>

      <section className="bg-ks-off-white rounded-ks-lg p-6 shadow-[0_20px_60px_rgba(26,58,42,0.18)]">
        <div className="field-column">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Cliente
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : '')}
              className="border border-ks-gray-border rounded-ks-full p-4"
              disabled={loadingClientes}
            >
              <option value="">
                {loadingClientes ? 'Cargando clientes...' : 'Seleccioná un cliente'}
              </option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellido} — {cliente.dni} — {cliente.mail}
                </option>
              ))}
            </select>
          </label>

          {clienteSeleccionado ? (
            <p className="status-badge">
              Vas a escribirle a: <strong>{clienteSeleccionado.mail}</strong>
            </p>
          ) : null}

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Asunto
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Asunto del mail"
              className="border border-ks-gray-border rounded-ks-full p-4"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Mensaje
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribí el mensaje..."
              rows={6}
              className="border border-ks-gray-border rounded-ks-lg p-4"
            />
          </label>

          <div className="actions-row">
            <button
              type="button"
              className="bg-ks-green-dark text-white rounded-ks-full p-4"
              onClick={() => void enviarNotificacion()}
              disabled={!puedeEnviar}
            >
              {enviando ? 'Enviando...' : 'Enviar notificación'}
            </button>
          </div>
        </div>

        {error ? <p className="status-badge full">{error}</p> : null}
        {message ? <p className="status-badge success">{message}</p> : null}
      </section>
    </main>
  )
}