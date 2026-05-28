import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { AppProviders } from "./providers";
import { router } from "./router";
import { Toaster } from "./components/ui/sonner";
import "./globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
      <Toaster />
    </AppProviders>
  </React.StrictMode>
);
