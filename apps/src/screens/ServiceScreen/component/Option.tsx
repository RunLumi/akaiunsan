import React from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Button,
  CustomInput,
  HelperSelect,
  HelperSelectFixPlan,
  Text,
  TextInput,
} from "../../../components";
import i18n from "../../../shared/I18n";
import colors from "../../../shared/Colors";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { TYPES } from "../../../redux/actions";
import { CheckBox, AirbnbRating, Overlay } from "react-native-elements";
import Enum from "../../../shared/Enum";
import useApi from "../../../hooks/useApi";
import Constants from "../../../shared/Constants";
import _, { isNil } from "lodash";
import { ScrollView } from "react-native-gesture-handler";

export default function Option(props: any) {
  const extraService = props.extraService || [];
  const workingHour = props.valueShowHour || [];
  const numberKids = props.numberKids || { numberKids: 0, age: [0] };
  const numberPet = props.numberPet || 0;
  const extraServiceCleaning = props.extraServiceCleaning || [];
  const [dataExtraService, setDataExtraService] = React.useState([]);
  const [dataExtraServiceCleaning, setDataExtraServiceCleaning] =
    React.useState(extraServiceCleaning);
  const [nameHelper, setNameHelper] = React.useState(
    props?.dataEdit?.serviceProvider
      ? props?.dataEdit?.serviceProvider.fullName
      : ""
  );
  const [oldHelper, setOldHelper] = React.useState(
    props?.dataEdit?.serviceProvider ? props?.dataEdit?.serviceProvider.old : ""
  );
  const [starHelper, setStarHelper] = React.useState(
    props?.dataEdit?.serviceProvider ? props?.dataEdit?.serviceProvider.star : 0
  );
  const [imageHelper, setImageHelper] = React.useState(
    props?.dataEdit?.serviceProvider
      ? props?.dataEdit?.serviceProvider.avatar
      : ""
  );
  const [petCareActivities, setPetCareActivities] = React.useState(
    props.activitiesPetCare
  );
  const [priceSpecifyHelper, setPriceSpecifyHelper] = React.useState<any>({});
  const [pricePreferLanguage, setPricePreferLanguage] = React.useState([]);
  const dispatch = useDispatch();
  const [language, setLanguage] = React.useState<{
    label?: string;
    value?: string;
  }>({});

  const [loadingPriceSpecialRequest, requestPriceSpecialRequest] = useApi({
    method: "get",
    url: Constants.API.price_special_request,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        let getPriceSpecifyHelper = response.items.find(
          (x) => x.code === Enum.PriceSpecialRequest.COSTSP
        );
        let getPricePreferLanguage = response.items.filter((y) => {
          if (y.code === Enum.PriceSpecialRequest.LANGUAGE) {
            return { ...y };
          }
        });
        setPricePreferLanguage(getPricePreferLanguage);
        setPriceSpecifyHelper(getPriceSpecifyHelper);
      }
    },
  });
  const childRef = React.useRef();
  const onChooseHelper = () => {
    childRef.current.openModalHelper();
  };

  const onChooseNumberKid = () => {
    const kidNumber = [
      { label: 0, value: 0 },
      { label: 1, value: 1 },
      { label: 2, value: 2 },
      { label: 3, value: 3 },
      { label: 4, value: 4 },
      { label: 5, value: 5 },
    ];
    dispatch({
      type: TYPES.TOOLS.OPEN_PICKER,
      payload: {
        data: kidNumber,
        selected: 0,
        callback: (selected: number) => {
          props.onSelectNumberKid({
            age: Array.from(Array(selected).fill(0)),
            numberKids: selected,
          });
          const count = (selected - numberKids.numberKids) * 200;
          props.handlePriceExtraService(count, "plus");
        },
      },
    });
  };
  const onChooseNumberPet = () => {
    const petNumber = [
      { label: 0, value: 0 },
      { label: 1, value: 1 },
      { label: 2, value: 2 },
      { label: 3, value: 3 },
      { label: 4, value: 4 },
      { label: 5, value: 5 },
    ];
    dispatch({
      type: TYPES.TOOLS.OPEN_PICKER,
      payload: {
        data: petNumber,
        selected: 0,
        callback: (selected: number) => {
          props.onSelectNumberPet(selected);
          const count = (selected - numberPet) * props.times.length * 200;
          props.handlePriceExtraService(count, "plus");
        },
      },
    });
  };

  const handleValueHelper = (
    id: any,
    name: any,
    old: any,
    star: any,
    image: any
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

  const onCheckExtraService = (value, idx: any) => {
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
        extraService[index].price =
          extraService[index].perTime * props.times.length;
      }
    }
    setDataExtraService(extraService);
  };

  React.useEffect(() => {
    requestPriceSpecialRequest();
    if (props.type != Enum.SERVICE_TYPE.CleaningService) {
      addPriceToExtraService();
    }
    // if(props.valueSpecialHelper && props.valueSpecialHelper.name && props.valueSpecialHelper.old){
    //   setNameHelper(props.valueSpecialHelper.name);
    //   setOldHelper(props.valueSpecialHelper.old);
    //   setStarHelper(props.valueSpecialHelper.star);
    //   setImageHelper(props.valueSpecialHelper.image);
    // }
    // if(props.valuePreferLanguage){
    //   setLanguage(props.valuePreferLanguage)
    // }
  }, [workingHour]);

  const onSetAgeKid = (text: string = "0", index: number) => {
    if (text) {
      numberKids.age[index] = parseInt(text);
      props.onSelectNumberKid({
        ...numberKids,
      });
    } else {
      numberKids.age[index] = parseInt("0");
      props.onSelectNumberKid({
        ...numberKids,
      });
    }
  };

  React.useEffect(() => {
    props.onSelectNumberKid(numberKids);
  }, [numberKids]);
  const renderItem = ({ item, index }) => {
    return (
      <View
        style={[
          styles.borderExtraService,
          props.isEdit && { backgroundColor: colors.gray_hidden_text },
        ]}
      >
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
            <Text
              style={[
                styles.textDescription,
                props.isEdit && { color: colors.white },
              ]}
            >
              {item.description}
            </Text>
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
                ? item.perTime * props.times.length
                : item.perHour * workingHour}
            </Text>
            <CheckBox
              disabled={props.isEdit}
              size={30}
              checkedIcon="dot-circle-o"
              uncheckedIcon="circle-o"
              checked={item.isCheck}
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
  const renderItemACCleaning = (item, idx) => (
    <View
      key={idx}
      style={[
        styles.borderExtraService,
        props.isEdit && { backgroundColor: colors.gray_hidden_text },
      ]}
    >
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginLeft: 16,
          },
          item.isCheck && { marginVertical: 4 },
        ]}
      >
        <View style={{ flexDirection: "column", flex: 1 }}>
          <Text style={styles.bolder}>{`${item.acType}_${item.btu}`}</Text>
          {item.isCheck && (
            <View style={{ flexDirection: "row" }}>
              <Ionicons
              
                onPress={() => minusCountACCleaning(item.count, idx)}
                name="remove-circle"
                size={20}
                color={colors.main_color}
              />
              <Text style={{ paddingHorizontal: 15, fontSize: 15 }}>
                {item.count}
              </Text>
              <Ionicons
                onPress={() => plusCountACCleaning(item.count, idx)}
                name="add-circle"
                size={20}
                color={colors.main_color}
              />
            </View>
          )}
        </View>
        {(!isNil(item.image) || !isNil(item.icon)) && (
          <Image
            source={{ uri: item.image || item.icon }}
            style={{ height: 60, width: 60 }}
            resizeMode="contain"
          />
        )}
        <CheckBox
          size={30}
          disabled={props.isEdit}
          checkedIcon="dot-circle-o"
          uncheckedIcon="circle-o"
          checked={item.isCheck}
          uncheckedColor={colors.main_color}
          checkedColor={colors.main_color}
          onPress={() => onCheckACCleaning(item.isCheck, idx)}
        />
      </View>
    </View>
  );
  const onCheckACCleaning = (value, idx: any) => {
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
  const minusCountACCleaning = (value, idx: any) => {
    if (props.isEdit) return
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
  const plusCountACCleaning = (value, idx: any) => {
    if (props.isEdit) return

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
    props?.dataEdit?.bookingDetail.petProfiles || []
  );
  const [namePetcare, setNamePetcare] = React.useState("");
  const [typePetcare, setTypePetcare] = React.useState("");
  const [isModalPetCare, setIsModalPetCare] = React.useState(false);
  const toggleOverlayPetCare = () => {
    setIsModalPetCare(!isModalPetCare);
  };

  const addProfilePet = () => {
    let data = [...dataPetcare];
    data.push({ name: namePetcare, type: typePetcare });
    setDataPetcare(data);
    props.handleProfilePet(data, petCareActivities);
    setNamePetcare("");
    setTypePetcare("");
    setIsModalPetCare(false);
  };

  const deletePetProfile = (idx) => {
    let data = [...dataPetcare];
    data.splice(idx, 1);
    setDataPetcare(data);
  };

  const onchangePetCareActivities = (value: string) => {
    setPetCareActivities(value);
    props.handleProfilePet(dataPetcare, value);
  };
  const renderHeaderPetcare = () => {
    return (
      <View style={{ flex: 1 }}>
        {!_.isNil(props.fixplanTimes) ? (
          <HelperSelectFixPlan
            valueHelper={handleValueHelper}
            language={language}
            addressId={props.idAddress}
            serviceType={props.type}
            children={childRef}
            times={props.fixplanTimes}
          />
        ) : (
          <HelperSelect
            valueHelper={handleValueHelper}
            language={language}
            addressId={props.idAddress}
            startTime={props.startTime}
            endTime={props.endTime}
            serviceType={props.type}
            children={childRef}
          />
        )}
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
          style={{
            justifyContent: "center",
            paddingVertical: 8,
          }}
        >
          <Text style={styles.title}>{i18n.t("home.special_request")}</Text>

          <Text style={styles.bolder}>{i18n.t("home.specify_helper")}</Text>

          {nameHelper && oldHelper ? (
            <View style={styles.borderHelper}>
              {imageHelper ? (
                <Image
                  source={
                    imageHelper
                      ? { uri: imageHelper }
                      : require("../../../assets/images/icon.png")
                  }
                  style={{
                    width: 60,
                    // height: 60,
                    aspectRatio: 1 / 1,
                    borderRadius: 30,
                  }}
                />
              ) : (
                <FontAwesome
                  name="user-circle-o"
                  size={60}
                  color={colors.grab_orange}
                />
              )}
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
                {!props.isEdit && (
                  <Ionicons
                    onPress={() => deleteValueHelper()}
                    name="close-circle-outline"
                    size={24}
                    color={colors.gray_hidden_text}
                  />
                )}
              </View>
            </View>
          ) : props?.isEdit ? null : (
            <CustomInput
              containerStyle={{ marginLeft: 6, width: "97%" }}
              onDropDown={onChooseHelper}
              editable={false}
              placeholder={i18n.t("home.select_helper")}
            />
          )}
        </View>
        <Text
          onPress={() => setIsModalPetCare(true)}
          style={styles.borderAddProfile}
        >
          Add profile
        </Text>
      </View>
    );
  };
  const renderFooterPetcare = () => {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.divider}>
          <Text style={styles.title}>{i18n.t("home.activities")}</Text>
        </View>
        <View style={{ flex: 1, paddingTop: 10 }}>
          <TextInput
            value={petCareActivities}
            onChangeText={(value) => onchangePetCareActivities(value)}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={styles.textPetCare}
          />
        </View>
        <Text style={styles.titleItem}>{i18n.t("home.extra_pet")}</Text>
        <View style={{ paddingLeft: 20, paddingRight: 4 }}>
          <Text style={styles.titleItem}>{i18n.t("home.number_pet")}</Text>
          <CustomInput
            disabled={props.isEdit}
            onDropDown={onChooseNumberPet}
            editable={false}
            value={numberPet.toString()}
            style={{ fontWeight: "bold" }}
          />
        </View>
      </View>
    );
  };
  const renderItemPetCare = (item, idx) => (
    <View key={idx} style={[styles.borderExtraService, { padding: 10 }]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginHorizontal: 12,
        }}
      >
        <Text style={{ color: colors.gray_normal_text, fontSize: 17 }}>
          {i18n.t("home.pet_profile")}
        </Text>
        <Ionicons
          onPress={() => deletePetProfile(idx)}
          name="trash"
          size={20}
          color="black"
        />
      </View>
      <View>
        <View style={{ flexDirection: "row", marginVertical: 6 }}>
          <Text style={{ marginLeft: 12, color: colors.gray_hidden_text }}>
            {i18n.t("home.name")}:
          </Text>
          <Text style={{ marginLeft: 5, color: colors.gray_hidden_text }}>
            {item.name}
          </Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={{ marginLeft: 12, color: colors.gray_hidden_text }}>
            {i18n.t("home.type")}:
          </Text>
          <Text style={{ marginLeft: 5, color: colors.gray_hidden_text }}>
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 12 }}
        >
          {renderHeaderPetcare()}
          <FlatList
            showsVerticalScrollIndicator={false}
            data={dataPetcare}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index, separators }) =>
              renderItemPetCare(item, index)
            }
            contentContainerStyle={{ paddingVertical: 12 }}
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
          {renderFooterPetcare()}
        </ScrollView>
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
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index, separators }) =>
            renderItemACCleaning(item, index)
          }
          contentContainerStyle={[
            dataExtraServiceCleaning.length === 0 && {
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            },
            props.isEdit && { backgroundColor: colors.gray_hidden_text },
          ]}
          ListEmptyComponent={
            <Text style={{ fontSize: 16, marginHorizontal: 10 }}>
              {i18n.t("home.data_empty")}
            </Text>
          }
        />
      </View>
    );
  } else {
    const keyboardVerticalOffset = Platform.OS === "ios" ? 64 : 0;
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, flexDirection: "column", justifyContent: "center" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {!_.isNil(props.fixplanTimes) ? (
              <HelperSelectFixPlan
                valueHelper={handleValueHelper}
                language={language}
                addressId={props.idAddress}
                serviceType={props.type}
                children={childRef}
                times={props.fixplanTimes}
              />
            ) : (
              <HelperSelect
                valueHelper={handleValueHelper}
                language={language}
                addressId={props.idAddress}
                startTime={props.startTime}
                endTime={props.endTime}
                serviceType={props.type}
                children={childRef}
              />
            )}
            <View style={styles.divider}>
              <Text style={styles.title}>{i18n.t("home.special_request")}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ marginVertical: 15 }}>
                <Text style={styles.bolder}>
                  {i18n.t("home.specify_helper")}
                </Text>
                {nameHelper && oldHelper ? (
                  <View style={styles.borderHelper}>
                    {imageHelper ? (
                      <Image
                        source={
                          imageHelper
                            ? { uri: imageHelper }
                            : require("../../../assets/images/icon.png")
                        }
                        style={{
                          width: 60,
                          height: 60,
                          aspectRatio: 1,
                          borderRadius: 30,
                        }}
                      />
                    ) : (
                      <FontAwesome
                        name="user-circle-o"
                        size={60}
                        color={colors.grab_orange}
                      />
                    )}
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
                      {!props.isEdit && (
                        <Ionicons
                          onPress={() => deleteValueHelper()}
                          name="close-circle-outline"
                          size={24}
                          color={colors.gray_hidden_text}
                        />
                      )}
                    </View>
                  </View>
                ) : props?.isEdit ? null : (
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
                {props.type !== 2 && (
                  <FlatList
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={
                      dataExtraService.length === 0 && {
                        flexGrow: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }
                    }
                    data={dataExtraService}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderItem}
                    ListEmptyComponent={
                      <Text style={{ fontSize: 16, marginHorizontal: 10 }}>
                        {i18n.t("home.data_empty")}
                      </Text>
                    }
                  />
                )}
                {props.type == 2 && (
                  <View style={styles.nannyExtraContainer}>
                    <Text style={styles.titleItem}>
                      {i18n.t("home.number_kids")}
                    </Text>
                    <CustomInput
                      disabled={props?.isEdit}
                      onDropDown={onChooseNumberKid}
                      editable={false}
                      value={numberKids.numberKids.toString()}
                      style={{ fontWeight: "bold" }}
                      containerStyle={{ marginVertical: 6 }}
                    />
                    {numberKids.numberKids != 0 && (
                      <Text style={styles.titleItem}>{i18n.t("home.age")}</Text>
                    )}
                    {Array.from(Array(numberKids.numberKids)).map(
                      (i, index) => (
                        <CustomInput
                          key={index}
                          keyboardType="numeric"
                          returnKeyType="done"
                          maxLength={2}
                          onChangeText={(text) => onSetAgeKid(text, index)}
                          value={numberKids.age[index].toString()}
                          style={{ fontWeight: "bold" }}
                          containerStyle={{ marginVertical: 6 }}
                        />
                      )
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
  },
  divider: {
    borderBottomColor: colors.gray_hidden_text,
    borderBottomWidth: 1,
  },
  bolder: {
    fontWeight: "700",
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
    backgroundColor: "white",
  },
  borderExtraService: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginVertical: 12,
  },
  textDescription: {
    color: colors.gray_normal_text,
  },
  borderAddProfile: {
    borderColor: colors.main_color,
    borderWidth: 1,
    alignSelf: "flex-end",
    color: colors.main_color,
    paddingHorizontal: 10,
    paddingTop: 3,
    marginBottom: 5,
  },
  textPetCare: {
    height: 100,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 10,
  },
  nannyExtraContainer: {
    flex: 1,
    paddingLeft: 24,
    paddingRight: 6,
    marginBottom: 12,
  },
  titleItem: {
    fontSize: 15,
    fontWeight: "bold",
  },
});
