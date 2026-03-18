import React, { useContext } from 'react';
import {
    StyleSheet,
    View,
    Dimensions,
    Image,
    Text,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { addToCart } from '../../Redux/Actions/cartActions';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AuthGlobal from '../../Context/Store/AuthGlobal';

var { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 24;

const ProductCard = (props) => {
    const { name, price, image, countInStock, description, discount } = props;
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const context = useContext(AuthGlobal);

    const hasActiveDiscount = discount &&
        discount.percentage > 0 &&
        new Date(discount.endDate) > new Date();
    const discountedPrice = hasActiveDiscount
        ? (price * (100 - discount.percentage) / 100).toFixed(2)
        : price;

    const handleAddToCart = () => {
        if (!context?.stateUser?.isAuthenticated) {
            Toast.show({ topOffset: 60, type: "info", text1: "Please log in first", text2: "Log in to add products to your cart" });
            navigation.navigate("User", { screen: "Login" });
            return;
        }
        dispatch(addToCart({
            ...props,
            price: hasActiveDiscount ? discountedPrice : price,
            originalPrice: hasActiveDiscount ? price : null,
            discountPercentage: hasActiveDiscount ? discount.percentage : 0,
            quantity: 1
        }, context.stateUser?.user?.userId));
        Toast.show({ topOffset: 60, type: "success", text1: `${name} added to Cart`, text2: "Go to your cart to complete order" });
    };

    return (
        <View style={styles.container}>
            {/* Gold outline top bar */}
            <View style={styles.goldTopBar} />

            {/* Product Image */}
            <View style={styles.imageWrapper}>
                <Image
                    style={styles.image}
                    resizeMode="contain"
                    source={{ uri: image || 'https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png' }}
                />
            </View>

            {/* Product Info */}
            <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={1}>{name}</Text>
                <Text style={styles.description} numberOfLines={2}>
                    {description
                        ? description.length > 40 ? description.substring(0, 40) + '...' : description
                        : 'Premium quality plant'}
                </Text>

                {/* Price & Cart Row */}
                <View style={styles.bottomRow}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>${discountedPrice}/-</Text>
                        {hasActiveDiscount && (
                            <Text style={styles.originalPrice}>${price}/-</Text>
                        )}
                    </View>
                    {countInStock > 0 ? (
                        <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
                            <Ionicons name="bag-add-outline" size={18} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.unavailableBadge}>
                            <Text style={styles.unavailableText}>Out</Text>
                        </View>
                    )}
                </View>

                {hasActiveDiscount && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{discount.percentage}% OFF</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        backgroundColor: '#4A5C38',       // olive green main
        borderRadius: 20,
        marginTop: 50,
        marginBottom: 8,
        marginHorizontal: 6,
        borderWidth: 1.5,
        borderColor: '#C9A84C',           // gold outline
        overflow: 'visible',
        shadowColor: '#C9A84C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },

    // Thin extra gold bar at very top
    goldTopBar: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        backgroundColor: '#C9A84C',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        opacity: 0.85,
    },

    imageWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        height: CARD_WIDTH * 0.7,
        marginTop: -40,
    },
    image: {
        width: CARD_WIDTH * 0.8,
        height: CARD_WIDTH * 0.8,
    },

    infoContainer: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        paddingTop: 4,
    },
    title: {
        fontWeight: 'bold',
        fontStyle: 'italic',
        fontSize: 15,
        color: '#FFFFFF',
        marginBottom: 4,
    },
    description: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.60)',
        lineHeight: 15,
        marginBottom: 10,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceContainer: {
        flex: 1,
    },
    price: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#C9A84C',               // gold price
    },
    originalPrice: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.40)',
        textDecorationLine: 'line-through',
        marginTop: 2,
    },

    discountBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#C9A84C',     // gold badge
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 8,
        marginRight: 8,
    },
    discountText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#2C3A1E',               // dark olive text on gold
    },

    // Gold-bordered cart button
    cartButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: 'rgba(201,168,76,0.20)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C9A84C',
    },

    unavailableBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(255,82,82,0.20)',
    },
    unavailableText: {
        fontSize: 11,
        color: '#FF5252',
        fontWeight: '600',
    },
});

export default ProductCard;