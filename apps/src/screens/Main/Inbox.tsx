import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  Linking,
  AppState
} from "react-native";
import { Container, Loading, Text } from "../../components";
import COLOR from "../../shared/Colors";
import { useDispatch, useSelector } from "react-redux";
import Constants from "../../shared/Constants";
import { Fontisto, AntDesign } from "@expo/vector-icons";
import useApi from "../../hooks/useApi";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../../shared/I18n";
import { CheckBox } from "react-native-elements";
import moment from "moment-timezone";
import Layout from "../../shared/Layout";
import Enum from "../../shared/Enum";
import _ from "lodash";
import { paramArray } from "../../shared/Utils";
import notifee from "@notifee/react-native";
import Colors from "../../shared/Colors";
import { TYPES } from "../../redux/actions";
import PushNotification from "react-native-push-notification";
import DeviceInfo from "react-native-device-info";
import { ModalVersion } from "./components";
import { useIsFocused } from "@react-navigation/native";


export default function Inbox(props: any) {
  const tools = useSelector((state: any) => state.tools.notification);
  const [notificationTabActive, setNotificationTabActive] = useState(true);
  const [promotionTabActive, setPromotionTabActive] = useState(false);
  const [refreshNoti, setRefreshNoti] = useState(false);
  const [refreshPromo, setRefreshPromo] = useState(false);
  const [arrNoti, setArrNoti] = useState([]);
  const [valueNotiDelete, setValueNotiDelete] = useState([]);
  const [arrPromo, setArrPromo] = useState([]);
  const [pageNoti, setPageNoti] = useState(2);
  const [pagePromo, setPagePromo] = useState(2);
  const [valuePromoDelete, setValuePromoDelete] = useState([]);
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
          if (parseFloat(response.items[0].version.split('.').join("")) > parseFloat(DeviceInfo.getVersion().split('.').join(""))) {
            setModalVisible(true);
          } else {
            setModalVisible(false)
          }
        } else {
          if (parseFloat(response.items[1].version.split('.').join("")) > parseFloat(DeviceInfo.getVersion().split('.').join(""))) {
            setModalVisible(true);
          } else {
            setModalVisible(false)
          }
        }
      }
    },
  });
  const [loadingNotification, requestGetNotification] = useApi({
    method: "get",
    url: Constants.API.get_notification,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        setRefreshNoti(false);
        notifee.setBadgeCount(response.totalUnRead);
        PushNotification.setApplicationIconBadgeNumber(response.totalUnRead)

        dispatch({
          type: TYPES.TOOLS.NOTIFICATION,
          payload: response && response.totalUnRead,
        });
        if (response.page === 1) {
          setPageNoti(2);
          let valueNoti = [];
          if (response.items && response.items.length) {
            for (let index = 0; index < response.items.length; index++) {
              valueNoti.push(false);
            }
          }
          setValueNotiDelete(valueNoti);
          setArrNoti(response.items);
        } else {
          let data = [...arrNoti];
          let valueNoti = [];
          if (response.items && response.items.length) {
            response.items.forEach((m) => {
              let item = data.find((n) => n.id === m.id);
              if (item) {
                return Object.assign(item, m);
              }
              data.push(m);
            });
            for (let index = 0; index < data.length; index++) {
              valueNoti.push(false);
            }
          }
          setValueNotiDelete(valueNoti);
          setArrNoti(data);
        }
      }
    },
  });
  const [loadingPromotion, requestPromotion] = useApi({
    method: "get",
    url: Constants.API.get_notification,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        notifee.setBadgeCount(response.totalUnRead);
        PushNotification.setApplicationIconBadgeNumber(response.totalUnRead)
        setRefreshPromo(false);
        if (response.page === 1) {
          setPagePromo(2);
          let valuePromo = [];
          if (response.items && response.items.length) {
            for (let index = 0; index < response.items.length; index++) {
              valuePromo.push(false);
            }
          }
          let getPromotionId = response.items.map((x: any, index) => {
            if (x.type === Enum.InboxType.NEWS) {
              return { ...x, newsId: JSON.parse(x.data).NotificationId };
            } else {
              return { ...x, promotionId: JSON.parse(x.data).PromotionId };
            }
          });
          setValueNotiDelete(valuePromo);
          setArrPromo(getPromotionId);
        } else {
          let data: any = [...arrPromo];
          let valuePromo = [];
          if (response.items && response.items.length) {
            response.items.forEach((m: any) => {
              let item = data.find((n: any) => n.id === m.id);
              if (item) {
                return Object.assign(item, m);
              }
              data.push(m);
            });
            for (let index = 0; index < data.length; index++) {
              valuePromo.push(false);
            }
          }
          let getPromotionId = data.map((x: any) => {
            if (x.type === Enum.InboxType.NEWS) {
              return { ...x, newsId: JSON.parse(x.data).NotificationId };
            } else {
              return { ...x, promotionId: JSON.parse(x.data).PromotionId };
            }
          });
          setValuePromoDelete(valuePromo);
          setArrPromo(getPromotionId);
        }
        dispatch({
          type: TYPES.TOOLS.NOTIFICATION,
          payload: response && response.totalUnRead,
        });
      }
    },
  });

  const [loadingDeleteNotification, requestDeleteNotification] = useApi({
    method: "delete",
    url: Constants.API.delete_notification,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        // if (response) {
        setIsDelete(false);
        setCountItemDelete(0);
        if (promotionTabActive) {
          onRefreshPromo();
          // requestPromotion({
          //   params: paramArray([{ type: Enum.InboxType.PROMOTION }, { type: Enum.InboxType.NEWS }])
          // });
        } else {
          onRefreshNoti();
        }
        // }
      }
    },
  });
  const [loadingReadAll, requestReadAll] = useApi({
    method: "post",
    url: Constants.API.read_all_notification,
    callback: ({ error, response }) => {
      if (error) {
        setTimeout(() => {
          Alert.alert(i18n.t("auth.error"), error);
        }, 100);
      } else {
        // if (!_.isNil(params.onReloadNoti)) {
        //   params.onReloadNoti();
        // }
      }
    },
  });
  const navigateTo = (value: any) => {
    if (value === 1) {
      setNotificationTabActive(true);
      setPromotionTabActive(false);
      onDeleteAll(false);
      setCountItemDelete(0);
    } else if (value === 2) {
      setNotificationTabActive(false);
      setPromotionTabActive(true);
      onDeleteAll(false);
      setCountItemDelete(0);
    }
  };
  const user = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);
  const [isDelete, setIsDelete] = useState(false);
  const [isDeleteAll, setIsDeleteAll] = useState(false);
  const [countItemDelete, setCountItemDelete] = useState(0);
  const dispatch = useDispatch();
  const confirmDeleteNotification = () => {
    if (countItemDelete) {
      Alert.alert(
        "",
        `${i18n.t("home.confirm_delete")} ${countItemDelete} ${i18n.t(
          "home.notification"
        )} ?`,
        [
          {
            text: i18n.t("home.no"),
            onPress: () => console.log("Cancel Pressed"),
          },
          {
            text: i18n.t("home.yes"),
            onPress: () =>
              promotionTabActive ? deletePromotion() : deleteNotification(),
          },
        ],
        { cancelable: false }
      );
    }
  };
  const deleteNotification = () => {
    const notUndefined = (anyValue: any) => typeof anyValue !== "undefined";
    const getItemDelete = arrNoti
      .map((x: any) => {
        if (x.isDeleted) {
          return x.id;
        }
      })
      .filter(notUndefined);
    if (isDeleteAll) {
      requestDeleteNotification({
        data: {
          deleteAllType: [
            Enum.InboxType.ORDER,
            Enum.InboxType.SUBSCRIPTIONORDER,
          ],
          isDeleteAll: true,
          notificationIds: [],
        },
      });
    } else {
      requestDeleteNotification({
        data: { notificationIds: getItemDelete, isDeleteAll: false },
      });
    }
  };

  const deletePromotion = () => {
    const notUndefined = (anyValue: any) => typeof anyValue !== "undefined";
    const getItemDelete = arrPromo
      .map((x: any) => {
        if (x.isDeleted) {
          return x.id;
        }
      })
      .filter(notUndefined);
    if (isDeleteAll) {
      requestDeleteNotification({
        data: {
          deleteAllType: [Enum.InboxType.PROMOTION, Enum.InboxType.NEWS],
          isDeleteAll: true,
          notificationIds: [],
        },
      });
    } else {
      requestDeleteNotification({
        data: { notificationIds: getItemDelete, isDeleteAll: false },
      });
    }
  };
  const onDeleteAll = (value: boolean) => {
    setIsDeleteAll(value);
    let valueDeleteAll: any = [];
    if (notificationTabActive) {
      arrNoti.forEach((element) => {
        if (value) {
          valueDeleteAll.push(true);
          setCountItemDelete(arrNoti.length);
        } else {
          valueDeleteAll.push(false);
          setCountItemDelete(0);
        }
      });
      setValueNotiDelete(valueDeleteAll);
    } else if (promotionTabActive) {
      arrPromo.forEach((element) => {
        if (value) {
          valueDeleteAll.push(true);
          setCountItemDelete(arrPromo.length);
        } else {
          valueDeleteAll.push(false);
          setCountItemDelete(0);
        }
      });
      setValuePromoDelete(valueDeleteAll);
    }
  };
  const selectDeleteNoti = (newValue, index) => {
    const value = [...valueNotiDelete] as any;
    const valueDelete = [...arrNoti] as any;
    valueDelete[index].isDeleted = newValue;
    value[index] = newValue;
    setValueNotiDelete(value);
    setArrNoti(valueDelete);
    let countValue = value.filter(Boolean).length;
    setCountItemDelete(countValue);
  };
  const selectDeletePromo = (newValue, index) => {
    const value = [...valuePromoDelete] as any;
    const valueDelete = [...arrPromo] as any;
    valueDelete[index].isDeleted = newValue;
    value[index] = newValue;
    setValuePromoDelete(value);
    setArrPromo(valueDelete);
    let countValue = value.filter(Boolean).length;
    setCountItemDelete(countValue);
  };
  const onLoadMoreNoti = () => {
    requestGetNotification({
      params: paramArray([
        { type: Enum.InboxType.ORDER },
        { type: Enum.InboxType.SUBSCRIPTIONORDER },
        { page: pageNoti },
      ]),
    });
    setPageNoti(pageNoti + 1);
  };
  const onRefreshNoti = () => {
    setRefreshNoti(true);
    requestGetNotification({
      params: paramArray([
        { type: Enum.InboxType.ORDER },
        { type: Enum.InboxType.SUBSCRIPTIONORDER },
        { page: 1 },
      ]),
    });
  };
  const onLoadMorePromo = () => {
    requestPromotion({
      params: paramArray([
        { type: Enum.InboxType.PROMOTION },
        { type: Enum.InboxType.NEWS },
        { page: pagePromo },
      ]),
    });
    setPagePromo(pagePromo + 1);
  };
  const onRefreshPromo = () => {
    setRefreshPromo(true);
    requestPromotion({
      params: paramArray([
        { type: Enum.InboxType.PROMOTION },
        { type: Enum.InboxType.NEWS },
        { page: 1 },
      ]),
    });
  };

  const redirectDetailNoti = (item: any, index: any) => {
    // NavigationRoot.push(Constants.SCREENS.OTHER.INBOXDETAIL, { data });
    let data = [...arrNoti];
    if (!data[index].isRead) {
      data[index].isRead = true;
      notifee.setBadgeCount(tools - 1);
      PushNotification.setApplicationIconBadgeNumber(tools - 1)
      dispatch({
        type: TYPES.TOOLS.NOTIFICATION,
        payload: tools - 1,
      });
    }

    setArrNoti(data);
    props.navigation.push(Constants.SCREENS.OTHER.INBOXDETAIL, {
      id: item.notificationId,
    });
  };
  const renderItemNoti = ({ item, index }: { item: any; index: number }) => (
    <View>
      <TouchableOpacity
        onPress={() =>
          isDelete
            ? selectDeleteNoti(!valueNotiDelete[index], index)
            : redirectDetailNoti(item, index)
        }
      >
        <View style={styles.itemArr}>
          {isDelete && (
            <CheckBox
              style={{ alignItems: "flex-start" }}
              center
              checked={valueNotiDelete[index]}
              onPress={() => selectDeleteNoti(!valueNotiDelete[index], index)}
              checkedColor={COLOR.main_color}
            />
          )}
          <View
            style={[
              styles.radiusIcon,
              {
                backgroundColor: item.isRead
                  ? COLOR.gray_normal_text
                  : COLOR.yellow,
              },
            ]}
          >
            <Fontisto
              style={styles.iconBell}
              name="bell-alt"
              size={22}
              color="white"
            />
          </View>
          <View
            style={{ flexDirection: "column", marginLeft: 15, marginRight: 15 }}
          >
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={[
                styles.textTitle,
                {
                  width: isDelete
                    ? Layout.window.width - 200
                    : Layout.window.width - 100,
                  color: item.isRead ? COLOR.gray_normal_text : "black",
                },
              ]}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.textDescription,
                { color: item.isRead ? COLOR.gray_normal_text : "black" },
              ]}
            >
              {moment
                .utc(item.createdDate)
                .tz("Europe/London")
                .clone()
                .tz("Asia/Bangkok")
                .format("DD/MM/YYYY hh:mm A")}
            </Text>
          </View>
          <View style={{ paddingTop: 10 }}>
            <Fontisto
              name="angle-right"
              size={15}
              color={item.isRead ? COLOR.gray_normal_text : "black"}
            />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
  const redirectDetailPromo = (item: any, index: any) => {
    let data2 = [...arrPromo];
    if (!data2[index].isRead) {
      data2[index].isRead = true;
      notifee.setBadgeCount(tools - 1);
      PushNotification.setApplicationIconBadgeNumber(tools - 1)
      setArrPromo(data2);
      dispatch({
        type: TYPES.TOOLS.NOTIFICATION,
        payload: tools - 1,
      });
    }
    props.navigation.navigate(Constants.SCREENS.PROMOTIOM.DETAIL, {
      data: item,
    });
  };
  const renderItemPromo = ({ item, index }: { item: any; index: number }) => {
    return (
      <View>
        <TouchableOpacity
          onPress={() =>
            isDelete
              ? selectDeletePromo(!valuePromoDelete[index], index)
              : redirectDetailPromo(item, index)
          }
        >
          <View style={styles.itemArr}>
            {isDelete && (
              <CheckBox
                style={{ alignItems: "flex-start" }}
                center
                checked={valuePromoDelete[index]}
                onPress={() =>
                  selectDeletePromo(!valuePromoDelete[index], index)
                }
                checkedColor={COLOR.main_color}
              />
            )}
            <View
              style={[
                styles.radiusIcon,
                {
                  backgroundColor: item.isRead
                    ? COLOR.gray_normal_text
                    : COLOR.yellow,
                },
              ]}
            >
              <AntDesign
                style={styles.iconBell}
                name="notification"
                size={22}
                color="white"
              />
            </View>
            <View
              style={{
                flexDirection: "column",
                marginLeft: 15,
                marginRight: 15,
              }}
            >
              <Text
                numberOfLines={2}
                ellipsizeMode="tail"
                style={[
                  styles.textTitle,
                  {
                    width: isDelete
                      ? Layout.window.width - 200
                      : Layout.window.width - 100,
                    color: item.isRead ? COLOR.gray_normal_text : "black",
                  },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.textDescription,
                  { color: item.isRead ? COLOR.gray_normal_text : "black" },
                ]}
              >
                {moment
                  .utc(item.createdDate)
                  .tz("Europe/London")
                  .clone()
                  .tz("Asia/Bangkok")
                  .format("DD/MM/YYYY hh:mm A")}
              </Text>
            </View>
            <View style={{ paddingTop: 10 }}>
              <Fontisto
                name="angle-right"
                size={15}
                color={item.isRead ? COLOR.gray_normal_text : "black"}
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const _handleAppStateChange = (nextAppState) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      requestGetVersion()
    }
    appState.current = nextAppState;
    setAppStateVisible(appState.current);
  };
  const onPressUpdate = () => {
    setModalVisible(false);
    // dispatch({ type: success(TYPES.AUTH.LOG_OUT) });
    if (Platform.OS === "ios") {
      Linking.openURL(
        "https://apps.apple.com/us/app/ayasan/id1025748222"
      );
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
      setModalVisible(false)
    }
  }, [isFocused]);
  useEffect(() => {
    AppState.addEventListener("change", _handleAppStateChange);
    return () => {
      AppState.removeEventListener("change", _handleAppStateChange);
    };
  }, [])
  useEffect(() => {
    if (!user || !token) {
      props.navigation.replace(Constants.SCREENS.AUTH.LOGIN);
    }
  }, [user, token]);

  useEffect(() => {
    if (notificationTabActive) {
      requestGetNotification({
        params: paramArray([
          { type: Enum.InboxType.ORDER },
          { type: Enum.InboxType.SUBSCRIPTIONORDER },
        ]),
      });
    } else if (promotionTabActive) {
      requestPromotion({
        params: paramArray([
          { type: Enum.InboxType.PROMOTION },
          { type: Enum.InboxType.NEWS },
        ]),
      });
    }
  }, [promotionTabActive, notificationTabActive]);

  const onPressReadAll = async () => {
    if (notificationTabActive) {
      await requestReadAll({
        data: {
          readAllType: [Enum.InboxType.ORDER, Enum.InboxType.SUBSCRIPTIONORDER],
        },
      });

      onRefreshNoti();
    } else if (promotionTabActive) {
      await requestReadAll({
        data: {
          readAllType: [Enum.InboxType.PROMOTION, Enum.InboxType.NEWS],
        },
      });

      onRefreshPromo();
    }
  };

  return (
    <Container style={styles.container}>
      <View style={[styles.containerHeader]}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            flex: 1,
          }}
        >
          <Text style={[styles.textTitleHeader, { fontSize: 20 }]}>
            {i18n.t("Inbox")}
          </Text>
          {isDelete ? (
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity onPress={() => confirmDeleteNotification()}>
                <Text style={[styles.textTitleHeader, { fontSize: 18 }]}>
                  {i18n.t("home.delete")} ({`${countItemDelete}`})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsDelete(false)}>
                <Text style={[styles.textTitleHeader, { fontSize: 18 }]}>
                  {i18n.t("home.cancel")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: "row" }}>
              <Ionicons
                onPress={() => onPressReadAll()}
                style={[styles.textTitleHeader, { marginRight: 8 }]}
                name="checkmark-done"
                size={27}
                color="white"
              />
              <Ionicons
                onPress={() => setIsDelete(true)}
                style={[styles.textTitleHeader, { marginRight: 12 }]}
                name="trash-sharp"
                size={27}
                color="white"
              />
            </View>
          )}
        </View>
      </View>
      <Loading
        loading={
          loadingNotification ||
          loadingDeleteNotification ||
          loadingPromotion ||
          loadingReadAll
        }
      />
      <View style={{ flex: 1 }}>
        <View style={styles.tabTop}>
          <TouchableOpacity
            style={[
              notificationTabActive ? styles.activeTab : styles.disableTab,
              { width: "50%" },
            ]}
            onPress={() => navigateTo(1)}
          >
            <View>
              <Text
                style={
                  notificationTabActive
                    ? styles.activeTextTab
                    : styles.disableTextTab
                }
              >
                {i18n.t("home.notification")}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              promotionTabActive ? styles.activeTab : styles.disableTab,
              { width: "50%" },
            ]}
            onPress={() => {
              navigateTo(2);
            }}
          >
            <View>
              <Text
                style={
                  promotionTabActive
                    ? styles.activeTextTab
                    : styles.disableTextTab
                }
              >
                {i18n.t("home.promotion")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        {isDelete && (
          <View style={styles.itemArr}>
            {isDelete && (
              <CheckBox
                checked={isDeleteAll}
                onPress={() => onDeleteAll(!isDeleteAll)}
                checkedColor={COLOR.main_color}
                title="All"
                textStyle={{ paddingLeft: 10 }}
                containerStyle={{
                  backgroundColor: "transparent",
                  borderWidth: 0,
                }}
              />
            )}
          </View>
        )}
        <View
          style={{
            maxHeight: isDelete
              ? Layout.window.height - 230
              : Layout.window.height - 160,
          }}
        >
          {notificationTabActive && (
            <FlatList
              key={"#list1"}
              data={arrNoti}
              extraData={arrNoti}
              contentContainerStyle={
                arrNoti.length === 0 && styles.centerEmptySet
              }
              keyExtractor={(item, index) => index.toString()}
              onEndReachedThreshold={0.1}
              refreshing={refreshNoti}
              onRefresh={onRefreshNoti}
              onEndReached={onLoadMoreNoti}
              renderItem={renderItemNoti}
              ListEmptyComponent={
                <Text
                  style={{
                    fontSize: 18,
                    marginHorizontal: 12,

                    color: Colors.gray_normal_text,
                  }}
                >
                  {i18n.t("home.notification_empty")}
                </Text>
              }
            />
          )}
          {promotionTabActive && (
            <FlatList
              key={"#list2"}
              contentContainerStyle={
                arrPromo.length === 0 && styles.centerEmptySet
              }
              data={arrPromo}
              extraData={arrPromo}
              keyExtractor={(item, index) => index.toString()}
              onEndReachedThreshold={0.1}
              refreshing={refreshPromo}
              onRefresh={onRefreshPromo}
              onEndReached={onLoadMorePromo}
              renderItem={renderItemPromo}
              ListEmptyComponent={
                <Text
                  style={{
                    fontSize: 18,
                    marginHorizontal: 12,
                    alignSelf: "center",
                    color: Colors.gray_normal_text,
                  }}
                >
                  {i18n.t("home.promotion_empty")}
                </Text>
              }
            />
          )}
        </View>
      </View>
      <ModalVersion onPress={onPressUpdate} visible={modalVisible} version={version}/>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerEmptySet: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  itemArr: {
    flexDirection: "row",
    marginVertical: 5,
    borderBottomColor: COLOR.gray_hidden_text,
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  tabItem: {
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  tabTop: {
    flexDirection: "row",
    marginTop: 15,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLOR.main_color,
  },
  disableTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLOR.gray_hidden_text,
  },
  activeTextTab: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 7,
    color: COLOR.main_color,
  },
  disableTextTab: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 7,
    color: COLOR.gray_hidden_text,
  },
  textTitle: {
    fontSize: 15,
    fontWeight: "bold",
    overflow: "hidden",
  },
  textDescription: {
    fontSize: 15,
  },
  iconBell: {
    paddingTop: 7,
  },
  radiusIcon: {
    marginLeft: 5,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 40,
    width: 40,
  },
  containerHeader: {
    zIndex: 10,
    width: "100%",
    height: 56,
    backgroundColor: COLOR.main_color,
  },
  homeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textTitleHeader: {
    color: COLOR.white,
    marginHorizontal: 12,
  },
});
