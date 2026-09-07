import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Platform,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { Divider } from "react-native-elements";
import { useDispatch, useSelector } from "react-redux";
import { TYPES } from "../redux/actions";
import Colors from "../shared/Colors";
import i18n from "../shared/I18n";
import {Text} from "./Text";

const PickerModal = () => {
  const { height } = Dimensions.get("window");
  const { isShow, data, selected, callback } = useSelector((state: any) => {
    return state.tools.picker;
  });
  const [currentSelected, setSelected] = useState(
    selected || (data && data[0]) ? data[0]?.value : undefined
  );
  const dispatch = useDispatch();

  useEffect(() => {
    setSelected(selected || (data && data[0]) ? data[0]?.value : undefined);
  }, [selected]);

  const handleEvent = () => {
    if (callback) callback(currentSelected);
    dispatch({ type: TYPES.TOOLS.CLOSE_PICKER });
  };

  const handleEventValue = (value: any) => {
    setSelected(value.value);
    if (callback) callback(value.value);
    dispatch({ type: TYPES.TOOLS.CLOSE_PICKER });
  };

  const cancel = () => {
    dispatch({ type: TYPES.TOOLS.CLOSE_PICKER });
  };

  const renderItem = (item: any, idx: any) => (
    <TouchableOpacity key={idx} onPress={() => handleEventValue(item)}>
      <Text
        style={{
          fontSize: 18,
          paddingVertical: 6,
        }}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal animationType="none" visible={isShow} transparent={true}>
      <TouchableOpacity
        onPress={cancel}
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
          paddingHorizontal: 16,
          paddingVertical: height * 0.05,
        }}
      >
        <View
          style={{
            backgroundColor: Colors.white,
            paddingHorizontal: 16,
            paddingTop: 12,
            borderRadius: 12,
          }}
        >
          <Ionicons
            onPress={cancel}
            style={{ alignSelf: "flex-end" }}
            name="close-circle"
            size={24}
            color={Colors.gray}
          />
          <FlatList
            data={data}
            contentContainerStyle={
              data.length === 0 && {
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
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index, separators }) =>
              renderItem(item, index)
            }
            ItemSeparatorComponent={() =>
              Platform.OS === "ios" ? (
                <Divider style={{ backgroundColor: Colors.gray_hidden_text }} />
              ) : null
            }
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default PickerModal;
