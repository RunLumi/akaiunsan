import Enum from "../Enum";
import Colors from "../Colors";
import Theme from "../theme";
import Styles from "../Styles";

describe("Enum characterization", () => {
  it("golden file: full enum catalogue (backend contract values)", () => {
    expect(Enum).toMatchSnapshot();
  });

  it("PlatformType used by useApi 'platform' header", () => {
    expect(Enum.PlatformType).toEqual({
      IOS: "1",
      ANDROID: "2",
      WEBSITE: "3",
    });
  });

  it("OrderStatus aligns with Utils.getStatus numeric inputs", () => {
    expect(Enum.OrderStatus).toEqual(
      expect.objectContaining({
        PENDING: 0,
        MATCH: 1,
        COMPLETED: 2,
        CANCEL: 3,
        ON_PROCESS: 4,
        WAITING_CONFIRM: 5,
      })
    );
  });

  it("gender picker offers Female/Male/Miss", () => {
    expect(Enum.GENDER.map((g: { label: string }) => g.label)).toEqual([
      "Female",
      "Male",
      "Miss",
    ]);
  });
});

describe("Colors characterization", () => {
  it("golden file: palette", () => {
    expect(Colors).toMatchSnapshot();
  });

  it("brand primary is Living Standard Olive Dark (DESIGN.md v2026.1)", () => {
    expect(Colors.main_color).toBe("#4F601A");
  });

  it("never uses pure black — Olive Ink replaces it (design law §2.4)", () => {
    expect(Colors.black).toBe("#20251B");
    expect(Colors.black_text).toBe("#20251B");
    expect(Colors.black.toUpperCase()).not.toBe("#000000");
  });

  it("screen canvas is Warm Paper", () => {
    expect(Colors.background).toBe("#F9F8F3");
  });
});

describe("Living Standard semantic theme", () => {
  it("accent is Hi-Vis Lime and always pairs with ink contrast", () => {
    expect(Theme.colors.accent).toBe("#C7DC50");
    expect(Theme.colors.accentContrast).toBe("#20251B");
  });

  it("exposes exactly one accent — lime — with olive structure greens", () => {
    expect(Theme.core.lime).toBe("#C7DC50");
    expect(Theme.core.olive).toBe("#6C7D22");
    expect(Theme.core.oliveDark).toBe("#4F601A");
  });

  it("leaf-corner geometry is asymmetric (signature radii)", () => {
    expect(Theme.radius.leaf.lg).toEqual({
      top: 24,
      right: 120,
      bottom: 24,
      left: 24,
    });
  });

  it("shadows are olive-tinted, never gray or pure black", () => {
    expect(Theme.shadow.float.shadowColor).toBe("#252F16");
    expect(Theme.shadow.lift.shadowColor).toBe("#252F16");
  });

  it("motion uses the production decelerate curve", () => {
    expect(Theme.motion.easing).toBe("cubic-bezier(0.2, 0.72, 0.2, 1)");
    expect(Theme.motion.fast).toBe(280);
    expect(Theme.motion.standard).toBe(560);
    expect(Theme.motion.slow).toBe(820);
  });
});

describe("Styles characterization", () => {
  it("golden file: spacing/shadow/typography scale", () => {
    expect(Styles).toMatchSnapshot();
  });

  it("typography ladder is strictly decreasing", () => {
    const t = Styles.typography;
    expect(t.h1 > t.h2).toBe(true);
    expect(t.h2 > t.h3).toBe(true);
    expect(t.h3 > t.title).toBe(true);
    expect(t.title > t.normal).toBe(true);
    expect(t.normal > t.footnode).toBe(true);
  });
});
