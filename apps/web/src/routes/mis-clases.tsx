
import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';

// Asegurate de ajustar estas rutas a donde realmente tenés guardados tus modales
import { CambiarTurnoModal } from '../modules/turnos/components/cambiarTurnoModal';
import { CancelarTurno } from '../modules/turnos/components/cancelarTurnoModal';

export const Route = createFileRoute('/mis-clases')({
  component: () => <GestionClases />,
});

interface ClaseDto {
  id: number;
  fecha: string;
  hora: string;
  tipo: string;
}

interface MisClasesResponseDto {
  id_clase: number;
  id_cliente: number;
  Clase: ClaseDto;
}

export default function GestionClases() {
  const [misClases, setMisClases] = useState<MisClasesResponseDto[]>([]);
  
  const [modalActivo, setModalActivo] = useState<'CAMBIAR' | 'CANCELAR' | null>(null);
  const [claseSeleccionada, setClaseSeleccionada] = useState<MisClasesResponseDto | null>(null);

  const idCliente = 1; 

  const cargarClases = () => {
    fetch(`http://localhost:3000/shifts/mis-clases/${idCliente}`)
      .then((res) => res.json())
      .then((data) => setMisClases(data))
      .catch((err) => console.error("Error al traer clases:", err));
  };

  useEffect(() => {
    cargarClases();
  }, []);

  const abrirModal = (tipo: 'CAMBIAR' | 'CANCELAR', clase: MisClasesResponseDto) => {
    setClaseSeleccionada(clase);
    setModalActivo(tipo);
  };

  const cerrarModal = () => {
    setModalActivo(null);
    setClaseSeleccionada(null);
  };

  const handleExito = () => {
    cerrarModal();
    cargarClases(); 
  };

  return (
    <div className="min-h-screen bg-[#f8fcfb] p-4 md:p-8 font-sans text-gray-800">
      
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* BANNER PRINCIPAL (Estilo de la imagen de referencia) */}
        <div className="bg-gradient-to-r from-[#e6f4f1] to-[#d6ede8] rounded-3xl p-8 md:p-10 shadow-sm border border-[#cbe7e3]">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0D6B5D] tracking-tight mb-2">
            Mis clases
          </h1>
          <p className="text-[#0a5247] font-medium text-lg opacity-90">
            Consultá las clases programadas para hoy o fechas futuras y gestioná tus turnos.
          </p>
        </div>

        {/* CONTENEDOR DE LA LISTA */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          
          <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">
            Tus inscripciones activas
          </h2>

          <div className="space-y-4">
            {misClases.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500 font-medium text-lg">No tenés clases programadas.</p>
              </div>
            ) : (
              misClases
                .filter((item) => item.Clase !== null)
                .map((item) => (
                  /* TARJETA DE LA CLASE */
                  <div 
                    key={item.id_clase} 
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-[#fafffd] border border-[#e2f0ed] rounded-2xl hover:shadow-md transition-shadow gap-4"
                  >
                    {/* INFO DE LA CLASE */}
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-2xl text-[#0D6B5D]">
                        {item.Clase.tipo}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 font-medium mt-1">
                        <span className="bg-white px-3 py-1 rounded-lg border shadow-sm text-sm">
                          📅 {item.Clase.fecha}
                        </span>
                        <span className="bg-white px-3 py-1 rounded-lg border shadow-sm text-sm">
                          ⏰ {item.Clase.hora.slice(0, 5)} hs
                        </span>
                      </div>
                    </div>

                    {/* BOTONES DIRECTOS */}
                    <div className="flex flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
                      <button 
                        onClick={() => abrirModal('CAMBIAR', item)}
                        className="flex-1 md:flex-none bg-[#0D6B5D] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#095045] hover:shadow-lg transition-all active:scale-95"
                      >
                        Cambiar turno
                      </button>
                      <button 
                        onClick={() => abrirModal('CANCELAR', item)}
                        className="flex-1 md:flex-none bg-[#ef4444] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#dc2626] hover:shadow-lg transition-all active:scale-95"
                      >
                        Cancelar turno
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

      </div>

      {/* MODALES */}
      {modalActivo === 'CAMBIAR' && claseSeleccionada && (
        <CambiarTurnoModal
          clienteId={claseSeleccionada.id_cliente}
          claseActualId={claseSeleccionada.id_clase}
          actividad={claseSeleccionada.Clase.tipo}
          fechaActual={claseSeleccionada.Clase.fecha}
          horaActual={claseSeleccionada.Clase.hora}
          onClose={cerrarModal}
          onChangeSuccess={handleExito}
        />
      )}

      {modalActivo === 'CANCELAR' && claseSeleccionada && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <CancelarTurno
            clienteId={claseSeleccionada.id_cliente}
            claseId={claseSeleccionada.id_clase}
            actividad={claseSeleccionada.Clase.tipo}
            fechaClase={claseSeleccionada.Clase.fecha}
            horaClase={claseSeleccionada.Clase.hora}
            onClose={cerrarModal}
            onCancelSuccess={handleExito}
          />
        </div>
      )}
      
    </div>
  );
}