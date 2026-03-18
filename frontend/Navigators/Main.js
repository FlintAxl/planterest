import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, Platform } from "react-native";

import HomeNavigator from "./HomeNavigator";
import CartNavigator from "./CartNavigator";
import UserNavigator from "./UserNavigator";
import AdminNavigator from "./AdminNavigator";
import { Ionicons } from "@expo/vector-icons";
import CartIcon from "../Shared/CartIcon";
import AuthGlobal from "../Context/Store/AuthGlobal";

const Tab = createBottomTabNavigator();

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  white:       "#FFFFFF",
  cream:       "#F8F4EC",
  gold:        "#C9A84C",
  goldDeep:    "#A87B28",
  goldLight:   "rgba(201,168,76,0.14)",
  goldBorder:  "rgba(201,168,76,0.30)",
  greenDark:   "#0B1F10",
  greenMid:    "#1A5C2E",
  greenSoft:   "rgba(26,92,46,0.09)",
  inactive:    "rgba(11,31,16,0.35)",
  shadow:      "#071209",
};

// ─── Tab Item ─────────────────────────────────────────────────────────────────
const TabItem = ({ iconName, label, color, size, focused, showCartBadge = false }) => {
  return (
    <View style={tab.wrap}>

      {/* Active indicator dot above icon */}
      <View style={[tab.topDot, focused && tab.topDotActive]} />

      {/* Icon container */}
      <View style={[tab.iconWrap, focused && tab.iconWrapActive]}>

        {/* Decorative ring when focused */}
        {focused && <View style={tab.ring} />}

        <Ionicons
          name={iconName}
          color={focused ? C.greenDark : C.inactive}
          size={focused ? 21 : 20}
        />
        {showCartBadge && <CartIcon />}
      </View>

      {/* Label */}
      <Text style={[tab.label, focused && tab.labelActive]}>{label}</Text>

      {/* Active underline pill */}
      {focused && <View style={tab.underline} />}
    </View>
  );
};

const tab = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 4,
    minWidth: 60,
  },

  // Top indicator dot
  topDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: "transparent",
    marginBottom: 2,
  },
  topDotActive: {
    backgroundColor: C.gold,
  },

  // Icon wrap
  iconWrap: {
    width: 44, height: 36, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  iconWrapActive: {
    backgroundColor: C.goldLight,
    borderWidth: 1,
    borderColor: C.goldBorder,
    shadowColor: C.gold,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },

  // Decorative ring inside active chip
  ring: {
    position: "absolute",
    width: 38, height: 30, borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.40)",
  },

  // Label
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: C.inactive,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: C.greenMid,
    fontWeight: "900",
  },

  // Bottom underline pill
  underline: {
    marginTop: 1,
    width: 16, height: 2, borderRadius: 1,
    backgroundColor: C.gold,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const Main = () => {
  const context = useContext(AuthGlobal);
  const isAdmin = context.stateUser?.user?.isAdmin;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarActiveTintColor: C.greenMid,
        tabBarInactiveTintColor: C.inactive,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabItem iconName={focused ? "home" : "home-outline"} label="Home" color={color} size={size} focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Cart Screen"
        component={CartNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabItem iconName={focused ? "cart" : "cart-outline"} label="Cart" color={color} size={size} focused={focused} showCartBadge />
          ),
        }}
      />

      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminNavigator}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size, focused }) => (
              <TabItem iconName={focused ? "grid" : "grid-outline"} label="Admin" color={color} size={size} focused={focused} />
            ),
          }}
        />
      )}

      <Tab.Screen
        name="User"
        component={UserNavigator}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabItem iconName={focused ? "person" : "person-outline"} label="Profile" color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ─── Tab bar styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.white,
    borderTopWidth: 0,
    height: Platform.OS === "ios" ? 82 : 68,
    paddingBottom: Platform.OS === "ios" ? 18 : 8,
    paddingTop: 0,

    // Gold top accent line
    borderTopColor: C.goldBorder,
    borderTopWidth: 1.5,

    // Rich shadow
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 12,
  },
  tabBarItem: {
    paddingTop: 2,
  },
});

export default Main;