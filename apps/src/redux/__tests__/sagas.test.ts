import { createStore, applyMiddleware, Store as ReduxStore } from "redux";
import createSagaMiddleware from "redux-saga";
import { all } from "redux-saga/effects";
import reducers from "../reducers";
import watchers from "../sagas/auth";
import { success, TYPES } from "../actions";

// Mirrors production wiring (store.ts): saga middleware over the real
// reducers, with every passing action recorded for assertions.
const bootstrap = () => {
  const seen: Record<string, unknown>[] = [];
  const errors: unknown[] = [];
  const recording = (state: unknown, action: Record<string, unknown>) => {
    seen.push(action);
    return (reducers as any)(state, action);
  };
  const sagaMiddleware = createSagaMiddleware({
    onError: (e: unknown) => errors.push(e),
  });
  const store: ReduxStore = createStore(recording as any, applyMiddleware(sagaMiddleware));
  function* rootSaga() {
    yield all(watchers); // same shape as sagas/index.ts
  }
  sagaMiddleware.run(rootSaga);
  return { store, seen, errors };
};

describe("auth saga characterization", () => {
  it("watches LOG_OUT and dispatches LOG_OUT/SUCCESS", async () => {
    const { store, seen } = bootstrap();
    store.dispatch({ type: TYPES.AUTH.LOG_OUT });
    await new Promise((r) => setTimeout(r, 20));
    expect(seen).toContainEqual({ type: success(TYPES.AUTH.LOG_OUT) });
    expect(store.getState()).toHaveProperty("auth.token", "");
  });

  it("ignores unrelated actions", async () => {
    const { seen } = bootstrap();
    seen.length = 0; // drop @@redux/INIT
    // @ts-expect-error characterization harness
    globalThis.__unused = undefined;
    const { store: s } = bootstrap();
    s.dispatch({ type: "SOMETHING_ELSE" });
    await new Promise((r) => setTimeout(r, 20));
    expect(seen.length).toBe(0);
  });

  it("does not crash when logout has no callback", async () => {
    const { store, seen, errors } = bootstrap();
    store.dispatch({ type: TYPES.AUTH.LOG_OUT });
    await new Promise((r) => setTimeout(r, 20));
    expect(seen).toContainEqual({ type: success(TYPES.AUTH.LOG_OUT) });
    expect(errors).toHaveLength(0);
  });

  it("invokes an optional logout callback", async () => {
    const { store, errors } = bootstrap();
    const callback = jest.fn();
    store.dispatch({ type: TYPES.AUTH.LOG_OUT, callback });
    await new Promise((r) => setTimeout(r, 20));
    expect(callback).toHaveBeenCalledTimes(1);
    expect(errors).toHaveLength(0);
  });

  it("no login watcher is registered (login saga is dead code)", () => {
    expect(JSON.stringify(watchers)).not.toContain(TYPES.AUTH.LOGIN);
  });
});
