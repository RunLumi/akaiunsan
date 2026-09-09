import React from "react";
import axios from "axios";
import { HelperSelectFixPlan } from "../HelperSelectFixPlan";
import Enum from "../../shared/Enum";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import {
  createWithStore,
  makeApiStore,
  act,
  textNodes,
  flush,
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

const renderFixPlan = (props: any = {}) =>
  createWithStore(
    <HelperSelectFixPlan
      children={React.createRef<any>()}
      valueHelper={jest.fn()}
      serviceType={Enum.SERVICE_TYPE.MaidService}
      addressId={{ id: "addr-1" }}
      language={{ value: "th" }}
      times={["2026-09-10", "2026-09-11"]}
      {...props}
    />,
    makeApiStore()
  );

describe("HelperSelectFixPlan", () => {
  beforeEach(() => {
    mockAxios.mockReset();
  });

  it("posts suggestions then requests helpers with the suggested ids and times", async () => {
    mockAxios.mockResolvedValue({
      status: 200,
      data: { data: { items: [helper("h1", "Helper One")] } },
    });
    renderFixPlan();
    await flush();
    expect(mockAxios).toHaveBeenCalledTimes(2);
    expect(mockAxios.mock.calls[0][0].url).toBe(
      Constants.API.services_suggest_fixplan
    );
    expect(mockAxios.mock.calls[0][0].data).toMatchObject({
      serviceType: Enum.SERVICE_TYPE.MaidService,
      addressId: "addr-1",
      listDate: ["2026-09-10", "2026-09-11"],
    });
    expect(mockAxios.mock.calls[1][0].url).toBe(
      Constants.API.services_helper_fixplan
    );
    expect(mockAxios.mock.calls[1][0].data).toMatchObject({
      languages: "th",
      serviceProvider: ["h1"],
      listDate: ["2026-09-10", "2026-09-11"],
    });
  });

  it("requests helpers with an empty provider list when suggestions are empty", async () => {
    mockAxios.mockResolvedValue({ status: 200, data: { data: { items: [] } } });
    renderFixPlan();
    await flush();
    expect(mockAxios).toHaveBeenCalledTimes(2);
    expect(mockAxios.mock.calls[1][0].url).toBe(
      Constants.API.services_helper_fixplan
    );
    expect(mockAxios.mock.calls[1][0].data.serviceProvider).toEqual([]);
  });

  it("opens the picker with the search bar and suggestions header", async () => {
    mockAxios.mockResolvedValue({ status: 200, data: { data: { items: [] } } });
    const ref = React.createRef<any>();
    const { root } = renderFixPlan({ children: ref });
    await flush();
    act(() => ref.current && ref.current.openModalHelper());
    expect(textNodes(root, i18n.t("home.specify_helper")).length).toBe(1);
    expect(textNodes(root, i18n.t("home.suggest_for_you")).length).toBe(1);
  });
});