import React,{useEffect} from "react";
import Navigation from "./src/navigation";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/lib/integration/react";
import redux from "./src/redux/store";
import messaging from '@react-native-firebase/messaging';
import useCachedResources from "./src/hooks/useCachedResources";
import updateResources from "./src/hooks/updateSource";
import { isEmpty } from "lodash";
import PushNotification, { Importance } from "react-native-push-notification";
import analytics from "@react-native-firebase/analytics";

export default function App() {
  const isLoadingComplete = useCachedResources();
  const isLoadingUpdate = updateResources();

  useEffect(() => {
    checkExitsChannel(
      "com.ayasan.yoda.android",
      createChannel("com.ayasan.yoda.android")
    )

    async function requestUserPermission() {
      // await messaging().registerDeviceForRemoteMessages()
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
    }
    requestUserPermission()

    const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
      createNotification(remoteMessage)
      await analytics().logEvent("notification", remoteMessage);
    });

    return unsubscribe;
  }, [])

  const checkExitsChannel = (channelId: string, callBack: any) => {
    PushNotification.channelExists(channelId, (exists: boolean) => {
      if (!exists) {
        callBack
      }
    })
  }

  const createChannel = (channelId: string) => {
    PushNotification.createChannel(
      {
        channelId: channelId,
        channelName: 'My channel',
        channelDescription: `Category channel > ${channelId}`,
        playSound: true,
        soundName: 'default',
        importance: Importance.HIGH,
      
        vibrate: true,
      },
      (created: any) => {
        PushNotification.getChannels((channel_ids: any) => {
          console.log('Current channel ids: ', channel_ids)
        })
      }
    )
  }

  const createNotification = (notifyData: any) => {
    if (!isEmpty(notifyData.data)) {
      // Send from FCM console
      PushNotification.localNotification({
        channelId: "com.ayasan.yoda.android",
        ignoreInForeground: false,
        title: notifyData?.notification?.title,
        message: notifyData?.notification?.body,
        playSound: true,
        data: notifyData?.data // lỗi type script lib, vẫn add field data
      })
    } else {
      // Send from BE
      PushNotification.localNotification({
        channelId: "com.ayasan.yoda.android",
        ignoreInForeground: false,
        title: notifyData?.notification?.title,
        message: notifyData?.notification?.body,
        playSound: true,
      })
    }
  }
  

  if (!isLoadingComplete || !isLoadingUpdate) {
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
