// Per-endpoint axios response routing for the characterization suites: the
// legacy callbacks read endpoint-specific fields (JSON-stringified extra
// services, subscription plan maps, notification payload strings), so a single
// generic envelope cannot satisfy every screen. Suites install a URL→payload
// map; unlisted URLs fall back to the shared default envelope.
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
};
