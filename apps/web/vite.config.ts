import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  plugins: [tailwindcss(), tanstackRouter(), react(),],
  server: {
    proxy: {
      "/clases": "http://localhost:3000",
      "/api": "http://localhost:3000"
    }
  }
});