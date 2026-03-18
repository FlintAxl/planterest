import React, { useState, useCallback } from "react";
import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import ProductList from './ProductList';
import CategoryFilter from "./CategoryFilter";
import baseURL from "../../assets/common/baseurl";
import axios from "axios";

var { height } = Dimensions.get('window');

const ProductContainer = () => {
    const [products,         setProducts]         = useState([]);
    const [categories,       setCategories]       = useState([]);
    const [active,           setActive]           = useState([]);
    const [productsCtg,      setProductsCtg]      = useState([]);
    const [keyword,          setKeyword]          = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [priceRange,       setPriceRange]       = useState({ min: 0, max: 1000 });
    const [selectedMinPrice, setSelectedMinPrice] = useState(0);
    const [selectedMaxPrice, setSelectedMaxPrice] = useState(1000);

    const applyFilters = (allProducts, text, min, max, category) => {
        const normalizedText = (text || '').toLowerCase();
        const parsedMin = parseFloat(min);
        const parsedMax = parseFloat(max);
        const hasMin = !Number.isNaN(parsedMin);
        const hasMax = !Number.isNaN(parsedMax);
        setProductsCtg(allProducts.filter((item) => {
            const name       = item?.name ? item.name.toLowerCase() : '';
            const price      = parseFloat(item?.price);
            const categoryId = item?.category?.id || item?.category?._id;
            return (
                name.includes(normalizedText) &&
                (!hasMin || (!Number.isNaN(price) && price >= parsedMin)) &&
                (!hasMax || (!Number.isNaN(price) && price <= parsedMax)) &&
                (category === 'all' || categoryId === category)
            );
        }));
    };

    const searchProduct    = (text)  => { setKeyword(text); applyFilters(products, text, selectedMinPrice, selectedMaxPrice, selectedCategory); };
    const filterByMinPrice = (value) => { const n = Math.min(Math.floor(value), selectedMaxPrice); setSelectedMinPrice(n); applyFilters(products, keyword, n, selectedMaxPrice, selectedCategory); };
    const filterByMaxPrice = (value) => { const n = Math.max(Math.ceil(value), selectedMinPrice);  setSelectedMaxPrice(n); applyFilters(products, keyword, selectedMinPrice, n, selectedCategory); };
    const resetPriceRange  = ()      => { setSelectedMinPrice(priceRange.min); setSelectedMaxPrice(priceRange.max); applyFilters(products, keyword, priceRange.min, priceRange.max, selectedCategory); };
    const clearSearch      = ()      => { setKeyword(''); applyFilters(products, '', selectedMinPrice, selectedMaxPrice, selectedCategory); };
    const changeCtg        = (ctg)   => { setSelectedCategory(ctg); applyFilters(products, keyword, selectedMinPrice, selectedMaxPrice, ctg); };

    useFocusEffect(useCallback(() => {
        setActive(-1); setSelectedCategory('all'); setKeyword('');
        axios.get(`${baseURL}products`).then((res) => {
            setProducts(res.data); setProductsCtg(res.data);
            const prices = res.data.map(p => Number(p?.price)).filter(p => !Number.isNaN(p));
            if (prices.length > 0) {
                const mn = Math.floor(Math.min(...prices)), mx = Math.ceil(Math.max(...prices));
                setPriceRange({ min: mn, max: mx }); setSelectedMinPrice(mn); setSelectedMaxPrice(mx);
                applyFilters(res.data, '', mn, mx, 'all');
            } else applyFilters(res.data, '', 0, 1000, 'all');
        }).catch(() => console.log('Api call error'));
        axios.get(`${baseURL}categories`).then(res => setCategories(res.data)).catch(() => console.log('Api categories call error'));
        return () => { setProducts([]); setCategories([]); setActive(); };
    }, []));

    return (
        <View style={styles.root}>
            {/* Everything scrolls together */}
            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── SEARCH + PRICE FILTER — now inside scroll ── */}
                <View style={styles.searchContainer}>
                    {/* Gold top hairline */}
                    <View style={styles.goldLine} />

                    {/* Search bar — WHITE background */}
                    <Searchbar
                        placeholder="Search plants..."
                        onChangeText={searchProduct}
                        value={keyword}
                        onClearIconPress={clearSearch}
                        style={styles.searchBar}
                        inputStyle={styles.searchInput}
                        iconColor="#C9A84C"
                        placeholderTextColor="rgba(11,31,16,0.38)"
                    />

                    {/* Slider card — WHITE background */}
                    <View style={styles.sliderContainer}>
                        <View style={styles.priceHeaderRow}>
                            <Text style={styles.rangeText}>
                                Price: ${selectedMinPrice} – ${selectedMaxPrice}
                            </Text>
                            <TouchableOpacity style={styles.resetButton} onPress={resetPriceRange} activeOpacity={0.8}>
                                <Text style={styles.resetButtonText}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sliderLabel}>Min Price</Text>
                        <Slider
                            minimumValue={priceRange.min}
                            maximumValue={priceRange.max}
                            value={selectedMinPrice}
                            onValueChange={filterByMinPrice}
                            step={1}
                            disabled={priceRange.min === priceRange.max}
                            minimumTrackTintColor="#C9A84C"
                            maximumTrackTintColor="rgba(201,168,76,0.22)"
                            thumbTintColor="#C9A84C"
                        />

                        <Text style={styles.sliderLabel}>Max Price</Text>
                        <Slider
                            minimumValue={priceRange.min}
                            maximumValue={priceRange.max}
                            value={selectedMaxPrice}
                            onValueChange={filterByMaxPrice}
                            step={1}
                            disabled={priceRange.min === priceRange.max}
                            minimumTrackTintColor="#C9A84C"
                            maximumTrackTintColor="rgba(201,168,76,0.22)"
                            thumbTintColor="#C9A84C"
                        />
                    </View>
                </View>

                {/* ── CATEGORY FILTER ── */}
                <CategoryFilter
                    categories={categories}
                    categoryFilter={changeCtg}
                    productsCtg={productsCtg}
                    active={active}
                    setActive={setActive}
                />

                {/* ── PRODUCT GRID ── */}
                {productsCtg.length > 0 ? (
                    <View style={styles.listContainer}>
                        {productsCtg.map((item) => (
                            <ProductList key={item.id} item={item} />
                        ))}
                    </View>
                ) : (
                    <View style={[styles.center, { height: height / 2 }]}>
                        <Text style={styles.emptyText}>No products found</Text>
                    </View>
                )}

                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scroll: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    searchContainer: {
        paddingHorizontal: 12,
        paddingTop: 4,
        paddingBottom: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(201,168,76,0.28)',
        gap: 8,
    },
    goldLine: {
        height: 2,
        backgroundColor: '#C9A84C',
        opacity: 0.55,
        borderRadius: 1,
        marginBottom: 6,
    },
    searchBar: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.35)',
        elevation: 0,
        height: 40,
    },
    searchInput: {
        color: '#1C2510',
        fontSize: 13,
    },
    sliderContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.30)',
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 4,
    },
    priceHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    rangeText: {
        color: '#1C2510',
        fontSize: 12,
        fontWeight: '700',
    },
    sliderLabel: {
        color: 'rgba(11,31,16,0.52)',
        fontSize: 10,
        marginTop: 1,
        letterSpacing: 0.2,
    },
    resetButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 7,
        backgroundColor: 'rgba(201,168,76,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.38)',
    },
    resetButtonText: {
        color: '#A87B28',
        fontSize: 11,
        fontWeight: '700',
    },
    listContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        backgroundColor: '#FFFFFF',
        paddingBottom: 20,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: 'rgba(11,31,16,0.40)',
        fontSize: 13,
    },
});

export default ProductContainer;