// Sentry must initialize before anything else loads
import "./instrument";
import * as Sentry from "@sentry/react-native";
import "react-native-gesture-handler";
import { AppRegistry } from "react-native";
import App from "./App";
import notifee, { EventType } from "@notifee/react-native";
import { getFirebaseMessaging } from "./src/shared/firebase";

const messaging = getFirebaseMessaging();
if (messaging?.module.setBackgroundMessageHandler) {
  messaging.module.setBackgroundMessageHandler(messaging.service, async () => {
    if (typeof notifee.incrementBadgeCount === "function") {
      await notifee.incrementBadgeCount();
    }
  });
}

// notifee.onBackgroundEvent(async ({ type, detail }) => {
//   const { notification, pressAction } = detail;
//   console.log("detail ", detail);
//   // Check if the user pressed the "Mark as read" action
//   if (type === EventType.ACTION_PRESS && pressAction.id === "mark-as-read") {
//     // Decrement the count by 1
//     await notifee.decrementBadgeCount();

//     // Remove the notification
//     await notifee.cancelNotification(notification.id);
//   }
// });

// Avoid Expo's registerRootComponent bootstrap on native builds. Expo SDK 57's
// Expo.fx import eagerly initializes expo-asset/ExpoModulesJSI and can crash
// Hermes before the root view mounts in the current native binary.
AppRegistry.registerComponent("main", () => Sentry.wrap(App));
