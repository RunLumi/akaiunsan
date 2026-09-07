import Constants from "../shared/Constants";

// ---- Testable navigation contracts (Phase 1 characterization) --------------
// Pure data / pure functions so they survive the Phase 2 replatform (typed
// static routes in Phase 3 build on these). Kept in their own module so the
// contract tests never import the heavy navigation tree (which pulls
// @react-navigation/stack and friends into the renderer).

export const linkingConfig = {
  prefixes: ["akaiunsan://"],
  config: {
    screens: {
      "Auth/Login": "com.akaiunsan.customer",
    },
  },
};

// FCM `data.type` → deep-link route. Types 0..4 are handled, anything else
// resolves to "" (the app keeps that as "do nothing").
export const deepLinkRoute = (data: any): string => {
  switch (data && data.type) {
    case "0":
      return Constants.SCREENS.BOOKING.DETAIL;
    case "1":
      return Constants.SCREENS.PROMOTIOM.DETAIL;
    case "2":
      return Constants.SCREENS.PROMOTIOM.DETAIL;
    case "3":
      return Constants.SCREENS.OTHER.INBOXDETAIL;
    case "4":
      return Constants.SCREENS.OTHER.INBOXDETAIL;
    default:
      return "";
  }
};

// Auth gate: no token renders the Login/Signup stack, a token renders the app
// stack. `!token` in JSX is exactly this predicate.
export const gateForToken = (token: any): "auth" | "app" =>
  token ? "app" : "auth";