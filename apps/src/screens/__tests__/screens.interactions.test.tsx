import React from "react";
import axios from "axios";
import Constants from "../../shared/Constants";
import moment from "moment";
import {
  create,
  createWithStore,
  makeStore,
  flush,
  pressAll,
  typeAll,
} from "../../test-utils/helpers";
import { installApiRoutes } from "../../test-utils/api-mock";

// useIsFocused/useNavigation require a navigation context; the smoke suite
// renders screens standalone with a shared navigation stand-in.
let mockNavInstance: any;
jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => mockNavInstance,
}));

import Address from "../Address/Address";
import PickAddress from "../Address/PickAddress";
import ForgotPassword from "../Auth/ForgotPassword";
import Login from "../Auth/Login";
import Signup from "../Auth/Signup";
import BookingDetail from "../Booking/BookingDetail";
import Calendar from "../Booking/Calendar";
import DetailHistory from "../Booking/DetailHistory";
import EditAndReOrderService from "../EditAndReOrderServiceScreen/EditAndReOrderService";
import MenuFavourite from "../Favourite/Menu";
import FavouriteService from "../Favourite/Service";
import FavouriteServiceProvider from "../Favourite/ServiceProvider";
import HistoryDetail from "../History/HistoryDetail";
import HistoryList from "../History/HistoryList";
import Account from "../Main/Account";
import MainBooking from "../Main/Booking";
import Home from "../Main/Home";
import Inbox from "../Main/Inbox";
import ListMyBooking from "../MyBooking/ListMyBooking";
import AboutUs from "../Other/AboutUs";
import EditProfile from "../Other/EditProfile";
import InboxDetail from "../Other/InboxDetail";
import PaymentPetcare from "../Other/PaymentPetcare";
import PreferToFriend from "../Other/PreferToFriend";
import FixPlanPickAddress from "../Other/FixPlan/PickAddress";
import { AddFixPlan as FixPlanAddFixPlan } from "../Other/FixPlan/AddFixPlan";
import FixPlanResultPayment from "../Other/FixPlan/ResultPayment";
import FexiblePlanAgree from "../Other/FexiblePlan/Agree";
import FexiblePlanDetail from "../Other/FexiblePlan/Detail";
import FexiblePlanListPlan from "../Other/FexiblePlan/ListPlan";
import PaymentList from "../Payment/PaymentList";
import PromotionDetail from "../Promotion/PromotionDetail";
import PromotionList from "../Promotion/PromotionList";
import AllService from "../ServiceScreen/AllService";
import ServiceScreenService from "../ServiceScreen/Service";
import AllSubscriptionPlan from "../Subscription/AllSubscriptionPlan";
import SubscriptionDetail from "../Subscription/SubscriptionDetail";

// Rich list item so every list/section renderer executes its content branch
// (avatars, prices, names, counts) instead of only its empty state.
const listItem = (over: Record<string, any> = {}) => ({
  id: "li-1",
  orderId: "ord-1",
  orderDetailId: "od-1",
  title: "Test item",
  name: "Test item",
  serviceName: "Test service",
  serviceType: 1,
  serviceId: "svc-1",
  price: 100,
  salePrice: 90,
  totalPrice: 100,
  point: 10,
  image: "",
  imageUrl: "",
  thumb: "",
  avatar: "",
  description: "desc",
  content: "content",
  status: 1,
  isDefault: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  bookingDate: "2026-01-01T00:00:00.000Z",
  bookingHour: "2026-01-01T01:00:00.000Z",
  bookingDetail: {
    bookingDate: "2026-01-01T00:00:00.000Z",
    bookingHour: "2026-01-01T01:00:00.000Z",
    specialHelper: null,
    serviceType: 1,
    age: "",
    cardId: "",
    extraServices: [],
  },
  customerInfo: {
    addressId: "addr-1",
    address: "Test address",
    district: "District",
    city: "City",
    province: "Province",
    phoneNumber: "0123456789",
    roomOrFloor: "",
    remark: "",
    bedRooms: 0,
    bathRooms: 0,
  },
  promotion: { id: "promo-1", percent: 10, money: 100, name: "Promo" },
  promotionId: "promo-1",
  star: 5,
  review: "great",
  numberKids: 0,
  petProfiles: [],
  activity: "",
  numberExtraPet: 0,
  address: "Test address",
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
  data: JSON.stringify({ NotificationId: "n-1", PromotionId: "p-1" }),
  type: 2,
  listImage: [{ image: "" }],
  ...over,
});

