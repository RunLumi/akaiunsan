import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Container, Loading, Text } from "../../components";
import COLOR from "../../shared/Colors";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../../redux/hooks";
import Constants from "../../shared/Constants";
import { Fontisto, AntDesign } from "@expo/vector-icons";
import { apiSlice, portRequest, type ApiResult } from "../../redux/apiSlice";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../../shared/I18n";
import { CheckBox } from "react-native-elements";
import dayjs from "../../shared/dayjs";
import Layout from "../../shared/Layout";
import Enum from "../../shared/Enum";
import _ from "lodash";
import { paramArray } from "../../shared/Utils";
import notifee from "@notifee/react-native";
import Colors from "../../shared/Colors";
import { TYPES } from "../../redux/actions";
import type { ApiItem } from "../../redux/apiSlice";
import type { ScreenProps } from "../../navigation/routes";


export default function Inbox(props: ScreenProps) {
  const tools = useAppSelector((state) => state.tools.notification);
  const [notificationTabActive, setNotificationTabActive] = useState(true);
  const [promotionTabActive, setPromotionTabActive] = useState(false);
  const [refreshNoti, setRefreshNoti] = useState(false);
  const [refreshPromo, setRefreshPromo] = useState(false);
  const [arrNoti, setArrNoti] = useState<ApiItem[]>([]);
  const [valueNotiDelete, setValueNotiDelete] = useState<boolean[]>([]);
  const [arrPromo, setArrPromo] = useState<ApiItem[]>([]);
  const [pageNoti, setPageNoti] = useState(2);
  const [pagePromo, setPagePromo] = useState(2);
  const [valuePromoDelete, setValuePromoDelete] = useState<boolean[]>([]);
  // Phase 5 RTK Query port: notifications + promotions read the same paged
  // endpoint (like useApi, two tunnels); delete/read-all run as mutations.
  // All callbacks are preserved verbatim via portRequest.
  const [
    notificationTrigger,
    { isLoading: loadingNotification },
  ] = apiSlice.endpoints.getNotifications.useLazyQuery();
  const requestGetNotification = portRequest(
    notificationTrigger,
    ({ error, response }: ApiResult) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        setRefreshNoti(false);
        notifee.setBadgeCount(response.totalUnRead);

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
            response.items.forEach((m: ApiItem) => {
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
    }
  );
  const [
    promotionTrigger,
    { isLoading: loadingPromotion },
  ] = apiSlice.endpoints.getNotifications.useLazyQuery();
  const requestPromotion = portRequest(
    promotionTrigger,
    ({ error, response }: ApiResult) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        notifee.setBadgeCount(response.totalUnRead);
        setRefreshPromo(false);
        if (response.page === 1) {
          setPagePromo(2);
          let valuePromo = [];
          if (response.items && response.items.length) {
            for (let index = 0; index < response.items.length; index++) {
              valuePromo.push(false);
            }
          }
          let getPromotionId = response.items.map((x: ApiItem, index: number) => {
            if (x.type === Enum.InboxType.NEWS) {
              return { ...x, newsId: JSON.parse(x.data).NotificationId };
            } else {
              return { ...x, promotionId: JSON.parse(x.data).PromotionId };
            }
          });
          setValueNotiDelete(valuePromo);
          setArrPromo(getPromotionId);
        } else {
          let data: ApiItem[] = [...arrPromo];
          let valuePromo = [];
          if (response.items && response.items.length) {
            response.items.forEach((m: ApiItem) => {
              let item = data.find((n: ApiItem) => n.id === m.id);
              if (item) {
                return Object.assign(item, m);
              }
              data.push(m);
            });
            for (let index = 0; index < data.length; index++) {
              valuePromo.push(false);
            }
          }
          let getPromotionId = data.map((x: ApiItem) => {
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
    }
  );

  const [
    deleteNotificationMutation,
    { isLoading: loadingDeleteNotification },
  ] = apiSlice.endpoints.deleteNotification.useMutation();
  const requestDeleteNotification = portRequest(
    deleteNotificationMutation,
    ({ error }: ApiResult) => {
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
    }
  );
  const [
    readAllMutation,
    { isLoading: loadingReadAll },
  ] = apiSlice.endpoints.readAllNotifications.useMutation();
  const requestReadAll = portRequest(
    readAllMutation,
    ({ error }: ApiResult) => {
      if (error) {
        setTimeout(() => {
          Alert.alert(i18n.t("auth.error"), error);
        }, 100);
      } else {
        // if (!_.isNil(params.onReloadNoti)) {
        //   params.onReloadNoti();
        // }
      }
    }
  );
  const navigateTo = (value: number) => {
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
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
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
    const notUndefined = (anyValue: ApiItem) => typeof anyValue !== "undefined";
    const getItemDelete = arrNoti
      .map((x: ApiItem) => {
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
    const notUndefined = (anyValue: ApiItem) => typeof anyValue !== "undefined";
    const getItemDelete = arrPromo
      .map((x: ApiItem) => {
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
    let valueDeleteAll: boolean[] = [];
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
  const selectDeleteNoti = (newValue: boolean, index: number) => {
    const value = [...valueNotiDelete];
    const valueDelete = arrNoti.map((item, itemIndex) =>
      itemIndex === index ? { ...item, isDeleted: newValue } : item
    );
    value[index] = newValue;
    setValueNotiDelete(value);
    setArrNoti(valueDelete);
    let countValue = value.filter(Boolean).length;
    setCountItemDelete(countValue);
  };
  const selectDeletePromo = (newValue: boolean, index: number) => {
    const value = [...valuePromoDelete];
    const valueDelete = arrPromo.map((item, itemIndex) =>
      itemIndex === index ? { ...item, isDeleted: newValue } : item
    );
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

  const redirectDetailNoti = (item: ApiItem, index: number) => {
    // NavigationRoot.push(Constants.SCREENS.OTHER.INBOXDETAIL, { data });
    const wasUnread = !arrNoti[index]?.isRead;
    let data = arrNoti.map((notification, notificationIndex) =>
      notificationIndex === index ? { ...notification, isRead: true } : notification
    );
    if (wasUnread) {
      notifee.setBadgeCount(tools - 1);
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
  const renderItemNoti = ({ item, index }: { item: ApiItem; index: number }) => (
    <View>
      <TouchableOpacity
        accessibilityLabel={`inbox-notification-${item.notificationId || item.id || index}`}
        testID={`inbox-notification-${item.notificationId || item.id || index}`}
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
              checked={!!valueNotiDelete[index]}
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
              color={COLOR.white}
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
              {dayjs
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
  const redirectDetailPromo = (item: ApiItem, index: number) => {
    const wasUnread = !arrPromo[index]?.isRead;
    let data2 = arrPromo.map((promotion, promotionIndex) =>
      promotionIndex === index ? { ...promotion, isRead: true } : promotion
    );
    if (wasUnread) {
      notifee.setBadgeCount(tools - 1);
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
  const renderItemPromo = ({ item, index }: { item: ApiItem; index: number }) => {
    return (
      <View>
        <TouchableOpacity
          accessibilityLabel={`inbox-promotion-${item.id || index}`}
          testID={`inbox-promotion-${item.id || index}`}
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
                checked={!!valuePromoDelete[index]}
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
              color={COLOR.white}
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
                color: item.isRead ? COLOR.gray_normal_text : COLOR.black_text,
                  },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.textDescription,
                { color: item.isRead ? COLOR.gray_normal_text : COLOR.black_text },
                ]}
              >
                {dayjs
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
              color={item.isRead ? COLOR.gray_normal_text : COLOR.black_text}
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
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
                color={COLOR.white}
              />
              <Ionicons
                onPress={() => setIsDelete(true)}
                style={[styles.textTitleHeader, { marginRight: 12 }]}
                name="trash-sharp"
                size={27}
                color={COLOR.white}
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
