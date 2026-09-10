import Config from "react-native-config";
import { shouldCollectAnalytics } from "./analytics";

type AnalyticsModule = {
  getAnalytics?: () => unknown;
  logEvent?: (
    analytics: unknown,
    name: string,
    parameters?: Record<string, unknown>
  ) => Promise<void>;
  setAnalyticsCollectionEnabled?: (
    analytics: unknown,
    enabled: boolean
  ) => Promise<void>;
};

type CrashlyticsModule = {
  getCrashlytics?: () => unknown;
  setCrashlyticsCollectionEnabled?: (
    crashlytics: unknown,
    enabled: boolean
  ) => Promise<null>;
};

type MessagingModule = {
  AuthorizationStatus?: {
    AUTHORIZED?: number;
    PROVISIONAL?: number;
  };
  getMessaging?: () => unknown;
  getInitialNotification?: (messaging: unknown) => Promise<unknown>;
  getToken?: (messaging: unknown) => Promise<string>;
  onMessage?: (
    messaging: unknown,
    listener: (message: unknown) => unknown
  ) => () => void;
  onNotificationOpenedApp?: (
    messaging: unknown,
    listener: (message: unknown) => unknown
  ) => () => void;
  requestPermission?: (messaging: unknown) => Promise<number>;
  setAutoInitEnabled?: (messaging: unknown, enabled: boolean) => Promise<void>;
  setBackgroundMessageHandler?: (
    messaging: unknown,
    handler: (message: unknown) => Promise<void>
  ) => void;
};

export type FirebaseMessagingHandle = {
  module: MessagingModule;
  service: unknown;
};

const getRuntimeEnvironment = (): string =>
  Config.EXPO_PUBLIC_SENTRY_ENV ||
  process.env.EXPO_PUBLIC_SENTRY_ENV ||
  (__DEV__ ? "development" : "production");

export const isFirebaseCollectionEnabled = (): boolean =>
  shouldCollectAnalytics(getRuntimeEnvironment(), __DEV__);

const loadAnalyticsModule = (): AnalyticsModule | undefined => {
  try {
    return require("@react-native-firebase/analytics") as AnalyticsModule;
  } catch (error) {
    console.warn("Unable to load Firebase Analytics", error);
    return undefined;
  }
};

const loadCrashlyticsModule = (): CrashlyticsModule | undefined => {
  try {
    return require("@react-native-firebase/crashlytics") as CrashlyticsModule;
  } catch (error) {
    console.warn("Unable to load Firebase Crashlytics", error);
    return undefined;
  }
};

const loadMessagingModule = (): MessagingModule | undefined => {
  try {
    return require("@react-native-firebase/messaging") as MessagingModule;
  } catch (error) {
    console.warn("Unable to load Firebase Messaging", error);
    return undefined;
  }
};

export const configureFirebaseTelemetry = (): void => {
  if (!isFirebaseCollectionEnabled()) return;

  const analyticsModule = loadAnalyticsModule();
  const analytics = analyticsModule?.getAnalytics?.();
  if (analytics && analyticsModule?.setAnalyticsCollectionEnabled) {
    void analyticsModule
      .setAnalyticsCollectionEnabled(analytics, true)
      .catch((error) => console.warn("Unable to enable Firebase Analytics", error));
  }

  const crashlyticsModule = loadCrashlyticsModule();
  const crashlytics = crashlyticsModule?.getCrashlytics?.();
  if (crashlytics && crashlyticsModule?.setCrashlyticsCollectionEnabled) {
    void crashlyticsModule
      .setCrashlyticsCollectionEnabled(crashlytics, true)
      .catch((error) => console.warn("Unable to enable Firebase Crashlytics", error));
  }
};

export const logAnalyticsEvent = async (
  name: string,
  parameters?: Record<string, unknown>
): Promise<void> => {
  if (!isFirebaseCollectionEnabled()) return;

  try {
    const analyticsModule = loadAnalyticsModule();
    const analytics = analyticsModule?.getAnalytics?.();
    if (analytics && analyticsModule?.logEvent) {
      await analyticsModule.logEvent(analytics, name, parameters);
    }
  } catch (error) {
    // Telemetry must never block authentication or booking flows.
    console.warn(`Unable to log Firebase Analytics event: ${name}`, error);
  }
};

export const getFirebaseMessaging = (): FirebaseMessagingHandle | undefined => {
  if (!isFirebaseCollectionEnabled()) return undefined;

  try {
    const module = loadMessagingModule();
    const service = module?.getMessaging?.();
    return module && service ? { module, service } : undefined;
  } catch (error) {
    console.warn("Unable to initialize Firebase Messaging", error);
    return undefined;
  }
};

export const getFirebaseMessagingToken = async (): Promise<string | undefined> => {
  const messaging = getFirebaseMessaging();
  if (!messaging?.module.getToken) return undefined;

  try {
    return await messaging.module.getToken(messaging.service);
  } catch (error) {
    console.warn("Unable to get Firebase Messaging token", error);
    return undefined;
  }
};
