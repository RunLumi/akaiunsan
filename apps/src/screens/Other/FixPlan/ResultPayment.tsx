import _, { xor } from "lodash";
import moment from "moment";
import React from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import colors from "../../../shared/Colors";
import i18n from "../../../shared/I18n";

export default function ResultPayment(props: any) {
  return (
    <View style={{ flex: 1 }}>
      {props.receivePoint ? (
        <View>
          <Text style={styles.textBolder}>{i18n.t("home.you_earn")}</Text>
          <View style={{ flexDirection: "row" }}>
            <Text style={{ color: colors.main_color, fontSize: 40 }}>
              {props.receivePoint}{" "}
            </Text>
            <Text style={[styles.textBolder, { alignSelf: "flex-end" }]}>
              {i18n.t("home.reward_point")}
            </Text>
          </View>
        </View>
      ) : null}
      <Text style={{ fontSize: 45 }}>{i18n.t("home.thank_you")}</Text>
      <Text style={{ color: colors.gray_hidden_text, fontSize: 20 }}>
        {i18n.t("home.please_wait")}
      </Text>
      <View style={{ marginVertical: 10 }}>
        <Text style={styles.textBolder}>{i18n.t("home.booking_detail")}</Text>
        <Text>
          {props.nameServiceType} {props.valueShowHour}hr
        </Text>

        <Text>{props.times[0].startAt.format("MMMM Y")}</Text>
        {props.times.length > 0 && (
          <Text>
            {_.map(
              props.times,
              (x) =>
                `- ${x.startAt.format("dddd")} \n${x.startAt.format(
                  "lll"
                )}\n(${i18n.t("home.repeat")} 4 ${i18n.t(
                  "home.timesBook"
                )} ${moment(x.startAt).format("dddd")})\n`
            )}
          </Text>
        )}
        <Text>{props.address.longAddress}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  textBolder: {
    fontWeight: "bold",
    fontSize: 25,
  },
});
