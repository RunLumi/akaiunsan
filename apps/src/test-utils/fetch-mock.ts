import Constants from "../shared/Constants";

// ---- RTK Query fetch router (Phase 5 strangler) -----------------------------
// Ported screens no longer go through axios (installApiRoutes in api-mock.ts);
// their data arrives via `fetchBaseQuery` -> global fetch. This module is the
// fetch-side twin of api-mock.ts: a URL(path)-keyed route table consulted by
// the global fetch stub in jest.setup.js, serving the same response shapes the
// axios router serves to the not-yet-ported screens.
//
// Routes keyed by the exact Constants.API path. A route value is either a body
// object or a function ({ url, path, query, method }) => body for endpoints
// whose payload depends on the request (pagination, orderStatus split, GET vs
// DELETE sharing one path).

export type FetchRouteContext = {
  url: string;
  path: string;
  query: string;
  method: string;
};

export type FetchRouteValue =
  | Record<string, any>
  | ((ctx: FetchRouteContext) => Record<string, any>);

export const fetchState = {
  routes: {} as Record<string, FetchRouteValue>,
  // Generic body for unlisted API endpoints (the fetch twin of the axios
  // suites' fallbackData). Only consulted for API URLs — geocode/google URLs
  // keep falling through to the geocode default in jest.setup.js.
  fallback: null as FetchRouteValue | null,
  // variants-suite controls (mirror axios empty/error/never-settling states)
  rejectAll: false,
  neverSettle: false,
};

// Item factories — keep these aligned with the axios fallback shapes in
// src/screens/__tests__/screens.smoke.test.tsx so callbacks read real data.
const listImage = [{ image: "" }];

const bannerItem = (type: number) => ({
  id: `banner-${type}`,
  type,
  name: "Test banner",
  image: "",
  listImage,
  serviceId: "svc-1",
  serviceItemId: "item-1",
  serviceName: "Test service",
  serviceType: 1,
});

const serviceItem = (serviceType: number) => ({
  id: `sm-${serviceType}`,
  serviceType,
  icon: "",
  serviceName: "Test service",
  serviceNameTl: "บริการทดสอบ",
  serviceId: "svc-1",
  serviceItemId: `item-${serviceType}`,
});

const promotionItem = () => ({
  id: "pu-1",
  type: 2,
  name: "Test promotion",
  image: "",
  listImage,
  data: JSON.stringify({ NotificationId: "n-1", PromotionId: "p-1" }),
});

const notificationItem = (type: number) => ({
  id: `noti-${type}`,
  type,
  title: "Test notification",
  content: "notification content",
  status: 1,
  isRead: false,
  createdDate: "2026-01-01T00:00:00.000Z",
  notificationId: "n-1",
  image: "",
  listImage,
  data: JSON.stringify({ NotificationId: "n-1", PromotionId: "p-1" }),
});

const jobItem = (orderStatus: number) => ({
  id: `job-${orderStatus}`,
  orderId: `ord-${orderStatus}`,
  orderDetailId: `od-${orderStatus}`,
  serviceName: "Test service",
  serviceType: 1,
  bookingDate: "2026-01-01T00:00:00.000Z",
  address: "Test address",
  orderStatus,
  star: 5,
  serviceProviderName: "Test helper",
  serviceProviderAvatar: "",
});

const cardItem = (id: string) => ({
  id,
  last_digits: "4242",
  name: "Test User",
  expiration_month: 12,
  expiration_year: 2027,
});

// GET /client/notifications also serves DELETE (delete_notification) and POST
// (read_all_notification) — one path, one route fn branching on method.
const notificationsRoute: FetchRouteValue = ({ method, query }) => {
  const verb = method.toUpperCase();
  if (verb !== "GET") return {};
  const params = new URLSearchParams(query);
  const page = Number(params.get("page") || 1);
  return {
    page,
    totalUnRead: 3,
    items:
      page === 1 ? [notificationItem(0), notificationItem(3)] : [],
  };
};

