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
import Layout from "../../shared/Layout";
import { Fontisto, AntDesign } from "@expo/vector-icons";
import { apiSlice, portRequest, type ApiResult } from "../../redux/apiSlice";
import type { ApiItem } from "../../redux/apiSlice";
import type { ScreenProps } from "../../navigation/routes";

export default function PromotionList(props: ScreenProps) {
  const [refresh, setRefresh] = useState(false);
  const [page, setPage] = useState(2);
  const [arrPromotion, setArrPromotion] = useState<ApiItem[]>([]);
  const [requestListPromotionUsedTrigger, { isLoading: loadingListPromotionUsed }] =
    apiSlice.endpoints.promotionUsed.useLazyQuery();
  const requestListPromotionUsed = portRequest(
    requestListPromotionUsedTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        return;
      }
      setRefresh(false);
      if (response.page === 1) {
        setPage(2);
        let getPromotionId = response.items.map((x: ApiItem, index: number) => {
          return { ...x, promotionId: x.id };
        });
        setArrPromotion(getPromotionId);
      } else {
        let data = [...arrPromotion];
        if (response.items && response.items.length) {
          response.items.forEach((m: ApiItem) => {
            let item = data.find((n) => n.id === m.id);
            if (item) {
              return Object.assign(item, m);
            }
            data.push(m);
          });
        }
        let getPromotionId = data.map((x: any, idx) => {
          return { ...x, promotionId: x.id };
        });
        setArrPromotion(getPromotionId);
      }
    }
  );

  const renderItem = (item: ApiItem, index: number) => (
    <View key={index}>
      <TouchableOpacity
        onPress={() =>
          props.navigation.navigate(Constants.SCREENS.PROMOTIOM.DETAIL, {
            data: item,
          })
        }
      >
        <View style={s.itemArr}>
          {/* {isDelete && (
            <CheckBox
              style={{ alignItems: "flex-start" }}
              center
              checked={valuePromoDelete[idx]}
              onPress={() => selectDeletePromo(!valuePromoDelete[idx], idx)}
              checkedColor={COLOR.main_color}
            />
          )} */}
          <View style={s.radiusIcon}>
            <AntDesign
              style={s.iconBell}
              name="notification"
              size={24}
              color={Colors.white}
            />
          </View>
          <View style={{ flexDirection: "column" }}>
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={[
                s.textTitleItem,
                {
                  width: Layout.window.width - 100,
                },
              ]}
            >
              {item.promotion && item.promotion.name}
            </Text>
            <Text style={s.textDescription}>
              {item.promotion && item.promotion.description}
            </Text>
            <Text style={s.textDescription}>Using time: {item.usingTimes}</Text>
          </View>
          <View style={{ paddingTop: 15 }}>
            <Fontisto name="angle-right" size={20} color={Colors.black_text} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const onLoadMore = () => {
    requestListPromotionUsed({
      params: {
        page,
      },
    });
    setPage(page + 1);
  };
  const onRefresh = () => {
    setRefresh(true);
    requestListPromotionUsed();
  };

  useEffect(() => {
    requestListPromotionUsed();
  }, []);

  return (
    <Container style={{ backgroundColor: Colors.white, flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Loading loading={loadingListPromotionUsed} />
        <View style={s.borderBottom}>
          <Text style={s.textTitle}>{i18n.t("home.promotion")}</Text>
        </View>
        <View style={{ maxHeight: Layout.window.height - 120 }}>
          <FlatList
            contentContainerStyle={
              arrPromotion.length === 0 && {
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }
            }
            data={arrPromotion}
            renderItem={({ item, index, separators }) =>
              renderItem(item, index)
            }
            onEndReachedThreshold={0.1}
            refreshing={refresh}
            onRefresh={onRefresh}
            onEndReached={onLoadMore}
            ListEmptyComponent={
              <Text style={{ fontSize: 16, marginHorizontal: 10 }}>
                {i18n.t("home.promotion_empty")}
              </Text>
            }
          />
        </View>
      </View>
    </Container>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 5,
  },
  textTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginVertical: 10,
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
  textWeight: {
    fontWeight: "bold",
  },
  itemArr: {
    flexDirection: "row",
    marginVertical: 5,
    borderBottomColor: Colors.gray_hidden_text,
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  iconBell: {
    paddingTop: 7,
  },
  radiusIcon: {
    backgroundColor: Colors.yellow,
    alignItems: "center",
    margin: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 40,
    width: 40,
  },
  textDescription: {
    fontSize: 15,
  },
});
