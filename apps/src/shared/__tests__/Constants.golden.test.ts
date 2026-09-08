import Constants from "../Constants";

describe("Constants characterization: endpoint + route-name inventory", () => {
  it("golden file: API endpoint paths (drift here breaks backend contract)", () => {
    expect(Constants.API).toMatchSnapshot();
  });

  it("golden file: SCREENS route names (drift here breaks navigation)", () => {
    expect(Constants.SCREENS).toMatchSnapshot();
  });

  it("API contains the core endpoint groups the app depends on", () => {
    expect(Object.keys(Constants.API)).toEqual(
      expect.arrayContaining([
        "login",
        "register",
        "get_profile",
        "edit_profile",
        "update_language",
      ])
    );
    expect(Constants.SCREENS.AUTH.LOGIN).toBe("Auth/Login");
  });

  it("production API uses the Akaiunsan backend origin", () => {
    expect(Constants.API.base).toBe("https://akai-api.cjs.vn");
  });
});
