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
  return { Overlay, SearchBar, Divider, Slider };
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
  }));
  return { __esModule: true, default: messaging };
});

// PositionSelect pulls useFocusEffect from core; a no-op keeps the location
// side-effect out of the renderer (the real navigator crashes under jest-expo).
jest.mock("@react-navigation/core", () => ({
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
