import React, { useState, useEffect } from "react";
import { StyleSheet, View, FlatList, Switch, Alert, Image } from "react-native";
import {
  Button,
  Container,
  Loading,
  Text,
} from "../../components";
import colors from "../../shared/Colors";
import i18n from "../../shared/I18n";
import _, { isEmpty } from "lodash";
import useApi from "../../hooks/useApi";
import Constants from "../../shared/Constants";
import moment from "moment";
import { useDispatch } from "react-redux";
import { TYPES } from "../../redux/actions";

export default function AllSubscriptionPlan() {
  const [listPlan, setListPlan] = useState<any>([]);
  const [dataPlan, setDataPlan] = useState<any>();
  const [indexCancel, setIndexCancel] = useState<any>(undefined);
  const [service, setService] = useState<any>();
  const [serviceCancel, setServiceCancel] = useState("");
  const [reason, setReason] = useState<any>({
    label: "Location",
    value: 1,
  });
  const dispatch = useDispatch();
  const [loadingListPlan, requestListPlan] = useApi({
    method: "get",
    url: Constants.API.get_subscription,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      if (!_.isNull(response)) {
        const list = Object.keys(response).filter((i) => !isEmpty(response[i]));
        setListPlan(list);
        setDataPlan(response);
      }
    },
  });

  const [loadingServiceManagement, requestServiceManagement] = useApi({
    method: "get",
    url: Constants.API.services_management,
    callback: ({ error, response }) => {
      if (error) console.log(i18n.t("auth.error"), error);
      else {
        setService(response.items);
      }
    },
  });

  const [loadingCancelSubscription, requestCancelSubscription] = useApi({
    method: "put",
    url: Constants.API.cancel_subscription,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      requestListPlan();
    },
  });

  const [loadingToggleRenewFlexible, requestToggleRenewFlexible] = useApi({
    method: "post",
    url: Constants.API.toggle_renew_flexible,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
    },
  });

  useEffect(() => {
    requestListPlan();
    requestServiceManagement();
  }, []);
  // const getSourceImage = (type: string) => {
  //   const find = service.filter((i) => i.serviceName === type);

  //   return { uri: find[0].icon };
  // };
  const getSourceImage = (type: string) => {
    switch (type) {
      case "Maid":
        return require("../../assets/images/1e01.png");
      case "Nanny":
        return require("../../assets/images/1e02.png");
      case "Eldercare":
        return require("../../assets/images/1e03.png");
      case "Ac Cleaning":
        return require("../../assets/images/1e04.png");
      case "Petcare":
        return require("../../assets/images/1e05.png");
      case "Insurance":
        return require("../../assets/images/1e06.png");
      case "Healthcare":
        return require("../../assets/images/1e07.png");
      default:
        return require("../../assets/images/1e01.png");
    }
  };
  const renderItemSub = ({ item, index }: { item: any; index: number }) => {
    const enumReason = [
      { label: "Location", value: 1 },
      { label: "No-answer", value: 2 },
      { label: "Schedule", value: 3 },
      { label: "Supply", value: 4 },
      { label: "Other", value: 5 },
    ];
    const onPressCancelPlan = () => {
      setIndexCancel(index);
      setServiceCancel(item.id);
      dispatch({
        type: TYPES.TOOLS.OPEN_PICKER,
        payload: {
          data: enumReason,
          selected: reason.value,
          callback: (selected: number) => {
            const newReason = () =>
              enumReason.reduce((pre, cur) => {
                if (cur?.value === selected) {
                  return cur;
                } else return pre;
              }, {});
            setReason(newReason);
          },
        },
      });
    };
    const onSubmit = () => {
      requestCancelSubscription({
        data: {
          orderId: item.id,
          reason: reason.value,
        },
      });
      setIndexCancel(undefined);
      setReason("");
    };
    const toggleSwitch = (value: any) => {
      requestToggleRenewFlexible({
        data: {
          orderId: item.id,
          isAutoRenew: !item.isAutoRenew,
        },
      });
      item.isAutoRenew = value;
    };
    const newData = item.bookDetail.sort(function (a: any, b: any) {
      return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
    });
    const bookingTime =
      (!isEmpty(item.bookDetail) && item.bookDetail[0].bookingDate) || "";
    return (
      <View style={styles.wrapItem}>
        <View style={styles.containerItem}>
          <View style={styles.headerItem}>
            <Text style={styles.headerItemTitle}>{item.serviceName}</Text>
          </View>
          <Text style={styles.day}>
            {moment(item.bookDetail[0].bookingDate).format("dddd")} (
            {i18n.t("home.repeat")} {item.bookDetail.length}{" "}
            {i18n.t("home.times")})
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginVertical: 8,
            }}
          >
            <Text style={styles.wrapTime}>
              START:
              <Text style={styles.time}>
                {" "}
                {moment(newData[newData.length - 1].bookingDate).format("ll")}
              </Text>
            </Text>
            <Text style={styles.wrapTime}>
              END:
              <Text style={styles.time}>
                {" "}
                {moment(newData[0].bookingDate).format("ll")}
              </Text>
            </Text>
          </View>
          <Text style={styles.time}>
            {bookingTime && moment(bookingTime).format("hh:mm A")} ({item.hour}
            h)
          </Text>
          {index === indexCancel && item.id === serviceCancel && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.title}>Reason: {reason.label} </Text>
            </View>
          )}
          <View style={{ flexDirection: "row",  paddingHorizontal: 12, paddingBottom: 4 }}>
            <Button
              style={{ flex: 1 }}
              onPress={
                index !== indexCancel && item.id !== serviceCancel
                  ? onPressCancelPlan
                  : onSubmit
              }
              title={
                index === indexCancel
                  ? i18n.t("home.submit_cancel")
                  : i18n.t("home.cancel_subscription")
              }
            />
            <View style={styles.wrapSwitchCancel}>
              <Text style={{ flex: 2, textAlign: "center" }}>
                {i18n.t("home.auto_renew")}
              </Text>
              <View style={{ flex: 1 }}>
                <Switch
                  trackColor={{
                    false: colors.gray,
                    true: colors.main_orange,
                  }}
                  thumbColor={colors.white}
                  ios_backgroundColor={colors.gray_normal_text}
                  onValueChange={toggleSwitch}
                  value={item.isAutoRenew}
                />
              </View>
            </View>
          </View>
          <Image
          resizeMode="contain"
          style={styles.icon}
          source={getSourceImage(item.serviceName)}
        />
        </View>
       
      </View>
    );
  };
  const renderItem = ({ item }: { item: any }) => {
    return (
      <View>
        {!isEmpty(dataPlan) && (
          <FlatList
            data={dataPlan[item]}
            extraData={dataPlan[item]}
            renderItem={renderItemSub}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>
    );
  };
  return (
    <Container style={styles.container}>
      <Loading
        loading={
          loadingCancelSubscription ||
          loadingListPlan ||
          loadingToggleRenewFlexible
        }
      />
      <FlatList
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Loading loading={false} />}
        contentContainerStyle={
          _.isEmpty(listPlan) && {
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }
        }
        data={listPlan}
        extraData={listPlan}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={() => <Text>{i18n.t("home.data_empty")}</Text>}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  icon: {
    height: 54,
    width: 54,
    position: "absolute",
    right: 24,
    borderRadius: 100,
  },
  wrapItem: {
    paddingHorizontal: 16,
    marginTop: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  containerItem: {
    backgroundColor: colors.white,
  
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerItem: {
    backgroundColor: colors.main_orange,
    padding: 12,
  },
  headerItemTitle: {
    color: colors.white,
    textTransform: "uppercase",
    fontWeight: "bold",
    fontSize: 16,
  },
  title: {
    fontWeight: "bold",
  },
  day: {
    marginTop: 18,
    paddingHorizontal: 12
  },
  time: {
    color: colors.black,
    fontWeight: "500",
    paddingHorizontal: 12
  },
  wrapTime: {
    paddingHorizontal: 12 ,
    color: colors.grab_orange,
    fontWeight: "bold",
  },
  wrapSwitchCancel: {
    flex: 1,
    marginLeft: 4,
    flexDirection: "row",
    alignItems: "center",
  },
});
