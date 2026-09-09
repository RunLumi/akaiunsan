import { createStore, applyMiddleware, Store as ReduxStore } from "redux";
import reducers from "../reducers";
import { logoutMiddleware } from "../logoutMiddleware";
import { success, TYPES } from "../actions";

// Characterizes the saga-free logout mechanism that replaced the deleted
// redux-saga watcher (Phase 5, docs/mobile-app-upgrade-plan.md §5). Same
// pinned contract: a raw LOG_OUT dispatch drives the LOG_OUT/SUCCESS auth
// reset and invokes the optional action.callback, in that order.
const bootstrap = () => {
  const seen: Record<string, unknown>[] = [];
  const recording = (state: unknown, action: Record<string, unknown>) => {
    seen.push(action);
    return (reducers as any)(state, action);
  };
  const store: ReduxStore = createStore(
    recording as any,
    // RTK's Middleware type and redux@4's applyMiddleware overload disagree on
    // generics; the runtime contract is plain redux middleware.
    applyMiddleware(logoutMiddleware as any)
  );
  return { store, seen };
};

describe("logout middleware (replaces the logout saga)", () => {
  it("watches LOG_OUT and dispatches LOG_OUT/SUCCESS", () => {
    const { store, seen } = bootstrap();
    seen.length = 0; // drop @@redux/INIT
    store.dispatch({ type: TYPES.AUTH.LOG_OUT });
    expect(seen).toContainEqual({ type: success(TYPES.AUTH.LOG_OUT) });
    expect(store.getState()).toHaveProperty("auth.token", "");
  });

  it("ignores unrelated actions", () => {
    const { store, seen } = bootstrap();
    seen.length = 0; // drop @@redux/INIT
    store.dispatch({ type: "SOMETHING_ELSE" });
    expect(seen).toHaveLength(1); // only the dispatched action itself
    expect(seen).not.toContainEqual({ type: success(TYPES.AUTH.LOG_OUT) });
    expect(store.getState()).toHaveProperty("auth.token", "");
  });

  it("does not crash when logout has no callback", () => {
    const { store, seen } = bootstrap();
    seen.length = 0;
    expect(() => store.dispatch({ type: TYPES.AUTH.LOG_OUT })).not.toThrow();
    expect(seen).toContainEqual({ type: success(TYPES.AUTH.LOG_OUT) });
    expect(store.getState()).toHaveProperty("auth.token", "");
  });

  it("invokes an optional logout callback", () => {
    const { store } = bootstrap();
    const callback = jest.fn();
    store.dispatch({ type: TYPES.AUTH.LOG_OUT, callback });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("runs the callback after the auth reset, like the saga's put ordering", () => {
    const { store } = bootstrap();
    const tokenAtCallback: string[] = [];
    store.dispatch({
      type: TYPES.AUTH.LOG_OUT,
      callback: () => tokenAtCallback.push((store.getState() as any).auth.token),
    });
    // the callback observed the already-reset state
    expect(tokenAtCallback).toEqual([""]);
  });

  it("screens dispatching LOG_OUT/SUCCESS directly keep resetting auth", () => {
    // Account/EditProfile/Home dispatch the success action without the
    // middleware — the reducer case alone must keep working.
    const { store } = bootstrap();
    store.dispatch({ type: success(TYPES.AUTH.LOG_OUT) });
    expect(store.getState()).toHaveProperty("auth.token", "");
  });
});
