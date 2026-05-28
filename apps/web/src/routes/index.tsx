/*const PaginaPrincipal = () => {
  const [estaLogueado, setEstaLogueado] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('miToken');
    if (token) {
      setEstaLogueado(true);
    }
    const rol = localStorage.getItem('rol');
    if (rol == 'admin'){
      setEsAdmin(true);
    }
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('miToken');
    localStorage.removeItem('rol');
    setEstaLogueado(false);
    setEsAdmin(false);
  };

  return (
    <div>
      <h1>Bienvenidos a Kinescius</h1>
      <p>Kinescius es un centro de rehabilitación</p>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        {estaLogueado ? (
          <> {esAdmin ? (
            <> 
              <Link to="/listaEspera" className="button button-primary">Ver lista de espera</Link>
              <Link to="/crearClase" className="button button-primary">Crear clase</Link>
              <Link to="/cancelarClase" className="button button-primary">Cancelar clase</Link>
              <Link to="/clientes" className="button button-primary">Ver clientes</Link>
              <Link to="/verClases" className="button button-primary">Ver clases creadas</Link>
            </>
          ) : (
            <> 
              <Link to="/solicitarTurno" className="button button-primary">Solicitar turno</Link>
            </>
          )}
            <Link to="/cambiarPasswd" className="button button-primary">Cambiar contraseña</Link>
            <button onClick={cerrarSesion} className="button">Cerrar sesión</button>
          </>
        ) : (
          <>
            <Link to="/registro" className="button button-primary">Registrarse</Link>
            <Link to="/iniciarSesion" className="button button-primary">Iniciar sesión</Link>
          </>
        )}
      </div>
      <div></div>
      <div>
        En Kinescius trabajamos para brindarte una atención profesional, cercana y organizada...
      </div>
    </div>
  );
};*/


/*export const Route = createFileRoute("/")({
  component: PaginaPrincipal
});*/


import { createFileRoute } from "@tanstack/react-router";
import { Home } from "../modules/home/Home";

export const Route = createFileRoute("/")({
  component: Home
});
