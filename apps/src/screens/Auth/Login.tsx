import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  AppState,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import analytics from "@react-native-firebase/analytics";
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import DeviceInfo from "react-native-device-info";
import {
  Button,
  Container,
  CustomInput,
  Text,
  Loading,
  DismissKeyboardView,
} from "../../components";
import messaging from "@react-native-firebase/messaging";
import useApi from "../../hooks/useApi";
import { success, TYPES } from "../../redux/actions";
import Colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import Styles from "../../shared/Styles";
import { FontAwesome5 } from "@expo/vector-icons";
import * as Facebook from "expo-facebook";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useIsFocused } from "@react-navigation/native";
import * as Location from "expo-location";
import Config from "react-native-config";

WebBrowser.maybeCompleteAuthSession();

export default function Login(props: any) {
  const isFocused = useIsFocused();
  const dispatch = useDispatch();

  const params = props.route.params || {};

  const appState = useRef(AppState.currentState);
  const language = useSelector((state: any) => state.language.language);
  // const token = useSelector((state: any) => state.auth.token);

  // const [isReady, setIsReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [isVisible, setIsVisible] = useState(false);
  const [version, setVersion] = useState();
  const [loadingSignIn, setLoadingSignIn] = useState(false);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  const [loadingVersion, requestGetVersion] = useApi({
    method: "get",
    url: Constants.API.get_version,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        setVersion(
          Platform.OS === "android"
            ? response.items[0].version
            : response.items[1].version
        );
        if (Platform.OS === "android") {
          if (
            parseFloat(response.items[0].version.split(".").join("")) >
            parseFloat(DeviceInfo.getVersion().split(".").join(""))
          ) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        } else {
          if (
            parseFloat(response.items[1].version.split(".").join("")) >
            parseFloat(DeviceInfo.getVersion().split(".").join(""))
          ) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        }
      }
    },
  });
  const [email, setEmail] = useState({
    value: params.email || "",
    isError: false,
    msgErr: "",
  });
  const [password, setPassword] = useState({
    value: params.password || "",
    isError: false,
    msgErr: "",
  });
  const [addDeviceNotification, requestAddDeviceNotification] = useApi({
    method: "post",
    url: Constants.API.add_device_notification,
    callback: ({ error, response }) => {
      if (error) {
        console.log("error_noti", error);
      } else {
        console.log(`Add token success: ${JSON.stringify(response)}`);
      }
    },
  });

  const sendFCMToken = (token: any) => {
    const sendToken = setTimeout(async () => {
      const fcmToken = await messaging().getToken();
      requestAddDeviceNotification({
        data: { token: fcmToken },
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("tokenNotification ", fcmToken);
      
      clearTimeout(sendToken);
    }, 900);
  };

  const [loadingLanguage, requestUpdateLanguage] = useApi({
    method: "put",
    url: Constants.API.update_language,
    callback: async ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        dispatch({
          type: success(TYPES.LANGUAGE),
          payload: {
            language: currentLanguage,
          },
        });
        // props.navigation.replace(Constants.SCREENS.MAIN.BOTTOM_BAR);
      }
    },
  });
  const [loading, request] = useApi({
    method: "post",
    url: Constants.API.login,
    callback: ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        if (response && response.auth_token) {
          try {
            sendFCMToken(response.auth_token);
            i18n.locale = currentLanguage;
            requestUpdateLanguage({
              data: { language: currentLanguage == "th" ? 1 : 2 },
              headers: { Authorization: `Bearer ${response.auth_token}` },
            });
            dispatch({
              type: success(TYPES.AUTH.LOGIN),
              payload: {
                token: response.auth_token,
              },
            });
          } catch (error) {
            Alert.alert("account", JSON.stringify(error));
          }
        }
      }
    },
  });
  const [loadingFacebook, requestFacebook] = useApi({
    method: "post",
    url: Constants.API.face_login,
    callback: async ({ error, response }) => {
      if (error) {
        setTimeout(() => {
          Alert.alert(i18n.t("auth.error"), error);
        }, 100);
      } else {
        if (response && response.auth_token) {
          try {
            sendFCMToken(response.auth_token);
            i18n.locale = currentLanguage;
            requestUpdateLanguage({
              data: { language: currentLanguage == "th" ? 1 : 2 },
              headers: { Authorization: `Bearer ${response.auth_token}` },
            });
            dispatch({
              type: success(TYPES.AUTH.LOGIN),
              payload: {
                token: response.auth_token,
              },
            });
          } catch (error) {
            Alert.alert("face", JSON.stringify(error));
          }
        }
      }
    },
  });
  const [loadingApple, requestApple] = useApi({
    method: "post",
    url: Constants.API.apple_login,
    callback: async ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        if (response && response.auth_token) {
          try {
            sendFCMToken(response.auth_token);
            dispatch({
              type: success(TYPES.AUTH.LOGIN),
              payload: {
                token: response.auth_token,
              },
            });
            i18n.locale = currentLanguage;
            requestUpdateLanguage({
              data: { language: currentLanguage == "th" ? 1 : 2 },
              headers: { Authorization: `Bearer ${response.auth_token}` },
            });
          } catch (error) {
            Alert.alert("apple", JSON.stringify(error));
          }
        }
      }
    },
  });
  const [loadingLine, requestLine] = useApi({
    method: "post",
    url: Constants.API.line_login,
    callback: async ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        if (response && response.auth_token) {
          dispatch({
            type: success(TYPES.AUTH.LOGIN),
            payload: {
              token: response.auth_token,
            },
          });
          sendFCMToken(response.auth_token);
          i18n.locale = currentLanguage;
          requestUpdateLanguage({
            data: { language: currentLanguage == "th" ? 1 : 2 },
            headers: { Authorization: `Bearer ${response.auth_token}` },
          });
        }
      }
    },
  });
  const [loadingGoogle, requestGoogle] = useApi({
    method: "post",
    url: Constants.API.google_login,
    callback: async ({ error, response }) => {
      if (error) Alert.alert(i18n.t("auth.error"), error);
      else {
        if (response && response.auth_token) {
          try {
            sendFCMToken(response.auth_token);
            dispatch({
              type: success(TYPES.AUTH.LOGIN),
              payload: {
                token: response.auth_token,
              },
            });
            i18n.locale = currentLanguage;
            requestUpdateLanguage({
              data: { language: currentLanguage == "th" ? 1 : 2 },
              headers: { Authorization: `Bearer ${response.auth_token}` },
            });
          } catch (error) {
            Alert.alert("google", JSON.stringify(error));
          }
        }
      }
    },
  });

  useEffect(() => {
    if (isFocused) {
      requestGetVersion();
    } else {
      setIsVisible(false);
    }
  }, [isFocused]);

  useEffect(() => {
    requestGetVersion();
    async function permission() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status == Location.PermissionStatus.DENIED) {
        Alert.alert(i18n.t("address.permission_location"));
      } else {
        await Location.enableNetworkProviderAsync();
      }
    }
    permission();
    GoogleSignin.configure({
      webClientId:
        "464116560251-d9928akj9e2bh5h5csdmdkc6c8qi2mma.apps.googleusercontent.com",
    });
    dispatch({
      type: success(TYPES.LANGUAGE),
      payload: {
        language: i18n.currentLocale(),
      },
    });

    AppState.addEventListener("change", _handleAppStateChange);
    return () => {
      AppState.removeEventListener("change", _handleAppStateChange);
    };
  }, []);

  const _handleAppStateChange = (nextAppState: any) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      requestGetVersion();
    }
    appState.current = nextAppState;
    setAppStateVisible(appState.current);
  };

  const onPressLogin = () => {
    if (!email.value) {
      setEmail({
        ...email,
        isError: true,
        msgErr: i18n.t("auth.missing_email"),
      });
      return;
    }
    if (!password.value) {
      setPassword({
        ...password,
        isError: true,
        msgErr: i18n.t("auth.missing_password"),
      });
      return;
    }
    request({
      data: {
        email: email.value,
        password: password.value,
      },
    });
  };

  const onPressForgot = () => {
    setEmail({ ...email, isError: false });
    setPassword({ ...password, isError: false });
    props.navigation.navigate(Constants.SCREENS.AUTH.FORGOT_PASSWORD);
  };

  const onPressSignUp = () => {
    setEmail({ ...email, isError: false });
    setPassword({ ...password, isError: false });
    props.navigation.navigate(Constants.SCREENS.AUTH.SIGNUP);
  };

  const loginFacebook = async () => {
    setLoadingSignIn(true);
    try {
      await Facebook.initializeAsync({
        appId: Constants.FACEBOOKID,
      });
      const { type, token }: any = await Facebook.logInWithReadPermissionsAsync(
        {
          permissions: ["public_profile", "email"],
        }
      );

      if (type === "success" && token) {
        await analytics().logEvent("login", { token: token });
        setLoadingSignIn(false);
        requestFacebook({ data: { token } });
      } else {
        setLoadingSignIn(false);
      }
    } catch (err: any) {
      setLoadingSignIn(false);
      Alert.alert(err?.message);
    }
  };
  const loginApple = async () => {
    setLoadingSignIn(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      await analytics().logEvent("login", credential);
      setLoadingSignIn(false);
      requestApple({ data: { token: credential.identityToken } });
    } catch (e: any) {
      setLoadingSignIn(false);
      if (e.code === "ERR_CANCELED") {
        // handle that the user canceled the sign-in flow
      } else {
        Alert.alert(i18n.t("auth.error_occurred"));
      }
    }
  };

  const selectLanguage = (value: string) => {
    i18n.locale = value;
    setCurrentLanguage(value);
    dispatch({
      type: success(TYPES.LANGUAGE),
      payload: {
        language: value,
      },
    });
    props.navigation.replace(Constants.SCREENS.AUTH.LOGIN);
  };

  const signIn = async () => {
    setLoadingSignIn(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo: any = await GoogleSignin.signIn();
      // this.setState({ userInfo });
      await analytics().logEvent("login", userInfo);
      setLoadingSignIn(false);
      requestGoogle({ data: { idToken: userInfo.idToken } });
    } catch (error: any) {
      setLoadingSignIn(false);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
      } else {
        // some other error happened
      }
    }
  };

  return (
    <Container style={s.container} statusBarColor={Colors.white}>
      <Loading
        loading={
          loadingLanguage ||
          loadingFacebook ||
          loadingApple ||
          loadingLine ||
          loadingSignIn ||
          addDeviceNotification ||
          loadingGoogle
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS == "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <DismissKeyboardView style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              marginTop: 15,
              justifyContent: "flex-end",
              marginRight: 20,
            }}
          >
            <Text
              onPress={() =>
                i18n.currentLocale() != "en" ? selectLanguage("en") : null
              }
              style={[
                { color: Colors.main_color },
                i18n.currentLocale() === "en" && s.languageSelected,
              ]}
            >
              EN
            </Text>
            <Text style={{ color: Colors.main_color }}> | </Text>
            <Text
              onPress={() =>
                i18n.currentLocale() != "th" ? selectLanguage("th") : null
              }
              style={[
                { color: Colors.main_color },
                i18n.currentLocale() === "th" && s.languageSelected,
              ]}
            >
              TH
            </Text>
          </View>
          <View style={s.logoContainer}>
            <Image
              source={require("../../assets/images/ayasan_logo.png")}
              style={s.logo}
            />
          </View>
          <View style={s.content}>
            <CustomInput
              value={email.value}
              keyboardType="email-address"
              placeholder={i18n.t("auth.email")}
              onChangeText={(value) =>
                setEmail({ ...email, value: value, isError: false })
              }
              isError={email.isError}
              errorText={email.msgErr}
            />
            <CustomInput
              value={password.value}
              isError={password.isError}
              errorText={password.msgErr}
              placeholder={i18n.t("auth.password")}
              onChangeText={(value) =>
                setPassword({ ...password, value: value, isError: false })
              }
              secureText={true}
              containerStyle={{ marginTop: 20, marginBottom: 10 }}
            />
            <Text style={s.forgot} onPress={onPressForgot}>
              {i18n.t("auth.forgot_password")}
            </Text>
            <Button
              onPress={async () => await onPressLogin()}
              style={{ width: "100%" }}
              title={i18n.t("auth.sign_in")}
              loading={loading}
            />
            <Text style={s.or}>{i18n.t("auth.or")}</Text>
            <Text style={s.loginWith}>{i18n.t("auth.login_with")}</Text>
            <View style={s.row}>
              <TouchableOpacity
                onPress={loginFacebook}
                style={{ marginRight: 12 }}
              >
                <FontAwesome5
                  name="facebook-square"
                  size={48}
                  color="#4165AE"
                />
              </TouchableOpacity>
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  onPress={loginApple}
                  style={{
                    height: 42,
                    width: 42,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "black",
                    borderRadius: 4,
                    marginRight: 8,
                  }}
                >
                  <FontAwesome5 name="apple" size={36} color="white" />
                </TouchableOpacity>
              )}
              {/* <TouchableOpacity
                onPress={loginLine}
                style={{ marginHorizontal: 10 }}
              >
                <FontAwesome5 name="line" size={40} color="#20C82F" />
              </TouchableOpacity> */}
              <TouchableOpacity
                style={{ width: 48, height: 48 }}
                onPress={signIn}
              >
                <GoogleSigninButton
                  pointerEvents="none"
                  style={{ width: 48, height: 48 }}
                  size={GoogleSigninButton.Size.Icon}
                  color={GoogleSigninButton.Color.Dark}
                />
              </TouchableOpacity>
            </View>

            <Text style={s.signupDes} onPress={onPressSignUp}>
              {i18n.t("auth.no_account")}{" "}
              <Text style={s.signup}>{i18n.t("auth.sign_up")}</Text>
            </Text>
          </View>
        </DismissKeyboardView>
      </KeyboardAvoidingView>
      <Modal animationType="fade" transparent visible={isVisible}>
        <View style={s.centeredView}>
          <View style={s.modalView}>
            <Text style={s.modalText}>
              {i18n.t("auth.current_version")} ({DeviceInfo.getVersion()}){" "}
              {i18n.t("auth.lower_version")} ({version}) {"\n"}
              {i18n.t("auth.update_version")}
            </Text>
            <TouchableOpacity
              style={[s.button, s.buttonClose]}
              onPress={() => {
                if (Platform.OS === "ios") {
                  Linking.openURL(
                    "https://apps.apple.com/us/app/ayasan/id1025748222"
                  );
                }
                if (Platform.OS === "android") {
                  Linking.openURL(
                    "https://play.google.com/store/apps/details?id=com.akaiunsan.customer&hl=en&gl=US"
                  );
                }
              }}
            >
              <Text style={s.textStyle}>{i18n.t("home.update")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Container>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  logo: {
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
    alignItems: "center",
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
  languageSelected: {
    textDecorationLine: Platform.OS === "ios" ? "underline" : "none",
    borderBottomColor: Colors.main_color,
    borderBottomWidth: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 16,
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  button: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: Colors.main_color,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
});
