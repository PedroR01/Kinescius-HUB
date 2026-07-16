// Importo useMutation de React Query
import { useMutation } from '@tanstack/react-query';
import { editarQueja, LibroQuejasApiError } from '../services/libroQuejas.service';
import type {
  EditarQuejaPayload,
  EditarQuejaResponse,
} from '../services/libroQuejas.service';

export function useEditarQueja() {
  return useMutation<EditarQuejaResponse, LibroQuejasApiError, EditarQuejaPayload>({
    mutationFn: editarQueja,
  });
}