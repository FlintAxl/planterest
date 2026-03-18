import React from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native'

import { FlatList, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
var { width } = Dimensions.get("window")

const SearchedProduct = ({ productsFiltered }) => {
    const navigation = useNavigation();
    return (

        <View style={{ width: width, backgroundColor: '#45573c', flex: 1 }}>
            {productsFiltered.length > 0 ? (
                <FlatList
                    data={productsFiltered}
                    numColumns={2}
                    contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8 }}
                    renderItem={({ item }) =>
                        <TouchableOpacity
                            style={styles.searchItem}
                            onPress={() => navigation.navigate("Product Detail", { item })}
                            activeOpacity={0.8}
                        >
                            <Image
                                source={{
                                    uri: item.image
                                        ? item.image
                                        : 'https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png'
                                }}
                                style={styles.searchImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.searchName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.searchDesc} numberOfLines={1}>{item.description}</Text>
                            <Text style={styles.searchPrice}>${item.price}/-</Text>
                        </TouchableOpacity>
                    }
                    keyExtractor={item => item._id}
                />
            ) : (
                <View style={styles.center}>
                    <Text style={{ alignSelf: 'center', color: 'rgba(255,255,255,0.5)' }}>
                        No products match the selected criteria
                    </Text>
                </View>
            )}
        </View >

    );
};


const styles = StyleSheet.create({
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 100
    },
    searchItem: {
        flex: 1,
        margin: 6,
        backgroundColor: '#5B6B48',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    searchImage: {
        width: '100%',
        height: 80,
        marginBottom: 8,
    },
    searchName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    searchDesc: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        marginBottom: 6,
    },
    searchPrice: {
        color: '#4CAF50',
        fontWeight: 'bold',
        fontSize: 15,
    },
    listContainer: {
        // height: height,
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-start",
        flexWrap: "wrap",
        backgroundColor: "gainsboro",
    },
})

export default SearchedProduct;