jest.mock("react-native-gesture-handler", () => {
  const ReactNative = require("react-native");
  return {
    FlatList: ReactNative.FlatList,
    ScrollView: ReactNative.ScrollView,
    TouchableOpacity: ReactNative.TouchableOpacity,
    TouchableWithoutFeedback: ReactNative.TouchableWithoutFeedback,
    GestureHandlerRootView: ReactNative.View,
  };
});

// Global native-module mocks for the component characterization suite
// (docs/mobile-app-upgrade-plan.md Phase 1). jest-expo auto-mocks the *native*
// half of the Expo SDK, but several JS layers render heavy native UI or hit
// native APIs we want to keep out of the test renderer, so we provide explicit
// lightweight stand-ins here. Keep factories self-contained (no out-of-scope
// variables) and free of side effects that would break existing suites.

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const makeIcon = (name) => {
    const Icon = () => React.createElement(React.Fragment, null);
    Icon.font = { [`font-${name}`]: `/fonts/${name}.ttf` };
    return Icon;
  };
  return {
    FontAwesome: makeIcon("FontAwesome"),
    FontAwesome5: makeIcon("FontAwesome5"),
    Ionicons: makeIcon("Ionicons"),
    SimpleLineIcons: makeIcon("SimpleLineIcons"),
    AntDesign: makeIcon("AntDesign"),
    Feather: makeIcon("Feather"),
    MaterialIcons: makeIcon("MaterialIcons"),
    Fontisto: makeIcon("Fontisto"),
    MaterialCommunityIcons: makeIcon("MaterialCommunityIcons"),
  };
});

jest.mock("react-native-elements", () => {
  const React = require("react");
  // Overlay renders its (Modal-wrapped) children only while open; everything
  // inside the heavy overlays is exercised by the open-state interactions.
  const Overlay = ({ isVisible = true, children }) =>
    isVisible ? React.createElement(React.Fragment, null, children) : null;
  const SearchBar = (props) => React.createElement("TextInput", props);
  const Divider = () => null;
  const Slider = () => null;
  const Button = (props) => React.createElement("View", props, props.children);
  const CheckBox = (props) => React.createElement("View", props);
  const AirbnbRating = (props) => React.createElement("View", props);
  return { Overlay, SearchBar, Divider, Slider, Button, CheckBox, AirbnbRating };
});

jest.mock("react-native-calendars", () => {
  const React = require("react");
  const Calendar = () => React.createElement("View", null);
  return { Calendar };
});

jest.mock("@ptomasroos/react-native-multi-slider", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("react-native-stars", () => ({
  __esModule: true,
  default: () => null,
}));

// google-places-autocomplete fires debounced XHR fetches on text change; there
// is no XHR in the Node env, so provide a controlled TextInput stand-in.
jest.mock("react-native-google-places-autocomplete", () => {
  const React = require("react");
  const GooglePlacesAutocomplete = (props) =>
    React.createElement("TextInput", props);
  return { __esModule: true, GooglePlacesAutocomplete };
});

// react-native-action-button reads its Stylesheet at import time in a way the
// Node env chokes on; the smoke suite only needs a renderable stand-in.
jest.mock("react-native-action-button", () => {
  const React = require("react");
  const ActionButton = ({ children, ...props }) =>
    React.createElement("View", props, children);
  ActionButton.Item = ({ children, ...props }) =>
    React.createElement("View", props, children);
  return { __esModule: true, default: ActionButton };
});

// Same import-time issue as action-button (deprecated upstream, Phase 4 sweep
// will replace it); carousel drives a ScrollView under the hood.
jest.mock("react-native-snap-carousel", () => {
  const React = require("react");
  const Carousel = ({ children, renderItem, ...props }) =>
    React.createElement(
      "View",
      props,
      typeof renderItem === "function"
        ? null
        : children
    );
  Carousel.defaultProps = { parallaxScrollingScale: 1 };
  return { __esModule: true, default: Carousel };
});

jest.mock("react-native-webview", () => {
  const React = require("react");
  const WebView = () => React.createElement("View", null);
  return { __esModule: true, default: WebView, WebView };
});

jest.mock("react-native-maps", () => {
  const React = require("react");
  const MapView = ({ children }) => React.createElement("View", null, children);
  const Marker = ({ children }) => React.createElement("View", null, children);
  return { __esModule: true, default: MapView, MapView, Marker };
});

jest.mock("react-native-config", () => ({
  __esModule: true,
  default: { API_URL: "https://api.test", OMISEKEY: "pk_test_000", OMISEADDCARD: "https://payment.test/card" },
}));

jest.mock("react-native-device-info", () => ({
  __esModule: true,
  default: {
    getModel: () => "test",
    getSystemVersion: () => "1.0",
    getUniqueId: () => "unique-id",
    getVersion: () => "1.0.0",
    getBuildNumber: () => "1",
  },
}));

jest.mock("expo-location", () => ({
  Accuracy: { Highest: 6, Balanced: 3, Low: 1 },
  PermissionStatus: { GRANTED: "granted", DENIED: "denied", UNDETERMINED: "undetermined" },
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: {
      latitude: 13.7563309,
      longitude: 100.5017651,
      altitude: null,
      accuracy: 5.0,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: 0,
  }),
  geocodeAsync: jest.fn().mockResolvedValue([]),
  enableNetworkProviderAsync: jest.fn().mockResolvedValue(undefined),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([]),
  requestForegroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted", granted: true, canAskAgain: true }),
  requestBackgroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted", granted: true, canAskAgain: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn(), id: 1 })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn(), id: 2 })),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { TIME_INTERVAL: "timeInterval" },
  AndroidImportance: { MAX: 5, DEFAULT: 3 },
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { isDevice: false, platform: { ios: { model: "test" } } },
}));

