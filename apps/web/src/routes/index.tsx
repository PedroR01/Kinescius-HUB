import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

// Separamos el componente para poder usar Hooks (useState y useEffect)
const PaginaPrincipal = () => {
  // Estado que funciona como un "interruptor" para saber si hay sesión
  const [estaLogueado, setEstaLogueado] = useState(false);

  // useEffect se ejecuta una sola vez cuando el usuario entra a la página
  useEffect(() => {
    // Buscamos el token en la memoria del navegador
    const token = localStorage.getItem('miToken');
    
    // Si el token existe, prendemos el interruptor
    if (token) {
      setEstaLogueado(true);
    }
  }, []);

  // Función para borrar el token y cerrar la sesión
  const cerrarSesion = () => {
    localStorage.removeItem('miToken');
    setEstaLogueado(false); // Apagamos el interruptor
  };

  return (
    <div>
      {/* Reemplacé la etiqueta <body> por <h1> y <p>. 
          En React, la etiqueta <body> ya existe en tu index.html principal, 
          por lo que acá adentro usamos divs o textos normales */}
      <h1>Bienvenido</h1>
      <p>Kinescius es un centro de rehabilitación</p>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        
        {/* LA MAGIA CONDICIONAL: Si el interruptor está prendido (?) ve una cosa, si no (:) ve otra */}
        {estaLogueado ? (
          <>
            <Link to="/solicitarTurno" className="button button-primary">
              Solicitar turno
            </Link>
            <button onClick={cerrarSesion} className="button">
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/registro" className="button button-primary">
              Registrarse
            </Link>
            <Link to="/iniciarSesion" className="button button-primary">
              Iniciar sesión
            </Link>
          </>
        )}

      </div>
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: PaginaPrincipal
});