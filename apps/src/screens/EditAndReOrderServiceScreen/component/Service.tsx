import React, { useEffect, useState } from "react";
import {
  Dimensions,
  View,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { CustomInput, Text } from "../../../components";
import i18n from "../../../shared/I18n";
import { Calendar } from "react-native-calendars";
import dayjs from "../../../shared/dayjs";
import Colors from "../../../shared/Colors";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import CustomMarker from "../../../components/CustomMarker";
import _ from "lodash";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { SelectTimeModal } from "../../Other/FixPlan/components/SelectTimeModal";
import type { ApiItem } from "../../../redux/apiSlice";
import type { ScreenProps } from "../../../navigation/routes";


export default function Service(props: ScreenProps) {
  const [step, setStep] = useState(1);
  const { width } = Dimensions.get("screen");
  const [sliderValues, setSliderValues] = useState<number[]>([]);
  const [hour, setHour] = useState<number>(props.valueShowHour || 2);
  const [start, setStart] = useState(7);
  const [isShow, setIsShow] = useState(false);
  const [pickDate, setPickDate] = useState<string>();
  useEffect(() => {
    const m = dayjs(props.valueShowDateTime, "DD/MM/YYYY HH:mm");

    if (m.isValid()) {
      setStart(dayjs(props.valueShowDateTime, "DD/MM/YYYY HH:mm").hour());
      setPickDate(m.format("YYYY-MM-DD"));
      const t = m.format("H:mm");
      const s =
        _.toInteger(t.split(":")[0]) + (t.indexOf(":30") != -1 ? 0.5 : 0);
      setSliderValues([s, s + props.valueShowHour]);
    } else {
      setSliderValues([7, 9]);
    }
  }, []);

  const onChangeSliderValues = (valueDate: string, values: number[]) => {
    if ((values[1] - values[0]).toString().indexOf(".5") != -1) {
      values[1] = values[1] + 0.5;
    }

    if (values[1] - values[0] < 2) {
      values[1] = values[0] + 2;

      setStep(1);
      setTimeout(() => setStep(0.5), 200);
    }

    const valueTime = values[0].toFixed(2);

    setSliderValues(values);

    handleValueDateTime(
      dayjs(valueDate).format("DD/MM/YYYY"),
      valueTime.indexOf(".5") != -1
        ? valueTime.split(".")[0] + ":30"
        : valueTime.split(".")[0] + ":00",
      valueDate,
      valueTime,
      values[1] - values[0]
    );
  };

  const handleValueDateTime = (
    showDate: string,
    showTime: string,
    valueDate: string,
    valueTime: string,
    valueHour: number
  ) => {
    let formatValuetime = "";
    if (_.toInteger(valueTime) < 10) {
      formatValuetime = `0${valueTime}`.replace(/\./g, ":");
    } else {
      formatValuetime = `${valueTime}`.replace(/\./g, ":");
    }
    props.handleHour(valueHour);
    props.handleDateTime(
      valueDate,
      formatValuetime,
      valueHour,
      `${showDate} ${showTime}`
    );
  };
  const onDecrease = () => {
    if (hour <= 2) return;
    setHour((hour) => (hour -= 1));
  };

  const onIncrease = () => {
    if (hour == 24) return;
    setHour((hour) => (hour += 1));
  };
  const onPressTime = () => {
    setIsShow(true);
  };
  useEffect(() => {
    if (pickDate) {
      props.handleHour(hour);
      props.handleDateTime(
        dayjs(props.valueShowDateTime, "DD/MM/YYYY HH:mm").format(
          "YYYY-MM-DD"
        ),
        dayjs(props.valueShowDateTime, "DD/MM/YYYY HH:mm")
          .clone()
          .set("hour", start)
          .format("HH:mm"),
        hour,
        dayjs(props.valueShowDateTime, "DD/MM/YYYY HH:mm")
          .clone()
          .set("hour", start)
          .format("DD/MM/YYYY H:mm A")
      );
    }
  }, [hour]);
  const onSelectTime = (value: number) => {
    setIsShow(false);
    setStart(value);
    props.handleDateTime(
      dayjs(props.valueShowDateTime, "DD/MM/YYYY HH:mm").format("YYYY-MM-DD"),
      dayjs(props.valueShowDateTime, "DD/MM/YYYY HH:mm")
        .clone()
        .set("hour", value)
        .format("HH:mm"),
      hour,
      dayjs(props.valueShowDateTime, "DD/MM/YYYY HH:mm")
        .clone()
        .set("hour", value)
        .format("DD/MM/YYYY H:mm A")
    );
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          {
            justifyContent: "space-between",
            paddingBottom: 8,
            backgroundColor: Colors.gray_light,
          },
          props.type != 4 && { flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        
          <View>
            <Calendar
              enableSwipeMonths={true}
              current={
                dayjs().daysInMonth() == dayjs().endOf("month").daysInMonth()
                  ? dayjs().add(1, "days").format("YYYY-MM-DD")
                  : dayjs().format("YYYY-MM-DD")
              }
              minDate={dayjs().format("YYYY-MM-DD")}
              maxDate={dayjs().add(1, "year").format("YYYY-MM-DD")}
              monthFormat={"MMMM - yyyy"}
              hideExtraDays={true}
              dayComponent={({ date }: { date?: { dateString: string } }) => (
                <TouchableOpacity
                disabled={props.isEdit}
                  style={{
                    minWidth: 40,
                    minHeight: 24,
                    justifyContent: "center",
                    alignItems: "center",
                    ...(date!.dateString == pickDate && {
                      backgroundColor: Colors.main_orange,
                      borderRadius: 4,
                    }),
                  }}
                  onPress={() => {
                    if (dayjs(date!.dateString).diff(dayjs()) < 1 == false) {
                      setPickDate(date!.dateString);
                      onChangeSliderValues(date!.dateString, sliderValues);
                    }
                  }}
                >
                  <Text
                    style={{
                      ...(dayjs(date!.dateString).diff(dayjs()) < 1
                        ? {
                            color: Colors.gray_normal_text,
                          }
                        : {
                            color: Colors.black,
                          }),
                      ...(date!.dateString == pickDate && {
                        color: Colors.white,
                      }),
                    }}
                  >
                    {dayjs(date!.dateString).date()}
                  </Text>
                </TouchableOpacity>
              )}
            />
            {!pickDate && (
              <Text style={{ flex: 1, paddingTop: 8, textAlign: "center" }}>
                {i18n.t("home.pick_service_date")}
              </Text>
            )}
            {pickDate && (props.type == 2 || props.type == 3) && (
              <View style={styles.inputAgeKid}>
                <Text>
                  {props.type == 2
                    ? i18n.t("home.age")
                    : i18n.t("home.age_patient")}
                </Text>
                <CustomInput
                  maxLength={2}
                  value={props.ageKid.toString()}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onChangeText={(text) => props.onSetAgeKid(text)}
                  containerStyle={styles.input}
                />
              </View>
            )}
            {pickDate && (
              <View
                style={{
                  padding: 8,
                  marginHorizontal: 16,
                  marginTop: 12,
                  backgroundColor: Colors.white,
                  shadowColor: Colors.shadow,
                  shadowOffset: {
                    width: 0,
                    height: 0,
                  },
                  shadowOpacity: 0.3,
                  borderRadius: 6,
                  elevation: 3,
                }}
              >
                <View
                  style={{
                    // flex: 1,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ marginRight: 12 }}>
                    <Text
                      style={{
                        color: Colors.black,
                        fontWeight: "bold",
                      }}
                    >
                      {dayjs(pickDate).format("DD/MM/YYYY")}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        marginVertical: 6,
                        alignItems: "center",
                      }}
                    >
                      <Text style={styles.title}>
                        {i18n.t("home.start_time")}
                      </Text>
                      <TouchableOpacity
                        style={styles.dropDown}
                        onPress={onPressTime}
                      >
                        <Text style={[styles.title, { marginLeft: 12 }]}>
                          {dayjs(
                            dayjs(pickDate)
                              .clone()
                              .startOf("day")
                              .set("hour", start)
                          ).format("HH:mm A")}
                        </Text>
                        <Ionicons name="caret-down" size={18} />
                      </TouchableOpacity>
                    </View>
                    {props.type != 4 && (
                      <View style={styles.wrapCountHour}>
                        <Text style={styles.title}>
                          {i18n.t("home.how_many_hour")}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            flex: 2,
                          }}
                        >
                          <TouchableOpacity
                            disabled={props.isEdit}
                            onPress={onDecrease}
                          >
                            <Ionicons
                              name="remove-circle"
                              size={28}
                              color={
                                props.isEdit
                                  ? Colors.gray_normal_text
                                  : Colors.main_color
                              }
                            />
                          </TouchableOpacity>
                          <Text style={styles.hour}>{hour}</Text>
                          <TouchableOpacity
                            disabled={props.isEdit}
                            onPress={onIncrease}
                          >
                            <Ionicons
                              name="add-circle"
                              size={28}
                              color={
                                props.isEdit
                                  ? Colors.gray_normal_text
                                  : Colors.main_color
                              }
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>

        {props.type != 4 && !props.isEdit && (
          <TouchableOpacity
            onPress={props.onPressSubscriptionPlan}
            style={styles.wrapSubButton}
          >
            {/* No Vietnamese banner asset exists yet — the English promo
                banner serves both locales. */}
            <Image
              style={{
                height: 100,
                width: width - 24,
              }}
              resizeMode="contain"
              source={require("../../../assets/images/buttonSubEng3.png")}
            />
          </TouchableOpacity>
        )}
      </ScrollView>
      <SelectTimeModal onSelect={onSelectTime} isShow={isShow} />
    </View>
  );
}

const styles = StyleSheet.create({
  inputAgeKid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  image: {
    width: "100%",
    height: 150,
  },
  input: {
    width: 200,
  },
  hour: {
    fontSize: 20,
    fontWeight: "400",
    width: "20%",
    textAlign: "center",
    marginHorizontal: 16,
  },
  wrapCountHour: {
    // flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    width: "37.5%",
    fontSize: 12,
    color: Colors.black,
    marginRight: 20,
  },
  dropDown: {
    backgroundColor: Colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 6,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderRadius: 6,
    elevation: 2,
  },
  wrapSubButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 6,
  },
  titleSub: {
    color: Colors.yellow,
    fontWeight: "bold",
    fontSize: 13,
  },
  sub: {
    color: Colors.white,
    fontWeight: "bold",
    fontSize: 13,
  },
});
