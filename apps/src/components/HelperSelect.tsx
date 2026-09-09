import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  ViewStyle,
  View,
  TouchableOpacity,
  StyleProp,
  Alert,
  ImageBackground,
} from "react-native";
import { useSelector } from "react-redux";
import { Overlay, SearchBar } from "react-native-elements";
import colors from "../shared/Colors";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Button, Text } from ".";
import i18n from "../shared/I18n";
import { FlatList } from "react-native-gesture-handler";
import Layout from "../shared/Layout";
import Stars from "react-native-stars";
import Constants from "../shared/Constants";
import dayjs from "../shared/dayjs";
import { paramArray } from "../shared/Utils";
import Enum from "../shared/Enum";
import { isEmpty } from "lodash";
import { apiSlice, portRequest, type ApiResult } from "../redux/apiSlice";

interface Props {
  style?: StyleProp<ViewStyle>;
  children?: any;
  valueHelper?: any;
  serviceType?: number;
  startTime?: any;
  endTime?: any;
  addressId?: any;
  language?: any;
}

export const HelperSelect = ({
  style,
  children,
  valueHelper,
  serviceType,
  startTime,
  endTime,
  addressId,
  language,
  ...props
}: Props) => {
  const [idDetail, setIdDetail] = React.useState("");
  const [nameDetail, setNameDetail] = React.useState("");
  const [imageDetail, setImageDetail] = React.useState("");
  const [starDetail, setStarDetail] = React.useState("");
  const [national, setNational] = React.useState("");
  // const [id, setId] = React.useState('');
  const [experiences, setExperiences] = React.useState(0);
  const [languageDetail, setLanguageDetail] = React.useState("");
  const [oldDetail, setOldDetail] = React.useState("");
  const [searchHelper, setSearchHelper] = React.useState("");
  const [dataHelper, setDataHelper] = React.useState<any[]>([]);
  const [dataHelperSuggest, setDataHelperSuggest] = React.useState<any[]>([]);
  const [requestListHelperTrigger, { isLoading: loadingListHelper }] =
    apiSlice.endpoints.servicesManagementHelper.useLazyQuery();
  const requestListHelper = portRequest(
    requestListHelperTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        if (response.items && response.items.length) {
          setDataHelper(
            response.items.filter((x: any) => x.status === Enum.HelperStatus.ACTIVE)
          );
        }
      }
    }
  );
  const [requestListHelperSuggestTrigger, { isLoading: loadingListHelperSuggest }] =
    apiSlice.endpoints.servicesManagementHelperSuggest.useLazyQuery();
  const requestListHelperSuggest = portRequest(
    requestListHelperSuggestTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      } else {
        if (response.items && response.items.length) {
          setDataHelperSuggest(
            response.items.filter((x: any) => x.status === Enum.HelperStatus.ACTIVE)
          );
          let dataHelperSuggest = response.items.map((x: any) => {
            if (x.status === Enum.HelperStatus.ACTIVE) {
              return x.id;
            }
          });
          requestListHelper({
            params: paramArray([
              { serviceType: serviceType },
              { startTime: dayjs(startTime).toISOString() },
              { endTime: dayjs(endTime).toISOString() },
              { addressId: addressId?.id ||  addressId?.addressId},
              { languages: (language && language.value) || "" },
              ...dataHelperSuggest.map((item: any) => ({
                serviceProvider: item,
              })),
              // { serviceProvider: dataHelperSuggest},
            ]),
          });
        }
      }
    }
  );
  const [showModal, setShowModal] = React.useState(false);
  const [showModalDetail, setShowModalDetail] = React.useState(false);
  React.useImperativeHandle(children, () => ({
    openModalHelper() {
      setShowModal(true);
    },
  }));
  const submitHelper = () => {
    let dataSelect: any;
    let dataSelectSuggest: any;
    dataSelect = dataHelper.find((x) => x.isSelect === true);
    dataSelectSuggest = dataHelperSuggest.find((x) => x.isSelect === true);
    if (dataSelect) {
      setShowModalDetail(false);
      setShowModal(false);
      valueHelper(
        dataSelect.id,
        dataSelect.fullName,
        dataSelect.old,
        dataSelect.star,
        dataSelect.avatar
      );
    } else if (dataSelectSuggest) {
      valueHelper(
        dataSelectSuggest.id,
        dataSelectSuggest.fullName,
        dataSelectSuggest.old,
        dataSelectSuggest.star,
        dataSelectSuggest.avatar
      );
      setShowModalDetail(false);
      setShowModal(false);
    } else {
      Alert.alert(i18n.t("auth.error"), i18n.t("home.select_your_helper"));
    }
  };
  const searchNameHelper = (value?: any) => {
    setSearchHelper(value);
    requestListHelper({
      params: paramArray([
        { serviceType: serviceType },
        { name: value },
        { addressId: addressId?.id },
        { startTime: dayjs(startTime).toISOString() },
        { endTime: dayjs(endTime).toISOString() },
      ]),
    });
  };
  const onSelectHelper = (value: any, idx: any) => {
    let valueHelpers = [...dataHelper];
    let valueHelperSuggest = [...dataHelperSuggest];
    for (let index = 0; index < valueHelpers.length; index++) {
      valueHelpers[index].isSelect = false;
    }
    for (let index = 0; index < valueHelperSuggest.length; index++) {
      valueHelperSuggest[index].isSelect = false;
    }
    if (value) {
      valueHelpers[idx].isSelect = false;
    } else {
      valueHelpers[idx].isSelect = true;
    }
    setDataHelper(valueHelpers);
    setDataHelperSuggest(valueHelperSuggest);
  };
  const onSelectHelperSuggest = (value: any, idx: any) => {
    let valueHelperSuggest = [...dataHelperSuggest];
    let valueHelpers = [...dataHelper];
    for (let index = 0; index < valueHelperSuggest.length; index++) {
      valueHelperSuggest[index].isSelect = false;
    }
    for (let index = 0; index < valueHelpers.length; index++) {
      valueHelpers[index].isSelect = false;
    }
    if (value) {
      valueHelperSuggest[idx].isSelect = false;
    } else {
      valueHelperSuggest[idx].isSelect = true;
    }
    setDataHelperSuggest(valueHelperSuggest);
    setDataHelper(valueHelpers);
  };
  const renderItem = (item: any, idx: any) => (
    <View key={idx} style={styles.viewImage}>
      <TouchableOpacity onPress={() => showDetail(item, idx, 1)}>
        <ImageBackground
          resizeMode={"cover"}
          imageStyle={[item.isSelect && styles.select, { borderRadius: 50 }]}
          source={
            item.avatar
              ? { uri: item.avatar }
              : require("../assets/images/icon.png")
          }
          style={styles.image}
        />
        <View style={{ alignItems: "center" }}>
          <Stars
            display={item.star}
            count={5}
            starSize={40}
            half
            disabled
            halfStar={
              <Ionicons
                color={colors.yellow}
                size={15}
                name="star-half-sharp"
              />
            }
            fullStar={<Ionicons color={colors.yellow} size={15} name="star" />}
            emptyStar={
              <Ionicons color={colors.yellow} size={15} name="star-outline" />
            }
          />
        </View>
        <Text style={styles.textItem}>{item.fullName}</Text>
      </TouchableOpacity>
    </View>
  );
  const showDetail = (detail: any, idx: number, type: number) => {
    type == 1
      ? onSelectHelper(detail.isSelect, idx)
      : onSelectHelperSuggest(detail.isSelect, idx);
    setIdDetail(detail.id);
    setNameDetail(detail.fullName);
    setOldDetail(detail.old);
    setImageDetail(detail.avatar);
    setStarDetail(detail.star);
    setNational(detail.country);
    setExperiences(detail.experiences);
    let dataDetailLanguage = [];
    dataDetailLanguage = JSON.parse(detail.skillLanguage);
    setLanguageDetail(dataDetailLanguage.toString());
    setShowModalDetail(true);
  };
  const closeModalDetail = () => {
    setShowModalDetail(false);
  };
  const selectHelper = (
    id: string,
    name: string,
    old: any,
    star: any,
    image: any
  ) => {
    valueHelper(id, name, old, star, image);
    setShowModalDetail(false);
    setShowModal(false);
  };
  React.useEffect(() => {
    requestListHelperSuggest({
      params: paramArray([
        { serviceType: serviceType },
        { addressId: addressId?.id ||  addressId?.addressId},
        { startTime: dayjs(startTime).toISOString() },
        { endTime: dayjs(endTime).toISOString() },
      ]),
    });
  }, []);
  const header = () => {
    return (
      <View>
        <Text style={styles.title}>{i18n.t("home.suggest_for_you")}</Text>
        <View style={styles.borderSuggest}>
          {dataHelperSuggest.length ? (
            dataHelperSuggest.map((x: any, idx) => {
              return (
                <View key={idx} style={styles.viewImage}>
                  <TouchableOpacity onPress={() => showDetail(x, idx, 2)}>
                    {x && x.avatar ? (
                      <ImageBackground
                        imageStyle={[
                          x.isSelect && styles.select,
                          { borderRadius: 50 },
                        ]}
                        source={
                          x.avatar
                            ? { uri: x.avatar }
                            : require("../assets/images/icon.png")
                        }
                        style={styles.image}
                      />
                    ) : (
                      <FontAwesome
                        name="user-circle-o"
                        size={95}
                        color={
                          x.isSelect
                            ? colors.grab_orange
                            : colors.gray_hidden_text
                        }
                      />
                    )}
                    <View style={{ alignItems: "center" }}>
                      <Stars
                        display={x.star}
                        count={5}
                        starSize={40}
                        half
                        disabled
                        halfStar={
                          <Ionicons
                            color={colors.yellow}
                            size={15}
                            name="star-half-sharp"
                          />
                        }
                        fullStar={
                          <Ionicons
                            color={colors.yellow}
                            size={15}
                            name="star"
                          />
                        }
                        emptyStar={
                          <Ionicons
                            color={colors.yellow}
                            size={15}
                            name="star-outline"
                          />
                        }
                      />
                    </View>
                    <Text style={styles.textItem}>{x.fullName}</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <Text
              style={{
                fontSize: 20,
                marginHorizontal: 10,
                textAlign: "center",
              }}
            >
              {i18n.t("home.data_empty")}
            </Text>
          )}
        </View>
        <Text style={styles.title}>{i18n.t("home.select_your_helper")}</Text>
      </View>
    );
  };
  const OnForwardHelper = () => {
    const list = [...dataHelperSuggest, ...dataHelper];
    const findData = dataHelper.findIndex((i) => i.id == idDetail);
    const findSuggest = dataHelperSuggest.findIndex((i) => i.id == idDetail);

    if (findData > 0) {
      showDetail(
        list[findData - 1 + dataHelperSuggest.length],
        findData - 1,
        1
      );
    }
    if (findData == 0) {
      showDetail(
        list[dataHelperSuggest.length - 1],
        dataHelperSuggest.length - 1,
        2
      );
    }
    if (findSuggest > 0) {
      showDetail(list[findSuggest - 1], findSuggest - 1, 2);
    }
  };
  const OnNextHelper = () => {
    const list = [...dataHelperSuggest, ...dataHelper];
    const findData = dataHelper.findIndex((i) => i.id == idDetail);
    const findSuggest = dataHelperSuggest.findIndex((i) => i.id == idDetail);

    if (findData + 1 < dataHelper.length) {
      showDetail(
        list[findData + 1 + dataHelperSuggest.length],
        findData + 1,
        1
      );
    }
    if (findSuggest + 1 < dataHelperSuggest.length && findSuggest != -1) {
      showDetail(list[findSuggest + 1], findSuggest + 1, 2);
    }
  };
  const OnFirstHelper = () => {
    if (!isEmpty(dataHelperSuggest)) {
      showDetail(dataHelperSuggest[0], 0, 2);
      return;
    }
    if (!isEmpty(dataHelper)) {
      showDetail(dataHelper[0], 0, 1);
      return;
    }
  };
  const OnEndHelper = () => {
    if (!isEmpty(dataHelper)) {
      showDetail(dataHelper[dataHelper.length - 1], dataHelper.length - 1, 1);
      return;
    }
    if (!isEmpty(dataHelperSuggest)) {
      showDetail(
        dataHelperSuggest[dataHelperSuggest.length - 1],
        dataHelperSuggest.length - 1,
        2
      );
      return;
    }
  };
  const onChooseHelper = (item: any, idx: number) => {
    if (item.id != idDetail) {
      const findData = dataHelper.filter((i) => i.id == item.id);
      const findSuggest = dataHelperSuggest.filter((i) => i.id == item.id);
      if (findData.length > 0) {
        showDetail(item, idx - dataHelperSuggest.length, 1);
      }
      if (findSuggest.length > 0) {
        showDetail(item, idx, 2);
      }
    }
  };

  return (
    <Overlay isVisible={showModal} fullScreen={true}>
      <View
        style={{
          flex: 1,
          position: "absolute",
          width: Layout.window.width,
          height: Layout.window.height,
        }}
      >
        {/* Helper detail */}
        <Overlay isVisible={showModalDetail} onBackdropPress={closeModalDetail}>
          <View style={{ width: Layout.window.width - 40 }}>
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Image
                source={
                  imageDetail
                    ? { uri: imageDetail }
                    : require("../assets/images/icon.png")
                }
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />

              <Stars
                display={starDetail}
                count={5}
                starSize={40}
                half
                disabled
                halfStar={
                  <Ionicons
                    color={colors.yellow}
                    size={15}
                    name="star-half-sharp"
                  />
                }
                fullStar={
                  <Ionicons color={colors.yellow} size={15} name="star" />
                }
                emptyStar={
                  <Ionicons
                    color={colors.yellow}
                    size={15}
                    name="star-outline"
                  />
                }
              />
              <Text style={{ fontWeight: "bold", fontSize: 17 }}>
                {nameDetail}
              </Text>
            </View>
            <Text style={{ fontWeight: "bold", fontSize: 17 }}>Profile</Text>
            <Text style={{ fontWeight: "500", fontSize: 15 }}>
              Nationality: {national}
            </Text>
            <Text style={{ fontWeight: "500", fontSize: 15 }}>
              Experiences:{" "}
              <Text
                style={{
                  fontSize: 15,
                  color: colors.gray,
                }}
              >
                {experiences > 0
                  ? `experience ${experiences} years \n(Family from ${national})`
                  : "No experience"}
              </Text>
            </Text>
            <Text
              numberOfLines={2}
              style={{
                fontWeight: "500",
                fontSize: 15,
              }}
            >
              Language:{" "}
              <Text
                style={{
                  fontSize: 15,
                  color: colors.gray,
                }}
              >
                {languageDetail}
              </Text>
            </Text>
            {!isEmpty([...dataHelperSuggest, ...dataHelper]) && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 24,
                }}
              >
                <FontAwesome
                  style={{ paddingHorizontal: 6 }}
                  size={22}
                  name="angle-double-left"
                  onPress={OnFirstHelper}
                />
                <FontAwesome
                  style={{ paddingHorizontal: 6 }}
                  size={22}
                  name="angle-left"
                  onPress={OnForwardHelper}
                />
                {[...dataHelperSuggest, ...dataHelper].map((i, idx) => (
                  <Text
                    key={idx}
                    onPress={() => onChooseHelper(i, idx)}
                    style={{
                      padding: 6,
                      fontSize: 20,
                      color: idDetail == i.id ? colors.grab_orange : colors.black_text,
                    }}
                  >
                    {idx + 1}
                  </Text>
                ))}
                <FontAwesome
                  style={{ paddingHorizontal: 6 }}
                  size={22}
                  name="angle-right"
                  onPress={OnNextHelper}
                />
                <FontAwesome
                  style={{ paddingHorizontal: 6 }}
                  size={22}
                  name="angle-double-right"
                  onPress={OnEndHelper}
                />
              </View>
            )}
            <View
              style={{ flexDirection: "row", justifyContent: "space-evenly" }}
            >
              <Button
                onPress={closeModalDetail}
                colorBackground={colors.gray_hidden_text}
                title={i18n.t("home.cancel")}
                style={{ width: "50%", paddingRight: 5 }}
              />
              <Button
                onPress={() =>
                  selectHelper(
                    idDetail,
                    nameDetail,
                    oldDetail,
                    starDetail,
                    imageDetail
                  )
                }
                title={i18n.t("auth.confirm")}
                style={{ width: "50%" }}
              />
            </View>
          </View>
        </Overlay>
        {/* *************** */}

        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => setShowModal(false)}
            style={{ flexDirection: "row", padding: 10 }}
          >
            <Ionicons name="close-circle-outline" size={30} color={colors.white} />
            <Text style={styles.textClose}>{i18n.t("home.close")}</Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            marginTop: 10,
            paddingHorizontal: 15,
            flex: 1,
          }}
        >
          <Text style={{ fontWeight: "bold", fontSize: 17 }}>
            {i18n.t("home.specify_helper")}
          </Text>
          <SearchBar
            placeholder={i18n.t("home.search_helper")}
            onChangeText={searchNameHelper}
            value={searchHelper}
            // containerStyle={{backgroundColor:"transparent"}}
            showLoading={loadingListHelper}
            loadingProps={{ color: colors.blue_link }}
            platform="ios"
            onCancel={() => console.log("Cancel")}
            // react-native-elements SearchBar types require these presentation
            // props even though they're optional at runtime; supplying defaults.
            lightTheme={false}
            round={false}
            onClear={() => {}}
            onFocus={() => {}}
            onBlur={() => {}}
            searchIcon={{ name: "search", color: colors.gray_hidden_text }}
            clearIcon={{ name: "clear", color: colors.gray_hidden_text }}
            showCancel={false}
            cancelButtonTitle=""
            cancelButtonProps={{}}
          />
          <View style={{ flex: 1 }}>
            <FlatList
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={header}
              contentContainerStyle={
                dataHelper.length === 0 && {
                  flexGrow: 1,
                  justifyContent: "center",
                  height: "100%",
                }
              }
              ListFooterComponentStyle={{ flex: 1, justifyContent: "flex-end" }}
              numColumns={3}
              data={dataHelper}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => renderItem(item, index)}
              ListEmptyComponent={
                <Text
                  style={{
                    fontSize: 20,
                    marginHorizontal: 10,
                    alignSelf: "center",
                  }}
                >
                  {i18n.t("home.data_empty")}
                </Text>
              }
              ListFooterComponent={() => (
                <View style={{ padding: 16 }}>
                  <Button
                    title={i18n.t("auth.confirm")}
                    style={{ width: "100%" }}
                    onPress={() => submitHelper()}
                  />
                </View>
              )}
            />
          </View>
        </View>
      </View>
    </Overlay>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 55,
    marginTop: Platform.OS === "ios" ? 25 : 0,
    backgroundColor: colors.main_color,
  },
  select: {
    borderColor: colors.main_color,
    borderWidth: 2,
  },
  borderSuggest: {
    flexDirection: "row",
    borderBottomColor: colors.gray_hidden_text,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  textClose: {
    color: colors.white,
    fontSize: 20,
    marginLeft: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "400",
    marginVertical: 6,
  },
  text: {
    textAlign: "center",
  },
  viewImage: {
    flex: 1,
    width: "33.3333333%",
    alignItems: "center",
  },
  image: {
    // justifyContent: "flex-end",
    width: 95,
    aspectRatio: 1 / 1,
  },
  textItem: {
    fontWeight: "200",
    fontSize: 13,
    textAlign: "center",
  },
});
