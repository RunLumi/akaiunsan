import { Ionicons } from "@expo/vector-icons";
import _, { isEmpty } from "lodash";
import React, { useEffect, useState } from "react";
import { View, Image, Alert, ActivityIndicator } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { Container, Button, Loading, Text, TextInput } from "../../components";
import Colors from "../../shared/Colors";
import Theme from "../../shared/theme";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import Enum from "../../shared/Enum";
import dayjs from "../../shared/dayjs";
import { Linking } from "react-native";
import { getStatus } from "../../shared/Utils";
import { Picker } from "@react-native-picker/picker";
import { useDispatch } from "react-redux";
import { TYPES } from "../../redux/actions";
import { apiSlice, portRequest, type ApiResult } from "../../redux/apiSlice";
import type { ApiItem } from "../../redux/apiSlice";
import type { ScreenProps } from "../../navigation/routes";

export default function BookingDetail(props: ScreenProps) {
  const params = props.route.params;
  const [showReason, setShowReason] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [reasonCancel, setReasonCancel] = useState<ApiItem>({
    label: "Location",
    value: 1,
  });
  const [currentDetail, setCurrentDetail] = useState<ApiItem>({});

  const dispatch = useDispatch();
  const [requestCancelTrigger, { isLoading: loadingRequestCancel }] =
    apiSlice.endpoints.cancelOrder.useMutation();
  const requestCancel = portRequest(
    requestCancelTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }

      Alert.alert(i18n.t("Booking"), i18n.t("home.booking_cancel"));
      setShowDialog(false);
      requestBookingDetail({
        params: {
          orderId: params?.item?.orderId,
          // notificationId:  params?.item?.notificationId || null
        },
      });
    }
  );

  const [requestSpecialTrigger, { isLoading: loadingRequestSpecial }] =
    apiSlice.endpoints.specialRequest.useMutation();
  const requestSpecial = portRequest(
    requestSpecialTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }

      Alert.alert(i18n.t("home.special_request"), i18n.t("home.success")!);
      setShowDialog(false);
      requestBookingDetail({
        params: {
          orderId: params?.item?.orderId,
          // notificationId:  params?.item?.notificationId || null
        },
      });
    }
  );

  const [requestBookingDetailTrigger, { isLoading: loadingBookingDetail }] =
    apiSlice.endpoints.bookingDetail.useLazyQuery();
  const requestBookingDetail = portRequest(
    requestBookingDetailTrigger,
    ({ error, response }: ApiResult) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        setCurrentDetail(response);
      }
    }
  );

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
      default:
        return "Other";
    }
  };
  const onPressCancel = () => {
    setShowReason(false);
    requestCancel({
      data: { id: params.item.orderId, reason: reasonCancel.value },
    });
    requestBookingDetail({
      params: {
        orderId: params?.item?.orderId,
        // notificationId:  params?.item?.notificationId || null
      },
    });
  };

  const onPressSpecialRequest = () => {
    if (isEmpty(reason)) {
      Alert.alert(i18n.t("auth.validate"));
      return;
    }
    requestSpecial({
      data: { orderDetailsId: currentDetail.orderDetailId, content: reason },
    });
  };


  const redirectEdit = () => {
    const data = {
      orderDetailId: currentDetail.orderDetailId,
      orderId: currentDetail.orderId,
      serviceId: currentDetail.serviceId,
      serviceItemId: currentDetail.serviceItemId,
      serviceName: currentDetail.serviceName,
      serviceType: currentDetail.serviceType,
      customerInfo: currentDetail.customerInfo,
      bookingDetail: currentDetail.bookingDetail,
      currentDetail,
    }
    props.navigation.replace(
      Constants.SCREENS.SERVICE.EDITANDREORDERANDEDITSERVICE,
      { data: data, hour: params.item.hour, isEdit: true }
    );
  };

  useEffect(() => {
    if (params?.item?.orderId) {
      requestBookingDetail({
        params: {
          orderId: params?.item?.orderId,
          notificationId:  params?.item?.notificationId
        },
      });
    }
  }, [params?.item?.orderId]);

  const enumReason = [
    { label: "Location", value: 1 },
    { label: "No-answer", value: 2 },
    { label: "Schedule", value: 3 },
    { label: "Supply", value: 4 },
    { label: "Other", value: 5 },
  ];
  const onPressChooseReason = () => {
    dispatch({
      type: TYPES.TOOLS.OPEN_PICKER,
      payload: {
        data: enumReason,
        selected: reasonCancel.value,
        callback: (selected: number) => {
          const newReason = () =>
            enumReason.reduce((pre, cur) => {
              if (cur?.value === selected) {
                return cur;
              } else return pre;
            }, {});
          setReasonCancel(newReason);
        },
      },
    });
  };
  if (isEmpty(currentDetail)) {
    return (
      <ActivityIndicator
        style={{ flex: 1, alignSelf: "center" }}
        color={Colors.grab_orange}
      />
    );
  }
  return (
    <Container>
      <Loading loading={loadingBookingDetail} />
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
                backgroundColor: Colors.white,
                borderRadius: 4,
                padding: 16,
              }}
            >
              <View
                style={
                  currentDetail.orderStatus !== Enum.OrderStatus.MATCH && {
                    flexDirection: "row",
                  }
                }
              >
                <Text>
                  {currentDetail.orderStatus == Enum.OrderStatus.MATCH
                    ? `${i18n.t("home.special_request")}`
                    : `${i18n.t("home.reason")}`}
                </Text>
                {currentDetail.orderStatus == Enum.OrderStatus.MATCH ? (
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
                ) : (
                  <View
                    style={{
                      width: "50%",
                      marginHorizontal: 16,
                      marginBottom: 16,
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderWidth: 0.5,
                        borderRadius: 4,
                      }}
                      onPress={onPressChooseReason}
                    >
                      <Text> {reasonCancel.label}</Text>
                      <Ionicons name="caret-down" size={18} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={{ alignItems: "center" }}>
                <TouchableOpacity
                  onPress={
                    currentDetail.orderStatus == Enum.OrderStatus.MATCH
                      ? onPressSpecialRequest
                      : onPressCancel
                  }
                  style={{
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    backgroundColor: Colors.main_color,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: Colors.white }}>{i18n.t("home.yes")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowDialog(false);
                  }}
                  style={{
                    marginTop: 4,
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    backgroundColor: Colors.main_color,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: Colors.white }}>{i18n.t("home.no")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
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
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              {i18n.t("home.booking_detail")}
            </Text>
            {currentDetail.orderStatus == Enum.OrderStatus.PENDING ? (
              <TouchableOpacity
                accessibilityLabel="booking-edit-button"
                onPress={() => redirectEdit()}
              >
                <Ionicons name="create-outline" size={18} />
              </TouchableOpacity>
            ) : null}
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
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  {currentDetail.serviceName} ({currentDetail.orderCode})
                  {currentDetail.fexiblePlanId
                    ? ` (${i18n.t("home.fexible_plan")})`
                    : currentDetail.fixPlanId
                    ? ` (${i18n.t("home.fix_plan")})`
                    : ""}
                </Text>
              </View>
              <Text
                style={{
                  color: `${
                    Object.keys(Enum.OrderStatusDetailColor)[
                      currentDetail.orderStatus || 0
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
                  dayjs(currentDetail.bookingDetail.bookingDate)
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
            {currentDetail.serviceType === Enum.SERVICE_TYPE.PetcareService && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ marginBottom: 4 }}>
                  {i18n.t("home.pet_profile")}
                </Text>
                {currentDetail.bookingDetail?.petProfiles?.map(
                  (item: ApiItem, index: number) => (
                    <View key={index} style={{ flexDirection: "row" }}>
                      <Text
                        style={{
                          marginVertical: 2,
                          color: Colors.gray_normal_text,
                          paddingRight: 5,
                        }}
                      >
                        - {i18n.t("home.name")}: {item.name ? item.name : ""}
                      </Text>
                      <Text
                        style={{
                          marginVertical: 2,
                          color: Colors.gray_normal_text,
                        }}
                      >
                        - {i18n.t("home.type")}: {item.type ? item.type : ""}
                      </Text>
                    </View>
                  )
                )}
                <Text style={{ marginTop: 10 }}>
                  {i18n.t("home.activities")}
                </Text>
                <Text
                  style={{
                    color: Colors.gray_normal_text,
                  }}
                >
                  {currentDetail.bookingDetail &&
                    currentDetail.bookingDetail?.activity}
                </Text>
              </View>
            )}

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
              <Text>{currentDetail.pointPercent || 0}</Text>
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
            {/* <View style={{ marginTop: 10 }}>
              <Text>{i18n.t("home.payment")}</Text>
              <Text style={{ color: Colors.gray_normal_text }}>
                {
                  Object.keys(Enum.PaymentStatusDetail)[
                    currentDetail.paymentStatus
                  ]
                }
              </Text>
            </View> */}
            {currentDetail.orderStatus == Enum.OrderStatus.COMPLETED ? (
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
              <Text style={{ fontSize: 16, fontWeight: "700" }}>
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
                    currentDetail.serviceProvider &&
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
                    ).map((i, idx) => (
                      <Ionicons
                        key={idx}
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
                    {i18n.t("home.year_old")}
                  </Text>
                  <View style={{ marginBottom: 12, flexDirection: "row" }}>
                    <Ionicons name="checkmark" size={18} />
                    <Text
                      adjustsFontSizeToFit
                      style={{ fontWeight: "600", width: 150 }}
                    >
                      {currentDetail.serviceProvider
                        ? JSON.parse(
                            currentDetail.serviceProvider.skillLanguage
                          ).length > 0
                          ? JSON.parse(
                              currentDetail.serviceProvider.skillLanguage
                            ).map((item: ApiItem) => {
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
          {currentDetail.orderStatus == Enum.OrderStatus.CANCEL ? (
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
              <Text style={{ fontSize: 14, fontWeight: "700" }}>
                {i18n.t("home.reason_canceled")}:
              </Text>
              <View
                style={{
                  marginTop: 5,
                  flexDirection: "row",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: Colors.gray_normal_text,
                  }}
                >
                  {getReason(currentDetail.reason)}
                </Text>
              </View>
            </View>
          ) : null}
          <View style={{ paddingHorizontal: 16 }}>
            {currentDetail.orderStatus == Enum.OrderStatus.PENDING &&
            currentDetail.reason == null ? (
              <View style={{ flex: 1 }}>
                <Button
                  colorBackground={Colors.gray_light}
                  onPress={() => {
                    setShowDialog(true);
                  }}
                >
                  <Text>{i18n.t("home.cancel")}</Text>
                </Button>
              </View>
            ) : null}
            {currentDetail.orderStatus == Enum.OrderStatus.MATCH &&
            currentDetail.specialRequests == null ? (
              <Button onPress={() => setShowDialog(true)}>
                <Text style={{ color: Colors.white }}>
                  {i18n.t("home.special_request")}
                </Text>
              </Button>
            ) : null}
            {currentDetail.serviceProvider ? (
              <Button
                onPress={() => {
                  Linking.openURL(
                    `tel:${currentDetail?.serviceProvider?.phoneNumber}`
                  );
                }}
              >
                <Text style={{ color: Colors.white }}>
                  {i18n.t("home.contact_staff")}
                </Text>
              </Button>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
