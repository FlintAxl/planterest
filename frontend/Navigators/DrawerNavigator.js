import * as React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createDrawerNavigator,

} from "@react-navigation/drawer";

import Main from "./Main";

import DrawerContent from "../Shared/DrawerContent";

const NativeDrawer = createDrawerNavigator();
const DrawerNavigator = () => {
  return (

    <NativeDrawer.Navigator
      screenOptions={{
        drawerStyle: {
          width: '70%',
          backgroundColor: '#45573c',
        },
        headerShown: false,
        drawerActiveTintColor: '#4CAF50',
        drawerInactiveTintColor: 'rgba(255,255,255,0.7)',
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
        },
      }}

      drawerContent={() => <DrawerContent />}>
      <NativeDrawer.Screen name="MainTabs" component={Main} />

    </NativeDrawer.Navigator>


  );
}
export default DrawerNavigator