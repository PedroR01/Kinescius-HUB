import React, { useState } from 'react';
import { cancelarTurnoRequest } from '../../../api/shifts'; 

interface CancelarTurnoProps {
  clienteId: number;
  claseId: number;
  fechaClase: string;
  horaClase: string;  
  actividad: string;
  onCancelSuccess: () => void; 
  onClose: () => void; 
}

type TipoReembolso = 'REEMBOLSO' | 'A_FAVOR' | 'NINGUNO';

export const CancelarTurno: React.FC<CancelarTurnoProps> = ({
  clienteId,
  claseId,
  fechaClase,
  horaClase,
  actividad,
  onCancelSuccess,
  onClose,
}) => {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<TipoReembolso | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const fechaCompleta = new Date(`${fechaClase}T${horaClase}-03:00`);
  const ahora = new Date();
  const diferenciaHoras = (fechaCompleta.getTime() - ahora.getTime()) / (1000 * 60 * 60);
  const permiteReembolso = diferenciaHoras >= 24;

  // 2. Manejador del botón final
  const handleConfirmar = async () => {
    if (permiteReembolso && !opcionSeleccionada) {
      setErrorMensaje('Por favor, selecciona qué deseas hacer con tu dinero.');
      return;
    }

    setLoading(true);
    setErrorMensaje(null);

    try {
      const payload = {
        clienteId,
        claseId,
        tipoReembolso: permiteReembolso ? opcionSeleccionada! : 'NINGUNO',
      };

      await cancelarTurnoRequest(payload);
      onCancelSuccess();
    } catch (error: any) {
      setErrorMensaje(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full border border-gray-100">
      <h2 className="text-2xl font-bold text-[#0D6B5D] mb-4">Cancelar Turno</h2>
      
      <div className="mb-6 bg-gray-50 p-4 rounded text-gray-700">
        <p><strong>Actividad:</strong> {actividad}</p>
        <p><strong>Fecha:</strong> {fechaClase}</p>
        <p><strong>Hora:</strong> {horaClase}</p>
      </div>

      {permiteReembolso ? (
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">
            Estás cancelando con más de 24 horas de antelación. Por favor, seleccioná una opción:
          </p>
          <div className="flex flex-col gap-3">
            <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="reembolso"
                value="REEMBOLSO"
                className="mr-3 text-[#0D6B5D] focus:ring-[#0D6B5D]"
                onChange={() => setOpcionSeleccionada('REEMBOLSO')}
              />
              <span className="text-gray-700 font-medium">Exigir reembolso</span>
            </label>
            <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="reembolso"
                value="A_FAVOR"
                className="mr-3 text-[#0D6B5D] focus:ring-[#0D6B5D]"
                onChange={() => setOpcionSeleccionada('A_FAVOR')}
              />
              <span className="text-gray-700 font-medium">Dejar monto a favor</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 text-orange-700 rounded">
          <p className="font-semibold mb-1">Cancelación fuera de término</p>
          <p className="text-sm">
            Al cancelar con menos de 24 horas de antelación, no se efectuará reembolso ni quedará saldo a favor.
          </p>
        </div>
      )}

      {errorMensaje && (
        <div className="mb-4 text-red-600 text-sm font-medium">
          {errorMensaje}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-8">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
        >
          Volver
        </button>
        <button
          onClick={handleConfirmar}
          disabled={loading}
          className="px-6 py-2 bg-gradient-to-r from-[#0D6B5D] to-[#8BC34A] text-white font-bold rounded shadow hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Procesando...' : 'Confirmar Cancelación'}
        </button>
      </div>
    </div>
  );
};