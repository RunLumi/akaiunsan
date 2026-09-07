import { Ionicons } from "@expo/vector-icons";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
} from "react-native";
import { Container, Loading, AddCardPayment, Text } from "../../components";
import useApi from "../../hooks/useApi";
import Colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import { FontAwesome } from "@expo/vector-icons";

export default function PaymentList(props: any) {
  const childRef = React.useRef<any>(null);
  const [listPayment, setListPayment] = useState<any[]>([]);
  const [idDefaultCard, setIdDefaultCard] = useState("");

  const [loadingListCard, requestListCard] = useApi({
    method: "get",
    url: Constants.API.payment_card_list,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      if (
        response.customer &&
        response.customer.cards &&
        response.customer.cards.data.length
      ) {
        setListPayment(response.customer.cards.data);
      }
      setIdDefaultCard(response.customer && response.customer.default_card);
    },
  });

  const [loadingDeleteCard, requestDeleteCard] = useApi({
    method: "delete",
    url: Constants.API.payment_card_delete,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      requestListCard();
    },
  });

  const [loadingCardDefault, requestCardDefault] = useApi({
    method: "put",
    url: Constants.API.payment_card_default,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      requestListCard();
    },
  });

  const deleteCard = (item: any) => {
    Alert.alert(
      "",
      i18n.t("home.confirm_delete_card"),
      [
        {
          text: i18n.t("home.no"),
          onPress: () => console.log("Cancel Pressed"),
        },
        {
          text: i18n.t("home.yes"),
          onPress: () =>
            requestDeleteCard({
              data: {
                cardId: item.id,
              },
            }),
        },
      ],
      { cancelable: false }
    );
  };

  const onPressIsDefaultCard = (item: any) => {
    requestCardDefault({
      data: {
        cardId: item.id,
      },
    });
  };

  const handleAddCard = (value: any) => {
    if (value) {
      requestListCard();
    }
  };

  useEffect(() => {
    requestListCard();
  }, []);

  return (
    <Container>
      <Loading
        loading={loadingListCard || loadingDeleteCard || loadingCardDefault}
      />
      <View style={s.pageView}>
        <View style={s.borderBottom}>
          <Text style={s.textTitle}>{i18n.t("home.payment")}</Text>
          <Text
            onPress={() => childRef.current.openModalAddCard()}
            style={s.borderAdd}
          >
            {i18n.t("home.add")}
          </Text>
        </View>
        <FlatList
          data={listPayment}
          contentContainerStyle={
            listPayment.length === 0 && {
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
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index, separators }) => (
            <View key={index} style={s.jobItem}>
              <Ionicons
                name="trash"
                color={Colors.main_color}
                size={18}
                style={{
                  textAlign: "right",
                }}
                onPress={() => deleteCard(item)}
              />
              <View style={s.jobItemHeader}>
                <Text style={s.jobItemHeaderTitle}>Card number</Text>
                <Text style={s.jobItemHeaderValue}>
                  {"************" + item.last_digits}
                </Text>
              </View>
              <View style={s.jobItemHeader}>
                <Text style={s.jobItemHeaderTitle}>Name</Text>
                <Text style={s.jobItemHeaderValue}>{item.name}</Text>
              </View>
              <View style={s.jobItemHeader}>
                <Text style={s.jobItemHeaderTitle}>Exp</Text>
                <Text style={s.jobItemHeaderValue}>
                  {item.expiration_month + "/" + item.expiration_year}
                </Text>
              </View>
              <TouchableOpacity onPress={() => onPressIsDefaultCard(item)}>
                <View style={s.row}>
                  <FontAwesome
                    size={20}
                    style={{}}
                    name={
                      item.id === idDefaultCard ? "dot-circle-o" : "circle-o"
                    }
                    color={Colors.main_color}
                  />
                  <Text style={{ color: Colors.main_color, marginLeft: 10 }}>
                    {i18n.t("home.default")}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        />
        <AddCardPayment
          children={childRef}
          addSuccess={handleAddCard}
          navigation={props.navigation}
        />
      </View>
    </Container>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: "100%",
    backgroundColor: Colors.main_color,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  textClose: {
    color: Colors.white,
    fontSize: 20,
    marginLeft: 10,
  },
  textTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginVertical: 10,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray_hidden_text,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  borderAdd: {
    borderColor: Colors.main_color,
    borderWidth: 1,
    color: Colors.main_color,
    paddingHorizontal: 20,
    paddingTop: 6,
    marginTop: 12,
    marginBottom: 5,
    marginRight: 12,
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
    backgroundColor: "#ffffff",
    flexDirection: "row",
    height: 46,
    shadowColor: Colors.black,
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
    padding: 7,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    borderRadius: 6,
    borderColor: Colors.main_color,
    borderWidth: 1,
  },
  jobItemHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  jobItemHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    width: "35%",
    color: Colors.main_color,
  },
  jobItemHeaderValue: {
    width: "65%",
    fontSize: 16,
    fontWeight: "600",
    color: Colors.main_color,
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
  borderDefault: {
    borderWidth: 1,
    borderColor: Colors.main_color,
    borderRadius: 10,
    width: 55,
    padding: 5,
    fontStyle: "italic",
    color: Colors.main_color,
  },
});
