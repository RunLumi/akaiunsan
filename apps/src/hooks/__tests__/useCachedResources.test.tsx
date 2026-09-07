import TestRenderer, { act } from "react-test-renderer";
import React from "react";
import useCachedResources from "../useCachedResources";

jest.mock("expo-font", () => ({
  loadAsync: jest.fn(),
}));

import * as Font from "expo-font";
const mockedFont = Font as jest.Mocked<typeof Font>;

let hookResult: any;
const renderHook = () => {
  const Probe = () => {
    hookResult = useCachedResources();
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

describe("useCachedResources characterization", () => {
  it("starts incomplete and completes after fonts load", async () => {
    mockedFont.loadAsync.mockResolvedValue(undefined as any);
    renderHook();
    expect(hookResult).toBe(false);

    await act(async () => {
      await Promise.resolve();
    });
    expect(hookResult).toBe(true);
    expect(mockedFont.loadAsync).toHaveBeenCalledTimes(1);
  });

  it("still completes when font loading throws", async () => {
    mockedFont.loadAsync.mockRejectedValue(new Error("font load failed"));
    renderHook();

    await act(async () => {
      await Promise.resolve();
    });
    expect(hookResult).toBe(true);
  });
});