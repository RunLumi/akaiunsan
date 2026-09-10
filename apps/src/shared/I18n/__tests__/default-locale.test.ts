// The i18n singleton resolves its locale once, at import time. The product
// default is Vietnamese regardless of the device's system locale.
const loadI18n = () => {
  let i18n: any;
  jest.isolateModules(() => {
    i18n = require("../index").default;
  });
  return i18n;
};

describe("i18n default locale resolution", () => {
  it("always starts in Vietnamese", () => {
    expect(loadI18n().locale).toBe("vi");
  });
});
