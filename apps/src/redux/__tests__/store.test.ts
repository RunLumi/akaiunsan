jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
jest.mock("redux-logger", () => {
  const logger = () => (next: any) => (action: any) => next(action);
  return logger;
});
jest.mock("redux-persist", () => {
  const actual = jest.requireActual("redux-persist");
  return {
    ...actual,
    persistStore: () => ({
      pause: jest.fn(),
      flush: jest.fn(),
      purge: jest.fn(),
    }),
  };
});

import Store from "../store";
import { buildMiddleware, migrateLanguageToVi } from "../store";
import logger from "redux-logger";
import { success, TYPES } from "../actions";

describe("persist migration: language th → vi", () => {
  it("remaps a persisted Thai locale to Vietnamese on version < 1 state", async () => {
    const migrated: any = await migrateLanguageToVi(
      { language: { language: "th" }, auth: { token: "t" } },
      0
    );
    expect(migrated.language.language).toBe("vi");
    expect(migrated.auth.token).toBe("t");
  });

  it("leaves English and already-migrated state untouched", async () => {
    const en = { language: { language: "en" } };
    await expect(migrateLanguageToVi(en, 0)).resolves.toBe(en);
    const vi = { language: { language: "vi" } };
    await expect(migrateLanguageToVi(vi, 1)).resolves.toBe(vi);
    await expect(migrateLanguageToVi(undefined, 0)).resolves.toBeUndefined();
  });
});

describe("store characterization", () => {
  it("exposes a working store and persistor", () => {
    expect(Store.store).toBeDefined();
    expect(Store.persistor).toBeDefined();
    expect(Store.store.getState()).toHaveProperty("auth");
    expect(Store.store.getState()).toHaveProperty("language");
    expect(Store.store.getState()).toHaveProperty("tools");
    // Phase 5: the RTK Query api slice lives in the persisted root too
    expect(Store.store.getState()).toHaveProperty("api");
  });

  // pins current behavior (Phase 5): redux-logger is wired ONLY behind the
  // dev gate now — the pre-Phase-5 store applied it unconditionally.
  it("pins: redux-logger middleware is dev-only", () => {
    const getDefaultMiddleware = (() => []) as any;
    expect(buildMiddleware(true)(getDefaultMiddleware)).toContain(logger);
    expect(buildMiddleware(false)(getDefaultMiddleware)).not.toContain(logger);
  });

  it("dispatching LOGIN success updates auth.token (the navigation gate input)", () => {
    Store.store.dispatch({
      type: success(TYPES.AUTH.LOGIN),
      payload: { token: "tok-store" },
    });
    expect(Store.store.getState().auth.token).toBe("tok-store");
  });

  it("dispatching LOG_OUT resets auth through the logout middleware", () => {
    const before = Store.store.getState().auth.token;
    expect(before).toBe("tok-store");
    Store.store.dispatch({ type: TYPES.AUTH.LOG_OUT });
    expect(Store.store.getState().auth.token).toBe("");
  });
});
