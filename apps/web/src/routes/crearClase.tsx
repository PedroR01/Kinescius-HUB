    import { createFileRoute } from '@tanstack/react-router'
    import { useState } from 'react'

    export const Route = createFileRoute('/crearClase')({
    component: RouteComponent,
    })

    function RouteComponent() {
    const [fecha, setFecha] = useState('')
    const [hora, setHora] = useState('15:00')
    const [tipo, setTipo] = useState('')
    const [profesorDni, setProfesorDni] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)
        setError(null)

        try {
        const response = await fetch('http://localhost:3000/clases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fecha, hora, tipo, profesorDni })
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
            const msg = data?.message ?? data?.error ?? 'Error desconocido'
            setError(msg)
        } else {
            setMessage(data?.message ?? 'Clase creada correctamente')
            setFecha('')
            setHora('15:00')
            setTipo('')
            setProfesorDni('')
        }
        } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de red')
        } finally {
        setLoading(false)
        }
    }

    return (
        <main className="page-shell">
        <section className="hero-card">
            <h1>Crear clase (Admin)</h1>
            <p>Complete los datos y presione Crear clase.</p>
        </section>

        <section className="form-card">
            <form onSubmit={handleSubmit} className="field-column">
            <label>
                Fecha
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </label>

            <label>
                Hora
                <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
            </label>

            <label>
                Actividad
                <input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="tren inferior" />
            </label>

            <label>
                DNI Profesor
                <input value={profesorDni} onChange={(e) => setProfesorDni(e.target.value)} placeholder="44657889" />
            </label>

            <div className="actions-row">
                <button className="button button-primary" type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear clase'}
                </button>
            </div>
            </form>

            {message ? <p className="status-badge success">{message}</p> : null}
            {error ? <p className="status-badge full">{error}</p> : null}
        </section>
        </main>
    )
    }
