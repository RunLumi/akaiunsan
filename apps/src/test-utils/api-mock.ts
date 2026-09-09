// Per-endpoint response routing for the characterization suites. During the
// Phase 5 strangler this serves BOTH transports with identical payloads:
//  - axios (useApi on not-yet-ported screens) via the wrapped envelope,
//  - fetch (RTK Query on ported screens) via the fetch-mock route table,
//    where the body IS the payload (RTK serves direct JSON bodies).
// After useApi is deleted the axios leg disappears.
import { installFetchRoutes, setFetchFallback } from "./fetch-mock";

export const defaultEnvelope = (data: any = {}) => ({
  status: 200,
  data: { data, errors: [] },
});

export const installApiRoutes = (
  axiosMock: any,
  routes: Record<string, any>,
  fallbackData?: any
) => {
  axiosMock.mockImplementation((config: any) => {
    const url = config?.url || "";
    if (routes[url] !== undefined) {
      return Promise.resolve(defaultEnvelope(routes[url]));
    }
    return Promise.resolve(defaultEnvelope(fallbackData));
  });
  installFetchRoutes(routes);
  if (fallbackData !== undefined) {
    setFetchFallback(fallbackData);
  }
};
