import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <div style={{ background: "#ffffff", color: "#0d1f18", minHeight: "100vh" }}>
      <Outlet />
    </div>
  ),
});

