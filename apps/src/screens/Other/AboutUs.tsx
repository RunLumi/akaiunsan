import React from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";

import { Container, Text, Button } from "../../components";
import colors from "../../shared/Colors";
import Constants from "../../shared/Constants";

export function AboutUsView(props: any) {
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
            // isTerms !== true
            //   ? "https://www.akaiunsan-app.com/th-TH/privacy_policy/"
            //   : "https://www.akaiunsan-app.com/th-TH/terms_of_service/",
          }}
        />
      </View>
    </Container>
  );
}

export default function AboutUs(props: any) {
  // https://www.akaiunsan-app.com/th-TH/privacy_policy/

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
                url: 'https://www.akaiunsan-app.com/th-TH/privacy_policy/',
              });
            }}
            textStyle={{ textAlign: "center" }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Term of Use"
            onPress={() => {
              props.navigation.push(Constants.SCREENS.OTHER.ABOUT_US_VIEW, {
                url: 'https://www.akaiunsan-app.com/th-TH/terms_of_service/',
              });
            }}
            textStyle={{ textAlign: "center" }}
          />
        </View>
      </View>
    </Container>
  );
}
