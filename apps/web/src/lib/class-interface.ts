export interface Class{
    id: number;
    fecha: string;
    hora: string;
    tipo: string | null;
    cupo: number | null;
    QR: string | null;
    id_listaEspera: number | null;
    id_profesor: number | null;
    id_administrador: number | null;
  };

  export interface ClassSlot{
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
    source: Class;
  };