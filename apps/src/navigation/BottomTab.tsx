import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "../redux/hooks";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import Constants from "../shared/Constants";
import { Account, Booking, Home, Inbox } from "../screens/Main";
import colors from "../shared/Colors";
import i18n from "../shared/I18n";

import { tabLabel, TAB_ROUTES } from "./routes";

const BottomTab = createBottomTabNavigator();
export default function BottomTabNavigator() {
  const tools = useAppSelector((state) => state.tools.notification);
  const language = useAppSelector((state) => state.language.language);
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
        name={TAB_ROUTES.HOME}
        component={Home}
        options={{
          tabBarLabel: tabLabel(TAB_ROUTES.HOME),
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="home-outline" color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name={TAB_ROUTES.BOOKING}
        component={Booking}
        options={{
          tabBarLabel: tabLabel(TAB_ROUTES.BOOKING),
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="clipboard-outline" color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name={TAB_ROUTES.INBOX}
        component={Inbox}
        options={{
          tabBarLabel: tabLabel(TAB_ROUTES.INBOX),
          tabBarBadge: tools > 0 ? tools : undefined,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="chatbubble-outline" color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name={TAB_ROUTES.ACCOUNT}
        component={Account}
        options={{
          tabBarLabel: tabLabel(TAB_ROUTES.ACCOUNT),
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
