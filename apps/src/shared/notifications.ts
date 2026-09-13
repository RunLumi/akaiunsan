import notifee from "@notifee/react-native";

// Notification badges are optional UI. A platform/permission failure must not
// become an unhandled promise rejection that terminates the React Native app.
export const setNotificationBadgeCount = (count: number): void => {
  try {
    void Promise.resolve(notifee.setBadgeCount(Math.max(0, count))).catch(
      (error) => console.warn("Unable to update notification badge", error)
    );
  } catch (error) {
    console.warn("Unable to update notification badge", error);
  }
};

export const incrementNotificationBadgeCount = (): void => {
  try {
    if (typeof notifee.incrementBadgeCount !== "function") return;
    void Promise.resolve(notifee.incrementBadgeCount()).catch((error) =>
      console.warn("Unable to increment notification badge", error)
    );
  } catch (error) {
    console.warn("Unable to increment notification badge", error);
  }
};
