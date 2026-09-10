type FirebaseMocks = {
  analytics: {
    getAnalytics: jest.Mock;
    logEvent: jest.Mock;
    setAnalyticsCollectionEnabled: jest.Mock;
  };
  crashlytics: {
    getCrashlytics: jest.Mock;
    setCrashlyticsCollectionEnabled: jest.Mock;
  };
  messaging: {
    getMessaging: jest.Mock;
    getToken: jest.Mock;
    setAutoInitEnabled: jest.Mock;
    requestPermission: jest.Mock;
  };
};

const loadFirebase = (environment: string | undefined) => {
  jest.resetModules();

  const mocks: FirebaseMocks = {
    analytics: {
      getAnalytics: jest.fn(() => "analytics-service"),
      logEvent: jest.fn().mockResolvedValue(undefined),
      setAnalyticsCollectionEnabled: jest.fn().mockResolvedValue(undefined),
    },
    crashlytics: {
      getCrashlytics: jest.fn(() => "crashlytics-service"),
      setCrashlyticsCollectionEnabled: jest.fn().mockResolvedValue(null),
    },
    messaging: {
      getMessaging: jest.fn(() => "messaging-service"),
      getToken: jest.fn().mockResolvedValue("fcm-token"),
      setAutoInitEnabled: jest.fn().mockResolvedValue(undefined),
      requestPermission: jest.fn().mockResolvedValue(1),
    },
  };

  jest.doMock("react-native-config", () => ({
    __esModule: true,
    default: { EXPO_PUBLIC_SENTRY_ENV: environment },
  }));
  jest.doMock("@react-native-firebase/analytics", () => ({
    __esModule: true,
    ...mocks.analytics,
  }));
  jest.doMock("@react-native-firebase/crashlytics", () => ({
    __esModule: true,
    ...mocks.crashlytics,
  }));
  jest.doMock("@react-native-firebase/messaging", () => ({
    __esModule: true,
    AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
    ...mocks.messaging,
  }));

  return {
    firebase: require("../firebase") as typeof import("../firebase"),
    mocks,
  };
};

describe("Firebase runtime adapter", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it.each(["local", "development"])(
    "does not load Firebase services in %s",
    async (environment) => {
      const { firebase, mocks } = loadFirebase(environment);

      expect(firebase.isFirebaseCollectionEnabled()).toBe(false);
      await firebase.logAnalyticsEvent("login");

      expect(firebase.getFirebaseMessaging()).toBeUndefined();
      expect(mocks.analytics.getAnalytics).not.toHaveBeenCalled();
      expect(mocks.analytics.logEvent).not.toHaveBeenCalled();
      expect(mocks.messaging.getMessaging).not.toHaveBeenCalled();
    }
  );

  it("configures production telemetry and exposes messaging services", async () => {
    const { firebase, mocks } = loadFirebase("production");

    expect(firebase.isFirebaseCollectionEnabled()).toBe(true);
    firebase.configureFirebaseTelemetry();
    await firebase.logAnalyticsEvent("signup", { method: "password" });

    expect(mocks.analytics.setAnalyticsCollectionEnabled).toHaveBeenCalledWith(
      "analytics-service",
      true
    );
    expect(mocks.crashlytics.setCrashlyticsCollectionEnabled).toHaveBeenCalledWith(
      "crashlytics-service",
      true
    );
    expect(mocks.analytics.logEvent).toHaveBeenCalledWith(
      "analytics-service",
      "signup",
      { method: "password" }
    );

    const messaging = firebase.getFirebaseMessaging();
    expect(messaging?.service).toBe("messaging-service");
    await expect(firebase.getFirebaseMessagingToken()).resolves.toBe("fcm-token");
    expect(mocks.messaging.getToken).toHaveBeenCalledWith("messaging-service");
  });

  it("contains telemetry and messaging errors so app flows keep working", async () => {
    const { firebase, mocks } = loadFirebase("staging");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.analytics.logEvent.mockRejectedValue(new Error("analytics offline"));
    mocks.messaging.getToken.mockRejectedValue(new Error("messaging offline"));

    await expect(firebase.logAnalyticsEvent("login")).resolves.toBeUndefined();
    await expect(firebase.getFirebaseMessagingToken()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it("tolerates optional Firebase packages that cannot load", () => {
    jest.resetModules();
    jest.doMock("react-native-config", () => ({
      __esModule: true,
      default: { EXPO_PUBLIC_SENTRY_ENV: "production" },
    }));
    jest.doMock("@react-native-firebase/analytics", () => {
      throw new Error("analytics package unavailable");
    });
    jest.doMock("@react-native-firebase/crashlytics", () => {
      throw new Error("crashlytics package unavailable");
    });
    jest.doMock("@react-native-firebase/messaging", () => {
      throw new Error("messaging package unavailable");
    });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const firebase = require("../firebase") as typeof import("../firebase");

    expect(() => firebase.configureFirebaseTelemetry()).not.toThrow();
    expect(firebase.getFirebaseMessaging()).toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});
