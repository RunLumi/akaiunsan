import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Ionicons, AntDesign, FontAwesome } from "@expo/vector-icons";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { Button, Container, Text } from "../../components";
import Colors from "../../shared/Colors";
import Styles from "../../shared/Styles";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import { apiSlice, portRequest, type ApiResult } from "../../redux/apiSlice";

const AddressScreen = (props: any) => {
  const { navigation } = props;
  const [listAddress, setListAddress] = useState<any[]>([]);

  const [requestListAddressTrigger, { isLoading: loadingListAddress }] =
    apiSlice.endpoints.listAddress.useLazyQuery();
  const requestListAddress = portRequest(
    requestListAddressTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      }

      setListAddress(response && response.items);
    }
  );

  const [requestEditAddressTrigger, { isLoading: loadingEditAddress }] =
    apiSlice.endpoints.editAddress.useMutation();
  const requestEditAddress = portRequest(
    requestEditAddressTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      }

      requestListAddress();
    }
  );

  const [requestDeleteAddressTrigger, { isLoading: loadingDeleteAddress }] =
    apiSlice.endpoints.deleteAddress.useMutation();
  const requestDeleteAddress = portRequest(
    requestDeleteAddressTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      }
      requestListAddress();
    }
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      requestListAddress();
    });

    return () => {
      unsubscribe;
    };
  }, [navigation]);

  const onPressPickAddress = () => {
    props.navigation.navigate(Constants.SCREENS.ADDRESS.PICK_ADDRESS);
  };

  const onPressEditAddress = (item: any) => {
    props.navigation.navigate(Constants.SCREENS.ADDRESS.PICK_ADDRESS, { item });
  };

  const onPressDeleteAddress = (id: string) => {
    Alert.alert(i18n.t("auth.confirm"), `${i18n.t("Are_you_sure")}?`, [
      {
        text: i18n.t("home.cancel"),
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
      {
        text: i18n.t("home.ok"),
        onPress: () => {
          requestDeleteAddress({
            data: { id: id },
          });
        },
      },
    ]);
  };

  const onPressIsDefaultAddress = (item: any) => {
    requestEditAddress({
      data: {
        ...item,
        isDefault: true,
      },
    });
  };
  return (
    <Container>
      <View style={s.titleContainer}>
        <Text style={s.title}>{i18n.t("home.address")}</Text>
      </View>
      <ScrollView>
        <View>
          <Button
            title={i18n.t("auth.add_address")}
            style={s.btnStyle}
            viewStyle={s.btnViewStyle}
            textStyle={{
              color: Colors.main_color,
            }}
            onPress={onPressPickAddress}
          />
          {listAddress?.map((item, index) => (
            <View
              key={index}
              style={{
                borderRadius: 10,
                backgroundColor: Colors.white,
                ...Styles.shadow,
                padding: 15,
                margin: 15,
              }}
            >
              <View style={[s.row, { justifyContent: "flex-end" }]}>
                <TouchableOpacity onPress={() => onPressIsDefaultAddress(item)}>
                  <FontAwesome
                    size={20}
                    name={"dot-circle-o"}
                    color={Colors.black}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => onPressEditAddress(item)}>
                  <AntDesign
                    size={20}
                    style={{ marginHorizontal: 10 }}
                    name="edit"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onPressDeleteAddress(item["id"])}
                >
                  <AntDesign size={20} style={{}} name="delete" />
                </TouchableOpacity>
              </View>
              <View style={s.row}>
                <Ionicons
                  size={20}
                  style={{ marginLeft: -2 }}
                  color={Colors.gray}
                  name="location"
                />
                <Text style={{ color: Colors.gray, marginLeft: 10 }}>
                  {item["longAddress"]}
                </Text>
              </View>
              {item.isDefault && (
                <TouchableOpacity>
                  <View style={s.row}>
                    <FontAwesome
                      size={20}
                      name={item["isDefault"] ? "dot-circle-o" : "circle-o"}
                      color={Colors.gray}
                    />
                    {item.isDefault && (
                      <Text style={{ color: Colors.gray, marginLeft: 10 }}>
                        {i18n.t("home.default")}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
};

const s = StyleSheet.create({
  container: {},
  title: {
    fontSize: Styles.typography.h3,
    padding: 13,
    width: "100%",
    fontWeight: "700",
  },
  titleContainer: {
    backgroundColor: Colors.white,
    alignItems: "center",
    ...Styles.shadow,
  },
  btnStyle: {
    width: "30%",
    alignSelf: "flex-end",
    marginRight: 15,
    height: 30,
  },
  btnViewStyle: {
    backgroundColor: Colors.white,
    borderColor: Colors.grab_orange,
    borderWidth: 2,
    borderRadius: 4,
    height: 30,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
});

export default AddressScreen;
