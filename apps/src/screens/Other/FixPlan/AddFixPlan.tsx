import { Ionicons, FontAwesome } from "@expo/vector-icons";
import _, { find, isEmpty, isNil } from "lodash";
import moment from "moment";
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Alert,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Button, Container, CustomInput, Text } from "../../../components";
import useApi from "../../../hooks/useApi";
import Colors from "../../../shared/Colors";
import Constants from "../../../shared/Constants";
import Enum from "../../../shared/Enum";
import i18n from "../../../shared/I18n";
import { SelectTimeModal } from "./components/SelectTimeModal";
interface Props {
  serviceId: string;
  serviceItemId: string;
  serviceName: string;
  ageKid: string;
  onSetAgeKid: any;
  serviceType: number;
  priceModel: any;
  salePriceModel: any;
  setTimes: any;
  countPrice: any;
  times: any;
}
export const AddFixPlan = ({
  serviceId,
  serviceItemId,
  serviceName,
  serviceType,
  priceModel,
  salePriceModel,
  setTimes,
  countPrice,
  times,
  ageKid,
  onSetAgeKid,
  ...props
}: Props) => {
  const [daysInWeek, setDaysInWeek] = useState<any[]>([]);

  const [isShow, setIsShow] = useState(false);
  const [indexItem, setIndexItem] = useState(-1);
  const [countHour, setCountHour] = useState(2);
  const [start, setStart] = useState(7);
  const [pickDate, setPickDate] = useState()

  const resetConfig = () => {
    setIndexItem(-1);
    setCountHour(2);
    setStart(7);
  };
  const onPressRemove = (index: any) => {
    setTimes(_.filter(times, (v, k) => k != index));
    resetConfig();
  };

  useEffect(() => {
    const dates = [];
    for (
      let m = moment().startOf("week");
      m.isBefore(moment().endOf("week"));
      m.add(1, "days")
    ) {
      dates.push({
        label: i18n.t(moment(m.toDate()).format("dddd")),
        value: moment(m.toDate()).day(),
      });
    }

    setDaysInWeek(dates);
  }, []);
  useEffect(() => {
    if (!isEmpty(priceModel) && !isEmpty(salePriceModel)) {
      countPrice();
    }
  }, [times, priceModel, salePriceModel, countHour]);

  const selectIndexTime = (index: number) => {
    setIsShow(true);
    setIndexItem(index);
    setPickDate(times[index].startAt)
  };
  console.log('times ', times)
  const onSelectTime = (item: any) => {
    setIsShow(false);
    setStart(item);
    times[indexItem].startAt = moment(times[indexItem].startAt)
      .startOf("day")
      .set({
        hour: item,
      });
  };
  const getRangeHour = (value: moment.Moment) => {
     const IsSameDate = moment(value).isSame(
      moment().add(1, "day"),
      "date"
    );
    if (IsSameDate) {
       return((moment().get("hour") + 18) % 24);
    } else {
      return(7);
    }
  }
  const handlePickDate = (value: moment.Moment) => {
   
    const startAt = value.clone().startOf("day").set({ hour: getRangeHour(value) });
   
    const endAt = moment(startAt).add(countHour, "hours");
    const label = _.find(daysInWeek, { value: startAt.day() }).label;

    if (_.findIndex(times, { label }) != -1) {
      return;
    }
    const hour = countHour;

    const item = {
      label,
      hour,
      startAt,
      endAt,
      serviceName,
    };
    let newItems = [item, ...times];
    setTimes(newItems);
  };
  const renderHeader = () => {
    return (
      <View style={{ marginBottom: 8 }}>
        {isEmpty(times) && (
          <Text style={{ flex: 1, padding: 12, textAlign: 'center' }}>
            {i18n.t("home.pick_service_date")}
          </Text>
        )}
      </View>
    );
  };
  return (
    <Container style={{ flex: 1 }}>
      <View style={styles.content}>
        <View
          style={{
          
            marginTop: 16,
            backgroundColor: Colors.white,
            shadowColor: Colors.black,
            shadowOffset: {
              width: 0,
              height: 0,
            },
            shadowOpacity: 0.2,
            borderRadius: 4,
            elevation: 2,
          }}
        >
          <CalendarComponent items={times} onPickDate={handlePickDate} />
        </View>

        <View style={{ flex: 1 }}>
          {!isEmpty(times) && (serviceType == 2 || serviceType == 3) && (
            <View style={styles.inputAgeKid}>
              <Text>
                {serviceType == 2
                  ? i18n.t("home.age")
                  : i18n.t("home.age_patient")}
              </Text>
              <CustomInput
                maxLength={2}
                value={ageKid}
                keyboardType="numeric"
                returnKeyType="done"
                onChangeText={onSetAgeKid}
                containerStyle={styles.input}
              />
            </View>
          )}

          <FlatList
            data={times}
            extraData={times}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={{ paddingBottom: 8 }}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TimeItem
                key={index}
                onPressTime={() => selectIndexTime(index)}
                onGetCountHour={(hour: number) => setCountHour(hour)}
                item={item}
                index={index}
                onPressRemove={onPressRemove}
              />
            )}
          />
        </View>
      </View>
      <SelectTimeModal pickDate={pickDate} onSelect={onSelectTime} isShow={isShow} />
    </Container>
  );
};

