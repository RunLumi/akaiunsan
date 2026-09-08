import _, { map } from "lodash";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import MapView, {
  Marker,
  Circle,
  Region,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Button, IconButton, Container, Text } from "../../components";
import Colors from "../../shared/Colors";
import Theme from "../../shared/theme";
import i18n from "../../shared/I18n";
import useApi from "../../hooks/useApi";
import Constants from "../../shared/Constants";
import { useNavigation } from "@react-navigation/native";
import {
  GooglePlaceData,
  GooglePlaceDetail,
  GooglePlacesAutocomplete,
} from "react-native-google-places-autocomplete";
import {
  getRegionForCoordinates,
  removeVietnameseTones,
} from "../../shared/Utils";
import * as L2 from "../../shared/Geocoding";

const PickAddress = (props: any) => {
  const { params } = props.route;
  const navigation = useNavigation();
  const onGoBack = params?.onGoBack;
  const addRef = useRef<any>(null);
  // const [isPlace, setIsPlace] = useState(false);
  const [placeName, setPlaceName] = useState("Bangkok, ThaiLand");
  const [loadMap, setLoadMap] = useState(false);
  const isEdit = !_.isNil(params?.item?.id);
  const prevRegion = isEdit
    ? getRegionForCoordinates([
        {
          latitude: params?.item?.latitude,
          longitude: params?.item?.longitude,
        },
      ])
    : null;

  const mapView = useRef<any>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>();
  const [region, setRegion] = useState<any>({
    latitude: 13.7563309,
    longitude: 100.5017651,
    longitudeDelta: 0.05,
    latitudeDelta: 0.05,
  });
  const [regionMark, setRegionMark] = useState<Region | null>();
  const [listAddress, setListAddress] =
    useState<Location.LocationGeocodedAddress[]>();

  const [loading, request] = useApi({
    method: isEdit ? "put" : "post",
    url: isEdit ? Constants.API.edit_address : Constants.API.add_address,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      }

      if (isEdit) {
        Alert.alert(i18n.t("address.edit_success"));
      } else {
        navigation.goBack();
      }
    },
  });
  const onPlace = async (event: any) => {
    L2.setGoogleApiKey(
      Platform.OS === "ios"
        ? Constants.GOOGLEMAPSAPIKEYIOS
        : Constants.GOOGLEMAPSAPIKEYANDROIND
    );

    mapView.current.animateCamera({
      center: {
        latitude: event.coordinate.latitude,
        longitude: event.coordinate.longitude,
      },
      zoom: 10,
    });
    setRegionMark(event.coordinate);

    const multiAddress = await L2.getAddress(
      event.coordinate.latitude,
      event.coordinate.longitude
    );

    let longest = multiAddress.results.reduce(function (a: any, b: any) {
      return a.address_components.length > b.address_components.length ? a : b;
    });
    const listAddresses = await L2.googleAddressGeocodeAsync(
      longest.formatted_address
    );
    addRef.current?.setAddressText(longest.formatted_address);
    setListAddress(listAddresses);
    setPlaceName(longest.formatted_address);
  };
  const onPressCurrentLocation = async () => {
    setLoadMap(true);
    const currentPosition = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      distanceInterval: 1000,
      timeInterval: 5000,
    });
    if (_.isNil(currentPosition)) {
      return;
    } else {
      setRegionMark({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });

      const multiAddress = await L2.getAddress(
        currentPosition.coords.latitude,
        currentPosition.coords.longitude
      );

      let longest = multiAddress.results.reduce(function (a: any, b: any) {
        return a.address_components.length > b.address_components.length
          ? a
          : b;
      });
      const listAddresses = await L2.googleAddressGeocodeAsync(
        longest.formatted_address
      );
      addRef.current?.setAddressText(longest.formatted_address);
      setListAddress(listAddresses);
      setPlaceName(longest.formatted_address);

      setRegion({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      mapView.current.animateCamera({
        center: {
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        },
      });

      setLoadMap(false);
    }
  };
 
  useEffect(() => {
    (async () => {
      try {
        setLocation(location);
        // Location.setGoogleApiKey was removed from expo-location (SDK 57);
        // the app's own Geocoding wrapper (L2.setGoogleApiKey) still configures
        // the Google key where needed.
        L2.setGoogleApiKey(
          Platform.OS === "ios"
            ? Constants.GOOGLEMAPSAPIKEYIOS
            : Constants.GOOGLEMAPSAPIKEYANDROIND
        );
        if (!_.isNil(params?.item) && !_.isNil(params?.item.latitude)) {
          console.log(1111)
          async function goPosition() {
            const e = {
              coordinate: {
                latitude: params?.item?.latitude,
                longitude: params?.item?.longitude,
                latitudeDelta: 1,
                longitudeDelta: 1,
              },
            };
            setRegion({
              latitude: params?.item?.latitude,
              longitude: params?.item?.longitude,
              latitudeDelta: 1,
              longitudeDelta: 1,
            });
            await onPlace(e);
          }
          goPosition();
         
        } else {
          if (!_.isEmpty(params?.placeName)) {
            setLoadMap(true);
            const coords = await Location.geocodeAsync(params.placeName);
            if (coords.length > 0) {
              mapView.current.animateCamera({
                center: {
                  latitude: coords[0].latitude,
                  longitude: coords[0].longitude,
                },
              });
              setRegion({
                latitude: coords[0].latitude,
                longitude: coords[0].longitude,
                latitudeDelta: 1,
                longitudeDelta: 1,
              });

              setRegionMark(coords[0] as any);
            }
          
            const listAddresses = await L2.googleAddressGeocodeAsync(
              params.placeName
            );
            addRef.current?.setAddressText(params.placeName);
            setListAddress(listAddresses);
            setPlaceName(params.placeName);
            setLoadMap(false);
          
          } else {
            async function goPosition() {
              onPressCurrentLocation();
            }
            goPosition();
          }
        }
      } catch (error) {
        console.log('error ', error);
      }
    })();
  }, []);

  const getLongAddress = (address: Location.LocationGeocodedAddress) =>
    _(address)
      .pick(["name", "district", "subregion", "region", "country"])
      .filter((v) => !_.isNil(v) && !_.isEmpty(v))
      .value()
      .join(", ");

  const onPickLocation = async () => {
    if (_.isNil(listAddress) || listAddress.length == 0) {
      return;
    }
    const address = _.mapValues(listAddress[0], (val) =>
      typeof val == "string" ? removeVietnameseTones(val) : val
    );
    if (!_.isNil(onGoBack)) {
      onGoBack(
        { ...address, placeName },
        {
          coords: {
            latitude: regionMark?.latitude,
            longitude: regionMark?.longitude,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: 0,
        }
      );
      navigation.goBack();
      return;
    }
    request({
      data: {
        id: isEdit ? params?.item.id : null,
        phoneNumber: "",
        shortAddress: address.name || address.street,
        longAddress: getLongAddress(address),
        isDefault: false,
        country: address.country || "...",
        province: address.region || "...",
        district: address.district || address.subregion || "...",
        ward: address.district || "...",
        latitude: regionMark?.latitude || 0,
        longitude: regionMark?.longitude || 0,
      },
    });
  };

  const onPressPlace = async (
    data: GooglePlaceData,
    details: GooglePlaceDetail | null
  ) => {
    // Location.setGoogleApiKey was removed from expo-location (SDK 57).
    const coords = await Location.geocodeAsync(data.description);

    if (coords.length > 0) {
      mapView.current.animateCamera({
        center: {
          latitude: coords[0].latitude,
          longitude: coords[0].longitude,
        },
        zoom: 100,
      });
      setRegionMark(coords[0] as any);
    }
    // setIsPlace(true);
    L2.setGoogleApiKey(
      Platform.OS === "ios"
        ? Constants.GOOGLEMAPSAPIKEYIOS
        : Constants.GOOGLEMAPSAPIKEYANDROIND
    );
    const listAddresses = await L2.googleAddressGeocodeAsync(data.description);
    setListAddress(listAddresses);
    setPlaceName(data.description);
  };

  return (
    <Container>
      <View style={s.container}>
        <MapView
          ref={mapView}
          // provider={PROVIDER_GOOGLE}
          style={s.map}
          initialRegion={!_.isNull(region) ? region : undefined}
          onRegionChange={setRegion}
          showsUserLocation={true}
          onPress={(event) => onPlace(event.nativeEvent)}
        >
          {!_.isNil(regionMark) ? (
            <Marker
              coordinate={{
                latitude: regionMark.latitude,
                longitude: regionMark.longitude,
              }}
              centerOffset={{ x: 0, y: 0 }}
            />
          ) : null}
          {!_.isNil(location) ? (
            <Circle
              radius={10}
              center={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              strokeColor={`${Theme.core.mossBlack}00`}
              fillColor={`${Theme.core.olive}4D`}
            />
          ) : null}
        </MapView>
        <View style={s.search}>
          <GooglePlacesAutocomplete
            ref={addRef}
            query={{
              key:
                Platform.OS == "ios"
                  ? Constants.GOOGLEMAPSAPIKEYIOS
                  : Constants.GOOGLEMAPSAPIKEYANDROIND,
              // language: "vi",
            }}
            placeholder={i18n.t("address.search")}
            onPress={onPressPlace}
          />
        </View>

        {!_.isNil(listAddress) && listAddress.length > 0 && placeName ? (
          <View style={s.address}>
            <View
              style={{
                position: "absolute",
                right: 0,
                top: -58,
              }}
            >
              <IconButton
                children={<Ionicons name="navigate-circle-outline" size={24} />}
                style={{
                  width: 40,
                  backgroundColor: Colors.white,
                  padding: 0,
                  borderRadius: 8,
                  shadowColor: Colors.shadow,
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.1,
                }}
                onPress={onPressCurrentLocation}
              />
            </View>
            <View style={s.info}>
              <Text style={s.title}>{placeName}</Text>
              {/* <Text style={s.subtitle}>{getLongAddress(listAddress[0])}</Text> */}
              <Text style={s.subtitle}>{placeName}</Text>
            </View>
            <Button
              title={i18n.t("address.pick_location")}
              onPress={onPickLocation}
              loading={loading}
            />
          </View>
        ) : null}
        {loadMap && (
          <ActivityIndicator
            size="large"
            color={Colors.black_text}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              left: 0,
            }}
          />
        )}
      </View>
    </Container>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  address: {
    position: "absolute",
    right: 16,
    bottom: 16,
    left: 16,
  },
  info: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: Colors.main_orange_light,
    borderRadius: 6,
  },
  title: {
    fontSize: 16.0,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 6.0,
  },
});

export default PickAddress;