// App defaults resolved by the axios mock: a 200 envelope whose inner data
// carries both `items` and `data` arrays, so `useApi` responses shape-check
// for the screens that read either. Individual tests can still override.
// Per-endpoint response shapes (see test-utils/api-mock.ts).
// Generic fallback envelope (items carry the full renderer surface).
const fallbackData = {
  items: [
    listItem(),
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
  ],
  data: [listItem()],
  results: [listItem()],
  // response fields various screens read directly off the envelope
  auth_token: "fallback-token",
  token: "fallback-token",
  user: { id: 1, fullName: "Test User", email: "test@akaiunsan.com", point: 10 },
  totalUnRead: 3,
  page: 1,
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
  status: "OK",
};

installApiRoutes(axios as any, {
  // AllSubscriptionPlan reads the plan map keys (Flexible/Fix)
  [Constants.API.get_subscription]: {
    Flexible: [listItem({ id: "plan-flex", serviceName: "Flexible" })],
    Fix: [listItem({ id: "plan-fix", serviceName: "Fix" })],
  },
  // the booking wizards + FixPlan parse these JSON strings
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
        perHour: 10,
        perTime: 0,
        acType: "",
      },
      {
        id: "es-2",
        name: "Walking",
        code: "PETWALK",
        pricePerUnit: 15,
        unit: 1,
        perHour: 0,
        perTime: 15,
        acType: "",
      },
    ]),
  },
  [Constants.API.config_price]: {
    items: [
      {
        serviceType: 1,
        pricesModel: JSON.stringify({ one: 150, two: 100, twoPlus: 120, threePlus: 90 }),
      },
    ],
  },
  [Constants.API.languages]: {
    items: [
      { name: "English", code: "en" },
      { name: "Thai", code: "th" },
    ],
  },
  [Constants.API.booking_detail]: {
    id: "od-1",
    orderId: "ord-1",
    orderDetailId: "od-1",
    // PENDING drives the cancel-order dialog branch (reason picker + confirm)
    orderStatus: 0,
    serviceName: "Test service",
    serviceType: 1,
    customerInfo: {
      addressId: "addr-1",
      address: "Test address",
      phoneNumber: "0123456789",
      remark: "",
      roomNo: "",
    },
  },
  [Constants.API.promotion_apply]: {
    promotionType: 1, // GIFT_PERCENT
    content: JSON.stringify({ percent: 10 }),
  },
  [Constants.API.get_version]: {
    // newer version available -> update dialog shows
    items: [{ version: "9.9.9" }, { version: "9.9.9" }],
  },
  [Constants.API.get_notification]: {
    // page-2 branch: merge into the existing list
    page: 2,
    totalUnRead: 3,
    items: [
      {
        id: "noti-1",
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
        id: "noti-2",
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
    ],
  },
}, fallbackData);


// `auth.user` starts null in the real store; several account screens assume a
// logged-in user is present (they are only reachable behind the auth gate).
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

const navigationMock = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  setOptions: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  openDrawer: jest.fn(),
  closeDrawer: jest.fn(),
  toggleDrawer: jest.fn(),
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
  data: listItem(),
  item: listItem(),
  id: "id-1",
  isEdit: false,
  placeName: "Bangkok",
  subscriptionPlanActive: null,
  onReloadNoti: () => {},
  onGoBack: () => {},
  fromThread: "",
  items: [listItem(),
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
        },],
  email: "test@akaiunsan.com",
  password: "",
  hour: 1,
  plan: {
    id: "plan-1",
    name: "Test plan",
    price: 100,
    point: 10,
    description: "plan desc",
  },
  order: listItem(),
};

const routeMock = (params: any) => ({ key: "test-key", name: "Test", params });

