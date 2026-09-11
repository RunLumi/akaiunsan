import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "../../redux/hooks";
import _ from "lodash";
import dayjs from "../../shared/dayjs";
import React, { useEffect, useState } from "react";
import { View, Image, Alert } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";

import { Container, Text } from "../../components";
import Colors from "../../shared/Colors";
import i18n from "../../shared/I18n";
import { apiSlice, portRequest, type ApiResult } from "../../redux/apiSlice";
import type { ApiItem } from "../../redux/apiSlice";
import type { ScreenProps } from "../../navigation/routes";

export default function Service(props: ScreenProps) {
  const token = useAppSelector((state) => state.auth.token);

  const [currentSelected, setCurrentSelected] = useState<string[]>([]);
  const [currentDelSelected, setCurrentDelSelected] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [listService, setListService] = useState<ApiItem[]>([]);

  const [requestListServiceTrigger, { isLoading: loadingListService }] =
    apiSlice.endpoints.listFavouriteService.useLazyQuery();
  const requestListService = portRequest(
    requestListServiceTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        setListService([]);
        setCurrentSelected([]);
        return;
      }

      const items = response?.items ?? [];
      setListService(items);
      setCurrentSelected(
        _(items)
          .filter((i: ApiItem) => i.isSelected)
          .map("id")
          .value()
      );
    }
  );

  const [requestUpdateTrigger, { isLoading: loadingUpdate }] =
    apiSlice.endpoints.updateFavouriteService.useMutation();
  const requestUpdate = portRequest(
    requestUpdateTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      }

      Alert.alert(i18n.t("home.update_successfully"), error);
    }
  );

  const [requestDeleteTrigger, { isLoading: loadingDelete }] =
    apiSlice.endpoints.deleteFavouriteService.useMutation();
  const requestDelete = portRequest(
    requestDeleteTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }

      Alert.alert(i18n.t("home.delete_successfully"), error);

      requestListService();
    }
  );

  useEffect(() => {
    requestListService();
  }, []);

  const onPressDelete = async () => {
    Alert.alert("Confirm", "Are you sure?", [
      {
        text: "Cancel",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
      {
        text: "OK",
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
          {i18n.t("home.favourite_service")}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {!isDeleting ? (
            <TouchableOpacity
              accessibilityLabel="favourite-service-delete-mode"
              testID="favourite-service-delete-mode"
              onPress={() => setIsDeleting(true)}
              style={{ padding: 8 }}
            >
              <Ionicons name="trash" size={22} color={Colors.main_orange} />
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TouchableOpacity
                accessibilityLabel="favourite-service-delete-confirm"
                testID="favourite-service-delete-confirm"
                onPress={onPressDelete}
                style={{ paddingVertical: 6, paddingHorizontal: 8 }}
              >
                <Text style={{ color: Colors.main_orange }}>
                  {i18n.t("home.delete")} ({currentDelSelected.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="favourite-service-delete-cancel"
                testID="favourite-service-delete-cancel"
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
            disabled={loadingUpdate}
          >
            <Text style={{ color: Colors.main_orange, fontWeight: "600" }}>
              {i18n.t("home.update")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView>
        <View style={{ padding: 16 }}>
          {listService.map((item: ApiItem, i: number) => (
            <View
              key={i}
              style={{
                marginBottom: 16,
                padding: 14,
                backgroundColor: Colors.white,
                shadowColor: Colors.shadow,
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                borderRadius: 6,
                flexDirection: "row",
              }}
            >
              <TouchableOpacity
                style={{
                  height: 28,
                  width: 28,
                  borderColor: Colors.gray_light,
                  borderWidth: 1.5,
                  marginEnd: 10,
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
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    marginBottom: 16,
                  }}
                >
                  {item.serviceName}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <Ionicons
                    name="calendar"
                    style={{
                      marginRight: 6,
                      color: Colors.gray_normal_text,
                    }}
                  />
                  <Text
                    style={{
                      color: Colors.gray_normal_text,
                    }}
                  >
                    {dayjs(item.bookingDate).local().format("lll")}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Ionicons
                    name="location"
                    style={{
                      marginRight: 6,
                      color: Colors.gray_normal_text,
                    }}
                  />
                  <Text
                    style={{
                      color: Colors.gray_normal_text,
                    }}
                  >
                    {item.address}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="person"
                    style={{
                      marginRight: 6,
                      color: Colors.gray_normal_text,
                    }}
                  />
                  <Text
                    style={{
                      color: Colors.gray_normal_text,
                    }}
                  >
                    {item.fullName}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  marginLeft: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    marginBottom: 16,
                  }}
                >
                  {_.times(5).map((i, idx) => (
                    <Ionicons
                      key={idx}
                      name="star"
                      color={Colors.main_orange}
                    />
                  ))}
                </View>
                <Image
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                  }}
                  source={require("../../assets/images/MaidService.jpg")}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
}
