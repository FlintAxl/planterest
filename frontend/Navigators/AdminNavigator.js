import React from "react"
import { createStackNavigator } from "@react-navigation/stack"

import Orders from "../Screeens/Admin/Orders";
import Products from "../Screeens/Admin/Products";
import ProductForm from "../Screeens/Admin/ProductForm";
import Categories from "../Screeens/Admin/Categories"
import Discounts from "../Screeens/Admin/Discounts"

const Stack = createStackNavigator();

const AdminNavigator = () => {

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    height: 64,
                    backgroundColor: "#FFFFFF",
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTitleStyle: {
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#123018",
                },
                headerTitleAlign: "left",
                headerTintColor: "#2E7D32",
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen
                name="Products"
                component={Products}
                options={{
                    title: "Products"
                }}
            />
            <Stack.Screen name="Categories" component={Categories} options={{ title: "Categories" }} />
            <Stack.Screen name="Orders" component={Orders} options={{ title: "Orders" }} />
            <Stack.Screen name="ProductForm" component={ProductForm} options={{ title: "Product" }} />
            <Stack.Screen name="Discounts" component={Discounts} options={{ title: "Manage Discounts" }} />
        </Stack.Navigator>
    )
}
export default AdminNavigator