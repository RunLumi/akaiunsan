import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Alert,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { useSelector } from "react-redux";
import {
  Container,
  Text,
  Button,
  Loading,
  ListCardPayment,
} from "../../components";
import Constants from "../../shared/Constants";
import colors from "../../shared/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Services, Address, Option, Payment, Result } from "./component";
import i18n from "../../shared/I18n";
import useApi from "../../hooks/useApi";
import Enum from "../../shared/Enum";
import { WebView } from "react-native-webview";
import { Overlay } from "react-native-elements";
import moment from "moment";
import Layout from "../../shared/Layout";
import _, { isEmpty, times } from "lodash";
import analytics from "@react-native-firebase/analytics";
import Config from "react-native-config";

export default function Service(props: any) {
  const childRef = React.useRef<any>(null);
  const params = props.route.params || {};
  const apiOrder =
    params.data.serviceType === Enum.SERVICE_TYPE.MaidService
      ? Constants.API.orders_maid
      : params.data.serviceType === Enum.SERVICE_TYPE.NanyService
      ? Constants.API.orders_nany
      : params.data.serviceType === Enum.SERVICE_TYPE.ElderService
      ? Constants.API.orders_elder
      : params.data.serviceType === Enum.SERVICE_TYPE.CleaningService
      ? Constants.API.orders_ac_cleaning
      : Constants.API.orders_petcare;
  const fromThread = params?.fromThread

  const [disabledNext, setDisableNext] = useState(true);
  const [idCard, setIdCard] = useState("");
  const [dataAddress, setDataAddress] = useState<any>();
  const [valueShowHour, setValueShowHour] = useState(0);
  const [valueShowDateTime, setValueShowDateTime] = useState(
    i18n.t("home.select_date_time")
  );
  const [price, setPrice] = useState(0);
  const [priceLanguage, setPriceLanguage] = useState(0);
  const [priceHelper, setPriceHelper] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ageKid, setAgeKid] = useState("");
  const [numberPet, setNumberPet] = React.useState(0);
  const [numberKids, setNumberKids] = React.useState<{
    numberKids: number;
    age: number[];
  }>({
    numberKids: 0,
    age: [0],
  });
  const [two, setTwo] = useState(0);
  const [threePlus, setThreePlus] = useState(0);
  const [idSpecifyHelper, setIdSpecifyHelper] = useState<any>({});
  const [twoPlus, setTwoPlus] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [extraService, setExtraService] = useState<any[]>([]);
  const [pointApply, setPointApply] = useState(0);
  const [receivePoint, setReceivePoint] = useState(0);

  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [promotionId, setPromotionId] = useState("");
  const [modalCreditCard, setModalCreditCard] = useState({
    isModal: false,
    idOrder: "",
  });
  const [isCreditCard, setIsCreditCard] = useState(false);
  const [addPriceSpecifyHelper, setAddPriceSpecifyHelper] = useState(true);
  const [addPricePreferLanguage, setAddPricePreferLanguage] = useState(true);
  const [activitiesPetCare, setActivitiesPetCare] = useState("");
  const [loadingServiceDetail, requestServiceDetail] = useApi({
    method: "get",
    url: Constants.API.services_management_item,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        // setServiceDetail(response.serviceDetail);
        let dataExtraService = JSON.parse(response.extraService) || [];
        for (let index = 0; index < dataExtraService.length; index++) {
          dataExtraService[index].isCheck = false;
          if (params.data?.serviceType === Enum.SERVICE_TYPE.CleaningService) {
            dataExtraService[index].price =
              1 * dataExtraService[index].pricePerUnit;
            dataExtraService[index].count = 1;
          }
        }
        setExtraService(dataExtraService);
      }
    },
  });
  const [loadingConfigPrice, requestConfigPrice] = useApi({
    method: "get",
    url: Constants.API.config_price,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        if (response.items && response.items[0].pricesModel) {
          let price = JSON.parse(response.items[0].pricesModel);
          if (
            response.items[0].serviceType ===
            params.subscriptionPlanActive?.serviceType
          ) {
            if (valueShowHour <= params.subscriptionPlanActive.hourRemain) {
              setPrice(0);
            } else {
              let currentHour =
                valueShowHour - params.subscriptionPlanActive.hourRemain;
              if (
                response.items[0].serviceType === Enum.SERVICE_TYPE.MaidService
              ) {
                if (currentHour < 3) {
                  setPrice(currentHour * price.two);
                } else {
                  setPrice(currentHour * price.threePlus);
                }
              } else if (
                response.items[0].serviceType === Enum.SERVICE_TYPE.NanyService
              ) {
                if (valueShowHour < 3) {
                  setPrice(
                    valueShowHour * price.two + numberKids.numberKids * 200
                  );
                } else {
                  setPrice(
                    valueShowHour * price.threePlus +
                      numberKids.numberKids * 200
                  );
                }
                setTwo(price.two);
                setThreePlus(price.threePlus);
              } else if (
                response.items[0].serviceType === Enum.SERVICE_TYPE.ElderService
              ) {
                setPrice(currentHour * price.twoPlus);
              } else if (
                response.items[0].serviceType ===
                Enum.SERVICE_TYPE.PetcareService
              ) {
                if (currentHour < 3) {
                  setPrice(currentHour * price.two);
                } else {
                  setPrice(currentHour * price.threePlus);
                }
              }
            }
          } else if (
            response.items[0].serviceType === Enum.SERVICE_TYPE.MaidService
          ) {
            if (valueShowHour < 3) {
              setPrice(valueShowHour * price.two);
            } else {
              setPrice(valueShowHour * price.threePlus);
            }
            setTwo(price.two);
            setThreePlus(price.threePlus);
          } else if (
            response.items[0].serviceType === Enum.SERVICE_TYPE.NanyService
          ) {
            if (valueShowHour < 3) {
              setPrice(valueShowHour * price.two);
            } else {
              setPrice(valueShowHour * price.threePlus);
            }
            setTwo(price.two);
            setThreePlus(price.threePlus);
          } else if (
            response.items[0].serviceType === Enum.SERVICE_TYPE.ElderService
          ) {
            setPrice(valueShowHour * price.twoPlus);
            setTwoPlus(price.twoPlus);
          } else if (
            response.items[0].serviceType === Enum.SERVICE_TYPE.PetcareService
          ) {
            if (valueShowHour < 3) {
              setPrice(valueShowHour * price.two + numberPet * 200);
            } else {
              setPrice(valueShowHour * price.threePlus + numberPet * 200);
            }
            setTwo(price.two);
            setThreePlus(price.threePlus);
          }
        }
      }
    },
  });
  const [loadingOrder, requestOrder] = useApi({
    method: "post",
    url: apiOrder,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        setCurrentStep(currentStep + 1);
      }
      setLoading(false);
    },
  });
  const [loadingPaymentPetcare, requestPaymentPetcare] = useApi({
    method: "post",
    url: Constants.API.payment_petcare,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        Alert.alert(
          i18n.t("home.payment"),
          i18n.t("home.update_successfully"),
          [
            {
              text: "OK",
              onPress: () => {
                props.navigation.goBack();
              },
            },
          ]
        );
      }
    },
  });
  const [loadingCharges, requestCharges] = useApi({
    method: "post",
    url: Constants.API.charges,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        if (!_.isNil(params.data.order)) {
          requestPaymentPetcare({
            data: {
              id: modalCreditCard.idOrder,
              amount: params.data?.order?.totalPrice || 0,
              voucherCode: promotionId,
              point: pointApply,
              paymentMethod: "PAYMENT_METHOD_CREDIT_CARD",
            },
          });
        } else {
          setCurrentStep(currentStep + 1);
        }
      }
    },
  });
  const [loadingChargesCard, requestChargesCard] = useApi({
    method: "post",
    url: Constants.API.chargescard,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        // if (!_.isNil(params.data.order)) {
        //   requestPaymentPetcare({
        //     data: {
        //       id: modalCreditCard.idOrder,
        //       amount: params.data.order.totalPrice || 0,
        //       voucherCode: promotionId,
        //       point: pointApply,
        //       paymentMethod: "PAYMENT_METHOD_CREDIT_CARD",
        //     },
        //   });
        // } else {
        setCurrentStep(currentStep + 1);
        // }
      }
    },
  });
  const [loadingCancelPayment, requestCancelPayment] = useApi({
    method: "post",
    url: Constants.API.orders_cancel,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
    },
  });
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
  const [currentStep, setCurrentStep] = useState(0);
  const user = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);
  const handleHour = (value: number) => {
    if (value) {
      if (
        params.data.serviceType === params.subscriptionPlanActive?.serviceType
      ) {
        if (value <= params.subscriptionPlanActive.hourRemain) {
          setPrice(0);
        } else {
          let currentHour = value - params.subscriptionPlanActive.hourRemain;
          if (params.data.serviceType === Enum.SERVICE_TYPE.MaidService) {
            if (currentHour < 3) {
              setPrice(currentHour * two);
            } else {
              setPrice(currentHour * threePlus);
            }
          } else if (
            params.data.serviceType === Enum.SERVICE_TYPE.NanyService
          ) {
            if (currentHour < 3) {
              setPrice(currentHour * two + numberKids.numberKids * 200);
            } else {
              setPrice(currentHour * threePlus + numberKids.numberKids * 200);
            }
          } else if (
            params.data.serviceType === Enum.SERVICE_TYPE.ElderService
          ) {
            setPrice(currentHour * twoPlus);
          } else if (
            params.data.serviceType === Enum.SERVICE_TYPE.PetcareService
          ) {
            if (currentHour < 3) {
              setPrice(currentHour * two + numberPet * 200);
            } else {
              setPrice(currentHour * threePlus + numberPet * 200);
            }
          }
        }
      } else {
        if (params.data.serviceType === Enum.SERVICE_TYPE.MaidService) {
          if (value < 3) {
            setPrice(value * two);
          } else {
            setPrice(value * threePlus);
          }
        } else if (params.data.serviceType === Enum.SERVICE_TYPE.NanyService) {
          if (value < 3) {
            setPrice(value * two + numberKids.numberKids * 200);
          } else {
            setPrice(value * threePlus + numberKids.numberKids * 200);
          }
        } else if (params.data.serviceType === Enum.SERVICE_TYPE.ElderService) {
          setPrice(value * twoPlus);
        } else if (
          params.data.serviceType === Enum.SERVICE_TYPE.PetcareService
        ) {
          if (value < 3) {
            setPrice(value * two + numberPet * 200);
          } else {
            setPrice(value * threePlus + numberPet * 200);
          }
        }
      }
      setValueShowHour(value);
    }
  };
  const handleDateTime = (
    valueDate: any,
    valueTime: any,
    hour: any,
    showDateTime: any
  ) => {
    if (valueDate) {
      setDisableNext(false);
      let getValue = `${valueDate} ${valueTime}`;
      let valueStartTime = moment(getValue).format("MM/DD/YYYY HH:mm:ss");
      let valueEndtime = "";
      if (hour) {
        valueEndtime = moment(valueStartTime)
          .add(hour, "hours")
          .format("MM/DD/YYYY HH:mm:ss");
      }
      setStartTime(valueStartTime);
      setEndTime(valueEndtime);
      setValueShowDateTime(showDateTime);
    } else {
      setDisableNext(true);
    }
  };

  const handlePriceExtraService = (value: any, type: any) => {
    if (value) {
      if (type === "plus") {
        setPrice(price + value);
      } else if (type === "minus") {
        setPrice(price - value);
      }
    }
  };
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
  const handleAddress = (data: any) => {
    setDataAddress(data);
    setDisableNext(false);
  };
  const handleIdSpecifyHelper = (data: any) => {
    setIdSpecifyHelper(data);
  };
  const handlePriceEnglish = (value: any) => {
    setPrice(value);
  };
  // const handleIdPreferLanguge = (value: any) => {
  //   setIdPreferLanguge(value);
  // };
  const handlePaymentMethod = (value: string, type: boolean) => {
    setPaymentMethodId(value);
    setIsCreditCard(type);
  };
  const handleProfilePet = (dataProfile: any, activities: string) => {
    setExtraService(dataProfile);
    setActivitiesPetCare(activities);
  };
  const handleReceivePoint = (value: number) => {
    setReceivePoint(receivePoint + value);
  };
  const handlePromotionId = (value: string) => {
    setPromotionId(value);
  };
  const handlePriceSpecifyHelper = (value: any, isCheck: boolean) => {
    if (isCheck) {
      if (addPriceSpecifyHelper) {
        setPriceHelper(value);
        setPrice(price + value);
        setAddPriceSpecifyHelper(false);
      }
    } else {
      setPriceHelper(0);
      setPrice(price - value);
      setAddPriceSpecifyHelper(true);
    }
  };
  const handlePricePreferLanguage = (value: any, isCheck: boolean) => {
    if (isCheck) {
      if (addPricePreferLanguage) {
        setPriceLanguage(value);
        setPrice(price + value);
        setAddPricePreferLanguage(false);
      }
    } else {
      setPriceLanguage(0);
      setPrice(price - value);
      setAddPricePreferLanguage(true);
    }
  };
  const handlePriceCleaning = (data: any) => {
    let priceCleaning = 0;
    for (let index = 0; index < data.length; index++) {
      if (data[index].isCheck) {
        priceCleaning += data[index].price;
      }
    }
    setPrice(priceCleaning);
  };

  useEffect(() => {
    if (!user || !token) {
      props.navigation.replace(Constants.SCREENS.AUTH.LOGIN);
    }
    requestServiceDetail({ params: { id: params.data?.serviceItemId } });
    if (params.data) {
      switch (params.data.serviceType) {
        case Enum.SERVICE_TYPE.MaidService:
          requestConfigPrice({ params: { price: Enum.PRICES.MaidService } });
          break;
        case Enum.SERVICE_TYPE.PetcareService:
          requestConfigPrice({ params: { price: Enum.PRICES.PetcareService } });
          break;
        case Enum.SERVICE_TYPE.NanyService:
          requestConfigPrice({ params: { price: Enum.PRICES.NanyService } });
          break;
        case Enum.SERVICE_TYPE.ElderService:
          requestConfigPrice({ params: { price: Enum.PRICES.ElderService } });
          break;
      }
    }

    if (params.data?.order) {
      setCurrentStep(3);
      setDisableNext(false);
    }
  }, [user, token]);
  useEffect(() => {
    let priceCurrent = price;
    if (currentStep === 1) {
      if (!dataAddress) {
        setDisableNext(true);
      }
    }
    if (params.data.serviceType != Enum.SERVICE_TYPE.CleaningService) {
      if (currentStep === 0 || currentStep === 1 || currentStep === 2) {
        for (let index = 0; index < extraService.length; index++) {
          if (extraService[index].isCheck) {
            priceCurrent = priceCurrent - extraService[index].price;
            extraService[index].isCheck = false;
          }
        }
        setIdSpecifyHelper({ id: "", name: "", old: "", star: 0, image: "" });
        // setIdPreferLanguge({ value: "", label: "" });
        setPrice(priceCurrent - priceLanguage - priceHelper);
        setPriceLanguage(0);
        setPriceHelper(0);
        setAddPriceSpecifyHelper(true);
        setAddPricePreferLanguage(true);
      }
    } else if (params.data.serviceType === Enum.SERVICE_TYPE.CleaningService) {
      if (currentStep === 0 || currentStep === 1) {
        for (let index = 0; index < extraService.length; index++) {
          extraService[index].isCheck = false;
          extraService[index].count = 1;
        }
        setPrice(0);
      }
    }
    const backHandlerSubscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackButtonClick
    );
    return () => {
      backHandlerSubscription.remove();
    };
  }, [currentStep]);
  const handleBackButtonClick = () => {
    if (currentStep != 0) {
      toStep(currentStep - 1);
    } else {
      props.navigation.navigate(Constants.SCREENS.MAIN.BOTTOM_BAR);
    }
    return true;
  };

  const onNextStep = async () => {
    const notUndefined = (anyValue: any) => typeof anyValue !== "undefined";
    let paramOrder: any = {
      serviceId: fromThread === 'favorite-service-thread' ? params.data.serviceId : params.data.id,
      bookingDetail: {
        bookingDate: moment(startTime).toISOString(),
        bookingHour: moment(endTime).toISOString(),
        // language: idPreferLanguge.value,
        specialHelper: idSpecifyHelper.id,
        serviceType: params.data.serviceType,
        age: ageKid,
        cardId: isCreditCard ? idCard : "",
      },
      customerInfo: {
        addressId: (dataAddress && dataAddress.id) || "",
        address: (dataAddress && dataAddress.shortAddress) || "",
        district: (dataAddress && dataAddress.district) || "",
        city: (dataAddress && dataAddress.province) || "",
        phoneNumber: (dataAddress && dataAddress.phoneNumber) || "",
        roomOrFloor: (dataAddress && dataAddress.roomNo) || "",
        remark: (dataAddress && dataAddress.remark) || "",
        roomType: (dataAddress && dataAddress.roomType) || 0,
        bathrooms: (dataAddress && dataAddress.batchroomNo) || 0,
        bedRooms: (dataAddress && dataAddress.bedroomNo) || 0,
      },
      point: 0,
      paymentMethodId: "",
    };
    if (params.data.serviceType === Enum.SERVICE_TYPE.NanyService) {
      if (!ageKid) {
        Alert.alert(i18n.t("home.select_age"));
        return;
      }
      if (
        currentStep == 2 &&
        numberKids.numberKids > 0 &&
        numberKids.age.includes(0)
      ) {
        Alert.alert(i18n.t("home.select_age"));
        return;
      }
      paramOrder.bookingDetail.extraServices = [numberKids];
      // paramOrder.bookingDetail.extraServices = [
      //   {
      //     numberKids: 0,
      //     age: [0],
      //   },
      // ];
    } else if (params.data.serviceType === Enum.SERVICE_TYPE.MaidService) {
      paramOrder.bookingDetail.extraServices = extraService
        .map((x, idx) => {
          if (x.isCheck) {
            return {
              description: x.description,
              name: x.name,
              perHour: x.perHour,
              perTime: x.perTime,
            };
          }
        })
        .filter(notUndefined);
    } else if (params.data.serviceType === Enum.SERVICE_TYPE.ElderService) {
      if (isEmpty(ageKid)) {
        Alert.alert(i18n.t("home.patient_age"));
        return;
      }
      paramOrder.bookingDetail.extraServices = extraService
        .map((x, idx) => {
          if (x.isCheck) {
            return {
              description: x.description,
              name: x.name,
              perHour: x.perHour,
              perTime: x.perTime,
            };
          }
        })
        .filter(notUndefined);
    } else if (params.data.serviceType === Enum.SERVICE_TYPE.CleaningService) {
      paramOrder.bookingDetail.extraServices = extraService
        .map((x, idx) => {
          if (x.isCheck) {
            return {
              acType: x.acType,
              unit: x.count,
              pricePerUnit: x.pricePerUnit,
              pricePerMore: x.pricePerMore,
            };
          }
        })
        .filter(notUndefined);
    } else if (params.data.serviceType === Enum.SERVICE_TYPE.PetcareService) {
      if (currentStep === 2) {
        if (extraService && !extraService.length) {
          Alert.alert(i18n.t("auth.error"), i18n.t("home.petcare_empty"));
          return;
        }
        if (!activitiesPetCare) {
          Alert.alert(i18n.t("auth.error"), i18n.t("home.activities_empty"));
          return;
        }
      }
      paramOrder.bookingDetail.petProfiles = extraService;
      paramOrder.bookingDetail.activity = activitiesPetCare;
      paramOrder.bookingDetail.numberExtraPet = numberPet;
    }

    if (currentStep === 3) {
      paramOrder.point = pointApply;
      paramOrder.paymentMethodId = paymentMethodId;
      if (promotionId) {
        paramOrder.promotionId = promotionId;
      }
      if (!idCard && isCreditCard) {
        childRef.current.openModalListCard();
        return;
      }
      if (!params.data?.order && !loading) {
        setLoading(true);
        await requestOrder({ data: paramOrder });
        await analytics().logEvent("order", paramOrder);
      } else {
        if (!isCreditCard) {
          requestPaymentPetcare({
            data: {
              id: params.data?.order?.orderId,
              amount: params.data?.order?.totalPrice || 0,
              voucherCode: promotionId,
              point: pointApply,
              paymentMethod: "PAYMENT_METHOD_CASH",
            },
          });
        }
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };
  const handleCloseModalCrediCard = (value: any) => {
    if (value.nativeEvent && value.nativeEvent.data === "cancel") {
      setModalCreditCard({ ...modalCreditCard, isModal: false });

      requestCancelPayment({
        data: {
          id: modalCreditCard.idOrder,
          reason: "CANCEL_PAYMENT_WITH_CREDIT_CARD",
        },
      });
    } else {
      requestCharges({
        data: {
          orderId: modalCreditCard.idOrder,
          token: value.nativeEvent.data,
        },
      });

      setModalCreditCard({ ...modalCreditCard, isModal: false });
    }
  };

  const injectedToHtml = () => {
    let configPrice = price * 100;
    let injectedData = `
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
    return injectedData;
  };
  const handleIdCard = (cardSelected: any) => {
    if (cardSelected) {
      setIdCard(cardSelected);
    }
  };

  const toStep = (step: number) => {
    setPointApply(0);
    setCurrentStep(step);
    if (step < 2) {
      setNumberKids({ numberKids: 0, age: [0] });
      setNumberPet(0);
    }
    if (
      params.data &&
      params.data.serviceType === Enum.SERVICE_TYPE.MaidService
    ) {
      requestConfigPrice({ params: { price: Enum.PRICES.MaidService } });
    } else if (
      params.data &&
      params.data.serviceType === Enum.SERVICE_TYPE.NanyService
    ) {
      requestConfigPrice({ params: { price: Enum.PRICES.NanyService } });
    } else if (
      params.data &&
      params.data.serviceType === Enum.SERVICE_TYPE.ElderService
    ) {
      requestConfigPrice({ params: { price: Enum.PRICES.ElderService } });
    } else if (
      params.data &&
      params.data.serviceType === Enum.SERVICE_TYPE.PetcareService
    ) {
      requestConfigPrice({ params: { price: Enum.PRICES.PetcareService } });
    }
  };

  return (
    <View style={styles.container}>
      <Container style={styles.container}>
        <View style={[styles.containerHeader]}>
          <View style={{ marginLeft: 10 }}>
            {currentStep != 4 ? (
              <Ionicons
                onPress={() =>
                  currentStep === 0
                    ? props.navigation.navigate(
                        Constants.SCREENS.MAIN.BOTTOM_BAR
                      )
                    : toStep(currentStep - 1)
                }
                name="arrow-back"
                size={26}
                color="white"
              />
            ) : null}
          </View>
        </View>
        <View style={styles.container}>
          <Loading
            loading={
              loadingServiceDetail ||
              loadingConfigPrice ||
              loadingOrder ||
              loadingChargesCard
            }
          />
          <View
            style={{
              width: "100%",
              height: 70,
              marginTop: 20,
              // borderBottomWidth: 3,
              // borderBottomColor: colors.gray_hidden_text,
            }}
          >
            <View style={{ flexDirection: "row", width: "100%" }}>
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
                        <View style={styles.borderIconPass}>
                          {label.iconPass}
                        </View>
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
                        <View style={styles.borderIconPass}>
                          {label.iconPass}
                        </View>
                      </TouchableOpacity>
                      {i !== 0 ? <View style={styles.lineSelect} /> : null}
                    </View>
                  )}
                  <Text style={{ fontSize: 12 }}>{label.label}</Text>
                </View>
              ))}
            </View>
          </View>
          {currentStep === 0 && (
            <Services
              type={params.data?.serviceType}
              name={params.data?.serviceName}
              // detail={serviceDetail}
              onSetAgeKid={setAgeKid}
              ageKid={ageKid}
              valueShowDateTime={valueShowDateTime}
              valueShowHour={valueShowHour}
              handleHour={handleHour}
              handleDateTime={handleDateTime}
              onPressSubscriptionPlan={() => {
                props.navigation.push(
                  Constants.SCREENS.OTHER.ADDRESS_FIX_PLAN,
                  {
                    serviceId: params.data?.id,
                    serviceItemId: params.data?.serviceItemId,
                    serviceName: params.data?.serviceName,
                    serviceType: params.data?.serviceType,
                  }
                );
              }}
            />
          )}
          {currentStep === 1 && (
            <Address
              type={params.data?.serviceType}
              navigation={props.navigation}
              handleAddress={handleAddress}
            />
          )}
          {currentStep === 2 && (
            <Option
              times={[1]}
              subscriptionPlan={params.subscriptionPlanActive}
              type={params.data?.serviceType}
              valueShowHour={valueShowHour}
              extraService={extraService}
              // handleIdPreferLanguge={handleIdPreferLanguge}
              startTime={startTime}
              endTime={endTime}
              idAddress={dataAddress}
              numberKids={numberKids}
              onSelectNumberKid={setNumberKids}
              numberPet={numberPet}
              onSelectNumberPet={setNumberPet}
              extraServiceCleaning={extraService}
              valueSpecialHelper={idSpecifyHelper}
              // valuePreferLanguage={idPreferLanguge}
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
          {currentStep === 3 && (
            <Payment
              idAddress={dataAddress}
              type={params.data.serviceType}
              nameServiceType={params.data.serviceName}
              valueShowTime={valueShowDateTime}
              price={Math.ceil(price)}
              extraService={extraService}
              handlePriceExtraService={handlePriceExtraService}
              handleDiscountPrice={handleDiscountPrice}
              handlePaymentMethod={handlePaymentMethod}
              handlePromotionId={handlePromotionId}
              handleReceivePoint={handleReceivePoint}
              onlyCreditCard={false}
            />
          )}
          {currentStep === 4 && (
            <Result
              address={dataAddress}
              receivePoint={receivePoint}
              valueShowTime={valueShowDateTime}
              valueShowHour={valueShowHour}
              nameServiceType={params.data?.serviceName}
            />
          )}
        </View>
      </Container>

      {currentStep < 4 ? (
        <View
          style={{
            paddingBottom: 16,
            backgroundColor: "white",
          }}
        >
          <View style={styles.bottom}>
            <View style={{ justifyContent: "center" }}>
              {params.data.serviceType !== Enum.SERVICE_TYPE.CleaningService ? (
                <View>
                  <Text style={styles.textBottom}>
                    {i18n.t("home.total")} (Vat inc.)
                  </Text>
                  <Text
                    style={[
                      styles.textBottom,
                      { fontWeight: "bold", fontSize: 20 },
                    ]}
                  >
                    THB {price > 0 ? Math.ceil(price) : 0}
                  </Text>
                </View>
              ) : currentStep > 1 &&
                params.data.serviceType ===
                  Enum.SERVICE_TYPE.CleaningService ? (
                <View style={{ flexDirection: "column" }}>
                  <Text style={styles.textBottom}>
                    {i18n.t("home.total")} (Vat inc.)
                  </Text>
                  <Text
                    style={[
                      styles.textBottom,
                      { fontWeight: "bold", fontSize: 20 },
                    ]}
                  >
                    THB {Math.ceil(price)}
                  </Text>
                </View>
              ) : null}
            </View>
            {isCreditCard && currentStep === 3 && !idCard ? (
              <Button
                disabled={disabledNext}
                onPress={onNextStep}
                style={styles.buttonBottom}
                title={i18n.t("home.select_card")}
              />
            ) : (
              <Button
                disabled={disabledNext}
                onPress={onNextStep}
                style={styles.buttonBottom}
                title={i18n.t("auth.next")}
              />
            )}
          </View>
        </View>
      ) : (
        <View>
          <Button
            onPress={() =>
              props.navigation.navigate(Constants.SCREENS.MAIN.BOTTOM_BAR)
            }
            style={{ width: "100%", paddingHorizontal: 20 }}
            title={i18n.t("home.back_to_home")}
          />
        </View>
      )}

      {currentStep == 3 && (
        <ListCardPayment
          children={childRef}
          navigation={props.navigation}
          handleIdCard={handleIdCard}
        />
      )}

      <Overlay
        fullScreen
        animationType="fade"
        isVisible={modalCreditCard.isModal}
      >
        <View style={{ width: "100%", height: Layout.window.height }}>
          <WebView
            useWebKit
            mixedContentMode="always"
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            containerStyle={{ alignItems: "center", justifyContent: "center" }}
            injectedJavaScript={injectedToHtml()}
            originWhitelist={["*"]}
            source={{ uri: Config.OMISELINK as string }}
            allowFileAccess
            allowUniversalAccessFromFileURLs
            scalesPageToFit
            style={{ flex: 1 }}
            onMessage={handleCloseModalCrediCard}
          />
        </View>
      </Overlay>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerHeader: {
    zIndex: 10,
    width: "100%",
    height: 55,
    backgroundColor: colors.main_color,
    justifyContent: "center",
  },
  spaceIcon: {
    paddingTop: 6,
    paddingLeft: 7,
  },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textBottom: {
    // marginTop: 5,
    marginLeft: 15,
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
  buttonBottom: {
    width: 100,
    marginRight: 15,
  },
});
