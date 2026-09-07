import { HeaderBackButton } from "@react-navigation/elements";
import _, { isEmpty } from "lodash";
import moment from "moment";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Alert,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import {
  Button,
  Container,
  ListCardPayment,
  Loading,
  Text,
} from "../../../components";
import useApi from "../../../hooks/useApi";
import colors from "../../../shared/Colors";
import Constants from "../../../shared/Constants";
import Enum from "../../../shared/Enum";
import i18n from "../../../shared/I18n";
import { Option, Payment } from "../../ServiceScreen/component";
import Address from "../../ServiceScreen/component/Address";
import ResultPayment from "./ResultPayment";
import { Overlay } from "react-native-elements";
import WebView from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { AddFixPlan } from "..";
import Layout from "../../../shared/Layout";
const { width } = Dimensions.get("window");

export default function PickAddress(props: any) {
  const childRef = React.useRef<any>(null);

  const navigation = props.navigation;
  const { serviceId, serviceItemId, serviceType, serviceName } =
    props.route.params;
  const [currentStep, setCurrentStep] = useState(0);
  const [showAddress, setShowAddress] = useState(false);
  const [salePrice, setSalePrice] = useState(0);
  const [priceModel, setPriceModel] = useState<any>();
  const [salePriceModel, setSalePriceModel] = useState<any>();
  const [extraService, setExtraService] = useState<any[]>([]);
  const [idPreferLanguge, setIdPreferLanguge] = useState({
    label: "",
    value: "",
  });
  const [times, setTimes] = useState<any[]>([]);
  const [preferLanguge, setPreferLanguge] = useState<any[]>([]);
  const [dataAddress, setDataAddress] = useState<any>();
  const [idSpecifyHelper, setIdSpecifyHelper] = useState<any>({});
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [isCreditCard, setIsCreditCard] = useState(true);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  // const [isShowModal, setIsShowModal] = useState(false);
  // const [orderId, setOrderId] = useState<string | null>();
  const [activitiesPetCare, setActivitiesPetCare] = useState("");

  const [addPriceSpecifyHelper, setAddPriceSpecifyHelper] = useState(true);
  const [addPricePreferLanguage, setAddPricePreferLanguage] = useState(true);
  const [numberPet, setNumberPet] = React.useState(0);
  const [ageKid, setAgeKid] = useState("5");
  const [numberKids, setNumberKids] = React.useState<{
    numberKids: number;
    age: number[];
  }>({
    numberKids: 0,
    age: [0],
  });
  const [idCard, setIdCard] = useState<any>("");

  const [promotionId, setPromotionId] = useState("");

  const [pointApply, setPointApply] = useState(0);
  const [receivePoint, setReceivePoint] = useState(0);

  const [price, setPrice] = useState(0);
  const [steps, setSteps] = useState([
    {
      step: 0,
      label: i18n.t("home.service"),
      icon: (
        <Ionicons
          style={styles.spaceIcon}
          name="reader-outline"
          size={24}
          color="black"
        />
      ),
      iconPass: (
        <Ionicons
          style={styles.spaceIcon}
          name="reader-outline"
          size={24}
          color={colors.main_color}
        />
      ),
    },
    {
      step: 1,
      label: i18n.t("home.address"),
      icon: (
        <Ionicons
          style={styles.spaceIcon}
          name="location-sharp"
          size={24}
          color="black"
        />
      ),
      iconPass: (
        <Ionicons
          style={styles.spaceIcon}
          name="location-sharp"
          size={24}
          color={colors.main_color}
        />
      ),
    },
    {
      step: 2,
      label: i18n.t("home.option"),
      icon: (
        <Ionicons
          style={styles.spaceIcon}
          name="ellipsis-horizontal"
          size={24}
          color="black"
        />
      ),
      iconPass: (
        <Ionicons
          style={styles.spaceIcon}
          name="ellipsis-horizontal"
          size={24}
          color={colors.main_color}
        />
      ),
    },
    {
      step: 3,
      label: i18n.t("home.payment"),
      icon: (
        <Ionicons
          style={styles.spaceIcon}
          name="id-card-outline"
          size={24}
          color="black"
        />
      ),
      iconPass: (
        <Ionicons
          style={styles.spaceIcon}
          name="id-card-outline"
          size={24}
          color={colors.main_color}
        />
      ),
    },
  ]);
  const [loadingServiceDetail, requestServiceDetail] = useApi({
    method: "get",
    url: Constants.API.services_management_item,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        const items = JSON.parse(response.extraService) || [];

        const dataExtraService: any = _.map(items, (item) => {
          item.isCheck = false;
          if (item.perHour > 0 && item.perTime == 0) {
            item.price =
              _.sum(getMoreItems().map((x: any) => x.hour)) * item.perHour;
          }

          if (item.perHour == 0 && item.perTime > 0) {
            item.price = getMoreItems().length * item.perTime;
          }

          return item;
        });

        setExtraService(dataExtraService);
      }
    },
  });

  const [loadingPreferLanguage, requestPreferLanguage] = useApi({
    method: "get",
    url: Constants.API.languages,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        const items = response.items.map((x: any) => ({
          label: x.name,
          value: x.code,
        }));

        setPreferLanguge(items);
      }
    },
  });
  const [loadingPrice, requestPrice] = useApi({
    method: "get",
    url: Constants.API.config_price,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      if (response.items && response.items[0].pricesModel) {
        let priceModel = JSON.parse(response.items[0].pricesModel);
        setPriceModel(priceModel);
      }
    },
  });
  const [loadingConfigPrice, requestConfigPrice] = useApi({
    method: "get",
    url: Constants.API.config_price_subscription,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        const cfgPrice = _.find(response.items, { serviceType: serviceType });
        const priceModel = JSON.parse(cfgPrice.pricesModel);
        setSalePriceModel(priceModel);
      }
    },
  });

  const [loadingRequestOrder, requestOrder] = useApi({
    method: "post",
    url: Constants.API.order_fix_plan_maid,
    callback: ({ error, response }) => {
      if (error) {
        setTimeout(() => {
          Alert.alert(i18n.t("auth.error"), error);
        }, 200);
        return;
      }
      setIsOrderSuccess(true);
      // if (_.isString(response)) {
      //   requestCharges({
      //     data: {
      //       orderId: response,
      //       cardId: idCard,
      //     },
      //   });
      // }
    },
  });

  // const [loadingCancelPayment, requestCancelPayment] = useApi({
  //   method: "post",
  //   url: Constants.API.orders_cancel,
  //   callback: ({ error, response }) => {
  //     if (error) {
  //       Alert.alert(i18n.t("auth.error"), error);
  //     }
  //   },
  // });

  const [loadingCharges, requestCharges] = useApi({
    method: "post",
    url: Constants.API.chargesplan,
    callback: ({ error, response }) => {
      if (error) {
        setTimeout(() => {
          Alert.alert(i18n.t("auth.error"), error);
        });
        return;
      }
      setIsOrderSuccess(true);
    },
  });
  const getPrice = () => {
    switch (serviceType) {
      case Enum.SERVICE_TYPE.MaidService:
        requestPrice({ params: { price: Enum.PRICES.MaidService } });
        break;
      case Enum.SERVICE_TYPE.NanyService:
        requestPrice({ params: { price: Enum.PRICES.NanyService } });
        break;
      case Enum.SERVICE_TYPE.ElderService:
        requestPrice({ params: { price: Enum.PRICES.ElderService } });
        break;
      case Enum.SERVICE_TYPE.PetcareService:
        requestPrice({ params: { price: Enum.PRICES.PetcareService } });
        break;
    }
  };

  const countPrice = () => {
    let totalHour = _.sum(getMoreItems().map((x: any) => x.hour));
    if (serviceType === Enum.SERVICE_TYPE.MaidService) {
      if (totalHour < 3) {
        setPrice(totalHour * priceModel.two);
      } else {
        setPrice(totalHour * priceModel.threePlus);
      }
    } else if (serviceType === Enum.SERVICE_TYPE.PetcareService) {
      if (totalHour < 3) {
        setPrice(totalHour * priceModel.two);
      } else {
        setPrice(totalHour * priceModel.threePlus);
      }
    } else if (serviceType === Enum.SERVICE_TYPE.NanyService) {
      if (totalHour < 3) {
        setPrice(totalHour * priceModel.two);
      } else {
        setPrice(totalHour * priceModel.threePlus);
      }
    } else if (serviceType === Enum.SERVICE_TYPE.ElderService) {
      setPrice(totalHour * priceModel.twoPlus);
    }

    salePriceModel.map((i: any, index: number) => {
      if (totalHour == 0) {
        setSalePrice(0);
        return;
      }
      if (serviceType !== 3) {
        if (totalHour <= 2 && index === 0) {
          setSalePrice(totalHour * priceModel.two * (1 - i.percent / 100));
          return;
        }
        if (totalHour >= i.fromHour && totalHour <= i.toHour) {
          setSalePrice(
            totalHour * priceModel.threePlus * (1 - i.percent / 100)
          );
          return;
        }
        if (totalHour >= i.toHour) {
          setSalePrice(
            totalHour * priceModel.threePlus * (1 - i.percent / 100)
          );
          return;
        }
      } else {
        if (totalHour < 2 && index === 0) {
          setSalePrice(totalHour * priceModel.twoPlus * (1 - i.percent / 100));
          return;
        }
        if (totalHour >= i.fromHour && totalHour <= i.toHour) {
          setSalePrice(totalHour * priceModel.twoPlus * (1 - i.percent / 100));
          return;
        }
        if (totalHour >= i.toHour) {
          setSalePrice(totalHour * priceModel.twoPlus * (1 - i.percent / 100));
          return;
        }
      }
    });
  };

  useEffect(() => {
    setShowAddress(true);
    requestServiceDetail({
      params: {
        id: serviceItemId,
      },
    });

    requestPreferLanguage({
      params: {
        limit: 650,
      },
    });
    getPrice();
    requestConfigPrice({
      params: {
        planType: Enum.PLAN_TYPE.FIX_PLAN,
      },
    });
  }, []);
  const getMoreItems = () => {
    const moreItems: any = [];
    function getDaysBooking(day: any) {
      let count = 0;
      let start = moment(day.startAt);
      let tmp = moment(start).clone().day(moment(day.startAt).day());
      if (tmp.isSameOrAfter(start, "d")) {
        moreItems.push({
          title: day.serviceName,
          startAt: moment(tmp),
          endAt: moment(tmp.clone().set({ hour: day.endAt.hour() })),
          hour: day.hour,
        });
      }
      while (tmp.add(7, "days") && count < 3) {
        count = count + 1;
        moreItems.push({
          title: day.serviceName,
          startAt: moment(tmp),
          endAt: moment(tmp.clone().set({ hour: day.endAt.hour() })),
          hour: day.hour,
        });
      }
      return moreItems;
    }
    times.map((i: any) => {
      getDaysBooking(i);
    });
    return moreItems;
  };
  const totalHour = _.sum(getMoreItems().map((x: any) => x.hour));

  useEffect(() => {
    if (!isEmpty(priceModel) && !isEmpty(salePriceModel)) {
      countPrice();
    }
  }, [totalHour, priceModel, salePriceModel]);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: ({ ...props }) => (
        <View
          style={{
            backgroundColor: colors.main_color,
            flex: 1,
            width: width,
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (isOrderSuccess) {
                navigation.pop(3);
              } else if (currentStep >= 1) {
                if (currentStep == 1) {
                  setNumberKids({ numberKids: 0, age: [0] });
                  setNumberPet(0);
                }
                setCurrentStep(currentStep - 1);
              } else {
                navigation.goBack();
              }
            }}
          >
            <Ionicons
              style={{ marginLeft: 12 }}
              name="arrow-back"
              size={26}
              color="white"
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, currentStep, isOrderSuccess]);

  const onPressNext = () => {
    if (currentStep == 1 && _.isNil(dataAddress)) {
      Alert.alert(i18n.t("address.please_pick_your_address"));
      return;
    }
    if (currentStep == 0 && (serviceType == 2 || serviceType == 3)) {
      if (isEmpty(ageKid)) {
        Alert.alert(i18n.t("home.select_age"));
        return;
      }
    }
    if (currentStep == 2 && serviceType == 2) {
      if (numberKids.numberKids > 0 && numberKids.age.includes(0)) {
        Alert.alert(i18n.t("home.select_age"));
        return;
      }
    }
    if (currentStep === 2 && serviceType == 5) {
      if (extraService && !extraService.length) {
        Alert.alert(i18n.t("auth.error"), i18n.t("home.petcare_empty"));
        return;
      }
      if (!activitiesPetCare) {
        Alert.alert(i18n.t("auth.error"), i18n.t("home.activities_empty"));
        return;
      }
    }
    if (times.length == 0) {
      Alert.alert(i18n.t("plan.valid_times"));
      return;
    }
    if (currentStep == 3) {
      if (!idCard && isCreditCard) {
        childRef.current.openModalListCard();
        return;
      }

      let url;

      switch (serviceType) {
        case Enum.SERVICE_TYPE.MaidService:
          url = Constants.API.order_fix_plan_maid;
          break;
        case Enum.SERVICE_TYPE.NanyService:
          url = Constants.API.order_fix_plan_nanny;
          break;
        case Enum.SERVICE_TYPE.ElderService:
          url = Constants.API.order_fix_plan_elder;
          break;
        default:
          url = Constants.API.order_fix_plan_petcare;
          break;
      }
      const paramOrder = {
        serviceId,
        bookingDetail: {
          age: ageKid,
          language: idPreferLanguge.value,
          specialHelper: idSpecifyHelper.id,
          ...(serviceType != 5 && {
            extraServices:
              serviceType == 2
                ? [numberKids]
                : extraService
                    .filter((x: any) => x.isCheck == true)
                    .map((x) =>
                      _.pick(x, ["name", "description", "perHour", "perTime"])
                    ),
          }),
          ...(serviceType == 5 && {
            petProfiles: extraService,
            activity: activitiesPetCare,
          }),
          serviceType,
          numberExtraPet: numberPet,
          cardId: idCard,
        },
        customerInfo: {
          addressId: dataAddress.id,
        },
        dateOrder: _.map(getMoreItems(), (x) => ({
          bookingDate: x.startAt,
          bookingHour: x.endAt,
        })),
        point: pointApply,
        promotionId: promotionId,
        paymentMethodId: paymentMethodId,
      };
      requestOrder({
        url,
        data: paramOrder,
      });

      return;
    }

    setCurrentStep(currentStep + 1);
  };
  const handleAddress = (data: any) => {
    setDataAddress(data);
  };

  const handleIdPreferLanguge = (value: any) => {
    setIdPreferLanguge(value);
  };

  const handlePriceEnglish = (value: any) => {};

  const handleIdSpecifyHelper = (data: any) => {
    setIdSpecifyHelper(data);
  };

  const handlePriceExtraService = (value: any, type: any) => {
    if (value) {
      if (type === "plus") {
        if (serviceType == 2) {
          setPrice(price + value * getMoreItems().length);
          setSalePrice(salePrice + value * getMoreItems().length);
        } else {
          setPrice(price + value);
          setSalePrice(salePrice + value);
        }
      } else if (type === "minus") {
        setPrice(price - value);
        setSalePrice(salePrice - value);
      }
    }
  };

  const handlePriceCleaning = (data: any) => {};

  const handleProfilePet = (dataProfile: any, activities: string) => {
    setExtraService(dataProfile);
    setActivitiesPetCare(activities);
  };

  const handlePaymentMethod = (value: string, type: boolean) => {
    setPaymentMethodId(value);
    setIsCreditCard(true);
  };

  const handleDiscountPrice = (
    valueDiscount: any,
    isDiscount: boolean,
    point: number
  ) => {
    if (isDiscount) {
      setPointApply(point);
      setPrice(Number((price - valueDiscount).toFixed(2)));
      setSalePrice(Number((salePrice - valueDiscount).toFixed(2)));
    } else {
      setPointApply(0);
      setPrice(Number((price + valueDiscount).toFixed(2)));
      setSalePrice(Number((salePrice + valueDiscount).toFixed(2)));
    }
  };

  const handleReceivePoint = (value: number) => {
    setReceivePoint(receivePoint + value);
  };

  const handlePromotionId = (value: string) => {
    setPromotionId(value);
  };

  const onPressToHome = () => {
    navigation.pop(3);
  };

  // const handleCloseModalCreditCard = (value: any) => {
  //   // setIsShowModal(false);

  //   if (value.nativeEvent && value.nativeEvent.data === "cancel") {
  //     // requestCancelPayment({
  //     //   data: {
  //     //     id: order.orderDetailId,
  //     //     reason: "CANCEL_PAYMENT_WITH_CREDIT_CARD",
  //     //   },
  //     // });

  //     return;
  //   }

  //   setIsOrderSuccess(true);

  //   requestCharges({
  //     data: {
  //       orderId,
  //       cardId: idCard,
  //     },
  //   });
  // };

  const handleIdCard = (cardSelected: any) => {
    if (cardSelected) {
      setIdCard(cardSelected);
    }
  };

  const handlePriceSpecifyHelper = (value: any, isCheck: boolean) => {
    const priceSpecifyHelper = value * getMoreItems().length;
    if (isCheck) {
      if (addPriceSpecifyHelper) {
        setPrice(price + priceSpecifyHelper);
        setSalePrice(salePrice + priceSpecifyHelper);
        setAddPriceSpecifyHelper(false);
      }
    } else {
      setPrice(price - priceSpecifyHelper);
      setSalePrice(salePrice - priceSpecifyHelper);
      setAddPriceSpecifyHelper(true);
    }
  };

  const handlePricePreferLanguage = (value: any, isCheck: boolean) => {
    const pricePreferLanguage = value * getMoreItems().length;
    if (isCheck) {
      if (addPricePreferLanguage) {
        setPrice(price + pricePreferLanguage);
        setAddPricePreferLanguage(false);
      }
    } else {
      setPrice(price - pricePreferLanguage);
      setAddPricePreferLanguage(true);
    }
  };

  const injectedToHtml = (price: number) => {
    const configPrice = price * 100;

    return `
      OmiseCard.open({
        amount: ${Math.round(configPrice)},
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

  const toStep = (step: number) => {
    setPointApply(0);
    setCurrentStep(step);
    if (step < 3) {
      setNumberKids({ numberKids: 0, age: [0] });
      setNumberPet(0);
    }
    if (serviceType === Enum.SERVICE_TYPE.MaidService) {
      requestConfigPrice({ params: { price: Enum.PRICES.MaidService } });
    } else if (serviceType === Enum.SERVICE_TYPE.NanyService) {
      requestConfigPrice({ params: { price: Enum.PRICES.NanyService } });
    } else if (serviceType === Enum.SERVICE_TYPE.ElderService) {
      requestConfigPrice({ params: { price: Enum.PRICES.ElderService } });
    }
  };

  return (
    <Container>
      <Loading loading={loadingRequestOrder || loadingCharges} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", width: "100%", marginTop: 16 }}>
          {steps.map((label, i) => (
            <View key={i} style={{ alignItems: "center", width: "25%" }}>
              {i > currentStep && i != currentStep && (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: Layout.window.width < 390 ? 20 : 35,
                    height: 30,
                    borderColor: "#814085",
                    borderRadius: 15,
                    marginBottom: 10,
                  }}
                >
                  <View style={styles.borderIcon}>{label.icon}</View>
                  {i !== 0 ? <View style={styles.line} /> : null}
                </View>
              )}
              {/* after select */}
              {i < currentStep && (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: Layout.window.width < 390 ? 20 : 35,
                    height: 30,
                    borderColor: "#814085",
                    borderRadius: 15,
                    marginBottom: 10,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => currentStep != 4 && toStep(label.step)}
                  >
                    <View style={styles.borderIconPass}>{label.iconPass}</View>
                  </TouchableOpacity>
                  {i !== 0 ? <View style={styles.lineSelect} /> : null}
                </View>
              )}
              {/* selected */}
              {i == currentStep && (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: Layout.window.width < 390 ? 20 : 35,
                    height: 30,
                    borderColor: "#814085",
                    borderRadius: 15,
                    marginBottom: 10,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => currentStep != 4 && toStep(label.step)}
                  >
                    <View style={styles.borderIconPass}>{label.iconPass}</View>
                  </TouchableOpacity>
                  {i !== 0 ? <View style={styles.lineSelect} /> : null}
                </View>
              )}
              <Text style={{ fontSize: 12 }}>{label.label}</Text>
            </View>
          ))}
        </View>
      
        {currentStep == 0 && (
          <AddFixPlan
            serviceId={serviceId}
            serviceItemId={serviceItemId}
            serviceType={serviceType}
            serviceName={serviceName}
            setTimes={setTimes}
            times={times}
            ageKid={ageKid}
            onSetAgeKid={(text: string) => setAgeKid(text)}
            countPrice={countPrice}
            priceModel={priceModel}
            salePriceModel={salePriceModel}
          />
        )}
        
        {showAddress && currentStep == 1 && (
          <Address
            type={serviceType}
            currentAddressId={dataAddress && dataAddress.id}
            navigation={props.navigation}
            handleAddress={handleAddress}
          />
        )}
        {currentStep == 2 && (
          <Option
            times={getMoreItems()}
            type={serviceType}
            valueShowHour={totalHour}
            fixplanTimes={_.map(getMoreItems(), (x) => ({
              bookingDate: x.startAt,
              bookingHour: x.endAt,
            }))}
            numberKids={numberKids}
            onSelectNumberKid={setNumberKids}
            numberPet={numberPet}
            onSelectNumberPet={setNumberPet}
            extraService={extraService}
            preferLanguage={preferLanguge}
            valuePreferLanguage={idPreferLanguge}
            handleIdPreferLanguge={handleIdPreferLanguge}
            valueSpecialHelper={idSpecifyHelper}
            startTime={moment().format("MM/DD/YYYY HH:mm:ss")}
            endTime={moment().format("MM/DD/YYYY HH:mm:ss")}
            idAddress={dataAddress}
            extraServiceCleaning={extraService}
            activitiesPetCare={activitiesPetCare}
            handlePriceEnglish={handlePriceEnglish}
            handleIdSpecifyHelper={handleIdSpecifyHelper}
            handlePriceExtraService={handlePriceExtraService}
            handlePriceCleaning={handlePriceCleaning}
            handleProfilePet={handleProfilePet}
            handlePriceSpecifyHelper={handlePriceSpecifyHelper}
            handlePricePreferLanguage={handlePricePreferLanguage}
          />
        )}
        {currentStep == 3 && !isOrderSuccess && (
          <View style={{ flex: 1 }}>
            <ScrollView>
              <Payment
                type={serviceType}
                price={Math.ceil(salePrice)}
                point={pointApply}
                nameServiceType={serviceName}
                times={times}
                extraService={extraService}
                idAddress={dataAddress}
                handleDiscountPrice={handleDiscountPrice}
                handlePaymentMethod={handlePaymentMethod}
                handleReceivePoint={handleReceivePoint}
                handlePromotionId={handlePromotionId}
                onlyCreditCard={true}
                onPressSubscriptionPlan={() => {
                  props.navigation.push(
                    Constants.SCREENS.SUBSCRIPTION.AllSubscriptionPlan
                  );
                }}
              />
              {/* <Overlay fullScreen animationType="fade" isVisible={isShowModal}>
                <WebView
                  useWebKit
                  mixedContentMode="always"
                  javaScriptEnabled
                  domStorageEnabled
                  startInLoadingState
                  injectedJavaScript={injectedToHtml(price)}
                  originWhitelist={["*"]}
                  source={{ uri: Constants.OMISELINK }}
                  allowFileAccess
                  allowUniversalAccessFromFileURLs
                  scalesPageToFit
                  style={{ flex: 1, marginTop: 16 }}
                  onMessage={handleCloseModalCreditCard}
                />
              </Overlay> */}
            </ScrollView>
            <ListCardPayment
              children={childRef}
              navigation={props.navigation}
              handleIdCard={handleIdCard}
            />
          </View>
        )}
        {isOrderSuccess && currentStep > 2 ? (
          <View style={{ flex: 1, padding: 16 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ResultPayment
                valueShowHour={totalHour}
                times={times}
                address={dataAddress}
                receivePoint={receivePoint}
                nameServiceType={serviceName}
              />
              <View>
                <Button onPress={onPressToHome}>
                  <Text>{i18n.t("plan.back_to_home")}</Text>
                </Button>
              </View>
            </ScrollView>
          </View>
        ) : (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.white,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18 }}>{i18n.t("plan.total")} {times.length * 4} {i18n.t("home.times")}</Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingRight: "10%",
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: colors.red,
                  }}
                >
                  THB {salePrice > 0 ? Math.ceil(salePrice) : 0}
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    textDecorationLine: "line-through",
                  }}
                >
                  THB {price > 0 ? Math.ceil(price) : 0}
                </Text>
              </View>
            </View>
            <View style={{ width: "36%" }}>
              <Button style={{ borderRadius: 10 }} onPress={onPressNext}>
                {currentStep == 3 ? (
                  !idCard ? (
                    <Text>{i18n.t("home.select_card")}</Text>
                  ) : (
                    <Text>{i18n.t("home.payment")}</Text>
                  )
                ) : (
                  <Text>{i18n.t("auth.next")}</Text>
                )}
              </Button>
            </View>
          </View>
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  spaceIcon: {
    paddingTop: 6,
    paddingLeft: 7,
  },
  borderIcon: {
    borderWidth: 1,
    borderRadius: 20,
    borderColor: "black",
    height: 40,
    width: 40,
  },
  borderIconPass: {
    borderWidth: 1,
    borderRadius: 20,
    borderColor: colors.main_color,
    height: 40,
    width: 40,
  },
  line: {
    left: -60,
    height: 2,
    backgroundColor: "black",
    width: 50,
    position: "absolute",
    top: 12,
    zIndex: 10,
  },
  lineSelect: {
    left: -60,
    height: 2,
    backgroundColor: colors.main_color,
    width: 50,
    position: "absolute",
    top: 12,
    zIndex: 10,
  },
});
