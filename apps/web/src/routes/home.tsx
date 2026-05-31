import { createFileRoute } from "@tanstack/react-router";
import { UserDashboard } from "@/modules/home/components/UserDashboard";

export const Route = createFileRoute("/home")({
  component: UserDashboard
});
