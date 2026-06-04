import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

const API_TARGET = process.env.VITE_API_URL ?? "http://localhost:3000";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [tailwindcss(), tanstackRouter(), react()],
  server: {
    proxy: {
      "/auth": API_TARGET,
      "/admin": API_TARGET,
      "/shifts": API_TARGET,
      "/clases": API_TARGET,
      "/api": API_TARGET,
      "/listaEspera": API_TARGET,
      "/confirmar-turno": API_TARGET,
    },
    allowedHosts: [".ngrok-free.app"],
  },
});
