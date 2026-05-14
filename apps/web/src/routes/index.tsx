import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => (
    <Link to="/solicitarTurno" className="button button-primary">
      Solicitar turno
    </Link>
  )
});
