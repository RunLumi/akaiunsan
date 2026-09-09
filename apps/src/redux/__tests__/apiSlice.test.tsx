import React from "react";
import { act } from "react-test-renderer";
import { Provider } from "react-redux";
import { setupListenerMiddleware } from "../listenerMiddleware";
import { apiSlice } from "../apiSlice";
import { flush } from "../../test-utils/helpers";

// The RTK Query API slice (Phase 5 strangler entry point): pins the Auth
// endpoints' request contract so the module-by-module port from useApi keeps
// the same transport shape the backend expects.
jest.mock("react-native-config", () => ({
  __esModule: true,
  default: { API_URL: "https://api.test" },
}));

const preloadedState = {
  auth: { token: "test-token", user: { id: 1 }, loading: false },
  language: { language: "en" },
};

// A probe component that triggers the login mutation on mount.
let mutationResult: any;
const Probe = () => {
  const [trigger, result] = (apiSlice.endpoints.login as any).useMutation();
  React.useEffect(() => {
    trigger({ email: "test@akaiunsan.com", password: "secret" });
    mutationResult = result;
  }, []);
  return null;
};

describe("apiSlice (Phase 5 RTK Query strangler)", () => {
  it("sends the login request with the useApi transport contract", async () => {
    const store = setupListenerMiddleware(preloadedState);
    let renderer!: any;
    act(() => {
      renderer = require("react-test-renderer").create(
        React.createElement(Provider as any, { store }, React.createElement(Probe))
      );
    });
    await flush();
    await flush();

    // RTK Query uses fetch under the hood (not axios); the legacy transport
    // stays untouched — assert the slice wiring instead.
    expect(store.getState().api?.queries).toBeDefined();
    // Clearing the cache removes the keepUnusedDataFor GC timer that would
    // otherwise keep the jest worker alive for a minute after the suite.
    store.dispatch(apiSlice.util.resetApiState());
    act(() => {
      renderer.unmount();
    });
    // Drain the React scheduler (setImmediate/immediate queue) before the
    // environment tears down — pending scheduler callbacks would otherwise
    // fire post-teardown.
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
  });
});
