import React from "react";
import { StyleSheet, FlatList, View, Image, Alert } from "react-native";
import {
  Button,
  CustomInput,
  HelperSelect,
  Text,
  TextInput,
} from "../../../components";
import i18n from "../../../shared/I18n";
import colors from "../../../shared/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { TYPES } from "../../../redux/actions";
import { CheckBox, AirbnbRating, Overlay } from "react-native-elements";
import Enum from "../../../shared/Enum";
import Layout from "../../../shared/Layout";
import Constants from "../../../shared/Constants";
import { apiSlice, portRequest, type ApiResult } from "../../../redux/apiSlice";
import type { ApiItem } from "../../../redux/apiSlice";
import type { ScreenProps } from "../../../navigation/routes";

export default function Option(props: ScreenProps) {
  const extraService = props.extraService || [];
  const workingHour = props.valueShowHour || [];
  const preferLanguage = props.preferLanguage || [];
  const isEdit = props.isEdit;
  const dataEdit = props.dataEdit;
  const extraServiceCleaning = props.extraServiceCleaning || [];
  const [dataExtraService, setDataExtraService] = React.useState(
    isEdit ? dataEdit.bookingDetail.extraServices : []
  );
  const [dataExtraServiceCleaning, setDataExtraServiceCleaning] =
    React.useState(extraServiceCleaning);
  const [nameHelper, setNameHelper] = React.useState(
    isEdit ? dataEdit.serviceProvider?.fullName : ""
  );
  const [oldHelper, setOldHelper] = React.useState(
    isEdit ? dataEdit.serviceProvider?.old : ""
  );
  const [starHelper, setStarHelper] = React.useState(
    isEdit ? dataEdit.serviceProvider?.star : 0
  );
  const [imageHelper, setImageHelper] = React.useState(
    isEdit ? dataEdit.serviceProvider?.avatar : ""
  );
  const [petCareActivities, setPetCareActivities] = React.useState(
    isEdit ? dataEdit.bookingDetail.activity : ""
  );
  const [priceSpecifyHelper, setPriceSpecifyHelper] = React.useState<ApiItem>({});
  const [pricePreferLanguage, setPricePreferLanguage] = React.useState<ApiItem[]>([]);
  const dispatch = useDispatch();
  const [language, setLanguage] = React.useState({ label: "", value: "" });
  const [requestConfigPriceTrigger, { isLoading: loadingConfigPrice }] =
    apiSlice.endpoints.configPrice.useLazyQuery();
  const requestConfigPrice = portRequest(
    requestConfigPriceTrigger,
    ({ error, response }: ApiResult) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        if (response.items && response.items[0].pricesModel) {
          let price = JSON.parse(response.items[0].pricesModel);
          if (
            response.items[0].serviceType === Enum.SERVICE_TYPE.MaidService ||
            response.items[0].serviceType === Enum.SERVICE_TYPE.NanyService
          ) {
            if (workingHour < 3) {
              props.handlePriceEnglish(workingHour * price.two);
            } else {
              props.handlePriceEnglish(workingHour * price.threePlus);
            }
          } else if (
            response.items[0].serviceType === Enum.SERVICE_TYPE.ElderService
          ) {
            props.handlePriceEnglish(workingHour * price.twoPlus);
          }
          let uncheckDataExtraService = [...dataExtraService];
          for (let index = 0; index < uncheckDataExtraService.length; index++) {
            uncheckDataExtraService[index].isCheck = false;
          }
          setDataExtraService(uncheckDataExtraService);
        }
      }
    }
  );
  const [requestPriceSpecialRequestTrigger, { isLoading: loadingPriceSpecialRequest }] =
    apiSlice.endpoints.priceSpecialRequest.useLazyQuery();
  const requestPriceSpecialRequest = portRequest(
    requestPriceSpecialRequestTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        let getPriceSpecifyHelper = response.items.find(
          (x: ApiItem) => x.code === Enum.PriceSpecialRequest.COSTSP
        );
        let getPricePreferLanguage = response.items.filter((y: ApiItem) => {
          if (y.code === Enum.PriceSpecialRequest.LANGUAGE) {
            return { ...y };
          }
        });
        setPricePreferLanguage(getPricePreferLanguage);
        setPriceSpecifyHelper(getPriceSpecifyHelper);
      }
    }
  );
  const childRef = React.useRef<any>(null);
  const onChooseHelper = () => {
    childRef.current.openModalHelper();
  };
  // const onChooseLanguage = () => {
  //   if (isEdit) {
  //     return;
  //   }
  //   dispatch({
  //     type: TYPES.TOOLS.OPEN_PICKER,
  //     payload: {
  //       data: preferLanguage,
  //       selected: language.value,
  //       callback: (selected: number) => {
  //         const newlanguage = () =>
  //           preferLanguage.reduce((pre, cur) => {
  //             if (cur?.value === selected) {
  //               checkHelperEndlish(cur, false);
  //               return cur;
  //             } else return pre;
  //           }, {});
  //         setLanguage(newlanguage);
  //       },
  //     },
  //   });
  // };
  // const checkHelperEndlish = async (newlanguage: any, isDelete: boolean) => {
  //   if (isDelete) {
  //     let findLanguagePrice = pricePreferLanguage.find(
  //       (x) => x.language === language.value
  //     );
  //     if (findLanguagePrice) {
  //       props.handlePricePreferLanguage(findLanguagePrice.price, false);
  //     }
  //     setLanguage({ label: "", value: "" });
  //     props.handleIdPreferLanguge({ label: "", value: "" });
  //     deleteValueHelper();
  //     if (props.type === Enum.SERVICE_TYPE.MaidService) {
  //       await requestConfigPrice({
  //         params: { price: Enum.PRICES.MaidService },
  //       });
  //     } else if (props.type === Enum.SERVICE_TYPE.NanyService) {
  //       await requestConfigPrice({
  //         params: { price: Enum.PRICES.NanyService },
  //       });
  //     } else if (props.type === Enum.SERVICE_TYPE.ElderService) {
  //       await requestConfigPrice({
  //         params: { price: Enum.PRICES.ElderService },
  //       });
  //     }
  //   } else {
  //     let checkEnglish = newlanguage.label.search("English");
  //     props.handleIdPreferLanguge({
  //       label: newlanguage.label,
  //       value: newlanguage.value,
  //     });
  //     if (checkEnglish != -1) {
  //       if (props.type === Enum.SERVICE_TYPE.MaidService) {
  //         await requestConfigPrice({
  //           params: { price: Enum.PRICES.MaidService_Eng },
  //         });
  //       } else if (props.type === Enum.SERVICE_TYPE.NanyService) {
  //         await requestConfigPrice({
  //           params: { price: Enum.PRICES.NanyService_Eng },
  //         });
  //       } else if (props.type === Enum.SERVICE_TYPE.ElderService) {
  //         await requestConfigPrice({
  //           params: { price: Enum.PRICES.ElderService_Eng },
  //         });
  //       }
  //     } else {
  //       if (props.type === Enum.SERVICE_TYPE.MaidService) {
  //         await requestConfigPrice({
  //           params: { price: Enum.PRICES.MaidService },
  //         });
  //       } else if (props.type === Enum.SERVICE_TYPE.NanyService) {
  //         await requestConfigPrice({
  //           params: { price: Enum.PRICES.NanyService },
  //         });
  //       } else if (props.type === Enum.SERVICE_TYPE.ElderService) {
  //         await requestConfigPrice({
  //           params: { price: Enum.PRICES.ElderService },
  //         });
  //       }
  //     }
  //     let findLanguagePrice = pricePreferLanguage.find(
  //       (x) => x.language === newlanguage.value
  //     );
  //     if (findLanguagePrice) {
  //       props.handlePricePreferLanguage(findLanguagePrice.price, true);
  //     }
  //   }
  // };
  const handleValueHelper = (
    id: unknown,
    name: unknown,
    old: unknown,
    star: unknown,
    image: unknown
  ) => {
    setNameHelper(name);
    setOldHelper(old);
    setStarHelper(star);
    setImageHelper(image);
    props.handlePriceSpecifyHelper(priceSpecifyHelper.price, true);
    props.handleIdSpecifyHelper({ id, name, old, star, image });
  };

  const deleteValueHelper = () => {
    setNameHelper("");
    setOldHelper("");
    setStarHelper(0);
    setImageHelper("");
    props.handlePriceSpecifyHelper(priceSpecifyHelper.price, false);
    props.handleIdSpecifyHelper({
      id: "",
      name: "",
      old: "",
      star: 0,
      image: "",
    });
  };

  const onCheckExtraService = (value: boolean, idx: number) => {
    let data = [...dataExtraService];
    data[idx].isCheck = !value;
    if (value) {
      props.handlePriceExtraService(data[idx].price, "minus");
    } else {
      props.handlePriceExtraService(data[idx].price, "plus");
    }
    setDataExtraService(data);
  };

  const addPriceToExtraService = () => {
    for (let index = 0; index < extraService.length; index++) {
      if (extraService[index].perHour) {
        extraService[index].price = workingHour * extraService[index].perHour;
      } else {
        extraService[index].price = extraService[index].perTime;
      }
    }
    setDataExtraService(extraService);
  };
  React.useEffect(() => {
    requestPriceSpecialRequest();
    if (!isEdit) {
      if (props.type != Enum.SERVICE_TYPE.CleaningService) {
        addPriceToExtraService();
      }
    }
    if (isEdit && dataEdit?.bookingDetail?.bookingDetail) {
      for (let index = 0; index < preferLanguage.length; index++) {
        if (
          preferLanguage[index].value === dataEdit?.bookingDetail?.bookingDetail
        ) {
          setLanguage({
            label: preferLanguage[index].label,
            value: preferLanguage[index].value,
          });
          break;
        }
      }
    }
    if (!isEdit) {
      if (props.valueSpecialHelper.name && props.valueSpecialHelper.old) {
        setNameHelper(props.valueSpecialHelper.name);
        setOldHelper(props.valueSpecialHelper.old);
        setStarHelper(props.valueSpecialHelper.star);
        setImageHelper(props.valueSpecialHelper.image);
      }
    }
    if (props.valuePreferLanguage) {
      setLanguage(props.valuePreferLanguage);
    }
  }, []);
  const renderItem = (item: ApiItem, index: number) => {
    return (
      <View style={styles.borderExtraService}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "column", marginBottom: 16, flex: 1 }}>
            <Text style={styles.bolder}>{item.name}</Text>
            <Text style={styles.textDescription}>{item.description}</Text>
          </View>
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: colors.main_color,
                marginBottom: -8,
              }}
            >
              +THB{" "}
              {item.perTime !== 0
              ? item.perTime
              : item.perHour * workingHour}
            </Text>
            <CheckBox
              size={30}
              checkedIcon="dot-circle-o"
              uncheckedIcon="circle-o"
              checked={isEdit ? true : item.isCheck}
              uncheckedColor={colors.main_color}
              checkedColor={colors.main_color}
              onPress={() => onCheckExtraService(item.isCheck, index)}
            />
          </View>
        </View>
      </View>
    );
  };

  // ACCleaning
  const renderItemACCleaning = (item: ApiItem, idx: number) => (
    <View key={idx} style={styles.borderExtraService}>
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginHorizontal: 16,
          },
          item.isCheck && { marginVertical: 4 },
        ]}
      >
        <View style={{ flexDirection: "column", flex: 1 }}>
          <Text style={styles.bolder}>{`${item.acType}_${item.btu}`}</Text>
          {item.isCheck && (
            <View style={{ flexDirection: "row" }}>
              <Ionicons
                onPress={() => !isEdit && minusCountACCleaning(item.count, idx)}
                name="remove-circle"
                size={20}
                color={colors.main_color}
              />
              <Text style={{ paddingHorizontal: 15, fontSize: 15 }}>
                {item.count}
              </Text>
              <Ionicons
                onPress={() => !isEdit && plusCountACCleaning(item.count, idx)}
                name="add-circle"
                size={20}
                color={colors.main_color}
              />
            </View>
          )}
        </View>
        <View style={{ flexDirection: "column" }}>
          <CheckBox
            size={30}
            checkedIcon="dot-circle-o"
            uncheckedIcon="circle-o"
            checked={item.isCheck}
            uncheckedColor={colors.main_color}
            checkedColor={colors.main_color}
            onPress={() => !isEdit && onCheckACCleaning(item.isCheck, idx)}
          />
        </View>
      </View>
    </View>
  );
  const onCheckACCleaning = (value: boolean, idx: number) => {
    let data = [...dataExtraServiceCleaning];
    data[idx].isCheck = !value;
    if (value) {
      props.handlePriceCleaning(data);
    } else {
      props.handlePriceCleaning(data);
    }
    data[idx].count = 1;
    setDataExtraServiceCleaning(data);
  };
  const minusCountACCleaning = (value: number, idx: number) => {
    if (value > 1) {
      let data = [...dataExtraServiceCleaning];
      let price = 0;
      data[idx].count = value - 1;
      if (data[idx].count === 1) {
        price = data[idx].count * data[idx].pricePerUnit;
      } else if (data[idx].count > 1) {
        price = data[idx].count * data[idx].pricePerMore;
      }
      data[idx].price = price;
      props.handlePriceCleaning(data);
      setDataExtraServiceCleaning(data);
    }
  };
  const plusCountACCleaning = (value: number, idx: number) => {
    let data = [...dataExtraServiceCleaning];
    let price = 0;
    data[idx].count = value + 1;
    if (data[idx].count === 1) {
      price = data[idx].count * data[idx].pricePerUnit;
    } else if (data[idx].count > 1) {
      price = data[idx].count * data[idx].pricePerMore;
    }
    data[idx].price = price;
    props.handlePriceCleaning(data);
    setDataExtraServiceCleaning(data);
  };

  // Pet Care
  const [dataPetcare, setDataPetcare] = React.useState(
    isEdit
      ? dataEdit.bookingDetail?.petProfiles?.map((x: ApiItem) => {
          return { ...x, isModal: false };
        })
      : []
  );
  const [namePetcare, setNamePetcare] = React.useState("");
  const [typePetcare, setTypePetcare] = React.useState("");
  const [isModalPetCare, setIsModalPetCare] = React.useState(false);
  const toggleOverlayPetCare = () => {
    setIsModalPetCare(!isModalPetCare);
  };

  const addProfilePet = () => {
    let data = [...dataPetcare];
    data.push({ name: namePetcare, type: typePetcare, isModal: false });
    setDataPetcare(data);
    props.handleProfilePet(data, petCareActivities);
    setNamePetcare("");
    setTypePetcare("");
    setIsModalPetCare(false);
  };

  const deletePetProfile = (idx: number) => {
    let data = [...dataPetcare];
    data.splice(idx, 1);
    setDataPetcare(data);
  };

  const onchangePetCareActivities = (value: string) => {
    setPetCareActivities(value);
    props.handleProfilePet(dataPetcare, value);
  };

  const openModalPetCareItem = (idx: number) => {
    let data = [...dataPetcare];
    data[idx].isModal = true;
    setDataPetcare(data);
  };

  const closeModalPetCareItem = (idx: number) => {
    let data = [...dataPetcare];
    data[idx].isModal = false;
    setDataPetcare(data);
    props.handleProfilePet(dataPetcare, petCareActivities);
  };

  const renderItemPetCare = (item: ApiItem, idx: number) => (
    <View key={idx} style={[styles.borderExtraService, { padding: 10 }]}>
      <Overlay
        isVisible={dataPetcare[idx].isModal}
        animationType="fade"
        onBackdropPress={() => closeModalPetCareItem(idx)}
      >
        <View
          style={{ width: "90%", alignContent: "center", paddingVertical: 10 }}
        >
          <Text style={{ paddingVertical: 5 }}>{i18n.t("home.name")}</Text>
          <CustomInput
            value={item.name}
            onChangeText={(value) => {
              item.name = value;
              setDataPetcare([...dataPetcare]);
            }}
          />
          <Text style={{ paddingVertical: 5 }}>{i18n.t("home.type")}</Text>
          <CustomInput
            value={item.type}
            onChangeText={(value) => {
              item.type = value;
              setDataPetcare([...dataPetcare]);
            }}
          />
          {/* <Button onPress={()=> closeModalPetCareItem(idx)} style={{alignSelf:"center", width:100}} title={i18n.t('home.update')} /> */}
        </View>
      </Overlay>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginHorizontal: 15,
        }}
      >
        <Text style={{ color: colors.black, fontSize: 17 }}>
          {i18n.t("home.pet_profile")}
        </Text>
        <View style={{ flexDirection: "row" }}>
          {isEdit && (
            <Ionicons
              onPress={() => openModalPetCareItem(idx)}
              name="create-outline"
              size={20}
              color={colors.black}
            />
          )}
          <Ionicons
            onPress={() => !isEdit && deletePetProfile(idx)}
            name="trash"
            size={20}
            color={isEdit ? colors.gray_hidden_text : colors.black}
          />
        </View>
      </View>
      <View>
        <View style={{ flexDirection: "row", marginVertical: 10 }}>
          <Text style={{ marginLeft: 30, color: colors.black }}>
            {i18n.t("home.name")}:
          </Text>
          <Text style={{ marginLeft: 5, color: colors.black }}>
            {item.name}
          </Text>
        </View>
        <View style={{ flexDirection: "row", marginVertical: 10 }}>
          <Text style={{ marginLeft: 30, color: colors.black }}>
            {i18n.t("home.type")}:
          </Text>
          <Text style={{ marginLeft: 5, color: colors.black }}>
            {item.type}
          </Text>
        </View>
      </View>
    </View>
  );

  // ****************************************
  // pet care
  if (props.type === Enum.SERVICE_TYPE.PetcareService) {
    return (
      <View style={styles.container}>
        <Overlay
          isVisible={isModalPetCare}
          animationType="fade"
          onBackdropPress={toggleOverlayPetCare}
        >
          <View style={{ width: "90%", alignContent: "center" }}>
            <Text style={{ paddingVertical: 5 }}>{i18n.t("home.name")}</Text>
            <CustomInput value={namePetcare} onChangeText={setNamePetcare} />
            <Text style={{ paddingVertical: 5 }}>{i18n.t("home.type")}</Text>
            <CustomInput value={typePetcare} onChangeText={setTypePetcare} />
            <Button
              onPress={() => addProfilePet()}
              style={{ alignSelf: "center", width: 100 }}
              title={"Add profile"}
            />
          </View>
        </Overlay>
        <View
          style={[
            styles.divider,
            {
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 5,
              paddingVertical: 10,
            },
          ]}
        >
          <Text style={styles.title}>{i18n.t("home.special_request")}</Text>
          <Text
            onPress={() => setIsModalPetCare(true)}
            style={styles.borderAddProfile}
          >
            Add profile
          </Text>
        </View>
        <View style={{ maxHeight: Layout.window.height - 450 }}>
          <FlatList
            data={dataPetcare}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index, separators }) =>
              renderItemPetCare(item, index)
            }
            contentContainerStyle={
              dataPetcare.length === 0 && {
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }
            }
            ListEmptyComponent={
              <Text
                style={{
                  paddingTop: 8,
                  textAlign: "center",
                  fontSize: 30,
                  color: colors.gray_hidden_text,
                }}
              >
                No pet profile
              </Text>
            }
          />
        </View>
        <View style={styles.divider}>
          <Text style={styles.title}>{i18n.t("home.activities")}</Text>
        </View>
        <View style={{ paddingTop: 10 }}>
          <TextInput
            value={petCareActivities}
            onChangeText={(value: string) => onchangePetCareActivities(value)}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={styles.textPetCare}
          />
        </View>
      </View>
    );
  }
  // ACCleaning
  else if (props.type === Enum.SERVICE_TYPE.CleaningService) {
    return (
      <View style={styles.container}>
        <View style={styles.divider}>
          <Text style={styles.title}>{i18n.t("home.special_request")}</Text>
        </View>
        <FlatList
          data={dataExtraServiceCleaning}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index, separators }) =>
            renderItemACCleaning(item, index)
          }
          contentContainerStyle={
            dataExtraServiceCleaning.length === 0 && {
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }
          }
          ListEmptyComponent={
            <Text style={{ fontSize: 16, marginHorizontal: 10 }}>
              {i18n.t("home.data_empty")}
            </Text>
          }
        />
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <HelperSelect
          valueHelper={handleValueHelper}
          addressId={props.idAddress}
          startTime={props.startTime}
          endTime={props.endTime}
          serviceType={props.type}
          children={childRef}
        />
        <View style={styles.divider}>
          <Text style={styles.title}>{i18n.t("home.special_request")}</Text>
        </View>
        <View style={{ flex: 1 }}>
          {/* <Text style={styles.bolder}>{i18n.t("home.prefer_language")}</Text>
          {language.value ? (
            <CustomInput
              value={language.label}
              onChangeText={() => setLanguage}
              onCancel={() => checkHelperEndlish("empty", true)}
              // onDropDown={onChooseLanguage}
              editable={false}
              placeholder={i18n.t("home.choose_language")}
            />
          ) : (
            <CustomInput
              value={language.label}
              onChangeText={() => setLanguage}
              onDropDown={onChooseLanguage}
              editable={false}
              placeholder={i18n.t("home.choose_language")}
            />
          )} */}
          <View style={{ marginVertical: 15 }}>
            <Text style={styles.bolder}>{i18n.t("home.specify_helper")}</Text>
            {nameHelper && oldHelper ? (
              <View style={styles.borderHelper}>
                <Image
                  source={
                    imageHelper
                      ? { uri: imageHelper }
                      : require("../../../assets/images/icon.png")
                  }
                  style={{ width: 60, height: 60, borderRadius: 30 }}
                />
                <View style={{ flexDirection: "column" }}>
                  <Text style={{ fontWeight: "bold" }}>{nameHelper}</Text>
                  <Text style={{ fontWeight: "bold" }}>
                    {oldHelper} {i18n.t("home.year_old")}
                  </Text>
                  <AirbnbRating
                    isDisabled
                    defaultRating={starHelper}
                    count={5}
                    showRating={false}
                    size={20}
                  />
                </View>
                <View style={{ flexDirection: "row" }}>
                  <Ionicons
                    onPress={() => onChooseHelper()}
                    name="open-outline"
                    size={24}
                    color={colors.gray_hidden_text}
                  />
                  <Ionicons
                    onPress={() => deleteValueHelper()}
                    name="close-circle-outline"
                    size={24}
                    color={colors.gray_hidden_text}
                  />
                </View>
              </View>
            ) : (
              <CustomInput
                onDropDown={onChooseHelper}
                editable={false}
                placeholder={i18n.t("home.select_helper")}
              />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bolder}>
              {props.type === Enum.SERVICE_TYPE.ElderService
                ? i18n.t("home.special_task")
                : props.type === Enum.SERVICE_TYPE.NanyService
                ? i18n.t("home.extra_kids")
                : i18n.t("home.extra_service")}
            </Text>
            <FlatList
              data={dataExtraService}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index, separators }) =>
                renderItem(item, index)
              }
              contentContainerStyle={
                dataExtraService.length === 0 && {
                  flexGrow: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }
              }
              ListEmptyComponent={
                <Text style={{ fontSize: 16, marginHorizontal: 10 }}>
                  {i18n.t("home.data_empty")}
                </Text>
              }
            />
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
    flex: 1,
  },
  title: {
    fontSize: 20,
    // fontWeight:'bold',
    marginBottom: 5,
  },
  divider: {
    borderBottomColor: colors.gray_hidden_text,
    borderBottomWidth: 1,
  },
  bolder: {
    fontWeight: "bold",
    marginVertical: 5,
  },
  borderHelper: {
    borderWidth: 1,
    borderColor: colors.gray_hidden_text,
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 5,
    flexDirection: "row",
    justifyContent: "space-around",
          backgroundColor: colors.white,
  },
  borderExtraService: {
    borderWidth: 1,
    borderColor: colors.gray_hidden_text,
    borderRadius: 16,
    marginVertical: 12,
  },
  textDescription: {
    color: colors.gray_hidden_text,
  },
  borderAddProfile: {
    borderColor: colors.main_color,
    borderWidth: 1,
    color: colors.main_color,
    paddingHorizontal: 10,
    paddingTop: 3,
    marginBottom: 5,
  },
  textPetCare: {
    height: 100,
          backgroundColor: colors.white,
    borderRadius: 15,
    padding: 10,
  },
});
