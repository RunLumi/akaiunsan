import React from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import messaging from "@react-native-firebase/messaging";
import { NavigationRoot } from "../../navigation/root";
import AppConstant from "../../shared/Constants";
import { NotificationHandler } from "../Notifications";
import {
  createWithStore,
  makeStore,
  act,
  flush,
} from "../../test-utils/helpers";

jest.mock("../../navigation/root", () => ({
  NavigationRoot: { navigate: jest.fn() },
}));

beforeAll(() => {
  (globalThis as any).alert = jest.fn();
});

describe("NotificationHandler", () => {
  beforeEach(() => {
    // setNotificationHandler runs once at module import; clearing it here would
    // erase that call from every test, so keep it intact. The listeners are
    // re-registered on each mount, so clear those plus the navigate side-effect.
    (Notifications.addNotificationReceivedListener as jest.Mock).mockClear();
    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockClear();
    (Notifications.removeNotificationSubscription as jest.Mock).mockClear();
    (NavigationRoot.navigate as jest.Mock).mockClear();
  });

  // Awaiting resolve() settles registerForPushNotificationsAsync's
  // `.then(setExpoPushToken)` inside act, so nothing re-renders after teardown.
  it("registers the notification handler and both listeners on mount", async () => {
    createWithStore(<NotificationHandler />, makeStore());
    await flush();
    expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    expect(
      Notifications.addNotificationReceivedListener
    ).toHaveBeenCalledTimes(1);
    expect(
      Notifications.addNotificationResponseReceivedListener
    ).toHaveBeenCalledTimes(1);
  });

  it("does not call FCM on the simulator (Constants.isDevice=false)", async () => {
    createWithStore(<NotificationHandler />, makeStore());
    await flush();
    expect(Constants.isDevice).toBe(false);
    expect(messaging).not.toHaveBeenCalled();
  });

  it("deep-links to the inbox detail when a response carries an id", async () => {
    createWithStore(<NotificationHandler />, makeStore());
    await flush();
    const handler = (Notifications.addNotificationResponseReceivedListener as jest.Mock)
      .mock.calls[0][0];
    act(() =>
      handler({
        notification: { request: { content: { data: { id: "42" } } } },
      })
    );
    expect(NavigationRoot.navigate).toHaveBeenCalledWith(
      AppConstant.SCREENS.OTHER.INBOXDETAIL,
      { id: "42" }
    );
  });

  it("ignores responses without an id", async () => {
    createWithStore(<NotificationHandler />, makeStore());
    await flush();
    const handler = (Notifications.addNotificationResponseReceivedListener as jest.Mock)
      .mock.calls[0][0];
    act(() =>
      handler({ notification: { request: { content: { data: {} } } } })
    );
    expect(NavigationRoot.navigate).not.toHaveBeenCalled();
  });

  it("removes both subscriptions on unmount", async () => {
    const { unmount } = createWithStore(<NotificationHandler />, makeStore());
    await flush();
    act(() => unmount());
    expect(Notifications.removeNotificationSubscription).toHaveBeenCalledTimes(
      2
    );
  });
});