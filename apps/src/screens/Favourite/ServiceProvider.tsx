import { Ionicons } from "@expo/vector-icons";
import _ from "lodash";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { View, Image, TouchableOpacity, Alert } from "react-native";
import { useSelector } from "react-redux";
import { Container, Text } from "../../components";
import useApi from "../../hooks/useApi";
import Colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";

export default function ServiceProvider(props: any) {
  const navigation = props.navigation;

  const token = useSelector((state: any) => state.auth.token);

  const [listServiceProvider, setListServiceProvider] = useState<any[]>([]);

  const [currentSelected, setCurrentSelected] = useState<String[]>([]);
  const [currentDelSelected, setCurrentDelSelected] = useState<String[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [loadingListServiceProvider, requestListServiceProvider] = useApi({
    method: "get",
    url: Constants.API.list_favourite_service_provider,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      }

      setListServiceProvider(response && response.items);
      setCurrentSelected(
        _(response.items)
          .filter((i: any) => i.isSelected)
          .map("id")
          .value()
      );
    },
  });

  const [loadingUpdate, requestUpdate] = useApi({
    method: "put",
    url: Constants.API.update_favourite_service_provider,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }

      Alert.alert(i18n.t("home.update_successfully"), error);
    },
  });

  const [loadingDelete, requestDelete] = useApi({
    method: "delete",
    url: Constants.API.delete_favourite_service_provider,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      Alert.alert(i18n.t("home.delete_successfully"), error);
      requestListServiceProvider({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
  });

  useEffect(() => {
    requestListServiceProvider({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View>
          {!isDeleting ? (
            <TouchableOpacity
              onPress={() => setIsDeleting(true)}
              style={{ marginEnd: 8 }}
            >
              <Ionicons name="trash" size={24} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: "row", paddingEnd: 16 }}>
              <TouchableOpacity onPress={onPressDelete}>
                <Text style={{ color: "#fff" }}>
                {i18n.t("home.delete")} ({currentDelSelected.length})
                </Text>
              </TouchableOpacity>
              <View style={{ width: 10 }} />
              <TouchableOpacity onPress={() => setIsDeleting(false)}>
                <Text style={{ color: "#fff" }}>{i18n.t("home.cancel")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ),
    });
  }, [navigation, isDeleting, currentDelSelected]);

  const onPressUpdate = async () => {
    requestUpdate({
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        items: currentSelected,
      },
    });
  };

  const onPressDelete = async () => {
    Alert.alert("Confirm", "Are you sure?", [
      {
        text: i18n.t("home.cancel"),
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
      {
        text: i18n.t("home.ok"),
        onPress: () => {
          requestDelete({
            headers: {
              Authorization: `Bearer ${token}`,
            },
            data: {
              items: currentDelSelected,
            },
          });
        },
      },
    ]);
  };

  const onPressCheck = (id: any) => {
    setCurrentSelected(
      currentSelected.indexOf(id) != -1
        ? _.remove(currentSelected, id)
        : [...currentSelected, id]
    );

    if (isDeleting) {
      setCurrentDelSelected(
        currentDelSelected.indexOf(id) != -1
          ? _.remove(currentDelSelected, id)
          : [...currentDelSelected, id]
      );
    }
  };

  return (
    <Container>
      <View
        style={{
          paddingHorizontal: 16,
          height: 48,
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: "row",
          backgroundColor: Colors.white,
          shadowColor: Colors.black,
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600" }}>
        {i18n.t("home.favourite_service_providers")}
        </Text>
        <TouchableOpacity
          style={{
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderColor: Colors.main_orange,
            borderWidth: 1,
            borderRadius: 3,
          }}
          onPress={onPressUpdate}
        >
          <Text
            style={{
              color: Colors.main_orange,
              fontWeight: "600",
            }}
          >
            {i18n.t("home.update")}
          </Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          padding: 12,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {listServiceProvider.map((item: any, i) => (
          <View
            style={{
              // padding: 16,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
              }}
              source={require("../../assets/images/MaidService.jpg")}
            />
            <View style={{ marginTop: -10, flexDirection: "row" }}>
              {_.times(5).map((i) => (
                <Ionicons name="star" color={Colors.main_orange} size={14} />
              ))}
            </View>
            <Text style={{ marginTop: 8 }}>{item.fullName}</Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: 12,
                color: Colors.gray_normal_text,
              }}
            >
              {i18n.t("home.view_detail")}
            </Text>
            <TouchableOpacity
              style={{
                height: 28,
                width: 28,
                borderColor: "#bbb",
                borderWidth: 1.5,
                marginTop: 10,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => onPressCheck(item.id)}
            >
              {!isDeleting && currentSelected.indexOf(item.id) != -1 && (
                <Ionicons name="checkmark" size={22} color={"#111"} />
              )}
              {isDeleting && currentDelSelected.indexOf(item.id) != -1 && (
                <Ionicons name="checkmark" size={22} color={"red"} />
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </Container>
  );
}
