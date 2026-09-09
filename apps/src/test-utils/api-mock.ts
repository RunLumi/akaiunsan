// Per-endpoint response routing for the characterization suites. Since the
// Phase 5 completion every screen reads RTK Query over the global fetch stub,
// so routes are fetch bodies (the payload itself, no axios envelope) and the
// optional fallback serves any endpoint a suite does not list.
import { installFetchRoutes, setFetchFallback } from "./fetch-mock";

export const installApiRoutes = (
  routes: Record<string, any>,
  fallbackData?: any
) => {
  installFetchRoutes(routes);
  if (fallbackData !== undefined) {
    setFetchFallback(fallbackData);
  }
};
