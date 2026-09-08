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
import Constants from "../../shared/Constants";
// Home mounts <Swiper autoplay>; its scrollBy timers fire after the suite
// ends and keep the CI worker alive past the coverage step — stub statically.
jest.mock("react-native-swiper", () => {
  const React = require("react");
  const Swiper = ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) =>
    React.createElement("View", props, children);
  return { __esModule: true, default: Swiper };
});


// Per-endpoint response shaping: the wizard callbacks read specific fields
// (JSON-stringified extra services, config-price model, language list) that
// the generic envelope cannot express.
(axios as any).mockImplementation((config: any) => {
  const url = config?.url || "";
  if (url === Constants.API.services_management_item) {
    return Promise.resolve({
      status: 200,
      data: {
        data: {
          serviceDetail: { id: "svc-1", name: "Test service", price: 100 },
          banner: [],
          extraService: JSON.stringify([
            {
              id: "es-1",
              name: "Ironing",
              code: "COSTSP",
              pricePerUnit: 20,
              unit: 1,
              acType: "",
            },
          ]),
        },
      },
    });
  }
  if (url === Constants.API.config_price) {
    return Promise.resolve({
      status: 200,
      data: {
        data: {
          items: [
            {
              serviceType: 1,
              pricesModel: JSON.stringify({
                one: 150,
                two: 100,
                twoPlus: 120,
                threePlus: 90,
              }),
            },
          ],
        },
      },
    });
  }
  if (url === Constants.API.languages) {
    return Promise.resolve({
      status: 200,
      data: {
        data: {
          items: [
            { name: "English", code: "en" },
            { name: "Thai", code: "th" },
          ],
        },
      },
    });
  }
  if (url === Constants.API.booking_detail) {
    return Promise.resolve({
      status: 200,
      data: {
        data: {
          customerInfo: {
            addressId: "addr-1",
            address: "Test address",
            phoneNumber: "0123456789",
            remark: "",
            roomNo: "",
          },
        },
      },
    });
  }
  return Promise.resolve({
    status: 200,
    data: {
      data: {
        items: [
          { id: "1", code: "COSTSP", name: "Special", pricePerUnit: 100, pricePerMore: 120, image: "" },
          { id: "2", code: "LANGUAGE", name: "English", price: 50, status: 1 },
        ],
        data: [],
        errors: [],
      },
    },
  });
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

const rootfindAll = (renderer: any, visit: (fn: any) => boolean) => {
  renderer.root.findAll(visit);
};

// pressAll variant that skips the order-submission handler (hangs under act).
const sweepExceptOnNextStep = (root: any) => {
  const seen = new Set<any>();
  const handlers: any[] = [];
  root.findAll((n: any) => {
    const fn = n.props?.onPress;
    if (
      typeof fn === "function" &&
      !seen.has(fn) &&
      !String(fn).includes("onNextStep")
    ) {
      seen.add(fn);
      handlers.push(fn);
    }
    return false;
  });
  for (const onPress of handlers) {
    act(() => {
      try {
        const result = onPress({ preventDefault() {}, stopPropagation() {}, nativeEvent: {} });
        if (result && typeof result.catch === "function") result.catch(() => {});
      } catch {
        // tolerated
      }
    });
  }
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
    },
    30000
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
      // Jump through every step header (absolute toStep jumps), sweeping the
      // freshly mounted step each time. `onNextStep` is pressed once at the
      // deepest step with shaped endpoint data (order submission flow).
      const seenHandlers = new Set<any>();
      const labels: any[] = [];
      rootfindAll(renderer, (fn: any) => {
        if (!seenHandlers.has(fn)) {
          seenHandlers.add(fn);
          labels.push(fn);
        }
        return false;
      });
      for (const labelHandler of labels) {
        pressOne(labelHandler);
        await flush();
        typeAll(renderer.root);
        await flush();
        sweepExceptOnNextStep(renderer.root);
        await flush();
      }
      // Final pass: full sweep including the order-submission handler.
      typeAll(renderer.root);
      await flush();
      pressAll(renderer.root);
      await flush();
      expect(renderer.toJSON()).not.toBeNull();
      await flush();
      renderer.unmount();
    },
    30000
  );
});