// GET /client/jobs: history (COMPLETED/CANCEL) vs upcoming (everything else)
const bookingsRoute: FetchRouteValue = ({ method, query }) => {
  if (method.toUpperCase() !== "GET") return {};
  const params = new URLSearchParams(query);
  const page = Number(params.get("page") || 1);
  const statuses = params.getAll("orderStatus").map(Number);
  const isHistory = statuses.includes(2) || statuses.includes(3);
  return {
    page,
    items: [jobItem(isHistory ? 2 : 0)],
  };
};

// GET /client/credit-cards also serves DELETE (payment_card_delete) and PUT
// (payment_card_default) — one path, one route fn branching on method.
const creditCardsRoute: FetchRouteValue = ({ method }) => {
  if (method.toUpperCase() !== "GET") return {};
  return {
    customer: { cards: { data: [cardItem("card-1")] }, default_card: "card-1" },
  };
};

// Defaults installed for every suite (jest.setup.js requires this module).
// Suites override per-path via installFetchRoutes without touching others.
export const DEFAULT_FETCH_ROUTES: Record<string, FetchRouteValue> = {
  // Home
  [Constants.API.get_profile]: {
    id: 1,
    fullName: "Test User",
    email: "test@akaiunsan.com",
    phoneNumber: "0123456789",
    address: "Bangkok",
    gender: 0,
    point: 100,
    // language 2 == "en": matches the preloaded state so Home does not arm
    // the update-language request on mount
    language: 2,
  },
  [Constants.API.update_language]: {},
  [Constants.API.list_favourite_service]: {
    items: [
      {
        id: "fs-1",
        isSelected: true,
        serviceName: "Test service",
        hour: 2,
        serviceId: "svc-1",
        type: 0,
        icon: "",
        listImage,
      },
    ],
  },
  [Constants.API.get_banner]: { items: [bannerItem(1), bannerItem(2)] },
  [Constants.API.services_management]: {
    items: [serviceItem(1), serviceItem(2)],
  },
  [Constants.API.promotion_updates]: { items: [promotionItem()] },
  [Constants.API.get_current_plan]: {
    items: [
      {
        id: "cp-1",
        serviceType: 1,
        name: "Plan",
        // Enum.SubscriptionStatus.ACTIVE
        subscriptionStatus: 2,
        price: 100,
        point: 10,
      },
    ],
  },
  [Constants.API.get_notification]: notificationsRoute,
  // Booking
  [Constants.API.get_booking]: bookingsRoute,
  // Payment — one shared path, method-aware
  [Constants.API.payment_card_list]: creditCardsRoute,
};

export const installFetchRoutes = (routes: Record<string, FetchRouteValue>) => {
  Object.assign(fetchState.routes, routes);
};

export const setFetchFallback = (body: FetchRouteValue | null) => {
  fetchState.fallback = body;
};

export const setFetchBehavior = (opts: {
  rejectAll?: boolean;
  neverSettle?: boolean;
}) => {
  if (opts.rejectAll !== undefined) fetchState.rejectAll = opts.rejectAll;
  if (opts.neverSettle !== undefined) fetchState.neverSettle = opts.neverSettle;
};

export const resetFetchRoutes = () => {
  fetchState.routes = { ...DEFAULT_FETCH_ROUTES };
  fetchState.fallback = null;
  fetchState.rejectAll = false;
  fetchState.neverSettle = false;
};

// Resolves a URL to its routed body, or undefined when no route matches
// (jest.setup.js then falls back to the auth/geocode defaults).
export const resolveFetchBody = (
  url: string,
  method = "GET"
): Record<string, any> | undefined => {
  const normalized = String(url);
  const path = normalized.replace(/^https?:\/\/[^/]+/i, "").split("?")[0];
  const query = normalized.includes("?")
    ? normalized.slice(normalized.indexOf("?") + 1)
    : "";
  const route = fetchState.routes[path];
  if (route !== undefined) {
    return typeof route === "function"
      ? route({ url: normalized, path, query, method: method.toUpperCase() })
      : route;
  }
  // API fallback (suite-level generic envelope) — never for geocode/google
  if (fetchState.fallback !== null && !/google|maps|geocode/i.test(normalized)) {
    return typeof fetchState.fallback === "function"
      ? fetchState.fallback({ url: normalized, path, query, method: method.toUpperCase() })
      : fetchState.fallback;
  }
  return undefined;
};

// initialize
resetFetchRoutes();
