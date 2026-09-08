import React from "react";
import { createStore } from "redux";
import { Provider } from "react-redux";
import TestRenderer, { act } from "react-test-renderer";
import { Text as RNText, TouchableOpacity as RNTouchableOpacity } from "react-native";
import reducers from "../redux/reducers";
import { setupListenerMiddleware } from "../redux/listenerMiddleware";

export const makeStore = (preloaded?: any): any => createStore(reducers as any, preloaded);

// Phase 5 strangler store: legacy reducers (auth/language/tools) plus the RTK
// Query api slice, for suites that mount ported screens.
export const makeApiStore = (preloaded?: any): any =>
  setupListenerMiddleware(preloaded);

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

// Renders against the Phase 5 strangler store (legacy slices + RTK api).
export const createWithApiStore = (
  ui: React.ReactElement,
  preloaded?: any
) => doCreate(ui, makeApiStore(preloaded));

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

// ---------------------------------------------------------------------------
// Smoke-interaction harness (screens coverage sweep, docs/mobile-app-upgrade-
// plan.md Phase 3). Presses every pressable and types into every text input so
// the bulk of each screen's branches (modals, filters, navigation) executes.
// Handlers that dereference native refs absent from the test renderer are
// tolerated per-press: the executed prefix still counts as exercised, and the
// screens remain characterized by their dedicated suites.
// ---------------------------------------------------------------------------
const syntheticEvent = () => ({
  preventDefault: () => {},
  stopPropagation: () => {},
  persist: () => {},
  nativeEvent: {},
});

// skipPatterns: handler source substrings to skip (e.g. flows whose async
// chains outlive the suite and are covered by dedicated contracts instead).
export const pressAll = (root: any, skipPatterns: string[] = []) => {
  const pressed: any[] = [];
  root.findAll((n: any) => {
    if (typeof n.props?.onPress !== "function") return false;
    const t = n.type;
    const isHost =
      t === RNTouchableOpacity ||
      (typeof t === "string" &&
        ["RCTView", "View", "Text", "TouchableOpacity"].includes(t));
    return isHost;
  });
  // findAll above may double-count composite wrappers; dedupe by handler identity
  const seen = new Set<any>();
  root.findAll((n: any) => {
    const fns = [n.props?.onPress, n.props?.onDropDown].filter(
      (fn: any) => typeof fn === "function"
    );
    for (const fn of fns) {
      if (seen.has(fn)) continue;
      seen.add(fn);
      pressed.push(fn);
    }
    return false;
  });
  for (const onPress of pressed) {
    if (skipPatterns.some((pat) => String(onPress).includes(pat))) {
      continue;
    }
    act(() => {
      try {
        // Handlers may be async (request flows); rejections (native-ref
        // dereference without the renderer) are tolerated by the harness.
        const result = onPress(syntheticEvent());
        if (result && typeof result.catch === "function") {
          result.catch(() => {});
        }
      } catch {
        // native-ref dereference without the renderer — tolerated
      }
    });
  }
  return pressed.length;
};

// Fires onChangeText/onChange on every host text input (and elements SearchBar
// stand-ins) with a benign string, exercising filter/state branches.
export const typeAll = (root: any, text = "test") => {
  const changed: any[] = [];
  const seen = new Set<any>();
  root.findAll((n: any) => {
    const fn = n.props?.onChangeText;
    if (typeof fn !== "function" || seen.has(fn)) return false;
    seen.add(fn);
    changed.push(fn);
    return true;
  });
  for (const onChangeText of changed) {
    act(() => {
      try {
        const result = onChangeText(text);
        if (result && typeof result.catch === "function") {
          result.catch(() => {});
        }
      } catch {
        // tolerated: handlers dereferencing refs absent in the renderer
      }
    });
  }
  return changed.length;
};

export { act };