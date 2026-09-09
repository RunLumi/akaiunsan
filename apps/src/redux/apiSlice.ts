import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Config from "react-native-config";
import i18n from "../shared/I18n";
import Constants from "../shared/Constants";

// Phase 5 RTK Query strangler (docs/mobile-app-upgrade-plan.md §5): the typed
// API slice starts with the Auth endpoints — the module that gates
// navigation — and grows module-by-module while `useApi` call-sites port over.
// The base query mirrors useApi's transport contract: baseURL from
// react-native-config, Bearer token, Accept-Language and platform headers.
export interface LoginResponse {
  auth_token: string;
  user?: Record<string, any>;
}

export interface SignupPayload {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  referralCode?: string;
  address?: string;
  avatar?: string;
  identityNumber?: string;
  gender?: any;
}

export interface SignupResponse {
  message?: string;
  user?: Record<string, any>;
}

// List-envelope responses the ported screens read (`items`, `page`,
// `totalUnRead`) — the direct JSON body the Express API returns.
export interface ItemsResponse {
  items?: any[];
  page?: number;
  totalUnRead?: number;
  [key: string]: any;
}

export interface PaymentCardsResponse {
  customer?: {
    cards?: { data?: any[] };
    default_card?: string;
  };
}

// useApi's per-call override shape: every ported endpoint accepts the same
// `{ params?, data? }` envelope its `request({...})` call sites pass.
export interface RequestArg {
  params?: any;
  data?: any;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: Config.API_URL,
    // useApi (axios) serialized URLSearchParams verbatim, preserving repeated
    // keys (`orderStatus=0&orderStatus=1…`). RTK's default does
    // `new URLSearchParams(stripUndefined(params))`, which spreads the
    // instance into an empty object on standard platforms — keep the axios
    // wire format instead.
    paramsSerializer: (params: any) =>
      params instanceof URLSearchParams
        ? params.toString()
        : new URLSearchParams(
            (Object.entries(params || {}) as [string, string][]).filter(
              ([, v]) => v !== undefined
            )
          ).toString(),
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any)?.auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Accept-Language", "en");
      headers.set("platform", "app");
      return headers;
    },
  }),
  // Default cache keys JSON-stringify the whole arg — a URLSearchParams param
  // serializes to `{}` for every call, collapsing list/history/paged requests
  // into one cache entry. Key on the serialized query string instead.
  serializeQueryArgs: ({ endpointName, queryArgs }: any) => {
    const params = queryArgs?.params;
    const key =
      params instanceof URLSearchParams
        ? params.toString()
        : params && typeof params === "object"
        ? JSON.stringify(params)
        : "";
    return `${endpointName}(${key})`;
  },
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { email: string; password: string }>(
      {
        query: (credentials) => ({
          url: Constants.API.login,
          method: "post",
          body: credentials,
        }),
      }
    ),
    signup: builder.mutation<SignupResponse, SignupPayload>({
      query: (payload) => ({
        url: Constants.API.register,
        method: "post",
        body: payload,
      }),
    }),

    // ---- Home (Phase 5 module port) ---------------------------------------
    updateLanguage: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({
        url: Constants.API.update_language,
        method: "put",
        body: arg?.data,
      }),
    }),
    listFavouriteService: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({
        url: Constants.API.list_favourite_service,
        params: arg?.params,
      }),
    }),
    getProfile: builder.query<any, void>({
      query: () => ({ url: Constants.API.get_profile }),
    }),
    getBanner: builder.query<ItemsResponse, void>({
      query: () => ({ url: Constants.API.get_banner }),
    }),
    getServicesManagement: builder.query<ItemsResponse, void>({
      query: () => ({ url: Constants.API.services_management }),
    }),
    getPromotionUpdates: builder.query<ItemsResponse, void>({
      query: () => ({ url: Constants.API.promotion_updates }),
    }),
    getCurrentPlan: builder.query<ItemsResponse, void>({
      query: () => ({ url: Constants.API.get_current_plan }),
    }),
    getNotifications: builder.query<ItemsResponse, RequestArg | void>({
      // /client/notifications is shared by Home (badge count) and Inbox
      // (paged lists); params carry type[]/page exactly as useApi did.
      query: (arg) => ({
        url: Constants.API.get_notification,
        params: arg?.params,
      }),
    }),

    // ---- Booking (Phase 5 module port) -------------------------------------
    // List and history share /client/jobs — the orderStatus[] params in the
    // query string decide which list the response feeds (as with useApi).
    getBookings: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({
        url: Constants.API.get_booking,
        params: arg?.params,
      }),
    }),

    // ---- Inbox (Phase 5 module port) ---------------------------------------
    deleteNotification: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({
        url: Constants.API.delete_notification,
        method: "delete",
        body: arg?.data,
      }),
    }),
    readAllNotifications: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({
        url: Constants.API.read_all_notification,
        method: "post",
        body: arg?.data,
      }),
    }),

    // ---- Payment (Phase 5 module port) --------------------------------------
    getPaymentCards: builder.query<PaymentCardsResponse, void>({
      query: () => ({ url: Constants.API.payment_card_list }),
    }),
    deletePaymentCard: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({
        url: Constants.API.payment_card_delete,
        method: "delete",
        body: arg?.data,
      }),
    }),
    setDefaultPaymentCard: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({
        url: Constants.API.payment_card_default,
        method: "put",
        body: arg?.data,
      }),
    }),
  }),
});

