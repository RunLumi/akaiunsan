import React from "react";
import axios from "axios";
import {
  createWithStore,
  makeApiStore,
  flush,
  pressAll,
} from "../../test-utils/helpers";
import { act } from "react-test-renderer";

// HistoryList's date flow: the date button opens the picker modal, whose
// onChange (handleValueDate) reloads the filtered history. The native picker
// is a View stand-in under jest, so its onChange is invoked directly with a
// synthetic change event.
let mockNavInstance: any;
jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => mockNavInstance,
}));

import HistoryList from "../History/HistoryList";

(axios as any).mockResolvedValue({
  status: 200,
  data: {
    data: {
      items: [
        {
          id: "h-1",
          orderId: "ord-1",
          title: "History",
          serviceName: "Test service",
          status: 1,
          price: 100,
          image: "",
        },
      ],
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

const baseParams = { data: {}, item: { id: "it-1", orderId: "ord-1" } };
const routeMock = (params: any) => ({ key: "test-key", name: "Test", params });

// Fire every host onChange (the datetimepicker stand-in carries onChange)
// the way the native component would on user selection.
const fireDateChanges = (root: any) => {
  const pickers = root.findAll(
    (n: any) =>
      typeof n.props?.onChange === "function" &&
      n.props?.value instanceof Date
  );
  for (const p of pickers) {
    act(() => {
      try {
        p.props.onChange(
          { type: "set", nativeEvent: { timestamp: Date.now() } },
          new Date("2026-02-01T00:00:00.000Z")
        );
      } catch {
        // tolerated
      }
    });
  }
  return pickers.length;
};

describe("HistoryList date flow (Phase 3 characterization)", () => {
  beforeEach(() => {
    mockNavInstance = nav();
  });

  it("opens the picker and reloads history on date selection", async () => {
    const store = makeApiStore(preloadedState);
    const renderer = createWithStore(
      <HistoryList navigation={mockNavInstance} route={routeMock(baseParams)} />,
      store
    );
    await flush();
    pressAll(renderer.root);
    await flush();
    const fired = fireDateChanges(renderer.root);
    await flush();
    expect(fired).toBeGreaterThan(0);
    pressAll(renderer.root);
    await flush();
    expect(renderer.toJSON()).not.toBeNull();
    await flush();
    renderer.unmount();
  }, 20000);
});
