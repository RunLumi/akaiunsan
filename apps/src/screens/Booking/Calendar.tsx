import _, { isEmpty } from "lodash";
import dayjs from "../../shared/dayjs";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { StyleSheet, View, Alert, ActivityIndicator } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { Container, Loading, Text } from "../../components";
import Colors from "../../shared/Colors";
import i18n from "../../shared/I18n";
import Constants from "../../shared/Constants";
import Enum from "../../shared/Enum";
import { paramArray } from "../../shared/Utils";
import { apiSlice, portRequest, type ApiResult } from "../../redux/apiSlice";
import type { ApiItem } from "../../redux/apiSlice";
import type { ScreenProps } from "../../navigation/routes";

dayjs.locale("en");

const WeeklyCalendar = (props: ScreenProps) => {
  const dates: dayjs.Dayjs[] = [];

  for (
    let m = dayjs().startOf("week");
    m.isBefore(dayjs().endOf("week"));
    m = m.add(1, "days")
  ) {
    dates.push(dayjs(m.toDate()));
  }

  const times: dayjs.Dayjs[] = [];
  for (
    let h = dayjs().startOf("day").set("hour", 6);
    h.isBefore(dayjs().startOf("day").set("hour", 21));
    h = h.add(1, "hours")
  ) {
    times.push(dayjs(h.toDate()));
  }

  const getJob = (date: dayjs.Dayjs, time: dayjs.Dayjs) => {
    const datetime = date
      .startOf("day")
      .add(time.get("h"), "hour")
      .add(time.get("m"), "hour");

    return _(props.items).find(
      (j) => dayjs(datetime).get("hour") === dayjs(j.startAt).get("hour")
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 80,
          flexDirection: "row",
          borderBottomColor: Colors.gray_hidden_text,
          borderBottomWidth: 1,
        }}
      >
        <View style={{ width: 30 }} />
        {dates.map((d, idx) => (
          <View
            key={idx}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              marginVertical: 8,
              ...(dayjs().isSame(d, "date")
                ? {
                    borderColor: Colors.main_color,
                    borderWidth: 1.5,
                    borderRadius: 6,
                  }
                : {}),
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                ...(dayjs().isSame(d, "date")
                  ? { color: Colors.main_color }
                  : {}),
              }}
            >
              {d.format("ddd")}
            </Text>
            <Text
              style={{
                fontWeight: "600",
                ...(dayjs().isSame(d, "date")
                  ? { color: Colors.main_color }
                  : {}),
              }}
            >
              {d.format("D")}
            </Text>
          </View>
        ))}
      </View>
      <ScrollView>
        <View
          style={{
            flexDirection: "row",
          }}
        >
          {[-1, ...dates].map((d: number | dayjs.Dayjs, index: number) => (
            <View
              key={index}
              style={{
                ...(d != -1
                  ? {
                      flex: 1,
                      borderLeftColor: Colors.gray_hidden_text,
                      borderLeftWidth: 1,
                    }
                  : { width: 30 }),
              }}
            >
              {times.map((x, idx) => (
                <View
                  key={idx}
                  style={{
                    height: 60.0,
                    justifyContent: "center",
                    alignItems: "center",
                    ...(d != -1
                      ? {
                          borderBottomColor: Colors.gray_hidden_text,
                          borderBottomWidth: 1,
                        }
                      : {}),
                  }}
                >
                  {d == -1 ? (
                    <Text
                      style={{
                        fontSize: 11,
                        color: Colors.gray_normal_text,
                      }}
                    >
                      {x.format("hA")}
                    </Text>
                  ) : null}
                </View>
              ))}
              {d != -1 &&
                times.map((x) => {
                  const job = getJob(d as dayjs.Dayjs, x);

                  if (job != null) {
                    const startWork = dayjs().startOf("day").set("hours", 6);
                    return (
                      <View
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: job.endAt.diff(job.startAt, "hour") * 60,
                          marginTop: x.diff(startWork, "hours") * 60,
                          zIndex: 10,
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            margin: 4,
                            padding: 4,
                            backgroundColor: Colors.main_orange,
                            borderRadius: 3,
                          }}
                        >
                          <Text
                            style={{
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: "500",
                            }}
                          >
                            {job.title}
                          </Text>
                        </View>
                      </View>
                    );
                  }
                })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const MonthlyCalendar = (props: ScreenProps) => {
  const [calendar, setCalendar] = useState<ApiItem>([]);
  const [month, setMonth] = useState(props.month);

  const weeksOfMonth = () => {
    const startMonth = dayjs(month).clone().startOf("month");
    const startWeek = startMonth.clone().isoWeekday(1).startOf("day");
    const startOffset = startMonth.diff(startWeek, "days");

    const endMonth = dayjs(month).clone().endOf("month");
    const endWeek = endMonth.clone().isoWeekday(7).endOf("day");
    const endOffset = endWeek.diff(endMonth, "days");

    return Math.ceil(
      (endMonth.diff(startMonth, "days") + startOffset + endOffset) / 7
    );
  };

  const intCalendar = async () => {
    let item = [];
    for (
      let week = dayjs(month).startOf("month").week();
      week <= dayjs(month).startOf("month").week() + weeksOfMonth();
      week++
    ) {
      item.push({
        week: week,
        days: _.times(7).map((i) =>
          dayjs(month).week(week).startOf("week").clone().add(i, "day")
        ),
      });
    }
    return item;
  };
  useEffect(() => {
    async function getCalendar() {
      const calendar = await intCalendar();
      setCalendar(calendar);
    }
    getCalendar();
    props.onChangeMonth(month);
  }, [month]);

  if (isEmpty(calendar))
    return (
      <ActivityIndicator
        style={{ flex: 1, alignSelf: "center" }}
        color={Colors.grab_orange}
      />
    );

  const getJob = (date: dayjs.Dayjs) => {
    return _(props.items)
      .filter(
        (j) => dayjs(date).get("dates") === dayjs(j.startAt).get("dates")
      )
      .value();
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          paddingVertical: 4,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="chevron-back-outline"
          size={22}
          color={Colors.grab_orange}
          onPress={() =>
            setMonth((month: any) => dayjs(month).startOf('month').subtract(1, "month"))
          }
          style={{ padding: 12 }}
        />
        <Text
          style={{
            color: Colors.grab_orange,
            fontWeight: "500",
            fontSize: 16,
            marginHorizontal: "15%",
          }}
        >
          {dayjs(props.month).format("MMMM YYYY")}
        </Text>
        <Ionicons
          style={{ padding: 12 }}
          name="chevron-forward-outline"
          size={22}
          color={Colors.grab_orange}
          onPress={() => setMonth((month: any) => dayjs(month).startOf('month').add(1, "month"))}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row" }}>
          {calendar[0].days.map((d: dayjs.Dayjs, index: number) => (
            <View
              key={index}
              style={{
                flex: 1,
                alignItems: "center",
                marginVertical: 8,
              }}
            >
              <Text
                style={{
                  color: Colors.gray_normal_text,
                  fontSize: 12,
                  fontWeight: "500",
                }}
              >
                {d.format("dd").toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          {calendar.map((row: ApiItem) => (
            <View
              style={{
                flex: 1,
                flexDirection: "row",
              }}
            >
              {row.days.map((col: dayjs.Dayjs) => {
                const j = getJob(col as dayjs.Dayjs);
                return (
                  <View
                    style={{
                      flex: 1,
                      padding: 2,
                      ...(dayjs(col).month() === dayjs(props.month).month()
                        ? {}
                        : { opacity: 0 }),
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        paddingTop: 2,
                        ...(j.length > 0
                          ? {
                              backgroundColor: Colors.main_color,
                              borderRadius: 4,
                            }
                          : {}),
                      }}
                    >
                      <View style={{ alignItems: "center" }}>
                        <Text
                          style={{
                            color: j.length > 0 ? Colors.white : Colors.black,
                          }}
                        >
                          {col.format("DD")}
                        </Text>
                      </View>
                      <View style={{ flex: 1, paddingHorizontal: 4 }}>
                        {_(j)
                          .take(2)
                          .value()
                          .map((it) => (
                            <Text
                              style={{
                                fontSize: 9,
                                fontWeight: "500",
                                color: Colors.white,
                                textAlign: "center",
                              }}
                            >
                              {it.title}
                            </Text>
                          ))}
                        {j.length >= 3 && (
                          <Text
                            style={{
                              marginTop: -5,
                              fontSize: 9,
                              fontWeight: "500",
                              color: Colors.white,
                              textAlign: "center",
                            }}
                          >
                            ...
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default (props: ScreenProps) => {
  const navigation = props.navigation;
  const newItems = props.route.params?.items;
  const [month, setMonth] = useState<any>(Date.now());
  const [type, setType] = useState(1);

  const [listMonthly, setListMonthly] = useState<ApiItem>([]);
  const [listWeekly, setListWeekly] = useState<ApiItem>([]);

  const [requestListMonthlyTrigger, { isLoading: loadingListMonthly }] =
    apiSlice.endpoints.getBookings.useLazyQuery();
  const requestListMonthly = portRequest(
    requestListMonthlyTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      const items = _.map(response?.items, (item) => {
        return {
          title: item.serviceName,
          startAt: dayjs(item.bookingDate),
          endAt: dayjs(item.bookingDate).add(item.hour, "hour"),
        };
      });

      setListMonthly(_.concat(getMoreItems(), items));
    }
  );

  const [requestListWeeklyTrigger, { isLoading: loadingListWeekly }] =
    apiSlice.endpoints.getBookings.useLazyQuery();
  const requestListWeekly = portRequest(
    requestListWeeklyTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }

      const items = _.map(response?.items, (item) => {
        return {
          title: item.serviceName,
          startAt: dayjs(item.bookingDate),
          endAt: dayjs(item.bookingDate).add(item.hour, "hour"),
        };
      });

      setListWeekly(_.concat(getMoreItems(), items));
    }
  );

  const getMoreItems = () => {
    const moreItems: any = [];

    for (
      let m = dayjs().startOf("day");
      m.isBefore(dayjs().add(1, "month").endOf("week"));
      m = m.add(1, "days")
    ) {
      const newItem = _.find(newItems, { label: m.format("dddd") });

      if (!_.isNil(newItem)) {
        const startAt = m.clone().set("hour", newItem.startAt.hour());
        const endAt = startAt.clone().add(newItem.hour, "hour");

        moreItems.push({
          title: newItem.serviceName,
          startAt,
          endAt,
        });
      }
    }

    return moreItems;
  };

  useEffect(() => {
    requestListMonthly({
      params: paramArray([
        { orderStatus: Enum.OrderStatus.PENDING },
        { orderStatus: Enum.OrderStatus.MATCH },
        { orderStatus: Enum.OrderStatus.ON_PROCESS },
        { orderStatus: Enum.OrderStatus.RECEIVED },
        { statusDate: "MONTH" },
        { limit: 100 },
        { bookingMonth: dayjs().format("DD-MM-YYYY") },
      ]),
    });

    requestListWeekly({
      params: paramArray([
        { orderStatus: Enum.OrderStatus.PENDING },
        { orderStatus: Enum.OrderStatus.MATCH },
        { orderStatus: Enum.OrderStatus.ON_PROCESS },
        { orderStatus: Enum.OrderStatus.RECEIVED },
        { statusDate: "WEEK" },
        { limit: 100 },
      ]),
    });
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setType((t) => (t == 0 ? 1 : 0))}
          containerStyle={{
            marginEnd: 8,
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                marginRight: 8,
                color: Colors.white,
                fontSize: 16,
              }}
            >
              {type == 0 ? i18n.t("home.monthly") : i18n.t("home.weekly")}
            </Text>
            <Ionicons name="menu" size={24} color={Colors.white} />
          </View>
        </TouchableOpacity>
      ),
    });
  }, [navigation, type]);

  useEffect(() => {
    requestListMonthly({
      params: paramArray([
        { orderStatus: Enum.OrderStatus.PENDING },
        { orderStatus: Enum.OrderStatus.MATCH },
        { orderStatus: Enum.OrderStatus.ON_PROCESS },
        { orderStatus: Enum.OrderStatus.RECEIVED },
        { statusDate: "MONTH" },
        { limit: 100 },
        {
          bookingMonth: dayjs(month).format("DD-MM-YYYY"),
        },
      ]),
    });
  }, [month]);
  return (
    <Container>
      <Loading loading={loadingListMonthly || loadingListWeekly} />
      <View style={s.container}>
        {type == 0 ? (
          <WeeklyCalendar items={listWeekly} />
        ) : (
          <MonthlyCalendar
            onChangeMonth={setMonth}
            month={month}
            items={listMonthly}
          />
        )}
      </View>
    </Container>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
});
