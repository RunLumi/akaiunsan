import React from "react";
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
import { installFetchRoutes } from "../../test-utils/fetch-mock";

// HelperSelectFixPlan is ported to RTK Query: POST bodies now live inside the
// Request objects handed to the fetch stub, read back via clone().text().
const helpersBody = (helpers: any[]) => ({ items: helpers });

const fetchCalls = async () =>
  Promise.all(
    (globalThis.fetch as jest.Mock).mock.calls.map(async (c: any[]) => {
      const input = c[0];
      const url = typeof input === "string" ? input : input.url || "";
      let body: any = {};
      try {
        body = JSON.parse(await input.clone().text());
      } catch {
        // GET or unreadable body
      }
      return { url: String(url), body };
    })
  );

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
    (globalThis.fetch as jest.Mock).mockClear();
    installFetchRoutes({
      [Constants.API.services_suggest_fixplan]: helpersBody([]),
      [Constants.API.services_helper_fixplan]: helpersBody([]),
    });
  });

  it("posts suggestions then requests helpers with the suggested ids and times", async () => {
    installFetchRoutes({
      [Constants.API.services_suggest_fixplan]: helpersBody([
        helper("h1", "Helper One"),
      ]),
      [Constants.API.services_helper_fixplan]: helpersBody([
        helper("h1", "Helper One"),
      ]),
    });
    renderFixPlan();
    await flush();
    const calls = await fetchCalls();
    expect(calls.length).toBe(2);
    expect(calls[0].url).toContain(Constants.API.services_suggest_fixplan);
    expect(calls[0].body).toMatchObject({
      serviceType: Enum.SERVICE_TYPE.MaidService,
      addressId: "addr-1",
      listDate: ["2026-09-10", "2026-09-11"],
    });
    expect(calls[1].url).toContain(Constants.API.services_helper_fixplan);
    expect(calls[1].body).toMatchObject({
      languages: "th",
      serviceProvider: ["h1"],
      listDate: ["2026-09-10", "2026-09-11"],
    });
  });

  it("requests helpers with an empty provider list when suggestions are empty", async () => {
    renderFixPlan();
    await flush();
    const calls = await fetchCalls();
    expect(calls.length).toBe(2);
    expect(calls[1].url).toContain(Constants.API.services_helper_fixplan);
    expect(calls[1].body.serviceProvider).toEqual([]);
  });

  it("opens the picker with the search bar and suggestions header", async () => {
    const ref = React.createRef<any>();
    const { root } = renderFixPlan({ children: ref });
    await flush();
    act(() => ref.current && ref.current.openModalHelper());
    expect(textNodes(root, i18n.t("home.specify_helper")).length).toBe(1);
    expect(textNodes(root, i18n.t("home.suggest_for_you")).length).toBe(1);
  });
});