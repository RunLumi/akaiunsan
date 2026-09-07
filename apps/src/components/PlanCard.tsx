import React from "react";
import { View, ImageBackground, TouchableOpacity } from "react-native";
import Colors from "../shared/Colors";
export default function PlanCard(props: any) {
  return (
    <TouchableOpacity onPress={props.onPress} disabled={props.buttonDisabled}>
      <ImageBackground
        source={props.background}
        style={{
          flex: 1,
          padding: 16,
          shadowColor: Colors.black,
          shadowOffset: {
            width: 0,
            height: 0,
          },
          shadowOpacity: 0.4,
          borderRadius: 8,
        }}
        borderRadius={6}
      >
        <View>{props.children}</View>
      </ImageBackground>
    </TouchableOpacity>
  );
}
