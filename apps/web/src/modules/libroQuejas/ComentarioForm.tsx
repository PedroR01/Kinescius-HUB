// Hook de React para manejar estado local del formulario
import { useState } from 'react';

// Componente de estrellas para la calificación
import { StarRating } from './StarRating';

// Hook que conecta con la API (React Query mutation)
import { useCrearQueja } from '../../hooks/useCrearQueja';

// Límite máximo de caracteres para el comentario
const MAX_COMENTARIO = 500;

// Props que recibe el componente desde el padre
interface ComentarioFormProps {
  idCliente: number;     // cliente que deja el comentario
  idClase: number;       // clase que se está evaluando
  claseNombre?: string;  // nombre opcional de la clase
  claseFecha?: string;   // fecha opcional de la clase
  onSuccess?: () => void; // callback opcional cuando se envía con éxito
}

export function ComentarioForm({
  idCliente,
  idClase,
  claseNombre,
  claseFecha,
  onSuccess,
}: ComentarioFormProps) {

  // Estado para la calificación (1 a 5)
  const [calificacion, setCalificacion] = useState(0);

  // Estado para el texto del comentario
  const [comentario, setComentario] = useState('');

  // Estado para errores de validación del frontend
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Mutation de React Query para enviar el comentario al backend
  const { mutate, isPending, isSuccess, error, reset } = useCrearQueja();

  /**
   * Maneja el envío del formulario
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

    // Llamo a la API con los datos del formulario
    mutate(
      {
        id_cliente: idCliente,
        id_clase: idClase,
        comentario,
        calificacion,
      },
      { onSuccess }, // callback opcional del padre
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
          Gracias por tu comentario
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
          ¿Cómo estuvo la clase?
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
      {(errorValidacion || error) && (
        <p role="alert" className="mb-4 text-sm text-[#A34B2A]">
          {errorValidacion ?? error?.message}
        </p>
      )}

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={isPending}
        onClick={() => reset()} // reinicia estado de mutation
        className="w-full rounded-lg bg-[#5B7A3A] px-4 py-2.5 text-sm font-medium text-[#FBFAEF] transition-colors hover:bg-[#4A6530] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B7A3A] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Enviando…' : 'Enviar comentario'}
      </button>
    </form>
  );
}