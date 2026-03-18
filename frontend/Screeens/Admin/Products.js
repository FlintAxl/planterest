import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Searchbar } from "react-native-paper";
import ListItem from "./ListItem";

import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  cream:       "#F8F4EC",
  white:       "#FFFFFF",
  goldDeep:    "#A87B28",
  gold:        "#C9A84C",
  goldLight:   "rgba(201,168,76,0.14)",
  goldBorder:  "rgba(201,168,76,0.28)",
  greenDark:   "#0B1F10",
  greenMid:    "#1A5C2E",
  greenSoft:   "rgba(26,92,46,0.08)",
  greenBorder: "rgba(26,92,46,0.18)",
  mutedText:   "rgba(11,31,16,0.50)",
  cardBg:      "#FAFDF7",
};

// ─── Decorative elements ──────────────────────────────────────────────────────

/** Top-right stacked concentric rings */
const CornerRings = ({ color = C.goldBorder, size = 80 }) => {
  const rings = [1, 0.68, 0.42];
  return (
    <View style={{ position: "absolute", top: -size * 0.3, right: -size * 0.3, width: size, height: size }} pointerEvents="none">
      {rings.map((scale, i) => (
        <View key={i} style={{
          position: "absolute",
          width: size * scale, height: size * scale,
          borderRadius: (size * scale) / 2,
          borderWidth: 1, borderColor: color,
          top: (size - size * scale) / 2, left: (size - size * scale) / 2,
        }} />
      ))}
    </View>
  );
};

/** Gold ornamental divider */
const GoldDivider = ({ style }) => (
  <View style={[{ flexDirection: "row", alignItems: "center", marginVertical: 12 }, style]}>
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
    <View style={{ width: 5, height: 5, backgroundColor: C.gold, transform: [{ rotate: "45deg" }], marginHorizontal: 8 }} />
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
  </View>
);

/** Individual stat pill */
const StatPill = ({ value, label, icon, accent }) => (
  <View style={[statStyles.pill, { borderColor: accent + "44", backgroundColor: accent + "12" }]}>
    <View style={[statStyles.iconWrap, { backgroundColor: accent + "22" }]}>
      <Ionicons name={icon} size={14} color={accent} />
    </View>
    <Text style={[statStyles.value, { color: C.greenDark }]}>{value}</Text>
    <Text style={[statStyles.label, { color: C.mutedText }]}>{label}</Text>
  </View>
);
const statStyles = StyleSheet.create({
  pill: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    paddingVertical: 11, paddingHorizontal: 10,
    alignItems: "center", gap: 4,
  },
  iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  value:    { fontSize: 18, fontWeight: "900", letterSpacing: 0.3 },
  label:    { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
});

