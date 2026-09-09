import React from "react";
import * as Location from "expo-location";
import { PositionSelect } from "../PositionSelect";
import Enum from "../../shared/Enum";
import i18n from "../../shared/I18n";
import {
  createWithStore,
  makeApiStore,
  act,
  textNodes,
  textIncluding,
  pressText,
} from "../../test-utils/helpers";

const nav = () => ({
  addListener: jest.fn(() => jest.fn()),
  navigate: jest.fn(),
});

describe("PositionSelect", () => {
  it("renders closed and asks for GPS on focus (useFocusEffect runs location)", () => {
    createWithStore(
      <PositionSelect children={React.createRef<any>()} navigation={nav()} />,
      makeApiStore()
    );
    // useFocusEffect is a no-op mock; getCurrentPositionAsync must stay idle
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it("opens with openModalPosition and shows the address workflow for non-maid services", () => {
    const ref = React.createRef<any>();
    const { root } = createWithStore(
      <PositionSelect
        children={ref}
        navigation={nav()}
        type={Enum.SERVICE_TYPE.CleaningService}
      />,
      makeApiStore()
    );
    expect(textNodes(root, i18n.t("auth.confirm")).length).toBe(0);
    act(() => ref.current && ref.current.openModalPosition(null));
    expect(textNodes(root, i18n.t("auth.confirm")).length).toBe(1);
    expect(textNodes(root, i18n.t("home.phone_no")).length).toBe(1);
  });

  it("shows room/remarks/home-type rows for MaidService", () => {
    const ref = React.createRef<any>();
    const { root } = createWithStore(
      <PositionSelect
        children={ref}
        navigation={nav()}
        type={Enum.SERVICE_TYPE.MaidService}
      />,
      makeApiStore()
    );
    act(() => ref.current && ref.current.openModalPosition(null));
    expect(textNodes(root, i18n.t("home.room_no")).length).toBe(1);
    expect(textNodes(root, i18n.t("home.remarks")).length).toBe(1);
    expect(textNodes(root, i18n.t("home.how_many_bedroom")).length).toBe(1);
    expect(textNodes(root, i18n.t("home.how_many_bathroom")).length).toBe(1);
  });

  it("openModalPosition pre-fills an existing address item", () => {
    const ref = React.createRef<any>();
    const item = {
      id: "addr-1",
      batchroomNo: 2,
      bedroomNo: 3,
      remark: "fragile",
      roomNo: "A-101",
      phoneNumber: "0812345678",
      roomType: 0,
      isDefault: true,
      ward: "Ward 1",
      name: "My Place",
      shortAddress: "5/1 Sukhumvit",
      province: "Bangkok",
      district: "Klong Toei",
      country: "TH",
      latitude: 13.75,
      longitude: 100.5,
    };
    const { root } = createWithStore(
      <PositionSelect children={ref} navigation={nav()} />,
      makeApiStore()
    );
    act(() => ref.current && ref.current.openModalPosition(item));
    // Composed via getLongAddress(address): name, ward, district, province, country
    expect(textIncluding(root, "5/1 Sukhumvit, Ward 1, Klong Toei, Bangkok, TH").length).toBe(1);
  });

  it("closing resets the modal", () => {
    const ref = React.createRef<any>();
    const { root } = createWithStore(
      <PositionSelect children={ref} navigation={nav()} />,
      makeApiStore()
    );
    act(() => ref.current && ref.current.openModalPosition(null));
    pressText(root, i18n.t("home.close"));
    expect(textNodes(root, i18n.t("auth.confirm")).length).toBe(0);
  });
});