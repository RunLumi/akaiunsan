import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import Constants from "../shared/Constants";
import { Account, Booking, Home, Inbox } from "../screens/Main";
import colors from "../shared/Colors";
import i18n from "../shared/I18n";
import { useSelector } from "react-redux";

const BottomTab = createBottomTabNavigator<any>();
export default function BottomTabNavigator() {
  const tools = useSelector((state: any) => state.tools.notification);
  const language = useSelector((state: any) => state.language.language);
  const [currentLanguage, setCurrentLanguage] = useState(language);

  React.useEffect(() => {
    if (currentLanguage !== language) {
      setCurrentLanguage(language);
      i18n.locale = language;
    }
  }, [language]);
  return (
    <BottomTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.main_color,
        tabBarStyle: {
          borderTopWidth: 1.5,
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
        },
        headerShown: false
      }}
      // screenOptions={{headerShown: false}}
      initialRouteName={Constants.SCREENS.MAIN.HOME}
    >
      <BottomTab.Screen
        name={i18n.t("Home")}
        component={Home}
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="home-outline" color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name={i18n.t("Booking")}
        component={Booking}
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="clipboard-outline" color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name={i18n.t("Inbox")}
        component={Inbox}
        options={{
          tabBarBadge: tools > 0 ? tools : undefined,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="chatbubble-outline" color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name={i18n.t("Account")}
        component={Account}
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="person-outline" color={color} />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return <Ionicons size={30} style={{ marginBottom: -3 }} {...props} />;
}
