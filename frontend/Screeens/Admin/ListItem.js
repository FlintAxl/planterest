import React, { useState } from "react";
import {
    View,
    StyleSheet,
    Text,
    Image,
    TouchableOpacity,
    Dimensions,
    Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native"
import EasyButton from "../../Shared/StyledComponents/EasyButton";

var { width } = Dimensions.get("window");

const ListItem = ({ item, index, deleteProduct }) => {
    const [modalVisible, setModalVisible] = useState(false)
    const navigation = useNavigation()

    const COLORS = {
        white: "#FFFFFF",
        text: "#123018",
        muted: "rgba(18,48,24,0.65)",
        border: "rgba(46,125,50,0.18)",
        primary: "#2E7D32",
        primarySoft: "rgba(46,125,50,0.08)",
    };

    return (
        <View>
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false)
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <TouchableOpacity
                            underlayColor="#E8E8E8"
                            onPress={() => {
                                setModalVisible(false)
                            }}
                            style={{
                                alignSelf: "flex-end",
                                position: "absolute",
                                top: 5,
                                right: 10
                            }}
                        >
                            <Ionicons name="close" size={20} color={COLORS.text} />
                        </TouchableOpacity>

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle} numberOfLines={1}>
                                {item?.name || "Product"}
                            </Text>
                            <Text style={styles.modalSubtitle} numberOfLines={1}>
                                {item?.brand ? `${item.brand} • ` : ""}{item?.category?.name || "Uncategorized"}
                            </Text>
                        </View>
                        <EasyButton
                            medium
                            secondary
                            onPress={() => [navigation.navigate("ProductForm", { item }),
                            setModalVisible(false)
                            ]}
                            title="Edit"
                        >
                            <Text style={styles.textStyle}>Edit</Text>
                        </EasyButton>
                        <EasyButton
                            medium
                            danger
                            onPress={() => [
                                deleteProduct(item.id || item._id),
                                setModalVisible(false)]}
                            title="delete"
                        >
                            <Text style={styles.textStyle}>Delete</Text>
                        </EasyButton>

                    </View>
                </View>
            </Modal>
            <TouchableOpacity
                onPress={() => {

                    navigation.navigate('Home', { screen: 'Product Detail', params: { item } })
                }}
                onLongPress={() => setModalVisible(true)}
                activeOpacity={0.9}
                style={styles.container}
            >
                <View style={styles.left}>
                    <View style={styles.indexPill}>
                        <Text style={styles.indexText}>{(index ?? 0) + 1}</Text>
                    </View>
                    <Image
                        source={{
                            uri: item?.image ? item.image : undefined
                        }}
                        resizeMode="cover"
                        style={styles.image}
                    />
                    <View style={styles.titleCol}>
                        <Text style={styles.name} numberOfLines={1}>
                            {item?.name || "Unnamed product"}
                        </Text>
                        <Text style={styles.meta} numberOfLines={1}>
                            {item?.brand || "—"} • {item?.category?.name || "Uncategorized"}
                        </Text>
                    </View>
                </View>

                <View style={styles.right}>
                    <View style={styles.pricePill}>
                        <Text style={styles.price}>${item?.price ?? "—"}</Text>
                    </View>
                    {!!item?.discount?.percentage && item?.discount?.percentage > 0 && (
                        <View style={styles.discountPill}>
                            <Text style={styles.discountText}>{item.discount.percentage}% OFF</Text>
                        </View>
                    )}
                    <Ionicons name="ellipsis-vertical" size={16} color={COLORS.muted} />
                </View>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 12,
        width: width - 20,
        marginHorizontal: 10,
        marginVertical: 6,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "rgba(46,125,50,0.16)",
        borderRadius: 14,
        elevation: 2,
        shadowColor: "#17331f",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 10,
    },
    indexPill: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(46,125,50,0.14)",
        borderWidth: 1,
        borderColor: "rgba(46,125,50,0.2)",
    },
    indexText: {
        fontSize: 10,
        color: "#2E7D32",
        fontWeight: "900",
    },
    image: {
        borderRadius: 12,
        width: 44,
        height: 44,
        backgroundColor: "rgba(46,125,50,0.08)",
    },
    titleCol: {
        flex: 1,
    },
    name: {
        fontSize: 14,
        fontWeight: "800",
        color: "#123018",
    },
    meta: {
        marginTop: 2,
        fontSize: 12,
        fontWeight: "600",
        color: "rgba(18,48,24,0.65)",
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginLeft: 10,
    },
    pricePill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "rgba(46,125,50,0.10)",
        borderWidth: 1,
        borderColor: "rgba(46,125,50,0.18)",
    },
    price: {
        fontSize: 12,
        fontWeight: "900",
        color: "#2E7D32",
    },
    discountPill: {
        paddingHorizontal: 7,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: "rgba(255,152,0,0.14)",
        borderWidth: 1,
        borderColor: "rgba(255,152,0,0.36)",
    },
    discountText: {
        fontSize: 10,
        fontWeight: "900",
        color: "#D97D00",
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.35)",
        padding: 16,
    },
    modalView: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: "white",
        borderRadius: 22,
        padding: 18,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(46,125,50,0.18)",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    modalHeader: {
        width: "100%",
        paddingBottom: 12,
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(46,125,50,0.12)",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "900",
        color: "#123018",
        paddingRight: 22,
    },
    modalSubtitle: {
        marginTop: 3,
        fontSize: 12,
        fontWeight: "700",
        color: "rgba(18,48,24,0.65)",
        paddingRight: 22,
    },
    textStyle: {
        color: "white",
        fontWeight: "bold"
    }
})

export default ListItem;