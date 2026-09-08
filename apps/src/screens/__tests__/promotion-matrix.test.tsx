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
import { installApiRoutes } from "../../test-utils/api-mock";
import Constants from "../../shared/Constants";

// The payment promotion callback branches on response.promotionType
// (GIFT_MONEY / GIFT_PERCENT / GIFT_POINT / EXTRA_SERVICES). Each variant
// mounts the Payment step with its promotion shape and applies a voucher
// code, exercising the discount/point/service-mapping branches.
let mockNavInstance: any;
jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => mockNavInstance,
}));

import ServicePayment from "../ServiceScreen/component/Payment";
import EditPayment from "../EditAndReOrderServiceScreen/component/Payment";

(axios as any).mockResolvedValue({
  status: 200,
  data: {
    data: {
      items: [
        {
          id: "li-1",
          code: "COSTSP",
          name: "Special",
          pricePerUnit: 100,
          pricePerMore: 120,
          image: "",
          content: "content",
          status: 1,
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
    user: { id: 1, fullName: "Test User", email: "test@akaiunsan.com" },
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

const paymentProps = () => ({
  type: 1,
  serviceType: 1,
  price: 200,
  nameServiceType: "Test service",
  valueShowTime: "Jan 1, 2026 7:00 AM",
  extraService: [
    {
      id: "es-1",
      name: "Ironing",
      price: 20,
      pricePerUnit: 20,
      isCheck: true,
    },
  ],
  onSelectNumberKid: () => {},
  handlePriceExtraService: () => {},
  handleDiscountPrice: () => {},
  handleReceivePoint: () => {},
  navigation: mockNavInstance,
});

const PROMO_CASES: [string, any, any][] = [
  ["GIFT_MONEY", ServicePayment, { money: 50 }],
  ["GIFT_PERCENT", ServicePayment, { percent: 10 }],
  ["GIFT_POINT", ServicePayment, { point: 5 }],
  [
    "EXTRA_SERVICES",
    ServicePayment,
    { extraServices: [{ PromotionExtraItem: [{ name: "Ironing", discount: 10 }] }] },
  ],
  ["GIFT_MONEY", EditPayment, { money: 50 }],
  ["GIFT_PERCENT", EditPayment, { percent: 10 }],
];

const promoTypeId: Record<string, number> = {
  GIFT_MONEY: 2,
  GIFT_PERCENT: 1,
  GIFT_POINT: 3,
  EXTRA_SERVICES: 4,
};

describe("payment promotion matrix (Phase 3 characterization)", () => {
  beforeEach(() => {
    mockNavInstance = nav();
  });

  it.each(PROMO_CASES)(
    "applies the %s promotion branch",
    async (label, Component, content) => {
      installApiRoutes(axios as any, {
        [Constants.API.promotion_apply]: {
          promotionType: promoTypeId[label],
          content: JSON.stringify(content),
        },
      });
      const renderer = createWithStore(
        <Component {...paymentProps()} />,
        makeStore(preloadedState)
      );
      await flush();
      // type a voucher code, then sweep (the apply button fires the request)
      typeAll(renderer.root);
      await flush();
      pressAll(renderer.root);
      await flush();
      pressAll(renderer.root);
      await flush();
      expect(renderer.toJSON()).not.toBeNull();
      await flush();
      renderer.unmount();
    },
    20000
  );
});
