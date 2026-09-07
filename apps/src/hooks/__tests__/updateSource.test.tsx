import TestRenderer, { act } from "react-test-renderer";
import React from "react";
import updateSource from "../updateSource";

jest.mock("expo-updates", () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

import * as Updates from "expo-updates";

const mockedUpdates = Updates as jest.Mocked<typeof Updates>;

let hookResult: any;
const renderHook = () => {
  const Probe = () => {
    hookResult = updateSource();
    return null;
  };
  act(() => {
    TestRenderer.create(<Probe />);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  hookResult = undefined;
});

describe("updateSource characterization", () => {
  it("starts with an incomplete load state and completes when no update is available", async () => {
    mockedUpdates.checkForUpdateAsync.mockResolvedValue({ isAvailable: false });
    renderHook();
    expect(hookResult).toBe(false);

    await act(async () => {
      await Promise.resolve();
    });
    expect(hookResult).toBe(true);
    expect(mockedUpdates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
    expect(mockedUpdates.fetchUpdateAsync).not.toHaveBeenCalled();
    expect(mockedUpdates.reloadAsync).not.toHaveBeenCalled();
  });

  it("downloads and reloads when an update is available", async () => {
    mockedUpdates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
    mockedUpdates.fetchUpdateAsync.mockResolvedValue(undefined as any);
    mockedUpdates.reloadAsync.mockResolvedValue(undefined as any);
    renderHook();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockedUpdates.fetchUpdateAsync).toHaveBeenCalledTimes(1);
    expect(mockedUpdates.reloadAsync).toHaveBeenCalledTimes(1);
    expect(hookResult).toBe(true);
  });

  it("still completes when checking throws", async () => {
    mockedUpdates.checkForUpdateAsync.mockRejectedValue(new Error("network"));
    renderHook();

    await act(async () => {
      await Promise.resolve();
    });
    expect(hookResult).toBe(true);
  });
});