// Mirrors useApi's error-string contract so ported callbacks keep comparing
// the same strings: axios' `Request failed with status code NNN` wording and
// the 400 -> home.error_400 i18n mapping.
export const apiErrorString = (error: any): string => {
  if (typeof error?.status === "number") {
    if (error.status === 400) return i18n.t("home.error_400");
    return `Request failed with status code ${error.status}`;
  }
  if (error?.status === 401) return "Request failed with status code 401";
  return error?.error || error?.data?.message || error?.message || "error";
};

// useApi-shaped adapter for ported screens: an RTK mutation / lazy-query
// trigger wrapped so the screen keeps its legacy `callback({error, response})`
// and the `[loading, request]` call pattern verbatim. Mirrors useApi's
// success-with-errors-array branch (errors[0].message surfaces as `error`).
// Lazy triggers always refetch (forceRefetch), matching useApi's no-cache
// request semantics.
export const portRequest =
  (
    trigger: (arg?: any) => { unwrap: () => Promise<any> },
    callback: ({ error, response }: { error: string; response: any }) => any
  ) =>
  (arg?: RequestArg) => {
    return trigger(arg)
      .unwrap()
      .then((response: any) => {
        if (Array.isArray(response?.errors) && response.errors.length > 0) {
          callback({ error: response.errors[0]?.message, response });
        } else {
          callback({ error: "", response });
        }
      })
      .catch((e: any) => callback({ error: apiErrorString(e), response: {} }));
  };

export const {
  useLoginMutation,
  useSignupMutation,
  useUpdateLanguageMutation,
  useListFavouriteServiceQuery,
  useLazyListFavouriteServiceQuery,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useGetBannerQuery,
  useLazyGetBannerQuery,
  useGetServicesManagementQuery,
  useLazyGetServicesManagementQuery,
  useGetPromotionUpdatesQuery,
  useLazyGetPromotionUpdatesQuery,
  useGetCurrentPlanQuery,
  useLazyGetCurrentPlanQuery,
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useGetBookingsQuery,
  useLazyGetBookingsQuery,
  useDeleteNotificationMutation,
  useReadAllNotificationsMutation,
  useGetPaymentCardsQuery,
  useLazyGetPaymentCardsQuery,
  useDeletePaymentCardMutation,
  useSetDefaultPaymentCardMutation,
} = apiSlice;
