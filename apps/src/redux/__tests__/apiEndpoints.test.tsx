import { apiSlice, apiErrorString, portRequest } from "../apiSlice";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import { makeApiStore, flush } from "../../test-utils/helpers";
import { installFetchRoutes, setFetchBehavior } from "../../test-utils/fetch-mock";
import { paramArray } from "../../shared/Utils";

// Contract tests for the Phase 5 module ports (Home first): every endpoint
// must reproduce the exact request its `useApi` block sent (URL, method,
// params/body, transport headers) and feed the screen callbacks the same
// response fields (`items`, `page`, `totalUnRead`, direct JSON bodies).
const preloadedState = {
  auth: { token: "test-token", user: { id: 1 }, loading: false },
  language: { language: "en" },
};

// fetchBaseQuery dispatches a single Request object (no RequestInit).
const lastRequest = async () => {
  const [input] = (globalThis.fetch as jest.Mock).mock.calls[
    (globalThis.fetch as jest.Mock).mock.calls.length - 1
  ];
  return {
    url: typeof input === "string" ? input : input.url,
    method: input.method as string,
    headers: input.headers,
    bodyText: await input.clone().text(),
  };
};

describe("apiSlice Phase 5 endpoints — Home", () => {
  it("GET list_favourite_service sends the useApi transport contract", async () => {
    const store = makeApiStore(preloadedState);
    const result: any = await store.dispatch(
      apiSlice.endpoints.listFavouriteService.initiate()
    );
    const req = await lastRequest();
    expect(req.url).toContain(Constants.API.list_favourite_service);
    expect(req.headers.get("Authorization")).toBe("Bearer test-token");
    expect(req.headers.get("Accept-Language")).toBe("en");
    expect(req.headers.get("platform")).toBe("app");
    // the screen filters response.items on isSelected
    expect(result.data.items.filter((i: any) => i.isSelected)).toHaveLength(1);
  });

  it("GET get_profile serves the direct user body the callback dispatches", async () => {
    const store = makeApiStore(preloadedState);
    const result: any = await store.dispatch(
      apiSlice.endpoints.getProfile.initiate()
    );
    const req = await lastRequest();
    expect(req.url).toContain(Constants.API.get_profile);
    expect(result.data.fullName).toBe("Test User");
  });

  it("GET get_notification forwards the paged params verbatim", async () => {
    const store = makeApiStore(preloadedState);
    const params = paramArray([{ type: 0 }, { type: 3 }, { page: 1 }]);
    const result: any = await store.dispatch(
      apiSlice.endpoints.getNotifications.initiate({ params })
    );
    const req = await lastRequest();
    expect(req.url).toContain(Constants.API.get_notification);
    expect(req.url).toContain("type=0");
    expect(req.url).toContain("type=3");
    expect(req.url).toContain("page=1");
    // Home reads response.totalUnRead for the notifee badge
    expect(result.data.totalUnRead).toBe(3);
  });

  it("PUT update_language sends the language body", async () => {
    const store = makeApiStore(preloadedState);
    const result: any = await store.dispatch(
      apiSlice.endpoints.updateLanguage.initiate({ data: { language: 1 } })
    );
    const req = await lastRequest();
    expect(req.url).toContain(Constants.API.update_language);
    expect(req.method).toBe("PUT");
    expect(JSON.parse(req.bodyText)).toEqual({ language: 1 });
    expect(result.data).toEqual({});
  });

  it("surfaces the errors-array branch as an error string like useApi", async () => {
    installFetchRoutes({
      [Constants.API.get_banner]: { errors: [{ message: "boom" }] },
    });
    const store = makeApiStore(preloadedState);
    const callback = jest.fn();
    const request = portRequest(
      (arg?: any) =>
        store.dispatch(apiSlice.endpoints.getBanner.initiate(arg as any)) as any,
      callback
    );
    request();
    await flush();
    await flush();
    expect(callback).toHaveBeenCalledWith({
      error: "boom",
      response: { errors: [{ message: "boom" }] },
    });
  });

  it("maps thrown fetch errors through the useApi error-string contract", async () => {
    setFetchBehavior({ rejectAll: true });
    const store = makeApiStore(preloadedState);
    const callback = jest.fn();
    const request = portRequest(
      (arg?: any) =>
        store.dispatch(
          apiSlice.endpoints.getServicesManagement.initiate(arg as any)
        ) as any,
      callback
    );
    request();
    await flush();
    await flush();
    const [{ error, response }] = callback.mock.calls[0];
    expect(error).toBeTruthy();
    expect(response).toEqual({});
    setFetchBehavior({ rejectAll: false });
  });

  it("apiErrorString mirrors the axios wording and the 400 i18n mapping", () => {
    expect(apiErrorString({ status: 401 })).toBe(
      "Request failed with status code 401"
    );
    expect(apiErrorString({ status: 400 })).toBe(i18n.t("home.error_400"));
    expect(apiErrorString({ status: 500 })).toBe(
      "Request failed with status code 500"
    );
    expect(apiErrorString({ error: "Network request failed" })).toBe(
      "Network request failed"
    );
    expect(apiErrorString(undefined)).toBe("error");
  });

  it("GET get_booking forwards orderStatus[] + page for list and history", async () => {
    const store = makeApiStore(preloadedState);
    // upcoming list: PENDING/MATCH/ON_PROCESS/WAITING_CONFIRM/RECEIVED
    const upcoming: any = await store.dispatch(
      apiSlice.endpoints.getBookings.initiate({
        params: paramArray([
          { orderStatus: 0 },
          { orderStatus: 1 },
          { orderStatus: 4 },
          { orderStatus: 5 },
          { orderStatus: 6 },
          { page: 1 },
        ]),
      })
    );
    const upcomingUrl = (await lastRequest()).url;
    expect(upcomingUrl).toContain(Constants.API.get_booking);
    expect((upcomingUrl.match(/orderStatus=/g) || []).length).toBe(5);
    expect(upcomingUrl).toContain("page=1");
    // the screen reads response.items + response.page
    expect(upcoming.data.items).toHaveLength(1);
    expect(upcoming.data.page).toBe(1);

    // history: COMPLETED/CANCEL against the same URL (useApi did the same)
    const history: any = await store.dispatch(
      apiSlice.endpoints.getBookings.initiate({
        params: paramArray([{ orderStatus: 2 }, { orderStatus: 3 }]),
      })
    );
    expect((history.data.items[0] as any).orderStatus).toBe(2);
  });
});
