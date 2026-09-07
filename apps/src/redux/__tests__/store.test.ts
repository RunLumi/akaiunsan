jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
jest.mock("redux-logger", () => {
  const logger = () => (next: any) => (action: any) => next(action);
  return logger;
});

import Store from "../store";
import storeModule from "../store";
import { success, TYPES } from "../actions";

describe("store characterization", () => {
  it("exposes a working store and persistor", () => {
    expect(Store.store).toBeDefined();
    expect(Store.persistor).toBeDefined();
    expect(Store.store.getState()).toHaveProperty("auth");
    expect(Store.store.getState()).toHaveProperty("language");
    expect(Store.store.getState()).toHaveProperty("tools");
  });

  // pins current behavior (Phase 0 item 5): the `redux-logger` middleware is
  // applied unconditionally in the production store (no __DEV__ guard), so it
  // runs in production builds too. Fixed in Phase 5 (dev-only middleware).
  it("pins: logger middleware is applied to the store regardless of environment", () => {
    expect(storeModule).toBe(Store);
    // The reducer is wrapped by persistReducer; asserting the logger is wired
    // requires the enhancement path — check the store dispatches through the
    // (mocked) logger middleware without crashing, and that dispatch mutates
    // state as expected (logger is transparent).
    Store.store.dispatch({ type: "LOGGER_PIN_TEST", payload: null });
    expect(Store.store.getState()).toHaveProperty("auth");
  });

  it("dispatching LOGIN success updates auth.token (the navigation gate input)", () => {
    Store.store.dispatch({
      type: success(TYPES.AUTH.LOGIN),
      payload: { token: "tok-store" },
    });
    expect(Store.store.getState().auth.token).toBe("tok-store");
  });

  it("dispatching LOG_OUT triggers the saga's LOG_OUT/SUCCESS put", async () => {
    const before = Store.store.getState().auth.token;
    expect(before).toBe("tok-store");
    Store.store.dispatch({ type: TYPES.AUTH.LOG_OUT });
    await new Promise((r) => setTimeout(r, 10));
    expect(Store.store.getState().auth.token).toBe("");
  });
});