const CalendarComponent = (props: any) => {
  const getMoreItems = () => {
    const moreItems: any = [];
    function getDaysBooking(day: any) {
      let start = moment(day.startAt);
      let count = 0;
      let tmp = moment(start).clone().day(moment(day.startAt).day());
      if (tmp.isSameOrAfter(start, "d")) {
        moreItems.push({
          title: day.serviceName,
          startAt: moment(tmp),
          endAt: moment(tmp.clone().set({ hour: day.endAt.hour() })),
          hour: day.hour,
        });
      }
      while (tmp.add(7, "days") && count < 3) {
        count = count + 1;
        moreItems.push({
          title: day.serviceName,
          startAt: moment(tmp),
          endAt: moment(tmp.clone().set({ hour: day.endAt.hour() })),
          hour: day.hour,
        });
      }
      return moreItems;
    }
    props.items.map((i: any) => {
      getDaysBooking(i);
    });
    return moreItems;
  };

  return (
    <Calendar
      enableSwipeMonths={true}
      current={
        moment().daysInMonth() == moment().endOf("month").daysInMonth()
          ? moment().add(1, "days").format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD")
      }
      minDate={moment().format("YYYY-MM-DD")}
      maxDate={moment().add(1, "year").format("YYYY-MM-DD")}
      monthFormat={"MMMM - yyyy"}
      hideExtraDays={true}
      // renderArrow={(direction) =>
      //   direction === "left" ? (
      //     <FontAwesome color={Colors.grab_orange} size={20} name="angle-left" />
      //   ) : (
      //     <FontAwesome
      //       color={Colors.grab_orange}
      //       size={20}
      //       name="angle-right"
      //     />
      //   )
      // }
      dayComponent={({ date }) => (
        <TouchableOpacity
          style={[
            {
              minWidth: 40,
              minHeight: 24,
              justifyContent: "center",
              alignItems: "center",
            },
            _.find(getMoreItems(), function (o) {
              return moment(o.startAt).format("yyyy-MM-DD") === date.dateString;
            }) && { backgroundColor: Colors.main_orange, borderRadius: 4 },
          ]}
          onPress={() => {
            if (moment(date.dateString).diff(moment()) < 1 == false) {
              props.onPickDate(moment(date.dateString));
            }
          }}
        >
          <Text
            style={[
              {
                ...(moment(date.dateString).diff(moment()) < 1
                  ? {
                      color: Colors.gray_normal_text,
                    }
                  : {
                      color: Colors.black,
                    }),
              },
              _.find(getMoreItems(), function (o) {
                return (
                  moment(o.startAt).format("yyyy-MM-DD") === date.dateString
                );
              }) && { color: Colors.white },
            ]}
          >
            {date.day}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
};

const TimeItem = ({
  item,
  index,
  onPressRemove,
  onPressTime,
  onGetCountHour,
}: any) => {
  const [hour, setHour] = useState<number>(item.hour);
  const onDecrease = () => {
    if (hour <= 2) return;
    setHour((hour) => (hour -= 1));
  };
  // const repeatTime =
  //   moment().daysInMonth() / 7 - new Date(item.startAt).getDate() / 7;
  const onIncrease = () => {
    if (hour == 24) return;
    setHour((hour) => (hour += 1));
  };
  useEffect(() => {
    item.endAt = moment(item.startAt).add(hour, "hours");
  }, [item.startAt]);
  useEffect(() => {
    item.hour = hour;
    onGetCountHour(hour);
    item.endAt = moment(item.startAt).add(hour, "hours");
  }, [hour]);
  return (
    <View
      style={{
        padding: 8,
        marginHorizontal: 12,
        marginBottom: 12,
        backgroundColor: Colors.white,
        shadowColor: Colors.black,
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.2,
        borderRadius: 6,
        elevation: 4
      }}
    >
      <Text
        style={{
          color: Colors.black,
          fontWeight: "bold",
        }}
      >
        {moment(item.startAt).format("DD/MM/YYYY")}
        {/* {repeatTime > 1 && ( */}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "400",
              color: Colors.grab_orange,
            }}
          >
            {" "}
            {i18n.t("home.repeat")} 4{" "}
            {i18n.t("home.timesBook")} {moment(item.startAt).format("dddd")}
          </Text>
        {/* )} */}
      </Text>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              marginVertical: 10,
              alignItems: "center",
            }}
          >
            <Text style={[styles.title]}>{i18n.t("home.start_time")}</Text>
            <TouchableOpacity onPress={onPressTime} style={styles.dropDown}>
              <Text style={[styles.title, { marginLeft: 12 }]}>
                {moment(item.startAt).format("HH:mm A")}
              </Text>
              <Ionicons name="caret-down" size={18} />
            </TouchableOpacity>
          </View>
          <View style={styles.wrapCountHour}>
            <Text style={styles.title}>{i18n.t("home.how_many_hour")}</Text>
            <View
              style={{
                flexDirection: "row",
                flex: 2,
              }}
            >
              <TouchableOpacity onPress={onDecrease}>
                <Ionicons
                  name="remove-circle"
                  size={28}
                  color={Colors.main_color}
                />
              </TouchableOpacity>
              <Text style={styles.hour}>{item.hour}</Text>
              <TouchableOpacity onPress={onIncrease}>
                <Ionicons
                  name="add-circle"
                  size={28}
                  color={Colors.main_color}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Ionicons
          name="trash-outline"
          size={28}
          onPress={() => onPressRemove(index)}
          color={Colors.black}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  inputAgeKid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    width: 200,
  },
  wrapNextButton: {
    backgroundColor: Colors.white,
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  wrapTotal: {
    flex: 2,
  },
  hour: {
    fontSize: 20,
    fontWeight: "400",
    width: "20%",
    textAlign: "center",
    marginHorizontal: 16,
  },
  wrapCountHour: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    flex: 1.3,
    fontSize: 12,
    color: Colors.black,
  },
  dropDown: {
    flex: 2,
    backgroundColor: Colors.white,
    flexDirection: "row",
    paddingVertical: 6,
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: Colors.gray_hidden_text,
    elevation: 4,
  },
});
