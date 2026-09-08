import React from 'react';
import {
  StyleSheet, Alert, View, TouchableOpacity, ScrollView
} from 'react-native';
import colors from '../../../shared/Colors';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Button } from 'react-native-elements';
import { CustomInput, Loading, Text } from '../../../components';
import i18n from '../../../shared/I18n';
import useApi from '../../../hooks/useApi';
import Constants from '../../../shared/Constants';
import Enum from '../../../shared/Enum';
import { useSelector } from 'react-redux';
import { Table, TableWrapper, Row, Rows, Col } from 'react-native-table-component';
import Layout from '../../../shared/Layout';
export default function Payment(props: any) {
  const user = useSelector((state: any) => state.auth.user);
  const [tableHeadFlexible, setTableHeadFlexible] = React.useState([
    i18n.t("home.fexible_plan"), i18n.t("home.total_price")]);
  const [tableTitleFlexible, setTableTitleFlexible] = React.useState(
    [
      <Text style={styles.textBold}>{i18n.t("home.total_hour")}</Text>,
      i18n.t("home.maid"),
      i18n.t("home.nanny"),
      i18n.t("home.eldercare")
    ]);
  const [tableDataFlexible, setTableDataFlexible] = React.useState([
    ['15', '30', '45']]);
  const [tableHeadFix, setTableHeadFix] = React.useState([i18n.t("home.fix_plan"), i18n.t("home.price_per_hour")]);
  const [tableTitleFix, setTableTitleFix] = React.useState([
    <Text style={styles.textBold}>{i18n.t("home.total_hour")}</Text>,
    i18n.t("home.maid"),
    i18n.t("home.nanny"),
    i18n.t("home.eldercare")]);
  const [tableDataFix, setTableDataFix] = React.useState([[i18n.t("home.fifteen_or_less"), i18n.t("home.thirty_or_less"), i18n.t("home.fortyFive_or_less"), i18n.t("home.fortyFive_or_more")]]);
  const [showInputs, setShowInputs] = React.useState(false);
  const [isDisableCash, setIsDisableCash] = React.useState(true);
  const [idCash, setIdCash] = React.useState('');
  const [isDisableCreditCard, setIsDisableCreditCard] = React.useState(true);
  const [idCreditCard, setIdCreditCard] = React.useState('');
  const [isDiscount, setIsDiscount] = React.useState<{ value?: any; isTrue?: boolean; }>({});
  const [textPromotion, setTextPromotion] = React.useState<{ text?: any; isShow?: boolean; }>({});
  const [isApplyPromotion, setIsApplyPromotion] = React.useState<{ value?: any; isTrue?: boolean; promotionType?: number }>({});
  const [paymentType, setPaymentType] = React.useState({ cash: true, creditCard: false });
  const [receivePointFromPrice, setReceivePointFromPrice] = React.useState(0);
  const [voucherCode, setVoucherCode] = React.useState<{ value?: any; isError?: boolean; msgErr?: string }>({});
  const [point, setPoint] = React.useState<{ value?: any; isError?: boolean; msgErr?: string }>({});
  const notSelectPaymentType = { cash: false, creditCard: false };
  const selectPaymentType = (type: string) => {
    setPaymentType({ ...notSelectPaymentType, [type]: true });
    if (type === 'cash') {
      props.handlePaymentMethod(idCash, false)
    } else if (type === 'creditCard') {
      props.handlePaymentMethod(idCreditCard, true)
    }
  };
  const [loadingPromotionCode, requestPromotionCode] = useApi({
    method: "get",
    url: Constants.API.promotion_apply,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        if (response.promotionType === Enum.PromotionType.GIFT_MONEY) {
          let priceDiscount = JSON.parse(response.content).money;
          setIsApplyPromotion({ value: priceDiscount, isTrue: true, promotionType: response.promotionType })
          props.handlePriceExtraService(priceDiscount, "minus");
          setTextPromotion({ text: `discount ${priceDiscount} THB`, isShow: true })
        } else if (response.promotionType === Enum.PromotionType.GIFT_PERCENT) {
          let percent = JSON.parse(response.content).percent;
          let pricePercent = props.price * percent / 100;
          setIsApplyPromotion({ value: pricePercent, isTrue: true, promotionType: response.promotionType })
          props.handlePriceExtraService(pricePercent, "minus");
          setTextPromotion({ text: `discount ${pricePercent} THB`, isShow: true })
        } else if (response.promotionType === Enum.PromotionType.GIFT_POINT) {
          let points = JSON.parse(response.content).point;
          setIsApplyPromotion({ value: points, isTrue: true, promotionType: response.promotionType })
          setReceivePointFromPrice(receivePointFromPrice + points);
          props.handleReceivePoint(points);
          setTextPromotion({ text: `give ${points} point`, isShow: true })
        } else if (response.promotionType === Enum.PromotionType.EXTRA_SERVICES) {
          let serviceDiscount = JSON.parse(response.content).extraServices;
          if (serviceDiscount.length && props.extraService.length) {
            for (let x = 0; x < serviceDiscount.length; x++) {
              for (let y = 0; y < props.extraService.length; y++) {
                if (serviceDiscount[x].serviceName === props.extraService[y].name) {
                  serviceDiscount[x].isCheck = props.extraService[y].isCheck
                }
              }
            }
          }
          let priceServiceDiscount = 0;
          let nameServiceDiscount = "";
          for (let index = 0; index < serviceDiscount.length; index++) {
            if (serviceDiscount[index].isCheck) {
              nameServiceDiscount += ` - ${serviceDiscount[index].serviceName} `
              priceServiceDiscount += serviceDiscount[index].price * serviceDiscount[index].discount / 100;
            }
          }
          setIsApplyPromotion({ value: priceServiceDiscount, isTrue: true, promotionType: response.promotionType })
          props.handlePriceExtraService(priceServiceDiscount, "minus");
          setTextPromotion({ text: `discount ${priceServiceDiscount} THB apply for service ${nameServiceDiscount}`, isShow: true })
        }
        props.handlePromotionId(response.id);
      }
    },
  });
  const [loadingPayment, requestPayment] = useApi({
    method: "get",
    url: Constants.API.get_payment,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        if (response.items && response.items.length) {
          for (let index = 0; index < response.items.length; index++) {
            if (response.items[index].code === Enum.SETTING.PAYMENT_METHOD_CASH) {
              props.handlePaymentMethod(response.items[index].id, false)
              setIdCash(response.items[index].id)
              if (response.items[index].status) {
                setIsDisableCash(false)
              }
            } else if (response.items[index].code === Enum.SETTING.PAYMENT_METHOD_CREDIT_CARD) {
              setIdCreditCard(response.items[index].id)
              if (response.items[index].status) {
                setIsDisableCreditCard(false)
              }
            }
          }
        }
      }
    },
  });
  const [loadingPriceToPoint, requestPriceToPoint] = useApi({
    method: "get",
    url: Constants.API.config_point,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        let data = JSON.parse(response.items[0].config);
        if (props.price > data.fromMoney) {
          let getPoint = Math.trunc(props.price / data.fromMoney)
          getPoint = getPoint * data.toPoint;
          props.handleReceivePoint(getPoint);
          setReceivePointFromPrice(getPoint);
        }
      }
    },
  });

  const [loadingPointToDiscount, requestPointToDiscount] = useApi({
    method: "get",
    url: Constants.API.config_point,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        let data = JSON.parse(response.items[0].config);
        let percentDiscount = point.value * data.discounts / data.point;
        let valueDiscount = props.price * percentDiscount / 100;
        setIsDiscount({ ...isDiscount, isTrue: true, value: valueDiscount });
        props.handleDiscountPrice(valueDiscount, true, point.value);
      }
    },
  });
  const [loadingSubscriptionFlexible, requestSubscriptionFlexible] = useApi({
    method: "get",
    url: Constants.API.config_subscription_prices,
    callback: ({ error, response }) => {
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
    },
  });
  const [loadingSubscriptionFix, requestSubscriptionFix] = useApi({
    method: "get",
    url: Constants.API.config_subscription_prices,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        let dataTable = [...tableDataFix];
        for (let index = 0; index < response.items.length; index++) {
          let priceModel = JSON.parse(response.items[index].pricesModel);
          let result = Object.keys(priceModel).map((key) => priceModel[key]);
          dataTable.push(result);
        }
        setTableDataFix(dataTable)
      }
    },
  });
  const onPressUndoDiscount = () => {
    setIsDiscount({ ...isDiscount, isTrue: false });
    props.handleDiscountPrice(isDiscount.value, false);
  }

  const onPressUndoPromotion = () => {
    setIsApplyPromotion({ ...isApplyPromotion, isTrue: false });
    setTextPromotion({ ...textPromotion, isShow: false })
    if (isApplyPromotion.promotionType === Enum.PromotionType.GIFT_MONEY) {
      props.handlePriceExtraService(isApplyPromotion.value, "plus");
    } else if (isApplyPromotion.promotionType === Enum.PromotionType.GIFT_PERCENT) {
      props.handlePriceExtraService(isApplyPromotion.value, "plus");
    } else if (isApplyPromotion.promotionType === Enum.PromotionType.GIFT_POINT) {
      props.handleReceivePoint(-isApplyPromotion.value);
      setReceivePointFromPrice(receivePointFromPrice - isApplyPromotion.value);
    } else if (isApplyPromotion.promotionType === Enum.PromotionType.EXTRA_SERVICES) {
      props.handlePriceExtraService(isApplyPromotion.value, "plus");
    }
    props.handlePromotionId('');
  }

  const onPressPoint = () => {
    if (!point.value) {
      setPoint({
        ...point,
        isError: true,
        msgErr: i18n.t('home.point_empty')
      });
      return;
    }
    if (point.value > user.point) {
      setPoint({
        ...point,
        isError: true,
        msgErr: i18n.t('home.point_not_enough')
      });
      return;
    }
    if (point.value < 100 || point.value > 200) {
      setPoint({
        ...point,
        isError: true,
        msgErr: i18n.t('home.point_validate')
      });
      return;
    }
    requestPointToDiscount({
      params: {
        point: Enum.POINT.POINT_CONVERT_DISCOUNT
      }
    })
  };
  const onPressVoucherCode = () => {
    if (!voucherCode.value) {
      setVoucherCode({
        ...voucherCode,
        isError: true,
        msgErr: i18n.t('home.voucher_empty')
      });
      return;
    }
    requestPromotionCode({
      params: {
        code: voucherCode.value,
        serviceType: props.type,
        addressId: props.idAddress && props.idAddress.id
      }
    })
  };

  React.useEffect(() => {
    if (props.type != Enum.SERVICE_TYPE.PetcareService) {
      setShowInputs(true);
    }

    if (props.showInputs) {
      setShowInputs(true);
    }

    requestPriceToPoint({
      params: {
        point: Enum.POINT.MONEY_CONVERT_POINT
      }
    });
    requestPayment();
    requestSubscriptionFlexible({
      params: {
        planType: Enum.PlanType.FLEXIBLE
      }
    });
    requestSubscriptionFix({
      params: {
        planType: Enum.PlanType.FIX
      }
    });
  }, []);
  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        <View style={{ marginHorizontal: 20 }}>
          <Loading loading={loadingPointToDiscount || loadingPriceToPoint || loadingPayment || loadingPromotionCode || loadingSubscriptionFix || loadingSubscriptionFlexible} />
          <View style={{ marginVertical: 15 }}>
            <Text style={styles.textTitle}>{i18n.t('home.booking_detail')}</Text>
            <Text style={styles.textDesc}>{props.nameServiceType}</Text>
            <Text style={styles.textDesc}>Room type</Text>
            <Text style={styles.textDesc}>{props.valueShowTime}</Text>
            <Text style={styles.textDesc}>{props.idAddress && props.idAddress.longAddress}</Text>
          </View>
          {showInputs &&
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[styles.textDesc, { marginTop: 10 }]}>{i18n.t('home.total')}</Text>
              <View>
                <Text style={styles.point}>THB {props.price}</Text>
                {receivePointFromPrice ?
                  <Text style={styles.textDesc}>you will receive {receivePointFromPrice} reward point</Text>
                  : null}
              </View>
            </View>
          }
          {showInputs &&
            <View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
                <CustomInput
                  disabled={isApplyPromotion.isTrue}
                  value={voucherCode.value}
                  placeholder={i18n.t('home.voucher_code')}
                  containerStyle={{ width: "65%" }}
                  onChangeText={(value) => setVoucherCode({ ...voucherCode, value: value, isError: false })}
                  isError={voucherCode.isError}
                  errorText={voucherCode.msgErr} />
                <Button onPress={() => isApplyPromotion.isTrue ? onPressUndoPromotion() : onPressVoucherCode()} titleStyle={{ color: colors.black_text }} buttonStyle={{ backgroundColor: colors.gray_hidden_text }} containerStyle={{ width: "30%", borderRadius: 10 }} title={isApplyPromotion.isTrue ? i18n.t('home.undo') : i18n.t('home.apply')} />
              </View>
              {textPromotion.isShow ?
                <Text style={{ color: colors.green }}>Your voucher code is {textPromotion.text}</Text>
                : null}
            </View>
          }
          {showInputs &&
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
              <CustomInput
                disabled={isDiscount.isTrue}
                value={point.value}
                keyboardType="number-pad"
                placeholder={i18n.t('home.point')}
                containerStyle={{ width: "65%" }}
                onChangeText={(value) => setPoint({ ...point, value: value, isError: false })}
                isError={point.isError}
                errorText={point.msgErr} />
              <Button onPress={() => isDiscount.isTrue ? onPressUndoDiscount() : onPressPoint()} titleStyle={{ color: colors.black_text }} buttonStyle={{ backgroundColor: colors.gray_hidden_text }} containerStyle={{ width: "30%", borderRadius: 10 }} title={isDiscount.isTrue ? i18n.t('home.undo') : i18n.t('home.apply')} />
            </View>
          }
          {props.type != Enum.SERVICE_TYPE.PetcareService &&
            <View style={styles.border}>
              <Text style={styles.textTitle}>{i18n.t('home.payment_method')}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
                <TouchableOpacity disabled={isDisableCash} style={styles.iconBorder} onPress={() => selectPaymentType("cash")}>
                  <FontAwesome5 name="money-bill-alt" size={40} color={isDisableCash ? colors.gray_hidden_text : paymentType.cash ? colors.main_color : "black"} />
                  <Text style={[styles.textPayment, { color: isDisableCash ? colors.gray_hidden_text : paymentType.cash ? colors.main_color : "black" }]}>{i18n.t('home.cash')}</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={isDisableCreditCard} style={styles.iconBorder} onPress={() => selectPaymentType("creditCard")}>
                  <FontAwesome5 name="credit-card" size={40} color={isDisableCreditCard ? colors.gray_hidden_text : paymentType.creditCard ? colors.main_color : "black"} />
                  <Text style={[styles.textPayment, { color: isDisableCreditCard ? colors.gray_hidden_text : paymentType.creditCard ? colors.main_color : "black" }]}>{i18n.t('home.credit_card')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          {/* <Text>{i18n.t('home.text_desc_supscription_price')} <Text style={styles.link}>{i18n.t('home.subscription_plan')}</Text></Text>
          <Text style={{ marginTop: 20 }}>{i18n.t('home.subscription_price')}</Text>
          <View style={{ marginVertical: 10 }}>
            <Table style={{ width: Layout.window.width - 100 }} borderStyle={{ borderWidth: 1 }}>
              <Row height={28} data={tableHeadFlexible} flexArr={[1, 2]} textStyle={styles.textBold} />
              <TableWrapper style={styles.wrapper}>
                <Col data={tableTitleFlexible} style={styles.title} textStyle={styles.text} />
                <Rows data={tableDataFlexible} flexArr={[1, 1]} style={styles.row} textStyle={styles.text} />
              </TableWrapper>
            </Table>
          </View> */}

          {/* <View style={{ marginVertical: 10 }}>
            <Table style={{ width: Layout.window.width - 40 }} borderStyle={{ borderWidth: 1 }}>
              <Row height={28} data={tableHeadFix} flexArr={[1, 3]} textStyle={styles.textBold} />
              <TableWrapper style={styles.wrapper}>
                <Col data={tableTitleFix} style={styles.title} textStyle={styles.text} />
                <Rows data={tableDataFix} flexArr={[1, 1, 1]} style={styles.row} textStyle={styles.text} />
              </TableWrapper>
            </Table>
          </View> */}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  textTitle: {
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 5
  },
  textDesc: {
    fontSize: 17
  },
  point: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "right"
  },
  iconBorder: {
    alignItems: "center",
    borderColor: colors.gray_hidden_text,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 30,
    width: "45%",
    marginHorizontal: 15
  },
  textPayment: {
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 15
  },
  border: {
    borderColor: colors.gray_hidden_text,
    borderWidth: 1,
    borderRadius: 15,
    borderTopWidth: 0,
    borderBottomColor: colors.gray_hidden_text,
    borderBottomWidth: 4,
    padding: 15,
    marginVertical: 10
  },
  link: {
    color: colors.blue_link,
    textDecorationLine: "underline"
  },
  wrapper: {
    flexDirection: 'row'
  },
  title: {
    flex: 1,
  },
  row: {
    height: 28
  },
  textBold: {
    textAlign: 'center',
    fontWeight: "bold",
    fontSize: 10
  },
  text: {
    textAlign: 'center',
    fontSize: 10
  },
});
