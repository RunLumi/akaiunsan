import React from "react";
import dayjs from "../../shared/dayjs";
import {
  createWithStore,
  makeApiStore,
  flush,
  pressAll,
  typeAll,
} from "../../test-utils/helpers";
import { setFetchFallback } from "../../test-utils/fetch-mock";

// Step-gated wizard sub-components render only after the parent advances; this
// suite mounts them directly with the props the parent passes so their branches
// (and the helper-select modals they host) are characterized without driving
// the parent's late-round async loop.
let mockNavInstance: any;
jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => mockNavInstance,
}));

import ServiceOption from "../ServiceScreen/component/Option";
import ServicePayment from "../ServiceScreen/component/Payment";
import EditOption from "../EditAndReOrderServiceScreen/component/Option";
import EditPayment from "../EditAndReOrderServiceScreen/component/Payment";
import EditServiceCalendar from "../EditAndReOrderServiceScreen/component/Service";
import EditAddress from "../EditAndReOrderServiceScreen/component/Address";
import EditResult from "../EditAndReOrderServiceScreen/component/Result";
import { HelperSelect } from "../../components/HelperSelect";
import { HelperSelectFixPlan } from "../../components/HelperSelectFixPlan";

setFetchFallback({
  items: [
        {
          id: "li-1",
          code: "COSTSP",
          pricePerUnit: 100,
          pricePerMore: 120,
          name: "Special",
          image: "",
          content: "content",
          status: 1,
          isSelect: false,
          old: 30,
          star: 5,
        },
        {
          id: "h-1",
          code: "COSTSP",
          name: "Helper A",
          old: 30,
          star: 5,
          image: "",
          status: 1,
          isSelect: true,
          price: 100,
          pricePerUnit: 100,
          pricePerMore: 120,
        },
        {
          id: "li-2",
          code: "LANGUAGE",
          name: "English",
          price: 50,
          status: 1,
        },
  ],
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

const richProps = () => ({
  bookingDetail: {
    bookingDate: "2026-01-01T00:00:00.000Z",
    phoneNumber: "0123456789",
    address: "Test address",
    remark: "",
    roomNo: "",
  },
  handleAddress: () => {},
  dataAddress: { id: "addr-1", address: "Test address", phoneNumber: "0123456789" },
  nameServiceType: "Test service",
  receivePoint: 10,
  address: { longAddress: "Test address" },
  valueShowHour: [{ label: "Mon", startAt: "07:00", endAt: "09:00" }],
  valueShowTime: "Jan 1, 2026 7:00 AM",
  type: 1,
  serviceType: 1,
  serviceName: "Test service",
  price: 100,
  extraService: [
    {
      id: "es-1",
      name: "Extra",
      price: 10,
      pricePerUnit: 10,
      pricePerMore: 12,
      code: "COSTSP",
      content: "",
    },
  ],
  extraServiceCleaning: [{ id: "es-2", name: "Cleaning", price: 5 }],
  numberKids: { numberKids: 1, age: [0] },
  numberPet: 0,
  activitiesPetCare: "walking",
  onSelectNumberKid: () => {},
  onSelectNumberPet: () => {},
  onSelectExtraService: () => {},
  onSetPrice: () => {},
  onChangeStep: () => {},
  times: [{ startAt: dayjs("2026-01-01T00:00:00.000Z") }],
  onPickDate: () => {},
  point: 0,
  paymentMethodId: "",
  promotionId: "",
  idCard: "",
  isCreditCard: true,
  dataDetail: {
    id: "d-1",
    price: 100,
    serviceName: "Test service",
    bookingDetail: { bookingDate: "2026-01-01T00:00:00.000Z" },
  },
  valueHelper: null,
  valueSpecialHelper: { name: "", old: 0, star: 0, image: "" },
  valuePreferLanguage: null,
  startTime: dayjs("2026-01-01T07:00:00.000Z"),
  endTime: dayjs("2026-01-01T09:00:00.000Z"),
  addressId: "addr-1",
  language: "en",
});

const CASES: [string, any][] = [
  ["ServiceScreen/component/Option", ServiceOption],
  // Cleaning type renders the AC/extra-service rows (check + count handlers)
  ["ServiceScreen/component/Option cleaning", ServiceOption],
  ["ServiceScreen/component/Payment", ServicePayment],
  ["EditAndReOrderServiceScreen/component/Option", EditOption],
  ["EditAndReOrderServiceScreen/component/Option cleaning", EditOption],
  ["EditAndReOrderServiceScreen/component/Payment", EditPayment],
  ["EditAndReOrderServiceScreen/component/Service", EditServiceCalendar],
  ["EditAndReOrderServiceScreen/component/Address", EditAddress],
  ["EditAndReOrderServiceScreen/component/Result", EditResult],
  ["components/HelperSelect", HelperSelect],
  ["components/HelperSelectFixPlan", HelperSelectFixPlan],
];

// Per-component prop overrides (shared richProps cannot fit every shape).
const EXTRA_PROPS: Record<string, any> = {
  // Result renders valueShowHour inline as a string ("5hr")
  "EditAndReOrderServiceScreen/component/Result": { valueShowHour: "5" },
};

// HelperSelect exposes its modal through an imperative handle wired to the
// legacy `children` prop (used as the ref); open it directly before sweeping.
const openHelperModal = (renderer: any) => {
  const helpers = renderer.root.findAll(
    (n: any) => typeof n.props?.openModalHelper === "function"
  );
  for (const h of helpers) {
    try {
      h.props.openModalHelper();
    } catch {
      // tolerated
    }
  }
};

describe("step-gated wizard components (Phase 3 characterization)", () => {
  beforeEach(() => {
    mockNavInstance = nav();
  });

  it.each(CASES)(
    "mounts and exercises %s",
    async (label, Component) => {
    // Cleaning-type variants render the AC/extra-service rows (check/count
    // handlers); the default is the Maid flow.
    const extraType = /cleaning/i.test(label) ? 4 : undefined;
    const store = makeApiStore(preloadedState);
    const renderer = createWithStore(
      <Component
        navigation={mockNavInstance}
        {...richProps()}
        {...(extraType ? { type: extraType, serviceType: extraType } : {})}
        {...(EXTRA_PROPS[label] || {})}
      />,
      store
    );
    await flush();
    // modals hosted by these components open imperatively
    openHelperModal(renderer);
    await flush();
    for (let round = 0; round < 2; round++) {
      typeAll(renderer.root);
      await flush();
      pressAll(renderer.root);
      await flush();
    }
    if (label.startsWith("components/")) {
      // closed modal components render null by design
      return;
    }
    expect(renderer.toJSON()).not.toBeNull();
    await flush();
    renderer.unmount();
    }
  , 90000);
});
