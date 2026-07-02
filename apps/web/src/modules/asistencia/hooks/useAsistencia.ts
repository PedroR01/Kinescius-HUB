import { useMutation } from "@tanstack/react-query";
import {
  generarTokenAsistencia,
  registrarAsistencia,
  getAsistenciaClase,
  getClasesProfesor,
} from "@/api/asistencia";

export function useGenerarTokenAsistencia() {
  return useMutation({
    mutationFn: ({
      claseId,
      authToken,
    }: {
      claseId: number;
      authToken: string;
    }) => generarTokenAsistencia(claseId, authToken),
  });
}

export function useRegistrarAsistencia() {
  return useMutation({
    mutationFn: ({
      token,
      authToken,
    }: {
      token: string;
      authToken: string;
    }) => registrarAsistencia(token, authToken),
  });
}

export function useAsistenciaClase() {
  return useMutation({
    mutationFn: ({
      claseId,
      authToken,
    }: {
      claseId: number;
      authToken: string;
    }) => getAsistenciaClase(claseId, authToken),
  });
}

export function useClasesProfesor() {
  return useMutation({
    mutationFn: (authToken: string) => getClasesProfesor(authToken),
  });
}
