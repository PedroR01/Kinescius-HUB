import type { UserRole } from "@/modules/auth/hooks/useAuthSession";

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
  { label: "Eliminar profesor", to: "/eliminarProfesor" },
  { label: "Ver estado de suscripción", to: "/estadoSuscripcion" },
  { label: "Ver estadísticas", to: "/verEstadisticas" },
  { label: "Cambiar contraseña", to: "/cambiarPasswd" },
  {
    label: "Recordatorios",
    to: "/recordatorios",
    description: "Configurá el horario de envío automático"
  },
  {
    label: "Enviar notificación",
    to: "/notificacionManual",
    description: "Mandale un mail puntual a un cliente"
  },
  {
    label: "Ver libro de quejas",
    to: "/ver-libro-de-quejas",
    description: "Consultar comentarios y calificaciones de los clientes"
  },
  {
    label: "Ver presentismo",
    to: "/verPresentismo",
    description: "Consultá la asistencia de los alumnos por clase"

  }
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
  },
  {
    label: "Libro de quejas",
    to: "/libro-quejas",
    description: "Calificá y comentá tus clases pasadas"
  },
  {
    label: "Estado de cuenta",
    to: "/estado-cliente",
    description: "Ver información y estado de tu cuenta"
  }
];

const PROFESOR_ACTIONS: DashboardAction[] = [
  {
    label: "Mis clases",
    to: "/profesor",
    description: "Agenda de clases"
  }
];

const SHARED_ACTIONS: DashboardAction[] = [
  { label: "Cambiar contraseña", to: "/cambiarPasswd" }
];

export function getDashboardActions(
  role: UserRole | null
): DashboardAction[] {
  if (role === "admin") {
    return ADMIN_ACTIONS;
  }

  if (role === "profesor") {
    return [...PROFESOR_ACTIONS, ...SHARED_ACTIONS];
  }

  return [...USER_ACTIONS, ...SHARED_ACTIONS];
}