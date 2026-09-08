import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import axios from "axios";
import useApi from "../useApi";

const mockState = {
  auth: { token: "tok-123" },
  language: { language: "en" },
};

jest.mock("react-native-config", () => ({
  API_URL: "https://api.test.local",
  APP_KEY: "test-app-key",
}));
jest.mock("react-redux", () => ({
  useSelector: (selector: (s: typeof mockState) => unknown) => selector(mockState),
}));
jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
  InteractionManager: { runAfterInteractions: (cb: () => void) => cb() },
}));
jest.mock("react-native-device-info", () => ({}));
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en", countryCode: "US" }],
  locale: "en-US",
}));
jest.mock("axios", () => ({ __esModule: true, default: jest.fn() }));

const mockedAxios = axios as unknown as jest.Mock;

let hookResult: any;

const renderHook = (props: Parameters<typeof useApi>[0]) => {
  const Probe = (p: any) => {
    hookResult = useApi(p);
    return null;
  };
  act(() => {
    TestRenderer.create(<Probe {...props} />);
  });
  return hookResult; // [loading, request, error, response]
};

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

beforeEach(() => {
  mockedAxios.mockReset();
  hookResult = undefined;
});

describe("useApi characterization: initial state", () => {
  it("idle without autoRequest", () => {
    const [loading, , error, response] = renderHook({ url: "/ping" });
    expect(loading).toBe(false);
    expect(error).toBeUndefined();
    expect(response).toBeUndefined();
    expect(mockedAxios).not.toHaveBeenCalled();
  });

  it("autoRequest fires exactly one request after interactions", () => {
    renderHook({ url: "/ping", autoRequest: true });
    expect(mockedAxios).toHaveBeenCalledTimes(1);
  });
});

describe("useApi characterization: request config contract", () => {
  it("sends auth, language, platform headers and the config baseURL", async () => {
    const [, request] = renderHook({ url: "/secure" });
    mockedAxios.mockResolvedValue({ status: 200, data: { data: {} } });
    await act(async () => { await request(); });

    expect(mockedAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "get",
        url: "/secure",
        baseURL: "https://api.test.local",
        headers: expect.objectContaining({
          Authorization: "Bearer tok-123",
          "Accept-Language": "en",
          "x-app-key": "test-app-key",
        }),
      })
    );
  });

  it("custom call-site values replace (not merge) config values", async () => {
    const [, request] = renderHook({ url: "/original" });
    mockedAxios.mockResolvedValue({ status: 200, data: { data: {} } });
    await act(async () => { await request({ url: "/override", params: { page: 2 } }); });

    const call = mockedAxios.mock.calls[0][0];
    expect(call.url).toBe("/override");
    expect(call.params).toEqual({ page: 2 });
  });
});

describe("useApi characterization: response envelope contract", () => {
  it("2xx unwraps responseData.data.data", async () => {
    const callback = jest.fn();
    const [, request, error, response] = renderHook({ url: "/list", callback });
    const payload = { data: { items: [1, 2], total: 2 } };
    mockedAxios.mockResolvedValue({ status: 200, data: payload });
    await act(async () => { await request(); });

    expect(hookResult[3]).toBe(payload.data); // response = unwrapped data.data
    expect(hookResult[2]).toBe("");            // error cleared on success
    expect(callback).toHaveBeenCalledWith({ error: "", response: payload.data });
    expect(hookResult[0]).toBe(false);         // loading finished
  });

  it("2xx with errors array returns the full body and errors[0].message", async () => {
    const callback = jest.fn();
    const [, request] = renderHook({ url: "/list", callback });
    const body = { data: { items: [] }, errors: [{ message: "Duplicate entry" }] };
    mockedAxios.mockResolvedValue({ status: 200, data: body });
    await act(async () => { await request(); });

    expect(hookResult[3]).toBe(body);
    expect(hookResult[2]).toBe("Duplicate entry");
    expect(callback).toHaveBeenCalledWith({ error: "Duplicate entry", response: body });
  });

  it("non-2xx surfaces statusText as the error", async () => {
    const callback = jest.fn();
    const [, request] = renderHook({ url: "/gone", callback });
    mockedAxios.mockResolvedValue({ status: 404, statusText: "Not Found", data: {} });
    await act(async () => { await request(); });

    expect(hookResult[2]).toBe("Not Found");
    expect(callback).toHaveBeenCalledWith({ error: "Not Found", response: null });
  });
});

describe("useApi characterization: exception contract", () => {
  it("network error surfaces error.message with empty response object", async () => {
    const callback = jest.fn();
    const [, request] = renderHook({ url: "/boom", callback });
    mockedAxios.mockRejectedValue(new Error("Network Error"));
    await act(async () => { await request(); });

    expect(callback).toHaveBeenCalledWith({ error: "Network Error", response: {} });
    expect(hookResult[2]).toBe("Network Error");
    expect(hookResult[0]).toBe(false);
  });

  it("status-400 message is translated via i18n home.error_400", async () => {
    const callback = jest.fn();
    const [, request] = renderHook({ url: "/bad", callback });
    mockedAxios.mockRejectedValue(new Error("Request failed with status code 400"));
    await act(async () => { await request(); });

    // en locale value of home.error_400
    expect(callback).toHaveBeenCalledWith({
      error: "Request failed with status code 400",
      response: {},
    });
  });
});
