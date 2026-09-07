import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, Container, Loading, Text } from "../../../components";
import useApi from "../../../hooks/useApi";
import Colors from "../../../shared/Colors";
import Constants from "../../../shared/Constants";
import i18n from "../../../shared/I18n";

export default function Agree(props: any) {
  const { plan, onGoBack } = props.route.params;

  const [agreeText, setAgreeText] = useState();
  const [agree, setAgree] = useState(true);

  const [loadingAgreeSubscription, requestAgreeSubscription] = useApi({
    method: "get",
    url: Constants.API.get_agree_plan,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }

      setAgreeText(response && response.agree);
    },
  });

  useEffect(() => {
    requestAgreeSubscription({
      params: { id: plan.id },
    });
  }, []);

  const onPressButton = (result: boolean) => {
    onGoBack(result, plan);

    props.navigation.goBack();
  };

  return (
    <Container>
      <Loading loading={loadingAgreeSubscription} />
      <ScrollView>
        <View
          style={{
            padding: 16,
          }}
        >
          <View style={{ marginBottom: 16 }}>
            <Text>{agreeText}</Text>
          </View>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={() => setAgree(!agree)}
          >
            <View
              style={{
                height: 28,
                width: 28,
                borderColor: "#bbb",
                borderWidth: 1.5,
                marginEnd: 10,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {agree && <Ionicons name="checkmark" size={22} />}
            </View>
            <Text>{i18n.t("home.i_have_read_agreement")}</Text>
          </TouchableOpacity>
          <View
            style={{
              flexDirection: "row",
              marginTop: 24,
            }}
          >
            <Button
              style={{ flex: 1 }}
              colorBackground={"#bbb"}
              onPress={() => onPressButton(false)}
            >
              <Text
                style={{
                  color: Colors.white,
                  fontSize: 16,
                }}
              >
                {i18n.t("home.cancel")}
              </Text>
            </Button>
            <View style={{ width: 16 }} />
            <Button
              style={{ flex: 1 }}
              onPress={() => onPressButton(true)}
              disabled={!agree}
            >
              <Text
                style={{
                  color: Colors.white,
                  fontSize: 16,
                }}
              >
                {i18n.t("home.agree")}
              </Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
