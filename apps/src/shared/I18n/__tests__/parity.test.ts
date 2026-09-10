import en from "../en";
import vi from "../vi";

const collectLeafKeys = (obj: Record<string, unknown>, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") {
      return collectLeafKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });

const enKeys = collectLeafKeys(en).sort();
const viKeys = collectLeafKeys(vi).sort();

describe("i18n: en/vi key parity", () => {
  // The app ships exactly two locales. Thai was replaced by Vietnamese, and
  // the old en/th catalogs disagreed on one key's casing
  // (home.Permission_camera vs home.permission_camera); vi is pinned to the
  // en spelling, so the two catalogs must now match key-for-key.
  it("vi mirrors the en key inventory exactly", () => {
    expect(viKeys).toEqual(enKeys);
  });

  it("has a substantial catalogue (guards against accidental mass deletion)", () => {
    expect(enKeys.length).toBeGreaterThan(300);
  });

  it("no translation value is an empty string", () => {
    const empties = enKeys.filter((path) => {
      const value = path.split(".").reduce<any>((acc, k) => acc?.[k], en);
      return value === "";
    });
    expect(empties).toEqual([]);
  });

  it("golden file: en key inventory", () => {
    expect(enKeys).toMatchSnapshot();
  });

  it("shared key namespaces are present (screens rely on them)", () => {
    expect(enKeys).toEqual(
      expect.arrayContaining([
        "Home",
        "Booking",
        "Inbox",
        "Account",
        "home.error_400",
      ])
    );
  });
});
