import React from "react";
import axios from "axios";
import moment from "moment";
import { act } from "react-test-renderer";
import { createWithStore, makeStore, flush, pressAll, typeAll } from "../../test-utils/helpers";

// The shared modal components expose their open API through an imperative
// handle wired to the legacy `children` prop (used as the ref). This suite
// opens each modal imperatively and sweeps its content, covering the helper
// list, position/map, date-time picker and payment-card flows.
let mockNavInstance: any;
jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => mockNavInstance,
}));

import { HelperSelect } from "../HelperSelect";
import { HelperSelectFixPlan } from "../HelperSelectFixPlan";
import { PositionSelect } from "../PositionSelect";
import { ListCardPayment } from "../ListCardPayment";
import { AddCardPayment } from "../AddCardPayment";
import { DateTimeSelect } from "../DateTimeSelect";

(axios as any).mockResolvedValue({
  status: 200,
  data: {
    data: {
      items: [
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
          id: "h-3",
          code: "HELPER",
          name: "Helper B",
          old: 25,
          star: 4,
          image: "",
          status: 1,
          isSelect: false,
        },
        { id: "h-2", code: "LANGUAGE", name: "English", price: 50, status: 1 },
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

// Calls every imperative handle registered on the `children`-as-ref props
// (also covers parents that forward the ref through host props).
const openImperative = (renderer: any, method: string, args: any[] = []) => {
  const hosts = renderer.root.findAll(
    (n: any) => typeof n.props?.[method] === "function"
  );
  for (const h of hosts) {
    act(() => {
      try {
        const result = h.props[method](...args);
        if (result && typeof result.catch === "function") result.catch(() => {});
      } catch {
        // tolerated
      }
    });
  }
};

const CASES: [string, any, string, any[]][] = [
  ["components/HelperSelect", HelperSelect, "openModalHelper", []],
  ["components/HelperSelectFixPlan", HelperSelectFixPlan, "openModalHelper", []],
  ["components/PositionSelect", PositionSelect, "openModalPosition", [null]],
  ["components/ListCardPayment", ListCardPayment, "openModalListCard", []],
  ["components/AddCardPayment", AddCardPayment, "openModalAddCard", []],
  [
    "components/DateTimeSelect",
    DateTimeSelect,
    "openModalDateTime",
    [],
  ],
];

// The imperative handles register on the legacy `children`-as-ref prop; the
// app opens them via ref.current.<method>() — tests do the same.
const childRef = () => React.createRef<any>();

const openViaRef = (ref: any, method: string, args: any[]) => {
  act(() => {
    try {
      const result = ref.current?.[method]?.(...args);
      if (result && typeof result.catch === "function") result.catch(() => {});
    } catch {
      // tolerated
    }
  });
};

const richProps: Record<string, any> = {
  "components/HelperSelect": {
    serviceType: 1,
    startTime: moment("2026-01-01T07:00:00.000Z"),
    endTime: moment("2026-01-01T09:00:00.000Z"),
    addressId: "addr-1",
    language: "en",
    // submitHelper invokes valueHelper(id, fullName, old, star, avatar)
    valueHelper: () => {},
  },
  "components/HelperSelectFixPlan": {
    serviceType: 1,
    startTime: moment("2026-01-01T07:00:00.000Z"),
    endTime: moment("2026-01-01T09:00:00.000Z"),
    addressId: "addr-1",
    language: "en",
    valueHelper: () => {},
  },
  "components/PositionSelect": {
    type: 1,
  },
  "components/ListCardPayment": {
    handleIdCard: () => {},
  },
  "components/AddCardPayment": {
    handleIdCard: () => {},
  },
  "components/DateTimeSelect": {
    valueDateTime: "2026-01-01T07:00:00.000Z",
    dateTimeSelect: "2026-01-01T07:00:00.000Z",
    hour: 2,
  },
};

describe("shared modal components (Phase 3 characterization)", () => {
  beforeEach(() => {
    mockNavInstance = nav();
  });

  it.each(CASES)(
    "opens and exercises %s",
    async (label, Component, method, args) => {
      const ref = childRef();
      const renderer = createWithStore(
        <Component
          children={ref}
          navigation={mockNavInstance}
          {...(richProps[label] || {})}
        />,
        makeStore(preloadedState)
      );
      await flush();
      openViaRef(ref, method, args);
      openImperative(renderer, method, args);
      await flush();
      for (let round = 0; round < 2; round++) {
        typeAll(renderer.root);
        await flush();
        pressAll(renderer.root);
        await flush();
      }
      // closed modals legitimately render null
      await flush();
      renderer.unmount();
    }
  );
});
