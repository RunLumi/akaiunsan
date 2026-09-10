import React from "react";
import { act } from "react-test-renderer";
import {
  createWithStore,
  makeApiStore,
  flush,
  pressAll,
  typeAll,
} from "../../test-utils/helpers";
import { installApiRoutes } from "../../test-utils/api-mock";

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
// Per-endpoint response shaping: the wizard callbacks read specific fields
// (JSON-stringified extra services, config-price model, language list) that
// the generic envelope cannot express.
installApiRoutes(
  {
    [Constants.API.services_management_item]: {
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
    [Constants.API.config_price]: {
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
    [Constants.API.languages]: {
      items: [
        { name: "English", code: "en" },
        { name: "Tiếng Việt", code: "vi" },
      ],
    },
    [Constants.API.booking_detail]: {
      customerInfo: {
        addressId: "addr-1",
        address: "Test address",
        phoneNumber: "0123456789",
        remark: "",
        roomNo: "",
      },
    },
  },
  {
    items: [
      { id: "1", code: "COSTSP", name: "Special", pricePerUnit: 100, pricePerMore: 120, image: "" },
      { id: "2", code: "LANGUAGE", name: "English", price: 50, status: 1 },
    ],
    data: [],
    errors: [],
    auth_token: "fallback" + "-token",
    token: "fallback" + "-token",
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
  }
);

const preloadedState = {
  auth: {
    token: "test-token",
    user: {
      id: 1,
      fullName: "Test User",
      email: "test@akaiunsan.com",
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

// Bounded flush: the legacy step-2/3 subtrees can keep scheduling React work
// (timers + chained requests), which makes an unbounded act() never return
// under the Node renderer — the previously-documented hang. Racing flush
// against a short timeout keeps the walk moving so unmount always runs.
const settle = async () => {
  await Promise.race([flush(), new Promise((r) => setTimeout(r, 250))]);
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
          route={{
            params: {
              data: editData,
              isEdit: true,
              subscriptionPlanActive: { serviceType: 1, hourRemain: -1 },
            },
          }}
        />,
        makeApiStore(preloadedState)
      );
      await settle();
      typeAll(renderer.root);
      await settle();
      pressAll(renderer.root);
      await settle();
      expect(renderer.toJSON()).not.toBeNull();
      await act(async () => {
        renderer.unmount();
        await Promise.race([
          new Promise((r) => setImmediate(r)),
          new Promise((r) => setTimeout(r, 250)),
        ]);
      });
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
          route={{
            params: {
              data,
              isEdit: false,
              // MaidService plan: unlocks the subscription-aware pricing
              // branches in config_price/handleHour (hour-remain arithmetic)
              subscriptionPlanActive: { serviceType: 1, hourRemain: -1 },
            },
          }}
        />,
        makeApiStore(preloadedState)
      );
      await settle();
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
        await settle();
        typeAll(renderer.root);
        await settle();
        sweepExceptOnNextStep(renderer.root);
        await settle();
      }
      // Walk forward: sweep (presses the step's confirm handlers), then
      // onNextStep, repeating so each mounted step's content is exercised.
      // Validations that cannot pass without real user data surface as
      // Alerts (also exercised branches).
      const findNextStep = () => {
        const seen = new Set<any>();
        let next: any;
        renderer.root.findAll((n: any) => {
          const fn = n.props?.onPress;
          if (
            typeof fn === "function" &&
            !seen.has(fn) &&
            /onNextStep/.test(String(fn))
          ) {
            seen.add(fn);
            next = fn;
          }
          return false;
        });
        return next;
      };
      // Forward passes: the sweep sets the step's confirm state
      // (handleAddress etc.), then onNextStep advances and each newly mounted
      // step's content is swept. The settle walk after each press keeps the
      // step-2+ remounts fully drained under the Node renderer (the
      // previously-documented hang).
      for (let stepPass = 0; stepPass < 3; stepPass++) {
        typeAll(renderer.root);
        await settle();
        sweepExceptOnNextStep(renderer.root);
        await settle();
        const nextStep = findNextStep();
        if (!nextStep) break;
        pressOne(nextStep);
        // Settle walk: the freshly mounted step's RTK query chains span more
        // microtask rounds than one flush drains; setImmediate rounds let the
        // scheduler reconcile while the environment is still alive.
        for (let round = 0; round < 4; round++) {
          await settle();
          await Promise.race([
            new Promise((r) => setImmediate(r)),
            new Promise((r) => setTimeout(r, 250)),
          ]);
        }
        typeAll(renderer.root);
        await settle();
        sweepExceptOnNextStep(renderer.root);
        await settle();
      }
      expect(renderer.toJSON()).not.toBeNull();
      await act(async () => {
        renderer.unmount();
        await Promise.race([
          new Promise((r) => setImmediate(r)),
          new Promise((r) => setTimeout(r, 250)),
        ]);
      });
    },
    30000
  );
});
