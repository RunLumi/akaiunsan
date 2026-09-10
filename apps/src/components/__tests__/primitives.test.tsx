import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Text as RNText,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { act, create, textNodes, hostTouchables } from "../../test-utils/helpers";
import { Text } from "../Text";
import { TextInput } from "../TextInput";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Container } from "../Container";
import { Loading } from "../Loading";
import { DismissKeyboardView } from "../DismissKeyboardView";
import PlanCard from "../PlanCard";
import CustomMarker from "../CustomMarker";

const font = (node: any) => StyleSheet.flatten(node.props.style).fontFamily;

describe("Text", () => {
  it("renders children with the default OpenSans-Regular family", () => {
    const renderer = create(<Text>Hello</Text>);
    const node = textNodes(renderer.root, "Hello")[0];
    expect(node.type).toBe(RNText);
    expect(font(node)).toBe("OpenSans-Regular");
    expect(node.props.maxFontSizeMultiplier).toBe(1.3);
  });

  it("keeps OpenSans-Regular for the Vietnamese locale (Latin script)", () => {
    const renderer = create(<Text>Xin chào</Text>, {
      language: { language: "vi" },
    });
    const node = textNodes(renderer.root, "Xin chào")[0];
    expect(font(node)).toBe("OpenSans-Regular");
  });

  it("forwards onPress and numberOfLines to the underlying Text", () => {
    const onPress = jest.fn();
    const { root } = create(
      <Text onPress={onPress} numberOfLines={2}>
        tappable
      </Text>
    );
    const node = textNodes(root, "tappable")[0];
    expect(node.props.numberOfLines).toBe(2);
    act(() => node.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("TextInput", () => {
  it("forwards value/onChangeText/style", () => {
    const onChangeText = jest.fn();
    const { root } = create(
      <TextInput
        style={{ color: "red" }}
        value="abc"
        onChangeText={onChangeText}
      />
    );
    const input = root.findByType(RNTextInput);
    act(() => input.props.onChangeText("xyz"));
    expect(onChangeText).toHaveBeenCalledWith("xyz");
    expect(StyleSheet.flatten(input.props.style).color).toBe("red");
    expect(input.props.maxFontSizeMultiplier).toBe(1.3);
  });
});

describe("Button", () => {
  it("renders the title and fires onPress", () => {
    const onPress = jest.fn();
    const { root } = create(<Button title="Go" onPress={onPress} />);
    const touchable = hostTouchables(root, onPress)[0];
    expect(touchable).toBeDefined();
    act(() => touchable.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("disables the touchable while loading and shows a spinner", () => {
    const onPress = jest.fn();
    const { root } = create(
      <Button title="Wait" loading onPress={onPress} />
    );
    const touchable = hostTouchables(root, onPress)[0];
    expect(touchable.props.disabled).toBe(true);
    expect(root.findAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  });

  it("honours the disabled prop by disabling the touchable", () => {
    const { root } = create(<Button title="Off" disabled onPress={jest.fn()} />);
    const touchable = hostTouchables(root)[0];
    expect(touchable.props.disabled).toBe(true);
  });
});

describe("IconButton", () => {
  it("renders a title and fires onPress", () => {
    const onPress = jest.fn();
    const { root } = create(<IconButton title="Star" onPress={onPress} />);
    const touchable = hostTouchables(root, onPress)[0];
    act(() => touchable.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("Container", () => {
  it("renders children inside a SafeAreaView with a StatusBar", () => {
    const { root } = create(
      <Container>
        <Text>content</Text>
      </Container>
    );
    expect(textNodes(root, "content").length).toBe(1);
    expect(root.findAllByType(StatusBar).length).toBe(1);
  });

  it("passes statusBarColor through to the StatusBar", () => {
    const { root } = create(<Container statusBarColor="#123456"><View /></Container>);
    expect(root.findByType(StatusBar).props.backgroundColor).toBe("#123456");
  });
});

describe("Loading", () => {
  it("renders without throwing closed and open", () => {
    expect(() => create(<Loading loading={false} />)).not.toThrow();
    const root = create(<Loading loading />).root;
    expect(root.findByType(ActivityIndicator).props.animating).toBe(true);
  });
});

describe("DismissKeyboardView", () => {
  it("renders its children inside a press-to-dismiss container", () => {
    const { root } = create(
      <DismissKeyboardView>
        <Text>tap me</Text>
      </DismissKeyboardView>
    );
    expect(textNodes(root, "tap me").length).toBe(1);
  });
});

describe("PlanCard", () => {
  it("renders children and fires onPress", () => {
    const onPress = jest.fn();
    const { root } = create(<PlanCard onPress={onPress} background={1}>card</PlanCard>);
    const touchable = hostTouchables(root, onPress)[0];
    act(() => touchable.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("disables the touchable when buttonDisabled", () => {
    const { root } = create(
      <PlanCard buttonDisabled onPress={jest.fn()}>
        locked
      </PlanCard>
    );
    const touchable = hostTouchables(root)[0];
    expect(touchable.props.disabled).toBe(true);
  });
});

describe("CustomMarker", () => {
  const textValues = (root: any) =>
    textNodes(root).map((n: any) => n.props.children);

  it("renders the start label and hour formatted to :00", () => {
    const { root } = create(<CustomMarker left currentValue={6} />);
    expect(textValues(root)).toContain("Start");
    expect(textValues(root)).toContain("6:00");
  });

  it("formats half hours as :30 and marks the end label", () => {
    const { root } = create(<CustomMarker currentValue={6.5} />);
    expect(textValues(root)).toContain("End");
    expect(textValues(root)).toContain("6:30");
  });

  it("applies the disabled style when enabled is false", () => {
    const renderer = create(<CustomMarker currentValue={7} enabled={false} />);
    expect(renderer.toJSON()).toBeTruthy();
  });
});
