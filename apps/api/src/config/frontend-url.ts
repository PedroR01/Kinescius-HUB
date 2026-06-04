const DEFAULT_FRONTEND_URL = "http://localhost:5173";

export function getFrontendUrl(): string {
  const raw = process.env.FRONTEND_URL?.trim() || DEFAULT_FRONTEND_URL;
  return raw.replace(/\/$/, "");
}
