import path from "node:path";
import { copyFileSync, existsSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

const API_TARGET = process.env.VITE_API_URL ?? "http://localhost:3000";

function copyQrScannerWorker() {
  const source = path.resolve(__dirname, "node_modules/qr-scanner/qr-scanner-worker.min.js");
  const destination = path.resolve(__dirname, "public/qr-scanner-worker.min.js");

  return {
    name: "copy-qr-scanner-worker",
    buildStart() {
      if (existsSync(source)) {
        copyFileSync(source, destination);
      }
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [tailwindcss(), tanstackRouter(), react(), copyQrScannerWorker()],
  server: {
    proxy: {
      "/auth": API_TARGET,
      "/admin": API_TARGET,
      "/shifts": API_TARGET,
      "/clases": API_TARGET,
      "/api": API_TARGET,
      "/listaEspera": API_TARGET,
      "/confirmar-turno": API_TARGET,
      "/asistencia": API_TARGET,
    },
    allowedHosts: [".ngrok-free.app"],
  },
});
