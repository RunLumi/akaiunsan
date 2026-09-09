import React from "react";
import PickerModal from "../Picker";
import { TYPES } from "../../redux/actions";
import i18n from "../../shared/I18n";
import {
  createWithStore,
  act,
  makeApiStore,
  textNodes,
  hostTouchables,
  pressableFrom,
} from "../../test-utils/helpers";

const openPicker = (store: any, overrides: any = {}) => {
  store.dispatch({
    type: TYPES.TOOLS.OPEN_PICKER,
    payload: {
      data: [{ label: "A", value: 1 }, { label: "B", value: 2 }],
      selected: "",
      callback: jest.fn(),
      ...overrides,
    },
  });
};

describe("PickerModal", () => {
  it("lists the picker data from the tools store", () => {
    const store = makeApiStore();
    openPicker(store);
    const { root } = createWithStore(<PickerModal />, store);
    expect(textNodes(root, "A").length).toBe(1);
    expect(textNodes(root, "B").length).toBe(1);
  });

  it("choosing a row calls the callback and closes the picker", () => {
    const callback = jest.fn();
    const store = makeApiStore();
    openPicker(store, { callback });
    const { root } = createWithStore(<PickerModal />, store);
    const touchable = pressableFrom(textNodes(root, "B")[0]);
    act(() => touchable.props.onPress());
    expect(callback).toHaveBeenCalledWith(2);
    expect(store.getState().tools.picker.isShow).toBe(false);
  });

  it("shows the empty-state message when there is no data", () => {
    const store = makeApiStore();
    openPicker(store, { data: [] });
    const { root } = createWithStore(<PickerModal />, store);
    expect(textNodes(root, i18n.t("home.data_empty")).length).toBe(1);
  });

  it("tapping the backdrop cancels without invoking the callback", () => {
    const callback = jest.fn();
    const store = makeApiStore();
    openPicker(store, { callback });
    const { root } = createWithStore(<PickerModal />, store);
    const [backdrop] = hostTouchables(root);
    act(() => backdrop.props.onPress());
    expect(callback).not.toHaveBeenCalled();
    expect(store.getState().tools.picker.isShow).toBe(false);
  });
});