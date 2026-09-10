// Phase 3: ambient declarations for untyped runtime deps slated for Phase 4
// replacement. Keeping them `any` here confines the implicit-any to the module
// boundary instead of every import site.
declare module "react-native-stars";
declare module "prop-types";

// The app is written against the legacy RNFirebase v20 default-export API
// (`import messaging from '@react-native-firebase/messaging'; messaging()`),
// but the installed package is the v26 modular API (named `getMessaging()`).
// Until the push stack is aligned in a later phase, type the legacy callable
// shape so the typecheck is green without changing runtime behavior.
declare module "@react-native-firebase/messaging" {
  const messaging: {
    (): {
      getToken: (opts?: unknown) => Promise<string>;
      getInitialNotification: () => Promise<any>;
      onMessage: (listener: (message: ApiItem) => void) => () => void;
      onNotificationOpenedApp: (listener: (message: ApiItem) => void) => () => void;
      registerDeviceForRemoteMessages: () => Promise<void>;
      requestPermission: () => Promise<number>;
      setBackgroundMessageHandler: (listener: (message: ApiItem) => void) => void;
    };
    AuthorizationStatus: Record<string, number>;
  };
  export default messaging;
}

declare module "@react-native-firebase/analytics" {
  const analytics: () => {
    logEvent: (name: string, payload?: unknown) => Promise<void>;
    setAnalyticsCollectionEnabled: (enabled: boolean) => Promise<void>;
    setUserId: (id: string | null) => Promise<void>;
    setUserProperties: (props: ScreenProps) => Promise<void>;
  };
  export default analytics;
}

declare module "@react-native-firebase/crashlytics" {
  const crashlytics: () => {
    setCrashlyticsCollectionEnabled: (enabled: boolean) => Promise<null>;
  };
  export default crashlytics;
}

// React Native's injected development-mode global (store.ts logger gate).
declare const __DEV__: boolean;
