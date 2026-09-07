import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useDispatch, useSelector } from "react-redux";
import {
  CameraLibrary,
  Container,
  CustomInput,
  Loading,
  Text,
} from "../../components";
import useApi from "../../hooks/useApi";
import { success, TYPES } from "../../redux/actions";
import Colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import Enum from "../../shared/Enum";
import i18n from "../../shared/I18n";
import Styles from "../../shared/Styles";
import { NavigationRoot } from "../../navigation/root";
import { add, isEmpty } from "lodash";
import { Ionicons } from "@expo/vector-icons";
const { width } = Dimensions.get("screen");
export default function EditProfile(props: any) {
  const dispatch = useDispatch();
  const paramsProps = props.route.params || {};
  const [image, setImage] = useState("");
  const [firstLogin, setFirstLogin] = useState(false);
  const [loginBy, setLoginBy] = useState("");
  const [isCamera, setIsCamera] = useState(false);
  const [name, setName] = useState({
    value: "",
    isError: false,
    msgErr: "",
  });
  const [phone, setPhone] = useState({
    value: "",
    isError: false,
    msgErr: "",
  });
  const [address, setAddress] = useState({
    value: "",
    isError: false,
    msgErr: "",
  });

  // const [id, setId] = useState({
  //   value: "",
  //   isError: false,
  //   msgErr: "",
  // });
  const [email, setEmail] = useState({
    value: "",
    isError: false,
    msgErr: "",
  });
  const [gender, setGender] = useState<{
    label?: string;
    value?: string;
    isError?: boolean;
    msgErr?: string;
  }>({});
  const [sponsor, setSponsor] = useState({
    value: "",
    isError: false,
    msgErr: "",
  });
  const [pass, setPass] = useState({
    value: "",
    isError: false,
    msgErr: "",
  });
  const [repass, setRePass] = useState({
    value: "",
    isError: false,
    msgErr: "",
  });
  const [point, setPoint] = useState({
    value: "",
    isError: false,
    msgErr: "",
  });
  const [loadingUserMe, requestUserMe] = useApi({
    method: "get",
    url: Constants.API.get_profile,
    callback: ({ error, response }) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
        dispatch({ type: success(TYPES.AUTH.LOG_OUT) });
      } else {
        dispatch({
          type: success(TYPES.AUTH.PROFILE),
          payload: {
            user: response,
          },
        });
        props.navigation.goBack();
      }
    },
  });
  const [loading, request] = useApi({
    method: "put",
    url: Constants.API.edit_profile,
    callback: ({ error, response }) => {
      if (error)
        setTimeout(() => {
          Alert.alert(i18n.t("auth.error"), error);
        }, 100);
      else {
        if (firstLogin) {
          requestUserMe();
        } else {
          requestUserMe();
          Alert.alert(i18n.t("home.update_successfully"));
        }
      }
    },
  });

  const validatePhone = (phone: any) => {
    const re = /^([0-9]{9,10})$/;
    return re.test(phone);
  };

  const validateEmail = (email: any) => {
    const re =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return re.test(email);
  };

  const onPressSave = () => {
    if (!name.value) {
      setName({
        ...name,
        isError: true,
        msgErr: i18n.t("auth.missing_name"),
      });
    }
    if (!phone.value) {
      setPhone({
        ...phone,
        isError: true,
        msgErr: i18n.t("auth.missing_phone"),
      });
    }
    if (phone.value && !validatePhone(phone.value)) {
      setPhone({
        ...phone,
        isError: true,
        msgErr: i18n.t("auth.validate_phone"),
      });
    }
    if (isEmpty(address.value)) {
      setAddress({
        ...address,
        isError: true,
        msgErr: i18n.t("auth.missing_address"),
      });
    }
    if (isEmpty(email.value)) {
      setEmail({
        ...email,
        isError: true,
        msgErr: i18n.t("auth.missing_email"),
      });
    }
    if (email.value && !validateEmail(email.value)) {
      setEmail({
        ...email,
        isError: true,
        msgErr: i18n.t("auth.validate_email"),
      });
    }
    if (!gender.label) {
      setGender({
        ...gender,
        isError: true,
        msgErr: i18n.t("auth.missing_gender"),
      });
    }
    if (!firstLogin) {
      if (
        pass.value &&
        /^(?=.*\d)(?=.*[a-z])[0-9a-zA-Z]{8,}$/.test(pass.value) === false
      ) {
        setPass({
          ...pass,
          isError: true,
          msgErr: i18n.t("auth.validate_password"),
        });
        return;
      }
      if (pass.value !== repass.value) {
        setRePass({
          ...repass,
          isError: true,
          msgErr: i18n.t("auth.error_confirm"),
        });
        return;
      }
    }

    if (
      !name.value ||
      !phone.value ||
      !validatePhone(phone.value) ||
      isEmpty(email.value) ||
      !validateEmail(email.value) ||
      isEmpty(address.value)
    ) {
      return;
    } else {
      let params = {};
      if (firstLogin) {
        params = {
          email: email.value,
          fullName: name.value,
          phone: phone.value,
          referralCode: sponsor.value,
          address: address.value,
          avatar: image,
          // id: id.value,
          gender: gender.value,
        };
      } else {
        params = {
          email: email.value,
          fullName: name.value,
          phone: phone.value,
          referralCode: sponsor.value,
          address: address.value,
          avatar: image,
          // id: id.value,
          gender: gender.value,
          password: pass.value,
          rePassword: repass.value,
        };
      }
      request({
        data: params,
      });
    }
  };

  const dataGender = [
    { label: i18n.t("Female"), value: 0 },
    { label: i18n.t("Miss"), value: 2 },
    { label: i18n.t("Male"), value: 1 },
    // { label: i18n.t("Other"), value: 2 },
  ];

  const onChooseGender = () => {
    dispatch({
      type: TYPES.TOOLS.OPEN_PICKER,
      payload: {
        data: dataGender,
        selected: gender.value,
        callback: (selected: number) => {
          const newGender = () =>
            dataGender.reduce((pre, cur) => {
              if (cur?.value === selected) {
                return cur;
              } else return pre;
            }, {});
          setGender(newGender);
        },
      },
    });
  };
  const fillData = () => {
    if (user.fullName) {
      setName({ ...name, value: user.fullName });
    }
    if (user.address) {
      setAddress({ ...address, value: user.address });
    }

    if (user.email) {
      setEmail({ ...email, value: user.email });
    }
    if (user.phoneNumber) {
      setPhone({ ...phone, value: user.phoneNumber });
    }
    // if (user.identityNumber) {
    //   setId({ ...id, value: user.identityNumber });
    // }
    if (user.referralCode) {
      setSponsor({ ...sponsor, value: user.referralCode });
    }
    if (user.loginBy) {
      setLoginBy(user.loginBy);
    }
    setGender({
      ...gender,
      value: Enum.GENDER[user.gender].value as any,
      label: i18n.t(Enum.GENDER[user.gender].label),
    });
  };

  const handleValueImage = (value: any) => {
    setIsCamera(false);
    setImage(value.data);
  };

  const user = useSelector((state: any) => state.auth.user);
  useEffect(() => {
    fillData();
    if (user.loginBy && !user.phoneNumber) {
      setFirstLogin(true);
    }
    setImage(user.avatar);
  }, [user]);
  const onGoBack = (add: any) => {
    setAddress({
      ...address,
      value: add.placeName,
      // value: `${add.name}, ${add.subregion}, ${add.region}, ${add.isoCountryCode}`,
      isError: false,
    });
  };

  return (
    <Container style={s.container}>
      <Loading loading={loading || loadingUserMe} />
      <KeyboardAvoidingView
        behavior={Platform.OS == "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1 }}>
          <View style={s.login}>
            <Text style={s.textTitle}>
              {!user.phoneNumber
                ? i18n.t("home.update_profile")
                : i18n.t("home.edit_profile")}
            </Text>
            <Text onPress={() => onPressSave()} style={s.blueLink}>
              {i18n.t("home.save")}
            </Text>
          </View>
          <View>
            {image ? (
              <Image source={{ uri: image }} style={s.logo} />
            ) : (
              <Image
                source={require("../../assets/images/icon.png")}
                style={s.logo}
              />
            )}
            <Text
              onPress={() => setIsCamera(true)}
              style={{
                textAlign: "center",
                color: Colors.blue_link,
                fontStyle: "italic",
                textDecorationLine: "underline",
              }}
            >
              {i18n.t("home.update_avata")}
            </Text>
          </View>
          <View style={s.content}>
            <Text style={s.title}>{`${i18n.t("auth.fullname")} *`}</Text>
            <View style={{ flexDirection: "row", flex: 1 }}>
              <View style={{ width: 120, marginRight: 16 }}>
                <CustomInput
                  value={gender.label}
                  onChangeText={() => setGender}
                  onDropDown={onChooseGender}
                  editable={false}
                  isError={gender.isError}
                  errorText={gender.msgErr}
                />
              </View>
              <View style={{ flex: 1 }}>
                <CustomInput
                  value={name.value}
                  onChangeText={(value) =>
                    setName({ ...name, value, isError: false })
                  }
                  isError={name.isError}
                  errorText={name.msgErr}
                />
              </View>
            </View>
            <Text style={s.title}>{`${i18n.t("auth.phone")} *`}</Text>
            <CustomInput
              keyboardType="phone-pad"
              value={phone.value}
              onChangeText={(value) =>
                setPhone({ ...phone, value, isError: false })
              }
              isError={phone.isError}
              errorText={phone.msgErr}
            />

            <TouchableOpacity
              style={s.addButton}
              onPress={() =>
                NavigationRoot.navigate(
                  Constants.SCREENS.ADDRESS.PICK_ADDRESS,
                  { onGoBack, placeName: address.value }
                )
              }
            >
              {isEmpty(address.value) ? (
                <Ionicons
                  name="add-circle"
                  size={20}
                  color={Colors.main_orange}
                  style={{ marginRight: 8 }}
                />
              ) : (
                <Ionicons
                  name="refresh"
                  size={20}
                  color={Colors.main_orange}
                  style={{ marginRight: 8 }}
                />
              )}
              <Text>{`${i18n.t("auth.address")} *`}</Text>
            </TouchableOpacity>

            {address.isError && (
              <Text
                style={[
                  s.textItalic,
                  { opacity: address.isError ? 1 : 0, color: Colors.red },
                ]}
              >
                {address.msgErr}
              </Text>
            )}

            {!isEmpty(address.value) && (
              <TouchableOpacity
                onPress={() =>
                  NavigationRoot.navigate(
                    Constants.SCREENS.ADDRESS.PICK_ADDRESS,
                    {
                      onGoBack,
                      placeName: address.value
                    }
                  )
                }
                style={s.add}
              >
                <Ionicons
                  name="location-sharp"
                  size={20}
                  color={Colors.black}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ flex: 1 }}>{address.value}</Text>
                <Ionicons name="open-outline" size={24} />
              </TouchableOpacity>
            )}

            {/* {!loginBy && <Text style={s.title}>{`${i18n.t("auth.ID")}`}</Text>} */}
            {/* {!loginBy && (
              <CustomInput
                keyboardType="number-pad"
                value={id.value}
                onChangeText={(value) =>
                  setId({ ...id, value, isError: false })
                }
                isError={id.isError}
                errorText={id.msgErr}
              />
            )} */}
            <Text style={s.title}>{`${i18n.t("auth.mail")} *`}</Text>
            <CustomInput
              keyboardType="email-address"
              value={email.value}
              onChangeText={(value) =>
                setEmail({ ...email, value, isError: false })
              }
              isError={email.isError}
              errorText={email.msgErr}
              disabled={
                !isEmpty(paramsProps?.data?.email) || !isEmpty(user?.email)
              }
            />

            {!loginBy && (
              <View>
                <Text style={s.title}>{i18n.t("auth.password")}</Text>
                <CustomInput
                  value={pass.value}
                  onChangeText={(value) =>
                    setPass({ ...pass, value, isError: false })
                  }
                  style={{ fontStyle: "italic" }}
                  secureText={true}
                  isError={pass.isError}
                  errorText={pass.msgErr}
                />
                <Text style={s.title}>{i18n.t("auth.repassword")}</Text>
                <CustomInput
                  value={repass.value}
                  onChangeText={(value) =>
                    setRePass({ ...repass, value, isError: false })
                  }
                  style={{ fontStyle: "italic" }}
                  secureText={true}
                  isError={repass.isError}
                  errorText={repass.msgErr}
                />
              </View>
            )}
            {loginBy ? (
              <Text style={s.title}>{`${i18n.t("home.login_by")}`}</Text>
            ) : null}
            {loginBy ? <CustomInput value={loginBy} disabled /> : null}
            {!loginBy && (
              <Text style={s.title}>{`${i18n.t("home.point")}`}</Text>
            )}
            {!loginBy && (
              <CustomInput
                value={point.value}
                onChangeText={(value) =>
                  setPoint({ ...point, value, isError: false })
                }
                isError={point.isError}
                errorText={point.msgErr}
                disabled
              />
            )}
            <Text style={s.title}>{`${i18n.t("auth.ref_code")}`}</Text>
            <CustomInput
              value={sponsor.value}
              onChangeText={(value) =>
                setSponsor({ ...sponsor, value, isError: false })
              }
              placeholder={i18n.t("auth.ref_code")}
              style={{
                fontStyle: sponsor ? "normal" : "italic",
              }}
              isError={sponsor.isError}
              errorText={sponsor.msgErr}
              disabled
            />
            <View style={{ height: 50 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CameraLibrary
        children={handleValueImage}
        isShowModalCamera={isCamera}
        setModalVisible={() => setIsCamera(!isCamera)}
      />
    </Container>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  textItalic: {
    fontStyle: "italic",
    marginTop: 5,
  },
  textTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginVertical: 10,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 5,
  },
  add: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderRadius: 10,
    padding: 6,
  },
  blueLink: {
    marginHorizontal: 20,
    marginVertical: 10,
    color: Colors.blue_link,
    fontStyle: "italic",
    textDecorationLine: "underline",
  },
  login: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray_hidden_text,
  },
  login2: {
    alignSelf: "center",
    marginTop: 10,
    color: Colors.blue_link,
    textDecorationLine: "underline",
  },
  title: {
    marginTop: 15,
    marginBottom: 5,
    color: Colors.gray,
  },
  logo: {
    alignSelf: "center",
    marginTop: 20,
    resizeMode: "contain",
    width: 70,
    height: 70,
    borderRadius: 70 / 2,
  },
  content: {
    flex: 2,
    marginHorizontal: Styles.margin.horizontal,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  forgot: {
    alignSelf: "flex-end",
    color: Colors.blue_link,
  },
  or: {
    paddingTop: 30,
    alignSelf: "center",
    flex: 1,
  },
  loginWith: {
    alignSelf: "center",
    fontSize: Styles.typography.footnode,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignSelf: "center",
  },
  socialBtn: {
    marginHorizontal: Styles.margin.horizontal,
  },
  signupDes: {
    alignSelf: "center",
    marginTop: 50,
    paddingBottom: 30,
  },
  signup: {
    color: Colors.blue_link,
  },
});
