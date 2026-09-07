import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  AppState,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import ActionButton from "react-native-action-button";
import { Container, Loading, Text } from "../../components";
import { useDispatch, useSelector } from "react-redux";
import Constants from "../../shared/Constants";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import colors from "../../shared/Colors";
import { NavigationRoot } from "../../navigation/root";
import { success, TYPES } from "../../redux/actions";
import i18n from "../../shared/I18n";
import { Divider } from "react-native-elements";
import useApi from "../../hooks/useApi";
import { useIsFocused } from "@react-navigation/native";
import DeviceInfo from "react-native-device-info";
import notifee from "@notifee/react-native";
import { ModalVersion } from "./components";

export default function Account(props: any) {
  const [loadingRemove, requestRemove] = useApi({
    method: "delete",
    url: Constants.API.remove_account,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error_occurred"), error);
      else {
        dispatch({ type: success(TYPES.AUTH.LOG_OUT) });
      }
    },
  });
  const onRemoveAccount = () => {
    Alert.alert(i18n.t('auth.confirm'), i18n.t('auth.remove_account'),  [
      {
        text: i18n.t('Cancel'),
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel"
      },
      { text: "OK", onPress: () => requestRemove() }
    ]);
  };
  const [dataAccount, setDataAccount] = useState([
    {
      title: i18n.t("MY_BOOKING"),
      disable: false,
      navigation: Constants.SCREENS.MYBOOKING.LIST,
    },
    {
      title: i18n.t("FAVOURITE"),
      disable: false,
      navigation: Constants.SCREENS.FAVOURITE.MENU,
    },
    {
      title: i18n.t("PROMOTIONS"),
      disable: false,
      navigation: Constants.SCREENS.PROMOTIOM.LIST_PROMOTION,
    },
    {
      title: i18n.t("PAYMENT"),
      disable: false,
      navigation: Constants.SCREENS.PAYMENT.LIST,
    },
    {
      title: i18n.t("HISTORY"),
      disable: false,
      navigation: Constants.SCREENS.HISTORY.LIST_HISTORY,
    },
    {
      title: i18n.t("REFER_TO_FRIEND"),
      disable: false,
      navigation: Constants.SCREENS.OTHER.PREFERTOFRIEND,
    },
    {
      title: i18n.t("ADDRESS"),
      disable: false,
      navigation: Constants.SCREENS.ADDRESS.ADDRESS,
    },
    {
      title: i18n.t("SUBSCRIPTION_MENU"),
      disable: false,
      navigation: Constants.SCREENS.SUBSCRIPTION.AllSubscriptionPlan,
    },
    {
      title: i18n.t("ABOUT_US"),
      disable: false,
      navigation: Constants.SCREENS.OTHER.ABOUT_US,
    },
    {
      title: i18n.t("REMOVE_ACCOUNT"),
      disable: false,
      navigation: false,
      action: onRemoveAccount
    },
  ]);
  
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const language = useSelector((state: any) => state.language.language);

  const [version, setVersion] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingVersion, requestGetVersion] = useApi({
    method: "get",
    url: Constants.API.get_version,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        setVersion(
          Platform.OS === "android"
            ? response.items[0].version
            : response.items[1].version
        );
        if (Platform.OS === "android") {
          if (
            parseFloat(response.items[0].version.split(".").join("")) >
            parseFloat(DeviceInfo.getVersion().split(".").join(""))
          ) {
            setModalVisible(true);
          } else {
            setModalVisible(false);
          }
        } else {
          if (
            parseFloat(response.items[1].version.split(".").join("")) >
            parseFloat(DeviceInfo.getVersion().split(".").join(""))
          ) {
            setModalVisible(true);
          } else {
            setModalVisible(false);
          }
        }
      }
    },
  });

  const [loadingAddDeviceNotification, requestAddDeviceNotification] = useApi({
    method: "post",
    url: Constants.API.add_device_notification,
    callback: ({ error, response }) => {
      if (error) console.log("error_noti", error);
      else {
        dispatch({ type: success(TYPES.AUTH.LOG_OUT) });
      }
    },
  });
 
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const _handleAppStateChange = (nextAppState: any) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      requestGetVersion();
    }
    appState.current = nextAppState;
    setAppStateVisible(appState.current);
  };
  const onPressUpdate = () => {
    setModalVisible(false);
    // dispatch({ type: success(TYPES.AUTH.LOG_OUT) });
    if (Platform.OS === "ios") {
      Linking.openURL("https://apps.apple.com/us/app/akaiunsan/id6809336835");
    }
    if (Platform.OS === "android") {
      Linking.openURL(
        "https://play.google.com/store/apps/details?id=com.akaiunsan.customer&hl=en&gl=US"
      );
    }
  };
  const isFocused = useIsFocused();
  React.useEffect(() => {
    if (isFocused) {
      requestGetVersion();
    } else {
      setModalVisible(false);
    }
  }, [isFocused]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      "change",
      _handleAppStateChange
    );
    return () => {
      appStateSubscription.remove();
    };
  }, []);
  const logout = () => {
    // await GoogleSignin.clearCachedAccessToken(token);
    requestAddDeviceNotification({
      data: { token: "had_remove" },
    });
    notifee.setBadgeCount(0);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <TouchableOpacity
        onPress={() =>
          item.navigation ? NavigationRoot.navigate(item.navigation) : item.action()
        }
        disabled={item.disable}
        key={index}
      >
        <View style={styles.textArrDataAccount}>
          <Text
            style={[
              { fontSize: 17 },
              item.disable && { color: colors.gray_hidden_text },
            ]}
          >
            {item.title}
          </Text>
          <FontAwesome
            name="angle-right"
            size={24}
            color={item.disable ? colors.gray_hidden_text : "gray"}
          />
        </View>
      </TouchableOpacity>
    );
  };
  const renderChatBox = () => {
    return (
      <WebView
        startInLoadingState={true}
        style={styles.customChat}
        containerStyle={{ flex: 1 }}
        cacheEnabled={false}
        renderLoading={() => (
          <ActivityIndicator
            color={colors.black}
            style={{ flex: 1, alignSelf: "center" }}
          />
        )}
        source={{
          uri:
            language === "en"
              ? "https://admincp.akaiunsan.vn/assets/html/chatbox.html"
              : "https://admincp.akaiunsan.vn/assets/html/chatbox-th.html",
        }}
      />
    );
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS == "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <Loading loading={loadingAddDeviceNotification || loadingRemove} />
      <Container style={styles.container}>
        <View
          style={{
            flexDirection: "row",
            paddingTop: 12,
            paddingBottom: 6,
            alignItems: "center",
            backgroundColor: colors.main_color,
          }}
        >
          <View style={{ paddingHorizontal: 16, alignItems: "center" }}>
            {user && user.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={{ width: 54, height: 54, borderRadius: 54 / 2 }}
              />
            ) : (
              <FontAwesome
                name="user-circle-o"
                size={54}
                color={colors.white}
              />
            )}
          </View>
          <View
            style={{
              flex: 1,
            }}
          >
            <Text style={styles.textTitle}>
              {(user && user.fullName) || "Guest name"}
            </Text>
            <Text
              onPress={() =>
                NavigationRoot.navigate(Constants.SCREENS.OTHER.EditProfile)
              }
              style={styles.textDescription}
            >
              {i18n.t("home.edit_profile")}
            </Text>
          </View>
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <TouchableOpacity
              onPress={logout}
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 100,
                  width: 32,
                  height: 32,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="power-sharp"
                  size={30}
                  color={colors.main_color}
                />
              </View>
              <Text
                style={{
                  marginLeft: 6,
                  color: colors.white,
                }}
              >
                {i18n.t("auth.logout")}
              </Text>
            </TouchableOpacity>
            <Text style={styles.textPoint}>
              {user && user.point} {i18n.t("home.points")}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <FlatList
            showsVerticalScrollIndicator={false}
            data={dataAccount}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            ItemSeparatorComponent={() => (
              <Divider
                style={{
                  backgroundColor: colors.black,
                  maxHeight: 1,
                }}
              />
            )}
            ListFooterComponentStyle={{ paddingBottom: 50 }}
          />
        </View>
        <ActionButton
          size={84}
          offsetY={12}
          spacing={16}
          degrees={0}
          hideShadow
          autoInactive
          buttonColor={"transparent"}
          renderIcon={() => (
            <Image
              source={require("../../assets/images/chatAvatar.png")}
              resizeMode="contain"
              style={styles.actionButtonIcon}
            />
          )}
        >
          <ActionButton.Item
            size={320}
            buttonColor="#1abc9c"
            title="All Tasks"
            onPress={() => {}}
          >
            {renderChatBox()}
          </ActionButton.Item>
        </ActionButton>
        <ModalVersion
          onPress={onPressUpdate}
          visible={modalVisible}
          version={version}
        />
      </Container>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  actionButtonIcon: {
    height: 112,
    width: 112,
    alignSelf: "center",
  },
  customChat: {
    flex: 1,
    resizeMode: "cover",
    height: 320,
    width: 320,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: 10,
    borderColor: colors.gray_hidden_text,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    padding: 6,
    borderRadius: 10,
  },
  textTitle: {
    fontWeight: "bold",
    fontSize: 24,
    color: colors.white,
  },
  textDescription: {
    fontSize: 13,
    fontStyle: "italic",
    color: colors.white,
  },
  textOtherSide: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginHorizontal: 16,
  },
  textArrDataAccount: {
    backgroundColor: colors.white,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  textSubcribed: {
    color: colors.gray_hidden_text,
  },
  wrapPoint: {
    paddingBottom: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray_hidden_text,
  },
  textPoint: {
    textAlign: "right",
    color: colors.white,
  },
});
