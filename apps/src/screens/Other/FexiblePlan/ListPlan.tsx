import { Ionicons } from "@expo/vector-icons";
import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { View, Alert } from "react-native";
import {
  ScrollView,
  Switch,
  TouchableOpacity,
} from "react-native-gesture-handler";
import { Button, Container, Loading, Text } from "../../../components";
import PlanCard from "../../../components/PlanCard";
import useApi from "../../../hooks/useApi";
import Colors from "../../../shared/Colors";
import Constants from "../../../shared/Constants";
import i18n from "../../../shared/I18n";
import { rankBackground } from "../../../shared/Utils";

export default function ListPlan(props: any) {
  const {
    currentPlan: plan,
    serviceId,
    serviceItemId,
    serviceName,
    serviceType,
  } = props.route.params;

  const [currentPlan, setCurrentPlan] = useState<any>();
  const [currentFixPlan, setCurrentFixPlan] = useState<any>();
  const [listPlan, setListPlan] = useState<any[]>([]);
  const [autoRenew, setAutoRenew] = useState(false);
  const [autoRenewFixPlan, setAutoRenewFixPlan] = useState(false);

  const [loadingCurrentPlan, requestCurrentPlan] = useApi({
    method: "get",
    url: Constants.API.get_current_plan,
    callback: ({ error, response }) => {
      if (error) {
        setTimeout(() => {
          Alert.alert(i18n.t("auth.error"), error);
        }, 100);
        return;
      }

      // setListCurrentPlan(response.items);

      const plan = _.find(response.items, { serviceType });

      if (!_.isNil(plan)) {
        setCurrentPlan(plan);
        if (!_.isNil(plan) && plan.isAutoRenew) {
          setAutoRenew(true);
        }
      }
    },
  });

  const [loadingCurrentFixPlan, requestCurrentFixPlan] = useApi({
    method: "get",
    url: Constants.API.get_current_fixplan,
    callback: ({ error, response }) => {
      if (error) {
        // setTimeout(() => {
          Alert.alert(i18n.t("auth.error"), error);
        // }, 200);
        return;
      }
      if (response.title) {
        setCurrentFixPlan(response);
        setCurrentPlan(null);

        if (response && response.isRenew == true) {
          setAutoRenewFixPlan(true);
        }
      }
    },
  });

  const [loadingListPlan, requestListPlan] = useApi({
    method: "get",
    url: Constants.API.get_plan,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }

      if (!_.isNull(response)) {

        setListPlan(response && _.sortBy(response.items, "rank"));
      }
    },
  });

  const [loadingUpgradeFlexiblePlan, requestUpgradeFlexiblePlan] = useApi({
    method: "post",
    url: Constants.API.upgrade_flexible_plan,
    callback: ({ error, response }) => {

      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }

      requestCurrentPlan();
    },
  });

  const [loadingDowngradeFlexiblePlan, requestDowngradeFlexiblePlan] = useApi({
    method: "post",
    url: Constants.API.downgrade_flexible_plan,
    callback: ({ error, response }) => {

      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }

      requestCurrentPlan();
    },
  });

  const [loadingCancelFlexiblePlan, requestCancelFlexiblePlan] = useApi({
    method: "post",
    url: Constants.API.cancel_flexible_plan,
    callback: ({ error, response }) => {

      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }

      setCurrentPlan(null);
      requestCurrentPlan();
    },
  });

  const [loadingCancelFixPlan, requestCancelFixPlan] = useApi({
    method: "put",
    url: Constants.API.order_cancel_fix_plan,
    callback: ({ error, response }) => {

      if (response == true) {
        setCurrentFixPlan(null);

        requestCurrentFixPlan({
          params: {
            serviceType,
          },
        });
      }
    },
  });

  const [loadingToggleRenewFlexible, requestToggleRenewFlexible] = useApi({
    method: "post",
    url: Constants.API.toggle_renew_flexible,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      } else {
        if (response) {
          setAutoRenew(response.isAutoRenew);
        }
      }
    },
  });

  const [loadingToggleRenewFixPlan, requestToggleRenewFixPlan] = useApi({
    method: "post",
    url: Constants.API.toggle_renew_fix,
    callback: ({ error, response }) => {

      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      } else {
        if (response) {
          setAutoRenewFixPlan(response.isAutoRenew);
        }
      }
    },
  });

  useEffect(() => {

    requestCurrentPlan();

    requestListPlan({
      params: {
        serviceType,
        planType: 1,
      },
    });

    requestCurrentFixPlan({
      params: {
        serviceType,
      },
    });
  }, []);

  const onAgreeBack = async (result: boolean, plan: any) => {
    if (!result) {
      return;
    }

    const data = {
      id: plan.id,
      voucherCode: "",
      point: 0,
    };

    if (plan.rank <= currentPlan.rank) {
      requestDowngradeFlexiblePlan({
        data,
      });
    } else {
      requestUpgradeFlexiblePlan({
        data,
      });
    }
  };

  const onSubscribeBack = () => {
    // onReloadCurrentPlan();
    requestCurrentPlan();
    props.navigation.pop(1);
  };

  const onPressPlan = (item: any) => {
    if (!_.isNil(currentPlan)) {
      props.navigation.navigate(Constants.SCREENS.OTHER.AGREE_FEXIBLE_PLAN, {
        plan: item,
        onGoBack: onAgreeBack,
      });
    } else {
      props.navigation.push(Constants.SCREENS.OTHER.DETAIL_FEXIBLE_PLAN, {
        plan: item,
        onGoBack: onSubscribeBack,
      });
    }
  };

  const onPressFixPlan = () => {
    props.navigation.push(Constants.SCREENS.OTHER.ADD_FIX_PLAN, {
      serviceId,
      serviceItemId,
      serviceName,
      serviceType,
    });
  };

  const onPressCancelPlan = () => {
    requestCancelFlexiblePlan({
      data: {
        orderId: currentPlan.subscriptionOrderId,
      },
    });
  };

  const onPressCancelFixPlan = () => {
    requestCancelFixPlan({
      data: {
        orderId: currentFixPlan.idOrder,
        reason: "123",
        serviceType,
      },
    });
  };

  const handleAutoRenew = () => {
    if (autoRenew) {
      requestToggleRenewFlexible({
        data: {
          orderId: currentPlan.subscriptionOrderId,
          isAutoRenew: false,
        },
      });
    } else {
      requestToggleRenewFlexible({
        data: {
          orderId: currentPlan.subscriptionOrderId,
          isAutoRenew: true,
        },
      });
    }
  };

  const handleAutoRenewFixPlan = () => {
    requestToggleRenewFixPlan({
      data: {
        orderId: currentFixPlan.idOrder,
        isAutoRenew: !autoRenewFixPlan,
      },
    });
  };

  return (
    <Container>
      <Loading
        loading={
          loadingListPlan ||
          loadingToggleRenewFlexible ||
          loadingCurrentFixPlan ||
          loadingCancelFixPlan ||
          loadingCancelFlexiblePlan ||
          loadingCurrentPlan
        }
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {_.isNil(currentFixPlan) && _.isNil(currentPlan) && (
          <View>
            <TouchableOpacity
              onPress={onPressFixPlan}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: Colors.gray_normal_text,
                }}
              >
                {i18n.t("home.fix_plan")}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={Colors.gray_normal_text}
              />
            </TouchableOpacity>
            <View
              style={{
                backgroundColor: "#bbb",
                marginHorizontal: 16,
                height: 1,
              }}
            />
            <View style={{ padding: 16 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: Colors.gray_normal_text,
                }}
              >
                {i18n.t("home.fexible_plan")}
              </Text>
            </View>
          </View>
        )}
        {!_.isNil(currentFixPlan) && (
          <View
            style={{
              margin: 16,
              padding: 16,
              backgroundColor: Colors.white,
              shadowColor: Colors.black,
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.1,
              borderRadius: 6,
            }}
          >
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              <Text
                style={{
                  marginRight: 8,
                  fontSize: 16,
                }}
              >
                {i18n.t("home.current_plan")}:
              </Text>
              <Text
                style={{
                  color: Colors.gray_normal_text,
                  fontSize: 16,
                  flex: 1,
                }}
              >
                {currentFixPlan.title}
              </Text>
            </View>
            <View style={{ marginBottom: 24 }}>
              {currentFixPlan.time.map((x: any, i: number) => (
                <View key={i}>
                  <Text>{x.bookingDate}</Text>
                  <Text>{x.bookingHours}</Text>
                </View>
              ))}
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text>{i18n.t("home.auto_renew_subscription")}</Text>
              <Switch
                thumbColor={Colors.main_color}
                trackColor={{
                  true: Colors.main_color,
                  false: Colors.gray_hidden_text,
                }}
                value={autoRenewFixPlan}
                onValueChange={handleAutoRenewFixPlan}
              />
            </View>
          </View>
        )}
        {!_.isNil(currentPlan) && (
          <View>
            <View
              style={{
                margin: 16,
                padding: 16,
                backgroundColor: Colors.white,
                shadowColor: Colors.black,
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                borderRadius: 6,
              }}
            >
              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                <Text
                  style={{
                    marginRight: 8,
                    fontSize: 16,
                  }}
                >
                  {i18n.t("home.current_plan")}:
                </Text>
                <Text
                  style={{
                    color: Colors.gray_normal_text,
                    fontSize: 16,
                  }}
                >
                  {currentPlan.rank == 1 && i18n.t("home.silver")}
                  {currentPlan.rank == 2 && i18n.t("home.gold")}
                  {currentPlan.rank == 3 && i18n.t("home.platinum")}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    marginRight: 2,
                    color: Colors.main_color,
                  }}
                >
                  {currentPlan.hourRemain} {i18n.t("home.hour_left")}
                </Text>
                <Text>
                  / {moment(currentPlan.expiredDate).local().format("ll")}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text>{i18n.t("home.auto_renew_subscription")}</Text>
                <Switch
                  thumbColor={Colors.main_color}
                  trackColor={{
                    true: Colors.main_color,
                    false: Colors.gray_hidden_text,
                  }}
                  value={autoRenew}
                  onValueChange={handleAutoRenew}
                />
              </View>
            </View>
            <View
              style={{
                paddingHorizontal: 16,
                marginTop: 16,
              }}
            >
              <Text style={{ fontWeight: "600" }}>
                {i18n.t("home.upgrade_to")}:
              </Text>
            </View>
          </View>
        )}
        {_.isNil(currentFixPlan) &&
          listPlan.map((item: any, i: number) => (
            <View key={i} style={{ marginVertical: 8, paddingHorizontal: 16 }}>
              <PlanCard
                background={rankBackground(item.rank)}
                onPress={() => onPressPlan(item)}
                buttonText={
                  !_.isNil(currentPlan)
                    ? item.rank != currentPlan.rank &&
                      item.rank <= currentPlan.rank
                      ? "Downgrade"
                      : "Upgrade"
                    : null
                }
                buttonDisabled={
                  !_.isNil(currentPlan) ? item.rank == currentPlan.rank : null
                }
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: item.rank === 3 ? "white" : "black",
                    }}
                  >
                    {item.rank == 1 && i18n.t("home.silver").toUpperCase()}
                    {item.rank == 2 && i18n.t("home.gold").toUpperCase()}
                    {item.rank == 3 && i18n.t("home.platinum").toUpperCase()}
                  </Text>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "700",
                      color: item.rank === 3 ? "white" : "black",
                    }}
                  >
                    ฿{item.price}/{i18n.t("home.month")}
                  </Text>
                </View>
                <Text
                  style={{
                    marginBottom: 4,
                    color: item.rank === 3 ? "white" : "black",
                  }}
                >
                  15 hrs/{i18n.t("home.month")}
                </Text>
                <Text
                  style={{
                    marginBottom: 4,
                    color: item.rank === 3 ? "white" : "black",
                  }}
                >
                  {i18n.t("home.included_transportation_cost")}
                </Text>
                <Text
                  style={{
                    marginBottom: 4,
                    color: item.rank === 3 ? "white" : "black",
                  }}
                >
                  {i18n.t("home.request_when_needed")}
                </Text>
                <Text
                  style={{
                    marginBottom: 4,
                    color: item.rank === 3 ? "white" : "black",
                  }}
                >
                  {i18n.t("home.guarantee_if_not_satisfy")}
                </Text>
              </PlanCard>
            </View>
          ))}
        {!_.isNil(currentPlan) && (
          <View style={{ margin: 16 }}>
            <Button onPress={onPressCancelPlan}>
              <Text
                style={{
                  color: Colors.white,
                  fontWeight: "700",
                }}
              >
                {i18n.t("home.cancel_subscription")}
              </Text>
            </Button>
          </View>
        )}
        {!_.isNil(currentFixPlan) && (
          <View style={{ margin: 16 }}>
            <Button onPress={onPressCancelFixPlan}>
              <Text
                style={{
                  color: Colors.white,
                  fontWeight: "700",
                }}
              >
                {i18n.t("home.cancel_subscription")}
              </Text>
            </Button>
          </View>
        )}
      </ScrollView>
    </Container>
  );
}
