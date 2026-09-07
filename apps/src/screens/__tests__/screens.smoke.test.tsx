import React from "react";
import { act } from "react-test-renderer";
import axios from "axios";
import moment from "moment";
import { create, flush } from "../../test-utils/helpers";

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

// App defaults resolved by the axios mock: a 200 envelope whose inner data
// carries both `items` and `data` arrays, so `useApi` responses shape-check
// for the screens that read either. Individual tests can still override.
(axios as any).mockResolvedValue({
  status: 200,
  data: { data: { items: [], data: [], errors: [] } },
});

// `auth.user` starts null in the real store; several account screens assume a
// logged-in user is present (they are only reachable behind the auth gate).
const preloadedState = {
  auth: {
    token: "test-token",
    user: {
      id: 1,
      fullName: "Test User",
      email: "test@ayasan.com",
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
  data: {
    id: "svc-1",
    serviceId: "svc-1",
    serviceItemId: "item-1",
    serviceType: 1,
    serviceName: "Test service",
    name: "Test service",
    price: 100,
    salePrice: 90,
    point: 10,
    imageUrl: "",
    image: "",
    thumb: "",
    description: "desc",
    content: "",
    bookingDetail: {},
    customerInfo: {},
    promotionId: null,
    status: 1,
    age: "",
    cardId: "",
    numberKids: 0,
    orderId: "ord-1",
  },
  item: {
    id: "it-1",
    orderId: "ord-1",
    notificationId: "n-1",
    title: "Test item",
    name: "Test item",
    image: "",
    price: 100,
    serviceId: "svc-1",
    serviceName: "Test service",
    status: 1,
  },
  id: "id-1",
  isEdit: false,
  placeName: "Bangkok",
  subscriptionPlanActive: null,
  onReloadNoti: () => {},
  onGoBack: () => {},
  fromThread: "",
  items: [],
  email: "test@ayasan.com",
  password: "",
  hour: 1,
  plan: {
    id: "plan-1",
    name: "Test plan",
    price: 100,
    point: 10,
    description: "plan desc",
  },
  order: {
    orderId: "ord-1",
    orderDetailId: "od-1",
    serviceType: 1,
    serviceName: "Test service",
    totalPrice: 100,
    bookingDetail: { bookingDate: "2026-01-01T00:00:00.000Z" },
  },
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


describe("screens smoke render (Phase 3 characterization)", () => {
  beforeEach(() => {
    mockNavInstance = navigationMock();
  });

  it.each(CASES)(
    "mounts %s and settles its effects",
    async (label, Screen) => {
      const renderer = create(
        <Screen
          navigation={mockNavInstance}
          route={routeMock(baseParams)}
          {...(EXTRA_PROPS[label] || {})}
        />,
        preloadedState
      );
      await flush();
      expect(renderer).toBeTruthy();
      expect(renderer.toJSON()).not.toBeNull();
    }
  );
});
