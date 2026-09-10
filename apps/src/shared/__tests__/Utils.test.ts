import Enum from "../Enum";
import {
  getRegionForCoordinates,
  removeVietnameseTones,
  paramArray,
  getStatus,
  getSpecialRequest,
  rankBackground,
} from "../Utils";
import i18n from "../I18n";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en", countryCode: "US" }],
  locale: "en-US",
}));

const loadUtilsWithPlatform = (os: string) => {
  jest.resetModules();
  jest.doMock("react-native", () => ({ Platform: { OS: os } }));
  return require("../Utils");
};

describe("getRegionForCoordinates characterization", () => {
  it("single point maps onto itself with zero deltas", () => {
    expect(getRegionForCoordinates([{ latitude: 13.7, longitude: 100.5 }])).toEqual({
      latitude: 13.7,
      longitude: 100.5,
      latitudeDelta: 0,
      longitudeDelta: 0,
    });
  });

  it("two points produce the bounding box", () => {
    const region = getRegionForCoordinates([
      { latitude: 10, longitude: 100 },
      { latitude: 12, longitude: 104 },
    ]);
    expect(region).toEqual({
      latitude: 11,
      longitude: 102,
      latitudeDelta: 2,
      longitudeDelta: 4,
    });
  });
});

describe("removeVietnameseTones characterization", () => {
  it("strips diacritics and maps đ/Đ", () => {
    expect(removeVietnameseTones("Đđộ")).toBe("Ddo");
    expect(removeVietnameseTones("Tiếng Việt")).toBe("Tieng Viet");
  });
});

describe("paramArray characterization", () => {
  it("builds query params from key/value object array", () => {
    expect(paramArray([{ a: 1 }, { b: "x" }])!.toString()).toBe("a=1&b=x");
  });

  it("returns undefined for empty or missing input", () => {
    expect(paramArray(null)).toBeUndefined();
    expect(paramArray([])).toBeUndefined();
  });
});

describe("getStatus characterization", () => {
  beforeAll(() => {
    // This characterization suite asserts the legacy English labels. The app
    // default is Vietnamese, so the test must select its language explicitly.
    i18n.locale = "en";
  });

  it("maps numeric statuses to english labels", () => {
    expect(getStatus(0)).toBe("Pending");
    expect(getStatus(1)).toBe("Match");
    expect(getStatus(3)).toBe("Cancel");
    // pins current behavior: "Waiting confirm" key is missing from en —
    // users see the i18n.js missing-translation placeholder for status 5
    expect(getStatus(5)).toBe('[missing "en.Waiting confirm" translation]');
    expect(getStatus(99)).toBe("Confirmed");
  });

  it("status 2 without order keeps a trailing space", () => {
    // pins current behavior
    expect(getStatus(2)).toBe("Completed ");
  });

  it("status 2 with order appends booking hour formatted H:mm A", () => {
    expect(
      getStatus(2, { bookingDetail: { bookingHour: "2023-01-01T09:30:00" } })
    ).toBe("Completed - 9:30 AM");
  });

  it("status 4 with order appends booking date field (not hour)", () => {
    // pins current behavior: reads bookingDate but formats it as a time,
    // and "H:mm A" produces 24h hour + AM/PM ("14:00 PM")
    expect(
      getStatus(4, { bookingDetail: { bookingDate: "2023-01-01T14:00:00" } })
    ).toBe("On Process - 14:00 PM");
  });
});

describe("getSpecialRequest characterization", () => {
  it("maps 1/2/3 to Approved/Reject/Create and default empty", () => {
    expect(getSpecialRequest(1)).toBe("Approved");
    expect(getSpecialRequest(2)).toBe("Reject");
    expect(getSpecialRequest(3)).toBe("Create");
    expect(getSpecialRequest(0)).toBe("");
  });
});

describe("rankBackground characterization", () => {
  it("resolves asset requires for each rank tier", () => {
    // RN 0.86 (jest-expo 57) resolves static image requires to an asset
    // object (`{ testUri }` under jest) instead of the legacy numeric module
    // id, so we pin the object contract and per-tier binding here.
    const r1 = rankBackground(1);
    const r2 = rankBackground(2);
    const r3 = rankBackground(3);
    expect(typeof r1).toBe("object");
    expect(typeof r2).toBe("object");
    expect(typeof r3).toBe("object");
    expect(r2).not.toBe(r1);
    expect(r3).not.toBe(r1);
  });
});

describe("currentPlatform characterization", () => {
  it("ios maps to Enum.PlatformType.IOS", () => {
    const Utils = loadUtilsWithPlatform("ios");
    expect(Utils.currentPlatform()).toBe(Enum.PlatformType.IOS);
  });

  it("android maps to Enum.PlatformType.ANDROID", () => {
    const Utils = loadUtilsWithPlatform("android");
    expect(Utils.currentPlatform()).toBe(Enum.PlatformType.ANDROID);
  });

  it("web maps to Enum.PlatformType.WEBSITE", () => {
    const Utils = loadUtilsWithPlatform("web");
    expect(Utils.currentPlatform()).toBe(Enum.PlatformType.WEBSITE);
  });

  it("unknown OS is undefined", () => {
    const Utils = loadUtilsWithPlatform("macos");
    expect(Utils.currentPlatform()).toBeUndefined();
  });
});
