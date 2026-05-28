import { createFileRoute } from "@tanstack/react-router";
import { Home } from "../modules/home/Home";

export const Route = createFileRoute("/")({
  component: Home
});
