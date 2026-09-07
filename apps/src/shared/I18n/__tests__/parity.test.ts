import en from "../en";
import th from "../th";

const collectLeafKeys = (obj: Record<string, unknown>, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") {
      return collectLeafKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });

const enKeys = collectLeafKeys(en).sort();
const thKeys = collectLeafKeys(th).sort();

describe("i18n characterization: en/th key parity", () => {
  // pins current behavior: the two locales spell one key differently, so
  // whichever casing a screen uses, the other locale falls back to a
  // "[missing ... translation]" placeholder. Fix deliberately, then tighten
  // this test to strict equality.
  it("casing drift: th has home.Permission_camera, en has home.permission_camera", () => {
    expect(thKeys.filter((k) => !enKeys.includes(k))).toEqual([
      "home.Permission_camera",
    ]);
    expect(enKeys.filter((k) => !thKeys.includes(k))).toEqual([
      "home.permission_camera",
    ]);
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
