import React, { useState, useEffect } from 'react';
import { obtenerClasesDisponiblesRequest, cambiarTurnoRequest, type ClaseDisponible } from '../../../api/shifts';

interface CambiarTurnoModalProps {
  clienteId: number;
  claseActualId: number;
  actividad: string;
  fechaActual: string;
  horaActual: string;
  onClose: () => void;
  onChangeSuccess: () => void;
}

export const CambiarTurno: React.FC<CambiarTurnoModalProps> = ({
  clienteId,
  claseActualId,
  actividad,
  fechaActual,
  horaActual,
  onClose,
  onChangeSuccess,
}) => {
  const [clasesFiltradas, setClasesFiltradas] = useState<ClaseDisponible[]>([]);
  const [claseNuevaId, setClaseNuevaId] = useState<number | ''>('');
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const cargarClases = async () => {
      try {
        setErrorMensaje(null);
        const todasLasClases = await obtenerClasesDisponiblesRequest();
        const delMismoDia = todasLasClases.filter(
          (clase) =>
            clase.fecha === fechaActual &&
            clase.id !== claseActualId &&
            clase.cuposDisponibles > 0
        );

        setClasesFiltradas(delMismoDia);
      } catch (error: any) {
        setErrorMensaje(error.message || 'Error al conectar con el servidor.');
      } finally {
        setLoadingFetch(false);
      }
    };

    cargarClases();
  }, [fechaActual, claseActualId]);

  const handleConfirmarCambio = async () => {
    if (!claseNuevaId) {
      setErrorMensaje('Por favor, seleccioná una nueva clase.');
      return;
    }

    setLoadingSubmit(true);
    setErrorMensaje(null);

    try {
      const payload = {
        clienteId,
        claseActualId,
        claseNuevaId: Number(claseNuevaId),
      };

      await cambiarTurnoRequest(payload);
      onChangeSuccess();
    } catch (error: any) {
      setErrorMensaje(error.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
      <h2 className="text-2xl font-heading font-extrabold text-dark-accent mb-6">Cambiar Horario de Turno</h2>

      <div className="mb-6 bg-surface p-5 rounded-2xl text-slate-700">
        <p className="mb-1"><strong className="font-semibold text-dark-accent">Actividad:</strong> {actividad}</p>
        <p className="mb-1"><strong className="font-semibold text-dark-accent">Fecha:</strong> {fechaActual}</p>
        <p><strong className="font-semibold text-dark-accent">Hora:</strong> {horaActual.slice(0, 5)} hs</p>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-600 mb-3">
          Horarios alternativos disponibles para hoy:
        </label>

        {loadingFetch ? (
          <p className="text-sm font-medium text-slate-500 animate-pulse">Buscando alternativas en tiempo real...</p>
        ) : clasesFiltradas.length === 0 ? (
          <div className="p-4 bg-surface rounded-2xl text-sm font-medium text-slate-600">
            No se encontraron otros turnos con cupo disponible para el mismo día.
          </div>
        ) : (
          <div className="relative">
            {/* Select Trigger */}
            <div
              className={`w-full rounded-2xl bg-surface px-4 py-3.5 font-semibold cursor-pointer transition-colors flex justify-between items-center ${claseNuevaId === '' ? 'text-slate-500' : 'text-main'
                }`}
              onClick={() => {
                if (!loadingSubmit) setDropdownOpen(!dropdownOpen);
              }}
            >
              <span>
                {claseNuevaId === ''
                  ? 'Elegí un nuevo horario...'
                  : (() => {
                    const selected = clasesFiltradas.find((c) => c.id === claseNuevaId);
                    return selected
                      ? `${selected.hora.slice(0, 5)} hs — (${selected.actividad} - ${selected.cuposDisponibles} cupos)`
                      : '';
                  })()}
              </span>
              <svg
                className={`h-5 w-5 fill-current text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''
                  }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>

            {/* Custom Dropdown Menu */}
            {dropdownOpen && (
              <>
                {/* Overlay invisible para cerrar al hacer clic afuera */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                ></div>

                <div className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-border/30">
                  <div
                    className="px-4 py-3.5 text-slate-500 font-medium cursor-pointer hover:bg-surface transition-colors"
                    onClick={() => {
                      setClaseNuevaId('');
                      setDropdownOpen(false);
                    }}
                  >
                    Elegí un nuevo horario...
                  </div>
                  {clasesFiltradas.map((clase) => (
                    <div
                      key={clase.id}
                      className="px-4 py-3.5 text-main font-semibold cursor-pointer hover:bg-surface transition-colors"
                      onClick={() => {
                        setClaseNuevaId(clase.id);
                        setDropdownOpen(false);
                      }}
                    >
                      {clase.hora.slice(0, 5)} hs — ({clase.actividad} - {clase.cuposDisponibles} cupos)
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {errorMensaje && (
        <div className="mb-5 text-red-600 text-sm font-bold bg-red-50 p-3 rounded-xl">
          {errorMensaje}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={onClose}
          disabled={loadingSubmit}
          className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-surface rounded-full transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmarCambio}
          disabled={!claseNuevaId || loadingSubmit || loadingFetch}
          className="px-6 py-2.5 bg-main text-white font-bold rounded-full shadow-md hover:bg-main/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingSubmit ? 'Procesando...' : 'Confirmar Cambio'}
        </button>
      </div>
    </div>
  );
};