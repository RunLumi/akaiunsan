import React from "react";
import { useAppSelector } from "../redux/hooks";
import {
  StyleSheet,
  ViewStyle,
  View,
  TouchableOpacity,
  StyleProp,
  Alert,
  ScrollView,
} from "react-native";

import { Overlay } from "react-native-elements";
import colors from "../shared/Colors";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Button, Text } from ".";
import { AddCardPayment } from "./AddCardPayment";
import i18n from "../shared/I18n";
import Constants from "../shared/Constants";
import _ from "lodash";
import Layout from "../shared/Layout";
import { apiSlice, portRequest, type ApiResult } from "../redux/apiSlice";
import type { ApiItem } from "../redux/apiSlice";
interface Props {
  style?: StyleProp<ViewStyle>;
  children?: React.Ref<unknown>;
  handleIdCard?: (id: string) => void;
  navigation?: ApiItem;
}

export const ListCardPayment = ({
  style,
  children,
  handleIdCard,
  navigation,
}: Props) => {
  const childRef = React.useRef<any>(null);
  const [modalListCard, setModalListCard] = React.useState(false);
  const [listPayment, setListPayment] = React.useState([]);
  const [idDefaultCard, setIdDefaultCard] = React.useState("");
  const [idSelectCard, setIdSelectCard] = React.useState("");
  const user = useAppSelector((state) => state.auth.user);
  React.useImperativeHandle(children, () => ({
    openModalListCard() {
      setModalListCard(true);
    },
  }));

  const [requestListCardTrigger, { isLoading: loadingListCard }] =
    apiSlice.endpoints.getPaymentCards.useLazyQuery();
  const requestListCard = portRequest(
    requestListCardTrigger,
    ({ error, response }: ApiResult) => {
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
      setIdSelectCard(response.customer && response.customer.default_card);
    }
  );

  const [requestCardDefaultTrigger, { isLoading: loadingCardDefault }] =
    apiSlice.endpoints.setDefaultPaymentCard.useMutation();
  const requestCardDefault = portRequest(
    requestCardDefaultTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      requestListCard();
    }
  );

  const onPressClose = () => {
    setModalListCard(false);
  };

  const onPressIsDefaultCard = (item: ApiItem) => {
    requestCardDefault({
      data: {
        cardId: item.id,
      },
    });
  };

  const handleAddCard = (added: boolean) => {
    if (added) {
      requestListCard();
    }
  };

  const onSelectCard = () => {
    handleIdCard?.(idSelectCard);
    onPressClose();
  };

  React.useEffect(() => {
    requestListCard();
  }, []);

  return (
    <Overlay
      animationType="fade"
      isVisible={modalListCard}
      onBackdropPress={onPressClose}
    >
      <View>
        <ScrollView
          style={{
            maxHeight: Layout.window.height / 2,
            width: Layout.window.width - 100,
          }}
        >
          {listPayment.length ? (
            <>
              {listPayment.map((item: any, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={s.jobItem}
                  onPress={() => setIdSelectCard(item.id)}
                >
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

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <TouchableOpacity
                      disabled={true}
                      onPress={() => onPressIsDefaultCard(item)}
                    >
                      <View style={s.row}>
                        <FontAwesome
                          size={20}
                          style={{}}
                          name={
                            item.id === idDefaultCard
                              ? "dot-circle-o"
                              : "circle-o"
                          }
                          color={colors.main_color}
                        />
                        <Text
                          style={{ color: colors.main_color, marginLeft: 10 }}
                        >
                          {i18n.t("home.default")}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {idSelectCard === item.id ? (
                      <View style={s.row}>
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={colors.green}
                        />
                        <Text style={{ color: colors.green, marginLeft: 3 }}>
                          {i18n.t("home.selected")}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <Text style={s.textEmpty}>{i18n.t("home.card_empty")}</Text>
          )}
          <TouchableOpacity
            onPress={() => childRef.current.openModalAddCard()}
            style={s.addAddress}
          >
            <Ionicons name="add-circle" size={30} color={colors.main_color} />
            <Text style={s.textAddAddress}>{i18n.t("home.add_new_card")}</Text>
          </TouchableOpacity>
        </ScrollView>
        <Button
          disabled={!idSelectCard}
          onPress={onSelectCard}
          style={{ alignSelf: "center", width: 100 }}
          title={i18n.t("home.payment")}
        />
        <AddCardPayment children={childRef} addSuccess={handleAddCard as (added: boolean) => void} />
      </View>
    </Overlay>
  );
};

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  textEmpty: {
    textAlign: "center",
    fontSize: 25,
    paddingVertical: 10,
  },
  addAddress: {
    borderTopWidth: 1,
    borderTopColor: colors.gray_normal_text,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray_normal_text,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 10,
    marginTop: 20,
  },
  textAddAddress: {
    fontSize: 20,
  },
  jobItem: {
    margin: 16,
    marginBottom: 0,
    padding: 7,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    borderRadius: 6,
    borderColor: colors.main_color,
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
    color: colors.main_color,
  },
  jobItemHeaderValue: {
    width: "65%",
    fontSize: 16,
    fontWeight: "600",
    color: colors.main_color,
  },
  jobItemHeaderStatus: {},
  jobItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  jobItemMetaSp: {
    color: colors.gray_normal_text,
  },
});
