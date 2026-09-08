import React,{useEffect} from "react";
import Navigation from "./src/navigation";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/lib/integration/react";
import redux from "./src/redux/store";
import messaging from '@react-native-firebase/messaging';
import useCachedResources from "./src/hooks/useCachedResources";
import notifee, { AndroidImportance } from "@notifee/react-native";
import analytics from "@react-native-firebase/analytics";

export default function App() {
  const isLoadingComplete = useCachedResources();

  useEffect(() => {
    const messagingService =
      typeof messaging === "function" ? messaging() : undefined;
    requestUserPermission()

    async function requestUserPermission() {
      if (typeof messagingService?.requestPermission !== "function") return;
      // await messaging().registerDeviceForRemoteMessages()
      const authStatus = await messagingService.requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
    }

    const unsubscribe =
      typeof messagingService?.onMessage === "function"
        ? messagingService.onMessage(async (remoteMessage: any) => {
            await createNotification(remoteMessage)
            await analytics().logEvent("notification", remoteMessage);
          })
        : undefined;

    return unsubscribe;
  }, [])

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
  }
  


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
