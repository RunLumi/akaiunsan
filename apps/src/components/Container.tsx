import React from "react";
import { SafeAreaView, ViewStyle, StyleProp, StatusBar } from "react-native";
import Colors from "../shared/Colors";

export const Container = ({
  safe,
  children,
  style,
  statusBarColor,
  ...props
}: {
  safe?: boolean | any;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  statusBarColor?: string;
}) => {
  return (
    <SafeAreaView style={[{ flex: 1 }, style]} {...props}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={statusBarColor ? statusBarColor : Colors.white}
      />
      {children}
    </SafeAreaView>
  );
};

