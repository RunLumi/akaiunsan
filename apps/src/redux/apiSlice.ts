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
  items: any[];
  page: number;
  totalUnRead: number;
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
  url?: string;
  params?: any;
  data?: any;
  headers?: any;
}

// The useApi callback contract, kept verbatim across the strangler ports.
export interface ApiResult {
  error: string;
  response: ItemsResponse;
}

// Canonical loose item shape for API payloads rendered by the screens: one
// index signature instead of hundreds of `any` parameter annotations. Reads
// stay `any`-typed through the index signature, so behavior is unchanged.
export type ApiItem = {
  [key: string]: any;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: Config.API_URL,
    // useApi (axios) serialized URLSearchParams verbatim, preserving repeated
    // keys (`orderStatus=0&orderStatus=1…`). RTK's default does
    // `new URLSearchParams(stripUndefined(params))`, which spreads the
    // instance into an empty object on standard platforms — keep the axios
    // wire format instead.
    paramsSerializer: (params: ApiItem) =>
      params instanceof URLSearchParams
        ? params.toString()
        : new URLSearchParams(
            (Object.entries(params || {}) as [string, string][]).filter(
              ([, v]) => v !== undefined
            )
          ).toString(),
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as ApiItem)?.auth?.token;
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

    // ---- Remaining useApi ports (Phase 5 completion) ------------------------
    // Mechanically ported from the last useApi call-sites; every endpoint
    // mirrors its useApi block: same URL constant, method, params/body, and
    // per-call header override support (arg?.headers).
    addDeviceNotification: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.add_device_notification, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    appleLogin: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.apple_login, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    bookingDetail: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.booking_detail, params: arg?.params, headers: arg?.headers }),
    }),
    bookingGet: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.booking_get, params: arg?.params, headers: arg?.headers }),
    }),
    cancelFlexiblePlan: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.cancel_flexible_plan, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    cancelOrder: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.cancel_order, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    cancelSubscription: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.cancel_subscription, method: "put", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    charges: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.charges, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    chargescard: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.chargescard, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    chargesplan: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.chargesplan, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    checkOtp: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.check_otp, params: arg?.params, headers: arg?.headers }),
    }),
    configPoint: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.config_point, params: arg?.params, headers: arg?.headers }),
    }),
    configPrice: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.config_price, params: arg?.params, headers: arg?.headers }),
    }),
    configPriceSubscription: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.config_price_subscription, params: arg?.params, headers: arg?.headers }),
    }),
    configSubscriptionPrices: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.config_subscription_prices, params: arg?.params, headers: arg?.headers }),
    }),
    deleteAddress: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.delete_address, method: "delete", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    deleteFavouriteService: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.delete_favourite_service, method: "delete", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    deleteFavouriteServiceProvider: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.delete_favourite_service_provider, method: "delete", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    detailBooking: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.detail_booking, params: arg?.params, headers: arg?.headers }),
    }),
    downgradeFlexiblePlan: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.downgrade_flexible_plan, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    editAddress: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.edit_address, method: "put", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    editProfile: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.edit_profile, method: "put", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    forgotPassword: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.forgot_password, params: arg?.params, headers: arg?.headers }),
    }),
    getAgreePlan: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.get_agree_plan, params: arg?.params, headers: arg?.headers }),
    }),
    getCurrentFixplan: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.get_current_fixplan, params: arg?.params, headers: arg?.headers }),
    }),
    getNotificationDetail: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.get_notification_detail, params: arg?.params, headers: arg?.headers }),
    }),
    getPayment: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.get_payment, params: arg?.params, headers: arg?.headers }),
    }),
    getPlan: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.get_plan, params: arg?.params, headers: arg?.headers }),
    }),
    getSubscription: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.get_subscription, params: arg?.params, headers: arg?.headers }),
    }),
    googleLogin: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.google_login, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    languages: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.languages, params: arg?.params, headers: arg?.headers }),
    }),
    lineLogin: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.line_login, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    listAddress: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.list_address, params: arg?.params, headers: arg?.headers }),
    }),
    listFavouriteServiceProvider: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.list_favourite_service_provider, params: arg?.params, headers: arg?.headers }),
    }),
    orderCancelFixPlan: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.order_cancel_fix_plan, method: "put", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    orderFixPlanMaid: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.order_fix_plan_maid, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    orderFlexiblePlan: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.order_flexible_plan, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    ordersCancel: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.orders_cancel, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    ordersEdit: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.orders_edit, method: "put", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    ordersMaid: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.orders_maid, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    paymentCardAdd: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.payment_card_add, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    paymentPetcare: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.payment_petcare, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    priceSpecialRequest: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.price_special_request, params: arg?.params, headers: arg?.headers }),
    }),
    promotionApply: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.promotion_apply, params: arg?.params, headers: arg?.headers }),
    }),
    promotionDetail: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.promotion_detail, params: arg?.params, headers: arg?.headers }),
    }),
    promotionUsed: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.promotion_used, params: arg?.params, headers: arg?.headers }),
    }),
    referralList: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.referral_list, params: arg?.params, headers: arg?.headers }),
    }),
    removeAccount: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.remove_account, method: "delete", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    resetPassword: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.reset_password, params: arg?.params, headers: arg?.headers }),
    }),
    reviewOrder: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.review_order, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    servicesHelperFixplan: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.services_helper_fixplan, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    servicesManagementHelper: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.services_management_helper, params: arg?.params, headers: arg?.headers }),
    }),
    servicesManagementHelperSuggest: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.services_management_helper_suggest, params: arg?.params, headers: arg?.headers }),
    }),
    servicesManagementItem: builder.query<ItemsResponse, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.services_management_item, params: arg?.params, headers: arg?.headers }),
    }),
    servicesSuggestFixplan: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.services_suggest_fixplan, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    specialRequest: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.special_request, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    toggleRenewFix: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.toggle_renew_fix, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    toggleRenewFlexible: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.toggle_renew_flexible, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    updateFavouriteService: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.update_favourite_service, method: "put", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    updateFavouriteServiceProvider: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.update_favourite_service_provider, method: "put", body: arg?.data, params: arg?.params, headers: arg?.headers }),
    }),
    upgradeFlexiblePlan: builder.mutation<any, RequestArg | void>({
      query: (arg) => ({ url: arg?.url ?? Constants.API.upgrade_flexible_plan, method: "post", body: arg?.data, params: arg?.params, headers: arg?.headers }),
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
    callback: (result: ApiResult) => any
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
      .catch((e: any) =>
        callback({ error: apiErrorString(e), response: {} as ItemsResponse })
      );
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
