import * as React from "react";
import {
  GestureResponderEvent,
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
  ActivityIndicator,
  TextStyle,
} from "react-native";
import Theme from "../shared/theme";
import Styles from "../shared/Styles";
import { Text } from "./Text";
import type { ApiItem } from "../redux/apiSlice";
interface Props {
  style?: StyleProp<ViewStyle>;
  viewStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  title?: string;
  colorBackground?: string;
  image?: number;
  imageStyle?: StyleProp<ImageStyle>;
  onPress?: (event: GestureResponderEvent) => void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export const Button = ({
  children,
  title,
  style,
  image,
  imageStyle,
  onPress,
  loading,
  viewStyle,
  textStyle,
  colorBackground,
  disabled,
  ...props
}: Props) => {
  return (
    <TouchableOpacity
      {...props}
      accessible
      accessibilityRole="button"
      style={[image ? s.image : s.default, style]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      <View
        style={[
          s.container,
          image ? { backgroundColor: "transparent" } : {},

          {
            backgroundColor: colorBackground
              ? colorBackground
              : disabled
              ? Theme.core.stoneDark
              : Theme.colors.accent,
          },
          viewStyle,
        ]}
      >
        <View style={image ? s.loadingCenter : s.loadingText}>
          {loading ? (
            <ActivityIndicator size="small" color={Theme.colors.accentContrast} />
          ) : null}
        </View>
        {title && <Text style={[s.text, textStyle]}>{title}</Text>}
        {image != null && <Image source={image as number} style={[s.image, imageStyle]} />}
        {children}
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  default: {
    width: "100%",
    marginVertical: Styles.margin.vertical,
  },
  container: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  text: {
    color: Theme.colors.accentContrast,
    fontSize: Styles.typography.normal,
    fontWeight: "bold",
    marginHorizontal: 10,
  },
  image: {
    resizeMode: "contain",
    height: 40,
    width: 40,
  },
  loadingCenter: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    alignItems: "center",
    justifyContent: "center",
  },
});
