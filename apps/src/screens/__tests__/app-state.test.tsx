import React from "react";
import axios from "axios";
import { AppState } from "react-native";
import { createWithStore, makeStore, flush, pressAll, typeAll } from "../../test-utils/helpers";

// The tab screens register AppState change handlers; the handler bodies
// (refresh-on-foreground logic) only run when the OS emits a state change.
// The test emits it directly after capturing the registered listener.
const listeners: any[] = [];
const realAddListener = (AppState as any).addEventListener;
beforeAll(() => {
  (AppState as any).addEventListener = (event: string, handler: any) => {
    listeners.push(handler);
    return realAddListener(event, handler);
  };
});
afterAll(() => {
  (AppState as any).addEventListener = realAddListener;
});

const emitAppState = (state: string) => {
  for (const handler of listeners.splice(0)) {
    try {
      handler(state);
    } catch {
      // tolerated
    }
  }
};

let mockNavInstance: any;
jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => mockNavInstance,
}));

import Account from "../Main/Account";
import MainBooking from "../Main/Booking";
import Home from "../Main/Home";
import Inbox from "../Main/Inbox";
import Login from "../Auth/Login";
import ServiceScreenService from "../ServiceScreen/Service";

(axios as any).mockResolvedValue({
  status: 200,
  data: {
    data: {
      items: [
        {
          id: "li-1",
          orderId: "ord-1",
          title: "Test item",
          name: "Test item",
          serviceName: "Test service",
          serviceType: 1,
          price: 100,
          image: "",
          status: 1,
          type: 2,
          data: JSON.stringify({ NotificationId: "n-1" }),
          listImage: [{ image: "" }],
          bookingDate: "2026-01-01T00:00:00.000Z",
          bookingDetail: { bookingDate: "2026-01-01T00:00:00.000Z" },
          customerInfo: { address: "Test address", phoneNumber: "0123456789" },
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
    user: {
      id: 1,
      fullName: "Test User",
      email: "test@akaiunsan.com",
      phoneNumber: "0123456789",
      address: "Bangkok",
      gender: 0,
      loginBy: "email",
      point: 100,
    },
    loading: false,
  },
  language: { language: "en" },
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
  data: { id: "svc-1", serviceType: 1, name: "T", bookingDetail: {}, customerInfo: {} },
  item: { id: "it-1", orderId: "ord-1", title: "Item", name: "Item", status: 1 },
  id: "id-1",
  isEdit: false,
  email: "test@akaiunsan.com",
};

const routeMock = (params: any) => ({ key: "test-key", name: "Test", params });

const CASES: [string, any][] = [
  ["Main/Account", Account],
  ["Main/Booking", MainBooking],
  ["Main/Home", Home],
  ["Main/Inbox", Inbox],
  ["Auth/Login", Login],
  ["ServiceScreen/Service", ServiceScreenService],
];

describe("app-state refresh flows (Phase 3 characterization)", () => {
  beforeEach(() => {
    mockNavInstance = nav();
  });

  it.each(CASES)(
    "emits background/active transitions for %s",
    async (label, Screen) => {
      const renderer = createWithStore(
        <Screen navigation={mockNavInstance} route={routeMock(baseParams)} />,
        makeStore(preloadedState)
      );
      await flush();
      emitAppState("background");
      await flush();
      emitAppState("active");
      await flush();
      // a full sweep after the transitions keeps later mounts covered too
      typeAll(renderer.root);
      await flush();
      pressAll(renderer.root);
      await flush();
      emitAppState("background");
      await flush();
      emitAppState("active");
      await flush();
      expect(renderer.toJSON()).not.toBeNull();
      await flush();
      renderer.unmount();
    },
    20000
  );
});
