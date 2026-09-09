import React, {useCallback} from "react";
import {
  Modal,
  View,
  Platform,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { Divider } from "react-native-elements";
import Colors from "../../../../shared/Colors";
import Theme from "../../../../shared/theme";
import { Text } from "../../../../components";
import _ from "lodash";
import dayjs from "../../../../shared/dayjs";
import type { ScreenProps } from "../../../../navigation/routes";
export const SelectTimeModal = (props: ScreenProps) => {
  const { isShow, pickDate } = props;
  const IsSameDate = dayjs(pickDate).isSame(dayjs().add(1, "day"), "date");
  
  const getRangeHour = useCallback(
    () => {
      if (IsSameDate) {
        return (dayjs().get("hour") + 18) % 24;
      }
      return 7;
    },
    [pickDate],
  );
  const data = _.range(getRangeHour(), 24, 1);
  const renderItem = ({ item, index }: any) => {
    const onPress = () => {
      if (props.onSelect) {
        props.onSelect(item);
      }
    };
    return (
      <TouchableOpacity onPress={onPress}>
        <Text
          style={{
            fontSize: 18,
            paddingVertical: 6,
            textAlign: "center",
          }}
        >
          {item}:00{item > 11 ? " PM" : " AM"}
          {/* {Math.floor(item)}: 
          {item.toFixed(1) &&
          item.toFixed(1).split(".") != undefined &&
          item.toFixed(1).indexOf(".5") != -1
            ? '30'
            : '00'}*/}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal animationType="none" visible={isShow} transparent={true}>
      <View style={styles.container}>
        <View style={styles.content}>
          <FlatList
            data={data}
            extraData={data}
            // showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={() =>
              Platform.OS === "ios" ? (
                <Divider style={{ backgroundColor: Colors.gray_hidden_text }} />
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${Colors.main_blue}4D`,
  },
  content: {
    backgroundColor: Colors.white,
    alignSelf: "center",
    width: "80%",
    maxHeight: "50%",
    borderRadius: 12,
    shadowColor: Theme.shadow.float.shadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
