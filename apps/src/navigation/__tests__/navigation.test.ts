import Constants from "../../shared/Constants";
import {
  deepLinkRoute,
  gateForToken,
  linkingConfig,
} from "../contracts";

describe("Navigation contracts", () => {
  it("pins the linking config: akaiunsan:// prefix and the login route path", () => {
    expect(linkingConfig.prefixes).toEqual(["akaiunsan://"]);
    expect(linkingConfig.config.screens).toEqual({
      "Auth/Login": "com.akaiunsan.customer",
    });
  });

  it("maps every known FCM data.type to its deep-link route", () => {
    // type 0 -> booking detail, 1/2 -> promotion detail, 3/4 -> inbox detail
    expect(deepLinkRoute({ type: "0" })).toBe(Constants.SCREENS.BOOKING.DETAIL);
    expect(deepLinkRoute({ type: "1" })).toBe(Constants.SCREENS.PROMOTIOM.DETAIL);
    expect(deepLinkRoute({ type: "2" })).toBe(Constants.SCREENS.PROMOTIOM.DETAIL);
    expect(deepLinkRoute({ type: "3" })).toBe(Constants.SCREENS.OTHER.INBOXDETAIL);
    expect(deepLinkRoute({ type: "4" })).toBe(Constants.SCREENS.OTHER.INBOXDETAIL);
  });

  it("resolves unknown, missing and malformed data to the no-op route", () => {
    expect(deepLinkRoute({ type: "99" })).toBe("");
    expect(deepLinkRoute({})).toBe("");
    expect(deepLinkRoute(null)).toBe("");
    expect(deepLinkRoute(undefined)).toBe("");
  });

  it("gateForToken renders the auth stack without a token and the app stack with one", () => {
    expect(gateForToken("")).toBe("auth");
    expect(gateForToken(null)).toBe("auth");
    expect(gateForToken(undefined)).toBe("auth");
    expect(gateForToken("jwt-token")).toBe("app");
  });
});