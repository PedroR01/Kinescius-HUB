import type { Class } from "@/lib/class-interface";
import { formatDate, formatTime } from "@/lib/utils";

export type ClasePayload = {
  id: number;
  fecha: string;
  hora: string;
};

export function buildClasePayload(clase: Class): ClasePayload {
  return {
    id: clase.id,
    fecha: formatDate(clase.fecha),
    hora: formatTime(clase.hora),
  };
}