const CASES: [string, any][] = [
  ["Address/Address", Address],
  ["Address/PickAddress", PickAddress],
  ["Auth/ForgotPassword", ForgotPassword],
  ["Auth/Login", Login],
  ["Auth/Signup", Signup],
  ["Booking/BookingDetail", BookingDetail],
  ["Booking/Calendar", Calendar],
  ["Booking/DetailHistory", DetailHistory],
  ["EditAndReOrderServiceScreen/EditAndReOrderService", EditAndReOrderService],
  ["Favourite/Menu", MenuFavourite],
  ["Favourite/Service", FavouriteService],
  ["Favourite/ServiceProvider", FavouriteServiceProvider],
  ["History/HistoryDetail", HistoryDetail],
  ["History/HistoryList", HistoryList],
  ["Main/Account", Account],
  ["Main/Booking", MainBooking],
  ["Main/Home", Home],
  ["Main/Inbox", Inbox],
  ["MyBooking/ListMyBooking", ListMyBooking],
  ["Other/AboutUs", AboutUs],
  ["Other/EditProfile", EditProfile],
  ["Other/InboxDetail", InboxDetail],
  ["Other/PaymentPetcare", PaymentPetcare],
  ["Other/PreferToFriend", PreferToFriend],
  ["Other/FixPlan/PickAddress", FixPlanPickAddress],
  ["Other/FixPlan/AddFixPlan", FixPlanAddFixPlan],
  ["Other/FixPlan/ResultPayment", FixPlanResultPayment],
  ["Other/FexiblePlan/Agree", FexiblePlanAgree],
  ["Other/FexiblePlan/Detail", FexiblePlanDetail],
  ["Other/FexiblePlan/ListPlan", FexiblePlanListPlan],
  ["Payment/PaymentList", PaymentList],
  ["Promotion/PromotionDetail", PromotionDetail],
  ["Promotion/PromotionList", PromotionList],
  ["ServiceScreen/AllService", AllService],
  ["ServiceScreen/Service", ServiceScreenService],
  ["Subscription/AllSubscriptionPlan", AllSubscriptionPlan],
  ["Subscription/SubscriptionDetail", SubscriptionDetail],
];

// Screens whose props go beyond the generic navigation/route pair. Everything
// else mounts with navigation + route alone.
const EXTRA_PROPS: Record<string, any> = {
  "Other/FixPlan/ResultPayment": {
    times: [{ startAt: moment("2026-01-01T00:00:00.000Z") }],
    price: 100,
    onPickDate: () => {},
    address: { longAddress: "Test address" },
  },
};

// These three screens re-schedule unresolved async work in later interaction
// rounds (their wizard sub-components are covered by dedicated suites instead).
const SINGLE_ROUND = new Set([
  "ServiceScreen/Service",
  "Subscription/AllSubscriptionPlan",
  "Subscription/SubscriptionDetail",
]);

describe("screens interaction sweep (Phase 3 coverage harness)", () => {
  beforeEach(() => {
    mockNavInstance = navigationMock();
  });

  it.each(CASES)(
    "exercises %s press + input branches",
    async (label, Screen) => {
      const store = makeStore(preloadedState);
      const renderer = createWithStore(
        <Screen
          navigation={mockNavInstance}
          route={routeMock(baseParams)}
          {...(EXTRA_PROPS[label] || {})}
        />,
        store
      );
      await flush();
      const root = renderer.root;
      // Multiple rounds: presses that advance wizard steps mount gated
      // sub-components (Options/Payment), whose handlers then get exercised in
      // the following rounds. Three screens loop late-round async work
      // forever under act (their gated sub-components are covered by the
      // dedicated step-components suite instead).
      const rounds = SINGLE_ROUND.has(label) ? 1 : 3;
      for (let round = 0; round < rounds; round++) {
        typeAll(root);
        await flush();
        pressAll(root);
        await flush();
      }
      expect(renderer.toJSON()).not.toBeNull();
      // final tick so late-throttled requests settle before unmount
      await flush();
      renderer.unmount();
    }
  );
});
