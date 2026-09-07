import React from "react";
import { createStore } from "redux";
import { Provider } from "react-redux";
import TestRenderer, { act } from "react-test-renderer";
import { Text as RNText, TouchableOpacity as RNTouchableOpacity } from "react-native";
import reducers from "../redux/reducers";

export const makeStore = (preloaded?: any) => createStore(reducers as any, preloaded);

// Flushes the resolved axios mocks so useApi callbacks run their setState.
export const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

// `act` around creation flushes the effects registered on mount (api
// auto-requests, notification listeners, etc.) just like a real commit.
const doCreate = (ui: React.ReactElement, store: any) => {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      React.createElement(Provider, { store }, ui)
    );
  });
  return renderer;
};

// Wraps the component in a real Redux store (no saga/persist) so `useSelector`
// / `useDispatch` behave like they do in the app.
export const create = (ui: React.ReactElement, preloaded?: any) =>
  doCreate(ui, makeStore(preloaded));

// Renders against a specific store instance (so dispatch assertions observe it).
export const createWithStore = (ui: React.ReactElement, store: any) =>
  doCreate(ui, store);

// ---- Host-level finders -----------------------------------------------------
// react-test-renderer reports BOTH composite component instances and their host
// primitives for the same `children` prop, so `findAllByProps` over-counts.
// Filtering on the RN primitive type keeps counts/presses deterministic.

export const toText = (children: any): string =>
  Array.isArray(children) ? children.map(toText).join("") : String(children ?? "");

// Host RN <Text> instances whose flattened children equal `text`.
export const textNodes = (root: any, text?: string) =>
  root.findAll(
    (n: any) =>
      n.type === RNText && (text === undefined || toText(n.props.children) === text)
  );

// Host RN <Text> instances whose flattened children contain `fragment`.
export const textIncluding = (root: any, fragment: string) =>
  root.findAll(
    (n: any) => n.type === RNText && toText(n.props.children).includes(fragment)
  );

// Nearest ancestor exposing an onPress handler (handles Button's nested
// TouchableOpacity > View > custom Text > host Text depth in one hop).
export const pressableFrom = (node: any) => {
  let cur = node;
  while (cur && typeof cur.props.onPress !== "function") cur = cur.parent;
  return cur;
};

// Finds the host RN TouchableOpacity instances (for disabled-state checks).
export const hostTouchables = (root: any, onPress?: any) =>
  root.findAll(
    (n: any) =>
      n.type === RNTouchableOpacity &&
      (onPress === undefined || n.props.onPress === onPress)
  );

export const pressText = (root: any, text: string) => {
  const node = textNodes(root, text)[0];
  if (!node) throw new Error(`No host <Text> with children "${text}" found`);
  const touchable = pressableFrom(node);
  act(() => touchable.props.onPress());
};

export { act };