import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { recordRouteChange } from "@/lib/navigation-history";

export function NavigationHistoryTracker() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    recordRouteChange(pathname);
  }, [pathname]);

  return null;
}
