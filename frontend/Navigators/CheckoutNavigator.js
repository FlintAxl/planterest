import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';

import Checkout from '../Screeens/Checkout/Checkout';
import Payment from '../Screeens/Checkout/Payment';
import Confirm from '../Screeens/Checkout/Confirm';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:         '#F8F4EC',
  white:      '#FFFFFF',
  gold:       '#C9A84C',
  goldDeep:   '#A87B28',
  goldLight:  'rgba(201,168,76,0.13)',
  goldBorder: 'rgba(201,168,76,0.28)',
  greenDark:  '#0B1F10',
  greenMid:   '#1A5C2E',
  mutedText:  'rgba(11,31,16,0.42)',
};

const Tab = createMaterialTopTabNavigator();

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { name: 'Shipping', icon: 'location-outline',  activeIcon: 'location',         step: '01' },
  { name: 'Payment',  icon: 'card-outline',       activeIcon: 'card',             step: '02' },
  { name: 'Confirm',  icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle', step: '03' },
];

// ─── Custom tab label ─────────────────────────────────────────────────────────
const TabLabel = ({ name, focused, icon, activeIcon, step }) => (
  <View style={[label.wrap, focused && label.wrapFocused]}>
    {/* Step number */}
    <View style={[label.stepBadge, focused && label.stepBadgeFocused]}>
      <Text style={[label.stepText, focused && label.stepTextFocused]}>{step}</Text>
    </View>

    {/* Icon */}
    <Ionicons
      name={focused ? activeIcon : icon}
      size={16}
      color={focused ? C.greenDark : C.mutedText}
    />

    {/* Name */}
    <Text style={[label.text, focused && label.textFocused]}>{name}</Text>

    {/* Active dot */}
    {focused && <View style={label.dot} />}
  </View>
);

const label = StyleSheet.create({
  wrap: {
    alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 4,
  },
  wrapFocused: {},
  stepBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.goldLight,
    borderWidth: 1, borderColor: C.goldBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBadgeFocused: {
    backgroundColor: C.gold,
    borderColor: C.goldDeep,
  },
  stepText:       { fontSize: 8, fontWeight: '900', color: C.mutedText, letterSpacing: 0.5 },
  stepTextFocused:{ color: C.greenDark },
  text:           { fontSize: 10, fontWeight: '700', color: C.mutedText, letterSpacing: 0.3 },
  textFocused:    { color: C.greenMid, fontWeight: '900' },
  dot: {
    width: 14, height: 3, borderRadius: 1.5,
    backgroundColor: C.gold, marginTop: 2,
  },
});

// ─── Progress connector between steps ────────────────────────────────────────
// (rendered as a decorative overlay inside the tab bar via tabBarStyle padding)

function MyTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tabCfg = TABS.find(t => t.name === route.name);
        return {
          tabBarLabel: ({ focused }) => (
            <TabLabel focused={focused} {...tabCfg} />
          ),
          tabBarShowIcon: false,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabBarItem,
          tabBarIndicatorStyle: styles.indicator,
          tabBarPressColor: 'rgba(201,168,76,0.08)',
          tabBarActiveTintColor: C.greenMid,
          tabBarInactiveTintColor: C.mutedText,
        };
      }}
    >
      {TABS.map(t => (
        <Tab.Screen key={t.name} name={t.name} component={
          t.name === 'Shipping' ? Checkout :
          t.name === 'Payment'  ? Payment  : Confirm
        } />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.white,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: C.goldBorder,
    height: 72,

    // Subtle gold top accent
    borderTopWidth: 3,
    borderTopColor: C.gold,
  },
  tabBarItem: {
    paddingVertical: 0,
    height: 72,
    justifyContent: 'center',
  },
  indicator: {
    backgroundColor: C.greenMid,
    height: 3,
    borderRadius: 2,
    bottom: 0,
  },
});

export default function CheckoutNavigator() {
  return <MyTabs />;
}