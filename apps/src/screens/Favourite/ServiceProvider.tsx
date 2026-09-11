import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "../../redux/hooks";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";

import { Container, Text } from "../../components";
import Colors from "../../shared/Colors";
import i18n from "../../shared/I18n";
import { apiSlice, portRequest, type ApiResult } from "../../redux/apiSlice";
import type { ApiItem } from "../../redux/apiSlice";
import type { ScreenProps } from "../../navigation/routes";

export default function ServiceProvider(props: ScreenProps) {
  const token = useAppSelector((state) => state.auth.token);

  const [listServiceProvider, setListServiceProvider] = useState<ApiItem[]>([]);

  const [currentSelected, setCurrentSelected] = useState<string[]>([]);
  const [currentDelSelected, setCurrentDelSelected] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [requestListServiceProviderTrigger, { isLoading: loadingListServiceProvider }] =
    apiSlice.endpoints.listFavouriteServiceProvider.useLazyQuery();
  const requestListServiceProvider = portRequest(
    requestListServiceProviderTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        setListServiceProvider([]);
        setCurrentSelected([]);
        return;
      }

      const items = response?.items ?? [];
      setListServiceProvider(items);
      setCurrentSelected(
        _(items)
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
    const toggle = (values: string[]) =>
      values.includes(id) ? values.filter((value) => value !== id) : [...values, id];

    setCurrentSelected(toggle);

    if (isDeleting) {
      setCurrentDelSelected(toggle);
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {!isDeleting ? (
            <TouchableOpacity
              accessibilityLabel="favourite-provider-delete-mode"
              testID="favourite-provider-delete-mode"
              onPress={() => setIsDeleting(true)}
              style={{ padding: 8 }}
            >
              <Ionicons name="trash" size={22} color={Colors.main_orange} />
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TouchableOpacity
                accessibilityLabel="favourite-provider-delete-confirm"
                testID="favourite-provider-delete-confirm"
                onPress={onPressDelete}
                style={{ paddingVertical: 6, paddingHorizontal: 8 }}
              >
                <Text style={{ color: Colors.main_orange }}>
                  {i18n.t("home.delete")} ({currentDelSelected.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="favourite-provider-delete-cancel"
                testID="favourite-provider-delete-cancel"
                onPress={() => setIsDeleting(false)}
                style={{ paddingVertical: 6, paddingHorizontal: 8 }}
              >
                <Text>{i18n.t("home.cancel")}</Text>
              </TouchableOpacity>
            </View>
          )}
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
            <Text style={{ color: Colors.main_orange, fontWeight: "600" }}>
              {i18n.t("home.update")}
            </Text>
          </TouchableOpacity>
        </View>
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
            key={String(item.id ?? i)}
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
              {_.times(5).map((starIndex) => (
                <Ionicons key={starIndex} name="star" color={Colors.main_orange} size={14} />
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
