import React from "react";
import { Alert } from "react-native";
import { ListCardPayment } from "../ListCardPayment";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import {
  createWithStore,
  makeApiStore,
  act,
  textNodes,
  flush,
  pressableFrom,
} from "../../test-utils/helpers";
import {
  installFetchRoutes,
  setFetchBehavior,
} from "../../test-utils/fetch-mock";

// ListCardPayment is ported to RTK Query: requests flow through the global
// fetch stub, so payload setup and call assertions both use fetch.
const lastFetch = () => {
  const [input] = (globalThis.fetch as jest.Mock).mock.calls.slice(-1)[0];
  return typeof input === "string" ? input : input.url;
};

const listResponse = (cards: any[], defaultCard: any) => ({
  customer: { cards: { data: cards }, default_card: defaultCard },
});

const paymentTouchable = (root: any) =>
  pressableFrom(textNodes(root, i18n.t("home.payment"))[0]);

describe("ListCardPayment", () => {
  beforeEach(() => {
    (globalThis.fetch as jest.Mock).mockClear();
    installFetchRoutes({
      [Constants.API.payment_card_list]: { customer: { cards: { data: [] }, default_card: "" } },
    });
  });

  it("loads the card list on mount", async () => {
    installFetchRoutes({
      [Constants.API.payment_card_list]: listResponse([], null),
    });
    createWithStore(
      <ListCardPayment
        children={React.createRef<any>()}
        handleIdCard={jest.fn()}
      />,
      makeApiStore()
    );
    await flush();
    expect(
      (globalThis.fetch as jest.Mock).mock.calls.some((c: any[]) =>
        (typeof c[0] === "string" ? c[0] : c[0]?.url || "").includes(
          Constants.API.payment_card_list
        )
      )
    ).toBe(true);
  });

  it("shows the empty state and a disabled payment button with no cards", async () => {
    installFetchRoutes({
      [Constants.API.payment_card_list]: listResponse([], null),
    });
    const ref = React.createRef<any>();
    const { root } = createWithStore(
      <ListCardPayment children={ref} handleIdCard={jest.fn()} />,
      makeApiStore()
    );
    await flush();
    act(() => ref.current && ref.current.openModalListCard());
    expect(textNodes(root, i18n.t("home.card_empty")).length).toBe(1);
    expect(paymentTouchable(root).props.disabled).toBe(true);
  });

  it("lists saved cards, lets the user pick one and reports it", async () => {
    const card = {
      id: "c1",
      last_digits: "4242",
      name: "Test Card",
      expiration_month: "12",
      expiration_year: "26",
    };
    installFetchRoutes({
      [Constants.API.payment_card_list]: listResponse([card], ""),
    });
    const handleIdCard = jest.fn();
    const ref = React.createRef<any>();
    const { root } = createWithStore(
      <ListCardPayment children={ref} handleIdCard={handleIdCard} />,
      makeApiStore()
    );
    await flush();
    act(() => ref.current && ref.current.openModalListCard());
    // Masked last digits, card name and expiry are shown
    expect(textNodes(root, "************4242").length).toBe(1);
    expect(textNodes(root, card.name).length).toBe(1);
    expect(textNodes(root, "12/26").length).toBe(1);

    // Nothing selected yet -> payment stays disabled
    expect(paymentTouchable(root).props.disabled).toBe(true);

    const pick = textNodes(root, "************4242")[0];
    act(() => pressableFrom(pick).props.onPress());
    expect(paymentTouchable(root).props.disabled).toBe(false);

    act(() => paymentTouchable(root).props.onPress());
    expect(handleIdCard).toHaveBeenCalledWith("c1");
  });

  it("alerts when the list request fails", async () => {
    setFetchBehavior({ rejectAll: true });
    const alertSpy = jest.spyOn(Alert, "alert");
    createWithStore(
      <ListCardPayment
        children={React.createRef<any>()}
        handleIdCard={jest.fn()}
      />,
      makeApiStore()
    );
    await flush();
    expect(alertSpy).toHaveBeenCalledWith(
      i18n.t("auth.error"),
      "Error: Network request failed"
    );
    setFetchBehavior({ rejectAll: false });
    alertSpy.mockRestore();
  });
});