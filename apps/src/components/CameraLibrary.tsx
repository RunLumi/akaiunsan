import * as React from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  ViewStyle,
  Modal,
  View,
  TouchableOpacity,
  Button,
  Alert,
  
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Layout from "../shared/Layout";
import i18n from "../shared/I18n";
import Constants from "../shared/Constants";
import Colors from "../shared/Colors";
import Theme from "../shared/theme";
import { Loading } from ".";
import type { ApiItem } from "../redux/apiSlice";

interface Props {
  style?: StyleProp<ViewStyle>;
  children?: (result: ApiItem) => void;
  isShowModalCamera?: boolean;
  setModalVisible?: (event: GestureResponderEvent) => void;
}

export const CameraLibrary = ({
  style,
  children,
  isShowModalCamera,
  setModalVisible,
  ...props
}: Props) => {
  const [loadingImage, setLoadingImage] = React.useState(false);
  const postImage = async (uri: string) => {
    setLoadingImage(true);
    let bodyFormData = new FormData();
    bodyFormData.append("file", {
      uri: uri,
      name: "photo.png",
      filename: "imageName.png",
      type: "image/png",
    } as ApiItem);
    bodyFormData.append("Content-Type", "image/png");

    return await fetch(`${Constants.API.base}${Constants.API.upload_image}`, {
      method: "POST",
      body: bodyFormData,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    })
      .then((response) => response.json())
      .catch((error) => {
        if (error) Alert.alert(i18n.t("auth.error"), String(error));
      })
      .finally(() => setLoadingImage(false));
  };
  const getImageLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(i18n.t("auth.error"), i18n.t("home.permission_camera"));
    } else {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 1,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        children?.(await postImage(result.assets[0].uri));
      }
    }
  };
  const getImageCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(i18n.t("auth.error"), i18n.t("home.permission_camera"));
    } else {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        children?.(await postImage(result.assets[0].uri));
      }
    }
  };

  return (
    <Modal transparent={true} animationType="fade" visible={isShowModalCamera}>
      <View style={s.modalBackground}>
        <Loading loading={loadingImage} />
        <TouchableOpacity style={s.closePopup} onPress={setModalVisible} />
        <View style={s.modalView}>
          <View style={s.buttonContainer}>
            <View style={s.buttonItem}>
              <Button
                title={i18n.t("home.image_library")}
                onPress={() => getImageLibrary()}
              />
            </View>
            <View style={s.buttonItem}>
              <Button
                title={i18n.t("home.camera")}
                onPress={() => getImageCamera()}
              />
            </View>
          </View>
        </View>
        <TouchableOpacity style={s.closePopup} onPress={setModalVisible} />
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
  buttonItem: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
  },
  buttonContainer: {
    flexDirection: "column",
    bottom: 0,
    borderTopWidth: 1,
    marginTop: 20,
    borderColor: Colors.white,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
  },
  closePopup: {
    width: "100%",
    flex: 1,
  },
  modalView: {
    width: Layout.window.width - 40,
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 10,
  },
  modalText: {
    fontSize: 25,
    textAlign: "center",
  },
});
