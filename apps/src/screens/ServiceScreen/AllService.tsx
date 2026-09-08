import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { AutoPager, Container, Loading, Text } from "../../components";
import colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import layout from "../../shared/Layout";
import useApi from "../../hooks/useApi";
import i18n from "../../shared/I18n";
import { NavigationRoot } from "../../navigation/root";

export default function AllService(props: any) {
  const { subscriptionPlanActive } = props.route.params || {};
  const [carouselItems, setCarouselItems] = useState<any[]>([]);
  const [arrService, setArrService] = useState<any[]>([]);
  const [loadingBanner, requestGetBanner] = useApi({
    method: "get",
    url: Constants.API.get_banner,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        setCarouselItems(response && response.items);
      }
    },
  });

  const [loadingServiceManagement, requestServiceManagement] = useApi({
    method: "get",
    url: Constants.API.services_management,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        setArrService(response.items);
      }
    },
  });

  const _renderItem = ({ item, index }: any) => {
    return (
      <View key={index}>
        {item.listImage &&
        item.listImage.length > 0 &&
        item.listImage[0].image ? (
          <Image
            resizeMode="contain"
            style={{
              width: "100%",
              // height: 150
              aspectRatio: 16 / 9,
            }}
            source={{ uri: item.listImage[0].image }}
          />
        ) : null}
      </View>
    );
  };
  useEffect(() => {
    requestGetBanner();
    requestServiceManagement();
  }, []);
  return (
    <Container style={styles.container}>
      <Loading loading={loadingBanner || loadingServiceManagement} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <AutoPager
            data={carouselItems}
            renderItem={(item, index) => _renderItem({ item, index })}
            style={{ height: layout.window.width }}
          />
        </View>
        <ScrollView style={styles.serviceStyle}>
          <View style={styles.textOtherSide}>
            <Text style={styles.textServices}>{i18n.t("home.services")}</Text>
          </View>
          <View style={{ alignSelf: "center" }}>
            <View style={styles.itemService}>
              {arrService.map((x, idx) => (
                <TouchableOpacity
                  onPress={() =>
                    NavigationRoot.push(Constants.SCREENS.SERVICE.SERVICE, {
                      data: x,
                      subscriptionPlanActive,
                    })
                  }
                  style={{
                    width: "33%",
                    marginVertical: 5,
                    alignItems: "center",
                  }}
                  key={idx}
                >
                  <Image
                    resizeMode="contain"
                    style={{ width: 70, height: 70 }}
                    source={{ uri: x.icon }}
                  />
                  <Text style={{ textAlign: "center" }}>{x.serviceName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginVertical: 10,
  },
  textRef: {
    fontSize: 18,
    marginHorizontal: 20,
    marginVertical: 15,
  },
  borderBottom1: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray_hidden_text,
  },
  borderBottom2: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray_hidden_text,
  },
  serviceStyle: {
    marginHorizontal: 20,
    marginTop: 15,
  },
  textOtherSide: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textServices: {
    color: colors.gray_normal_text,
    fontWeight: "bold",
  },
  itemService: {
    marginVertical: 10,
    flexDirection: "row",
    alignSelf: "center",
    flexWrap: "wrap",
    width: "100%",
    paddingHorizontal: 20,
  },
});
