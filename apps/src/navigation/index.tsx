import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useState, useEffect, useRef } from "react";
import { setNotificationBadgeCount } from "../shared/notifications";
import Constants from "../shared/Constants";
import { TouchableOpacity, Dimensions, Alert } from "react-native";
import { ForgotPassword, Login, Signup } from "../screens/Auth";
import {
  PreferToFriend,
  InboxDetail,
  PaymentPetcare,
  ListFexiblePlan,
  DetailFexiblePlan,
  AgreeFexiblePlan,
  AddFixPlan,
  AddressFixPlan,
  AboutUs,
  AboutUsView,
} from "../screens/Other";
import BottomTabNavigator from "./BottomTab";
import { navigationRef, NavigationRoot } from "./root";
import colors from "../shared/Colors";
import PickerModal from "../components/Picker";
import { NotificationHandler } from "../components";
import { Address, PickAddress } from "../screens/Address";
import { BookingDetail, DetailHistory, Calendar } from "../screens/Booking";
import EditProfile from "../screens/Other/EditProfile";
import { ListMyBooking } from "../screens/MyBooking";
import EditAndReOrderService from "../screens/EditAndReOrderServiceScreen/EditAndReOrderService";
import { AllService, Service } from "../screens/ServiceScreen";
import {
  MenuFavourite,
  ListService,
  ListServiceProvider,
} from "../screens/Favourite";
import { PromotionDetail, PromotionList } from "../screens/Promotion";
import {
  SubscriptionDetail,
  AllSubscriptionPlan,
} from "../screens/Subscription";
import { HistoryDetail, HistoryList } from "../screens/History";
import { Ionicons } from "@expo/vector-icons";
import { PaymentList } from "../screens/Payment";
import i18n from "../shared/I18n";
import * as ReactRedux from "react-redux";
import { useAppSelector } from "../redux/hooks";
import { TYPES } from "../redux/actions";
import { isEmpty } from "lodash";
import { linkingConfig, deepLinkRoute, gateForToken } from "./contracts";
import type { RouteName } from "./routes";
import { reactNavigationIntegration } from "../../instrument";
import { apiSlice, portRequest, type ApiResult } from "../redux/apiSlice";
import type { ApiItem } from "../redux/apiSlice";
import type { ScreenProps } from "../navigation/routes";
import { getFirebaseMessaging } from "../shared/firebase";

const { width } = Dimensions.get("window");

export { linkingConfig, deepLinkRoute, gateForToken } from "./contracts";

export default function Navigation() {
  const linking = linkingConfig;

  // Get active route name
  function getActiveRouteName(
    state: { routes: { name: string; state?: unknown }[]; index: number }
  ): string | undefined {
    if (state) {
      const route = state.routes[state.index];
      if (route.state) {
        return getActiveRouteName((route.state ?? {}) as { routes: { name: string; state?: unknown }[]; index: number });
      }
      return route.name;
    }
  }

  return (
    <NavigationContainer
      // initialState={initialState}
      // onStateChange={(state) =>
      //   AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state))
      // }
      onStateChange={(state: any) => {
        const currentRouteName = getActiveRouteName(state);
        console.log(`====== NAVIGATING to > ${currentRouteName}`);
      }}
      onReady={() => {
        reactNavigationIntegration.registerNavigationContainer(navigationRef);
      }}
      linking={linking}
      ref={navigationRef}
    >
      <RootNavigator />
      <PickerModal />
      <NotificationHandler />
    </NavigationContainer>
  );
}

const NavStack = createStackNavigator();

