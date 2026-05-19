import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => (
    <>
    <Link to="/solicitarTurno" className="button button-primary">
      Solicitar turno
    </Link>
    <Link to="/registro" className="button button-primary">
       Registrarse
    </Link>
    <Link to="/iniciarSesion" className="button button-primary">
       Iniciar sesión
    </Link>
    <body>Kinescius es un centro de rehabilitación</body>
    </>
  )
});