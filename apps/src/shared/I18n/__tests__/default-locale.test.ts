// The i18n singleton resolves its locale once, at import time: English
// devices get English, and everything else — including a device still set to
// Thai — falls back to the Vietnamese default.
const loadI18nWithDeviceLocale = (languageCode?: string) => {
  let i18n: any;
  jest.isolateModules(() => {
    jest.doMock("expo-localization", () => ({
      getLocales: () => (languageCode ? [{ languageCode }] : []),
    }));
    i18n = require("../index").default;
  });
  return i18n;
};

describe("i18n default locale resolution", () => {
  afterEach(() => {
    jest.dontMock("expo-localization");
  });

  it("defaults to Vietnamese on non-English devices", () => {
    expect(loadI18nWithDeviceLocale("fr").locale).toBe("vi");
  });

  it("English devices get English", () => {
    expect(loadI18nWithDeviceLocale("en").locale).toBe("en");
  });

  it("a Thai device locale falls back to Vietnamese (th is no longer shipped)", () => {
    expect(loadI18nWithDeviceLocale("th").locale).toBe("vi");
  });

  it("no available locale falls back to Vietnamese", () => {
    expect(loadI18nWithDeviceLocale(undefined).locale).toBe("vi");
  });
});
