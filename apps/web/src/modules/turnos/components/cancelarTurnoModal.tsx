import React, { useEffect, useState } from 'react';
import { cancelarTurnoRequest } from '../../../api/shifts';

interface CancelarTurnoProps {
  clienteId: number;
  claseId: number;
  fechaClase: string;
  horaClase: string;
  actividad: string;
  pagoConMontoAFavor: boolean;
  esAbonado?: boolean;
  onCancelSuccess: (message: string) => void;
  onClose: () => void;
}

type TipoReembolso = 'REEMBOLSO' | 'A_FAVOR' | 'NINGUNO';

const TOOLTIP_REEMBOLSO_MP =
  'No es posible solicitar reembolso por Mercado Pago porque esta clase se abonó utilizando monto a favor.';

export const CancelarTurno: React.FC<CancelarTurnoProps> = ({
  clienteId,
  claseId,
  fechaClase,
  horaClase,
  actividad,
  pagoConMontoAFavor,
  esAbonado = false,
  onCancelSuccess,
  onClose,
}) => {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<TipoReembolso | null>(
    pagoConMontoAFavor ? 'A_FAVOR' : null,
  );
  const [loading, setLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const fechaCompleta = new Date(`${fechaClase}T${horaClase}-03:00`);
  const ahora = new Date();
  const diferenciaHoras = (fechaCompleta.getTime() - ahora.getTime()) / (1000 * 60 * 60);

  // --- Lógica diferenciada por tipo de cliente ---

  // Abonado: 48hs | No abonado: 24hs
  const sinAntelacionAbonado = esAbonado && diferenciaHoras < 48;
  const permiteReembolsoNoAbonado = !esAbonado && diferenciaHoras >= 24;
  const permiteReembolsoMercadoPago = !pagoConMontoAFavor;

  useEffect(() => {
    if (pagoConMontoAFavor) {
      setOpcionSeleccionada('A_FAVOR');
    }
  }, [pagoConMontoAFavor]);

  const handleConfirmar = async () => {
    // Solo validar selección para no-abonados con reembolso permitido
    if (!esAbonado && permiteReembolsoNoAbonado && !opcionSeleccionada) {
      setErrorMensaje('Por favor, seleccioná qué deseas hacer con tu dinero.');
      return;
    }

    setLoading(true);
    setErrorMensaje(null);

    try {
      let tipoReembolso: TipoReembolso;

      if (esAbonado) {
        // Abonado: REEMBOLSO si >=48hs, NINGUNO si <48hs
        tipoReembolso = sinAntelacionAbonado ? 'NINGUNO' : 'REEMBOLSO';
      } else {
        // No abonado: usa la opción seleccionada o NINGUNO si no tiene reembolso
        tipoReembolso = permiteReembolsoNoAbonado
          ? opcionSeleccionada!
          : 'NINGUNO';
      }

      const payload = { clienteId, claseId, tipoReembolso };
      const result = await cancelarTurnoRequest(payload);
      onCancelSuccess(result.message);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo cancelar el turno.';
      setErrorMensaje(message);
    } finally {
      setLoading(false);
    }
  };

  // --- Bloque informativo para abonados ---
  const renderInfoAbonado = () => {
    if (sinAntelacionAbonado) {
      return (
        <div className="mb-8 p-5 bg-amber-50 text-amber-800 rounded-2xl">
          <p className="font-bold mb-2">Cancelación con menos de 48hs</p>
          <p className="text-sm font-medium">
            No se devolverá tu seña por cancelar con menos de 48 horas de anticipación.
          </p>
        </div>
      );
    }

    return (
      <div className="mb-8 p-5 bg-main/5 text-slate-700 rounded-2xl">
        <p className="font-bold mb-2 text-dark-accent">Reembolso asegurado</p>
        <p className="text-sm font-medium">
          Al cancelar con más de 48 horas de antelación, se iniciará un reembolso automático por $5000 a través de Mercado Pago.
        </p>
      </div>
    );
  };

  // --- Bloque de opciones para no-abonados ---
  const renderOpcionesNoAbonado = () => {
    if (permiteReembolsoNoAbonado) {
      return (
        <div className="mb-8">
          <p className="text-sm text-slate-600 mb-4 font-medium">
            Estás cancelando con más de 24 horas de antelación. Por favor, seleccioná una opción:
          </p>
          <div className="flex flex-col gap-3">
            <div className="group relative">
              <label
                className={`flex items-center p-4 rounded-2xl transition-all duration-200 ${
                  permiteReembolsoMercadoPago
                    ? opcionSeleccionada === 'REEMBOLSO'
                      ? 'bg-white shadow-md scale-[1.02] ring-1 ring-main/20 cursor-pointer'
                      : 'bg-surface hover:bg-main/5 cursor-pointer'
                    : 'bg-surface opacity-50 cursor-not-allowed'
                }`}
              >
                <input
                  type="radio"
                  name="reembolso"
                  value="REEMBOLSO"
                  className="sr-only"
                  disabled={!permiteReembolsoMercadoPago || loading}
                  checked={opcionSeleccionada === 'REEMBOLSO'}
                  onChange={() => setOpcionSeleccionada('REEMBOLSO')}
                />
                <span
                  className={`font-semibold ${
                    opcionSeleccionada === 'REEMBOLSO' ? 'text-main' : 'text-slate-600'
                  }`}
                >
                  Exigir reembolso
                </span>
              </label>
              {!permiteReembolsoMercadoPago ? (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-xl bg-dark-accent px-3 py-2 text-center text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
                >
                  {TOOLTIP_REEMBOLSO_MP}
                </span>
              ) : null}
            </div>
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
                checked={opcionSeleccionada === 'A_FAVOR'}
                disabled={loading}
                onChange={() => setOpcionSeleccionada('A_FAVOR')}
              />
              <span
                className={`font-semibold ${
                  opcionSeleccionada === 'A_FAVOR' ? 'text-main' : 'text-slate-600'
                }`}
              >
                Dejar monto a favor
              </span>
            </label>
          </div>
        </div>
      );
    }

    // No abonado, menos de 24hs
    return (
      <div className="mb-8 p-5 bg-red-50 text-red-700 rounded-2xl">
        <p className="font-bold mb-2">Cancelación fuera de término</p>
        <p className="text-sm font-medium">
          Al cancelar con menos de 24 horas de antelación, no se efectuará reembolso ni quedará monto a favor.
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
      <h2 className="text-2xl font-heading font-extrabold text-dark-accent mb-6">Cancelar Turno</h2>

      <div className="mb-6 bg-surface p-5 rounded-2xl text-slate-700">
        <p className="mb-1"><strong className="font-semibold text-dark-accent">Actividad:</strong> {actividad}</p>
        <p className="mb-1"><strong className="font-semibold text-dark-accent">Fecha:</strong> {fechaClase}</p>
        <p><strong className="font-semibold text-dark-accent">Hora:</strong> {horaClase}</p>
      </div>

      {esAbonado ? renderInfoAbonado() : renderOpcionesNoAbonado()}

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
