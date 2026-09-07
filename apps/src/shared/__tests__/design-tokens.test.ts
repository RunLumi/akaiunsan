import Enum from "../Enum";
import Colors from "../Colors";
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

  it("brand color is the Akaiunsan orange", () => {
    expect(Colors.main_color).toBe("#F48120");
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
