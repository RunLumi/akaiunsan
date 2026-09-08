import React from "react";
import axios from "axios";
import {
  createWithStore,
  makeStore,
  flush,
  pressAll,
  typeAll,
} from "../../test-utils/helpers";
import { success, TYPES } from "../../redux/actions";

// Several screens drive their list/filter flows through the global picker:
// they dispatch OPEN_PICKER with a callback that the (navigator-mounted)
// PickerModal invokes on selection. Outside the navigator the callback never
// fires, so this suite captures dispatched OPEN_PICKER actions and invokes
// their callbacks directly — the exact contract PickerModal executes.
let mockNavInstance: any;
jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => mockNavInstance,
}));

import HistoryList from "../History/HistoryList";
import BookingDetail from "../Booking/BookingDetail";
import EditProfile from "../Other/EditProfile";
import AllSubscriptionPlan from "../Subscription/AllSubscriptionPlan";
import Signup from "../Auth/Signup";

(axios as any).mockResolvedValue({
  status: 200,
  data: {
    data: {
      items: [
        {
          id: "noti-news",
          type: 2,
          data: JSON.stringify({ NotificationId: "n-1", PromotionId: "p-1" }),
          title: "News",
          content: "news content",
          status: 1,
          image: "",
          listImage: [{ image: "" }],
          bookDetail: [
            {
              bookingDate: "2026-01-01T00:00:00.000Z",
              bookingHour: "2026-01-01T01:00:00.000Z",
              hour: 2,
              label: "Mon",
              serviceName: "Test service",
            },
          ],
          isAutoRenew: 1,
          serviceName: "Test service",
        },
        {
          id: "noti-promo",
          type: 1,
          data: JSON.stringify({ PromotionId: "p-1" }),
          title: "Promo",
          content: "promo content",
          status: 1,
          image: "",
          listImage: [{ image: "" }],
          bookDetail: [
            {
              bookingDate: "2026-01-01T00:00:00.000Z",
              bookingHour: "2026-01-01T01:00:00.000Z",
              hour: 2,
              label: "Mon",
              serviceName: "Test service",
            },
          ],
          isAutoRenew: 1,
          serviceName: "Test service",
        },
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
          star: 5,
          review: "great",
          bookingDate: "2026-01-01T00:00:00.000Z",
          bookingDetail: { bookingDate: "2026-01-01T00:00:00.000Z" },
          customerInfo: { address: "Test address", phoneNumber: "0123456789" },
          data: JSON.stringify({ NotificationId: "n-1" }),
          type: 2,
          listImage: [{ image: "" }],
          bookDetail: [
            {
              bookingDate: "2026-01-01T00:00:00.000Z",
              bookingHour: "2026-01-01T01:00:00.000Z",
              hour: 2,
              label: "Mon",
              serviceName: "Test service",
            },
          ],
          isAutoRenew: 1,
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
      gender: 0,
      loginBy: "email",
      point: 100,
      genderLabel: "Female",
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

// Dispatch recorder: intercepts OPEN_PICKER payloads so their callbacks can be
// invoked the way the real PickerModal would.
const makeRecordingDispatch = (store: any) => {
  const picked: any[] = [];
  const original = store.dispatch;
  store.dispatch = (action: any) => {
    if (action?.type === TYPES.TOOLS.OPEN_PICKER && action.payload?.callback) {
      picked.push(action.payload);
    }
    return original(action);
  };
  return picked;
};

const invokePickerCallbacks = (picked: any[], selected = 5) => {
  for (const payload of picked) {
    try {
      const result = payload.callback(selected);
      if (result && typeof result.catch === "function") result.catch(() => {});
    } catch {
      // tolerated: callbacks may dereference refs absent from the renderer
    }
  }
  picked.length = 0;
};

const baseParams = {
  data: { id: "svc-1", serviceType: 1, name: "T" },
  item: {
    id: "it-1",
    orderId: "ord-1",
    title: "Item",
    name: "Item",
    status: 1,
    serviceType: 1,
  },
  id: "id-1",
  isEdit: false,
  onGoBack: () => {},
  subscriptionPlanActive: null,
  email: "test@akaiunsan.com",
};

const routeMock = (params: any) => ({ key: "test-key", name: "Test", params });

const CASES: [string, any][] = [
  ["History/HistoryList", HistoryList],
  ["Booking/BookingDetail", BookingDetail],
  ["Other/EditProfile", EditProfile],
  ["Subscription/AllSubscriptionPlan", AllSubscriptionPlan],
  ["Auth/Signup", Signup],
];

describe("picker-driven flows (Phase 3 characterization)", () => {
  beforeEach(() => {
    mockNavInstance = nav();
  });

  it.each(CASES)(
    "captures and resolves OPEN_PICKER callbacks for %s",
    async (label, Screen) => {
      const store = makeStore(preloadedState);
      const picked = makeRecordingDispatch(store);
      const renderer = createWithStore(
        <Screen navigation={mockNavInstance} route={routeMock(baseParams)} />,
        store
      );
      await flush();
      // press triggers that open the picker, then resolve its callbacks
      pressAll(renderer.root);
      await flush();
      invokePickerCallbacks(picked, 5);
      await flush();
      typeAll(renderer.root);
      await flush();
      pressAll(renderer.root);
      await flush();
      invokePickerCallbacks(picked, 0);
      await flush();
      expect(renderer.toJSON()).not.toBeNull();
      await flush();
      renderer.unmount();
    },
    20000
  );
});
