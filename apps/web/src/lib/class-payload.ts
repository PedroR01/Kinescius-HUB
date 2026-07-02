import type { KinesciusClass } from "@/lib/class-interface";
import { formatDate, formatTime } from "@/lib/utils";

export type ClassPayload = {
  id: number;
  fecha: string;
  hora: string;
};

export function buildClassPayload(clase: KinesciusClass): ClassPayload {
  return {
    id: clase.id,
    fecha: formatDate(clase.fecha),
    hora: formatTime(clase.hora),
  };
}