// SDK 57's jest-expo no longer provides the native `locale` that the i18n
// singleton reads at import time; supply it globally (per-file mocks override).
jest.mock("expo-localization", () => ({
  locale: "en-US",
  getLocales: () => [{ languageCode: "en", countryCode: "US" }],
  isRTL: false,
}));

jest.mock("expo-image-picker", () => ({
  MediaTypeOptions: { Images: "Images", All: "All" },
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ cancelled: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ cancelled: true }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted" }),
}));

jest.mock("@react-native-firebase/app", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@react-native-firebase/messaging", () => {
  const messaging = jest.fn(() => ({
    getToken: jest.fn().mockResolvedValue("mock-fcm-token"),
    hasPermission: jest.fn().mockResolvedValue(true),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    getIsHeadless: jest.fn().mockResolvedValue(false),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    onTokenRefresh: jest.fn(() => jest.fn()),
    registerDeviceForRemoteMessages: jest.fn().mockResolvedValue(undefined),
    isDeviceRegisteredForRemoteMessages: jest.fn().mockResolvedValue(true),
    unregisterDeviceForRemoteMessages: jest.fn().mockResolvedValue(undefined),
    requestPermission: jest.fn().mockResolvedValue(1),
    hasForegroundPermissions: jest.fn().mockResolvedValue(true),
    setBackgroundMessageHandler: jest.fn(),
  }));
  messaging.AuthorizationStatus = {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  };
  return { __esModule: true, default: messaging };
});

jest.mock("@react-native-firebase/analytics", () => {
  const analytics = jest.fn(() => ({
    logEvent: jest.fn().mockResolvedValue(undefined),
    setUserId: jest.fn().mockResolvedValue(undefined),
    setUserProperties: jest.fn().mockResolvedValue(undefined),
    logLogin: jest.fn().mockResolvedValue(undefined),
    logScreenView: jest.fn().mockResolvedValue(undefined),
    setAnalyticsCollectionEnabled: jest.fn().mockResolvedValue(undefined),
  }));
  return { __esModule: true, default: analytics };
});

// notifee (Phase 2 push stack) — display/channel/badge APIs stay out of the
// native layer; the notification-open listeners are never wired in tests.
jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue("channel-id"),
    createChannelGroup: jest.fn().mockResolvedValue("group-id"),
    displayNotification: jest.fn().mockResolvedValue("notif-id"),
    setBadgeCount: jest.fn().mockResolvedValue(true),
    getBadgeCount: jest.fn().mockResolvedValue(0),
    incrementBadgeCount: jest.fn().mockResolvedValue(true),
    decrementBadgeCount: jest.fn().mockResolvedValue(true),
    requestPermission: jest
      .fn()
      .mockResolvedValue({ notification: true, badge: true }),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(() => jest.fn()),
    AndroidImportance: { NONE: 0, MIN: 1, LOW: 2, DEFAULT: 3, HIGH: 4, MAX: 5 },
  },
}));

