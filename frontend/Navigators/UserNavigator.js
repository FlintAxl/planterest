import React from "react";
import { createStackNavigator } from '@react-navigation/stack'

import Login from "../Screeens/User/Login";
import Register from "../Screeens/User/Register";
import UserProfile from "../Screeens/User/UserProfile";
import MyOrders from "../Screeens/User/MyOrders";
import OrderDetails from "../Screeens/User/OrderDetails";
const Stack = createStackNavigator();

const UserNavigator = (props) => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Login"
                component={Login}
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="Register"
                component={Register}
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="User Profile"
                component={UserProfile}
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="My Orders"
                component={MyOrders}
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="Order Details"
                component={OrderDetails}
                options={{
                    headerShown: false
                }}
            />
        </Stack.Navigator>
    )

}

export default UserNavigator;