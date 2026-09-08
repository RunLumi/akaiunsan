import _ from "lodash";
import React from "react";
import { View, StyleSheet, TouchableHighlight } from "react-native";
import { Text } from ".";
import Colors from "../shared/Colors";

function CustomMarker(props: any) {
  return (
    <TouchableHighlight>
      <View
        style={
          props.enabled
            ? [
                styles.markerStyle,
                props.markerStyle,
                props.pressed && props.pressedMarkerStyle,
              ]
            : [styles.markerStyle, styles.disabled, props.disabledMarkerStyle]
        }
      >
          <Text
          style={{
            fontSize: 8,
            marginBottom: -2,
            color: Colors.white,
            textAlign: "center",
          }}
        >
         {props.left ? "Start" : "End"}
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: Colors.white,
            textAlign: "center",
          }}
        >
          {_.toString(props.currentValue).indexOf(".5") != -1
            ? _.toString(props.currentValue).split(".")[0] + ":30"
            : _.toString(props.currentValue).split(".")[0] + ":00"}
        </Text>
      </View>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  markerStyle: {
    backgroundColor: Colors.main_orange,
    borderRadius: 12,
    minWidth: 42,
  },
  disabled: {
    backgroundColor: Colors.gray_light,
  },
});

export default CustomMarker;
