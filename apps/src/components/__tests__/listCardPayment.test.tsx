import React from "react";
import { Alert } from "react-native";
import axios from "axios";
import { ListCardPayment } from "../ListCardPayment";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import {
  createWithStore,
  makeStore,
  act,
  textNodes,
  flush,
  pressableFrom,
} from "../../test-utils/helpers";

const mockAxios = axios as unknown as jest.Mock;

const listResponse = (cards: any[], defaultCard: any) => ({
  status: 200,
  data: {
    data: { customer: { cards: { data: cards }, default_card: defaultCard } },
  },
});

const paymentTouchable = (root: any) =>
  pressableFrom(textNodes(root, i18n.t("home.payment"))[0]);

describe("ListCardPayment", () => {
  beforeEach(() => {
    mockAxios.mockReset();
  });

  it("loads the card list on mount", async () => {
    mockAxios.mockResolvedValue(listResponse([], null));
    createWithStore(
      <ListCardPayment
        children={React.createRef<any>()}
        handleIdCard={jest.fn()}
      />,
      makeStore()
    );
    await flush();
    expect(mockAxios).toHaveBeenCalledTimes(1);
    expect(mockAxios.mock.calls[0][0].url).toBe(Constants.API.payment_card_list);
  });

  it("shows the empty state and a disabled payment button with no cards", async () => {
    mockAxios.mockResolvedValue(listResponse([], null));
    const ref = React.createRef<any>();
    const { root } = createWithStore(
      <ListCardPayment children={ref} handleIdCard={jest.fn()} />,
      makeStore()
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
    mockAxios.mockResolvedValue(listResponse([card], ""));
    const handleIdCard = jest.fn();
    const ref = React.createRef<any>();
    const { root } = createWithStore(
      <ListCardPayment children={ref} handleIdCard={handleIdCard} />,
      makeStore()
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
    mockAxios.mockRejectedValue(new Error("network down"));
    const alertSpy = jest.spyOn(Alert, "alert");
    createWithStore(
      <ListCardPayment
        children={React.createRef<any>()}
        handleIdCard={jest.fn()}
      />,
      makeStore()
    );
    await flush();
    expect(alertSpy).toHaveBeenCalledWith(i18n.t("auth.error"), "network down");
    alertSpy.mockRestore();
  });
});