function RootNavigator() {
  const dispatch = ReactRedux.useDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const resetTokenRef = useRef<string | null>(null);

  // Changing the conditional screen group alone does not guarantee that
  // React Navigation leaves the currently mounted Auth/Login route. Reset the
  // stack explicitly after a successful sign-in so a valid production 200
  // cannot leave the user stranded on Login.
  useEffect(() => {
    if (!token || !navigationRef.current || resetTokenRef.current === token) return;
    resetTokenRef.current = token;
    const resetTimer = setTimeout(() => {
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: Constants.SCREENS.MAIN.BOTTOM_BAR }],
      });
    }, 0);
    return () => clearTimeout(resetTimer);
  }, [token]);

  // const [initRoute, setInitRoute] = useState(Constants.SCREENS.AUTH.LOGIN)
  // const [isReady, setIsReady] = useState(false);
  const [initialParams, setinitialParams] = useState<any>(null);
  const [requestGetNotificationTrigger, { isLoading: loadingGetNotification }] =
    apiSlice.endpoints.getNotifications.useLazyQuery();
  const requestGetNotification = portRequest(
    requestGetNotificationTrigger,
    ({ error, response }: ApiResult) => {
      if (error) {
        Alert.alert(i18n.t("auth.error"), error);
      }
      setNotificationBadgeCount(response.totalUnRead);
      dispatch({
        type: TYPES.TOOLS.NOTIFICATION,
        payload: response && response.totalUnRead,
      });
    }
  );

  const defaultHeader = {
    headerShown: true,
    headerTitle: " ",
    headerLeft: (props: any) => {
      const newPress = () => {
        if (user) {
          NavigationRoot.navigate(Constants.SCREENS.MAIN.BOTTOM_BAR);
          return;
        } else {
          NavigationRoot.navigate(Constants.SCREENS.AUTH.LOGIN);
          return;
        }
      };
      return (
        <TouchableOpacity
          accessibilityLabel="navigation-back-button"
          style={{
            backgroundColor: colors.main_color,
            flex: 1,
            width: width,
            justifyContent: "center",
          }}
          onPress={props.onPress || newPress}
        >
          <Ionicons
            style={{ marginLeft: 12 }}
            name="arrow-back"
            size={26}
            color={colors.white}
          />
        </TouchableOpacity>
      );
    },
  };

  useEffect(() => {
    const messaging = getFirebaseMessaging();
    if (!messaging?.module.onNotificationOpenedApp) {
      return;
    }

    return messaging.module.onNotificationOpenedApp(messaging.service, async (remoteMessage: any) => {
      const { data } = remoteMessage;
      // Preserved side-effects: each type pre-loads its initialParams state
      // (note: navigation below reads the *stale* render-closure value).
      switch (data && data.type) {
        case "0":
          setinitialParams({
            item: {
              orderId: data.id,
              notificationId: data.notificationId,
            },
          });
          break;
        case "1":
          setinitialParams({
            data: { promotionId: data.id },
          });
          break;
        case "2":
          setinitialParams({
            data: {
              newsId: data.id,
              id: data.id,
            },
          });
          break;
        case "3":
          setinitialParams({ id: data.id });
          break;
        case "4":
          setinitialParams({ id: data.id });
          break;
        default:
          break;
      }
      const screenName = deepLinkRoute(data);
      // isEmpty guards the "" no-op case; the cast restores RouteName
      !isEmpty(screenName) &&
        NavigationRoot.navigate(screenName as RouteName, initialParams);
    });
  }, []);

  return (
    <NavStack.Navigator screenOptions={{ headerShown: false }}>
      {gateForToken(token) === "auth" ? (
        <NavStack.Group>
          <NavStack.Screen
            name={Constants.SCREENS.AUTH.LOGIN}
            component={Login}
          />
          <NavStack.Screen
            name={Constants.SCREENS.AUTH.SIGNUP}
            component={Signup}
          />
          <NavStack.Screen
            name={Constants.SCREENS.AUTH.FORGOT_PASSWORD}
            component={ForgotPassword}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.ADDRESS.PICK_ADDRESS}
            component={PickAddress}
          />
        </NavStack.Group>
      ) : (
        <NavStack.Group
          screenOptions={{
            headerShown: false,
          }}
        >
          <NavStack.Screen
            name={Constants.SCREENS.MAIN.BOTTOM_BAR}
            component={BottomTabNavigator}
          />
          <NavStack.Screen
            options={{
              ...defaultHeader,
              headerShown: false,
              gestureEnabled: false,
            }}
            name={Constants.SCREENS.SERVICE.SERVICE}
            component={Service}
          />
          <NavStack.Screen
            options={{ ...defaultHeader }}
            name={Constants.SCREENS.OTHER.PAYMENT_PETCARE}
            component={PaymentPetcare}
          />
          <NavStack.Screen
            options={{
              ...defaultHeader,
              headerShown: false,
              gestureEnabled: false,
            }}
            name={Constants.SCREENS.SERVICE.EDITANDREORDERANDEDITSERVICE}
            component={EditAndReOrderService}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.PROMOTIOM.LIST_PROMOTION}
            component={PromotionList}
          />
          <NavStack.Screen
            initialParams={initialParams}
            options={defaultHeader}
            name={Constants.SCREENS.PROMOTIOM.DETAIL}
            component={PromotionDetail}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.SUBSCRIPTION.DETAIL}
            component={SubscriptionDetail}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.OTHER.PREFERTOFRIEND}
            component={PreferToFriend}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.SERVICE.AllService}
            component={AllService}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.SUBSCRIPTION.AllSubscriptionPlan}
            component={AllSubscriptionPlan}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.OTHER.EditProfile}
            component={EditProfile}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.HISTORY.DETAIL}
            component={HistoryDetail}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.HISTORY.LIST_HISTORY}
            component={HistoryList}
          />
          <NavStack.Screen
            initialParams={initialParams}
            options={defaultHeader}
            name={Constants.SCREENS.OTHER.INBOXDETAIL}
            component={InboxDetail}
          />
          <NavStack.Screen
            options={{
              ...defaultHeader,
              headerBackButtonDisplayMode: "minimal",
            }}
            name={Constants.SCREENS.ADDRESS.ADDRESS}
            component={Address}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.ADDRESS.PICK_ADDRESS}
            component={PickAddress}
          />
          <NavStack.Screen
            options={{
              ...defaultHeader,
              headerBackTitle: "Job lists",
              headerTintColor: colors.white,
            }}
            name={Constants.SCREENS.BOOKING.CALENDAR}
            component={Calendar}
          />
          <NavStack.Screen
            options={{
              ...defaultHeader,
              headerBackButtonDisplayMode: "minimal",
            }}
            initialParams={initialParams}
            name={Constants.SCREENS.BOOKING.DETAIL}
            component={BookingDetail}
          />
          <NavStack.Screen
            options={{
              ...defaultHeader,
              headerBackButtonDisplayMode: "minimal",
            }}
            name={Constants.SCREENS.BOOKING.DETAIL_HISTORY}
            component={DetailHistory}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.FAVOURITE.MENU}
            component={MenuFavourite}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.FAVOURITE.SERVICE}
            component={ListService}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.FAVOURITE.SERVICE_PROVIDER}
            component={ListServiceProvider}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.MYBOOKING.LIST}
            component={ListMyBooking}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.PAYMENT.LIST}
            component={PaymentList}
          />
          <NavStack.Screen
            options={{
              ...defaultHeader,
              headerBackButtonDisplayMode: "minimal",
            }}
            name={Constants.SCREENS.MYBOOKING.DETAIL_MYBOOKING}
            component={BookingDetail}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.OTHER.LIST_FEXIBLE_PLAN}
            component={ListFexiblePlan}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.OTHER.DETAIL_FEXIBLE_PLAN}
            component={DetailFexiblePlan}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.OTHER.AGREE_FEXIBLE_PLAN}
            component={AgreeFexiblePlan}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.OTHER.ADD_FIX_PLAN}
            component={AddFixPlan as any}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.OTHER.ADDRESS_FIX_PLAN}
            component={AddressFixPlan}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.OTHER.ABOUT_US}
            component={AboutUs}
          />
          <NavStack.Screen
            options={defaultHeader}
            name={Constants.SCREENS.OTHER.ABOUT_US_VIEW}
            component={AboutUsView}
          />
        </NavStack.Group>
      )}
    </NavStack.Navigator>
  );
}
