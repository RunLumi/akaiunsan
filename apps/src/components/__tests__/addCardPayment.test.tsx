import React from "react";
import { AddCardPayment } from "../AddCardPayment";
import i18n from "../../shared/I18n";
import { createWithStore, makeApiStore, act, textNodes, pressText } from "../../test-utils/helpers";

describe("AddCardPayment", () => {
  it("starts with the overlay closed", () => {
    const { root } = createWithStore(
      <AddCardPayment children={React.createRef<any>()} />,
      makeApiStore()
    );
    expect(textNodes(root, i18n.t("home.close")).length).toBe(0);
  });

  it("opens and closes via the imperative handle and close affordance", () => {
    const ref = React.createRef<any>();
    const { root } = createWithStore(
      <AddCardPayment children={ref} addSuccess={jest.fn()} />,
      makeApiStore({ auth: { token: "tok", user: null } })
    );
    act(() => ref.current && ref.current.openModalAddCard());
    expect(textNodes(root, i18n.t("home.close")).length).toBe(1);
    pressText(root, i18n.t("home.close"));
    expect(textNodes(root, i18n.t("home.close")).length).toBe(0);
  });
});