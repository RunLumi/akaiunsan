import React from "react";
import { Alert } from "react-native";
import { HelperSelect } from "../HelperSelect";
import Enum from "../../shared/Enum";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import {
  createWithStore,
  makeApiStore,
  act,
  textNodes,
  flush,
  pressText,
  pressableFrom,
} from "../../test-utils/helpers";
import { installFetchRoutes } from "../../test-utils/fetch-mock";

// HelperSelect is ported to RTK Query: payloads install as fetch routes and
// assertions inspect the fetch call log.
const fetchUrls = () =>
  (globalThis.fetch as jest.Mock).mock.calls.map((c: any[]) =>
    typeof c[0] === "string" ? c[0] : c[0]?.url || ""
  );

const helpersBody = (helpers: any[]) => ({ items: helpers });

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
    makeApiStore()
  );

describe("HelperSelect", () => {
  beforeEach(() => {
    (globalThis.fetch as jest.Mock).mockClear();
    installFetchRoutes({
      [Constants.API.services_management_helper_suggest]: helpersBody([]),
      [Constants.API.services_management_helper]: helpersBody([]),
    });
  });

  it("loads suggested helpers, then requests the full list with suggested sps", async () => {
    installFetchRoutes({
      [Constants.API.services_management_helper_suggest]: helpersBody([
        helper("h1", "Helper One"),
      ]),
      [Constants.API.services_management_helper]: helpersBody([
        helper("h1", "Helper One"),
      ]),
    });
    const ref = React.createRef<any>();
    const { root } = renderHelper({ children: ref });
    await flush();
    const urls = fetchUrls();
    expect(urls.length).toBe(2);
    expect(urls[0]).toContain(
      Constants.API.services_management_helper_suggest
    );
    expect(urls[1]).toContain(Constants.API.services_management_helper);
    expect(urls[1]).toContain("serviceProvider=h1");
    // Suggestions and the fetched list are both gated behind the open modal
    act(() => ref.current && ref.current.openModalHelper());
    expect(textNodes(root, "Helper One").length).toBe(2);
  });

  it("skips the full list request when there are no suggestions", async () => {
    renderHelper();
    await flush();
    expect(fetchUrls().length).toBe(1);
    expect(fetchUrls()[0]).toContain(
      Constants.API.services_management_helper_suggest
    );
  });

  it("does not serialize invalid booking times", async () => {
    renderHelper({ startTime: "", endTime: "" });
    await flush();
    expect(fetchUrls()[0]).not.toContain("Invalid Date");
    expect(fetchUrls()[0]).not.toContain("startTime=");
    expect(fetchUrls()[0]).not.toContain("endTime=");
  });

  it("confirming without a selection alerts the user", async () => {
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
    installFetchRoutes({
      [Constants.API.services_management_helper_suggest]: helpersBody([
        helper("h1", "Helper One"),
      ]),
      [Constants.API.services_management_helper]: helpersBody([
        helper("h1", "Helper One"),
      ]),
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
