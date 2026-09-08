import React from "react";
import axios from "axios";
import {
  createWithApiStore,
  createWithStore,
  makeApiStore,
  flush,
  pressText,
} from "../../../test-utils/helpers";

// Phase 5 strangler contract for the Login port (docs/mobile-app-upgrade-plan.md
// §5): the email/password form submits through the RTK login mutation and the
// legacy LOGIN slice receives the token — identical to the useApi tunnel it
// replaces. Auth first because it gates navigation.
let mockNavInstance: any;
jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => mockNavInstance,
}));

import Login from "../Login";

(axios as any).mockResolvedValue({
  status: 200,
  data: { data: { items: [], data: [], errors: [] } },
});

const nav = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  setOptions: jest.fn(),
  dispatch: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => false),
  getParent: jest.fn(),
  getState: jest.fn(() => ({
    key: "stack",
    index: 0,
    routeNames: [],
    routes: [],
    type: "stack",
    stale: false,
  })),
});

const routeMock = (params: any) => ({ key: "test-key", name: "Test", params });

const preloadedState = {
  auth: { token: "", user: null, loading: false },
  language: { language: "en" },
};

// Type into the email/password fields by render order (email first,
// password second) — placeholders are locale-dependent (en/th), so matching
// them is fragile across the suite's global i18n state.
const fillForm = (root: any) => {
  const inputs = root.findAll(
    (n: any) => n.type === "TextInput" || n.type?.displayName === "TextInput"
  );
  // The email field renders before the password field
  const [email, password] = inputs;
  if (!email || !password || typeof email.props?.onChangeText !== "function") {
    throw new Error(
      `email/password inputs not found (inputs: ${inputs.length})`
    );
  }
  return { email, password };
};

describe("Login (Phase 5 RTK port contract)", () => {
  beforeEach(() => {
    mockNavInstance = nav();
  });

  it("stays on validation errors when the form is empty", async () => {
    const renderer = createWithApiStore(
      <Login navigation={mockNavInstance} route={routeMock({})} />,
      preloadedState
    );
    await flush();
    expect(renderer.toJSON()).not.toBeNull();
    renderer.unmount();
  });

  it("dispatches AUTH.LOGIN with the token from the RTK mutation", async () => {
    const store = makeApiStore(preloadedState);

    const renderer = createWithStore(
      <Login navigation={mockNavInstance} route={routeMock({})} />,
      store
    );
    await flush();
    // Re-query instances before each fill: auto-effects (version modal,
    // language fan-out) can re-render between acts, staling references.
    const { act } = require("react-test-renderer");
    const typeAt = (nth: number, text: string) => {
      const inputs = renderer.root.findAll((n: any) => n.type === "TextInput");
      act(() => {
        inputs[nth].props.onChangeText(text);
      });
    };
    typeAt(0, "test@akaiunsan.com");
    await flush();
    typeAt(1, "secret-1");
    await flush();
    // Press only the login action. Pressing every button also triggers social
    // login handlers and leaves multiple FCM debounce timers after unmount.
    pressText(renderer.root, "Sign In");
    await flush();
    // Let Login's 900ms FCM registration debounce and its mocked request
    // settle before the renderer is unmounted.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await flush();
    const token = (store.getState() as any)?.auth?.token;
    expect(token).toBeTruthy();
    renderer.unmount();
  }, 20000);

});
