import React from "react";
import axios from "axios";
import { createWithStore, makeStore, flush, pressAll, typeAll } from "../../test-utils/helpers";

// The full navigation tree mounts in the Node renderer once the heavy global
// overlays (NotificationHandler, PickerModal) are stood in and the safe-area
// context is available. Sweeping it exercises the root stack, the tab bar and
// each tab screen inside real navigation contexts.
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

(axios as any).mockResolvedValue({
  status: 200,
  data: {
    data: {
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
    },
  },
});

const preloadedState = {
  auth: {
    token: "test-token",
    user: {
      id: 1,
      fullName: "Test User",
      email: "test@ayasan.com",
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
        makeStore(preloadedState)
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
      await flush();
      renderer.unmount();
    },
    30000
  );
});
