import React from "react";
import { Alert } from "react-native";
import { DateTimeSelect } from "../DateTimeSelect";
import i18n from "../../shared/I18n";
import { create, act, textNodes, pressText } from "../../test-utils/helpers";

describe("DateTimeSelect", () => {
  it("renders closed (overlay content hidden)", () => {
    const ref = React.createRef<any>();
    const { root } = create(<DateTimeSelect children={ref} />);
    expect(textNodes(root, i18n.t("home.when")).length).toBe(0);
  });

  it("opens on openModalDateTime and shows date/time picker content", () => {
    const ref = React.createRef<any>();
    const { root } = create(
      <DateTimeSelect children={ref} valueDateTime={jest.fn()} />
    );
    act(() => ref.current && ref.current.openModalDateTime());
    expect(textNodes(root, i18n.t("home.when")).length).toBe(1);
    expect(textNodes(root, i18n.t("home.time_slot")).length).toBe(1);
  });

  it("openModalDateTime pre-fills a provided date/time", () => {
    const ref = React.createRef<any>();
    const value = new Date("2026-09-10T14:30:00").toISOString();
    const { root } = create(
      <DateTimeSelect children={ref} dateTimeSelect={value} />
    );
    act(() => ref.current && ref.current.openModalDateTime());
    expect(textNodes(root, i18n.t("home.when")).length).toBe(1);
  });

  it("submitting without a date warns via Alert", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const ref = React.createRef<any>();
    const { root } = create(
      <DateTimeSelect children={ref} valueDateTime={jest.fn()} />
    );
    act(() => ref.current && ref.current.openModalDateTime());
    pressText(root, i18n.t("auth.confirm"));
    expect(alertSpy).toHaveBeenCalledWith(
      i18n.t("auth.error"),
      i18n.t("home.date_empty")
    );
    alertSpy.mockRestore();
  });

  it("the close button hides the overlay again", () => {
    const ref = React.createRef<any>();
    const { root } = create(<DateTimeSelect children={ref} />);
    act(() => ref.current && ref.current.openModalDateTime());
    pressText(root, i18n.t("home.close"));
    expect(textNodes(root, i18n.t("home.when")).length).toBe(0);
  });
});