import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [tanstackRouter(), react()],
  server: {
    proxy: {
      "/clases": "http://localhost:3000",
      "/api": "http://localhost:3000"
    }
  }
});