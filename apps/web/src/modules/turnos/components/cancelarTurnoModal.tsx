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

  const handleConfirmar = async () => {
    if (permiteReembolso && !opcionSeleccionada) {
      setErrorMensaje('Por favor, seleccioná qué deseas hacer con tu dinero.');
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
    <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
      <h2 className="text-2xl font-heading font-extrabold text-dark-accent mb-6">Cancelar Turno</h2>
      
      <div className="mb-6 bg-surface p-5 rounded-2xl text-slate-700">
        <p className="mb-1"><strong className="font-semibold text-dark-accent">Actividad:</strong> {actividad}</p>
        <p className="mb-1"><strong className="font-semibold text-dark-accent">Fecha:</strong> {fechaClase}</p>
        <p><strong className="font-semibold text-dark-accent">Hora:</strong> {horaClase}</p>
      </div>

      {permiteReembolso ? (
        <div className="mb-8">
          <p className="text-sm text-slate-600 mb-4 font-medium">
            Estás cancelando con más de 24 horas de antelación. Por favor, seleccioná una opción:
          </p>
          <div className="flex flex-col gap-3">
            <label 
              className={`flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                opcionSeleccionada === 'REEMBOLSO' 
                  ? 'bg-white shadow-md scale-[1.02] ring-1 ring-main/20' 
                  : 'bg-surface hover:bg-main/5'
              }`}
            >
              <input
                type="radio"
                name="reembolso"
                value="REEMBOLSO"
                className="sr-only"
                onChange={() => setOpcionSeleccionada('REEMBOLSO')}
              />
              <span className={`font-semibold ${opcionSeleccionada === 'REEMBOLSO' ? 'text-main' : 'text-slate-600'}`}>
                Exigir reembolso
              </span>
            </label>
            <label 
              className={`flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                opcionSeleccionada === 'A_FAVOR' 
                  ? 'bg-white shadow-md scale-[1.02] ring-1 ring-main/20' 
                  : 'bg-surface hover:bg-main/5'
              }`}
            >
              <input
                type="radio"
                name="reembolso"
                value="A_FAVOR"
                className="sr-only"
                onChange={() => setOpcionSeleccionada('A_FAVOR')}
              />
              <span className={`font-semibold ${opcionSeleccionada === 'A_FAVOR' ? 'text-main' : 'text-slate-600'}`}>
                Dejar monto a favor
              </span>
            </label>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-5 bg-red-50 text-red-700 rounded-2xl">
          <p className="font-bold mb-2">Cancelación fuera de término</p>
          <p className="text-sm font-medium">
            Al cancelar con menos de 24 horas de antelación, no se efectuará reembolso ni quedará saldo a favor.
          </p>
        </div>
      )}

      {errorMensaje && (
        <div className="mb-5 text-red-600 text-sm font-bold bg-red-50 p-3 rounded-xl">
          {errorMensaje}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-surface rounded-full transition-colors disabled:opacity-50"
        >
          Volver
        </button>
        <button
          onClick={handleConfirmar}
          disabled={loading}
          className="px-6 py-2.5 bg-main text-white font-bold rounded-full shadow-md hover:bg-main/90 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Procesando...' : 'Confirmar Cancelación'}
        </button>
      </div>
    </div>
  );
};