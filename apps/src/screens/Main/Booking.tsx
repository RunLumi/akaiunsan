import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  Alert,
  FlatList,
  Platform,
  Linking,
  AppState,
} from "react-native";
import { Container, Loading, Text } from "../../components";
import Constants from "../../shared/Constants";
import _ from "lodash";
import useApi from "../../hooks/useApi";
import i18n from "../../shared/I18n";
import moment from "moment";
import Enum from "../../shared/Enum";
import { getStatus, paramArray } from "../../shared/Utils";
import Colors from "../../shared/Colors";
import { useIsFocused } from "@react-navigation/native";
import DeviceInfo from "react-native-device-info";
import { ModalVersion } from "./components";

export default function Booking(props: any) {
  const [activeTab, setActiveTab] = useState(0);

  const [pageListBooking, setPageListBooking] = useState(1);
  const [pageListHistory, setPageListHistory] = useState(1);

  const [listHistory, setListHistory] = useState<any>([]);
  const [listBooking, setListBooking] = useState<any>([]);

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
  const [loadingListHistory, requestListHistory] = useApi({
    method: "get",
    url: Constants.API.get_booking,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      if (!_.isNull(response)) {
        if (response.items.length) {
          setListHistory((old: any) => [...old, ...response.items]);
          setPageListHistory(response.page);
        }
      }
    },
  });
  const [loadingListBooking, requestListBooking] = useApi({
    method: "get",
    url: Constants.API.get_booking,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      if (!_.isNull(response)) {
        if (response.items.length) {
          setListBooking((old: any) => [...old, ...response.items]);
          setPageListBooking(response.page);
        }
      }
    },
  });

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const _handleAppStateChange = (nextAppState) => {
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
      Linking.openURL("https://apps.apple.com/us/app/ayasan/id1025748222");
    }
    if (Platform.OS === "android") {
      Linking.openURL(
        "https://play.google.com/store/apps/details?id=com.ayasan.yoda.android&hl=en&gl=US"
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
    requestListHistory({
      params: paramArray([
        { orderStatus: Enum.OrderStatus.COMPLETED },
        { orderStatus: Enum.OrderStatus.CANCEL },
      ]),
    });
    requestListBooking({
      params: paramArray([
        { orderStatus: Enum.OrderStatus.PENDING },
        { orderStatus: Enum.OrderStatus.MATCH },
        { orderStatus: Enum.OrderStatus.ON_PROCESS },
        { orderStatus: Enum.OrderStatus.WAITING_CONFIRM },
        { orderStatus: Enum.OrderStatus.RECEIVED },
      ]),
    });
    AppState.addEventListener("change", _handleAppStateChange);
    return () => {
      AppState.removeEventListener("change", _handleAppStateChange);
    };
  }, []);

  const onPressCalendar = () => {
    props.navigation.navigate(Constants.SCREENS.BOOKING.CALENDAR);
  };

  const onPressBookingDetail = (item: any) => {
    props.navigation.navigate(Constants.SCREENS.BOOKING.DETAIL, {
      item,
    });
  };

  const onPressHistoryDetail = (item: any) => {
    props.navigation.navigate(Constants.SCREENS.BOOKING.DETAIL_HISTORY, {
      item,
    });
  };

  const onLoadBooking = (page: number) => {
    requestListBooking({
      params: paramArray([
        { orderStatus: Enum.OrderStatus.PENDING },
        { orderStatus: Enum.OrderStatus.MATCH },
        { orderStatus: Enum.OrderStatus.RECEIVED },
        { orderStatus: Enum.OrderStatus.ON_PROCESS },
        { orderStatus: Enum.OrderStatus.WAITING_CONFIRM },
        { page },
      ]),
    });
  };

  const onLoadHistory = (page: number) => {
    requestListHistory({
      params: paramArray([
        { orderStatus: Enum.OrderStatus.COMPLETED },
        { orderStatus: Enum.OrderStatus.CANCEL },
        { page },
      ]),
    });
  };
  const getSourceImage = (type: number) => {
    switch (type) {
      case 1:
        return require("../../assets/images/1e01.png");
      case 2:
        return require("../../assets/images/1e02.png");
      case 3:
        return require("../../assets/images/1e03.png");
      case 4:
        return require("../../assets/images/1e04.png");
      case 5:
        return require("../../assets/images/1e05.png");
      case 6:
        return require("../../assets/images/1e06.png");
      case 7:
        return require("../../assets/images/1e07.png");
      default:
        return require("../../assets/images/1e01.png");
    }
  };
  const renderItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={s.jobItem}
        onPress={() => onPressBookingDetail(item)}
      >
        <View
          style={{
            backgroundColor: Colors.white,
            padding: 12,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <View style={s.jobItemHeader}>
            <Text style={s.jobItemHeaderTitle}>{item.serviceName}</Text>
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{ flex: 1 }}>
              <View style={s.jobItemMeta}>
                <Ionicons
                  name="calendar"
                  style={{
                    marginRight: 6,
                    ...s.jobItemMetaSp,
                  }}
                />
                <Text style={s.jobItemMetaSp}>
                  {moment(item.bookingDate).local().format("lll")}
                </Text>
              </View>
              <View style={{ ...s.jobItemMeta, marginBottom: 0, flex: 1 }}>
                <Ionicons
                  name="location"
                  style={{
                    marginRight: 6,
                    ...s.jobItemMetaSp,
                  }}
                />
                <Text numberOfLines={1} style={s.jobItemMetaSp}>
                  {item.address}
                </Text>
              </View>
            </View>
            <Text
              style={{
                ...s.jobItemHeaderStatus,
                color: Colors.main_orange,
              }}
            >
              {getStatus(item.orderStatus)}
            </Text>
          </View>
        </View>
        <Image
          style={s.icon}
          source={getSourceImage(item.serviceType)}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  };
  return (
    <Container style={s.container}>
      <Loading loading={loadingListBooking || loadingListHistory} />
      <View style={s.containerHeader}>
        <Text style={s.textTitleHeader}>{i18n.t("Booking")}</Text>
        <Ionicons
          name="calendar"
          size={24}
          color="white"
          onPress={onPressCalendar}
        />
      </View>
      <View style={s.bottomAppBar}>
        {[i18n.t("home.upcoming"), i18n.t("home.history")].map((v, k) => (
          <TouchableOpacity
            key={k.toString()}
            onPress={() => setActiveTab(k)}
            style={{
              ...s.bottomAppBarItem,
              ...(activeTab == k && s.bottomAppBarItemActive),
            }}
          >
            <Text
              style={{
                ...s.bottomAppBarItemLabel,
                ...(activeTab == k && s.bottomAppBarItemLabelActive),
              }}
            >
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab == 0 && (
        <View style={s.pageView}>
          <FlatList
            data={listBooking}
            contentContainerStyle={
              listBooking.length === 0 && {
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }
            }
            ListEmptyComponent={
              <Text style={{ fontSize: 16, marginHorizontal: 10 }}>
                {i18n.t("home.data_empty")}
              </Text>
            }
            keyExtractor={(item, index) => index.toString()}
            onEndReachedThreshold={0.5}
            onEndReached={() => onLoadBooking(pageListBooking + 1)}
            scrollEnabled={true}
            refreshing={false}
            onRefresh={() => {
              setListBooking([]);
              onLoadBooking(1);
            }}
            renderItem={renderItem}
          />
        </View>
      )}
      {activeTab == 1 && (
        <View style={s.pageView}>
          <FlatList
            data={listHistory}
            contentContainerStyle={
              listHistory.length === 0 && {
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }
            }
            ListEmptyComponent={
              <Text style={{ fontSize: 16, marginHorizontal: 10 }}>
                {i18n.t("home.data_empty")}
              </Text>
            }
            keyExtractor={(item, index) => index.toString()}
            onEndReachedThreshold={0.5}
            onEndReached={() => onLoadHistory(pageListHistory + 1)}
            scrollEnabled={true}
            refreshing={false}
            onRefresh={() => {
              setListHistory([]);
              onLoadHistory(1);
            }}
            renderItem={({ item }: any) => (
              <TouchableOpacity
                style={s.historyItem}
                onPress={() => onPressHistoryDetail(item)}
              >
                <View
                  style={{
                    backgroundColor: Colors.white,
                    padding: 12,
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <View style={s.jobItemHeader}>
                    <Text style={s.jobItemHeaderTitle}>{item.serviceName}</Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={s.jobItemMeta}>
                        <Ionicons
                          name="calendar"
                          style={{
                            marginRight: 6,
                            ...s.jobItemMetaSp,
                          }}
                        />
                        <Text style={s.jobItemMetaSp}>
                          {moment(item.bookingDate).local().format("lll")}
                        </Text>
                      </View>
                      <View style={s.jobItemMeta}>
                        <Ionicons
                          name="location"
                          style={{
                            marginRight: 6,
                            ...s.jobItemMetaSp,
                          }}
                        />
                        <Text numberOfLines={2} style={s.jobItemMetaSp}>
                          {item.address}
                        </Text>
                      </View>

                      {item.serviceProviderName && (
                        <View style={{ ...s.jobItemMeta, marginBottom: 0 }}>
                          <Ionicons
                            name="person"
                            style={{
                              marginRight: 6,
                              ...s.jobItemMetaSp,
                            }}
                          />
                          <Text style={s.jobItemMetaSp}>
                            {item.serviceProviderName}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={s.userRating}>
                      <View style={s.userRatingStars}>
                        {_.times(5).map((i, index) => (
                          <Ionicons
                            key={index.toString()}
                            name="star"
                            color={
                              i < item.star
                                ? Colors.main_orange
                                : Colors.gray_normal_text
                            }
                          />
                        ))}
                      </View>
                      {/* <Text>{JSON.stringify(item.star}</Text> */}
                      <Image
                        style={s.userRatingAvatar}
                        source={
                          item.serviceProviderAvatar
                            ? { uri: item.serviceProviderAvatar }
                            : require("../../assets/images/icon.png")
                        }
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
      <ModalVersion
        onPress={onPressUpdate}
        visible={modalVisible}
        version={version}
      />
    </Container>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  icon: {
    height: 60,
    width: 60,
    position: "absolute",
    right: 24,
    top: 4,
  },

  containerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: Colors.main_color,
    zIndex: 10,
  },
  textTitleHeader: {
    color: Colors.white,
    fontSize: 20,
  },
  bottomAppBar: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    height: 46,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
  },
  bottomAppBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderBottomColor: "transparent",
    borderBottomWidth: 2,
    paddingTop: 2,
  },
  bottomAppBarItemActive: {
    borderBottomColor: Colors.main_orange,
  },
  bottomAppBarItemLabel: {
    color: Colors.gray_normal_text,
  },
  bottomAppBarItemLabelActive: {
    color: Colors.main_orange,
  },
  pageView: {
    flex: 1,
  },
  historyItem: {
    padding: 12,

    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
  },
  jobItem: {
    padding: 12,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    elevation: 4,
  },
  jobItemHeader: {
    margin: -12,
    backgroundColor: Colors.main_orange,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  jobItemHeaderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: Colors.white,
  },
  jobItemHeaderStatus: {
    alignSelf: "center",
  },
  jobItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flex: 1,
  },
  jobItemMetaSp: {
    color: Colors.gray_normal_text,
  },
  userRating: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  userRatingStars: {
    flexDirection: "row",
    marginBottom: 16,
  },
  userRatingAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});
