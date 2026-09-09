import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "../../redux/hooks";
import _ from "lodash";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { View, Image, TouchableOpacity, Alert } from "react-native";

import { Container, Text } from "../../components";
import Colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import { apiSlice, portRequest, type ApiResult } from "../../redux/apiSlice";
import type { ApiItem } from "../../redux/apiSlice";
import type { ScreenProps } from "../../navigation/routes";

export default function ServiceProvider(props: ScreenProps) {
  const navigation = props.navigation;

  const token = useAppSelector((state) => state.auth.token);

  const [listServiceProvider, setListServiceProvider] = useState<ApiItem[]>([]);

  const [currentSelected, setCurrentSelected] = useState<String[]>([]);
  const [currentDelSelected, setCurrentDelSelected] = useState<String[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [requestListServiceProviderTrigger, { isLoading: loadingListServiceProvider }] =
    apiSlice.endpoints.listFavouriteServiceProvider.useLazyQuery();
  const requestListServiceProvider = portRequest(
    requestListServiceProviderTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      }

      setListServiceProvider(response && response.items);
      setCurrentSelected(
        _(response.items)
          .filter((i: ApiItem) => i.isSelected)
          .map("id")
          .value()
      );
    }
  );

  const [requestUpdateTrigger, { isLoading: loadingUpdate }] =
    apiSlice.endpoints.updateFavouriteServiceProvider.useMutation();
  const requestUpdate = portRequest(
    requestUpdateTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }

      Alert.alert(i18n.t("home.update_successfully"), error);
    }
  );

  const [requestDeleteTrigger, { isLoading: loadingDelete }] =
    apiSlice.endpoints.deleteFavouriteServiceProvider.useMutation();
  const requestDelete = portRequest(
    requestDeleteTrigger,
    ({ error, response }: ApiResult) => {
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
    }
  );

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
                <Text style={{ color: Colors.white }}>
                {i18n.t("home.delete")} ({currentDelSelected.length})
                </Text>
              </TouchableOpacity>
              <View style={{ width: 10 }} />
              <TouchableOpacity onPress={() => setIsDeleting(false)}>
                <Text style={{ color: Colors.white }}>{i18n.t("home.cancel")}</Text>
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

  const onPressCheck = (id: string) => {
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
          shadowColor: Colors.shadow,
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
        {listServiceProvider.map((item: ApiItem, i: number) => (
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
                borderColor: Colors.gray_light,
                borderWidth: 1.5,
                marginTop: 10,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => onPressCheck(item.id)}
            >
              {!isDeleting && currentSelected.indexOf(item.id) != -1 && (
                <Ionicons name="checkmark" size={22} color={Colors.black_text} />
              )}
              {isDeleting && currentDelSelected.indexOf(item.id) != -1 && (
                <Ionicons name="checkmark" size={22} color={Colors.red} />
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </Container>
  );
}
