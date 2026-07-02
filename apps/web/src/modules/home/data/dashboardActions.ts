export type DashboardAction = {
  label: string;
  to: string;
  description?: string;
};

const ADMIN_ACTIONS: DashboardAction[] = [
  { label: "Ver lista de espera", to: "/listaEspera" },
  { label: "Crear clase", to: "/crearClase" },
  { label: "Cancelar clase", to: "/cancelarClase" },
  { label: "Ver clientes", to: "/clientes" },
  { label: "Ver clases creadas", to: "/verClases" },
  { label: "Cambiar profesor", to: "/cambiarProfesor" },
  { label: "Ver inscriptos", to: "/verInscriptos" },
  { label: "Cargar profesor", to: "/cargarProfesor" },
  { label: "Ver estado de suscripción", to: "/estadoSuscripcion" }

];

const USER_ACTIONS: DashboardAction[] = [
  {
    label: "Solicitar turno",
    to: "/solicitarTurno",
    description: "Reservá tu próxima clase en el centro"
  },
  {
    label: "Mis clases",
    to: "/mis-clases",
    description: "Ver tus clases agendadas"
  },
  {
    label: "Escanear asistencia",
    to: "/escanear-asistencia",
    description: "Registrá tu presencia con la cámara"
  }
];

const PROFESOR_ACTIONS: DashboardAction[] = [
  {
    label: "Generar QR de asistencia",
    to: "/profesor",
    description: "Mostrá el código QR para que los clientes pasen asistencia"
  }
];

const SHARED_ACTIONS: DashboardAction[] = [
  { label: "Cambiar contraseña", to: "/cambiarPasswd" }
];

export function getDashboardActions(
  role: "admin" | "usuario" | "profesor" | null,
): DashboardAction[] {
  if (role === "admin") {
    return [...ADMIN_ACTIONS, ...SHARED_ACTIONS];
  }

  if (role === "profesor") {
    return [...PROFESOR_ACTIONS, ...SHARED_ACTIONS];
  }

  return [...USER_ACTIONS, ...SHARED_ACTIONS];
}