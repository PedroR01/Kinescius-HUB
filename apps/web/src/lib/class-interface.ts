export interface KinesciusClass {
  id: number
  fecha: string
  hora: string
  tipo: string
  profesor: string // Unificar nombre y apellido
  cupo: number;
};

export interface ClassToken extends KinesciusClass {
  QR: string;
  id_listaEspera: number;
  id_profesor: number;
  id_administrador: number;
}

export interface ClassSlot {
  key: string;
  date: string;
  dateLabel: string;
  dayLabel: string;
  time: string;
  className: string;
  price: number;
  cupo: number;
  full: boolean;
  sinCupo: boolean;
  favorAmount: number;
  source: KinesciusClass;
  profesor: string | null; // ← NUEVO
};