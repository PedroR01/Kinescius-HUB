// Importo useMutation de React Query
import { useMutation } from '@tanstack/react-query';
import { crearQueja, LibroQuejasApiError } from '../services/libroQuejas.service';
import type {
  CrearQuejaPayload,
  CrearQuejaResponse,
} from '../services/libroQuejas.service';

export function useCrearQueja() {
  return useMutation<CrearQuejaResponse, LibroQuejasApiError, CrearQuejaPayload>({
    mutationFn: crearQueja,
  });
}