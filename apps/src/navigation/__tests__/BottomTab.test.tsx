// pins current behavior (docs/mobile-app-upgrade-plan.md Phase 0 item 5):
// Bottom-tab route names are i18n-translated strings, so switching the locale
// changes the *route names*, not just the labels. This is the latent bug we
// deliberately pin before fixing in Phase 3 (route names become constants,
// labels stay translated).
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
// (avoids RN Animated internals and isolates the route-name contract).
jest.mock("@react-navigation/bottom-tabs", () => {
  (globalThis as any).__tabNames = [];
  const ReactMock = require("react");
  const Screen = ({ name }: { name: string }) => {
    (globalThis as any).__tabNames.push(name);
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

describe("BottomTab route names (pins current behavior)", () => {
  beforeEach(() => {
    (globalThis as any).__tabNames = [];
  });
  it("registers the four tabs with their CURRENT i18n label as the route name", () => {
    i18n.locale = "en";
    act(() => {
      TestRenderer.create(React.createElement(BottomTabNavigator));
    });
    expect(tabs()).toEqual(["Home", "Booking", "Inbox", "Account"]);
  });

  it("route names follow the locale (th) instead of staying constants", () => {
    i18n.locale = "th";
    act(() => {
      TestRenderer.create(React.createElement(BottomTabNavigator));
    });
    // The same four tabs register Thai route names — the latent bug: route
    // names and labels share the same i18n source.
    expect(tabs()).toEqual(["หน้าหลัก", "การจอง", "กล่องข้อความ", "บัญชีผู้ใช้"]);
    i18n.locale = "en";
  });
});