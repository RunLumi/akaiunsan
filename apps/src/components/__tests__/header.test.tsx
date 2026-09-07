import React from "react";
import { TouchableOpacity as RNGHTouchableOpacity } from "react-native-gesture-handler";
import { create, act, textNodes, toText } from "../../test-utils/helpers";
import { Header } from "../Header";
import i18n from "../../shared/I18n";

// Header's language switchers use the gesture-handler TouchableOpacity.
const langTouchables = (root: any) =>
  root.findAll((n: any) => n.type === RNGHTouchableOpacity);

describe("Header", () => {
  it("renders the dashboard title and the points counter", () => {
    const { root } = create(
      <Header
        isDashboard
        titleDashboard="Akai"
        pointNumberDashboard="12"
        selectLanguage={jest.fn()}
        language="en"
      />
    );
    expect(textNodes(root, "Akai").length).toBeGreaterThan(0);
    const points = textNodes(root).some(
      (n: any) => toText(n.props.children) === `12 ${i18n.t("home.points")}`
    );
    expect(points).toBe(true);
  });

  it("disables the active language and fires selectLanguage for the other", () => {
    const selectLanguage = jest.fn();
    const { root } = create(
      <Header selectLanguage={selectLanguage} language="en" />
    );
    const [en, th] = langTouchables(root);
    expect(en.props.disabled).toBe(true);
    expect(th.props.disabled).toBe(false);
    act(() => th.props.onPress());
    expect(selectLanguage).toHaveBeenCalledWith("th");
  });

  it("highlights Th when language is th and En becomes callable", () => {
    const selectLanguage = jest.fn();
    const { root } = create(
      <Header selectLanguage={selectLanguage} language="th" />
    );
    const [en, th] = langTouchables(root);
    expect(th.props.disabled).toBe(true);
    expect(en.props.disabled).toBe(false);
    act(() => en.props.onPress());
    expect(selectLanguage).toHaveBeenCalledWith("en");
  });
});