import React, { useEffect, useState } from "react";
import { View, Alert, StyleSheet, Image } from "react-native";
import { Button, Container, Loading, Text } from "../../components";
import useApi from "../../hooks/useApi";
import Colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import Enum from "../../shared/Enum";
import { Ionicons } from "@expo/vector-icons";
import { AirbnbRating } from "react-native-elements";
import moment from "moment";
import _ from "lodash";
import { NavigationRoot } from "../../navigation/root";
import { getStatus } from "../../shared/Utils";
import { ScrollView } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";

export default function PromotionDetail(props: any) {
  const params = props.route.params;
  const navigation = useNavigation();
  const [currentDetail, setCurrentDetail] = useState<any>({});
  const [rating, setRating] = useState(0);
  const [subscriptionPlanActive, setSubscriptionPlanActive] = useState<any>({});
  const [loadingBookingDetail, requestBookingDetail] = useApi({
    method: "get",
    url: Constants.API.booking_detail,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        setCurrentDetail(response);
      }
    },
  });

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
      requestBookingDetail({
        params: {
          orderId: params?.item.orderId,
        },
      });
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
      if (response.items && response.items.length) {
        let getSubscriptionPlanActive = response.items.find(
          (x) => x.subscriptionStatus === Enum.SubscriptionStatus.ACTIVE
        );
        setSubscriptionPlanActive(getSubscriptionPlanActive);
      }
    },
  });

  const onPressReview = () => {
    requestReview({
      data: {
        id: params.item.orderId,
        review: rating,
      },
    });
  };
  const redirectReOrder = () => {
    let data = {
      orderDetailId: currentDetail.orderDetailId,
      orderId: currentDetail.orderId,
      serviceId: currentDetail.serviceId,
      serviceItemId: currentDetail.serviceItemId,
      serviceName: currentDetail.serviceName,
      serviceType: currentDetail.serviceType,
      customerInfo: currentDetail.customerInfo,
      bookingDetail: currentDetail.bookingDetail,
      currentDetail: currentDetail,
    };

    NavigationRoot.push(
      Constants.SCREENS.SERVICE.EDITANDREORDERANDEDITSERVICE,
      {
        data: data,
        isEdit: false,
        subscriptionPlanActive,
        hour: moment
          .duration(
            moment(currentDetail.bookingDetail.bookingHour).diff(
              currentDetail.bookingDetail.bookingDate
            )
          )
          .asHours(),
      }
    );
  };

  useEffect(() => {
    requestCurrentPlan();
    requestBookingDetail({
      params: {
        orderId: params?.item?.orderId,
      },
    });
  }, []);

  return (
    <Container>
      <View style={{ flex: 1 }}>
        <ScrollView>
          <Loading loading={loadingBookingDetail || loadingCurrentPlan} />
          <View
            style={[
              s.borderBottom,
              { flexDirection: "row", justifyContent: "space-between" },
            ]}
          >
            <Text style={s.textTitle}>{i18n.t("home.detail_history")}</Text>
            {(currentDetail.orderStatus == 2 ||
              currentDetail.orderStatus == 3) && (
              <Text onPress={() => redirectReOrder()} style={s.borderReOrder}>
                {i18n.t("home.re_order")}
              </Text>
            )}
          </View>
          <View
            style={{
              margin: 16,
              marginTop: 0,
              padding: 14,
              backgroundColor: Colors.white,
              shadowColor: Colors.black,
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
                  fontWeight: "700",
                }}
              >
                {params?.item.serviceName}
              </Text>
              <Text
                style={currentDetail.orderStatus &&{
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

            <View style={{ marginTop: 10 }}>
              <Text>{i18n.t("home.payment")}</Text>
              <Text style={{ color: Colors.gray_normal_text }}>
                {
                  Object.keys(Enum.PaymentStatusDetail)[
                    currentDetail.paymentStatus
                  ]
                }
              </Text>
            </View>
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
                    {currentDetail.pointRecived || 0}{" "}
                    {i18n.t("home.reward_point")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {currentDetail.serviceProvider &&
          currentDetail.serviceProvider.fullName ? (
            <View style={s.borderHelper}>
              <Text style={[{ paddingBottom: 10 }, s.textWeight]}>
                {i18n.t("home.your_helper")}
              </Text>
              <View
                style={{ flexDirection: "row", justifyContent: "space-around" }}
              >
                <Image
                  source={
                    currentDetail.serviceProvider.avatar
                      ? { uri: currentDetail.serviceProvider.avatar }
                      : require("../../assets/images/icon.png")
                  }
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
                <View style={{ flexDirection: "column" }}>
                  <AirbnbRating
                    isDisabled
                    defaultRating={currentDetail.serviceProvider.star}
                    count={5}
                    showRating={false}
                    size={20}
                  />
                  <Text style={{ fontWeight: "bold" }}>
                    {currentDetail.serviceProvider.fullName}
                  </Text>
                  <Text style={{ fontWeight: "bold" }}>
                    {currentDetail.serviceProvider.old}{" "}
                    {i18n.t("home.year_old")}
                  </Text>
                  <Text style={{ fontWeight: "bold" }}>
                    {
                      JSON.parse(currentDetail.serviceProvider.serviceType)
                        .length
                    }{" "}
                    {i18n.t("home.services")}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
          {currentDetail.orderStatus == Enum.OrderStatus.COMPLETED ? (
            <View
              style={[
                s.borderHelper,
                { flexDirection: "row", justifyContent: "space-between" },
              ]}
            >
              <View
                style={{
                  marginBottom: 16,
                }}
              >
                <Text>{i18n.t("home.review")}</Text>
                <AirbnbRating
                  // isDisabled={currentDetail.review}
                  defaultRating={currentDetail.review || 0}
                  count={5}
                  showRating={false}
                  size={20}
                  onFinishRating={setRating}
                />
              </View>
              <Button
                title={i18n.t("home.review")}
                viewStyle={s.buttonView}
                style={s.buttonReview}
                onPress={onPressReview}
              />
            </View>
          ) : null}
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
    marginTop: 5,
  },
  textTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  buttonReview: {
    width: 100,
  },
  buttonView: {
    backgroundColor: Colors.green,
  },
  border: {
    borderWidth: 1,
    borderColor: Colors.gray_hidden_text,
    borderRadius: 15,
    flex: 5,
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    padding: 10,
  },
  borderBottom: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  textWeight: {
    fontWeight: "bold",
  },
  borderReOrder: {
    borderColor: Colors.main_color,
    borderWidth: 1,
    color: Colors.main_color,
    paddingHorizontal: 10,
    paddingTop: 6,
    marginTop: 12,
    height: 35,
  },
  jobItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  jobItemMetaSp: {
    color: Colors.gray_normal_text,
  },
  borderHelper: {
    margin: 16,
    marginTop: 0,
    padding: 14,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    borderRadius: 4,
    elevation: 3,
  },
});
