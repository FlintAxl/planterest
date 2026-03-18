import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Searchbar } from "react-native-paper";

import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

var { height, width } = Dimensions.get("window");

// ─── Palette (matches OrderCard + Products) ───────────────────────────────────
const C = {
  cream:       "#F8F4EC",
  white:       "#FFFFFF",
  gold:        "#C9A84C",
  goldDeep:    "#A87B28",
  goldLight:   "rgba(201,168,76,0.13)",
  goldBorder:  "rgba(201,168,76,0.26)",
  greenDark:   "#0B1F10",
  greenMid:    "#1A5C2E",
  greenSoft:   "rgba(26,92,46,0.08)",
  greenBorder: "rgba(26,92,46,0.18)",
  mutedText:   "rgba(11,31,16,0.50)",
  cardBg:      "#FAFDF7",
  amber:       "#B5650D",
  amberLight:  "rgba(181,101,13,0.12)",
  red:         "#8B1A1A",
  redLight:    "rgba(139,26,26,0.10)",
};

// ─── Shared decorative components ─────────────────────────────────────────────

const GoldBar = () => (
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: C.gold }} />
);

const GoldDivider = ({ style }) => (
  <View style={[{ flexDirection: "row", alignItems: "center", marginVertical: 12 }, style]}>
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
    <View style={{ width: 5, height: 5, backgroundColor: C.gold, transform: [{ rotate: "45deg" }], marginHorizontal: 8 }} />
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
  </View>
);

const CornerRings = ({ size = 72, color = C.goldBorder }) => (
  <View style={{ position: "absolute", top: -size * 0.3, right: -size * 0.3, width: size, height: size }} pointerEvents="none">
    {[1, 0.68, 0.4].map((s, i) => (
      <View key={i} style={{
        position: "absolute",
        width: size * s, height: size * s, borderRadius: (size * s) / 2,
        borderWidth: 1, borderColor: color,
        top: (size - size * s) / 2, left: (size - size * s) / 2,
      }} />
    ))}
  </View>
);