jest.mock("react-native-fast-image", () => {
  const React = require("react");
  const FastImage = ({ children, ...props }) =>
    React.createElement("View", props, children);
  FastImage.priority = { low: "low", normal: "normal", high: "high" };
  FastImage.cacheControl = {
    immutable: "immutable",
    web: "web",
    cacheOnly: "cacheOnly",
  };
  FastImage.resizeMode = { contain: "contain", cover: "cover", stretch: "stretch", center: "center" };
  return { __esModule: true, default: FastImage };
});

jest.mock("@react-native-picker/picker", () => {
  const React = require("react");
  const Picker = ({ children, ...props }) =>
    React.createElement("View", props, children);
  Picker.Item = ({ label }) => React.createElement("View", null, label);
  return { __esModule: true, Picker };
});

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const DateTimePicker = (props) => React.createElement("View", props);
  return { __esModule: true, default: DateTimePicker };
});

jest.mock("@react-native-clipboard/clipboard", () => ({
  __esModule: true,
  default: {
    setString: jest.fn(),
    getString: jest.fn(() => ""),
  },
}));

jest.mock("@react-native-google-signin/google-signin", () => {
  const React = require("react");
  const GoogleSigninButton = (props) => React.createElement("View", props);
  GoogleSigninButton.Size = { Icon: 0, Standard: 1, Wide: 2 };
  GoogleSigninButton.Color = { Auto: 0, Light: 1, Dark: 2 };
  return {
    __esModule: true,
    GoogleSignin: {
      configure: jest.fn(),
      hasPlayServices: jest.fn().mockResolvedValue(true),
      signIn: jest
        .fn()
        .mockResolvedValue({ idToken: "id-token", user: { id: "g-id", name: "Test", email: "g@test.dev" } }),
      signInSilently: jest.fn().mockResolvedValue(null),
      isSignedIn: jest.fn().mockResolvedValue(false),
      getCurrentUser: jest.fn().mockResolvedValue(null),
      signOut: jest.fn().mockResolvedValue(undefined),
      revokeAccess: jest.fn().mockResolvedValue(undefined),
      clearCachedAccessToken: jest.fn().mockResolvedValue("token"),
    },
    GoogleSigninButton,
    statusCodes: { IN_PROGRESS: 0, PLAY_SERVICES_NOT_AVAILABLE: 1, SIGN_IN_REQUIRED: 2, SIGN_IN_CANCELLED: 3 },
  };
});

// PositionSelect pulls useFocusEffect from core; a no-op keeps the location
// side-effect out of the renderer (the real navigator crashes under jest-expo).
// Everything else stays real — @react-navigation/native proxies useNavigation
// & friends through core getters, so stubbing the whole module would break it.
jest.mock("@react-navigation/core", () => ({
  __esModule: true,
  ...jest.requireActual("@react-navigation/core"),
  useFocusEffect: () => {},
}));

// Substitute the real axios transport so any request fired by a mounted
// component settles deterministically. Each test file configures the resolved
// payload via `(axios as any).mockResolvedValue(...)`.
jest.mock("axios", () => {
  const request = jest.fn();
  request.get = jest.fn();
  request.post = jest.fn();
  request.put = jest.fn();
  request.default = request;
  return request;
});

// RN 0.64 + jest-expo run components in the Node env, which has no global
// FormData despite CameraLibrary.postImage building a multipart body at runtime.
if (typeof globalThis.FormData === "undefined") {
  class FormDataStub {
    constructor() {
      this._data = [];
    }
    append(key, value) {
      this._data.push({ key, value });
    }
    toString() {
      return this._data.map((d) => `${d.key}=${d.value}`).join("&");
    }
  }
  globalThis.FormData = FormDataStub;
}
