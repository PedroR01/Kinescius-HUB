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

  // Al abrirse el modal, traemos las clases del Back
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
      setErrorMensaje('Por favor, selecciona una nueva clase.');
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full border border-gray-100 relative">

        <h2 className="text-2xl font-bold text-[#0D6B5D] mb-4">Cambiar Horario de Turno</h2>

        <div className="mb-6 bg-gray-50 p-4 rounded text-gray-700 text-sm border-l-4 border-[#0D6B5D]">
          <p className="font-semibold text-gray-900 mb-1">Turno a modificar:</p>
          <p><strong>Actividad:</strong> {actividad}</p>
          <p><strong>Fecha actual:</strong> {fechaActual} ({horaActual.slice(0, 5)} hs)</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horarios alternativos disponibles para hoy:
          </label>

          {loadingFetch ? (
            <p className="text-sm text-gray-500 animate-pulse">Buscando alternativas en tiempo real...</p>
          ) : clasesFiltradas.length === 0 ? (
            <div className="p-3 bg-gray-100 rounded text-sm text-gray-600">
              No se encontraron otros turnos con cupo disponible para el mismo día.
            </div>
          ) : (
            <select
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-700 outline-none focus:border-[#0D6B5D] focus:ring-1 focus:ring-[#0D6B5D] transition-colors"
              value={claseNuevaId}
              onChange={(e) => setClaseNuevaId(Number(e.target.value))}
              disabled={loadingSubmit}
            >
              <option value="" disabled>Elegí un nuevo horario...</option>
              {clasesFiltradas.map((clase) => (
                <option key={clase.id} value={clase.id}>
                  {clase.hora.slice(0, 5)} hs — ({clase.actividad} - {clase.cuposDisponibles} cupos)
                </option>
              ))}
            </select>
          )}
        </div>

        {errorMensaje && (
          <div className="mb-4 text-red-600 text-sm font-medium p-3 bg-red-50 rounded">
            {errorMensaje}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={loadingSubmit}
            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmarCambio}
            disabled={!claseNuevaId || loadingSubmit || loadingFetch}
            className="px-6 py-2 bg-gradient-to-r from-[#0D6B5D] to-[#8BC34A] text-white font-bold rounded shadow hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingSubmit ? 'Procesando...' : 'Confirmar Cambio'}
          </button>
        </div>

      </div>
    </div>
  );
};