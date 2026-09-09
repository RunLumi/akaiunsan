import { FontAwesome, SimpleLineIcons, Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "../redux/hooks";
import React, { useState } from "react";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import colors from "../shared/Colors";
import Theme from "../shared/theme";
import Constants from "../shared/Constants";
import Styles from "../shared/Styles";
import { Text } from "./Text";
import type { ApiItem } from "../redux/apiSlice";

const PADDING = 10;
interface Props {
  style?: StyleProp<TextStyle>;
  value?: string;
  containerStyle?: StyleProp<ViewStyle>;
  secureText?: boolean;
  disabled?: boolean;
  isError?: boolean;
  errorText?: string;
  onDropDown?: (...args: unknown[]) => void;
  onCancel?: (...args: unknown[]) => void;
  onDateTime?: (...args: unknown[]) => void;
  noShawdow?: boolean;
}

export const CustomInput = ({
  style,
  secureText,
  onDropDown,
  onCancel,
  onDateTime,
  disabled,
  isError,
  errorText,
  containerStyle,
  noShawdow = false,
  value,
  ...props
}: Props & TextInputProps) => {
  const [showPass, setShowPass] = useState<{
    enabled: boolean;
    image: "eye" | "eye-slash";
  }>({ enabled: true, image: "eye-slash" });
  const changeShow = () =>
    setShowPass((val) => ({
      enabled: !val.enabled,
      image: val.enabled ? "eye" : "eye-slash",
    }));
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
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.input,
          !noShawdow && Styles.shadow,
          {
            backgroundColor: disabled ? Theme.core.stoneDark : colors.white,
          },
        ]}
      >
        <TextInput
          style={[
            { fontFamily: fonts() },
            {
              color: colors.black,
              fontSize: Styles.typography.normal,
            },
            styles.borderBlur,
            style,
          ]}
          underlineColorAndroid="transparent"
          editable={!disabled}
          secureTextEntry={secureText ? showPass.enabled : false}
          value={value}
          placeholderTextColor={colors.gray}
          {...props}
          maxFontSizeMultiplier={Styles.typography.maxFontSizeMultiplier}
        />

        {onDropDown ? (
          <TouchableOpacity
            disabled={disabled}
            onPress={onDropDown}
            style={styles.secure}
          >
            <SimpleLineIcons
              name={"arrow-down"}
              size={14}
              color={colors.gray_normal_text}
            />
          </TouchableOpacity>
        ) : null}

        {onDateTime ? (
          <TouchableOpacity
            disabled={disabled}
            onPress={onDateTime}
            style={styles.secure}
          >
            <SimpleLineIcons
              name={"calendar"}
              size={20}
              color={colors.gray_hidden_text}
            />
          </TouchableOpacity>
        ) : null}

        {onCancel ? (
          <TouchableOpacity
            disabled={disabled}
            onPress={onCancel}
            style={styles.secure}
          >
            <Ionicons
              name={"close-circle-outline"}
              size={20}
              color={colors.gray_hidden_text}
            />
          </TouchableOpacity>
        ) : null}

        {secureText ? (
          <TouchableOpacity
            disabled={disabled}
            onPress={changeShow}
            style={styles.secure}
          >
            <FontAwesome
              name={showPass.image}
              size={20}
              color={colors.gray_hidden_text}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {isError && (
        <Text
          style={[
            styles.textItalic,
            { opacity: isError ? 1 : 0, color: colors.red },
          ]}
        >
          {errorText}
        </Text>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
  },
  label: {
    backgroundColor: "transparent",
  },
  textInput: {
    position: "absolute",
    bottom: 1,
    left: 0,
    paddingTop: PADDING / 2,
    paddingLeft: 0,
    color: colors.black_text,
  },
  textInputMultiline: {
    position: "absolute",
    bottom: 2,
    left: 0,
    paddingTop: PADDING / 2,
    paddingHorizontal: PADDING / 2,
    color: colors.black_text,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: colors.gray,
  },
  border: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  borderBlur: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
  },
  dateInput: {
    flex: 1,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  textItalic: {
    fontStyle: "italic",
    marginTop: 5,
    // marginBottom: 5,
  },
  secure: {
    paddingRight: 8,
  },
});
