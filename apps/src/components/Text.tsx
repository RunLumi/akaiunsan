import React from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text as DefaultText,
  TextStyle,
} from "react-native";

import Styles from "../shared/Styles";

interface Props {
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode | React.RefObject<unknown>;
  onPress?: (event: GestureResponderEvent) => void;
  numberOfLines?: number;
  [key: string]: any;
}

export const Text = ({ style, children, numberOfLines, onPress, ...props }: Props) => {
  // Both locales (English/Vietnamese) use the Latin script, so a single
  // font family covers them; the old Thai-only SukhumvitSet was dropped.
  const fontFamily = "OpenSans-Regular";
  return (
    <DefaultText
      onPress={onPress}
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={Styles.typography.maxFontSizeMultiplier}
      {...props}
      style={[{ fontFamily }, s.default, style]}
    >
      {children as React.ReactNode}
    </DefaultText>
  );
};

const s = StyleSheet.create({
  default: {
    fontSize: Styles.typography.normal,
  },
});
