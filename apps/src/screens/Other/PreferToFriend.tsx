import React, { useState, useEffect } from "react";
import { useAppSelector } from "../../redux/hooks";
import {
  StyleSheet,
  View,
  SafeAreaView,
  FlatList,
  Alert,
} from "react-native";
import Clipboard from '@react-native-clipboard/clipboard';
import { Container, Loading, Text } from "../../components";
import colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import { apiSlice, portRequest, type ApiResult } from "../../redux/apiSlice";

export default function PreferToFriend() {
  const [dataPrefer, setDataPrefer] = useState<any>([]);
  const [referrenCode, setReferrenCode] = useState("");
  const [totalFriend, setTotalFriend] = useState(0);
  const [page, setPage] = useState(2);
  const [requestReferralListTrigger, { isLoading: loadingReferralList }] =
    apiSlice.endpoints.referralList.useLazyQuery();
  const requestReferralList = portRequest(
    requestReferralListTrigger,
    ({ error, response }: ApiResult) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        let data = [...dataPrefer, ...response.items].filter(
          (v, i, a) => a.findIndex((t) => t.userId === v.userId) === i
        );
        setDataPrefer(data);
        setTotalFriend(response.total);
      }
    }
  );

  const user = useAppSelector((state) => state.auth.user);
  const renderItem = (item: any, idx: any) => (
    <View key={idx} style={styles.borderBottom1}>
      <View style={{ marginHorizontal: 20, marginVertical: 10 }}>
        <Text>Name: {item.name}</Text>
        <Text>Gift point: {item.giftPoint}</Text>
      </View>
    </View>
  );
  const onLoadMore = () => {
    requestReferralList({
      params: {
        page: page,
      },
    });
    setPage(page + 1);
  };
  const copyToClipboard = () => {
    Clipboard.setString(user && user.referralCode);
    Alert.alert(i18n.t("home.success"), i18n.t("home.copy_success"));
  };
  const onRefreshReferralList = () => {
    // setDataPrefer([]);
    // setTotalFriend(0);
    requestReferralList();
  };
  useEffect(() => {
    setReferrenCode(user && user.referralCode);
    requestReferralList();
  }, []);
  return (
    <Container style={styles.container}>
      <Loading loading={loadingReferralList} />
      <View style={{ flex: 1 }}>
        <View>
          <View style={styles.borderBottom2}>
            <Text style={styles.textTitle}>
              {i18n.t("home.prefer_to_friend")}
            </Text>
          </View>
          <View style={styles.borderBottom1}>
            <View style={{ flexDirection: "row" }}>
              <Text style={styles.textRef}>
                {i18n.t("auth.ref_code")}: {referrenCode}
              </Text>
              <Text style={styles.textCopy} onPress={copyToClipboard}>
                {i18n.t("home.copy")}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginHorizontal: 20,
                marginBottom: 5,
              }}
            >
              <Text>{i18n.t("home.list_friends")}</Text>
              <Text>
                {i18n.t("home.total")}: {totalFriend}
              </Text>
            </View>
          </View>
        </View>
        <SafeAreaView style={{ flex: 1 }}>
          <FlatList
            contentContainerStyle={
              dataPrefer.length === 0 && {
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }
            }
            data={dataPrefer}
            onEndReachedThreshold={0.1}
            onEndReached={onLoadMore}
            keyExtractor={(item: any) => item.userId}
            renderItem={({ item, index, separators }) =>
              renderItem(item, index)
            }
            ListEmptyComponent={
              <Text
                style={{
                  fontSize: 15,
                  marginHorizontal: 10,
                  textAlign: "center",
                }}
              >
                {i18n.t("home.data_empty")}
              </Text>
            }
            refreshing={loadingReferralList}
            onRefresh={onRefreshReferralList}
          />
        </SafeAreaView>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginVertical: 10,
  },
  textRef: {
    fontSize: 18,
    marginHorizontal: 20,
    marginVertical: 15,
  },
  textCopy: {
    fontSize: 15,
    marginHorizontal: 10,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: colors.gray_hidden_text,
    paddingHorizontal: 10,
    borderRadius: 10,
    color: colors.main_color,
    // backgroundColor:"white",
  },
  borderBottom1: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray_hidden_text,
  },
  borderBottom2: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray_hidden_text,
  },
});
