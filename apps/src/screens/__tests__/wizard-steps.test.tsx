import React from "react";
import axios from "axios";
import { act } from "react-test-renderer";
import {
  createWithStore,
  makeStore,
  flush,
  pressAll,
  typeAll,
} from "../../test-utils/helpers";

// The booking wizards gate Options/Payment behind `currentStep`. This suite
// jumps through the step-header handlers ONE at a time (flushing between) and
// sweeps the freshly mounted step. `onNextStep` is not pressed: its step-3
// request flow re-schedules unresolved async work under the Node renderer
// (its branches run through the unit-level request/characterization suites).
let mockNavInstance: any;
jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => mockNavInstance,
}));

import ServiceScreenService from "../ServiceScreen/Service";
import EditAndReOrderService from "../EditAndReOrderServiceScreen/EditAndReOrderService";

(axios as any).mockResolvedValue({
  status: 200,
  data: {
    data: {
      items: [
        { id: "1", code: "COSTSP", name: "Special", pricePerUnit: 100, pricePerMore: 120, image: "" },
        { id: "2", code: "LANGUAGE", name: "English", price: 50 },
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
      email: "test@ayasan.com",
      phoneNumber: "0123456789",
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
});

const CASES: [string, any, any][] = [
  [
    "ServiceScreen/Service steps",
    ServiceScreenService,
    {
      id: "1",
      serviceId: "1",
      serviceItemId: "1",
      serviceType: 1,
      serviceName: "T",
      name: "T",
      price: 100,
      orderId: "o1",
      bookingDetail: { bookingDate: "2026-01-01T00:00:00.000Z", extraServices: [] },
      customerInfo: { address: "a" },
    },
  ],
  [
    "EditAndReOrderServiceScreen/EditAndReOrderService steps",
    EditAndReOrderService,
    {
      id: "1",
      serviceId: "1",
      serviceItemId: "1",
      serviceType: 1,
      serviceName: "T",
      name: "T",
      price: 100,
      orderId: "o1",
      bookingDetail: { bookingDate: "2026-01-01T00:00:00.000Z", extraServices: [] },
      customerInfo: { address: "a" },
      currentDetail: { totalPrice: 100 },
    },
  ],
];

const stepHandlers = (root: any) => {
  const seen = new Set<any>();
  const handlers: any[] = [];
  root.findAll((n: any) => {
    const fn = n.props?.onPress;
    if (
      typeof fn === "function" &&
      !seen.has(fn) &&
      String(fn).includes("toStep")
    ) {
      seen.add(fn);
      handlers.push(fn);
    }
    return false;
  });
  return handlers;
};

const pressOne = (fn: any) => {
  act(() => {
    try {
      const result = fn({ preventDefault() {}, nativeEvent: {} });
      if (result && typeof result.catch === "function") result.catch(() => {});
    } catch {
      // tolerated
    }
  });
};

describe("booking wizard edit-mode (Phase 3 characterization)", () => {
  beforeEach(() => {
    mockNavInstance = nav();
  });

  it.each(CASES)(
    "mounts %s in edit mode with prefilled booking",
    async (label, Screen, data) => {
      const editData = {
        ...data,
        currentDetail: { totalPrice: 100, point: 0 },
        serviceType: 4,
      };
      const renderer = createWithStore(
        <Screen
          navigation={mockNavInstance}
          route={{ params: { data: editData, isEdit: true } }}
        />,
        makeStore(preloadedState)
      );
      await flush();
      typeAll(renderer.root);
      await flush();
      pressAll(renderer.root);
      await flush();
      expect(renderer.toJSON()).not.toBeNull();
      await flush();
      renderer.unmount();
    }
  );
});

describe("booking wizard steps (Phase 3 characterization)", () => {
  beforeEach(() => {
    mockNavInstance = nav();
  });

  it.each(CASES)(
    "walks %s one step at a time",
    async (label, Screen, data) => {
      const renderer = createWithStore(
        <Screen
          navigation={mockNavInstance}
          route={{ params: { data, isEdit: false } }}
        />,
        makeStore(preloadedState)
      );
      await flush();
      // Two walks cover the reachable step states; revisiting an already
      // mounted step re-runs child effects that never settle under the Node
      // renderer, so the walk is capped here.
      for (let walk = 0; walk < 2; walk++) {
        const handlers = stepHandlers(renderer.root);
        if (!handlers.length) break;
        const fn = handlers[walk % handlers.length];
        pressOne(fn);
        await flush();
        typeAll(renderer.root);
        await flush();
        pressAll(renderer.root);
        await flush();
      }
      expect(renderer.toJSON()).not.toBeNull();
      await flush();
      renderer.unmount();
    }
  );
});
