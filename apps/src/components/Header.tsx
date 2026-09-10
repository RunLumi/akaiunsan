import * as React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Colors from "../shared/Colors";
import i18n from "../shared/I18n";
import { Text } from "./Text";
import type { ApiItem } from "../redux/apiSlice";
interface Props {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode | React.RefObject<unknown>;
  titleDashboard?: string;
  isDashboard?: boolean;
  pointNumberDashboard?: string;
  selectLanguage?: (lang: string) => void;
  language?: string;
}

export const Header = ({
  style,
  children,
  isDashboard,
  titleDashboard,
  pointNumberDashboard,
  selectLanguage,
  language,
  ...props
}: Props) => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        paddingHorizontal: 16,
        backgroundColor: Colors.main_color,
      }}
    >
      <Text
        style={{
          color: Colors.white,
          fontWeight: "600",
          fontSize: 16,
        }}
      >
        {titleDashboard}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            marginRight: 16,
            color: Colors.white,
          }}
        >
          {pointNumberDashboard} {i18n.t("home.points")}
        </Text>
        <TouchableOpacity
          disabled={language == "vi"}
          onPress={() => selectLanguage?.("vi")}
        >
          <Text
            style={{
              color: Colors.white,
              fontSize: 16,
              textTransform: "uppercase",
              ...(language === "vi" && styles.activeLang),
            }}
          >
            Vi
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            marginHorizontal: 8,
            color: Colors.white,
          }}
        >
          |
        </Text>
        <TouchableOpacity
          disabled={language == "en"}
          onPress={() => selectLanguage?.("en")}
        >
          <Text
            style={{
              color: Colors.white,
              fontSize: 16,
              textTransform: "uppercase",
              ...(language === "en" && styles.activeLang),
            }}
          >
            En
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  activeLang: {
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
