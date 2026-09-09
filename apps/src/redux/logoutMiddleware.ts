import type { Middleware } from "@reduxjs/toolkit";
import { success, TYPES } from "./actions";

// Replaces the redux-saga logout watcher (the app's only saga, deleted in
// Phase 5) with the same observed behavior and no generator runtime: a raw
// `TYPES.AUTH.LOG_OUT` dispatch still (a) drives the auth reset through the
// LOG_OUT/SUCCESS reducer case and then (b) invokes the optional
// `action.callback` — the exact order the takeLatest effect put them in.
export const logoutMiddleware: Middleware =
  (store) => (next) => (action: any) => {
    if (action && action.type === TYPES.AUTH.LOG_OUT) {
      store.dispatch({ type: success(TYPES.AUTH.LOG_OUT) });
      if (typeof action?.callback === "function") action.callback();
      return action;
    }
    return next(action);
  };
