const loadLayoutWithWindow = (width: number, height: number) => {
  jest.resetModules();
  jest.doMock("react-native", () => ({
    Dimensions: { get: () => ({ width, height }) },
  }));
  return require("../Layout").default;
};

describe("Layout characterization", () => {
  it("exposes the window dimensions", () => {
    const layout = loadLayoutWithWindow(390, 844);
    expect(layout.window).toEqual({ width: 390, height: 844 });
    expect(layout.isSmallDevice).toBe(false);
  });

  it("flags devices narrower than 375 as small", () => {
    expect(loadLayoutWithWindow(320, 568).isSmallDevice).toBe(true);
    expect(loadLayoutWithWindow(375, 667).isSmallDevice).toBe(false);
    expect(loadLayoutWithWindow(374.5, 667).isSmallDevice).toBe(true);
  });
});
