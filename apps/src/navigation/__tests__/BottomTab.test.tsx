// Phase 0 pinned the translated-route-names bug (route names were i18n
// strings, so a locale switch changed route identity). Phase 3 typed routes
// FIXED it: names are typed constants (TAB_ROUTES) and only the labels are
// translated via tabBarLabel. These tests pin the fixed behavior.
import TestRenderer, { act } from "react-test-renderer";
import React from "react";

jest.mock("react-redux", () => ({
  useSelector: (selector: (s: any) => unknown) =>
    selector({ tools: { notification: 0 }, language: { language: "en" } }),
}));
jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));
jest.mock("../../screens/Main", () => ({
  Home: () => null,
  Booking: () => null,
  Inbox: () => null,
  Account: () => null,
}));

// Lightweight stand-in for the navigator that records registered screen names
// and labels (avoids RN Animated internals and isolates the route contract).
jest.mock("@react-navigation/bottom-tabs", () => {
  (globalThis as any).__tabNames = [];
  (globalThis as any).__tabLabels = [];
  const ReactMock = require("react");
  const Screen = ({ name, options }: { name: string; options?: any }) => {
    (globalThis as any).__tabNames.push(name);
    (globalThis as any).__tabLabels.push(options?.tabBarLabel);
    return null;
  };
  const createBottomTabNavigator = () => ({
    Navigator: ({ children }: any) => ReactMock.createElement(ReactMock.Fragment, null, children),
    Screen,
  });
  return { createBottomTabNavigator };
});

import BottomTabNavigator from "../BottomTab";
import i18n from "../../shared/I18n";

const tabs = () => (globalThis as any).__tabNames as string[];
const labels = () => (globalThis as any).__tabLabels as string[];

describe("BottomTab route names (Phase 3 typed routes)", () => {
  beforeEach(() => {
    (globalThis as any).__tabNames = [];
    (globalThis as any).__tabLabels = [];
  });
  it("registers the four tabs with typed constant route names", () => {
    i18n.locale = "en";
    act(() => {
      TestRenderer.create(React.createElement(BottomTabNavigator));
    });
    expect(tabs()).toEqual(["Home", "Booking", "Inbox", "Account"]);
    expect(labels()).toEqual(["Home", "Booking", "Inbox", "Account"]);
  });

  it("route names stay constants across locales; labels stay translated", () => {
    i18n.locale = "th";
    act(() => {
      TestRenderer.create(React.createElement(BottomTabNavigator));
    });
    // the pinned bug is fixed: the Thai locale changes the LABELS only
    expect(tabs()).toEqual(["Home", "Booking", "Inbox", "Account"]);
    expect(labels()).toEqual(["หน้าหลัก", "การจอง", "กล่องข้อความ", "บัญชีผู้ใช้"]);
    i18n.locale = "en";
  });
});
