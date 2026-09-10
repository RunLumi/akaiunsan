import { Ionicons } from "@expo/vector-icons";
import _, { isEmpty } from "lodash";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useDispatch } from "react-redux";
import {
  Button,
  Container,
  CustomInput,
  DismissKeyboardView,
  Loading,
  Text,
} from "../../components";
import { useSignupMutation, type SignupPayload } from "../../redux/apiSlice";
import { NavigationRoot } from "../../navigation/root";
import { TYPES } from "../../redux/actions";
import Colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import Styles from "../../shared/Styles";
import { styles } from "../Main/Home";
import { color } from "react-native-elements/dist/helpers";
import type { ApiItem } from "../../redux/apiSlice";
import type { ScreenProps } from "../../navigation/routes";
import { logAnalyticsEvent } from "../../shared/firebase";

const windowWidth = Dimensions.get('window').width;
export default function Signup(props: ScreenProps) {
  const dispatch = useDispatch();
  const [firstname, setFirstName] = useState({
    value: "",
    isError: false,
    msgErr: "",
  });
  const [lastname, setLastName] = useState({
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
  const [id, setId] = useState({
    value: "",
    isError: false,
    msgErr: "",
  });
  const [email, setEmail] = useState({
    value: "",
    isError: false,
    msgErr: "",
  });
  const [gender, setGender] = useState<{
    label?: string;
    value?: number;
    isError?: boolean;
    msgErr?: string;
  }>({
    label: "Mr", 
    value: 1
  });
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
  // Phase 5 RTK Query port: the register call. The legacy request callback
  // runs unchanged through the adapter so the success/error contract
  // (replace to LOGIN, delayed alerts) is identical to the useApi tunnel.
  const handleRegisterResult = ({ error, response }: any) => {
    if (error)
      setTimeout(() => {
        Alert.alert(i18n.t("auth.error"), error);
      }, 100);
    else {
      props.navigation.replace(Constants.SCREENS.AUTH.LOGIN, {
        email: email.value,
        password: pass.value,
      });
      setTimeout(() => {
        Alert.alert(i18n.t("auth.sign_in"), i18n.t("auth.register_success"));
      }, 300);
    }
  };
  const [signupMutation, { isLoading: loadingRTK }] = useSignupMutation();
  const loading = loadingRTK;
  const request = ({ data }: { data: SignupPayload }) => {
    signupMutation(data)
      .unwrap()
      .then((response: ApiItem) => handleRegisterResult({ error: "", response }))
      .catch((e: ApiItem) =>
        handleRegisterResult({
          // mirrors useApi's 400 translation: axios reported
          // "Request failed with status code 400" for e.status === 400
          error:
            e?.status === 400
              ? i18n.t("home.error_400")
              : e?.data?.message || e?.message || "error",
          response: {},
        })
      );
  };
  const validatePhone = (phone: string) => {
    const re = /^(0)\d{9}$/g;
    return re.test(phone);
  };

  const validateEmail = (email: string) => {
    const re =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return re.test(email);
  };

  const validateSignup = () => {
    let valid = true;

    if (_.isEmpty(firstname.value.trim())) {
      setFirstName({
        ...firstname,
        isError: true,
        msgErr: i18n.t("auth.validate"),
      });
      valid = false;
    }

    if (_.isEmpty(lastname.value.trim())) {
      setLastName({
        ...lastname,
        isError: true,
        msgErr: i18n.t("auth.validate"),
      });
      valid = false;
    }

    if (_.isEmpty(phone.value.trim())) {
      setPhone({
        ...phone,
        isError: true,
        msgErr: i18n.t("auth.missing_phone"),
      });
      valid = false;
    } else {
      if (!validatePhone(phone.value)) {
        setPhone({
          ...phone,
          isError: true,
          msgErr: i18n.t("auth.validate_phone"),
        });
        valid = false;
      }
    }

    if (_.isEmpty(address.value.trim())) {
      setAddress({
        ...address,
        isError: true,
        msgErr: i18n.t("auth.missing_address"),
      });
      valid = false;
    }

    if (_.isEmpty(email.value)) {
      setEmail({
        ...email,
        isError: true,
        msgErr: i18n.t("auth.validate"),
      });
      valid = false;
    }
    if (_.isEmpty(email.value.trim())) {
      setEmail({
        ...email,
        isError: true,
        msgErr: i18n.t("auth.missing_email"),
      });
      valid = false;
    } else {
      if (!validateEmail(email.value)) {
        setEmail({
          ...email,
          isError: true,
          msgErr: i18n.t("auth.validate_email"),
        });
        valid = false;
      }
    }

    if (_.isEmpty(gender.label)) {
      setGender({
        ...gender,
        isError: true,
        msgErr: i18n.t("auth.validate"),
      });
      valid = false;
    }

    if (_.isEmpty(pass.value.trim())) {
      setPass({
        ...pass,
        isError: true,
        msgErr: i18n.t("auth.missing_password"),
      });
      valid = false;
    } else {
      if (
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*?[0-9]).{8,}$/.test(pass.value) === false
      ) {
        setPass({
          ...pass,
          isError: true,
          msgErr: i18n.t("auth.validate_password"),
        });
        valid = false;
      }
    }

    if (_.isEmpty(repass.value)) {
      setRePass({
        ...repass,
        isError: true,
        msgErr: i18n.t("auth.missing_re_password"),
      });
      valid = false;
    } else {
      if (pass.value !== repass.value) {
        setRePass({
          ...repass,
          isError: true,
          msgErr: i18n.t("auth.validate_re_password"),
        });
        valid = false;
      }
    }

    return valid;
  };

  const onPressNext = async () => {
    if (!validateSignup()) return;
    request({
      data: {
        email: email.value,
        password: pass.value,
        fullName: `${firstname.value} ${lastname.value}`,
        phoneNumber: phone.value,
        referralCode: sponsor.value,
        address: address.value,
        avatar: "",
        identityNumber: id.value,
        gender: gender.value,
      },
    });
    await logAnalyticsEvent("signup", { method: "password" });
  };

  const onPressLogin = () => {
    NavigationRoot.navigate(Constants.SCREENS.AUTH.LOGIN);
  };

  const dataGender = [
    { label: i18n.t("Female"), value: 0 },
    { label: i18n.t("Miss"), value: 2 },
    { label: i18n.t("Male"), value: 1 },
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

  const onGoBack = (add: ApiItem) => {
    setAddress({
      ...address,
      value: add.placeName,
      // value: `${add.name}, ${add.subregion}, ${add.region}, ${add.isoCountryCode}`,
      isError: false,
    });
  };

  return (
    <Container style={s.container} statusBarColor={Colors.white}>
      <KeyboardAvoidingView
        behavior={Platform.OS == "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Loading loading={loading} />
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <DismissKeyboardView style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={onPressLogin}
              accessibilityRole="button"
              accessibilityLabel={i18n.t("auth.login")}
              testID="signup-login-button"
              style={s.login}
            >
              <Text style={s.loginText}>{i18n.t("auth.login")}</Text>
            </TouchableOpacity>
            <Image
              source={require("../../assets/images/akaiunsan_logo.png")}
              style={s.logo}
            />
            <View style={s.content}>
              {/* <Text style={s.title}>{`${i18n.t("auth.fullname")} *`}</Text> */}
              <View style={{ flexDirection: "row" }}>
                <View style={{ width: windowWidth / 4, marginRight: 12 }}>
                  <CustomInput
                    placeholder={i18n.t("Male")}
                    value={gender.label}
                    onChangeText={() => setGender}
                    onDropDown={onChooseGender}
                    editable={false}
                    isError={gender.isError}
                    errorText={gender.msgErr}
                    containerStyle={{ marginRight: 12 }}
                  />
                </View>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <CustomInput
                    placeholder={`${i18n.t("auth.firstname")} *`}
                    value={firstname.value}
                    onChangeText={(value) =>
                      setFirstName({ ...firstname, value, isError: false })
                    }
                    isError={firstname.isError}
                    errorText={firstname.msgErr}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomInput
                    placeholder={`${i18n.t("auth.lastname")} *`}
                    value={lastname.value}
                    onChangeText={(value) =>
                      setLastName({ ...lastname, value, isError: false })
                    }
                    isError={lastname.isError}
                    errorText={lastname.msgErr}
                  />
                </View>
              </View>
              {/* <Text style={s.title}>{`${i18n.t("auth.phone")} *`}</Text> */}
              <View style={s.addButton}>
                <CustomInput
                  placeholder={`${i18n.t("auth.phone")} *`}
                  keyboardType="phone-pad"
                  value={phone.value}
                  onChangeText={(value) =>
                    setPhone({ ...phone, value, isError: false })
                  }
                  isError={phone.isError}
                  errorText={phone.msgErr}
                />
              </View>

              <TouchableOpacity
                style={s.button}
                onPress={() =>
                  NavigationRoot.navigate(
                    Constants.SCREENS.ADDRESS.PICK_ADDRESS,
                    { onGoBack: onGoBack }
                  )
                }
              >
                <Text
                  numberOfLines={1}
                  style={[
                    s.textButton,
                    !isEmpty(address.value) && { color: Colors.black },
                  ]}
                >
                  {!address.value ? i18n.t("auth.address_here") : address.value}
                </Text>
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
              {/* <Text style={s.title}>{`${i18n.t("auth.mail")} *`}</Text> */}
              <View style={s.addButton}>
                <CustomInput
                  placeholder={`${i18n.t("auth.mail")} *`}
                  keyboardType="email-address"
                  value={email.value}
                  onChangeText={(value) =>
                    setEmail({ ...email, value, isError: false })
                  }
                  isError={email.isError}
                  errorText={email.msgErr}
                />
              </View>
              {/* <Text style={s.title}>{`${i18n.t("auth.password")} *`}</Text> */}
              <View style={s.addButton}>
                <CustomInput
                  placeholder={`${i18n.t("auth.password")} *`}
                  value={pass.value}
                  onChangeText={(value) => {
                    setPass({ ...pass, value, isError: false });
                    setRePass({ ...repass, isError: false });
                  }}
                  style={{ fontStyle: "italic" }}
                  secureText={true}
                  isError={pass.isError}
                  errorText={pass.msgErr}
                />
              </View>
              {/* <Text style={s.title}>{`${i18n.t("auth.repassword")} *`}</Text> */}
              <View style={s.addButton}>
                <CustomInput
                  placeholder={`${i18n.t("auth.repassword")} *`}
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
              {/* <Text style={s.title}>{`${i18n.t("auth.friend")}`}</Text> */}
              <View style={s.addButton}>
                <CustomInput
                  value={sponsor.value}
                  onChangeText={(value) =>
                    setSponsor({ ...sponsor, value, isError: false })
                  }
                  placeholder={`${i18n.t("auth.friend")}: ${i18n.t(
                    "auth.ref_code"
                  )}`}
                  style={{
                    fontStyle: sponsor ? "normal" : "italic",
                  }}
                  isError={sponsor.isError}
                  errorText={sponsor.msgErr}
                />
              </View>
              <Button
                onPress={onPressNext}
                style={{ width: "100%", marginTop: 20 }}
                title={i18n.t("auth.next")}
                loading={loading}
              />
              <View style={{ height: 50 }} />
            </View>
          </DismissKeyboardView>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}

const s = StyleSheet.create({
  textButton: {
    color: Colors.gray,
  },
  button: {
    marginTop: 24,
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    shadowColor: Colors.gray,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 3,
    borderRadius: 8,
    height: 40,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  textItalic: {
    fontStyle: "italic",
    marginTop: 5,
  },
  login: {
    alignSelf: "flex-end",
    marginTop: Platform.OS === "ios" ? 30 : 45,
    marginRight: Styles.margin.horizontal,
  },
  loginText: {
    color: Colors.blue_link,
    fontStyle: "italic",
    textDecorationLine: "underline",
  },
  login2: {
    alignSelf: "center",
    marginTop: 10,
    color: Colors.blue_link,
    textDecorationLine: "underline",
  },
  // title: {
  //   marginTop: 15,
  //   marginBottom: 5,
  //   color: Colors.gray,
  // },
  logo: {
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
    resizeMode: "contain",
    height: 100,
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
  },
  add: {
    flexDirection: "row",
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
