import TestRenderer, { act } from "react-test-renderer";
import React from "react";
import useCachedResources from "../useCachedResources";

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
  hookResult = undefined;
});

describe("useCachedResources", () => {
  it("is immediately ready because fonts are bundled locally", () => {
    renderHook();
    expect(hookResult).toBe(true);
  });
});
