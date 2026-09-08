import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Alert,
  ImageBackground,
  FlatList,
  Dimensions,
  RefreshControl,
  Platform,
  AppState,
  Linking,
} from "react-native";
import DeviceInfo from "react-native-device-info";
import { Image as ExpoImage } from "expo-image";
import messaging from "@react-native-firebase/messaging";
import Swiper from "react-native-swiper";
import { useDispatch, useSelector } from "react-redux";
import { Container, Header, Loading, Text } from "../../components";
import { success, TYPES } from "../../redux/actions";
import { NavigationRoot } from "../../navigation/root";
import Constants from "../../shared/Constants";
import useApi from "../../hooks/useApi";
import i18n from "../../shared/I18n";
import _, { isEmpty, isEqual, isNil } from "lodash";
import Enum from "../../shared/Enum";
import Theme from "../../shared/theme";
import Colors from "../../shared/Colors";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { useIsFocused } from "@react-navigation/native";
import { ModalVersion } from "./components";
import notifee from "@notifee/react-native";
import { paramArray } from "../../shared/Utils";

const { width } = Dimensions.get("window");
export default function Home(props: any) {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const appState = useRef(AppState.currentState);
  const language = useSelector((state: any) => state.language.language);
  const user = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);

  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const [arrUpdate, setArrUpdate] = useState<any[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [arrService, setArrService] = useState<any[]>([]);
  const [carouselItems, setCarouselItems] = useState<any[]>([]);
  const [listService, setListService] = useState<any>([]);
  const [subscriptionPlanActive, setSubscriptionPlanActive] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [version, setVersion] = useState();
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
  const [loadingLanguage, requestUpdateLanguage] = useApi({
    method: "put",
    url: Constants.API.update_language,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        dispatch({
          type: success(TYPES.LANGUAGE),
          payload: {
            language: currentLanguage,
          },
        });
      }
    },
  });
  const [loadingListService, requestListService] = useApi({
    method: "get",
    url: Constants.API.list_favourite_service,
    callback: ({ error, response }) => {
      if (error) {
        if (error === "Request failed with status code 401") {
        } else {
          Alert.alert(i18n.t("auth.error"), error);
        }
      } else {
        setListService(
          _(response.items)
            .filter((i: any) => i.isSelected)
            .value()
        );
      }
    },
  });
  const [loadingUserMe, requestUserMe] = useApi({
    method: "get",
    url: Constants.API.get_profile,
    callback: ({ error, response }) => {
      if (error) {
        if (error === "Request failed with status code 401") {
          dispatch({ type: success(TYPES.AUTH.LOG_OUT) });
          Alert.alert(i18n.t("auth.error"), i18n.t("auth.token_expired"));
        } else {
          Alert.alert(i18n.t("auth.error"), error);
          dispatch({ type: success(TYPES.AUTH.LOG_OUT) });
        }
      } else {
        if (!isEqual(response, user)) {
          dispatch({
            type: success(TYPES.AUTH.PROFILE),
            payload: {
              user: response,
            },
          });
        }
        if (response.language == 1 && currentLanguage != "th") {
          setCurrentLanguage("th");
        }
        if (response.language == 2 && currentLanguage != "en") {
          setCurrentLanguage("en");
        }
        if (response.loginBy && !response.isFirstLogin) {
          props.navigation.navigate(Constants.SCREENS.OTHER.EditProfile, {
            data: user,
          });
        }
      }
    },
  });
  const [loadingBanner, requestGetBanner] = useApi({
    method: "get",
    url: Constants.API.get_banner,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        setCarouselItems(response && response.items);
      }
    },
  });
  const [loadingServiceManagement, requestServiceManagement] = useApi({
    method: "get",
    url: Constants.API.services_management,
    callback: ({ error, response }) => {
      if (error) console.log(i18n.t("auth.error"), error);
      else {
        setArrService(response.items);
      }
    },
  });
  const [loadingPromotion, requestGetPromotion] = useApi({
    method: "get",
    url: Constants.API.promotion_updates,
    callback: ({ error, response }) => {
      if (error) {
        if (error === "Request failed with status code 401") {
        } else {
          Alert.alert(i18n.t("auth.error"), error);
        }
      } else {
        if (response && response.items) {
          let data = response.items.map((x: any) => {
            if (!isEmpty(x.image)) {
              if (x.type === Enum.InboxType.NEWS) {
                return { ...x, newsId: x.id, image: x.image };
              } else {
                return { ...x, image: x.image };
              }
            } else {
              return {
                ...x,
                image: require("../../assets/images/akaiunsan_logo.png"),
              };
            }
          });
          setArrUpdate(data);
        }
      }
    },
  });
  const [loadingCurrentPlan, requestCurrentPlan] = useApi({
    method: "get",
    url: Constants.API.get_current_plan,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      // setListCurrentPlan(response.items);
      if (response.items && response.items.length) {
        let getSubscriptionPlanActive = response.items.find(
          (x: any) => x.subscriptionStatus === Enum.SubscriptionStatus.ACTIVE
        );
        setSubscriptionPlanActive(getSubscriptionPlanActive);
      }
    },
  });
  const [loadingNotification, requestGetNotification] = useApi({
    method: "get",
    url: Constants.API.get_notification,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        notifee.setBadgeCount(response.totalUnRead)

        dispatch({
          type: TYPES.TOOLS.NOTIFICATION,
          payload: response && response.totalUnRead,
        });
      }
    },
  });

  const sortArrayService = _.sortBy(arrService, (s: any) =>
    _.indexOf([1, 2, 3, 4, 5], s.serviceType)
  ).slice(0, 5);
  const extraService = [
    {
      icon: require("../../assets/images/soon/Insurance.jpg"),
      serviceName: "Insurance",
      serviceNameTl: "ประกันสุขภาพ",
      type: 1,
    },
    {
      icon: require("../../assets/images/soon/Healthcare.jpg"),
      serviceName: "Healthcare",
      serviceNameTl: "สุขภาพ",
      type: 1,
    },
    {
      icon: require("../../assets/images/soon/Security.jpg"),
      serviceName: "Security",
      serviceNameTl: "ระบบความปลอดภัย",
      type: 1,
    },
  ];
  const totalService = [...sortArrayService, ...extraService];

  useEffect(() => {
    requestGetNotification({
      params: paramArray([
        { type: Enum.InboxType.ORDER },
        { type: Enum.InboxType.SUBSCRIPTIONORDER },
        { page: 1 },
      ]),
    });
  }, [])

  React.useEffect(() => {
    if (isFocused) {
      requestGetVersion();
    } else {
      setModalVisible(false);
    }
  }, [isFocused]);

  useEffect(() => {
    if (!token || token === "") {
      props.navigation.replace(Constants.SCREENS.AUTH.LOGIN);
    }
  }, [user, token]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      "change",
      _handleAppStateChange
    );
    setModalVisible(false);
    requestGetVersion();
    requestUserMe();
    requestListService();
    requestGetBanner();
    requestGetPromotion();
    requestServiceManagement();
    const listen = messaging()
      .getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage?.data) {
          switch (remoteMessage.data.type) {
            case "0":
              NavigationRoot.navigate(Constants.SCREENS.BOOKING.DETAIL, {
                item: {
                  orderId: remoteMessage.data.id,
                  notificationId: remoteMessage.data.notificationId,
                },
              });
              break;
            case "1":
              NavigationRoot.navigate(Constants.SCREENS.PROMOTIOM.DETAIL, {
                data: { promotionId: remoteMessage.data.id },
              });
              break;
            case "2":
              NavigationRoot.navigate(Constants.SCREENS.PROMOTIOM.DETAIL, {
                data: { newsId: remoteMessage.data.id },
              });
              break;
            case "3":
              NavigationRoot.navigate(Constants.SCREENS.OTHER.INBOXDETAIL, {
                id: remoteMessage.data.id,
              });
              break;
            case "4":
              NavigationRoot.navigate(Constants.SCREENS.OTHER.INBOXDETAIL, {
                id: remoteMessage.data.id,
              });
              break;
          }
        }
      });
    return () => {
      listen;
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (currentLanguage != language) {
      requestUpdateLanguage({
        data: { language: currentLanguage == "th" ? 1 : 2 },
      });
    }
  }, [currentLanguage]);

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

  const selectLanguage = (value: string) => {
    setCurrentLanguage(value);
  };

  const onRefreshHome = async () => {
    await Promise.all([
      requestGetBanner(),
      requestUserMe(),
      requestListService(),
      requestGetPromotion(),
      requestServiceManagement(),
      requestCurrentPlan(),
    ]);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <TouchableWithoutFeedback
        onPress={() =>
          NavigationRoot.push(Constants.SCREENS.SERVICE.SERVICE, {
            data: item,
          })
        }
        key={index.toString()}
      >
        <ExpoImage
          contentFit="contain"
          style={{
            aspectRatio: 16 / 9,
          }}
          source={{ uri: item.listImage[0].image }}
        />
      </TouchableWithoutFeedback>
    );
  };

  const renderItemService = ({ item, index }: { item: any; index: number }) => {
    const onPress = () => {
      if (item.type === 1) {
        return Alert.alert("", "This service will coming soon.");
      }
      NavigationRoot.push(Constants.SCREENS.SERVICE.SERVICE, {
        data: item,
        subscriptionPlanActive,
        fromThread: 'service-thread'
      });
    };

    return (
      <TouchableOpacity
        style={{ flex: 1, marginBottom: 16 }}
        key={index.toString()}
        onPress={onPress}
      >
        {!item.type ? (
          <Image
            progressiveRenderingEnabled={true}
            source={{ uri: item.icon }}
            style={{
              aspectRatio: 1.4,
            }}
            resizeMode="contain"
          />
        ) : (
          <ImageBackground
            source={item.icon}
            style={{
              aspectRatio: 1.4,
            }}
            resizeMode="contain"
          />
        )}
        <Text style={{ textAlign: "center" }}>
          {currentLanguage == "th" ? item.serviceNameTl : item.serviceName}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    const items = carouselItems.filter((i: any) => i.type === 1);
    return (
      <View>
        <Header
          titleDashboard={user && user.fullName}
          pointNumberDashboard={user && user.point}
          isDashboard
          selectLanguage={selectLanguage}
          language={currentLanguage}
        />
        <View
          style={{
            aspectRatio: 16 / 9,
            backgroundColor: Colors.grab_orange,
          }}
        >
          <Swiper
            showsButtons={false}
            showsPagination={false}
            autoplay
            autoplayTimeout={4}
            loop
            removeClippedSubviews={false}
          >
            {items.map((item, index) => renderItem({ item, index }))}
          </Swiper>
        </View>
        {!isEmpty(listService) && (
          <Text
            style={{
              marginHorizontal: 16,
              marginVertical: 8,
              fontSize: 16,
              fontWeight: "500",
            }}
          >
            {i18n.t("home.frequent_activity")}
          </Text>
        )}
        <FlatList
          horizontal
          data={listService}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          extraData={listService}
          keyExtractor={(iten, index) => index.toString()}
          renderItem={({ item, index }) => {
            return (
              <TouchableOpacity
                onPress={() => 
                  NavigationRoot.push(Constants.SCREENS.SERVICE.SERVICE, {
                    data: item,
                    fromThread: 'favorite-service-thread'
                  })
                }
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  marginRight: 8,
                  borderWidth: 0.5,
                  opacity: 0.5,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text>
                  {item.serviceName} {item.hour}hrs
                </Text>
              </TouchableOpacity>
            );
          }}
        />
        <Text
          style={{
            marginHorizontal: 16,
            marginVertical: 8,
            fontSize: 16,
            fontWeight: "500",
          }}
        >
          {i18n.t("home.services")}
        </Text>
      </View>
    );
  };

  const renderItemPromotion = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    if (isNil(item.image)) {
      return null;
    }
    return (
      <TouchableOpacity
        style={{
          flex: 1,
          marginVertical: 8,
        }}
        onPress={() =>
          props.navigation.navigate(Constants.SCREENS.PROMOTIOM.DETAIL, {
            data: item,
          })
        }
      >
        <View
          style={{
            shadowColor: Colors.shadow,
            shadowOffset: { height: 0, width: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 2,
            elevation: 3,
          }}
        >
          <ExpoImage
            style={{
              width: (width - 36) / 2,
              height: (width - 36) / 2,
              borderRadius: 10,
            }}
            source={{ uri: item.image[0] }}
          />
        </View>
        <Text
          numberOfLines={2}
          style={{
            textAlign: "left",
            marginVertical: 6,
            paddingHorizontal: 3,
            flex: 1,
          }}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItemSubBanner = ({ item, index }: any) => {
    return (
      <TouchableOpacity
        onPress={() =>
          NavigationRoot.push(Constants.SCREENS.OTHER.ADDRESS_FIX_PLAN, {
            serviceId: item.id,
            serviceItemId: item.serviceItemId,
            serviceName: item.serviceName,
            serviceType: item.serviceType,
          })
        }
        key={index.toString()}
      >
        <ExpoImage
          contentFit="contain"
          style={{
            aspectRatio: 16 / 9,
            marginHorizontal: 12,
            borderRadius: 8,
          }}
          source={{ uri: item.listImage[0].image }}
        />
      </TouchableOpacity>
    );
  };

  const renderHeaderPromotion = () => {
    const items = carouselItems.filter((i: any) => i.type === 2);
    if (isEmpty(items)) return null;
    return (
      <View style={{ alignSelf: "center", maxHeight: (width - 24) / 1.5 }}>
        <Swiper
          showsButtons={false}
          showsPagination={false}
          autoplay
          autoplayTimeout={4}
          loop
          removeClippedSubviews={false}
        >
          {items.map((item, index) => renderItemSubBanner({ item, index }))}
        </Swiper>
      </View>
    );
  };

  const renderFooter = () => {
    return (
      <View>
        <View style={{ paddingBottom: 8 }}>
          {renderHeaderPromotion()}
          <Text
            style={{
              marginBottom: 12,
              paddingHorizontal: 16,
              fontSize: 16,
              fontWeight: "500",
              textTransform: "capitalize",
            }}
          >
            {i18n.t("home.updates_promotions")}
          </Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <FlatList
              // ListHeaderComponent={}
              data={arrUpdate}
              renderItem={renderItemPromotion}
              numColumns={2}
              keyExtractor={(item, index) => index.toString()}
              extraData={arrUpdate}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <Container style={styles.container}>
      <Loading
        loading={
          loadingBanner ||
          loadingPromotion ||
          loadingServiceManagement ||
          loadingUserMe ||
          loadingCurrentPlan ||
          loadingLanguage
        }
      />
      <View style={{ flex: 1 }}>
        {sortArrayService.length > 0 && (
          <FlatList
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={onRefreshHome} />
            }
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderHeader}
            data={totalService}
            extraData={totalService}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItemService}
            ListFooterComponent={renderFooter}
            numColumns={4}
            contentContainerStyle={
              totalService.length === 0 && {
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
          />
        )}
      </View>
      <ModalVersion
        onPress={onPressUpdate}
        visible={modalVisible}
        version={version}
      />
    </Container>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
    shadowColor: Theme.shadow.float.shadowColor,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  button: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: Theme.colors.accent,
  },
  buttonClose: {
    backgroundColor: Colors.main_color,
  },
  textStyle: {
    color: Theme.colors.accentContrast,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
});
