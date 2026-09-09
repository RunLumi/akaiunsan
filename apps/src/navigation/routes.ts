import Constants from "../shared/Constants";
import i18n from "../shared/I18n";

// ---- Typed routes (Phase 3, React Navigation 7) -----------------------------
// Route names were raw/translatable strings; they are now typed constants
// derived from Constants.SCREENS (the single source of truth), and the
// React Navigation param list is derived from the same literals.
//
// This closes the pinned "translated route names" bug: BottomTab registers
// constant route names (TAB_ROUTES) while labels stay translated via
// `tabLabel`.

type StringValues<T> = T extends string
  ? T
  : { [K in keyof T]: StringValues<T[K]> }[keyof T];

// Every screen name registered on the root stack, as a literal union.
export type RouteName = StringValues<typeof Constants.SCREENS>;

// React Navigation's derived param list. Screens read `route.params` loosely,
// so params stay permissive; the union of NAMES is the contract.
export type RootStackParamList = Record<RouteName, any>;

// React Navigation 7 global lookup: `useNavigation`/linking resolve names
// against this list everywhere in the app. The namespace + empty interface
// body is the declaration-merging pattern React Navigation requires.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

// Canonical (loose) screen props. Screens read route params and parent
// callbacks freely; the named alias keeps `props: any` annotations out of the
// codebase and gives the per-screen typing pass a single place to tighten.
export type ScreenProps = any;

// The bottom-tab route names — the four names that were previously
// i18n-translated strings (a locale switch used to change route identity).
export const TAB_ROUTES = {
  HOME: Constants.SCREENS.MAIN.HOME,
  BOOKING: Constants.SCREENS.MAIN.BOOKING,
  INBOX: Constants.SCREENS.MAIN.INBOX,
  ACCOUNT: Constants.SCREENS.MAIN.ACCOUNT,
} as const;

export type TabRouteName =
  | typeof TAB_ROUTES.HOME
  | typeof TAB_ROUTES.BOOKING
  | typeof TAB_ROUTES.INBOX
  | typeof TAB_ROUTES.ACCOUNT;

// Bottom-tab labels stay translated (the old code put these IN `name`).
export const tabLabel = (route: TabRouteName): string => {
  switch (route) {
    case TAB_ROUTES.BOOKING:
      return i18n.t("Booking");
    case TAB_ROUTES.INBOX:
      return i18n.t("Inbox");
    case TAB_ROUTES.ACCOUNT:
      return i18n.t("Account");
    case TAB_ROUTES.HOME:
    default:
      return i18n.t("Home");
  }
};
