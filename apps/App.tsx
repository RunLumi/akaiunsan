import React, { useEffect } from "react";
import Navigation from "./src/navigation";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/lib/integration/react";
import redux from "./src/redux/store";
import useCachedResources from "./src/hooks/useCachedResources";
import notifee, { AndroidImportance } from "@notifee/react-native";
import {
  configureFirebaseTelemetry,
  getFirebaseMessaging,
  logAnalyticsEvent,
} from "./src/shared/firebase";

export default function App() {
  const isLoadingComplete = useCachedResources();

  useEffect(() => {
    configureFirebaseTelemetry();
    const messaging = getFirebaseMessaging();
    void requestUserPermission();

    async function requestUserPermission() {
      if (!messaging?.module.requestPermission) return;

      try {
        // firebase.json disables native messaging auto-init by default so
        // local/development builds do not contact Firebase Installations.
        // Production/staging explicitly opt back in before requesting FCM
        // permission or tokens.
        if (messaging.module.setAutoInitEnabled) {
          await messaging.module.setAutoInitEnabled(messaging.service, true);
        }
        const authStatus = await messaging.module.requestPermission(messaging.service);
        const enabled =
          authStatus === messaging.module.AuthorizationStatus?.AUTHORIZED ||
          authStatus === messaging.module.AuthorizationStatus?.PROVISIONAL;

        if (enabled) console.log("Authorization status:", authStatus);
      } catch (error) {
        console.warn("Unable to request Firebase Messaging permission", error);
      }
    }

    const unsubscribe = messaging?.module.onMessage
      ? messaging.module.onMessage(messaging.service, async (remoteMessage) => {
          await createNotification(remoteMessage);
          await logAnalyticsEvent("notification", remoteMessage as Record<string, unknown>);
        })
      : undefined;

    return unsubscribe;
  }, []);

  const createNotification = async (remoteMessage: any) => {
    await notifee.createChannel({
      id: "com.akaiunsan.customer",
      name: 'My channel',
      description: `Category channel > com.akaiunsan.customer`,
      sound: 'default',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });

    await notifee.displayNotification({
      title: remoteMessage?.notification?.title,
      body: remoteMessage?.notification?.body,
      data: remoteMessage?.data,
      android: {
        channelId: "com.akaiunsan.customer",
      },
    });
  };


  // OTA updates are intentionally not part of the Akaiunsan runtime.
  if (!isLoadingComplete) {
    return null
  }

  return (
    <Provider store={redux.store}>
      <PersistGate loading={null} persistor={redux.persistor}>
        <Navigation  />
      </PersistGate>
    </Provider>
  );
}
