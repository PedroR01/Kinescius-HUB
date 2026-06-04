import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pagarClase")({
  beforeLoad: () => {
    throw redirect({ to: "/solicitarTurno" });
  },
});
