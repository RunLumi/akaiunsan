import React from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text as DefaultText,
  TextStyle,
} from "react-native";
import { useSelector } from "react-redux";
import Styles from "../shared/Styles";

interface Props {
  style?: StyleProp<TextStyle>;
  children?: any;
  onPress?: (event: GestureResponderEvent) => void;
  numberOfLines?: number
}

export const Text = ({ style, children, numberOfLines, onPress, ...props }: Props) => {
  const language = useSelector((state: any) => state.language.language);
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
      {...props}
      style={[{ fontFamily: fonts() }, s.default, style]}
    >
      {children}
    </DefaultText>
  );
};

const s = StyleSheet.create({
  default: {
    fontSize: Styles.typography.normal,
  },
});
