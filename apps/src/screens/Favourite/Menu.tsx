import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Container } from "../../components";
import Constants from "../../shared/Constants";
import Colors from "../../shared/Colors";
import i18n from "../../shared/I18n";

export default function MenuFavourite(props: any) {
  const navigation = props.navigation;

  const onPressService = () => {
    navigation.navigate(Constants.SCREENS.FAVOURITE.SERVICE);
  };

  const onPressServiceProvider = () => {
    navigation.navigate(Constants.SCREENS.FAVOURITE.SERVICE_PROVIDER);
  };

  return (
    <Container>
      <TouchableOpacity
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
        onPress={onPressService}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "500",
          }}
        >
          {i18n.t("home.favourite_service")}
        </Text>
        <Ionicons name="chevron-forward" size={24} />
      </TouchableOpacity>
      <View
        style={{
          marginLeft: 10,
          height: 1,
          width: "100%",
          backgroundColor: Colors.gray_light,
        }}
      />
      <TouchableOpacity
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
        onPress={onPressServiceProvider}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "500",
          }}
        >
          {i18n.t("home.favourite_service_providers")}
        </Text>
        <Ionicons name="chevron-forward" size={24} />
      </TouchableOpacity>
    </Container>
  );
}
