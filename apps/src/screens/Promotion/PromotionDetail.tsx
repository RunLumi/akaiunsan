import React, { useEffect, useState } from "react";
import {
  Dimensions,
  View,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import RenderHtml from "react-native-render-html";
import { AutoPager, Container, Loading, Text } from "../../components";
import Colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import Enum from "../../shared/Enum";
import Layout from "../../shared/Layout";
import dayjs from "../../shared/dayjs";
import WebView from "react-native-webview";
import { isArray, isEmpty } from "lodash";
import { Image as ExpoImage } from "expo-image";
import { apiSlice, portRequest, type ApiResult } from "../../redux/apiSlice";
import type { ApiItem } from "../../redux/apiSlice";
import type { ScreenProps } from "../../navigation/routes";
const { width } = Dimensions.get("screen");

export default function PromotionDetail(props: ScreenProps) {
  const params = props.route.params || {};
  const [dataDetail, setDataDetail] = useState<ApiItem>({});
  const [content, setContent] = useState<ApiItem>([]);
  const [isPromotion, setIsPromotion] = useState(false);
  const [isNotification, setIsNotification] = useState(false);
  const [imageBanner, setImageBanner] = useState<ApiItem[]>([]);
  const [typePromotion, setTypePromotion] = useState(0);
  const [requestPromotionDetailTrigger, { isLoading: loadingPromotionDetail }] =
    apiSlice.endpoints.promotionDetail.useLazyQuery();
  const requestPromotionDetail = portRequest(
    requestPromotionDetailTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      } else {
        switch (response.promotionType) {
          case 1:
            setContent(JSON.parse(response.content));
            setTypePromotion(1);
            break;
          case 2:
            setContent(JSON.parse(response.content));
            setTypePromotion(2);
            break;
          case 3:
            setContent(JSON.parse(response.content));
            setTypePromotion(3);
            break;
          default:
            setContent(JSON.parse(response.content).extraServices);
            setTypePromotion(4);
            break;
        }

        setImageBanner(response.banners);
        setDataDetail(response);
      }
    }
  );
  const [requestNotificationDetailTrigger, { isLoading: loadingNotificationDetail }] =
    apiSlice.endpoints.getNotificationDetail.useLazyQuery();
  const requestNotificationDetail = portRequest(
    requestNotificationDetailTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      } else {
        setImageBanner(JSON.parse(response.banners));
        setDataDetail(response);
      }
    }
  );
  const [requestNotificationDetailCheckReadTrigger, { isLoading: loadingNotificationDetailCheckRead }] =
    apiSlice.endpoints.getNotificationDetail.useLazyQuery();
  const requestNotificationDetailCheckRead = portRequest(
    requestNotificationDetailCheckReadTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      } else {
      }
    }
  );

  // const onPressBookingDetail = (item: ApiItem) => {
  //   props.navigation.navigate(Constants.SCREENS.MYBOOKING.DETAIL_MYBOOKING, {
  //     item,
  //   });
  // };

  const renderItem = ({ item, index }: { item: ApiItem; index: number }) => {
    return (
      <View key={index}>
        <ExpoImage
          contentFit="contain"
          style={{ width: width, height: width }}
          source={{ uri: String(item ?? "") }}
        />
      </View>
    );
  };

  useEffect(() => {
    if (params.data?.promotionId) {
      setIsPromotion(true);
      setIsNotification(false);
      if (params.data && params.data.id) {
        requestNotificationDetailCheckRead({
          params: {
            notificationId: params.data.id,
          },
        });
      }

      requestPromotionDetail({
        params: {
          id: params.data?.promotionId,
        },
      });
    } else if (!params.data?.promotionId && params.data?.newsId) {
      setIsPromotion(false);
      setIsNotification(true);
      requestNotificationDetail({
        params: {
          notificationId: params.data?.newsId,
        },
      });
    }
  }, []);
  const getNameService = (type: number) => {
    switch (type) {
      case 1:
        return "Maid";
      case 2:
        return "Nany";
      case 3:
        return "ElderCare";
      case 4:
        return "AC Cleaning";
      default:
        return "Petcare";
    }
  };
  const getContent = (type: number) => {
    switch (type) {
      case 1:
        return `: Discount ${content.percent}%`;
      case 2:
        return `: Discount ${content.money} THB`;
    }
  };
  return (
    <Container>
      <View style={{ flex: 1 }}>
        <Loading
          loading={
            loadingNotificationDetail ||
            loadingPromotionDetail ||
            loadingNotificationDetailCheckRead
          }
        />
        <View style={s.borderBottom}>
          {isNotification && (
            <Text style={s.textTitle}>
              {i18n.t("home.detail_notification")}
            </Text>
          )}
          {isPromotion && (
            <Text style={s.textTitle}>{i18n.t("home.detail_promotion")}</Text>
          )}
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          <View style={s.container}>
            <AutoPager
              data={imageBanner}
              renderItem={(item, index) => renderItem({ item, index })}
              style={{ height: width }}
            />
          </View>
          <View style={{ flex: 2, marginHorizontal: 12 }}>
            {isNotification && (
              <Text style={s.textWeight}>{dataDetail.title || ""}</Text>
            )}
            {isPromotion && (
              <Text style={s.textWeight}>{dataDetail.name || ""}</Text>
            )}
            {isNotification && (
              <View>
                <Text style={s.textWeight}>Content</Text>
                <View
                  style={{ width: "100%", height: Layout.window.height - 400 }}
                >
                  <WebView
                    useWebKit
                    mixedContentMode="always"
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    originWhitelist={["*"]}
                    source={{
                      html: `<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">${dataDetail.content}`,
                    }}
                    allowFileAccess
                    allowUniversalAccessFromFileURLs
                    scalesPageToFit
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}
            {isPromotion && (
              <View>
                <View style={s.wrapItem}>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: "bold" }}>
                    {i18n.t("home.benefits")}
                  </Text>
                  <View style={{ flex: 3 }}>
                    {!isEmpty(content) && typePromotion == 4 ? (
                      content.map((i: ApiItem, index: number) => (
                        <View key={index}>
                          <Text>- {getNameService(i.ServiceType)}: </Text>
                          {i?.PromotionExtraItem.map((x: ApiItem) => (
                            <Text style={{ marginLeft: 6 }}>
                              :+ Promotion discount {x.discount}% with name{" "}
                              {x.name}
                            </Text>
                          ))}
                        </View>
                      ))
                    ) : (
                      <Text>{getContent(typePromotion)}</Text>
                    )}
                  </View>
                </View>
                <View style={s.wrapItem}>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: "bold" }}>
                    {i18n.t("home.service")}
                  </Text>

                  <Text style={{ flex: 3 }}>
                    : {dataDetail.serviceName || ""}
                  </Text>
                </View>
                {dataDetail.isShowPromotionId && (
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ flex: 1, fontSize: 16, fontWeight: "bold" }}>
                      {i18n.t("home.code")}
                    </Text>

                    <Text style={{ flex: 3, fontWeight: "bold" }}>
                      : {dataDetail.promotionCode || ""}
                    </Text>
                  </View>
                )}
                <View style={s.wrapItem}>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: "bold" }}>
                    {i18n.t("home.date")}
                  </Text>
                  <View style={{ flex: 3 }}>
                    <Text>
                      : {i18n.t("home.start")}{" "}
                      {dayjs
                        .utc(dataDetail.startDate)
                        .tz("Europe/London")
                        .clone()
                        .tz("Asia/Bangkok")
                        .format("DD/MM/YYYY hh:mm A") || ""}
                    </Text>
                    <Text>
                      {"  "}
                      {i18n.t("home.end")}{" "}
                      {dayjs
                        .utc(dataDetail.endDate)
                        .tz("Europe/London")
                        .clone()
                        .tz("Asia/Bangkok")
                        .format("DD/MM/YYYY hh:mm A") || ""}
                    </Text>
                  </View>
                </View>
                {dataDetail.description && (
                  <View style={s.wrapItem}>
                    <Text style={{ flex: 1, fontSize: 16, fontWeight: "bold" }}>
                      {i18n.t("home.description")}
                    </Text>

                    <View style={{ flex: 3, marginTop: -12 }}>
                      <RenderHtml
                        contentWidth={width}
                        source={{
                          html: dataDetail.description,
                        }}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Container>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  textTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginVertical: 10,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray_hidden_text,
  },
  textWeight: {
    fontWeight: "bold",
    fontSize: 18,
    marginVertical: 4,
  },
  wrapItem: {
    marginTop: 4,
    flexDirection: "row",
  },
});
