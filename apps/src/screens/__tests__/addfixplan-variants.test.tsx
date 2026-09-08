import React from "react";
import axios from "axios";
import moment from "moment";
import {
  createWithStore,
  makeStore,
  flush,
  pressAll,
  typeAll,
} from "../../test-utils/helpers";

// AddFixPlan is a controlled sub-screen (FixPlan flow): it takes its whole
// booking context as props and drives the times/calendar/selection state.
// Mounting it directly with a full prop set exercises its calendar,
// time-list and service-type branches without the parent wizard.
let mockNavInstance: any;
jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => mockNavInstance,
}));

import { AddFixPlan } from "../Other/FixPlan/AddFixPlan";

(axios as any).mockResolvedValue({
  status: 200,
  data: {
    data: {
      items: [{ id: "li-1", name: "Special", price: 100, status: 1 }],
      data: [],
      errors: [],
    },
  },
});

const preloadedState = {
  auth: { token: "test-token", user: { id: 1 }, loading: false },
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

const baseProps = (over: Record<string, any> = {}) => ({
  serviceId: "svc-1",
  serviceItemId: "item-1",
  serviceName: "Test service",
  ageKid: "",
  onSetAgeKid: () => {},
  serviceType: 1,
  priceModel: { two: 100, threePlus: 90 },
  salePriceModel: [{ fromHour: 0, toHour: 99, percent: 0 }],
  setTimes: () => {},
  countPrice: () => {},
  times: [{ startAt: moment("2026-01-01T00:00:00.000Z"), hour: 2 }],
  ...over,
});

const CASES: [string, any][] = [
  ["maid", { serviceType: 1 }],
  ["nanny", { serviceType: 2, ageKid: "3" }],
  ["elder", { serviceType: 3 }],
  ["cleaning", { serviceType: 4 }],
];

describe("AddFixPlan variants (Phase 3 characterization)", () => {
  beforeEach(() => {
    mockNavInstance = nav();
  });

  it.each(CASES)("mounts and exercises the %s flow", async (_label, over) => {
    const store = makeStore(preloadedState);
    const renderer = createWithStore(
      <AddFixPlan navigation={mockNavInstance} {...baseProps(over)} />,
      store
    );
    await flush();
    for (let round = 0; round < 2; round++) {
      typeAll(renderer.root);
      await flush();
      pressAll(renderer.root);
      await flush();
    }
    expect(renderer.toJSON()).not.toBeNull();
    await flush();
    renderer.unmount();
  });
});
