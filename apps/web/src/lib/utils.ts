import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { KinesciusClass } from "@/lib/class-interface"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatClassLabel(clase: KinesciusClass) {
  const fecha = formatDate(clase.fecha)
  const hora = formatTime(clase.hora)
  const tipo = clase.tipo ?? 'Sin tipo'
  const profesor = clase.profesor ?? 'Sin profesor' // Unificar nombre y apellido
  return `${fecha} ${hora} — ${tipo} (${profesor})`
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

export function normalizeFecha(fecha: string) {
  const trimmed = fecha.trim();
  if (!trimmed) return '';
  if (trimmed.includes('T')) return trimmed.split('T')[0];
  if (trimmed.includes('/')) {
    const [day, month, year] = trimmed.split('/').map((part) => part.trim());
    if (day && month && year) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
}

export function getMinFecha() {
  const today = new Date();
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDate() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}