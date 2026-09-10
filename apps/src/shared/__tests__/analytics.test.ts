import { shouldCollectAnalytics } from "../analytics";

describe("Firebase Analytics environment policy", () => {
  it.each(["local", "development"])(
    "disables collection in %s",
    (environment) => {
      expect(shouldCollectAnalytics(environment, false)).toBe(false);
    }
  );

  it.each(["staging", "production"])(
    "keeps collection available in %s",
    (environment) => {
      expect(shouldCollectAnalytics(environment, false)).toBe(true);
    }
  );

  it("defaults a development build to disabled collection", () => {
    expect(shouldCollectAnalytics(undefined, true)).toBe(false);
  });
});
