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
  }
];

const SHARED_ACTIONS: DashboardAction[] = [
  { label: "Cambiar contraseña", to: "/cambiarPasswd" }
];

export function getDashboardActions(isAdmin: boolean): DashboardAction[] {
  const roleActions = isAdmin ? ADMIN_ACTIONS : USER_ACTIONS;
  return [...roleActions, ...SHARED_ACTIONS];
}