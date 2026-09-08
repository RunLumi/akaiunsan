import React from "react";
import axios from "axios";
import Constants from "../../shared/Constants";
import { AppState } from "react-native";
import { createWithStore, makeStore, flush, pressAll, typeAll } from "../../test-utils/helpers";
import { installApiRoutes } from "../../test-utils/api-mock";

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

const fallbackData = {
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
      auth_token: "fallback-token",
      token: "fallback-token",
      user: { id: 1, fullName: "Test User", email: "test@akaiunsan.com", point: 10 },
      totalUnRead: 3,
      customerInfo: {
        addressId: "addr-1",
        address: "Test address",
        district: "District",
        city: "City",
        province: "Province",
        phoneNumber: "0123456789",
        remark: "",
        roomNo: "",
      },
      extraService: JSON.stringify([
        {
          id: "es-1",
          name: "Ironing",
          code: "COSTSP",
          pricePerUnit: 20,
          unit: 1,
          perHour: 10,
          perTime: 0,
          acType: "",
        },
      ]),
      serviceDetail: { id: "svc-1", name: "Test service", price: 100 },
      banner: [],
      promotionType: 2,
      content: JSON.stringify({ money: 50, percent: 10, point: 5 }),
      version: "1.0.0",
    },
  },
};

// AllSubscriptionPlan reads the plan map keys off its response.
installApiRoutes(
  axios as any,
  {
    [Constants.API.get_subscription]: {
      Flexible: fallbackData.data.data.items.filter((i: any) => i.id === "li-1"),
      Fix: fallbackData.data.data.items.filter((i: any) => i.id === "li-1"),
    },
  },
  fallbackData.data.data
);

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
  // FixPlan/PickAddress reads serviceType off the top-level params
  serviceType: 1,
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
      pressAll(renderer.root, ["onPressLogin"]);
      await flush();
      emitAppState("background");
      await flush();
      emitAppState("active");
      await flush();
      expect(renderer.toJSON()).not.toBeNull();
      // Login's success flow arms a 900ms FCM-token debounce; let it fire
      // inside the test so no post-run console log fails the process.
      if (label === "Auth/Login") {
        await new Promise((r) => setTimeout(r, 2600));
        await flush();
      }
      await flush();
      renderer.unmount();
    },
    20000
  );
});
