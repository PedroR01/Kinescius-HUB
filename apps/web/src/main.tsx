import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { AppProviders } from "./providers";
import { router } from "./router";
import "./index.css";
import App from "./App";

// Importamos tus dos componentes (ajustá las rutas si es necesario)
import { CancelarTurno } from './modules/turnos/components/cancelarTurnoModal';
import { CambiarTurnoModal } from './modules/turnos/components/cambiarTurnoModal';

// Mini-componente para manejar los estados y la botonera de prueba
const EntornoDePruebas = () => {
  const [mostrarCancelar, setMostrarCancelar] = useState(false);
  const [mostrarCambiar, setMostrarCambiar] = useState(false);

  // Datos fijos para la prueba. Asegurate de que la claseId: 30 exista en tu BD
  // y que haya alguna otra clase disponible el mismo día para probar el cambio.
  const mockTurno = {
    clienteId: 33,
    claseId: 99,
    actividad: "Kinesiología",
    fechaActual: "2026-05-27",
    horaActual: "08:00:00"
  };

  return (
    <>
      {/* Panel flotante inferior derecho para disparar los modales */}
      <div className="fixed bottom-4 right-4 z-[9999] bg-white p-4 rounded-lg shadow-xl border border-gray-300 flex flex-col gap-3">
        <p className="font-bold text-[#0D6B5D] text-sm border-b pb-2">Panel de Pruebas (Dev)</p>
        <button 
          onClick={() => setMostrarCancelar(true)}
          className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded hover:bg-red-200 transition-colors text-sm"
        >
          Probar Cancelar Turno
        </button>
        <button 
          onClick={() => setMostrarCambiar(true)}
          className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded hover:bg-blue-200 transition-colors text-sm"
        >
          Probar Cambiar Turno
        </button>
      </div>

      {/* Renderizado condicional de los modales */}
      {mostrarCancelar && (
        <CancelarTurno 
          clienteId={mockTurno.clienteId} 
          claseId={mockTurno.claseId} 
          fechaClase={mockTurno.fechaActual} 
          horaClase={mockTurno.horaActual} 
          actividad={mockTurno.actividad} 
          onCancelSuccess={() => {
            alert('¡Back respondió OK! Turno cancelado.');
            setMostrarCancelar(false);
          }} 
          onClose={() => setMostrarCancelar(false)} 
        />
      )}

      {mostrarCambiar && (
        <CambiarTurnoModal 
          clienteId={mockTurno.clienteId} 
          claseActualId={mockTurno.claseId} 
          fechaActual={mockTurno.fechaActual} 
          horaActual={mockTurno.horaActual}
          actividad={mockTurno.actividad} 
          onChangeSuccess={() => {
            alert('¡Back respondió OK! Turno cambiado.');
            setMostrarCambiar(false);
          }} 
          onClose={() => setMostrarCambiar(false)} 
        />
      )}
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
      <App />
    </AppProviders>

    {/* INYECTAMOS EL ENTORNO DE PRUEBAS */}
    <EntornoDePruebas />
  </React.StrictMode>,
);
