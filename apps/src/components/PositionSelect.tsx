import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  ViewStyle,
  View,
  TouchableOpacity,
  Dimensions,
  StyleProp,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { Overlay } from "react-native-elements";
import colors from "../shared/Colors";
import Theme from "../shared/theme";
import { Ionicons } from "@expo/vector-icons";
import { Button, CustomInput, Text } from ".";
import i18n from "../shared/I18n";
import Constants from "../shared/Constants";
import * as Location from "expo-location";
import _, { isEmpty, isNil } from "lodash";
import MapView, { Marker } from "react-native-maps";
import Enum from "../shared/Enum";
import Layout from "../shared/Layout";
import { Container } from "./Container";
import { getRegionForCoordinates } from "../shared/Utils";
import { googleAddressGeocodeAsync } from "../shared/Geocoding";
import { useFocusEffect } from "@react-navigation/core";
import { apiSlice, portRequest, type ApiResult, type RequestArg } from "../redux/apiSlice";
import type { ApiItem } from "../redux/apiSlice";
const full_width = Dimensions.get("window").width;

interface Props {
  style?: StyleProp<ViewStyle>;
  children?: React.Ref<unknown>;
  valuePosition?: () => void;
  navigation?: ApiItem;
  type?: number;
}

export const PositionSelect = ({
  style,
  children,
  valuePosition,
  navigation,
  type,
  ...props
}: Props) => {
  const mapView = useRef<any>(null);
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [itemId, setItemId] = useState(null);
  const [bedroomNumber, setBedroomNumber] = useState(0);
  const [bathroomNumber, setBathroomNumber] = useState(0);
  const [room, setRoom] = useState("");
  const [phone, setPhone] = useState("");
  const [remarks, setRemarks] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [homeType, setHomeType] = useState({
    condo: false,
    apartment: false,
    house: false,
  });
  const [address, setAddress] = useState<ApiItem | null>();
  const [location, setLocation] = useState<ApiItem | null>(null);
  const notSelectHomeType = { condo: false, apartment: false, house: false };
  React.useImperativeHandle(children, () => ({
    openModalPosition(item: ApiItem) {
      setShowModal(true);
      setItemId(null);
      setBathroomNumber(0);
      setBedroomNumber(0);
      setRemarks("");
      setRoom("");
      setPhone("");
      setHomeType({
        condo: false,
        apartment: false,
        house: false,
      });
      setAddress({
        city: null,
        district: null,
        street: null,
        region: null,
        subregion: null,
        country: null,
        postalCode: null,
        name: null,
        isoCountryCode: null,
        timezone: null,
      });
      setLocation(null);

      if (!_.isNil(item)) {
        setItemId(item.id);
        setBathroomNumber(item.batchroomNo);
        setBedroomNumber(item.bedroomNo);
        setRemarks(item.remark);
        setRoom(item.roomNo);
        setPhone(item.phoneNumber);
        setHomeType({
          condo: item.roomType == 0,
          apartment: item.roomType == 1,
          house: item.roomType == 2,
        });

        setIsDefaultAddress(item.isDefault);

        setAddress({
          city: null,
          district: item.ward,
          street: item.name || item.shortAddress,
          region: item.province,
          subregion: item.district,
          country: item.country,
          postalCode: null,
          name: item.shortAddress,
          isoCountryCode: null,
          timezone: null,
        });

        setLocation({
          coords: {
            latitude: item.latitude,
            longitude: item.longitude,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: 0,
        });
      }
    },
  }));

  const onPressClose = () => {
    setBathroomNumber(0);
    setBedroomNumber(0);
    setRemarks("");
    setRoom("");
    setPhone("");
    setHomeType({
      condo: false,
      apartment: false,
      house: false,
    });

    setShowModal(false);
  };
  const submitPosition = () => {
    if (
      type == Enum.SERVICE_TYPE.MaidService &&
      (_.isNil(room) || _.isEmpty(room))
    ) {
      Alert.alert(i18n.t("auth.error"), i18n.t("home.validate_position"));
      return;
    }

    if (_.isNil(address) || _.isNil(address.name) || _.isNil(location)) {
      Alert.alert(i18n.t("auth.error"), i18n.t("home.validate_address"));
      return;
    }

    if (_.isNil(phone) || _.isEmpty(phone)) {
      Alert.alert(i18n.t("auth.error"), i18n.t("home.validate_phone"));
      return;
    }

    if (!/(84|0)+([0-9]{8,9})\b/.test(phone)) {
      Alert.alert(i18n.t("auth.error"), i18n.t("auth.validate_phone"));
      return;
    }

    // user && user.fullName,
    // "address test",
    // room,
    // phone,
    // remarks,
    // bedroomNumber,
    // bathroomNumber

    let roomType = 0;
    _.forEach(homeType, (v, k) => {
      if (v === true) {
        switch (k) {
          case "apartment":
            roomType = 1;
            break;
          case "house":
            roomType = 2;
            break;
          default:
            break;
        }
      }
    });
    request({
      data: {
        id: itemId || null,
        phoneNumber: phone,
        shortAddress: address.name,
        longAddress: getLongAddress(address!),
        isDefault: isDefaultAddress,
        country: address.country,
        province: address.region || "",
        district: address.district || address.subregion || "...",
        ward: address.district || "string",
        latitude: location.coords.latitude || 0,
        longitude: location.coords.longitude || 0,
        roomNo: room,
        remark: remarks,
        bedroomNo: bedroomNumber,
        batchroomNo: bathroomNumber,
        roomType: roomType,
      },
    });
  };
  const selectHomeType = (type: string) => {
    setHomeType({ ...notSelectHomeType, [type]: true });
  };

  useEffect(() => {
    const unsubscribe = navigation!.addListener("focus", () => {
      setShowModal(true);
    });

    return () => {
      unsubscribe;
    };
  }, [navigation]);

  useFocusEffect(() => {
    (async () => {
      try {
        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 1000,
          timeInterval: 5000,
        });
        if (!location) {
          setLocation(currentPosition);
        } else {
          mapView.current.animateCamera({
            center: {
              latitude: currentPosition.coords.latitude,
              longitude: currentPosition.coords.longitude,
            },
          });
        }
      } catch (error) {
        console.log(error);
      }
    })();
  });

  const isEdit = !_.isNil(itemId);
  const [requestTrigger, { isLoading: loading }] =
    apiSlice.endpoints.editAddress.useMutation();
  const request = portRequest(
    (arg?: RequestArg) => requestTrigger({ ...(arg || {}), url: isEdit ? Constants.API.edit_address : Constants.API.add_address }),
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      valuePosition?.();
      setShowModal(false);
    }
  );

  const getLongAddress = (address: ApiItem) =>
    _(address)
      .pick(["name", "district", "subregion", "region", "country"])
      .filter((v) => !_.isEmpty(v))
      .value()
      .join(", ");

  const onGoBack = (address: ApiItem, location: ApiItem) => {
    setShowModal(true);
    setAddress(address);
    setLocation(location);
  };

  const onOpenPickAddress = () => {
    setShowModal(false);

    navigation!.navigate(Constants.SCREENS.ADDRESS.PICK_ADDRESS, {
      onGoBack,
      item: {
        latitude: location?.coords?.latitude,
        longitude: location?.coords?.longitude,
      },
    });
  };
  return (
    <Overlay isVisible={showModal} fullScreen={true}>
      <View
        style={{
          flex: 1,
          position: "absolute",
          width: full_width,
          marginTop: Platform.OS === "ios" ? 24 : 0,
        }}
      >
        <Container>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onPressClose}
              style={{
                flexDirection: "row",
                padding: 10,
              }}
            >
              <Ionicons name="close-circle-outline" size={30} color={colors.white} />
              <Text style={styles.textClose}>{i18n.t("home.close")}</Text>
            </TouchableOpacity>
          </View>
        </Container>
        <View
          style={{
            height: 140,
            marginBottom: 6,
          }}
        >
          <MapView
            ref={mapView}
            style={{
              flex: 1,
            }}
            initialRegion={{
              latitude: 13.7563309,
              longitude: 100.5017651,
              longitudeDelta: 0.05,
              latitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            minZoomLevel={8}
            zoomEnabled={false}
            pitchEnabled={false}
            zoomTapEnabled={false}
            scrollEnabled={false}
            rotateEnabled={false}
          >
            {address && location && (
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
              />
            )}
          </MapView>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 12 }}
          style={{ height: Layout.window.height - 220 }}
        >
          <View style={{ paddingHorizontal: 24 }}>
            <View style={{ paddingBottom: 6 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {/* {address != null && ( */}
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.main_orange,
                    paddingVertical: 6,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                  }}
                  onPress={onOpenPickAddress}
                >
                  <Text
                    style={{
                      flex: 1,
                      marginRight: 8,
                      color: colors.white,
                      fontWeight: "600",
                    }}
                  >
                    {i18n.t("home.validate_address")}
                  </Text>
                </TouchableOpacity>
                {/* )} */}
              </View>
              {!isEmpty(getLongAddress(address!)) && (
                <Text
                  style={{
                    backgroundColor: colors.gray_normal_text,
                    paddingVertical: 6,
                    marginTop: 6,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                    overflow: "hidden",
                    color: colors.white,
                    fontWeight: "600",
                  }}
                >
                  {getLongAddress(address!)}
                </Text>
              )}
            </View>

            {type == Enum.SERVICE_TYPE.MaidService ? (
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "column", width: "45%" }}>
                    <Text style={styles.title}>{i18n.t("home.room_no")}</Text>
                    <CustomInput value={room} onChangeText={setRoom} />
                  </View>
                  <View style={{ flexDirection: "column", width: "45%" }}>
                    <Text style={styles.title}>{i18n.t("home.phone_no")}</Text>
                    <CustomInput value={phone} onChangeText={setPhone} />
                  </View>
                </View>
                <View style={{ flexDirection: "column" }}>
                  <Text style={styles.title}>{i18n.t("home.remarks")}</Text>
                  <TextInput
                    numberOfLines={5}
                    multiline
                    textAlignVertical="top"
                    style={styles.textMultiLine}
                    value={remarks}
                    onChangeText={setRemarks}
                  />
                </View>
                <View style={styles.rowHomeType}>
                  <TouchableOpacity
                    onPress={() => selectHomeType("condo")}
                    style={styles.homeType}
                  >
                    <Ionicons
                      name="business-sharp"
                      size={40}
                      color={
                        homeType.condo
                          ? colors.main_color
                          : colors.gray_normal_text
                      }
                    />
                    <Text
                      style={{
                        color: homeType.condo
                          ? colors.main_color
                          : colors.gray_normal_text,
                      }}
                    >
                      {i18n.t("home.condo")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => selectHomeType("apartment")}
                    style={styles.homeType}
                  >
                    <Ionicons
                      name="business-sharp"
                      size={40}
                      color={
                        homeType.apartment
                          ? colors.main_color
                          : colors.gray_normal_text
                      }
                    />
                    <Text
                      style={{
                        color: homeType.apartment
                          ? colors.main_color
                          : colors.gray_normal_text,
                      }}
                    >
                      {i18n.t("home.apartment")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => selectHomeType("house")}
                    style={styles.homeType}
                  >
                    <Ionicons
                      name="home"
                      size={40}
                      color={
                        homeType.house
                          ? colors.main_color
                          : colors.gray_normal_text
                      }
                    />
                    <Text
                      style={{
                        color: homeType.house
                          ? colors.main_color
                          : colors.gray_normal_text,
                      }}
                    >
                      {i18n.t("home.house")}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text
                  style={{
                    alignSelf: "center",
                    color: colors.gray_normal_text,
                    marginTop: 12,
                  }}
                >
                  {i18n.t("home.select_home_type")}
                </Text>
                <View style={styles.selectHome}>
                  <Text style={{ flex: 8 }}>
                    {i18n.t("home.how_many_bedroom")}
                  </Text>
                  <Ionicons
                    onPress={() =>
                      bedroomNumber > 0 && setBedroomNumber(bedroomNumber - 1)
                    }
                    name="remove-circle-outline"
                    size={25}
                    color={colors.black_text}
                  />
                  <Text
                    style={{
                      paddingHorizontal: 12,
                      fontSize: 25,
                      flex: 1,
                      textAlign: "center",
                    }}
                  >
                    {bedroomNumber}
                  </Text>
                  <Ionicons
                    onPress={() => setBedroomNumber(bedroomNumber + 1)}
                    name="add-circle-outline"
                    size={25}
                    color={colors.black_text}
                  />
                </View>
                <View style={styles.selectHome}>
                  <Text style={{ flex: 8 }}>
                    {i18n.t("home.how_many_bathroom")}
                  </Text>
                  <Ionicons
                    onPress={() =>
                      bathroomNumber > 0 &&
                      setBathroomNumber(bathroomNumber - 1)
                    }
                    name="remove-circle-outline"
                    size={25}
                    color={colors.black_text}
                  />
                  <Text
                    style={{
                      paddingHorizontal: 12,
                      fontSize: 25,
                      flex: 1,
                      textAlign: "center",
                    }}
                  >
                    {bathroomNumber}
                  </Text>
                  <Ionicons
                    onPress={() => setBathroomNumber(bathroomNumber + 1)}
                    name="add-circle-outline"
                    size={25}
                    color={colors.black_text}
                  />
                </View>
              </View>
            ) : (
              <View>
                <Text>{i18n.t("home.phone_no")}</Text>
                <CustomInput value={phone} onChangeText={setPhone} />
              </View>
            )}
          </View>

          <View style={{ marginTop: 16, paddingHorizontal: 15 }}>
            <Button
              title={i18n.t("auth.confirm")}
              style={{ width: "100%" }}
              onPress={() => submitPosition()}
            />
          </View>
        </ScrollView>
      </View>
    </Overlay>
  );
};

const styles = StyleSheet.create({
  header: {
    width: "100%",
    // height: Platform.OS === "ios" ? 35 : 55,
    backgroundColor: colors.main_color,
  },
  title: {
    marginVertical: 6,
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
    justifyContent: "center",
  },
  selectHome: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  textMultiLine: {
    height: 100,
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 10,
    borderColor: colors.gray_light,
    borderWidth: 1,
    shadowColor: Theme.shadow.float.shadowColor,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
});
