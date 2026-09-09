import { Ionicons } from "@expo/vector-icons";
import _ from "lodash";
import dayjs from "../../shared/dayjs";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { View, Image, Alert } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { useSelector } from "react-redux";
import { Container, Text } from "../../components";
import useApi from "../../hooks/useApi";
import Colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";

export default function Service(props: any) {
  const navigation = props.navigation;

  const token = useSelector((state: any) => state.auth.token);

  const [currentSelected, setCurrentSelected] = useState<String[]>([]);
  const [currentDelSelected, setCurrentDelSelected] = useState<String[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [listService, setListService] = useState<any[]>([]);

  const [loadingListService, requestListService] = useApi({
    method: "get",
    url: Constants.API.list_favourite_service,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      }

      setListService(response && response.items);
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
    url: Constants.API.update_favourite_service,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      }

      Alert.alert(i18n.t("home.update_successfully"), error);
    },
  });

  const [loadingDelete, requestDelete] = useApi({
    method: "delete",
    url: Constants.API.delete_favourite_service,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }

      Alert.alert(i18n.t("home.delete_successfully"), error);

      requestListService();
    },
  });

  useEffect(() => {
    requestListService();
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
      <ScrollView>
        <View style={{ padding: 16 }}>
          {listService.map((item: any, i) => (
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
