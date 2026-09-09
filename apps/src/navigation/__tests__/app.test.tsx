import React from "react";
import { createWithStore, makeApiStore, flush, pressAll, typeAll, act } from "../../test-utils/helpers";
import { setFetchFallback } from "../../test-utils/fetch-mock";

// The full navigation tree mounts in the Node renderer once the heavy global
// overlays (NotificationHandler, PickerModal) are stood in and the safe-area
// context is available. Sweeping it exercises the root stack, the tab bar and
// each tab screen inside real navigation contexts.
// @sentry/react-native's navigation tracing arms a recurring stall-tracking
// timer (instrument.ts -> Sentry.init) that keeps the jest worker alive after
// the suite. The suite characterizes navigation, so Sentry stands in.
jest.mock("@sentry/react-native", () => ({
  __esModule: true,
  init: jest.fn(),
  reactNavigationIntegration: () => ({
    registerNavigationContainer: jest.fn(),
    afterAllSetup: jest.fn(),
    processEvent: (event: any) => event,
  }),
  captureException: jest.fn(),
}));

jest.mock("../../components/Notifications", () => {
  const React = require("react");
  return {
    __esModule: true,
    NotificationHandler: () => React.createElement("View", null),
  };
});

jest.mock("../../components/Picker", () => {
  const React = require("react");
  return { __esModule: true, default: () => React.createElement("View", null) };
});

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const SafeAreaInsetsContext = React.createContext(insets);
  return {
    __esModule: true,
    SafeAreaProvider: ({ children }: any) => React.createElement("View", null, children),
    SafeAreaView: ({ children }: any) => React.createElement("View", null, children),
    SafeAreaConsumer: ({ children }: any) => children(insets),
    SafeAreaInsetsContext,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
    initialWindowMetrics: {
      insets,
      frame: { x: 0, y: 0, width: 375, height: 812 },
    },
  };
});

import Navigation from "../index";

setFetchFallback({
      items: [
        {
          id: "li-1",
          title: "Test item",
          name: "Test item",
          serviceName: "Test service",
          serviceType: 1,
          price: 100,
          image: "",
          type: 1,
          listImage: [{ image: "" }],
          status: 1,
        },
      ],
      data: [],
      errors: [],
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

describe("app navigation tree (Phase 3 characterization)", () => {
  it(
    "mounts the root navigator and sweeps tab screens inside navigation contexts",
    async () => {
      const renderer = createWithStore(
        <Navigation />,
        makeApiStore(preloadedState)
      );
      await flush();
      expect(renderer.toJSON()).not.toBeNull();
      // sweep: tab presses swap the mounted tab screens
      for (let round = 0; round < 2; round++) {
        typeAll(renderer.root);
        await flush();
        pressAll(renderer.root);
        await flush();
      }
      expect(renderer.toJSON()).not.toBeNull();
      // settle walk: the sweep arms async chains (read-all -> refresh -> GET)
      // whose RTK query resolution spans more microtask rounds than one flush
      // drains — leave nothing in flight before the environment tears down.
      for (let i = 0; i < 4; i++) {
        await flush();
        await new Promise((r) => setImmediate(r));
      }
      await flush();
      // v7 elements detach pressable refs via scheduler immediates during
      // deletion; drain them inside the live environment instead of letting
      // them fire post-teardown (which crashes the worker).
      await act(async () => {
        renderer.unmount();
        await new Promise((r) => setImmediate(r));
      });
    },
    30000
  );
});
