const DEFAULT_CORS_ORIGINS =
  "http://localhost:5173,https://*.ngrok-free.app";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function patternToRegExp(pattern: string): RegExp {
  const regexSource = escapeRegExp(pattern).replace(/\\\*/g, ".*");
  return new RegExp(`^${regexSource}$`, "i");
}

export function parseCorsOrigins(raw?: string): string[] {
  return (raw ?? DEFAULT_CORS_ORIGINS)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isCorsOriginAllowed(
  requestOrigin: string | undefined,
  allowedPatterns: string[],
): boolean {
  if (!requestOrigin) {
    return true;
  }

  return allowedPatterns.some((pattern) => {
    if (pattern.includes("*")) {
      return patternToRegExp(pattern).test(requestOrigin);
    }
    return pattern === requestOrigin;
  });
}

export function createCorsOriginValidator(allowedPatterns: string[]) {
  return (
    requestOrigin: string | undefined,
    callback: (err: Error | null, allow?: boolean | string) => void,
  ) => {
    if (!requestOrigin || isCorsOriginAllowed(requestOrigin, allowedPatterns)) {
      callback(null, requestOrigin ?? true);
      return;
    }
    callback(new Error(`Origin ${requestOrigin} not allowed by CORS`));
  };
}