/** Nav chip button */
const NavChip = ({ icon, label, onPress }) => (
  <TouchableOpacity style={chipStyles.chip} onPress={onPress} activeOpacity={0.8}>
    <View style={chipStyles.iconCircle}>
      <Ionicons name={icon} size={14} color={C.gold} />
    </View>
    <Text style={chipStyles.label}>{label}</Text>
  </TouchableOpacity>
);
const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: 999, borderWidth: 1,
    borderColor: C.goldBorder, backgroundColor: C.goldLight,
  },
  iconCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(201,168,76,0.18)", alignItems: "center", justifyContent: "center",
  },
  label: { fontSize: 12, fontWeight: "800", color: C.greenMid, letterSpacing: 0.2 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Products = () => {
  const [productList,   setProductList]   = useState([]);
  const [productFilter, setProductFilter] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [token,         setToken]         = useState();
  const [refreshing,    setRefreshing]    = useState(false);
  const [searchText,    setSearchText]    = useState("");

  const navigation = useNavigation();

  const safeList   = Array.isArray(productList)   ? productList   : [];
  const safeFilter = Array.isArray(productFilter) ? productFilter : [];
  const discountedCount = safeList.filter((i) => i?.discount?.percentage > 0).length;
  const activeCount     = safeList.filter((i) => i?.isPublished !== false).length;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const searchProduct = (text) => {
    setSearchText(text);
    setProductFilter(
      text === ""
        ? safeList
        : safeList.filter((i) => i.name.toLowerCase().includes(text.toLowerCase()))
    );
  };

  const deleteProduct = (id) => {
    axios
      .delete(`${baseURL}products/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setProductFilter(safeFilter.filter((i) => (i.id || i._id) !== id));
        Toast.show({ topOffset: 60, type: "success", text1: "Product Deleted" });
      })
      .catch((e) => console.log(e));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      axios.get(`${baseURL}products`).then((res) => {
        setProductList(res.data);
        setProductFilter(
          searchText
            ? res.data.filter((i) => i.name.toLowerCase().includes(searchText.toLowerCase()))
            : res.data
        );
        setLoading(false);
      });
      setRefreshing(false);
    }, 900);
  }, [searchText]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("jwt").then((res) => setToken(res)).catch(console.log);
      axios.get(`${baseURL}products`).then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setProductList(list);
        setProductFilter(list);
        setLoading(false);
      });
      return () => { setProductList([]); setProductFilter([]); setLoading(true); };
    }, [])
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Background texture orbs ── */}
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />
      <View style={styles.orbMidRight} />

      {/* ════════════ CONTENT ════════════ */}
      {loading ? (
        <View style={styles.spinnerWrap}>
          <View style={styles.spinnerCard}>
            <ActivityIndicator size="large" color={C.gold} />
            <Text style={styles.spinnerText}>Loading inventory…</Text>
          </View>
        </View>
      ) : (
        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
          data={safeFilter}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <CornerRings />

              {/* Gold top bar */}
              <View style={styles.goldBar} />

              {/* Title block */}
              <View style={styles.titleBlock}>
                <View style={styles.titleBadge}>
                  <Text style={styles.titleBadgeText}>ADMIN</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.titleMain}>Inventory</Text>
                  <Text style={styles.titleSub}>Manage products, pricing & publishing</Text>
                </View>
              </View>

              <GoldDivider style={{ marginTop: 4 }} />

              {/* Stats row */}
              <View style={styles.statsRow}>
                <StatPill value={safeList.length}   label="Total"      icon="cube-outline"               accent={C.goldDeep} />
                <StatPill value={activeCount}        label="Published"  icon="checkmark-circle-outline" accent={C.greenMid} />
                <StatPill value={discountedCount}    label="On Sale"    icon="pricetag-outline"          accent="#B5650D" />
                <StatPill value={safeFilter.length}  label="Visible"    icon="eye-outline"               accent={C.gold} />
              </View>

              <GoldDivider />

              {/* Nav chips + CTA */}
              <View style={styles.actionRow}>
                <NavChip icon="bag-outline"      label="Orders"     onPress={() => navigation.navigate("Orders")} />
                <NavChip icon="pricetag-outline" label="Discounts"  onPress={() => navigation.navigate("Discounts")} />
                <NavChip icon="grid-outline"     label="Categories" onPress={() => navigation.navigate("Categories")} />
              </View>

              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => navigation.navigate("ProductForm")}
                activeOpacity={0.88}
              >
                <View style={styles.ctaIconCircle}>
                  <Ionicons name="add" size={18} color={C.greenDark} />
                </View>
                <Text style={styles.ctaText}>Add New Product</Text>
                <Ionicons name="chevron-forward-outline" size={15} color={C.greenDark} style={{ marginLeft: "auto", opacity: 0.6 }} />
              </TouchableOpacity>

              {/* Search */}
              <View style={styles.searchWrap}>
                <View style={styles.searchIconWrap}>
                  <Ionicons name="search-outline" size={16} color={C.gold} />
                </View>
                <Searchbar
                  placeholder="Search products…"
                  onChangeText={searchProduct}
                  value={searchText}
                  style={styles.searchBar}
                  inputStyle={styles.searchInput}
                  iconColor="transparent"
                  elevation={0}
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCard}>
                <CornerRings size={60} color="rgba(201,168,76,0.2)" />
                <View style={styles.emptyGoldBar} />

                <View style={styles.emptyIconCircle}>
                  <Ionicons name="leaf-outline" size={32} color={C.gold} />
                </View>
                <Text style={styles.emptyTitle}>No products found</Text>
                <GoldDivider style={{ marginVertical: 10, width: "60%", alignSelf: "center" }} />
                <Text style={styles.emptySubtitle}>
                  Try a different search term, or add your first product to get started.
                </Text>
                <TouchableOpacity
                  style={styles.emptyCtaBtn}
                  onPress={() => navigation.navigate("ProductForm")}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle-outline" size={16} color={C.greenDark} />
                  <Text style={styles.emptyCtaText}>Add a Product</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <ListItem item={item} index={index} deleteProduct={deleteProduct} />
          )}
          keyExtractor={(item) => item.id || item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.cream,
  },

  // ── Background orbs ──
  orbTopRight: {
    position: "absolute", top: -80, right: -60,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: "rgba(201,168,76,0.10)",
  },
  orbBottomLeft: {
    position: "absolute", bottom: 60, left: -80,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(26,92,46,0.08)",
  },
  orbMidRight: {
    position: "absolute", top: "45%", right: -40,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(201,168,76,0.07)",
  },

  // ── Header card ──
  headerCard: {
    marginHorizontal: 14, marginTop: 10, marginBottom: 10,
    backgroundColor: C.white, borderRadius: 22, overflow: "hidden",
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 22, paddingBottom: 16,
    shadowColor: "#071209",
    shadowOpacity: 0.12, shadowOffset: { width: 0, height: 8 }, shadowRadius: 18,
    elevation: 6,
  },
  goldBar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 4,
    backgroundColor: C.gold,
  },

  // Title
  titleBlock: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  titleBadge: {
    backgroundColor: C.greenDark, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3, marginTop: 4,
  },
  titleBadgeText: { fontSize: 9, fontWeight: "800", color: C.gold, letterSpacing: 1.8 },
  titleMain:    { fontSize: 24, fontWeight: "900", color: C.greenDark, letterSpacing: 0.2 },
  titleSub:     { fontSize: 11, color: C.mutedText, fontWeight: "500", marginTop: 3, letterSpacing: 0.2 },

  // Stats
  statsRow: { flexDirection: "row", gap: 8 },

  // Action chips row
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },

  // CTA button
  ctaButton: {
    backgroundColor: C.gold, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center", gap: 10,
    marginBottom: 14,
    shadowColor: "#5C3D00",
    shadowOpacity: 0.28, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
    elevation: 3,
  },
  ctaIconCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(11,31,16,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  ctaText: { fontSize: 14, fontWeight: "900", color: C.greenDark, letterSpacing: 0.3 },

  // Search
  searchWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.cream, borderRadius: 12,
    borderWidth: 1, borderColor: C.goldBorder, overflow: "hidden",
  },
  searchIconWrap: {
    width: 44, height: 44, alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderRightColor: C.goldBorder,
    backgroundColor: C.goldLight,
  },
  searchBar: {
    flex: 1, backgroundColor: "transparent",
    elevation: 0, height: 44, margin: 0, padding: 0,
  },
  searchInput: { fontSize: 13, color: C.greenDark, paddingLeft: 4 },

  // List
  listContent: { paddingTop: 4, paddingBottom: 24 },

  // Spinner
  spinnerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  spinnerCard: {
    backgroundColor: C.white, borderRadius: 20,
    paddingVertical: 28, paddingHorizontal: 40,
    alignItems: "center", gap: 14,
    borderWidth: 1, borderColor: C.goldBorder,
    shadowColor: "#000", shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4,
  },
  spinnerText: {
    fontSize: 13, fontWeight: "700",
    color: C.mutedText, letterSpacing: 0.4,
    fontStyle: "italic",
  },

  // Empty
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyCard: {
    width: "100%", backgroundColor: C.white, borderRadius: 22,
    paddingVertical: 32, paddingHorizontal: 24, alignItems: "center",
    overflow: "hidden", borderWidth: 1, borderColor: C.goldBorder,
    shadowColor: "#071209", shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 4,
  },
  emptyGoldBar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 4,
    backgroundColor: C.gold,
  },
  emptyIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.goldLight, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.goldBorder, marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: C.greenDark, letterSpacing: 0.3 },
  emptySubtitle: {
    fontSize: 13, color: C.mutedText, textAlign: "center",
    lineHeight: 20, fontStyle: "italic", paddingHorizontal: 8,
  },
  emptyCtaBtn: {
    marginTop: 18, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.gold, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 20,
    shadowColor: "#5C3D00", shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 7, elevation: 2,
  },
  emptyCtaText: { fontSize: 14, fontWeight: "900", color: C.greenDark, letterSpacing: 0.3 },
});

export default Products;