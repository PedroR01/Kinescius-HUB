import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(fecha: string) {
  const [year, month, day] = fecha.split("T")[0].split("-").map(Number);
  return `${day}/${month}/${year}`;
}

export function formatDateLabel(fecha: string) {
  const [, month, day] = fecha.split("T")[0].split("-").map(Number);
  return `${day}/${month}`;
}

export function formatDayLabel(fecha: string) {
  const date = new Date(fecha.split("T")[0] + "T12:00:00");
  return date
    .toLocaleDateString("es-AR", { weekday: "short" })
    .replace(".", "")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function formatTime(hora: string) {
  const [hh, mm] = hora.split(":");
  return `${hh}:${mm}`;
}
