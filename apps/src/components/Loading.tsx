import * as React from "react";
import {
  StyleProp,
  StyleSheet,
  ViewStyle,
  Modal,
  View,
  ActivityIndicator,
} from "react-native";
import colors from "../shared/Colors";
import Theme from "../shared/theme";

interface Props {
  style?: StyleProp<ViewStyle>;
  children?: any;
  loading?: boolean;
}

export const Loading = ({ style, children, loading, ...props }: Props) => {
  return (
    <Modal
      transparent={true}
      animationType={"none"}
      onRequestClose={() => {}}
      visible={loading}
    >
      <View style={s.modalBackground}>
        <View style={s.activityIndicatorWrapper}>
          <ActivityIndicator
            size="large"
            color={colors.blue_link}
            animating={loading}
          />
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "space-around",
    backgroundColor: `${Theme.core.mossBlack}1A`,
  },
  activityIndicatorWrapper: {
    backgroundColor: "transparent",
    height: 100,
    width: 100,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
});
