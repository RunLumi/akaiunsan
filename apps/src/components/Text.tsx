import React from "react";
import { useAppSelector } from "../redux/hooks";
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
  const language = useAppSelector((state) => state.language.language);
  const fonts = () => {
    switch (language) {
      case "th":
        return "SukhumvitSet-Text";
      default:
        return "OpenSans-Regular";
    }
  };
  return (
    <DefaultText
      onPress={onPress}
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={Styles.typography.maxFontSizeMultiplier}
      {...props}
      style={[{ fontFamily: fonts() }, s.default, style]}
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
