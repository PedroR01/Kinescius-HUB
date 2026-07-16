// Importo useMutation de React Query
import { useMutation } from '@tanstack/react-query';
import { eliminarQueja, LibroQuejasApiError } from '../services/libroQuejas.service';
import type {
  EliminarQuejaPayload,
  EliminarQuejaResponse,
} from '../services/libroQuejas.service';

export function useEliminarQueja() {
  return useMutation<EliminarQuejaResponse, LibroQuejasApiError, EliminarQuejaPayload>({
    mutationFn: eliminarQueja,
  });
}