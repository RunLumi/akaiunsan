import React from "react";
import { Alert } from "react-native";
import {
  createWithStore,
  makeApiStore,
  flush,
} from "../../test-utils/helpers";
import { act } from "react-test-renderer";

// Inbox's delete confirmation lives inside Alert.alert buttons, which never
// render under jest. This suite spies Alert.alert and drives the exact user
// sequence — trash icon, select-all, "Delete (N)", YES — then invokes the YES
// button as a tap would. Inbox is ported to RTK Query (Phase 5): requests flow
// through the global fetch stub's /client/notifications route, not axios, and
// the delete is asserted as a real DELETE.
let mockNavInstance: any;
jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => mockNavInstance,
}));

import Inbox from "../Main/Inbox";

const preloadedState = {
  auth: {
    token: "test-token",
    user: { id: 1, fullName: "Test User" },
    loading: false,
  },
  language: { language: "en" },
  tools: { notification: 0, picker: { isShow: false } },
};

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

const baseParams = {
  data: {},
  onReloadNoti: () => {},
};

const routeMock = (params: any) => ({ key: "test-key", name: "Test", params });

// Press the first node whose onPress handler source matches `pattern`.
// Two-phase like pressAll: pressing re-renders the tree, so walk and press
// must not interleave (stale fibers throw during findAll).
const pressHandler = (root: any, pattern: string) => {
  const found: any[] = [];
  root.findAll((n: any) => {
    const fn = n.props?.onPress;
    if (typeof fn === "function" && String(fn).includes(pattern)) {
      found.push(fn);
    }
    return false;
  });
  if (!found.length) throw new Error(`no onPress matching "${pattern}"`);
  act(() => {
    try {
      found[0]();
    } catch {
      // tolerated
    }
  });
};

// RTK fetchBaseQuery dispatches a single Request object.
const fetchRequestMeta = (call: any[]) => {
  const input = call[0];
  return {
    url: typeof input === "string" ? input : input?.url || "",
    method: String(
      (typeof input === "string" ? call[1]?.method : input?.method) || "GET"
    ).toUpperCase(),
  };
};

describe("Inbox delete flows (Phase 3 characterization)", () => {
  beforeEach(() => {
    mockNavInstance = nav();
  });

  it("confirms and executes the delete through the Alert yes-button", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((..._args: any[]) => {});
    const store = makeApiStore(preloadedState);
    const renderer = createWithStore(
      <Inbox navigation={mockNavInstance} route={routeMock(baseParams)} />,
      store
    );
    await flush();
    expect(renderer.toJSON()).not.toBeNull();

    // enter delete mode (trash icon), select everything, then "Delete (N)"
    pressHandler(renderer.root, "setIsDelete(true)");
    await flush();
    pressHandler(renderer.root, "onDeleteAll");
    await flush();
    const deleteText = renderer.root.findAll(
      (n: any) =>
        typeof n.props?.onPress === "function" &&
        String(n.props.onPress).includes("confirmDeleteNotification")
    )[0];
    expect(deleteText).toBeTruthy();
    act(() => deleteText.props.onPress());
    await flush();

    // the confirm Alert armed, and its non-cancel button performs the delete
    const yesButtons: any[] = [];
    for (const call of alertSpy.mock.calls) {
      const buttons = call.find((a: any) => Array.isArray(a));
      if (buttons) {
        for (const b of buttons) {
          if (b && typeof b.onPress === "function") {
            const label = String(b.text || "").toLowerCase();
            if (!/no|cancel/i.test(label)) {
              yesButtons.push(b.onPress);
            }
          }
        }
      }
    }
    expect(yesButtons.length).toBeGreaterThan(0);
    for (const onPress of yesButtons) {
      await act(async () => {
        try {
          await onPress();
        } catch {
          // tolerated
        }
      });
    }
    await flush();
    await flush();
    // the delete request fired as a DELETE against /client/notifications
    const deleteCalls = (globalThis.fetch as jest.Mock).mock.calls
      .map(fetchRequestMeta)
      .filter(
        (meta) =>
          meta.url.includes("notification") && meta.method === "DELETE"
      );
    expect(deleteCalls.length).toBeGreaterThan(0);
    await flush();
    renderer.unmount();
    alertSpy.mockRestore();
  }, 30000);
});
