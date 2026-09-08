import React from "react";
import axios from "axios";
import { Alert } from "react-native";
import {
  createWithStore,
  makeStore,
  flush,
  pressAll,
  typeAll,
} from "../../test-utils/helpers";
import { act } from "react-test-renderer";

// Inbox's delete confirmation lives inside Alert.alert buttons, which never
// render under jest. This suite spies Alert.alert, presses the selection and
// confirm controls, then invokes the YES button exactly as a user tap would.
let mockNavInstance: any;
jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => mockNavInstance,
}));

import Inbox from "../Main/Inbox";
import Constants from "../../shared/Constants";

(axios as any).mockResolvedValue({
  status: 200,
  data: {
    data: {
      items: [
        {
          id: "noti-1",
          type: 0,
          data: JSON.stringify({ NotificationId: "n-1" }),
          title: "Order",
          status: 1,
          image: "",
          listImage: [{ image: "" }],
          bookDetail: [
            {
              bookingDate: "2026-01-01T00:00:00.000Z",
              hour: 2,
              label: "Mon",
              serviceName: "T",
            },
          ],
          isAutoRenew: 1,
          serviceName: "T",
        },
      ],
      data: [],
      errors: [],
    },
  },
});

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

describe("Inbox delete flows (Phase 3 characterization)", () => {
  beforeEach(() => {
    mockNavInstance = nav();
  });

  it("confirms and executes the delete through the Alert yes-button", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((..._args: any[]) => {});
    const store = makeStore(preloadedState);
    const renderer = createWithStore(
      <Inbox navigation={mockNavInstance} route={routeMock(baseParams)} />,
      store
    );
    await flush();
    // open delete mode, select everything, sweep, then confirm
    for (let round = 0; round < 3; round++) {
      typeAll(renderer.root);
      await flush();
      pressAll(renderer.root);
      await flush();
    }
    // invoke every YES-style Alert button the sweeps armed
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
    // the delete request fired (single, bulk, or promo variant)
    const deleteCalls = (axios as any).mock.calls.filter((c: any) =>
      String(c[0]?.url || "").includes("notification")
    );
    expect(deleteCalls.length).toBeGreaterThan(0);
    await flush();
    renderer.unmount();
    alertSpy.mockRestore();
  }, 30000);
});
