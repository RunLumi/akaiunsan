import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import i18n from "../../../shared/I18n";
import { styles } from "../Home";
import DeviceInfo from "react-native-device-info";
export const ModalVersion = (props: any) => {
  const { visible, version, onPress } = props;
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>
            {i18n.t("auth.current_version")} ({DeviceInfo.getVersion()}){" "}
            {i18n.t("auth.lower_version")} ({version}) {"\n"}
            {i18n.t("auth.update_version")}
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.buttonClose]}
            onPress={onPress}
          >
            <Text style={styles.textStyle}>{i18n.t("home.update")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
