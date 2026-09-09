import React, { useState } from "react";
import { View, Alert, Platform } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {
  Button,
  Container,
  ListCardPayment,
  Loading,
  Text
} from "../../../components";
import Constants from "../../../shared/Constants";
import i18n from "../../../shared/I18n";
import { Payment } from "../../ServiceScreen/component";
import { apiSlice, portRequest, type ApiResult } from "../../../redux/apiSlice";
import type { ApiItem } from "../../../redux/apiSlice";
import type { ScreenProps } from "../../../navigation/routes";

export default function Detail(props: ScreenProps) {
  const childRef = React.useRef<any>(null);
  const { goBack } = props.navigation;
  const { plan, onGoBack } = props.route.params;

  const [isShowModal, setIsShowModal] = useState(false);
  const [receivePoint, setReceivePoint] = useState(0);
  const [price, setPrice] = useState(plan.price);
  const [promotionId, setPromotionId] = useState("");
  const [idCard, setIdCard] = useState("");
  const [pointApply, setPointApply] = useState(0);

  const [requestOrderFlexiblePlanTrigger, { isLoading: loadingOrderFlexiblePlan }] =
    apiSlice.endpoints.orderFlexiblePlan.useMutation();
  const requestOrderFlexiblePlan = portRequest(
    requestOrderFlexiblePlanTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        setTimeout(() => {
          Alert.alert(i18n.t("auth.error"), error);
        }, 100);
      } else {
        requestChargePlan({
          data: {
            orderId: response.id,
            cardId: idCard,
          },
        });
      }
    }
  );

  const [requestChargePlanTrigger, { isLoading: loadingChargePlan }] =
    apiSlice.endpoints.chargesplan.useMutation();
  const requestChargePlan = portRequest(
    requestChargePlanTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        setTimeout(() => {
          Alert.alert(i18n.t("auth.error"), error);
        }, 100);
      } else {
        onGoBack();
        setTimeout(goBack, 200);
        Alert.alert("Success", "Order subscription successfully!");
      }
    }
  );

  const handleDiscountPrice = (
    valueDiscount: any,
    isDiscount: boolean,
    point: number
  ) => {
    if (isDiscount) {
      setPointApply(point);
      setPrice(Number((price - valueDiscount).toFixed(2)));
    } else {
      setPointApply(0);
      setPrice(Number((price + valueDiscount).toFixed(2)));
    }
  };

  const handlePaymentMethod = () => {};

  const handlePromotionId = (value: string) => {
    setPromotionId(value);
  };

  const handlePriceExtraService = (value: number, type: string) => {
    if (value) {
      if (type === "plus") {
        setPrice(price + value);
      } else if (type === "minus") {
        setPrice(price - value);
      }
    }
  };

  const handleReceivePoint = (value: number) => {
    setReceivePoint(receivePoint + value);
  };

  const handleCloseModalCrediCard = (value: ApiItem) => {
    setIsShowModal(false);

    if (value.nativeEvent && value.nativeEvent.data === "cancel") {
      return;
    }

    setTimeout(
      () =>
        requestOrderFlexiblePlan({
          data: {
            id: plan.id,
            voucherCode: promotionId,
            point: receivePoint,
          },
        }),
      500
    );
  };

  const onPressConfirm = () => {
    if (idCard) {
      requestOrderFlexiblePlan({
        data: {
          id: plan.id,
          voucherCode: promotionId,
          point: pointApply,
        },
      });
    } else {
      childRef.current.openModalListCard();
    }
  };

  const handleIdCard = (cardSelected: string) => {
    if (cardSelected) {
      setIdCard(cardSelected);
    }
  };

  const injectedToHtml = (price: number) => {
    const configPrice = price * 100;

    return `
      OmiseCard.open({
        amount: ${configPrice},
        currency: "THB",
        defaultPaymentMethod: "credit_card",
        onCreateTokenSuccess: (nonce) => {
          if (nonce.startsWith("tokn_")) {
            window.ReactNativeWebView.postMessage(nonce);
          };
        },
        onFormClosed: () => {
          window.ReactNativeWebView.postMessage("cancel");
        },
      });
    `;
  };

  return (
    <Container>
      <Loading loading={loadingOrderFlexiblePlan || loadingChargePlan} />
      <View style={{ flex: 1 }}>
        <ScrollView>
          <Payment
            type={plan.serviceType}
            price={plan.price}
            paymentPlan={plan}
            // point={100000}
            handleDiscountPrice={handleDiscountPrice}
            handlePaymentMethod={handlePaymentMethod}
            handleReceivePoint={handleReceivePoint}
            handlePriceExtraService={handlePriceExtraService}
            handlePromotionId={handlePromotionId}
            onlyCreditCard={true}
          />
        </ScrollView>
      </View>
      <View
        style={{
          flexDirection: "row",
          padding: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18 }}>
            {i18n.t("home.total")} (VAT inc.)
          </Text>
          <Text style={{ fontSize: 26, fontWeight: "500" }}>THB {price}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Button viewStyle={{ borderRadius: 30 }} onPress={onPressConfirm}>
            {idCard ? (
              <Text>{i18n.t("home.confirm_payment")}</Text>
            ) : (
              <Text>{i18n.t("home.select_card")}</Text>
            )}
          </Button>
        </View>
      </View>

      <ListCardPayment
        children={childRef}
        navigation={props.navigation}
        handleIdCard={handleIdCard}
      />
      {/* <Overlay fullScreen animationType="fade" isVisible={isShowModal}>
        <WebView
          useWebKit
          mixedContentMode="always"
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          injectedJavaScript={injectedToHtml(plan.price)}
          originWhitelist={["*"]}
          source={{ uri: Constants.OMISELINK }}
          allowFileAccess
          allowUniversalAccessFromFileURLs
          scalesPageToFit
          style={{ flex: 1, marginTop: 16 }}
          onMessage={handleCloseModalCrediCard}
        />
      </Overlay> */}
    </Container>
  );
}
