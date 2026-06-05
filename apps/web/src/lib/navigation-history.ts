let currentPathname: string | null = null;
let previousPathname: string | null = null;

export function recordRouteChange(pathname: string): void {
  if (currentPathname !== null && currentPathname !== pathname) {
    previousPathname = currentPathname;
  }
  currentPathname = pathname;
}

export function getPreviousRoutePath(fallbackRoute = "/home"): string {
  return previousPathname ?? fallbackRoute;
}
