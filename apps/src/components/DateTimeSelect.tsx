import React from "react";
import {
  Platform,
  StyleSheet,
  ViewStyle,
  View,
  TouchableOpacity,
  Dimensions,
  StyleProp,
  Alert,
} from "react-native";
import { Overlay } from "react-native-elements";
import colors from "../shared/Colors";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { Button, Text } from ".";
import i18n from "../shared/I18n";
import dayjs from "../shared/dayjs";
import Layout from "../shared/Layout";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import Colors from "../shared/Colors";
import Theme from "../shared/theme";
import CustomMarker from "./CustomMarker";
interface Props {
  style?: StyleProp<ViewStyle>;
  children?: any;
  valueDateTime?: any;
  dateTimeSelect?: any;
  hour?: any;
}

export const DateTimeSelect = ({
  style,
  children,
  valueDateTime,
  dateTimeSelect,
  hour,
  ...props
}: Props) => {
  const today = dayjs(new Date()).add(1, "day").format("YYYY-MM-DD");
  const [currentDay, setCurrentDay] = React.useState(today);
  const [valueTime, setValueTime] = React.useState((6.0).toFixed(2));
  const [valueDate, setValueDate] = React.useState("");
  const [showDate, setShowDate] = React.useState("");
  const [markedDates, setMarkedDates] = React.useState({});
  const [showModal, setShowModal] = React.useState(false);
  const [sliderValues, setSliderValues] = React.useState<any>([]);
  const [step, setStep] = React.useState(0.5);
  React.useImperativeHandle(children, () => ({
    openModalDateTime() {
      if (dateTimeSelect) {
        let date = dayjs(dateTimeSelect).local().format("YYYY-MM-DD");
        let time = dayjs(dateTimeSelect).local().format("HH:mm");
        setCurrentDay(date);
        setMarkedDates({
          [date]: { selected: true, selectedColor: colors.main_color },
        });
        let getValueTime = `${time}`.replace(/\:/g, ".");
        setValueTime(getValueTime);
        // setSliderValues([])
      }
      setShowModal(true);
    },
  }));

  React.useEffect(() => {
    setSliderValues([6, 9]);
  }, []);

  const changeToHourDecimal = (value: any) => {
    let data = value.toFixed(2);
    setValueTime(data);
  };
  const selectDate = (value: any) => {
    const selectDate = {
      [value.dateString]: { selected: true, selectedColor: colors.main_color },
    };
    setMarkedDates(selectDate);
    setValueDate(dayjs(value.dateString).format("YYYY-MM-DD"));
    setCurrentDay(dayjs(value.dateString).format("YYYY-MM-DD"));
    setShowDate(`${value.day}/${value.month}/${value.year}`);
  };

  const submitDateTime = () => {
    let showTime: any = "";
    let getMinTime = dayjs().format("HH:mm");
    let valueSplitMinTime = Number(getMinTime.split(":")[0]);
    let valueTimeF: any = "";
    if (valueDate) {
      if (valueTime.indexOf(".5") != -1) {
        showTime = valueTime.split(".")[0] + ":30"; // dayjs(.split('.')[0]);
        valueTimeF = valueTime.split(".")[0] + ".30";
      } else {
        showTime = valueTime.split(".")[0] + ":00";
        valueTimeF = valueTime.split(".")[0] + ".00";
      }

      if (dayjs(valueDate).isSame(dayjs(), "day")) {
        Alert.alert(i18n.t("auth.error"), i18n.t("home.date_not_min"));
        return;
      }

      valueDateTime(
        showDate,
        showTime,
        valueDate,
        valueTimeF,
        sliderValues[1] - sliderValues[0]
      );
      setShowModal(false);
    } else {
      Alert.alert(i18n.t("auth.error"), i18n.t("home.date_empty"));
    }
  };

  const onChangeSliderValues = (values: number[]) => {
    if ((values[1] - values[0]).toString().indexOf(".5") != -1) {
      values[1] = values[1] + 0.5;
    }

    if (values[1] - values[0] < 2) {
      values[1] = values[0] + 2;

      setStep(1);

      setTimeout(() => {
        setStep(0.5);
      }, 200);
    }

    setSliderValues(values);
    changeToHourDecimal(values[0]);
  };

  return (
    <Overlay animationType="fade" isVisible={showModal} fullScreen={true}>
      <View
        style={{
          flex: 1,
          position: "absolute",
          width: Layout.window.width,
          marginTop: Platform.OS === "ios" ? 20 : 0,
        }}
      >
        <View style={styles.container}>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <View style={{ flexDirection: "row", padding: 10 }}>
          <Ionicons name="close-circle-outline" size={30} color={Colors.white} />
              <Text style={styles.textClose}>{i18n.t("home.close")}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 15, marginTop: 20 }}>
          <Text style={{ fontSize: 30 }}>{i18n.t("home.when")}</Text>
          <View>
            <Calendar
              current={currentDay}
              markedDates={markedDates}
              monthFormat={"MMMM yyyy"}
              minDate={today}
              // mark date event
              markingType="custom"
              // hideArrows
              renderArrow={(direction: any) => (
                <FontAwesome
                  name={`chevron-${direction}` as any}
                  size={24}
                  color={colors.main_color}
                />
              )}
              hideExtraDays
              enableSwipeMonths={true}
              // Specify style for calendar container element. Default = {}
              onDayPress={(day) => selectDate(day)}
              // Specify theme properties to override specific styles for calendar parts. Default = {}
              theme={{
                backgroundColor: Colors.white,
                calendarBackground: Colors.white,
                textSectionTitleColor: colors.gray_normal_text,
                textSectionTitleDisabledColor: colors.gray_light,
                selectedDayBackgroundColor: Theme.colors.accent,
                selectedDayTextColor: Theme.colors.accentContrast,
                todayTextColor: colors.main_color,
                dayTextColor: colors.black_text,
                textDisabledColor: colors.gray_light,
                dotColor: colors.main_color,
                selectedDotColor: Colors.white,
                arrowColor: colors.black_text,
                disabledArrowColor: colors.gray_light,
                monthTextColor: colors.black_text,
                indicatorColor: colors.main_color,
                textDayFontWeight: "300",
                textMonthFontWeight: "bold",
                textDayHeaderFontWeight: "300",
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 16,
              }}
            />
          </View>
        </View>
        <View style={{ paddingHorizontal: 15 }}>
          <Text style={{ fontSize: 20 }}>{i18n.t("home.time_slot")}</Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text>6am</Text>
            <Text>8pm</Text>
          </View>
          <View
            style={{
              alignItems: "center",
            }}
          >
            <MultiSlider
              snapped
              isMarkersSeparated={true}
              sliderLength={Dimensions.get("window").width - 50}
              min={6}
              max={20}
              step={step}
              selectedStyle={{
                backgroundColor: Colors.main_orange,
              }}
              customMarkerLeft={(e) => (
                <CustomMarker {...e} currentValue={e.currentValue} />
              )}
              customMarkerRight={(e) => (
                <CustomMarker {...e} currentValue={e.currentValue} />
              )}
              values={sliderValues}
              onValuesChangeFinish={onChangeSliderValues}
            />
          </View>
        </View>
        <View style={{ marginTop: 30, paddingHorizontal: 30 }}>
          <Button
            style={{ width: "100%" }}
            title={i18n.t("auth.confirm")}
            onPress={() => submitDateTime()}
          />
        </View>
      </View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 55,
    backgroundColor: colors.main_color,
  },
  homeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textClose: {
    color: colors.white,
    fontSize: 20,
    marginLeft: 10,
  },
  timeBorder: {
    borderRadius: 15,
    height: 25,
    width: 50,
    backgroundColor: colors.main_color,
    alignItems: "center",
  },
});
