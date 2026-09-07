jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
jest.mock("redux-logger", () => {
  const logger = () => (next: any) => (action: any) => next(action);
  return logger;
});
// Inert persistStore to avoid the async rehydrate open handle (see store.test).
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

import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Provider } from "react-redux";
import Store from "../store";
import { success, TYPES } from "../actions";
import { useAppDispatch, useAppSelector } from "../hooks";

let hookResult: { token: string; language: string; dispatch: () => void } | undefined;

const renderProbe = () => {
  const Probe = () => {
    const token = useAppSelector((state) => state.auth.token);
    const language = useAppSelector((state) => state.language.language);
    const dispatch = useAppDispatch();
    hookResult = { token, language, dispatch: () => dispatch({ type: success(TYPES.AUTH.LOGIN), payload: { token: "t1" } }) };
    return null;
  };
  act(() => {
    TestRenderer.create(
      <Provider store={Store.store}>
        <Probe />
      </Provider>
    );
  });
};

beforeEach(() => {
  hookResult = undefined;
  Store.store.dispatch({ type: success(TYPES.AUTH.LOG_OUT) });
});

describe("typed redux hooks", () => {
  it("useAppSelector reads typed slices from RootState (no `any` needed)", () => {
    renderProbe();
    expect(hookResult).toMatchObject({ token: "", language: "en" });
  });

  it("useAppDispatch dispatches an action that updates the store", () => {
    renderProbe();
    act(() => hookResult!.dispatch());
    expect(Store.store.getState().auth.token).toBe("t1");
  });
});
