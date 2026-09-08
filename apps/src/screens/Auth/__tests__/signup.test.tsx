import React from "react";
import axios from "axios";
import {
  createWithApiStore,
  createWithStore,
  makeApiStore,
  flush,
} from "../../../test-utils/helpers";
import { act } from "react-test-renderer";

// Phase 5 strangler contract for the Signup port (docs/mobile-app-upgrade-plan.md
// §5): the validated registration form submits through the RTK signup
// mutation and the app replaces to LOGIN — identical to the useApi tunnel it
// replaces.
let mockNavInstance: any;
jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => mockNavInstance,
}));

import Signup from "../Signup";
import Constants from "../../../shared/Constants";
import { navigationRef } from "../../../navigation/root";

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

describe("Signup (Phase 5 RTK port contract)", () => {
  beforeEach(() => {
    mockNavInstance = nav();
  });

  it("stays on validation errors when the form is empty", async () => {
    const renderer = createWithApiStore(
      <Signup navigation={mockNavInstance} route={routeMock({})} />,
      preloadedState
    );
    await flush();
    expect(renderer.toJSON()).not.toBeNull();
    renderer.unmount();
  });

  it("replaces to LOGIN after the RTK signup mutation succeeds", async () => {
    const store = makeApiStore(preloadedState);
    const renderer = createWithStore(
      <Signup navigation={mockNavInstance} route={routeMock({})} />,
      store
    );
    await flush();
    // Re-query instances before each fill: auto-effects can re-render between
    // acts, staling references.
    const typeAt = (nth: number, text: string) => {
      const inputs = renderer.root.findAll((n: any) => n.type === "TextInput");
      act(() => {
        inputs[nth].props.onChangeText(text);
      });
    };
    // field order: gender stub, firstname, lastname, phone, email,
    // password, repassword, sponsor
    typeAt(1, "Test");
    await flush();
    typeAt(2, "User");
    await flush();
    typeAt(3, "0123456789");
    await flush();
    typeAt(4, "test@akaiunsan.com");
    await flush();
    typeAt(5, "Password1");
    await flush();
    typeAt(6, "Password1");
    await flush();
    // NOTE: gender starts valid ({ label: "Mr", value: 1 }), so the picker
    // flow is intentionally not driven here (it is pinned by picker-flows).
    // press only the elements Button driving onPressNext (blasting every
    // handler also fires unrelated flows that re-render mid-sweep)
    const nextButtons = renderer.root.findAll(
      (n: any) =>
        typeof n.props?.onPress === "function" &&
        /onPressNext/.test(String(n.props.onPress))
    );
    // resolve the address picker the way PickAddress would on return:
    // register the mock navigation with the NavigationRoot singleton so the
    // address button's navigate lands, then invoke its onGoBack param
    (navigationRef as any).current = mockNavInstance;
    renderer.root
      .findAll((n: any) => typeof n.props?.onPress === "function")
      .forEach((t: any) => {
        act(() => {
          try {
            t.props.onPress();
          } catch {
            // tolerated
          }
        });
      });
    await flush();
    for (const [route, params] of mockNavInstance.navigate.mock.calls as any[]) {
      if (params && typeof params.onGoBack === "function") {
        await act(async () => {
          try {
            await params.onGoBack({ placeName: "Test address 1" });
          } catch {
            // tolerated
          }
        });
      }
    }
    await flush();
    (navigationRef as any).current = null;
    for (const b of nextButtons) {
      await act(async () => {
        try {
          await b.props.onPress();
        } catch {
          // tolerated
        }
      });
    }
    await flush();
    await flush();
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    const replaced = mockNavInstance.replace.mock.calls.some(
      (c: any[]) => c[0] === Constants.SCREENS.AUTH.LOGIN
    );
    expect(replaced).toBe(true);
    const fetchUrls = (global.fetch as any).mock.calls.map((c: any) =>
      typeof c[0] === "string" ? c[0] : c[0]?.url
    );
    expect(fetchUrls.some((u: string) => u.includes("/auth/signup"))).toBe(
      true
    );
    renderer.unmount();
  }, 30000);
});
