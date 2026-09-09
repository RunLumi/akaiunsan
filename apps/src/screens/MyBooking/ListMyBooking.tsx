import { Ionicons } from "@expo/vector-icons";
import dayjs from "../../shared/dayjs";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
} from "react-native";
import { Container, Loading, Text } from "../../components";
import Colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import { getStatus, paramArray } from "../../shared/Utils";
import { apiSlice, portRequest, type ApiResult } from "../../redux/apiSlice";

export default function ListMyBooking(props: any) {
  const [listBooking, setListBooking] = useState<any[]>([]);
  const [pageListBooking, setPageListBooking] = useState(1);

  const [requestListBookingTrigger, { isLoading: loadingListBooking }] =
    apiSlice.endpoints.getBookings.useLazyQuery();
  const requestListBooking = portRequest(
    requestListBookingTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      if (!_.isNull(response)) {
        if (response.items.length) {
          setListBooking((old) => old.concat(response.items));
        }

        setPageListBooking(response.page);
      }
    }
  );

  const onPressBookingDetail = (item: any) => {
    props.navigation.navigate(Constants.SCREENS.MYBOOKING.DETAIL_MYBOOKING, {
      item,
    });
  };

  useEffect(() => {
    requestListBooking({
      params: paramArray([
        // { orderStatus: Enum.OrderStatus.PENDING },
        // { orderStatus: Enum.OrderStatus.COMPLETED },
        // { orderStatus: Enum.OrderStatus.CANCEL },
        // { orderStatus: Enum.OrderStatus.ON_PROCESS },
        // { orderStatus: Enum.OrderStatus.WAITING_CONFIRM },
        // { isMyBooking: true },
      ]),
    });
  }, []);

  const onLoadBooking = (page: number) => {
    requestListBooking({
      params: paramArray([
        // { orderStatus: Enum.OrderStatus.PENDING },
        // { orderStatus: Enum.OrderStatus.COMPLETED },
        // { orderStatus: Enum.OrderStatus.CANCEL },
        // { orderStatus: Enum.OrderStatus.ON_PROCESS },
        // { orderStatus: Enum.OrderStatus.WAITING_CONFIRM },
        { page },
        // { isMyBooking: true },
      ]),
    });
  };

  return (
    <Container>
      <Loading loading={loadingListBooking} />
      <View style={s.pageView}>
        <FlatList
          data={listBooking}
          contentContainerStyle={
            listBooking.length === 0 && {
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }
          }
          ListEmptyComponent={
            <Text style={{ fontSize: 16, marginHorizontal: 10 }}>
              {i18n.t("home.data_empty")}
            </Text>
          }
          keyExtractor={(item: any) => item.orderId}
          onEndReachedThreshold={0.5}
          onEndReached={() => onLoadBooking(pageListBooking + 1)}
          scrollEnabled={true}
          refreshing={false}
          onRefresh={() => {
            setListBooking([]);
            onLoadBooking(1);
          }}
          renderItem={({ item, index, separators }) => (
            <TouchableOpacity
              key={index}
              style={s.jobItem}
              onPress={() => onPressBookingDetail(item)}
            >
              <View style={s.jobItemHeader}>
                <Text style={s.jobItemHeaderTitle}>{item.serviceName}</Text>
                <Text
                  style={{
                    ...s.jobItemHeaderStatus,
                    color: Colors.main_orange,
                  }}
                >
                  {getStatus(item.orderStatus)}
                </Text>
              </View>
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
              <View style={{ ...s.jobItemMeta, marginBottom: 0 }}>
                <Ionicons
                  name="location"
                  style={{
                    marginRight: 6,
                    ...s.jobItemMetaSp,
                  }}
                />
                <Text style={s.jobItemMetaSp}>{item.address}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </Container>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    height: 65,
    paddingTop: 30,
    paddingHorizontal: 10,
    backgroundColor: Colors.main_color,
    zIndex: 10,
  },
  textTitleHeader: {
    color: Colors.white,
    fontSize: 20,
  },
  bottomAppBar: {
    backgroundColor: Colors.white,
    flexDirection: "row",
    height: 46,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
  },
  bottomAppBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderBottomColor: "transparent",
    borderBottomWidth: 2,
    paddingTop: 2,
  },
  bottomAppBarItemActive: {
    borderBottomColor: Colors.main_orange,
  },
  bottomAppBarItemLabel: {
    color: Colors.gray_normal_text,
  },
  bottomAppBarItemLabelActive: {
    color: Colors.main_orange,
  },
  pageView: {
    flex: 1,
  },
  jobItem: {
    margin: 16,
    marginBottom: 0,
    padding: 14,
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    borderRadius: 6,
  },
  jobItemHeader: {
    flexDirection: "row",
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
});
