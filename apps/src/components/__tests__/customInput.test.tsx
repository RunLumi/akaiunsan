import React from "react";
import { TextInput as RNTextInput } from "react-native";
import { create, act, textNodes, hostTouchables } from "../../test-utils/helpers";
import { CustomInput } from "../CustomInput";

describe("CustomInput", () => {
  it("forwards value and onChangeText to the native input", () => {
    const onChangeText = jest.fn();
    const { root } = create(<CustomInput value="hi" onChangeText={onChangeText} />);
    const input = root.findByType(RNTextInput);
    expect(input.props.value).toBe("hi");
    expect(input.props.maxFontSizeMultiplier).toBe(1.3);
    act(() => input.props.onChangeText("yo"));
    expect(onChangeText).toHaveBeenCalledWith("yo");
  });

  it("renders an inline error when isError", () => {
    const { root } = create(<CustomInput isError errorText="bad value" />);
    expect(textNodes(root, "bad value").length).toBe(1);
  });

  it("toggles secureTextEntry when the eye is pressed", () => {
    const { root } = create(<CustomInput secureText value="1234" />);
    const input = root.findByType(RNTextInput);
    expect(input.props.secureTextEntry).toBe(true);
    const eye = hostTouchables(root)[0];
    act(() => eye.props.onPress());
    expect(root.findByType(RNTextInput).props.secureTextEntry).toBe(false);
  });

  it("disables iOS AutoFill on simulator inputs", () => {
    const { root } = create(<CustomInput secureText value="1234" />);
    expect(root.findByType(RNTextInput).props.textContentType).toBe("none");
  });

  it("fires the dropdown, datetime and cancel affordance handlers", () => {
    const onDropDown = jest.fn();
    const onDateTime = jest.fn();
    const onCancel = jest.fn();
    const { root } = create(
      <CustomInput
        onDropDown={onDropDown}
        onDateTime={onDateTime}
        onCancel={onCancel}
      />
    );
    const pressables = hostTouchables(root);
    expect(pressables.length).toBe(3);
    pressables.forEach((p: any) => act(() => p.props.onPress()));
    expect(onDropDown).toHaveBeenCalledTimes(1);
    expect(onDateTime).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("keeps the input disabled while disabled but still renders affordances", () => {
    const onDropDown = jest.fn();
    const { root } = create(
      <CustomInput disabled value="x" onDropDown={onDropDown} />
    );
    expect(root.findByType(RNTextInput).props.editable).toBe(false);
    const arrow = hostTouchables(root)[0];
    act(() => arrow.props.onPress());
    expect(onDropDown).toHaveBeenCalledTimes(1);
  });
});
