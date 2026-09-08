// Sentry must initialize before anything else loads
import "./instrument";
import * as Sentry from "@sentry/react-native";
import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
import messaging from "@react-native-firebase/messaging";
import App from "./App";
import notifee, { EventType } from "@notifee/react-native";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately

const messagingService =
  typeof messaging === "function" ? messaging() : undefined;
if (typeof messagingService?.setBackgroundMessageHandler === "function") {
  messagingService.setBackgroundMessageHandler(async () => {
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

// Sentry.wrap installs the global error handler around the root component
registerRootComponent(Sentry.wrap(App));
