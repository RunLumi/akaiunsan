import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Alert,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Container, Text, Loading, Button } from "../../components";
import colors from "../../shared/Colors";
import Theme from "../../shared/theme";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import { Ionicons } from "@expo/vector-icons";
import _ from "lodash";
import dayjs from "../../shared/dayjs";
import { getSpecialRequest, getStatus } from "../../shared/Utils";
import Enum from "../../shared/Enum";
import { apiSlice, portRequest, type ApiResult } from "../../redux/apiSlice";
import type { ApiItem } from "../../redux/apiSlice";
import type { ScreenProps } from "../../navigation/routes";

export default function InboxDetail(props: ScreenProps) {
  const [title, setTitle] = useState<ApiItem>();
  const [content, setContent] = useState();

  const [order, setOrder] = useState<ApiItem>();

  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState<String>();

  const [requestDetailOrderTrigger, { isLoading: loadingDetailOrder }] =
    apiSlice.endpoints.detailBooking.useLazyQuery();
  const requestDetailOrder = portRequest(
    requestDetailOrderTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        setOrder(response);
      }
    }
  );

  const [requestInboxDetailTrigger, { isLoading: loadingInboxDetail }] =
    apiSlice.endpoints.getNotificationDetail.useLazyQuery();
  const requestInboxDetail = portRequest(
    requestInboxDetailTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        setContent(response.content);
        setTitle(response.title);
        if (response.type === Enum.InboxType.NEWS) {
          props.navigation.replace(Constants.SCREENS.PROMOTIOM.DETAIL, {
            data: { newsId: JSON.parse(response.data).NotificationId },
          });
        } else if (response.type === Enum.InboxType.PROMOTION) {
          props.navigation.replace(Constants.SCREENS.PROMOTIOM.DETAIL, {
            data: { promotionId: JSON.parse(response.data).PromotionId },
          });
        }
        if (response.data) {
          let data = JSON.parse(response?.data);
          if (data?.OrderId) {
            requestDetailOrder({
              params: {
                orderId: data?.OrderId,
              },
            });
          }
        }
      }
    }
  );
  const [requestCancelTrigger, { isLoading: loadingRequestCancel }] =
    apiSlice.endpoints.cancelOrder.useMutation();
  const requestCancel = portRequest(
    requestCancelTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      requestInboxDetail({
        params: {
          notificationId: props.route.params.id,
        },
      });

      setShowDialog(false);
      Alert.alert("Booking", "Booking cancelled!");
    }
  );

  useEffect(() => {
    requestInboxDetail({
      params: {
        notificationId: props.route.params.id,
      },
    });
  }, [props.route.params.id]);

  const onPressPetcareConfirm = () => {
    props.navigation.push(Constants.SCREENS.OTHER.PAYMENT_PETCARE, { order });
  };
  const getReason = (type: number) => {
    switch (type) {
      case 1:
        return "Location";
      case 2:
        return "No-answer";
      case 3:
        return "Schedule";
      case 4:
        return "Supply";
      case 5:
        return "Other";
      default:
        return false;
    }
  };

  const renderUIOrder = () => (
    <View>
      {order!.bookingDetail.extraServices && (
        <View style={{ marginVertical: 16 }}>
          <Text style={{ marginBottom: 6, color: colors.gray_normal_text }}>
            Service option:
          </Text>
          {order!.bookingDetail.extraServices.map((item: ApiItem, index: number) =>
            item.name != null ? (
              <Text
                key={index}
                style={{ marginBottom: 2, color: colors.gray_normal_text }}
              >
                - {item.name}
              </Text>
            ) : (
              <Text
                key={index}
                style={{ marginBottom: 2, color: colors.gray_normal_text }}
              >
                - {item.acType} {item.btu}
              </Text>
            )
          )}
        </View>
      )}
      {order!.serviceProvider && (
        <View style={{ marginVertical: 16 }}>
          <Text style={{ fontSize: 16, color: colors.gray_normal_text }}>
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
                order!.serviceProvider.avatar
                  ? { uri: order!.serviceProvider.avatar }
                  : require("../../assets/images/MaidService.jpg")
              }
            />
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                {_.times(5).map((i, index) => (
                  <Ionicons
                    key={index}
                    name={
                      order!.serviceProvider.star > i ? "star" : "star-outline"
                    }
                    color={colors.main_orange}
                    size={18}
                    style={{ marginLeft: 2 }}
                  />
                ))}
              </View>
              <Text style={{ marginBottom: 6, fontWeight: "600" }}>
                {order!.serviceProvider.fullName}
              </Text>
              <Text style={{ marginBottom: 6, fontWeight: "600" }}>
                {order!.serviceProvider.old} {i18n.t("home.year_old")}
              </Text>
              {order!.serviceProvider.skillLanguage && (
                <View style={{ marginBottom: 12, flexDirection: "row" }}>
                  <Ionicons name="checkmark" size={18} />
                  {/* <Text style={{ fontWeight: "600" }}>English</Text> */}
                  <Text style={{ fontWeight: "600" }}>
                    {JSON.parse(order!.serviceProvider.skillLanguage).join(", ")}
                  </Text>
                </View>
              )}
              <Text style={{ color: colors.main_color }}>
                {order!.serviceProvider.experiences}{" "}
                {i18n.t("home.services_done")}
              </Text>
            </View>
          </View>
        </View>
      )}
      <Text
        style={{
          color: colors.gray_normal_text,
          fontSize: 16,
          marginBottom: 16,
        }}
      >
        {i18n.t("home.status")}: {getStatus(order!.orderStatus, order)}
      </Text>
      {order!.specialRequests && (
        <View>
          <Text
            style={{
              color: colors.gray_normal_text,
              fontSize: 16,
              marginBottom: 16,
            }}
          >
            {i18n.t("home.special_request")}:{" "}
            {getSpecialRequest(order!.specialRequests.status)}
          </Text>
          <Text
            style={{
              color: colors.gray_normal_text,
              fontSize: 16,
            }}
          >
            {order!.specialRequests.content}
          </Text>
        </View>
      )}
      {getReason(order!.reason) && (
        <View>
          <Text
            style={{
              color: colors.gray_normal_text,
              fontSize: 16,
              marginBottom: 16,
            }}
          >
            Reason:
          </Text>
          <Text
            style={{
              color: colors.gray_normal_text,
              fontSize: 16,
              marginBottom: 16,
            }}
          >
            {getReason(order!.reason)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderUIOrderPetcare = () => {
    return (
      <View style={{ marginTop: 16 }}>
        <Text
          style={{
            color: colors.gray_normal_text,
            fontSize: 16,
            marginBottom: 10,
          }}
        >
          Pet profile:
        </Text>
        {order!.bookingDetail.petProfiles &&
          order!.bookingDetail.petProfiles.map((item: ApiItem, index: number) => (
            <Text
              key={index}
              style={{
                color: colors.gray_normal_text,
                fontSize: 16,
                marginBottom: 4,
              }}
            >
              {item.name}
            </Text>
          ))}
        {order!.serviceProvider && (
          <View style={{ marginVertical: 16 }}>
            <Text style={{ fontSize: 16, color: colors.gray_normal_text }}>
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
                  order!.serviceProvider.avatar
                    ? { uri: order!.serviceProvider.avatar }
                    : require("../../assets/images/MaidService.jpg")
                }
              />
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <View style={{ flexDirection: "row", marginBottom: 8 }}>
                  {_.times(5).map((i, index) => (
                    <Ionicons
                      key={index}
                      name={
                        order!.serviceProvider.star > i ? "star" : "star-outline"
                      }
                      color={colors.main_orange}
                      size={18}
                      style={{ marginLeft: 2 }}
                    />
                  ))}
                </View>
                <Text style={{ marginBottom: 6, fontWeight: "600" }}>
                  {order!.serviceProvider.fullName}
                </Text>
                <Text style={{ marginBottom: 6, fontWeight: "600" }}>
                  {order!.serviceProvider.old} {i18n.t("home.year_old")}
                </Text>
                {order!.serviceProvider.skillLanguage && (
                  <View style={{ marginBottom: 12, flexDirection: "row" }}>
                    <Ionicons name="checkmark" size={18} />
                    {/* <Text style={{ fontWeight: "600" }}>English</Text> */}
                    <Text style={{ fontWeight: "600" }}>
                      {JSON.parse(order!.serviceProvider.skillLanguage).join(
                        ", "
                      )}
                    </Text>
                  </View>
                )}
                <Text style={{ color: colors.main_color }}>
                  {order!.serviceProvider.experiences}{" "}
                  {i18n.t("home.services_done")}
                </Text>
              </View>
            </View>
          </View>
        )}
        <Text
          style={{
            color: colors.gray_normal_text,
            fontSize: 16,
            marginBottom: 16,
          }}
        >
          Status: {getStatus(order!.orderStatus)}
        </Text>
        {order!.orderStatus == 5 && (
          <View>
            <Button onPress={onPressPetcareConfirm}>
              <Text>Confirm</Text>
            </Button>
            <Button
              colorBackground={Theme.core.stoneDark}
              onPress={() => setShowDialog(true)}
            >
              <Text>Cancel</Text>
            </Button>
          </View>
        )}

        {getReason(order!.reason) && (
          <View>
            <Text
              style={{
                color: colors.gray_normal_text,
                fontSize: 16,
                marginBottom: 12,
              }}
            >
              Reason:
            </Text>
            <Text
              style={{
                color: colors.gray_normal_text,
                fontSize: 16,
              }}
            >
              {getReason(order!.reason)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderDetailOrder = () => {
    if (_.isUndefined(order)) {
      return;
    }
    switch (order.serviceType) {
      case 5:
        return renderUIOrderPetcare();
      default:
        return renderUIOrder();
    }
  };

  return (
    <Container style={styles.container}>
      <Loading loading={loadingInboxDetail || loadingDetailOrder} />
      {showDialog && (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: `${Theme.core.mossBlack}66`,
            zIndex: 99,
          }}
        >
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: "80%",
                backgroundColor: colors.white,
                borderRadius: 4,
                padding: 16,
              }}
            >
              <Text>Reason:</Text>
              <TextInput
                style={{
                  padding: 10,
                  marginVertical: 16,
                  borderColor: Theme.core.line,
                  borderWidth: 1,
                  minHeight: 100,
                }}
                multiline={true}
                onChangeText={setReason}
              />
              <View style={{ alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() =>
                    requestCancel({
                      data: { id: order!.orderDetailId, reason },
                    })
                  }
                  style={{
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    backgroundColor: colors.main_color,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: colors.white }}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowDialog(false)}
                  style={{
                    marginTop: 4,
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    backgroundColor: colors.main_color,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: colors.white }}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
      {!loadingInboxDetail && order != null ? (
        <View style={{ padding: 16 }}>
          <Text
            style={{
              marginBottom: 16,
              fontSize: 20,
              textDecorationLine: "underline",
            }}
          >
            {String(title ?? "")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons
              name="calendar"
              size={18}
              color={colors.gray_normal_text}
            />
            <Text
              style={{
                marginLeft: 16,
                color: colors.gray_normal_text,
                fontSize: 14,
              }}
            >
              Time start:{" "}
              {dayjs(order.bookingDetail.bookingDate).format(
                "DD/MM/YYYY[,] H:mm a[,] "
              )}
              {dayjs(order.bookingDetail.bookingHour).diff(
                dayjs(order.bookingDetail.bookingDate),
                "hours"
              ) + "hrs"}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Ionicons
              name="location"
              size={18}
              color={colors.gray_normal_text}
            />
            <Text
              style={{
                marginLeft: 16,
                color: colors.gray_normal_text,
                fontSize: 14,
              }}
            >
              {order.customerInfo.address}
            </Text>
          </View>
          {renderDetailOrder()}
        </View>
      ) : (
        <View style={{ marginVertical: 10, marginHorizontal: 10 }}>
          <Text>{String(title ?? "")}</Text>
          <Text>{String(content ?? "")}</Text>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginVertical: 10,
  },
  textRef: {
    fontSize: 18,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  borderBottom1: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray_hidden_text,
  },
  borderBottom2: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray_hidden_text,
  },
});
