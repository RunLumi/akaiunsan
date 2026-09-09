import React, { useEffect } from "react";
import { useAppSelector } from "../../../redux/hooks";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
} from "react-native";
import colors from "../../../shared/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Loading, PositionSelect, Text } from "../../../components";
import i18n from "../../../shared/I18n";

import Constants from "../../../shared/Constants";
import { apiSlice, portRequest, type ApiResult } from "../../../redux/apiSlice";
export default function Address(props: any) {
  const user = useAppSelector((state) => state.auth.user);

  const [listAddress, setListAddress] = React.useState<any[]>([]);
  const childRef = React.useRef<any>(null);

  const [currentAddress, setCurrentAddress] = React.useState(null);

  const [requestListAddressTrigger, { isLoading: loadingListAddress }] =
    apiSlice.endpoints.listAddress.useLazyQuery();
  const requestListAddress = portRequest(
    requestListAddressTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      }
      setListAddress(response && response.items);
    }
  );

  const handleValuePosition = () =>
    {
      setTimeout(() => {
        requestListAddress();
      }, 300);
    };

  const getValueAddress = (value: any) => {
    setCurrentAddress(value.id);
    props.handleAddress(value);
  };

  useEffect(() => {
    requestListAddress();

    if (props.currentAddressId) {
      setCurrentAddress(props.currentAddressId);
    }
  }, []);

  const renderItem = ({ item, index }: any) => (
    <TouchableOpacity
      onPress={() => getValueAddress(item)}
      disabled={props.nonEdit}
    >
      <View
        style={{
          ...styles.itemRender,
          backgroundColor:
            currentAddress == item.id
              ? colors.main_orange
              : props.nonEdit
              ? colors.gray_hidden_text
              : "white",
        }}
      >
        <TouchableOpacity
          disabled={props.nonEdit}
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            zIndex: 99,
          }}
          onPress={() => childRef.current.openModalPosition(item)}
        >
          <Ionicons
            style={{ alignSelf: "flex-end" }}
            name="open-outline"
            size={24}
            color={currentAddress == item.id ? colors.white : colors.black_text}
          />
        </TouchableOpacity>
        <View style={{ flexDirection: "column" }}>
          <View style={styles.rowItemRender}>
            <Ionicons
              name="person"
              size={24}
            color={currentAddress == item.id ? colors.white : colors.black_text}
            />
            <Text style={styles.textItemRender}>{user && user.fullName}</Text>
          </View>
          <View style={styles.rowItemRender}>
            <Ionicons
              name="phone-portrait-outline"
              size={24}
            color={currentAddress == item.id ? colors.white : colors.black_text}
            />
            <Text style={styles.textItemRender}>{item.phoneNumber}</Text>
          </View>
          <View style={styles.rowItemRender}>
            <Ionicons
              name="location-sharp"
              size={24}
            color={currentAddress == item.id ? colors.white : colors.black_text}
            />
            <Text style={styles.textItemRender}>{item.longAddress}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <Loading loading={loadingListAddress} />
      <SafeAreaView style={styles.container}>
        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            listAddress.length === 0 && {
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }
          }
          data={listAddress}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyDataAddress}>
              {i18n.t("auth.no_address")}
            </Text>
          }
        />
      </SafeAreaView>
      <TouchableOpacity
        onPress={() => childRef.current.openModalPosition()}
        style={styles.addAddress}
      >
        <Ionicons name="add-circle" size={30} color={colors.main_color} />
        <Text style={styles.textAddAddress}>
          {i18n.t("auth.add_new_address")}
        </Text>
      </TouchableOpacity>
      <PositionSelect
        children={childRef}
        valuePosition={handleValuePosition}
        navigation={props.navigation}
        type={props.type}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyDataAddress: {
    textAlign: "center",
    fontSize: 22,
    color: colors.gray_hidden_text,
    marginTop: 10,
  },
  addAddress: {
    borderTopWidth: 1,
    borderTopColor: colors.gray_hidden_text,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textAddAddress: {
    fontSize: 20,
    marginLeft: 10,
  },
  itemRender: {
    borderRadius: 15,
    // backgroundColor: colors.main_color,
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 5,
  },
  rowItemRender: {
    flexDirection: "row",
    marginVertical: 3,
  },
  textItemRender: {
    // color: "white",
    flex: 1,
    marginLeft: 10,
  },
});
