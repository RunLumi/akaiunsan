import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  FlatList,
  Platform,
  Modal,
} from "react-native";
import { useDispatch } from "react-redux";
import { Container, CustomInput, Loading, Text } from "../../components";
import Colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import Layout from "../../shared/Layout";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "../../shared/dayjs";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Rating } from "react-native-ratings";
import { useNavigation } from "@react-navigation/native";

import { TYPES } from "../../redux/actions";
import { apiSlice, portRequest, type ApiResult } from "../../redux/apiSlice";

export default function PromotionList(props: any) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [review, setReview] = useState({ label: "All", value: 9999 });
  const [serviceType, setServiceType] = useState<{
    label?: string;
    value?: number;
  }>({});
  const [date, setDate] = useState({ label: "", value: new Date() });
  const [showDate, setShowDate] = useState(false);
  const [callOnScrollEnd, setCallOnScrollEnd] = useState(false);
  const [page, setPage] = useState(2);
  const [arrHistory, setArrHistory] = useState<any[]>([]);
  const [requestListHistoryTrigger, { isLoading: loadingListHistory }] =
    apiSlice.endpoints.bookingGet.useLazyQuery();
  const requestListHistory = portRequest(
    requestListHistoryTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      } else {
        let data = [...arrHistory];
        if (response.items && response.items.length) {
          response.items.forEach((m: any) => {
            let item = data.find((n) => n.orderId === m.orderId);
            if (item) {
              return Object.assign(item, m);
            }
            data.push(m);
          });
        } else {
          // Alert.alert(i18n.t("auth.error"), i18n.t("home.data_empty"));
        }
        setArrHistory(data);
      }
    }
  );

  const [requestListHistoryFillterTrigger, { isLoading: loadingListHistoryFillter }] =
    apiSlice.endpoints.bookingGet.useLazyQuery();
  const requestListHistoryFillter = portRequest(
    requestListHistoryFillterTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      } else {
        let data: any = [];
        if (response.items && response.items.length) {
          response.items.forEach((m: any) => {
            let item = data.find((n: any) => n.orderId === m.orderId);
            if (item) {
              return Object.assign(item, m);
            }
            data.push(m);
          });
        } else {
          data = [];
        }
        setArrHistory(data);
      }
    }
  );

  const ENUM_REVIEW = [
    { label: "1", value: 1 },
    { label: "2", value: 2 },
    { label: "3", value: 3 },
    { label: "4", value: 4 },
    { label: "5", value: 5 },
    { label: i18n.t("Not_yet"), value: 0 },
    { label: i18n.t("All"), value: 9999 },
  ];

  const onChooseReview = () => {
    dispatch({
      type: TYPES.TOOLS.OPEN_PICKER,
      payload: {
        data: ENUM_REVIEW,
        selected: review.value,
        callback: (selected: number) => {
          const newReview = () =>
            ENUM_REVIEW.reduce((pre, cur) => {
              if (cur?.value === selected) {
                if (date.label) {
                  requestListHistoryFillter({
                    params: {
                      page: 1,
                      bookingDate: date.label,
                      star: cur.value,
                      serviceType: serviceType.value || 0,
                    },
                  });
                } else {
                  requestListHistoryFillter({
                    params: {
                      page: 1,
                      star: cur.value,
                      serviceType: serviceType.value || 0,
                    },
                  });
                }
                return cur;
              } else return pre;
            }, {});
          // newReview is passed as an updater function on purpose (legacy
          // behavior — React invokes it with the previous state).
          setReview(newReview as any);
        },
      },
    });
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setReview({ label: "All", value: 9999 });
      setServiceType({});
      setDate({ label: "", value: new Date() });
      requestListHistory();
    });
    return unsubscribe;
  }, [navigation]);

  const enumService = [
    { label: i18n.t("MaidService"), value: 1 },
    { label: i18n.t("NanyService"), value: 2 },
    { label: i18n.t("ElderService"), value: 3 },
    { label: i18n.t("CleaningService"), value: 4 },
    { label: i18n.t("PetcareService"), value: 5 },
  ];

  const onChooseServiceType = () => {
    dispatch({
      type: TYPES.TOOLS.OPEN_PICKER,
      payload: {
        data: enumService,
        selected: serviceType.value,
        callback: (selected: number) => {
          const newServiceType = () =>
            enumService.reduce((pre, cur) => {
              if (cur?.value === selected) {
                if (date.label) {
                  requestListHistoryFillter({
                    params: {
                      page: 1,
                      bookingDate: date.label,
                      star: review.value,
                      serviceType: cur.value || 0,
                    },
                  });
                } else {
                  requestListHistoryFillter({
                    params: {
                      page: 1,
                      star: review.value,
                      serviceType: cur.value || 0,
                    },
                  });
                }
                return cur;
              } else return pre;
            }, {});
          setServiceType(newServiceType);
        },
      },
    });
  };

  const onDeleteServiceType = () => {
    setServiceType({ label: "", value: 0 });
    if (date.label) {
      requestListHistoryFillter({
        params: {
          page: 1,
          bookingDate: date.label,
          star: review.value,
          serviceType: 0,
        },
      });
    } else {
      requestListHistoryFillter({
        params: {
          page: 1,
          star: review.value,
          serviceType: 0,
        },
      });
    }
  };

  const onChooseDate = () => {
    setShowDate(true);
  };

  const handleValueDate = (event: any, selectedDate: any) => {
    if (Platform.OS === "android") {
      if (event.type === "set") {
        setShowDate(false);
        let currentDay = dayjs(selectedDate).format("YYYY-MM-DD");
        if (serviceType.value) {
          requestListHistoryFillter({
            params: {
              page: 1,
              bookingDate: currentDay,
              star: review.value,
              serviceType: serviceType.value,
            },
          });
        } else {
          requestListHistoryFillter({
            params: {
              page: 1,
              bookingDate: currentDay,
              star: review.value,
            },
          });
        }
        setDate({ label: currentDay, value: selectedDate });
      } else {
        setShowDate(false);
      }
    } else {
      setShowDate(false);
      let currentDay = dayjs(selectedDate).toISOString();
      if (serviceType.value) {
        requestListHistoryFillter({
          params: {
            page: 1,
            bookingDate: currentDay,
            star: review.value,
            serviceType: serviceType.value,
          },
        });
      } else {
        requestListHistoryFillter({
          params: {
            page: 1,
            bookingDate: currentDay,
            star: review.value,
          },
        });
      }
      setDate({ label: currentDay, value: selectedDate });
    }
  };

  const onDeleteDate = () => {
    setDate({ ...date, label: "" });
    requestListHistoryFillter({
      params: {
        page: 1,
        star: review.value,
        serviceType: serviceType.value || 0,
      },
    });
  };

  const renderItem = (item: any, idx: any) => {
    return (
      <TouchableOpacity
        key={idx}
        style={s.jobItem}
        onPress={() =>
          (navigation.navigate as any)(
            Constants.SCREENS.HISTORY.DETAIL,
            { item }
          )
        }
      >
        <View style={s.jobItemHeader}>
          <Text style={[s.jobItemHeaderTitle, { fontWeight: "bold" }]}>
            {item.serviceName}
          </Text>
          <Rating
            style={{ paddingVertical: 10 }}
            ratingCount={5}
            jumpValue={1}
            imageSize={15}
            startingValue={item.star}
            readonly
          />
        </View>
        <View style={s.jobItemHeader}>
          <View style={{ flex: 1 }}>
            <View style={s.jobItemMeta}>
              <Ionicons
                name="calendar"
                style={{
                  marginRight: 6,
                  ...s.jobItemMetaSp,
                }}
              />
              <Text style={s.jobItemMetaSp}>
                {dayjs(item.bookingDate).local().format("lll")}
              </Text>
            </View>
            <View style={{ ...s.jobItemMeta }}>
              <Ionicons
                name="location"
                style={{
                  marginRight: 6,
                  ...s.jobItemMetaSp,
                }}
              />
              <Text style={s.jobItemMetaSp}>{item.address}</Text>
            </View>
            <View style={{ ...s.jobItemMeta, marginBottom: 0 }}>
              <Ionicons
                name="person"
                style={{
                  marginRight: 6,
                  ...s.jobItemMetaSp,
                }}
              />
              <Text style={s.jobItemMetaSp}>{item.serviceProviderName}</Text>
            </View>
          </View>
          <Image
            source={
              item.serviceProviderAvatar
                ? { uri: item.serviceProviderAvatar }
                : require("../../assets/images/icon.png")
            }
            style={{ width: 70, height: 70, borderRadius: 35 }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const onLoadMore = () => {
    if (date.label) {
      requestListHistory({
        params: {
          page: page,
          bookingDate: date.label,
          star: review.value,
          serviceType: serviceType.value || 0,
        },
      });
    } else {
      requestListHistory({
        params: {
          page: page,
          star: review.value,
          serviceType: serviceType.value || 0,
        },
      });
    }
    setPage(page + 1);
  };

  return (
    <Container style={{ backgroundColor: Colors.white }}>
      <Loading loading={loadingListHistory} />
      <View style={{ flex: 1 }}>
        <View style={s.borderBottom}>
          <Text style={s.textTitle}>{i18n.t("home.history")}</Text>
        </View>
        <View style={{ marginHorizontal: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginVertical: 6,
            }}
          >
            <Text style={{ width: "30%", fontSize: 14, alignSelf: "center" }}>
              {i18n.t("home.review")}:
            </Text>
            <CustomInput
              containerStyle={{ width: "70%" }}
              value={review.label}
              onChangeText={() => setReview}
              onDropDown={onChooseReview}
              editable={false}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginVertical: 6,
            }}
          >
            <Text style={{ width: "30%", fontSize: 14, alignSelf: "center" }}>
              {i18n.t("home.booking_date")}:
            </Text>
            {date.label ? (
              <CustomInput
                containerStyle={{ width: "70%" }}
                value={date.label}
                onDateTime={onChooseDate}
                onCancel={onDeleteDate}
                editable={false}
              />
            ) : (
              <CustomInput
                containerStyle={{ width: "70%" }}
                value={date.label}
                onDateTime={onChooseDate}
                editable={false}
              />
            )}
            {showDate && Platform.OS === "android" && (
              <DateTimePicker
                style={{ borderRightColor: Colors.red }}
                value={date.value}
                mode="date"
                display="spinner"
                onChange={handleValueDate}
              />
            )}
          </View>
          {showDate && Platform.OS === "ios" && (
            <Modal animationType="fade" transparent visible={showDate}>
              <View style={s.centeredView}>
                <TouchableOpacity
                  style={s.closePopup}
                  onPress={() => {
                    setShowDate(false);
                  }}
                />
                <View style={s.modalViewInput}>
                  <DateTimePicker
                    value={date.value}
                    mode="date"
                    display="spinner"
                    onChange={handleValueDate}
                  />
                </View>
                <TouchableOpacity
                  style={s.closePopup}
                  onPress={() => {
                    setShowDate(false);
                  }}
                />
              </View>
            </Modal>
          )}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginVertical: 6,
            }}
          >
            <Text style={{ width: "30%", fontSize: 14, alignSelf: "center" }}>
              {i18n.t("home.service_name")}:
            </Text>
            {serviceType.value ? (
              <CustomInput
                containerStyle={{ width: "70%" }}
                value={serviceType.label}
                onChangeText={() => setServiceType}
                onDropDown={onChooseServiceType}
                onCancel={onDeleteServiceType}
                editable={false}
              />
            ) : (
              <CustomInput
                containerStyle={{ width: "70%" }}
                value={serviceType.label}
                onChangeText={() => setServiceType}
                onDropDown={onChooseServiceType}
                editable={false}
              />
            )}
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <FlatList
            data={arrHistory}
            extraData={arrHistory}
            renderItem={({ item, index, separators }) =>
              renderItem(item, index)
            }
            contentContainerStyle={
              arrHistory.length === 0 && {
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }
            }
            keyExtractor={(item, index) => index.toString()}
            onEndReachedThreshold={0.5}
            onMomentumScrollEnd={() => {
              callOnScrollEnd && onLoadMore();
              setCallOnScrollEnd(false);
            }}
            onEndReached={() => setCallOnScrollEnd(true)}
            ListEmptyComponent={
              <Text style={{ fontSize: 16, marginHorizontal: 10 }}>
                {i18n.t("home.data_empty")}
              </Text>
            }
          />
        </View>
      </View>
    </Container>
  );
}

const s = StyleSheet.create({
  textTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginVertical: 12,
  },
  textTitleItem: {
    fontSize: 15,
    fontWeight: "bold",
    overflow: "hidden",
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray_hidden_text,
  },
  jobItem: {
    marginVertical: 8,
    marginHorizontal: 16,
    // marginBottom: 0,
    padding: 14,
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    borderRadius: 6,
    elevation: 3,
  },
  jobItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  jobItemHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  jobItemHeaderStatus: {},
  jobItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  jobItemMetaSp: {
    color: Colors.gray_normal_text,
  },
  modalViewInput: {
    width: Layout.window.width - 40,
    backgroundColor: Colors.white,
    borderRadius: 10,
  },
  inputButton: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: 10,
    paddingBottom: 10,
  },
  closePopup: {
    width: "100%",
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${Colors.main_blue}B3`,
  },
});
