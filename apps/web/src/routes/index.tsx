import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => (
    <main className="page-shell">
      <section className="hero-card">
        <h1>Kinescius HUB</h1>
        <p>Seleccione una opción para administrar clases y turnos.</p>
      </section>

      <section className="form-card">
        <div className="actions-row">
          <Link to="/verClases" className="button button-primary">
            Ver clases
          </Link>
          <Link to="/crearClase" className="button button-secondary">
            Crear clase
          </Link>
          <Link to="/solicitarTurno" className="button button-secondary">
            Solicitar turno
          </Link>
        </div>
      </section>
    </main>
  )
});
