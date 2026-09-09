import React from "react";
import { useAppSelector } from "../../../redux/hooks";
import {
  StyleSheet,
  Alert,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import colors from "../../../shared/Colors";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Button } from "react-native-elements";
import {
  CustomInput,
  Loading,
  Button as Button2,
  Text,
} from "../../../components";
import i18n from "../../../shared/I18n";
import Constants from "../../../shared/Constants";
import Enum from "../../../shared/Enum";

import {
  Table,
  TableWrapper,
  Row,
  Rows,
  Col,
} from "react-native-table-component";
import Layout from "../../../shared/Layout";
import PlanCard from "../../../components/PlanCard";
import { rankBackground } from "../../../shared/Utils";
import _ from "lodash";
import dayjs from "../../../shared/dayjs";
import { apiSlice, portRequest, type ApiResult } from "../../../redux/apiSlice";
import type { ApiItem } from "../../../redux/apiSlice";
import type { ScreenProps } from "../../../navigation/routes";

export default function Payment(props: ScreenProps) {
  const user = useAppSelector((state) => state.auth.user);

  const [tableHeadFlexible, setTableHeadFlexible] = React.useState([
    i18n.t("home.fexible_plan"),
    i18n.t("home.total_price"),
  ]);
  const [tableTitleFlexible, setTableTitleFlexible] = React.useState([
    <Text style={styles.textBold}>{i18n.t("home.total_hour")}</Text>,
    i18n.t("home.maid"),
    i18n.t("home.nanny"),
    i18n.t("home.eldercare"),
  ]);
  const [tableDataFlexible, setTableDataFlexible] = React.useState([
    ["15", "30", "45"],
  ]);
  const [tableHeadFix, setTableHeadFix] = React.useState([
    i18n.t("home.fix_plan"),
    i18n.t("home.price_per_hour"),
  ]);
  const [tableTitleFix, setTableTitleFix] = React.useState([
    <Text style={styles.textBold}>{i18n.t("home.total_hour")}</Text>,
    i18n.t("home.maid"),
    i18n.t("home.nanny"),
    i18n.t("home.eldercare"),
  ]);
  const [tableDataFix, setTableDataFix] = React.useState([
    [
      i18n.t("home.fifteen_or_less"),
      i18n.t("home.thirty_or_less"),
      i18n.t("home.fortyFive_or_less"),
      i18n.t("home.fortyFive_or_more"),
    ],
  ]);
  const [showInputs, setShowInputs] = React.useState(false);
  const [isDisableCash, setIsDisableCash] = React.useState(true);
  const [idCash, setIdCash] = React.useState("");
  const [isDisableCreditCard, setIsDisableCreditCard] = React.useState(true);
  const [idCreditCard, setIdCreditCard] = React.useState("");
  const [isDiscount, setIsDiscount] = React.useState<{
    value?: number;
    isTrue?: boolean;
  }>({});
  const [textPromotion, setTextPromotion] = React.useState<{
    text?: string;
    isShow?: boolean;
  }>({});
  const [isApplyPromotion, setIsApplyPromotion] = React.useState<{
    value?: number;
    isTrue?: boolean;
    promotionType?: number;
  }>({});
  const [paymentType, setPaymentType] = React.useState({
    cash: true,
    creditCard: false,
  });
  const [receivePointFromPrice, setReceivePointFromPrice] = React.useState(0);
  const [voucherCode, setVoucherCode] = React.useState<{
    value?: string;
    isError?: boolean;
    msgErr?: string;
  }>({});
  const [point, setPoint] = React.useState<{
    value?: number;
    isError?: boolean;
    msgErr?: string;
  }>({});
  const notSelectPaymentType = { cash: false, creditCard: false };
  const selectPaymentType = (type: string) => {
    setPaymentType({ ...notSelectPaymentType, [type]: true });
    if (type === "cash") {
      props.handlePaymentMethod(idCash, false);
    } else if (type === "creditCard") {
      props.handlePaymentMethod(idCreditCard, true);
    }
  };
  const [requestPromotionCodeTrigger, { isLoading: loadingPromotionCode }] =
    apiSlice.endpoints.promotionApply.useLazyQuery();
  const requestPromotionCode = portRequest(
    requestPromotionCodeTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        if (response.promotionType === Enum.PromotionType.GIFT_MONEY) {
          let priceDiscount = JSON.parse(response.content).money;
          setIsApplyPromotion({
            value: priceDiscount,
            isTrue: true,
            promotionType: response.promotionType,
          });
          if (props.handlePriceExtraService) {
            props.handlePriceExtraService(priceDiscount, "minus");
          } else {
            props.handleDiscountPrice(priceDiscount, true);
          }
          setTextPromotion({
            text: `discount ${priceDiscount} THB`,
            isShow: true,
          });
        } else if (response.promotionType === Enum.PromotionType.GIFT_PERCENT) {
          let percent = JSON.parse(response.content).percent;
          let pricePercent = (props.price * percent) / 100;
          setIsApplyPromotion({
            value: pricePercent,
            isTrue: true,
            promotionType: response.promotionType,
          });
          if (props.handlePriceExtraService) {
            props.handlePriceExtraService(pricePercent, "minus");
          } else {
            props.handleDiscountPrice(pricePercent, true);
          }
          setTextPromotion({
            text: `discount ${pricePercent} THB`,
            isShow: true,
          });
        } else if (response.promotionType === Enum.PromotionType.GIFT_POINT) {
          let points = JSON.parse(response.content).point;
          setIsApplyPromotion({
            value: points,
            isTrue: true,
            promotionType: response.promotionType,
          });
          setReceivePointFromPrice(receivePointFromPrice + points);
          props.handleReceivePoint(points);
          setTextPromotion({ text: `give ${points} point`, isShow: true });
        } else if (
          response.promotionType === Enum.PromotionType.EXTRA_SERVICES
        ) {
          // if (props.onlyCreditCard) {
          //   Alert.alert(
          //     i18n.t("auth.error"),
          //     i18n.t("home.voucher_not_support")
          //   );
          //   return;
          // } else {
            let serviceDiscount = JSON.parse(response.content).extraServices[0]
              ?.PromotionExtraItem;
            let priceServiceDiscount = 0;
            let nameServiceDiscount = "";
            if (!_.isEmpty(props.extraService)) {
              const match = props.extraService.filter((i: ApiItem) =>
                serviceDiscount.some((e: ApiItem) => e.name === i.name && i.isCheck)
              );
              match.map((i: ApiItem) => {
                nameServiceDiscount += `- ${i.name} `;
                priceServiceDiscount +=
                  (i.price * serviceDiscount[0].discount) / 100;
              });
            }
            setIsApplyPromotion({
              value: priceServiceDiscount,
              isTrue: true,
              promotionType: response.promotionType,
            });
            if (props.handlePriceExtraService) {
              props.handlePriceExtraService(priceServiceDiscount, "minus");
            } else {
              props.handleDiscountPrice(priceServiceDiscount, true);
            }
            setTextPromotion({
              text: `discount ${priceServiceDiscount} THB apply for service ${nameServiceDiscount}`,
              isShow: true,
            });
          // }
        }
        props.handlePromotionId(response.id);
      }
    }
  );
  const [requestPaymentTrigger, { isLoading: loadingPayment }] =
    apiSlice.endpoints.getPayment.useLazyQuery();
  const requestPayment = portRequest(
    requestPaymentTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        if (response.items && response.items.length) {
          for (let index = 0; index < response.items.length; index++) {
            if (
              response.items[index].code === Enum.SETTING.PAYMENT_METHOD_CASH
            ) {
              props.handlePaymentMethod(response.items[index].id, false);
              setIdCash(response.items[index].id);
              if (response.items[index].status) {
                setIsDisableCash(false);
              }
            } else if (
              response.items[index].code ===
              Enum.SETTING.PAYMENT_METHOD_CREDIT_CARD
            ) {
              setIdCreditCard(response.items[index].id);
              if (response.items[index].status) {
                setIsDisableCreditCard(false);
              }
            }
          }
        }
      }
    }
  );
  const [requestPriceToPointTrigger, { isLoading: loadingPriceToPoint }] =
    apiSlice.endpoints.configPoint.useLazyQuery();
  const requestPriceToPoint = portRequest(
    requestPriceToPointTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        let data = JSON.parse(response.items[0].config);
        if (props.price > data.fromMoney) {
          let getPoint = Math.trunc(props.price / data.fromMoney);
          getPoint = getPoint * data.toPoint;
          props.handleReceivePoint(getPoint);
          setReceivePointFromPrice(getPoint);
        }
      }
    }
  );

  const [requestPointToDiscountTrigger, { isLoading: loadingPointToDiscount }] =
    apiSlice.endpoints.configPoint.useLazyQuery();
  const requestPointToDiscount = portRequest(
    requestPointToDiscountTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        let data = JSON.parse(response.items[0].config);
        let percentDiscount = (point.value! * data.discounts) / data.point;
        let valueDiscount = (props.price * percentDiscount) / 100;
        setIsDiscount({ ...isDiscount, isTrue: true, value: valueDiscount });
        props.handleDiscountPrice(valueDiscount, true, point.value);
      }
    }
  );
  const [requestSubscriptionFlexibleTrigger, { isLoading: loadingSubscriptionFlexible }] =
    apiSlice.endpoints.configSubscriptionPrices.useLazyQuery();
  const requestSubscriptionFlexible = portRequest(
    requestSubscriptionFlexibleTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        let dataTable = [...tableDataFlexible];
        for (let index = 0; index < response.items.length; index++) {
          let priceModel = JSON.parse(response.items[index].pricesModel);
          let result = Object.keys(priceModel).map((key) => priceModel[key]);
          dataTable.push(result);
        }
        setTableDataFlexible(dataTable);
      }
    }
  );
  const [requestSubscriptionFixTrigger, { isLoading: loadingSubscriptionFix }] =
    apiSlice.endpoints.configSubscriptionPrices.useLazyQuery();
  const requestSubscriptionFix = portRequest(
    requestSubscriptionFixTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        let dataTable = [...tableDataFix];
        for (let index = 0; index < response.items.length; index++) {
          let priceModel = JSON.parse(response.items[index].pricesModel);
          let result = Object.keys(priceModel).map((key) => priceModel[key]);
          dataTable.push(result);
        }
        setTableDataFix(dataTable);
      }
    }
  );

  const onPressUndoDiscount = () => {
    setIsDiscount({ ...isDiscount, isTrue: false });
    props.handleDiscountPrice(isDiscount.value, false);
  };

  const onPressUndoPromotion = () => {
    setIsApplyPromotion({ ...isApplyPromotion, isTrue: false });
    setTextPromotion({ ...textPromotion, isShow: false });
    if (isApplyPromotion.promotionType == Enum.PromotionType.GIFT_POINT) {
      props.handleReceivePoint(-isApplyPromotion.value!);
      setReceivePointFromPrice(receivePointFromPrice - isApplyPromotion.value!);
    } else {
      if (props.handlePriceExtraService) {
        props.handlePriceExtraService(isApplyPromotion.value, "plus");
      } else {
        props.handleDiscountPrice(isApplyPromotion.value, false);
      }
    }
    props.handlePromotionId("");
  };

  const onPressPoint = () => {
    if (!point.value) {
      setPoint({
        ...point,
        isError: true,
        msgErr: i18n.t("home.point_empty"),
      });
      return;
    }
    if (point.value > user.point) {
      setPoint({
        ...point,
        isError: true,
        msgErr: i18n.t("home.point_not_enough"),
      });
      return;
    }
    if (point.value! < 100 || point.value! > 200) {
      setPoint({
        ...point,
        isError: true,
        msgErr: i18n.t("home.point_validate"),
      });
      return;
    }
    requestPointToDiscount({
      params: {
        point: Enum.POINT.POINT_CONVERT_DISCOUNT,
      },
    });
  };
  const onPressVoucherCode = () => {
    if (!voucherCode.value) {
      setVoucherCode({
        ...voucherCode,
        isError: true,
        msgErr: i18n.t("home.voucher_empty"),
      });
      return;
    }
    if (props.onlyCreditCard) {
      requestPromotionCode({
        params: {
          code: voucherCode.value,
          serviceType: props.type,
        },
      });
    } else {
      requestPromotionCode({
        params: {
          code: voucherCode.value,
          serviceType: props.type,
          addressId: props.idAddress && props.idAddress.id,
        },
      });
    }
  };

  React.useEffect(() => {
    // if (props.type != Enum.SERVICE_TYPE.PetcareService) {
    setShowInputs(true);
    // }

    // if (props.showInputs) {
    //   setShowInputs(true);
    // }

    requestPriceToPoint({
      params: {
        point: Enum.POINT.MONEY_CONVERT_POINT,
      },
    });
    requestPayment();
    requestSubscriptionFlexible({
      params: {
        planType: Enum.PlanType.FLEXIBLE,
      },
    });
    requestSubscriptionFix({
      params: {
        planType: Enum.PlanType.FIX,
      },
    });
    if (props.onlyCreditCard) {
      setIsDisableCash(true);
      setPaymentType({ creditCard: true, cash: false });
    }
  }, []);
  const getRoomInfo = (type: number) => {
    switch (type) {
      case 1:
        return "Condo";
      case 2:
        return "Apartment";
      default:
        return "House";
    }
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        <View style={{ marginHorizontal: 20 }}>
          <Loading
            loading={
              loadingPointToDiscount ||
              loadingPriceToPoint ||
              loadingPayment ||
              loadingPromotionCode
            }
          />
          <View style={{ marginVertical: 15 }}>
            <Text style={styles.textTitle}>
              {i18n.t("home.booking_detail")}
            </Text>
            {props.nameServiceType && (props.valueShowTime || props.times) && (
              <View>
                <Text style={styles.textDesc}>{props.nameServiceType}</Text>
                {props.nameServiceType == 'Maid' &&
                  props.idAddress.roomType != 0 && (
                    <Text style={styles.textDesc}>
                      Room type: {getRoomInfo(props.idAddress.roomType)}
                    </Text>
                  )}
                {props.valueShowTime && (
                  <Text style={styles.textDesc}>{props.valueShowTime}</Text>
                )}
                {props.times && (
                  <Text style={styles.textDesc}>
                    {_.map(
                      props.times.sort(function (left: ApiItem, right: ApiItem) {
                        return dayjs
                          .utc(left.startAt)
                          .diff(dayjs.utc(right.startAt));
                      }),
                      (x) =>
                        `- ${x.startAt.format("dddd")} \n${x.startAt.format(
                          "lll"
                        )}\n(${i18n.t("home.repeat")} 4 ${i18n.t("home.timesBook")} ${dayjs(x.startAt).format("dddd")})\n`
                    )}
                  </Text>
                )}
                <Text style={styles.textDesc}>
                  {props.idAddress && (props.idAddress.longAddress || props.idAddress.address)}
                </Text>
              </View>
            )}
          </View>
          {showInputs && (
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={[styles.textDesc, { marginTop: 20 }]}>
                {i18n.t("home.total")}
              </Text>
              <View>
                <Text
                  style={[
                    styles.textDesc,
                    {
                      marginTop: 10,
                      textAlign: "right",
                      fontSize: 25,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  THB {props.price > 0 ? props.price : 0}
                </Text>
                <Text>
                  {i18n.t("home.you_will_receive")}{" "}
                  <Text style={{ color: colors.main_color }}>
                    {receivePointFromPrice}{" "}
                    {i18n.t("home.reward_point").toLowerCase()}
                  </Text>{" "}
                </Text>
              </View>
            </View>
          )}
          {showInputs && (
            <View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 5,
                }}
              >
                <CustomInput
                  disabled={isApplyPromotion.isTrue}
                  value={voucherCode.value}
                  placeholder={i18n.t("home.voucher_code")}
                  containerStyle={{ width: "65%" }}
                  onChangeText={(value) =>
                    setVoucherCode({
                      ...voucherCode,
                      value: value,
                      isError: false,
                    })
                  }
                  isError={voucherCode.isError}
                  errorText={voucherCode.msgErr}
                />
                <Button
                  onPress={() =>
                    isApplyPromotion.isTrue
                      ? onPressUndoPromotion()
                      : onPressVoucherCode()
                  }
                  titleStyle={{ color: colors.black_text }}
                  buttonStyle={{ backgroundColor: colors.gray_hidden_text }}
                  containerStyle={{ width: "30%", borderRadius: 10 }}
                  title={
                    isApplyPromotion.isTrue
                      ? i18n.t("home.undo")
                      : i18n.t("home.apply")
                  }
                />
              </View>
              {textPromotion.isShow ? (
                <Text style={{ color: colors.green }}>
                  Your voucher code is {textPromotion.text}
                </Text>
              ) : null}
            </View>
          )}
          {showInputs && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 5,
              }}
            >
              <CustomInput
                disabled={isDiscount.isTrue}
                value={String(point.value ?? "")}
                keyboardType="number-pad"
                placeholder={i18n.t("home.point")}
                containerStyle={{ width: "65%" }}
                onChangeText={(value) =>
                  setPoint({ ...point, value: value as unknown as number, isError: false })
                }
                isError={point.isError}
                errorText={point.msgErr}
              />
              <Button
                onPress={() =>
                  isDiscount.isTrue ? onPressUndoDiscount() : onPressPoint()
                }
                titleStyle={{ color: colors.black_text }}
                buttonStyle={{ backgroundColor: colors.gray_hidden_text }}
                containerStyle={{ width: "30%", borderRadius: 10 }}
                title={
                  isDiscount.isTrue ? i18n.t("home.undo") : i18n.t("home.apply")
                }
              />
            </View>
          )}
          {showInputs && (
            <View style={styles.border}>
              <Text style={styles.textTitle}>
                {i18n.t("home.payment_method")}
              </Text>
              <View
                style={{ flexDirection: "row", justifyContent: "space-evenly" }}
              >
                {!props.onlyCreditCard && (
                  <TouchableOpacity
                    disabled={isDisableCash}
                    style={styles.iconBorder}
                    onPress={() => selectPaymentType("cash")}
                  >
                    <FontAwesome5
                      name="money-bill-alt"
                      size={40}
                      color={
                        isDisableCash
                          ? colors.gray_hidden_text
                          : paymentType.cash
                          ? colors.main_color
                          : "black"
                      }
                    />
                    <Text
                      style={[
                        styles.textPayment,
                        {
                          color: isDisableCash
                            ? colors.gray_hidden_text
                            : paymentType.cash
                            ? colors.main_color
                            : "black",
                        },
                      ]}
                    >
                      {i18n.t("home.cash")}
                    </Text>
                  </TouchableOpacity>
                )}
                {props.type != 4 && (
                  <TouchableOpacity
                    disabled={isDisableCreditCard}
                    style={styles.iconBorder}
                    onPress={() => selectPaymentType("creditCard")}
                  >
                    <FontAwesome5
                      name="credit-card"
                      size={40}
                      color={
                        isDisableCreditCard
                          ? colors.gray_hidden_text
                          : paymentType.creditCard
                          ? colors.main_color
                          : "black"
                      }
                    />
                    <Text
                      style={[
                        styles.textPayment,
                        {
                          color: isDisableCreditCard
                            ? colors.gray_hidden_text
                            : paymentType.creditCard
                            ? colors.main_color
                            : "black",
                        },
                      ]}
                    >
                      {i18n.t("home.credit_card")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  textTitle: {
    fontSize: 20,
    marginBottom: 5,
    fontFamily: 'SukhumvitSet-SemiBold',
  },
  textDesc: {
    fontSize: 16,
  },
  point: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "right",
  },
  iconBorder: {
    alignItems: "center",
    borderColor: colors.gray_hidden_text,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: "45%",
    marginHorizontal: 12,
  },
  textPayment: {
    // fontWeight: "bold",
    fontFamily: 'SukhumvitSet-SemiBold',
    textAlign: "center",
    fontSize: 15,
  },
  border: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    marginVertical: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  link: {
    color: colors.blue_link,
    textDecorationLine: "underline",
  },
  wrapper: {
    flexDirection: "row",
  },
  title: {
    flex: 1,
  },
  row: {
    height: 28,
  },
  textBold: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 10,
  },
  text: {
    textAlign: "center",
    fontSize: 10,
  },
});
