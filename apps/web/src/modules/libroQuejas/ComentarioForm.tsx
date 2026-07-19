// Hook de React para manejar estado local del formulario
import { useState } from 'react';

// Componente de estrellas para la calificación
import { StarRating } from './StarRating';

// Hooks que conectan con la API (React Query mutations)
import { useCrearQueja } from '../../hooks/useCrearQueja';
import { useEditarQueja } from '../../hooks/useEditarQueja';
import { useEliminarQueja } from '../../hooks/useEliminarQueja';

// Límite máximo de caracteres para el comentario
const MAX_COMENTARIO = 500;

// Props que recibe el componente desde el padre
interface ComentarioFormProps {
  idCliente: number;     // cliente que deja el comentario
  idClase: number;       // clase que se está evaluando
  claseNombre?: string;  // nombre opcional de la clase
  claseFecha?: string;   // fecha opcional de la clase
  onSuccess?: () => void; // callback opcional cuando se envía/edita con éxito
  onEliminado?: () => void; // callback opcional cuando se elimina con éxito

  // Si vienen estos dos, el form arranca en modo edición
  comentarioExistente?: string;
  calificacionExistente?: number;
}

export function ComentarioForm({
  idCliente,
  idClase,
  claseNombre,
  claseFecha,
  onSuccess,
  onEliminado,
  comentarioExistente,
  calificacionExistente,
}: ComentarioFormProps) {

  const esEdicion = comentarioExistente !== undefined && calificacionExistente !== undefined;

  // Estado para la calificación (1 a 5)
  const [calificacion, setCalificacion] = useState(calificacionExistente ?? 0);

  // Estado para el texto del comentario
  const [comentario, setComentario] = useState(comentarioExistente ?? '');

  // Estado para errores de validación del frontend
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Estado para confirmar antes de eliminar
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

  // Mutations de React Query
  const crear = useCrearQueja();
  const editar = useEditarQueja();
  const eliminar = useEliminarQueja();

  const isPending = esEdicion ? editar.isPending : crear.isPending;
  const isSuccess = esEdicion ? editar.isSuccess : crear.isSuccess;
  const error = esEdicion ? editar.error : crear.error;

  /**
   * Maneja el envío del formulario (crear o editar según el modo)
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // evita recarga de la página
    setErrorValidacion(null); // limpio errores previos

    // Validación: debe haber calificación
    if (calificacion === 0) {
      setErrorValidacion('Elegí una calificación antes de enviar.');
      return;
    }

    // Validación: comentario no puede estar vacío
    if (comentario.trim().length === 0) {
      setErrorValidacion('Contanos brevemente qué te pareció la clase.');
      return;
    }

    if (esEdicion) {
      editar.mutate(
        { idCliente, idClase, comentario, calificacion },
        { onSuccess },
      );
    } else {
      crear.mutate(
        {
          id_cliente: idCliente,
          id_clase: idClase,
          comentario,
          calificacion,
        },
        { onSuccess },
      );
    }
  }

  /**
   * Maneja la eliminación del comentario
   */
  function handleEliminar() {
    eliminar.mutate(
      { idCliente, idClase },
      { onSuccess: onEliminado },
    );
  }

  /**
   * Si el envío fue exitoso, muestro pantalla de agradecimiento
   */
  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-[#DCD9AE] bg-[#FBFAEF] p-8 text-center">

        {/* Ícono de éxito */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#5B7A3A]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-[#FBFAEF]" fill="none" strokeWidth={2}>
            <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Mensaje de éxito */}
        <h3 className="text-lg font-semibold text-[#2F3B1F]">
          {esEdicion ? 'Comentario actualizado' : 'Gracias por tu comentario'}
        </h3>

        <p className="mt-1 text-sm text-[#6B7A52]">
          Tu opinión nos ayuda a mejorar cada clase.
        </p>
      </div>
    );
  }

  /**
   * Formulario principal (estado normal)
   */
  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#DCD9AE] bg-[#FBFAEF] p-6 sm:p-8"
    >

      {/* Título del formulario */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#2F3B1F]">
          {esEdicion ? 'Editá tu comentario' : '¿Cómo estuvo la clase?'}
        </h2>

        {/* Info opcional de la clase */}
        {(claseNombre || claseFecha) && (
          <p className="mt-1 text-sm text-[#6B7A52]">
            {claseNombre}
            {claseNombre && claseFecha ? ' · ' : ''}
            {claseFecha}
          </p>
        )}
      </div>

      {/* Rating de estrellas */}
      <div className="mb-6">
        <StarRating
          value={calificacion}
          onChange={(n) => {
            setCalificacion(n);
            setErrorValidacion(null); // limpio error si el usuario corrige
          }}
          readOnly={isPending}
        />
      </div>

      {/* Textarea del comentario */}
      <div className="mb-2">
        <label
          htmlFor="comentario"
          className="mb-2 block text-sm font-medium text-[#2F3B1F]"
        >
          Comentario
        </label>

        <textarea
          id="comentario"
          value={comentario}
          onChange={(e) => {
            // limito cantidad de caracteres
            setComentario(e.target.value.slice(0, MAX_COMENTARIO));
            setErrorValidacion(null);
          }}
          disabled={isPending}
          rows={4}
          placeholder="Contanos qué te gustó o qué podríamos mejorar"
          className="w-full resize-none rounded-lg border border-[#DCD9AE] bg-white px-3 py-2 text-sm text-[#2F3B1F] placeholder:text-[#A3AE84] outline-none transition-colors focus:border-[#5B7A3A] focus:ring-2 focus:ring-[#5B7A3A]/20 disabled:opacity-50"
        />

        {/* contador de caracteres */}
        <div className="mt-1 text-right text-xs text-[#A3AE84]">
          {comentario.length}/{MAX_COMENTARIO}
        </div>
      </div>

      {/* Errores de validación o de API */}
      {(errorValidacion || error || eliminar.error) && (
        <p role="alert" className="mb-4 text-sm text-[#A34B2A]">
          {errorValidacion ?? error?.message ?? eliminar.error?.message}
        </p>
      )}

      {/* Botones */}
      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-[#5B7A3A] px-4 py-2.5 text-sm font-medium text-[#FBFAEF] transition-colors hover:bg-[#4A6530] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B7A3A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? (esEdicion ? 'Guardando…' : 'Enviando…')
            : (esEdicion ? 'Guardar cambios' : 'Enviar comentario')}
        </button>

        {esEdicion && (
          confirmandoEliminar ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleEliminar}
                disabled={eliminar.isPending}
                className="flex-1 rounded-lg bg-[#A34B2A] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8a3f22] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {eliminar.isPending ? 'Eliminando…' : 'Confirmar eliminación'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoEliminar(false)}
                disabled={eliminar.isPending}
                className="flex-1 rounded-lg border border-[#DCD9AE] px-4 py-2.5 text-sm font-medium text-[#2F3B1F] transition-colors hover:bg-[#F3F1DD]"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoEliminar(true)}
              className="w-full rounded-lg border border-[#A34B2A]/40 px-4 py-2.5 text-sm font-medium text-[#A34B2A] transition-colors hover:bg-[#A34B2A]/10"
            >
              Eliminar comentario
            </button>
          )
        )}
      </div>
    </form>
  );
}