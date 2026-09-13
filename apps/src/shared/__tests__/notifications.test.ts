import {
  incrementNotificationBadgeCount,
  setNotificationBadgeCount,
} from "../notifications";
import notifee from "@notifee/react-native";

jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: {
    setBadgeCount: jest.fn().mockResolvedValue(undefined),
    incrementBadgeCount: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("notification badge adapter", () => {
  const badge = notifee as jest.Mocked<typeof notifee>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clamps and forwards badge counts", () => {
    setNotificationBadgeCount(-2);
    expect(badge.setBadgeCount).toHaveBeenCalledWith(0);
  });

  it("contains rejected badge promises", async () => {
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    badge.setBadgeCount.mockRejectedValueOnce(new Error("permission denied"));

    setNotificationBadgeCount(2);
    await new Promise((resolve) => setImmediate(resolve));

    expect(warning).toHaveBeenCalledWith(
      "Unable to update notification badge",
      expect.any(Error)
    );
    warning.mockRestore();
  });

  it("contains rejected increment promises", async () => {
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    badge.incrementBadgeCount.mockRejectedValueOnce(new Error("unsupported"));

    incrementNotificationBadgeCount();
    await new Promise((resolve) => setImmediate(resolve));

    expect(warning).toHaveBeenCalledWith(
      "Unable to increment notification badge",
      expect.any(Error)
    );
    warning.mockRestore();
  });
});
