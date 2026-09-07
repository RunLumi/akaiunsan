import React, { useEffect } from "react";
import {
  Platform,
  StyleSheet,
  ViewStyle,
  View,
  TouchableOpacity,
  StyleProp,
  Alert,
  SafeAreaView,
} from "react-native";
import {Text} from './Text'
import { useSelector } from "react-redux";
import { Overlay, Slider } from "react-native-elements";
import colors from "../shared/Colors";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../shared/I18n";
import Constants from "../shared/Constants";
import _ from "lodash";
import { WebView } from 'react-native-webview';
import useApi from "../hooks/useApi";
import Layout from "../shared/Layout";
import Config from "react-native-config";

interface Props {
  style?: StyleProp<ViewStyle>;
  children?: any;
  addSuccess?: any;
  navigation?: any;
}

export const AddCardPayment = ({
  style,
  children,
  addSuccess,
  navigation,
  ...props
}: Props) => {
  const token = useSelector((state: any) => state.auth.token);
  const [modalAddCard, setModalAddCard] = React.useState(false);

  React.useImperativeHandle(children, () => ({
    openModalAddCard() {
      setModalAddCard(true);
    },
  }));

  const [loadingAddCard, requestAddCard] = useApi({
    method: "post",
    url: Constants.API.payment_card_add,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      setModalAddCard(false);
      Alert.alert(i18n.t("home.success"), i18n.t("home.add_card_success"));
      addSuccess(true)
    },
  });

  const onPressClose = () => {
    setModalAddCard(false);
  };

  const injectedToHtml = () => {
    let injectedData = `
    Omise.setPublicKey('${Config.OMISEKEY}');
    var checkoutForm = document.getElementById('checkout-form');
    document.getElementById("addButton").addEventListener("click", function(){
      var cardInformation = {
        name:             document.querySelector('[data-name="nameOnCard"]').value,
        number:           document.querySelector('[data-name="cardNumber"]').value,
        expiration_month: document.querySelector('[data-name="expiryMonth"]').value,
        expiration_year:  document.querySelector('[data-name="expiryYear"]').value,
        security_code:    document.querySelector('[data-name="securityCode"]').value
      };
      console.log("cardInformation",cardInformation);
      Omise.createToken('card', cardInformation, function(statusCode, response) {
      console.log("statusCode",statusCode);
      console.log("response",response);
        if (statusCode === 200) {
          checkoutForm.omiseToken.value = response.id;
          document.getElementById('error').textContent = "";
          window.ReactNativeWebView.postMessage(response.id)
        }
        else {
          document.getElementById('error').textContent = response.message;
          window.ReactNativeWebView.postMessage("cancel")
        }
      });
    });
    `;
    return injectedData;
  }

  const handleIdCard = (value:any) => {
    if (value.nativeEvent && value.nativeEvent.data === "cancel") {
    } else {
      
      requestAddCard({
        data: {
          cardId: value.nativeEvent.data,
        },
      });

    }
  }

  return (
    <Overlay fullScreen animationType="fade" isVisible={modalAddCard} >
          <SafeAreaView
            style={{
              flex: 1,
              position: "absolute",
              width: Layout.window.width,
              marginTop: Platform.OS === "ios" ? 25 : 0
            }}
          >
            <View style={styles.header}>
              <TouchableOpacity
                onPress={onPressClose}
                style={{
                  flexDirection: "row",
                  padding: 10,
                  alignItems: 'center'
                }}
              >
                <Ionicons name="close-circle-outline" size={30} color="white" />
                <Text style={styles.textClose}>{i18n.t("home.close")}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ width: "100%", height: Layout.window.height }}>
              <WebView
                useWebKit
                mixedContentMode="always"
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                incognito={true}
                cacheEnabled={false}
                injectedJavaScript={injectedToHtml()}
                originWhitelist={['*']}
                source={{ uri: Config.OMISEADDCARD }}
                allowFileAccess
                allowUniversalAccessFromFileURLs
                scalesPageToFit
                style={{ flex: 1 }}
                onMessage={handleIdCard}
              />

            </View>
          </SafeAreaView>
        </Overlay>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    // height: Platform.OS === "ios" ? 35 : 55,
    backgroundColor: colors.main_color,
  },
  textClose: {
    color: colors.white,
    fontSize: 20,
    marginLeft: 10,
  },
  rowHomeType: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  homeType: {
    backgroundColor: colors.gray_light,
    borderRadius: 10,
    paddingVertical: 10,
    height: 90,
    width: 90,
    alignItems: "center",
  },
  selectHome: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 10,
  },
  textMultiLine:{
    height:100,
    backgroundColor:"white",
    borderRadius:15,
    padding:10,
    borderColor:colors.gray_light,
    borderWidth:1,
    shadowColor: '#3E3E3E',
		shadowOpacity: 0.2,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 3,
		elevation: 2,
  }
});
