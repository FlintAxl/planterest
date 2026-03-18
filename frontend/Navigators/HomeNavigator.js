import React from 'react'
import { createStackNavigator } from "@react-navigation/stack"
// import { Stack } from 'expo-router';
import ProductContainer from '../Screeens/Product/ProductContainer';
import SingleProduct from '../Screeens/Product/SingleProduct';
import ProductForm from '../Screeens/Admin/ProductForm';

const Stack = createStackNavigator()
function MyStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name='Main'
                component={ProductContainer}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name='Product Detail'
                component={SingleProduct}
                options={{
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name='ProductForm'
                component={ProductForm}
                options={{
                    headerShown: true,
                    title: 'Edit Product',
                }}
            />

        </Stack.Navigator>
    )
}

export default function HomeNavigator() {
    return <MyStack />;
}