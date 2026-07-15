const ARGENTINA_OFFSET = '-03:00';

export function parseClaseStartDate(fecha: string, hora: string): Date {
  const horaNormalized = hora.slice(0, 5);
  return new Date(`${fecha}T${horaNormalized}:00${ARGENTINA_OFFSET}`);
}

export function buildAttendanceWindow(fecha: string, hora: string) {
  const claseStart = parseClaseStartDate(fecha, hora);
  const validFrom = new Date(claseStart.getTime() - 10 * 60 * 1000);
  const expiresAt = new Date(claseStart.getTime() + 15 * 60 * 1000);

  return { claseStart, validFrom, expiresAt };
}
