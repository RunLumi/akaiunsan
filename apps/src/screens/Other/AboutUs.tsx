import React from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";

import { Container, Text, Button } from "../../components";
import colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import type { ScreenProps } from "../../navigation/routes";

export function AboutUsView(props: ScreenProps) {
  const { url }: { url: string } = props.route.params;

  return (
    <Container>
      <View style={{ flex: 1 }}>
        <WebView
          startInLoadingState={true}
          containerStyle={{ flex: 1 }}
          cacheEnabled={false}
          renderLoading={() => (
            <ActivityIndicator
              color={colors.black}
              style={{ flex: 1, alignSelf: "center" }}
            />
          )}
          source={{
            uri: url,
          }}
        />
      </View>
    </Container>
  );
}

export default function AboutUs(props: ScreenProps) {
  return (
    <Container>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <Text style={{ textAlign: "center", marginBottom: 4 }}>
          Akaiunsan Holdings Co.,Ltd.
        </Text>
        <Text style={{ textAlign: "center", marginBottom: 4 }}>
          02-714-2116
        </Text>
        <Text style={{ textAlign: "center" }}>
          26/2, Sukhumvit soi 61, Klongton-Nua, Wattana, Bangkok
        </Text>
        <View style={{ marginTop: 24, width: 200 }}>
          <Button
            title="Privacy Policy"
            onPress={() => {
              props.navigation.push(Constants.SCREENS.OTHER.ABOUT_US_VIEW, {
                url: 'https://akaiunsan.com/privacy-policy',
              });
            }}
            textStyle={{ textAlign: "center" }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Term of Use"
            onPress={() => {
              props.navigation.push(Constants.SCREENS.OTHER.ABOUT_US_VIEW, {
                url: 'https://akaiunsan.com/terms-of-service',
              });
            }}
            textStyle={{ textAlign: "center" }}
          />
        </View>
      </View>
    </Container>
  );
}