const StatPill = ({ value, label, icon, accent }) => (
  <View style={[sp.pill, { borderColor: accent + "44", backgroundColor: accent + "14" }]}>
    <View style={[sp.iconWrap, { backgroundColor: accent + "22" }]}>
      <Ionicons name={icon} size={13} color={accent} />
    </View>
    <Text style={[sp.value, { color: C.greenDark }]}>{value}</Text>
    <Text style={[sp.label, { color: C.mutedText }]}>{label}</Text>
  </View>
);
const sp = StyleSheet.create({
  pill:    { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: "center", gap: 3 },
  iconWrap:{ width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  value:   { fontSize: 17, fontWeight: "900", letterSpacing: 0.2 },
  label:   { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
});

// ─── Labeled input ────────────────────────────────────────────────────────────
const FormField = ({ icon, label, value, onChange, placeholder, suffix }) => (
  <View style={ff.wrap}>
    <View style={ff.labelRow}>
      <View style={ff.iconPip}><Ionicons name={icon} size={11} color={C.gold} /></View>
      <Text style={ff.label}>{label}</Text>
      {suffix && <Text style={ff.suffix}>{suffix}</Text>}
    </View>
    <TextInput
      style={ff.input}
      placeholder={placeholder}
      placeholderTextColor="rgba(11,31,16,0.32)"
      keyboardType="numeric"
      value={value}
      onChangeText={onChange}
      maxLength={3}
    />
  </View>
);
const ff = StyleSheet.create({
  wrap:     { marginBottom: 14 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 },
  iconPip:  { width: 20, height: 20, borderRadius: 10, backgroundColor: C.goldLight, alignItems: "center", justifyContent: "center" },
  label:    { fontSize: 10, fontWeight: "800", color: C.greenMid, textTransform: "uppercase", letterSpacing: 0.9, flex: 1 },
  suffix:   { fontSize: 10, color: C.mutedText, fontStyle: "italic" },
  input:    {
    backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: "700", color: C.greenDark,
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 1,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const Discounts = () => {
  const [productList,        setProductList]        = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [token,              setToken]              = useState();
  const [refreshing,         setRefreshing]         = useState(false);
  const [selectedProducts,   setSelectedProducts]   = useState([]);
  const [searchQuery,        setSearchQuery]        = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountDays,       setDiscountDays]       = useState("");
  const [applying,           setApplying]           = useState(false);

  const safeList        = Array.isArray(productList) ? productList : [];
  const discountedCount = safeList.filter((i) => i?.discount?.percentage > 0).length;
  const filteredList    = safeList.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const allSelected     = filteredList.length > 0 && selectedProducts.length === filteredList.length;

  const toggleSelect = (id) =>
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () =>
    setSelectedProducts(allSelected ? [] : filteredList.map((p) => p.id || p._id));

  const fetchProducts = () => {
    axios.get(`${baseURL}products`)
      .then((res) => { setProductList(Array.isArray(res.data) ? res.data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const applyDiscount = () => {
    if (!selectedProducts.length) { Toast.show({ topOffset: 60, type: "error", text1: "No Products Selected" }); return; }
    if (!discountPercentage || +discountPercentage < 0 || +discountPercentage > 100) {
      Toast.show({ topOffset: 60, type: "error", text1: "Invalid Percentage", text2: "Enter a value between 0–100" }); return;
    }
    if (!discountDays || +discountDays < 0) {
      Toast.show({ topOffset: 60, type: "error", text1: "Invalid Duration" }); return;
    }
    Alert.alert(
      "Apply Discount?",
      `Apply ${discountPercentage}% to ${selectedProducts.length} product(s) for ${discountDays} day(s)?`,
      [{ text: "Cancel", style: "cancel" }, {
        text: "Apply", onPress: () => {
          setApplying(true);
          axios.put(`${baseURL}products/apply-discount`,
            { productIds: selectedProducts, discountPercentage: parseFloat(discountPercentage), discountDays: parseInt(discountDays) },
            { headers: { Authorization: `Bearer ${token}` } }
          ).then((res) => {
            Toast.show({ topOffset: 60, type: "success", text1: "Discount Applied", text2: `${res.data.modifiedCount} product(s) updated` });
            setSelectedProducts([]); setDiscountPercentage(""); setDiscountDays(""); fetchProducts();
          }).catch((e) => Toast.show({ topOffset: 60, type: "error", text1: "Error", text2: e.response?.data || e.message }))
            .finally(() => setApplying(false));
        }
      }]
    );
  };

  const removeDiscount = () => {
    if (!selectedProducts.length) { Toast.show({ topOffset: 60, type: "error", text1: "No Products Selected" }); return; }
    Alert.alert("Remove Discount?", `Remove from ${selectedProducts.length} product(s)?`,
      [{ text: "Cancel", style: "cancel" }, {
        text: "Remove", onPress: () => {
          setApplying(true);
          axios.put(`${baseURL}products/remove-discount`, { productIds: selectedProducts }, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
              Toast.show({ topOffset: 60, type: "success", text1: "Discount Removed", text2: `${res.data.modifiedCount} product(s) updated` });
              setSelectedProducts([]); fetchProducts();
            }).catch((e) => Toast.show({ topOffset: 60, type: "error", text1: "Error", text2: e.response?.data || e.message }))
              .finally(() => setApplying(false));
        }
      }]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => { fetchProducts(); setRefreshing(false); }, 900);
  }, []);

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem("jwt").then(setToken).catch(console.log);
    fetchProducts();
    return () => { setProductList([]); setLoading(true); };
  }, []));

  // ── Product row ─────────────────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    const id          = item.id || item._id;
    const isSelected  = selectedProducts.includes(id);
    const hasDiscount = item?.discount?.percentage > 0;
    const isExpired   = hasDiscount && new Date(item.discount.endDate) < new Date();

    return (
      <TouchableOpacity
        style={[row.card, isSelected && row.cardSelected]}
        onPress={() => toggleSelect(id)}
        activeOpacity={0.85}
      >
        {/* Checkbox */}
        <View style={[row.checkbox, isSelected && row.checkboxOn]}>
          {isSelected && <Ionicons name="checkmark" size={14} color={C.greenDark} />}
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={row.name} numberOfLines={1}>{item.name}</Text>
          <Text style={row.price}>${item.price}</Text>
        </View>

        {/* Discount tag */}
        {hasDiscount && (
          <View style={[row.badge, isExpired && row.badgeExpired]}>
            <Ionicons name={isExpired ? "time-outline" : "pricetag-outline"} size={10} color={isExpired ? C.red : C.amber} />
            <Text style={[row.badgeText, isExpired && { color: C.red }]}>
              {item.discount.percentage}% {isExpired ? "Expired" : "OFF"}
            </Text>
          </View>
        )}

        {/* Selected glow indicator */}
        {isSelected && <View style={row.selectedDot} />}
      </TouchableOpacity>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>

      {/* Background orbs */}
      <View style={styles.orbTR} />
      <View style={styles.orbBL} />
      <View style={styles.orbMid} />

      {/* ══════ LIST ══════ */}
      {loading ? (
        <View style={styles.spinnerWrap}>
          <View style={styles.spinnerCard}>
            <ActivityIndicator size="large" color={C.gold} />
            <Text style={styles.spinnerText}>Loading products…</Text>
          </View>
        </View>
      ) : (
        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
          data={filteredList}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <GoldBar />
              <CornerRings />

              <View style={styles.titleRow}>
                <View style={styles.titleBadge}><Text style={styles.titleBadgeText}>ADMIN</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.titleMain}>Discount Studio</Text>
                  <Text style={styles.titleSub}>Bulk time-bound markdowns for your catalogue</Text>
                </View>
              </View>

              <GoldDivider />

              <View style={styles.statsRow}>
                <StatPill value={selectedProducts.length} label="Selected"   icon="checkmark-circle-outline" accent={C.greenMid}  />
                <StatPill value={discountedCount}          label="Live Deals" icon="pricetag-outline"         accent={C.amber}     />
                <StatPill value={filteredList.length}      label="Visible"    icon="eye-outline"              accent={C.gold}      />
              </View>

              <GoldDivider style={{ marginBottom: 0 }} />

              {/* Search + Select All */}
              <View style={styles.searchRow}>
                <View style={styles.searchWrap}>
                  <View style={styles.searchIcon}><Ionicons name="search-outline" size={15} color={C.gold} /></View>
                  <Searchbar
                    placeholder="Search products…"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor="transparent"
                    elevation={0}
                  />
                </View>

                {safeList.length > 0 && (
                  <TouchableOpacity style={[styles.selectAllBtn, allSelected && styles.selectAllBtnOn]} onPress={toggleSelectAll}>
                    <Ionicons name={allSelected ? "checkbox" : "square-outline"} size={16} color={allSelected ? C.greenDark : C.gold} />
                    <Text style={[styles.selectAllText, allSelected && { color: C.greenDark }]}>All</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCard}>
                <GoldBar />
                <View style={styles.emptyIcon}><Ionicons name="pricetag-outline" size={30} color={C.gold} /></View>
                <Text style={styles.emptyTitle}>No products found</Text>
                <GoldDivider style={{ width: "50%", alignSelf: "center" }} />
                <Text style={styles.emptySub}>Try adjusting your search.</Text>
              </View>
            </View>
          }
          renderItem={renderItem}
          keyExtractor={(item) => item.id || item._id}
          contentContainerStyle={[
            styles.listContent,
            selectedProducts.length > 0 && styles.listContentWithPanel,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}

      {selectedProducts.length > 0 && (
        <KeyboardAvoidingView
          style={styles.fixedPanelWrap}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 84 : 24}
        >
          <View style={styles.panel}>
            <GoldBar />
            <CornerRings size={56} color="rgba(201,168,76,0.2)" />

            {/* Panel header */}
            <View style={styles.panelHeader}>
              <View style={styles.panelTitleBadge}><Text style={styles.panelTitleBadgeText}>CONFIGURE</Text></View>
              <Text style={styles.panelTitle}>Set Discount</Text>
              <View style={styles.panelCountBadge}>
                <Text style={styles.panelCountText}>{selectedProducts.length} selected</Text>
              </View>
            </View>

            <GoldDivider />

            <View style={styles.fieldsRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <FormField
                  icon="trending-down-outline"
                  label="Percentage"
                  suffix="0–100"
                  placeholder="e.g. 20"
                  value={discountPercentage}
                  onChange={setDiscountPercentage}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormField
                  icon="calendar-outline"
                  label="Duration"
                  suffix="days"
                  placeholder="e.g. 7"
                  value={discountDays}
                  onChange={setDiscountDays}
                />
              </View>
            </View>

            {/* Preview chip */}
            {discountPercentage && discountDays ? (
              <View style={styles.previewChip}>
                <Ionicons name="flash-outline" size={13} color={C.amber} />
                <Text style={styles.previewText}>
                  {discountPercentage}% OFF · expires in {discountDays} day{+discountDays !== 1 ? "s" : ""}
                </Text>
              </View>
            ) : null}

            {/* Action buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnApply} onPress={applyDiscount} disabled={applying}>
                <View style={styles.btnIconCircle}>
                  <Ionicons name="pricetag-outline" size={15} color={C.greenDark} />
                </View>
                <Text style={styles.btnApplyText}>{applying ? "Applying…" : "Apply Discount"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnRemove} onPress={removeDiscount} disabled={applying}>
                <View style={styles.btnIconCircleRed}>
                  <Ionicons name="close-outline" size={15} color={C.cream} />
                </View>
                <Text style={styles.btnRemoveText}>{applying ? "Removing…" : "Remove"}</Text>
              </TouchableOpacity>
            </View>

            {applying && (
              <View style={styles.applyingRow}>
                <ActivityIndicator size="small" color={C.gold} />
                <Text style={styles.applyingText}>Processing…</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

// ─── Product row styles ───────────────────────────────────────────────────────
const row = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 14,
    marginVertical: 5, marginHorizontal: 14,
    borderWidth: 1, borderColor: C.goldBorder,
    shadowColor: "#071209", shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 2,
    gap: 12,
  },
  cardSelected: {
    backgroundColor: "rgba(201,168,76,0.08)",
    borderColor: C.gold,
  },
  checkbox: {
    width: 26, height: 26, borderRadius: 8,
    borderWidth: 1.5, borderColor: C.goldBorder,
    backgroundColor: C.goldLight,
    alignItems: "center", justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: C.gold, borderColor: C.goldDeep,
  },
  name:  { fontSize: 13, fontWeight: "800", color: C.greenDark, marginBottom: 3 },
  price: { fontSize: 12, fontWeight: "700", color: C.greenMid },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
    borderColor: C.amber + "66", backgroundColor: C.amberLight,
  },
  badgeExpired: { borderColor: C.red + "55", backgroundColor: C.redLight },
  badgeText: { fontSize: 10, fontWeight: "700", color: C.amber },
  selectedDot: {
    position: "absolute", right: 10, top: 10,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: C.gold,
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },

  orbTR:  { position: "absolute", top: -80,  right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: "rgba(201,168,76,0.09)" },
  orbBL:  { position: "absolute", bottom: 80, left: -70, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(26,92,46,0.07)" },
  orbMid: { position: "absolute", top: "42%", right: -50, width: 130, height: 130, borderRadius: 65,  backgroundColor: "rgba(201,168,76,0.06)" },

  // Header
  headerCard: {
    marginHorizontal: 14, marginTop: 10, marginBottom: 8,
    backgroundColor: C.white, borderRadius: 22, overflow: "hidden",
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 22, paddingBottom: 14,
    shadowColor: "#071209", shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 6,
  },
  titleRow:      { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  titleBadge:    { backgroundColor: C.greenDark, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginTop: 4 },
  titleBadgeText:{ fontSize: 9, fontWeight: "800", color: C.gold, letterSpacing: 1.8 },
  titleMain:     { fontSize: 22, fontWeight: "900", color: C.greenDark, letterSpacing: 0.2 },
  titleSub:      { fontSize: 11, color: C.mutedText, fontWeight: "500", marginTop: 3 },
  statsRow:      { flexDirection: "row", gap: 8 },

  // Search
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 0 },
  searchWrap: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: C.cream, borderRadius: 12,
    borderWidth: 1, borderColor: C.goldBorder, overflow: "hidden",
  },
  searchIcon: {
    width: 40, height: 42, alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderRightColor: C.goldBorder, backgroundColor: C.goldLight,
  },
  searchBar:  { flex: 1, backgroundColor: "transparent", elevation: 0, height: 42, margin: 0 },
  searchInput:{ fontSize: 13, color: C.greenDark, paddingLeft: 2 },
  selectAllBtn: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: C.goldBorder, backgroundColor: C.goldLight,
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  selectAllBtnOn: { backgroundColor: C.gold, borderColor: C.goldDeep },
  selectAllText:  { fontSize: 11, fontWeight: "800", color: C.gold },

  // List
  listContent: { paddingTop: 6, paddingBottom: 18 },
  listContentWithPanel: { paddingBottom: 360 },

  // Spinner
  spinnerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  spinnerCard: {
    backgroundColor: C.white, borderRadius: 20,
    paddingVertical: 28, paddingHorizontal: 40, alignItems: "center", gap: 14,
    borderWidth: 1, borderColor: C.goldBorder,
    shadowColor: "#000", shadowOpacity: 0.07, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 3,
  },
  spinnerText: { fontSize: 12, fontWeight: "700", color: C.mutedText, fontStyle: "italic" },

  // Empty
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyCard: {
    width: "100%", backgroundColor: C.white, borderRadius: 22, overflow: "hidden",
    paddingVertical: 32, paddingHorizontal: 24, alignItems: "center",
    borderWidth: 1, borderColor: C.goldBorder,
    shadowColor: "#071209", shadowOpacity: 0.09, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 4,
  },
  emptyIcon:  { width: 68, height: 68, borderRadius: 34, backgroundColor: C.goldLight, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.goldBorder, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: "900", color: C.greenDark },
  emptySub:   { fontSize: 13, color: C.mutedText, fontStyle: "italic" },

  fixedPanelWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Panel
  panel: {
    backgroundColor: C.white, borderRadius: 22, overflow: "hidden",
    marginHorizontal: 14, marginBottom: 14,
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 20, paddingBottom: 18,
    maxHeight: 310,
    shadowColor: "#071209", shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: -4 }, shadowRadius: 14, elevation: 8,
  },
  panelHeader:       { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  panelTitleBadge:   { backgroundColor: C.greenDark, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  panelTitleBadgeText:{ fontSize: 8, fontWeight: "800", color: C.gold, letterSpacing: 1.6 },
  panelTitle:        { fontSize: 17, fontWeight: "900", color: C.greenDark, flex: 1 },
  panelCountBadge:   { backgroundColor: C.goldLight, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: C.goldBorder },
  panelCountText:    { fontSize: 11, fontWeight: "800", color: C.goldDeep },

  fieldsRow: { flexDirection: "row" },

  // Preview
  previewChip: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: C.amberLight, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.amber + "44",
    marginBottom: 14,
  },
  previewText: { fontSize: 12, fontWeight: "700", color: C.amber },

  // Buttons
  btnRow:   { flexDirection: "row", gap: 10 },
  btnApply: {
    flex: 2, backgroundColor: C.gold, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
    shadowColor: "#5C3D00", shadowOpacity: 0.26, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3,
  },
  btnIconCircle:    { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(11,31,16,0.14)", alignItems: "center", justifyContent: "center" },
  btnApplyText:     { fontSize: 13, fontWeight: "900", color: C.greenDark, letterSpacing: 0.3 },
  btnRemove: {
    flex: 1, backgroundColor: "#7A1515", borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1, borderColor: "rgba(122,21,21,0.45)",
  },
  btnIconCircleRed: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(245,240,232,0.15)", alignItems: "center", justifyContent: "center" },
  btnRemoveText:    { fontSize: 13, fontWeight: "800", color: C.cream },

  applyingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 },
  applyingText: { fontSize: 12, color: C.mutedText, fontStyle: "italic" },
});

export default Discounts;