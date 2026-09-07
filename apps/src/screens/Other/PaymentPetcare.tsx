import moment from "moment";
import React, { useEffect, useState } from "react";
import { View, Alert } from "react-native";
import Config from "react-native-config";
import { Overlay } from "react-native-elements";
import WebView from "react-native-webview";
import { Button, Container, ListCardPayment, Loading, Text } from "../../components";
import useApi from "../../hooks/useApi";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import { Payment } from "../ServiceScreen/component";

export default function PaymentPetcare(props: any) {
  const { order } = props.route.params;
  const childRef = React.useRef<any>(null);
  const [valueShowDateTime, setValueShowDateTime] = useState<string>();
  const [idCard, setIdCard] = useState('');
  const [isCreditCard, setIsCreditCard] = useState(false);
  const [isShowModal, setIsShowModal] = useState(false);
  const [pointApply, setPointApply] = useState(0);
  const [price, setPrice] = useState(0);

  const [loadingPaymentPetcare, requestPaymentPetcare] = useApi({
    method: "post",
    url: Constants.API.payment_petcare,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        if(isCreditCard){
          requestChargesCard({
            data: {
              orderId: order.orderId,
              cardId: idCard
            },
          });
        }else{
          Alert.alert(i18n.t('home.payment'), i18n.t('home.update_successfully'), [
            {
              text: "OK",
              onPress: () => {
                props.navigation.goBack();
              },
            },
          ]);
        }


      }
    },
  });
  const [loadingCancelPayment, requestCancelPayment] = useApi({
    method: "post",
    url: Constants.API.orders_cancel,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      }
    },
  });
  const [loadingChargesCard, requestChargesCard] = useApi({
    method: "post",
    url: Constants.API.chargescard,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      }
      Alert.alert(i18n.t('home.payment'), i18n.t('home.update_successfully'), [
        {
          text: "OK",
          onPress: () => {
            props.navigation.goBack();
          },
        },
      ]);
    },
  });

  useEffect(() => {
    setValueShowDateTime(moment(order.bookingDetail.bookingDate).local().format("lll"));
    setPrice(order.totalPrice);
  }, []);

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

  const handlePaymentMethod = (_: any, type: boolean) => {
    setIsCreditCard(type);
  };

  const handleReceivePoint = () => {};

  const handleCloseModalCrediCard = (value: any) => {
    setIsShowModal(false);

    if (value.nativeEvent && value.nativeEvent.data === "cancel") {
      requestCancelPayment({
        data: {
          id: order.orderDetailId,
          reason: "CANCEL_PAYMENT_WITH_CREDIT_CARD",
        },
      });

      return;
    }


    requestPaymentPetcare({
      data: {
        id: order.orderId,
        amount: order.totalPrice || 0,
        voucherCode: "",
        point: pointApply,
        paymentMethod: "PAYMENT_METHOD_CREDIT_CARD",
      },
    });
  };

  const onPressPayment = () => {
    if (!isCreditCard) {
      requestPaymentPetcare({
        data: {
          id: order.orderId,
          amount: order.totalPrice || 0,
          voucherCode: "",
          point: pointApply,
          paymentMethod: "PAYMENT_METHOD_CASH",
        },
      });
    } else {
      if(!idCard && isCreditCard){
        childRef.current.openModalListCard();
        return;
      }
      requestPaymentPetcare({
        data: {
          id: order.orderId,
          amount: order.totalPrice || 0,
          voucherCode: "",
          point: pointApply,
          paymentMethod: "PAYMENT_METHOD_CREDIT_CARD",
        },
      });
    }
  };

  const handleIdCard = (cardSelected:any)=>{
    if(cardSelected){
      setIdCard(cardSelected)
    }
  }

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
      <Loading loading={loadingChargesCard || loadingPaymentPetcare} />
      <View style={{ flex: 1, paddingVertical:16 }}>
        <Payment
          type={order.serviceType}
          nameServiceType={order.serviceName}
          valueShowTime={valueShowDateTime}
          price={price}
          handleDiscountPrice={handleDiscountPrice}
          handlePaymentMethod={handlePaymentMethod}
          handleReceivePoint={handleReceivePoint}
          showInputs
        />
        <Button style={{paddingHorizontal:16}} onPress={onPressPayment}>
          <Text>{isCreditCard && !idCard ? i18n.t('home.select_card') : i18n.t("auth.next")}</Text>
        </Button>
      </View>

      <ListCardPayment children={childRef}
        navigation={props.navigation} 
        handleIdCard={handleIdCard}/>

      <Overlay fullScreen animationType="fade" isVisible={isShowModal}>
        <WebView
          useWebKit
          mixedContentMode="always"
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          injectedJavaScript={injectedToHtml(order.totalPrice)}
          originWhitelist={["*"]}
          source={{ uri: Config.OMISELINK as string }}
          allowFileAccess
          allowUniversalAccessFromFileURLs
          scalesPageToFit
          style={{ flex: 1, marginTop: 16 }}
          onMessage={handleCloseModalCrediCard}
        />
      </Overlay>
    </Container>
  );
}
