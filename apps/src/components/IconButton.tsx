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
import Colors from "../shared/Colors";
import Styles from "../shared/Styles";
import {Text} from "./Text";
interface Props {
  style?: StyleProp<ViewStyle>;
  viewStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: any;
  title?: string;
  image?: any;
  imageStyle?: StyleProp<ImageStyle>;
  onPress?: (event: GestureResponderEvent) => void;
  loading?: boolean;
}

export const IconButton = ({
  children,
  title,
  style,
  image,
  imageStyle,
  onPress,
  loading,
  viewStyle,
  textStyle,
  ...props
}: Props) => {
  return (
    <TouchableOpacity
      {...props}
      style={[image ? s.image : s.default, style]}
      onPress={onPress}
      disabled={loading}
    >
      <View
        style={[
          s.container,
          image ? { backgroundColor: "transparent" } : {},
          viewStyle,
        ]}
      >
        <View style={image ? s.loadingCenter : s.loadingText}>
          {loading ? <ActivityIndicator size="small" color="#ffffff" /> : null}
        </View>
        {title && <Text style={[s.text, textStyle]}>{title}</Text>}
        {image && <Image source={image} style={[s.image, imageStyle]} />}
        {children}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  default: {
    width: "100%",
    marginVertical: Styles.margin.vertical,
  },
  container: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  text: {
    color: Colors.white,
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
