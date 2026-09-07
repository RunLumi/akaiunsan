import React from "react";
import { Alert } from "react-native";
import axios from "axios";
import { HelperSelect } from "../HelperSelect";
import Enum from "../../shared/Enum";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import {
  createWithStore,
  makeStore,
  act,
  textNodes,
  flush,
  pressText,
  pressableFrom,
} from "../../test-utils/helpers";

const mockAxios = axios as unknown as jest.Mock;

const helper = (id: string, fullName: string) => ({
  id,
  fullName,
  old: 30,
  star: 4,
  avatar: null,
  country: "TH",
  experiences: 2,
  skillLanguage: JSON.stringify(["English"]),
  status: Enum.HelperStatus.ACTIVE,
  isSelect: false,
});

const renderHelper = (props: any = {}) =>
  createWithStore(
    <HelperSelect
      children={React.createRef<any>()}
      valueHelper={jest.fn()}
      serviceType={Enum.SERVICE_TYPE.MaidService}
      startTime={new Date()}
      endTime={new Date()}
      addressId={{ id: "addr-1" }}
      language={{ value: "en" }}
      {...props}
    />,
    makeStore()
  );

describe("HelperSelect", () => {
  beforeEach(() => {
    mockAxios.mockReset();
  });

  it("loads suggested helpers, then requests the full list with suggested sps", async () => {
    mockAxios.mockResolvedValue({
      status: 200,
      data: { data: { items: [helper("h1", "Helper One")] } },
    });
    const ref = React.createRef<any>();
    const { root } = renderHelper({ children: ref });
    await flush();
    expect(mockAxios).toHaveBeenCalledTimes(2);
    expect(mockAxios.mock.calls[0][0].url).toBe(
      Constants.API.services_management_helper_suggest
    );
    expect(mockAxios.mock.calls[1][0].url).toBe(
      Constants.API.services_management_helper
    );
    expect(mockAxios.mock.calls[1][0].params.get("serviceProvider")).toBe("h1");
    // Suggestions and the fetched list are both gated behind the open modal
    act(() => ref.current && ref.current.openModalHelper());
    expect(textNodes(root, "Helper One").length).toBe(2);
  });

  it("skips the full list request when there are no suggestions", async () => {
    mockAxios.mockResolvedValue({ status: 200, data: { data: { items: [] } } });
    renderHelper();
    await flush();
    expect(mockAxios).toHaveBeenCalledTimes(1);
    expect(mockAxios.mock.calls[0][0].url).toBe(
      Constants.API.services_management_helper_suggest
    );
  });

  it("confirming without a selection alerts the user", async () => {
    mockAxios.mockResolvedValue({ status: 200, data: { data: { items: [] } } });
    const alertSpy = jest.spyOn(Alert, "alert");
    const ref = React.createRef<any>();
    const { root } = renderHelper({ children: ref });
    await flush();
    act(() => ref.current && ref.current.openModalHelper());
    pressText(root, i18n.t("auth.confirm"));
    expect(alertSpy).toHaveBeenCalledWith(
      i18n.t("auth.error"),
      i18n.t("home.select_your_helper")
    );
    alertSpy.mockRestore();
  });

  it("selecting a helper and confirming reports it through valueHelper", async () => {
    mockAxios.mockResolvedValue({
      status: 200,
      data: { data: { items: [helper("h1", "Helper One")] } },
    });
    const valueHelper = jest.fn();
    const ref = React.createRef<any>();
    const { root } = renderHelper({ children: ref, valueHelper });
    await flush();
    act(() => ref.current && ref.current.openModalHelper());
    // First occurrence is the suggested helper's avatar card
    const name = textNodes(root, "Helper One")[0];
    act(() => pressableFrom(name).props.onPress());
    // Detail modal now open -> press its confirm (first auth.confirm in the tree)
    pressText(root, i18n.t("auth.confirm"));
    expect(valueHelper).toHaveBeenCalledWith("h1", "Helper One", 30, 4, null);
  });
});