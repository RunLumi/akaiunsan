import React, { useEffect, useState } from "react";
import { StyleSheet, View, Alert, TouchableOpacity } from "react-native";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../../redux/hooks";
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
import {
  Services,
  Address,
  Option,
  Payment,
  Result,
} from "../ServiceScreen/component";
import i18n from "../../shared/I18n";
import useApi from "../../hooks/useApi";
import Enum from "../../shared/Enum";
import { WebView } from "react-native-webview";
import { Overlay } from "react-native-elements";
import dayjs from "../../shared/dayjs";
import Layout from "../../shared/Layout";
import _, { isEmpty, isNil } from "lodash";
import Config from "react-native-config";

export default function EditAndReOrderService(props: any) {
  const childRef = React.useRef<any>(null);
  const params = props.route.params || {};
  let valueDateTimeEdit = params.data?.bookingDetail?.bookingDate;
  let getDateEdit = dayjs(valueDateTimeEdit)
    .local()
    .format("DD/MM/YYYY HH:mm a");
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
  const [disabledNext, setDisableNext] = useState(params.isEdit ? false : true);
  const [idService, setIdService] = useState("");
  const [banner, setBanner] = useState("");
  const [idCard, setIdCard] = useState("");
  const [dataAddress, setDataAddress] = useState<any>(
    params.data?.customerInfo
  );
  const [valueShowHour, setValueShowHour] = useState(
    params.hour 
  );
  const [valueShowDateTime, setValueShowDateTime] = useState(getDateEdit);
  const [ageKid, setAgeKid] = useState(params.data?.bookingDetail?.age || 1);
  const [numberPet, setNumberPet] = React.useState(
    params.data?.bookingDetail?.numberExtraPet
  );
  const [numberKids, setNumberKids] = React.useState<{
    numberKids: number;
    age: any;
  }>({
    numberKids:
      (!isEmpty(params.data?.bookingDetail?.extraServices) &&
        params.data?.bookingDetail?.extraServices[0]?.numberKids) ||
      params.data?.bookingDetail?.numberKids ||
      0,
    age:
      (!isEmpty(params.data?.bookingDetail?.extraServices) &&
        params.data?.bookingDetail?.extraServices[0].age) ||
      params.data?.bookingDetail?.age ||
      0,
  });
  const [price, setPrice] = useState(0);
  const [priceLanguage, setPriceLanguage] = useState(0);
  const [priceHelper, setPriceHelper] = useState(0);
  const [two, setTwo] = useState(0);
  const [threePlus, setThreePlus] = useState(0);
  const [idSpecifyHelper, setIdSpecifyHelper] = useState<any>({});
  const [twoPlus, setTwoPlus] = useState(0);
  const [serviceDetail, setServiceDetail] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [extraService, setExtraService] = useState<any[]>([]);
  const [pointApply, setPointApply] = useState(0);
  const [receivePoint, setReceivePoint] = useState(0);
  const [idPreferLanguge, setIdPreferLanguge] = useState({
    label: "",
    value: "",
  });
  const [preferLanguge, setPreferLanguge] = useState<any[]>([]);
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
  const [bookingDetail, setBookingDetail] = useState(params.data?.customerInfo);
  const [loadingEditOrder, requestEditOrder] = useApi({
    method: "put",
    url: Constants.API.orders_edit,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        Alert.alert(
          i18n.t("home.success"),
          i18n.t("home.edit_success"),
          [
            {
              text: i18n.t("auth.confirm"),
              onPress: () =>
                props.navigation.navigate(Constants.SCREENS.MAIN.BOOKING),
            },
          ],
          { cancelable: true }
        );
      }
    },
  });
  const [loadingBookingDetail, requestBookingDetail] = useApi({
    method: "get",
    url: Constants.API.booking_detail,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        setBookingDetail(response && response.customerInfo);
      }
    },
  });

  const [loadingServiceDetail, requestServiceDetail] = useApi({
    method: "get",
    url: Constants.API.services_management_item,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        setServiceDetail(response.serviceDetail);
        setBanner(response.banner);
        let dataExtraService = JSON.parse(response.extraService) || [];
        for (let index = 0; index < dataExtraService.length; index++) {
          dataExtraService[index].isCheck = false;
          if (params.data?.serviceType === Enum.SERVICE_TYPE.CleaningService) {
            dataExtraService[index].price =
              1 * dataExtraService[index].pricePerUnit;
            dataExtraService[index].count = 1;
          }
        }
        setIdService(params.data.serviceId);
        if (!isEmpty(params.data?.bookingDetail?.extraServices)) {
          if (
            dataExtraService.length &&
            params.data?.bookingDetail?.extraServices.length
          ) {
            for (let x = 0; x < dataExtraService.length; x++) {
              for (
                let y = 0;
                y < params.data?.bookingDetail?.extraServices.length;
                y++
              ) {
                if (
                  dataExtraService[x].name ===
                    params.data?.bookingDetail?.extraServices[y].name ||
                  (dataExtraService[x].acType ===
                    params.data?.bookingDetail?.extraServices[y].acType &&
                    dataExtraService[x].pricePerUnit ===
                      params.data?.bookingDetail?.extraServices[y].pricePerUnit)
                ) {
                  dataExtraService[x].isCheck = true;
                }
              }
            }
          }
          setExtraService(dataExtraService);
          return;
        }
        setExtraService(dataExtraService);
      }
    },
  });
  const [loadingPreferLanguage, requestPreferLanguage] = useApi({
    method: "get",
    url: Constants.API.languages,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        let dataLanguage = response.items.map((x: any) => {
          return {
            label: x.name,
            value: x.code,
          };
        });
        setPreferLanguge(dataLanguage);
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
          if (response.items[0].serviceType === Enum.SERVICE_TYPE.MaidService) {
            if (!isEmpty(params.data?.bookingDetail.extraServices)) {
              params.data?.bookingDetail.extraServices.map((i: any) => {
                if (i.perHour > 0) {
                  if (valueShowHour < 3) {
                    setPrice(valueShowHour * (price.two + i.perHour));
                  } else {
                    setPrice(valueShowHour * (price.threePlus + i.perHour));
                  }
                } else {
                  if (valueShowHour < 3) {
                    setPrice(valueShowHour * price.two + i.perTime);
                  } else {
                    setPrice(valueShowHour * price.threePlus + i.perTime);
                  }
                }
              });
            } else {
              if (valueShowHour < 3) {
                setPrice(valueShowHour * price.two);
              } else {
                setPrice(valueShowHour * price.threePlus);
              }
            }
            setTwo(price.two);
            setThreePlus(price.threePlus);
          } else if (
            response.items[0].serviceType === Enum.SERVICE_TYPE.NanyService
          ) {
            if (numberKids.numberKids) {
              if (valueShowHour < 3) {
                setPrice(
                  valueShowHour * price.two + numberKids.numberKids * 200
                );
              } else {
                setPrice(
                  valueShowHour * price.threePlus + numberKids.numberKids * 200
                );
              }
            } else {
              if (valueShowHour < 3) {
                setPrice(valueShowHour * price.two);
              } else {
                setPrice(valueShowHour * price.threePlus);
              }
            }
            setTwo(price.two);
            setThreePlus(price.threePlus);
          } else if (
            response.items[0].serviceType === Enum.SERVICE_TYPE.ElderService
          ) {
            if (!isEmpty(params.data?.bookingDetail.extraServices)) {
              params.data?.bookingDetail.extraServices.map((i: any) => {
                if (i.perHour > 0) {
                  setPrice(valueShowHour * (price.twoPlus + i.perHour));
                } else {
                  setPrice(valueShowHour * price.twoPlus + i.perTime);
                }
              });
            } else {
              setPrice(valueShowHour * price.twoPlus);
            }
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
        if (isCreditCard) {
          requestChargesCard({
            data: {
              orderId: response,
              cardId: idCard,
            },
          });
          // setModalCreditCard({isModal:true,idOrder:response});
        } else {
          setCurrentStep(currentStep + 1);
        }
      }
    },
  });
  const [loadingCharges, requestCharges] = useApi({
    method: "post",
    url: Constants.API.charges,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        setCurrentStep(currentStep + 1);
      }
    },
  });
  const [loadingChargesCard, requestChargesCard] = useApi({
    method: "post",
    url: Constants.API.chargescard,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        if (params.data?.order) {
          requestPaymentPetcare({
            data: {
              id: modalCreditCard.idOrder,
              amount: params.data.order.totalPrice || 0,
              voucherCode: "string",
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
  const [loadingCancelPayment, requestCancelPayment] = useApi({
    method: "post",
    url: Constants.API.orders_cancel,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
    },
  });
  const [loadingPaymentPetcare, requestPaymentPetcare] = useApi({
    method: "post",
    url: Constants.API.payment_petcare,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        Alert.alert("Payment", "Update payment successfuly!", [
          {
            text: "OK",
            onPress: () => {
              props.navigation.goBack();
            },
          },
        ]);
      }
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
          color={colors.black_text}
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
          color={colors.black_text}
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
          color={colors.black_text}
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
          color={colors.black_text}
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
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
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
          if (!isEmpty(params.data?.bookingDetail.extraServices)) {
            params.data?.bookingDetail.extraServices.map((i: any) => {
              if (i.perHour > 0) {
                if (value < 3) {
                  setPrice(value * (two + i.perHour));
                } else {
                  setPrice(value * (threePlus + i.perHour));
                }
              } else {
                if (value < 3) {
                  setPrice(value * two + i.perTime);
                } else {
                  setPrice(value * threePlus + i.perTime);
                }
              }
            });
          } else {
            if (value < 3) {
              setPrice(value * two);
            } else {
              setPrice(value * threePlus);
            }
          }
        } else if (params.data.serviceType === Enum.SERVICE_TYPE.NanyService) {
          if (value < 3) {
            setPrice(value * two + numberKids.numberKids * 200);
          } else {
            setPrice(value * threePlus + numberKids.numberKids * 200);
          }
        } else if (params.data.serviceType === Enum.SERVICE_TYPE.ElderService) {
          if (!isEmpty(params.data?.bookingDetail.extraServices)) {
            params.data?.bookingDetail.extraServices.map((i: any) => {
              if (i.perHour > 0) {
                setPrice(value * (twoPlus + i.perHour));
              } else {
                setPrice(value * twoPlus + i.perTime);
              }
            });
          } else {
            setPrice(value * twoPlus);
          }
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
      let valueStartTime = dayjs(getValue).format("MM/DD/YYYY HH:mm:ss");
      let valueEndtime = "";
      if (hour) {
        valueEndtime = dayjs(valueStartTime)
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
        setPrice(Number((price + value).toFixed(2)));
      } else if (type === "minus") {
        setPrice(Number((price - value).toFixed(2)));
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
  const handleIdPreferLanguge = (value: any) => {
    setIdPreferLanguge(value);
  };
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
  const handlePriceCleaning = (data: any) => {
    let priceCleaning = 0;
    for (let index = 0; index < data.length; index++) {
      if (data[index].isCheck) {
        priceCleaning += data[index].price;
      }
    }
    setPrice(priceCleaning);
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

  useEffect(() => {
    setStartTime(
      dayjs(params.data?.bookingDetail?.bookingDate)
        .local()
        .format("MM/DD/YYYY HH:mm:ss")
    );
    setEndTime(
      dayjs(params.data?.bookingDetail?.bookingHour)
        .local()
        .format("MM/DD/YYYY HH:mm:ss")
    );
    if (!user || !token) {
      props.navigation.replace(Constants.SCREENS.AUTH.LOGIN);
    }
    if (params.data && params.data.serviceItemId) {
      requestServiceDetail({ params: { id: params.data.serviceItemId } });
    }
    if (!params.isEdit) {
      requestBookingDetail({ params: { orderId: params.data?.orderId } });
      if (params.data) {
        switch (params.data.serviceType) {
          case Enum.SERVICE_TYPE.MaidService:
            requestConfigPrice({ params: { price: Enum.PRICES.MaidService } });
            break;
          case Enum.SERVICE_TYPE.PetcareService:
            requestConfigPrice({
              params: { price: Enum.PRICES.PetcareService },
            });
            break;
          case Enum.SERVICE_TYPE.NanyService:
            requestConfigPrice({ params: { price: Enum.PRICES.NanyService } });
            break;
          case Enum.SERVICE_TYPE.ElderService:
            requestConfigPrice({ params: { price: Enum.PRICES.ElderService } });
            break;
        }
      }
    }
    if (params.isEdit) {
      setPrice(params.data.currentDetail.totalPrice);
      setIdSpecifyHelper({ id: params.data?.bookingDetail?.specialHelper });
      if (params.data.serviceType === Enum.SERVICE_TYPE.CleaningService) {
        if (
          params.data?.bookingDetail?.extraServices &&
          params.data?.bookingDetail?.extraServices.length
        ) {
          for (
            let index = 0;
            index < params.data?.bookingDetail?.extraServices.length;
            index++
          ) {
            params.data.bookingDetail.extraServices[index].count =
              params.data?.bookingDetail?.extraServices[index].unit;
          }
          setExtraService(params.data.bookingDetail.extraServices);
        }
      }
    }

    requestPreferLanguage({ params: { limit: 650 } });
  }, [user, token]);
  useEffect(() => {
    if (currentStep === 1) {
      if (!dataAddress) {
        setDisableNext(true);
      }
    }
    if (!params.isEdit) {
      if (params.data.serviceType === Enum.SERVICE_TYPE.CleaningService) {
        if (currentStep === 0 || currentStep === 1) {
          for (let index = 0; index < extraService.length; index++) {
            extraService[index].isCheck = false;
            extraService[index].count = 1;
          }
          setPrice(0);
        }
      }
    }
  }, [currentStep]);

  const onNextStep = async () => {
    const notUndefined = (anyValue: any) => typeof anyValue !== "undefined";
    let paramOrder: any = {
      serviceId: idService,
      bookingDetail: {
        bookingDate: dayjs(startTime).toISOString(),
        bookingHour: dayjs(endTime).toISOString(),
        // language: idPreferLanguge.value,
        specialHelper: idSpecifyHelper && idSpecifyHelper.id,
        serviceType: params.data.serviceType,
        age: ageKid,
      },
      customerInfo: {
        addressId: (dataAddress && dataAddress?.addressId) || "",
        address:
          (dataAddress && dataAddress.shortAddress) ||
          (dataAddress && dataAddress.address) ||
          "",
        district: (dataAddress && dataAddress.district) || "",
        city:
          (dataAddress && dataAddress.province) ||
          (dataAddress && dataAddress.city) ||
          "",
        phoneNumber: (dataAddress && dataAddress.phoneNumber) || "",
        roomOrFloor:
          (dataAddress && dataAddress.roomNo) ||
          (dataAddress && dataAddress.roomOrFloor) ||
          "",
        remark: (dataAddress && dataAddress.remark) || "",
        roomType: (dataAddress && dataAddress.roomType) || 0,
        bathrooms:
          (dataAddress && dataAddress.batchroomNo) ||
          (dataAddress && dataAddress.bathrooms) ||
          0,
        bedRooms:
          (dataAddress && dataAddress.bedroomNo) ||
          (dataAddress && dataAddress.bedRooms) ||
          0,
      },
      point: 0,
      paymentMethodId: "",
    };
    if (params.data.serviceType === Enum.SERVICE_TYPE.NanyService) {
      if (
        currentStep == 2 &&
        numberKids.numberKids > 0 &&
        numberKids.age.includes(0)
      ) {
        Alert.alert(i18n.t("home.select_age"));
        return;
      }
      paramOrder.bookingDetail.extraServices = [numberKids];
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

    if (params.isEdit && currentStep === 2) {
      let paramEdit = {};
      if (params.data.serviceType === Enum.SERVICE_TYPE.PetcareService) {
        paramEdit =
          idSpecifyHelper && idSpecifyHelper.id
            ? {
                orderId: params.data.orderDetailId,
                addressId:
                  dataAddress.id || (dataAddress && dataAddress?.addressId),
                bookingDate: dayjs(startTime).toISOString(),
                bookingHour: dayjs(endTime).toISOString(),
                serviceProvider: idSpecifyHelper.id,
                petProfiles: extraService.map((x: any) => {
                  return { name: x.name, type: x.type };
                }),
                activity: activitiesPetCare,
              }
            : {
                orderId: params.data.orderDetailId,
                addressId:
                  dataAddress.id || (dataAddress && dataAddress?.addressId),
                bookingDate: startTime,
                bookingHour: endTime,
                petProfiles: extraService.map((x: any) => {
                  return { name: x.name, type: x.type };
                }),
                activity: activitiesPetCare,
              };
      } else {
        paramEdit =
          idSpecifyHelper && idSpecifyHelper.id
            ? {
                orderId: params.data.orderDetailId,
                addressId:
                  dataAddress.id || (dataAddress && dataAddress?.addressId),
                bookingDate: dayjs(startTime).toISOString(),
                bookingHour: dayjs(endTime).toISOString(),
                serviceProvider: idSpecifyHelper.id,
              }
            : {
                orderId: params.data.orderDetailId,
                addressId:
                  dataAddress.id || (dataAddress && dataAddress?.addressId),
                bookingDate: startTime,
                bookingHour: endTime,
              };
      }
      await requestEditOrder({ data: paramEdit });
    } else if (currentStep === 3) {
      paramOrder.point = pointApply;
      paramOrder.paymentMethodId = paymentMethodId;
      if (promotionId) {
        paramOrder.promotionId = promotionId;
      }
      if (!idCard && isCreditCard) {
        childRef.current.openModalListCard();
        return;
      }
      if (!params.data?.order) {
        await requestOrder({ data: paramOrder });
      } else {
        if (!isCreditCard) {
          requestPaymentPetcare({
            data: {
              id: params.data.order.orderId,
              amount: params.data.order.totalPrice || 0,
              voucherCode: "",
              point: pointApply,
              paymentMethod: "PAYMENT_METHOD_CASH",
            },
          });
        } else {
          requestChargesCard({
            data: {
              orderId: params.data.order.orderId,
              cardId: idCard,
            },
          });
          // setModalCreditCard({
          //   isModal: true,
          //   idOrder: params.data.order.orderId
          // });
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
      setModalCreditCard({ ...modalCreditCard, isModal: false });
      requestCharges({
        data: {
          orderId: modalCreditCard.idOrder,
          token: value.nativeEvent.data,
        },
      });
    }
  };

  const injectedToHtml = () => {
    let injectedData = `
      OmiseCard.open({
        amount: ${price * 100},
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
    }
  };

  return (
    <Container style={styles.container}>
      <View style={[styles.containerHeader]}>
        <View style={{ marginLeft: 10 }}>
          {currentStep != 4 ? (
            <Ionicons
              onPress={() =>
                currentStep === 0
                  ? props.navigation.goBack()
                  : toStep(currentStep - 1)
              }
              name="arrow-back"
              size={26}
              color={colors.white}
            />
          ) : null}
        </View>
      </View>
      <View style={styles.container}>
        <Loading
          loading={
            loadingPreferLanguage ||
            loadingConfigPrice ||
            loadingOrder ||
            loadingChargesCard ||
            loadingEditOrder
          }
        />
        <View
          style={{
            width: "100%",
            height: 70,
            marginTop: 20,
            borderBottomWidth: 3,
            borderBottomColor: colors.gray_hidden_text,
          }}
        >
          <View style={{ flexDirection: "row", width: "100%" }}>
            {steps.map((label, i) => (
              <View key={i} style={{ alignItems: "center", width: "25%" }}>
                {/* not select */}
                {i > currentStep && i != currentStep && (
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      width: Layout.window.width < 390 ? 20 : 35,
                      height: 30,
                      borderColor: colors.main_color,
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
                      borderColor: colors.main_color,
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
                      borderColor: colors.main_color,
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
            banner={banner}
            onSetAgeKid={setAgeKid}
            ageKid={ageKid}
            type={params.data?.serviceType}
            name={params.data?.serviceName}
            detail={serviceDetail}
            valueShowDateTime={valueShowDateTime}
            valueShowHour={valueShowHour}
            isEdit={params.isEdit}
            getValueDateTime={valueDateTimeEdit}
            handleHour={handleHour}
            handleDateTime={handleDateTime}
            onPressSubscriptionPlan={() => {
              props.navigation.push(Constants.SCREENS.OTHER.ADDRESS_FIX_PLAN, {
                serviceId: params.data?.id,
                serviceItemId: params.data?.serviceItemId,
                serviceName: params.data?.serviceName,
                serviceType: params.data?.serviceType,
              });
            }}
          />
        )}
        {currentStep === 1 && (
          <Address
            nonEdit={!isNil(params?.data.promotion)}
            currentAddressId={dataAddress.addressId}
            type={params.data?.serviceType}
            navigation={props.navigation}
            handleAddress={handleAddress}
            bookingDetail={bookingDetail}
          />
        )}
        {currentStep === 2 && (
          <Option
            times={[1]}
            numberKids={numberKids}
            onSelectNumberKid={setNumberKids}
            numberPet={numberPet}
            onSelectNumberPet={setNumberPet}
            dataEdit={params.data}
            isEdit={params.isEdit}
            type={params.data?.serviceType}
            valueShowHour={valueShowHour}
            extraService={extraService}
            preferLanguage={preferLanguge}
            handleIdPreferLanguge={handleIdPreferLanguge}
            startTime={startTime}
            endTime={endTime}
            idAddress={dataAddress}
            extraServiceCleaning={extraService}
            valueSpecialHelper={idSpecifyHelper}
            valuePreferLanguage={idPreferLanguge}
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
            type={params.data?.serviceType}
            nameServiceType={params.data?.serviceName}
            valueShowTime={valueShowDateTime}
            price={price}
            extraService={extraService}
            handlePriceExtraService={handlePriceExtraService}
            handleDiscountPrice={handleDiscountPrice}
            handlePaymentMethod={handlePaymentMethod}
            handlePromotionId={handlePromotionId}
            handleReceivePoint={handleReceivePoint}
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

      {/* bottom */}
      {currentStep < 4 ? (
        <View
          style={{
            height: 70,
            justifyContent: "center",
            backgroundColor: colors.white,
          }}
        >
          <View style={styles.bottom}>
            <View>
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
                  THB {price}
                </Text>
              </View>
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

      <ListCardPayment
        children={childRef}
        navigation={props.navigation}
        handleIdCard={handleIdCard}
      />

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
    </Container>
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
    marginTop: 5,
    marginLeft: 15,
  },
  borderIcon: {
    borderWidth: 1,
    borderRadius: 20,
    borderColor: colors.black_text,
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
    backgroundColor: colors.black_text,
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
