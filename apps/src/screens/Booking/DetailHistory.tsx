import { Ionicons } from "@expo/vector-icons";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { View, Image, Alert } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { Container, Text } from "../../components";
import useApi from "../../hooks/useApi";
import Colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import moment from "moment";
import Enum from "../../shared/Enum";
import { getStatus } from "../../shared/Utils";

export default function DetailHistory(props: any) {
  const params = props.route.params;

  const [currentStar, setCurrentStar] = useState(0);
  const [currentDetail, setCurrentDetail] = useState<any>({});

  const [loadingRequestReview, requestReview] = useApi({
    method: "post",
    url: Constants.API.review_order,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }

      Alert.alert(
        i18n.t("home.review"),
        i18n.t("home.send_review_successfully")!
      );
      requestCurrentDetail({
        params: {
          orderId: params?.item.orderId,
        },
      });
    },
  });

  const [loadingRequestCurrentDetail, requestCurrentDetail] = useApi({
    method: "get",
    url: Constants.API.detail_booking,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      setCurrentDetail(response);
    },
  });

  const onPressReview = () => {
    requestReview({
      data: {
        id: params.item.orderId,
        review: currentStar,
      },
    });
  };

  useEffect(() => {
    requestCurrentDetail({
      params: {
        orderId: params?.item.orderId,
      },
    });
  }, []);

  return (
    <Container>
      <ScrollView>
        <View>
          <View
            style={{
              padding: 16,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              {i18n.t("home.detail_history")}
            </Text>
          </View>
          <View
            style={{
              margin: 16,
              marginTop: 0,
              padding: 14,
              backgroundColor: Colors.white,
              shadowColor: Colors.shadow,
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.1,
              borderRadius: 6,
            }}
          >
            <View
              style={{
                marginBottom: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {params?.item.serviceName}
              </Text>
              <Text
                style={{
                  color: `${
                    Object.keys(Enum.OrderStatusDetailColor)[
                      currentDetail.orderStatus
                    ]
                  }`,
                }}
              >
                {getStatus(currentDetail.orderStatus)}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <Ionicons
                name="calendar"
                style={{
                  marginRight: 6,
                  color: Colors.gray_normal_text,
                }}
              />
              <Text
                style={{
                  color: Colors.gray_normal_text,
                }}
              >
                {currentDetail.bookingDetail &&
                  moment(currentDetail.bookingDetail.bookingDate)
                    .local()
                    .format("lll")}{" "}
                {params?.item?.hour > 0 ? params?.item?.hour + "hrs" : ""}
                {/* {currentDetail?.bookingDetail.bookingHour} */}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Ionicons
                name="location"
                style={{
                  marginRight: 6,
                  color: Colors.gray_normal_text,
                }}
              />
              <Text
                style={{
                  color: Colors.gray_normal_text,
                }}
              >
                {currentDetail.customerInfo &&
                  currentDetail.customerInfo.address}
                ,{" "}
                {currentDetail.customerInfo &&
                  currentDetail.customerInfo.district}
                ,{" "}
                {currentDetail.customerInfo && currentDetail.customerInfo.city}
              </Text>
            </View>
            {/* <View style={{ marginTop: 10 }}>
              <Text style={{ marginBottom: 4 }}>{i18n.t("home.option")}</Text>
            
              {currentDetail.bookingDetail?.extraServices?.map(
                (item: any, index: number) => (
                  <Text
                    key={index}
                    style={{
                      marginVertical: 2,
                      color: Colors.gray_normal_text,
                    }}
                  >
                    - {item.name || item.acType}
                    {item.btu ? "_" + item.btu : ""}
                  </Text>
                )
              )}
            </View> */}
            {/* <View style={{ marginTop: 10 }}>
              <View style={{ flexDirection: "row" }}>
                <Text>{i18n.t("home.apply_point")}</Text>
                <Text
                  style={{
                    marginLeft: 4,
                    color: Colors.gray_normal_text,
                  }}
                >
                  (%)
                </Text>
              </View>
              <Text>
                {currentDetail.pointReceived > 0
                  ? (currentDetail.pointReceived / currentDetail.totalPrice) *
                    100
                  : 0}
              </Text>
            </View> */}
            {/* <View style={{ marginTop: 10 }}>
              <View style={{ flexDirection: "row" }}>
                <Text>{i18n.t("home.apply_promotion")}</Text>
                <Text
                  style={{
                    marginLeft: 4,
                    color: Colors.gray_normal_text,
                  }}
                >
                  (%)
                </Text>
              </View>
              <Text>{currentDetail.promotionPercent || 0}</Text>
            </View> */}
            <View style={{ marginTop: 10 }}>
              <Text>Payment</Text>
              <Text style={{ color: Colors.gray_normal_text }}>
                {
                  Object.keys(Enum.PaymentStatusDetail)[
                    currentDetail.paymentStatus
                  ]
                }
              </Text>
            </View>
            {currentDetail.orderStatus == Enum.OrderStatus.COMPLETED &&
            currentDetail.review > 0 ? (
              <View style={{ marginTop: 10 }}>
                <Text>{i18n.t("home.review")}</Text>
                {/* <Text style={{ color: Colors.gray_normal_text, position:"absolute", right:0 }}>{Object.keys(Enum.PaymentStatusDetail)[currentDetail.paymentStatus]}</Text> */}
                <View
                  style={{
                    flexDirection: "row",
                    marginBottom: 15,
                    position: "absolute",
                    right: 0,
                  }}
                >
                  {_.times(currentDetail.review).map((i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      color={Colors.main_orange}
                      size={12}
                      style={{ marginLeft: 2 }}
                    />
                  ))}
                </View>
              </View>
            ) : null}
            <View
              style={{
                marginTop: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text>{i18n.t("home.total")}</Text>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 26 }}>
                  THB {currentDetail.totalPrice}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 4,
                  }}
                >
                  <Text>{i18n.t("home.you_received")}</Text>
                  <Text
                    style={{
                      color: Colors.main_orange,
                      marginLeft: 4,
                    }}
                  >
                    {currentDetail.pointReceived || 0}{" "}
                    {i18n.t("home.reward_point")}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {currentDetail.orderStatus == Enum.OrderStatus.COMPLETED &&
          currentDetail.review == 0 ? (
            <View
              style={{
                margin: 16,
                marginTop: 0,
                padding: 14,
                backgroundColor: Colors.white,
                shadowColor: Colors.shadow,
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontWeight: "600", marginBottom: 16 }}>
                {i18n.t("home.review_service")}:
              </Text>
              <View style={{ flexDirection: "row" }}>
                <View style={{ flex: 1, flexDirection: "row" }}>
                  {_.times(5).map((i) => (
                    <TouchableOpacity
                      disabled={loadingRequestReview}
                      onPress={() => setCurrentStar(i + 1)}
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name={currentStar > i ? "star" : "star-outline"}
                        color={Colors.main_orange}
                        size={36}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={{
                    marginLeft: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    backgroundColor: Colors.main_color,
                    borderRadius: 3,
                  }}
                  onPress={onPressReview}
                >
                  <Text style={{ color: Colors.white }}>{i18n.t("home.review")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
          {currentDetail.serviceProvider ? (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                padding: 14,
                backgroundColor: Colors.white,
                shadowColor: Colors.shadow,
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "500" }}>
                {i18n.t("home.your_helper")}
              </Text>
              <View
                style={{
                  marginTop: 16,
                  flexDirection: "row",
                }}
              >
                <Image
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                  }}
                  source={
                    currentDetail.serviceProvider.avatar
                      ? { uri: currentDetail.serviceProvider.avatar }
                      : require("../../assets/images/icon.png")
                  }
                />
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <View style={{ flexDirection: "row", marginBottom: 16 }}>
                    {_.times(
                      currentDetail.serviceProvider
                        ? currentDetail.serviceProvider.star
                        : 0
                    ).map((i) => (
                      <Ionicons
                        name="star"
                        color={Colors.main_orange}
                        size={14}
                        style={{ marginLeft: 2 }}
                      />
                    ))}
                  </View>
                  <Text style={{ marginBottom: 6, fontWeight: "600" }}>
                    {currentDetail.serviceProvider
                      ? currentDetail.serviceProvider.fullName
                      : ""}
                  </Text>
                  <Text style={{ marginBottom: 6, fontWeight: "600" }}>
                    {currentDetail.serviceProvider
                      ? currentDetail.serviceProvider.old
                      : ""}{" "}
                    Years Old
                  </Text>
                  <View style={{ marginBottom: 12, flexDirection: "row" }}>
                    <Ionicons name="checkmark" size={18} />
                    <Text style={{ fontWeight: "600" }}>
                      {currentDetail.serviceProvider
                        ? JSON.parse(
                            currentDetail.serviceProvider.skillLanguage
                          ).length > 0
                          ? JSON.parse(
                              currentDetail.serviceProvider.skillLanguage
                            ).map((item: any) => {
                              if (
                                JSON.parse(
                                  currentDetail.serviceProvider.skillLanguage
                                )[
                                  JSON.parse(
                                    currentDetail.serviceProvider.skillLanguage
                                  ).length - 1
                                ] == item
                              ) {
                                return item;
                              }
                              return item + "-";
                            })
                          : ""
                        : ""}
                    </Text>
                  </View>
                  <Text style={{ color: Colors.main_color }}>
                    {currentDetail.serviceProvider
                      ? currentDetail.serviceProvider.experiences
                      : ""}{" "}
                    services
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Container>
  );
}
