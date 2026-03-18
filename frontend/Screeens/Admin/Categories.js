import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import baseURL from "../../assets/common/baseurl";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

var { width } = Dimensions.get("window");

// ─── Palette ──────────────────────────────────────────────────────────────────
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
  red:         "#8B1A1A",
  redLight:    "rgba(139,26,26,0.08)",
  redBorder:   "rgba(139,26,26,0.25)",
};

// ─── Decorative helpers ───────────────────────────────────────────────────────
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

const CornerRings = ({ size = 80, color = C.goldBorder }) => (
  <View
    style={{ position: "absolute", top: -size * 0.3, right: -size * 0.3, width: size, height: size }}
    pointerEvents="none"
  >
    {[1, 0.68, 0.4].map((s, i) => (
      <View key={i} style={{
        position: "absolute",
        width: size * s, height: size * s,
        borderRadius: (size * s) / 2,
        borderWidth: 1, borderColor: color,
        top: (size - size * s) / 2, left: (size - size * s) / 2,
      }} />
    ))}
  </View>
);

/** Shared stat pill */
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
  value:   { fontSize: 18, fontWeight: "900", letterSpacing: 0.2 },
  label:   { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
});

// ─── Category Item Row ────────────────────────────────────────────────────────
const Item = ({ item, index, confirmDelete }) => (
  <View style={itemStyles.card}>
    {/* Left gold accent */}
    <View style={itemStyles.leftAccent} />

    {/* Index badge */}
    <View style={itemStyles.indexBadge}>
      <Text style={itemStyles.indexText}>{String(index + 1).padStart(2, "0")}</Text>
    </View>

    {/* Info */}
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={itemStyles.name} numberOfLines={1}>{item.name}</Text>
      <View style={itemStyles.metaRow}>
        <View style={itemStyles.metaPip}>
          <Ionicons name="grid-outline" size={9} color={C.gold} />
        </View>
        <Text style={itemStyles.meta}>Category</Text>
        <View style={itemStyles.dotSep} />
        <Text style={itemStyles.meta}>ID: {(item.id || item._id || "").slice(-5).toUpperCase()}</Text>
      </View>
    </View>

    {/* Delete button */}
    <TouchableOpacity
      style={itemStyles.deleteBtn}
      activeOpacity={0.85}
      onPress={() => confirmDelete(item.id || item._id, item.name)}
    >
      <Ionicons name="trash-outline" size={13} color={C.red} />
      <Text style={itemStyles.deleteText}>Remove</Text>
    </TouchableOpacity>
  </View>
);

const itemStyles = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderRadius: 16,
    marginHorizontal: 14, marginTop: 9,
    paddingVertical: 14, paddingRight: 14,
    paddingLeft: 0,
    borderWidth: 1, borderColor: C.goldBorder,
    overflow: "hidden",
    shadowColor: "#071209", shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 2,
  },
  leftAccent: {
    width: 4, alignSelf: "stretch",
    backgroundColor: C.gold, marginRight: 12, borderRadius: 2,
  },
  indexBadge: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder,
    alignItems: "center", justifyContent: "center",
  },
  indexText: { fontSize: 11, fontWeight: "900", color: C.goldDeep, letterSpacing: 0.5 },
  name:      { fontSize: 14, fontWeight: "900", color: C.greenDark, marginBottom: 4 },
  metaRow:   { flexDirection: "row", alignItems: "center", gap: 5 },
  metaPip:   { width: 14, height: 14, borderRadius: 7, backgroundColor: C.goldLight, alignItems: "center", justifyContent: "center" },
  meta:      { fontSize: 10, fontWeight: "600", color: C.mutedText, letterSpacing: 0.2 },
  dotSep:    { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.goldBorder },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
    borderColor: C.redBorder, backgroundColor: C.redLight,
    marginLeft: 10,
  },
  deleteText: { fontSize: 11, fontWeight: "800", color: C.red, letterSpacing: 0.2 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const Categories = () => {
  const [categories,    setCategories]    = useState([]);
  const [categoryName,  setCategoryName]  = useState("");
  const [token,         setToken]         = useState();
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [inputFocused,  setInputFocused]  = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    axios.get(`${baseURL}categories`)
      .then((res) => setCategories(res.data))
      .catch(() => alert("Error loading categories"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    AsyncStorage.getItem("jwt").then(setToken).catch(console.log);
    fetchCategories();
    return () => { setCategories([]); setToken(undefined); };
  }, []);

  const addCategory = () => {
    const trimmed = (categoryName || "").trim();
    if (!trimmed) { alert("Please enter a category name"); return; }
    axios.post(`${baseURL}categories`, { name: trimmed }, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setCategories([...categories, res.data]))
      .catch(() => alert("Error adding category"));
    setCategoryName("");
  };

  const deleteCategory = (id) => {
    axios.delete(`${baseURL}categories/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => setCategories(categories.filter((i) => (i.id || i._id) !== id)))
      .catch(() => alert("Error deleting category"));
  };

  const confirmDelete = (id, name) => {
    Alert.alert(
      "Remove Category?",
      name ? `Remove "${name}" from your catalogue?` : "Remove this category?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => deleteCategory(id) },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    axios.get(`${baseURL}categories`)
      .then((res) => setCategories(res.data))
      .catch(() => alert("Error loading categories"))
      .finally(() => setRefreshing(false));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>

      {/* Background orbs */}
      <View style={styles.orbTR} />
      <View style={styles.orbBL} />

      {/* ══════ LIST / STATES ══════ */}
      {loading ? (
        <View style={styles.spinnerWrap}>
          <View style={styles.spinnerCard}>
            <ActivityIndicator size="large" color={C.gold} />
            <Text style={styles.spinnerText}>Loading categories…</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={categories}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <Item item={item} index={index} confirmDelete={confirmDelete} />
          )}
          keyExtractor={(item, index) => item.id || item._id || String(index)}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={styles.headerCard}>
                <GoldBar />
                <CornerRings />

                <View style={styles.titleRow}>
                  <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.titleMain}>Category Manager</Text>
                    <Text style={styles.titleSub}>Structure your catalogue with clear product groups</Text>
                  </View>
                </View>

                <GoldDivider />

                <View style={styles.statsRow}>
                  <StatPill
                    value={categories.length}
                    label="Total"
                    icon="grid-outline"
                    accent={C.gold}
                  />
                  <StatPill
                    value={categories.length > 0 ? "Active" : "Empty"}
                    label="Status"
                    icon="checkmark-circle-outline"
                    accent={categories.length > 0 ? C.greenMid : C.mutedText}
                  />
                  <StatPill
                    value={categories.filter((c) => (c.name || "").length > 8).length}
                    label="Long Names"
                    icon="text-outline"
                    accent={C.goldDeep}
                  />
                </View>
              </View>

              <View style={styles.listHeader}>
                <Ionicons name="list-outline" size={13} color={C.mutedText} />
                <Text style={styles.listHeaderText}>
                  {categories.length} categor{categories.length !== 1 ? "ies" : "y"} listed
                </Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCard}>
                <GoldBar />
                <CornerRings size={56} color="rgba(201,168,76,0.2)" />
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="grid-outline" size={30} color={C.gold} />
                </View>
                <Text style={styles.emptyTitle}>No categories yet</Text>
                <GoldDivider style={{ width: "50%", alignSelf: "center" }} />
                <Text style={styles.emptySub}>Add your first category using the panel below.</Text>
              </View>
            </View>
          }
        />
      )}

      {/* ══════ BOTTOM ADD PANEL ══════ */}
      <View style={styles.bottomPanel}>
        <GoldBar />
        <CornerRings size={50} color="rgba(201,168,76,0.18)" />

        {/* Panel header */}
        <View style={styles.panelHeader}>
          <View style={styles.panelIconCircle}>
            <Ionicons name="add-circle-outline" size={14} color={C.gold} />
          </View>
          <Text style={styles.panelTitle}>New Category</Text>
          <View style={styles.panelBadge}><Text style={styles.panelBadgeText}>ADD</Text></View>
        </View>

        <GoldDivider style={{ marginTop: 8, marginBottom: 10 }} />

        {/* Input + button row */}
        <View style={styles.inputRow}>
          <View style={[styles.inputWrap, inputFocused && styles.inputWrapFocused]}>
            <View style={styles.inputIconCol}>
              <Ionicons name="leaf-outline" size={14} color={C.gold} />
            </View>
            <TextInput
              value={categoryName}
              style={styles.textInput}
              placeholder="e.g. Succulents, Ferns…"
              placeholderTextColor={C.mutedText}
              onChangeText={setCategoryName}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              returnKeyType="done"
              onSubmitEditing={addCategory}
            />
            {categoryName.length > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => setCategoryName("")}
              >
                <Ionicons name="close-circle" size={16} color={C.mutedText} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={addCategory} activeOpacity={0.88}>
            <Ionicons name="add" size={18} color={C.greenDark} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },

  // Orbs
  orbTR: { position: "absolute", top: -80,  right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(201,168,76,0.09)" },
  orbBL: { position: "absolute", bottom: 130, left: -70, width: 190, height: 190, borderRadius: 95,  backgroundColor: "rgba(26,92,46,0.07)" },

  // Header card
  headerCard: {
    marginHorizontal: 14, marginTop: 10, marginBottom: 8,
    backgroundColor: C.white, borderRadius: 22, overflow: "hidden",
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 22, paddingBottom: 16,
    shadowColor: "#071209", shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 6,
  },
  titleRow:      { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  adminBadge:    { backgroundColor: C.greenDark, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginTop: 4 },
  adminBadgeText:{ fontSize: 9, fontWeight: "800", color: C.gold, letterSpacing: 1.8 },
  titleMain:     { fontSize: 22, fontWeight: "900", color: C.greenDark, letterSpacing: 0.2 },
  titleSub:      { fontSize: 11, color: C.mutedText, fontWeight: "500", marginTop: 3 },
  statsRow:      { flexDirection: "row", gap: 8 },

  // List
  listHeader: {
    flexDirection: "row", alignItems: "center", gap: 7,
    marginHorizontal: 14, marginBottom: 4, marginTop: 2,
  },
  listHeaderText: { fontSize: 12, fontWeight: "700", color: C.mutedText, letterSpacing: 0.3 },
  listContent:    { paddingTop: 4, paddingBottom: 120 },

  // Spinner
  spinnerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  spinnerCard: {
    backgroundColor: C.white, borderRadius: 20,
    paddingVertical: 28, paddingHorizontal: 40,
    alignItems: "center", gap: 14,
    borderWidth: 1, borderColor: C.goldBorder,
    shadowColor: "#000", shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 3,
  },
  spinnerText: { fontSize: 12, fontWeight: "700", color: C.mutedText, fontStyle: "italic" },

  // Empty
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyCard: {
    width: "100%", backgroundColor: C.white, borderRadius: 22, overflow: "hidden",
    paddingVertical: 36, paddingHorizontal: 28, alignItems: "center",
    borderWidth: 1, borderColor: C.goldBorder,
    shadowColor: "#071209", shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 4,
  },
  emptyIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.goldLight, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.goldBorder, marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: C.greenDark, letterSpacing: 0.2 },
  emptySub:   { fontSize: 13, color: C.mutedText, textAlign: "center", lineHeight: 20, fontStyle: "italic" },

  // Bottom panel
  bottomPanel: {
    position: "absolute", bottom: 10, left: 14,
    width: width - 28,
    backgroundColor: C.white, borderRadius: 22, overflow: "hidden",
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16,
    shadowColor: "#071209", shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: -4 }, shadowRadius: 14, elevation: 8,
  },
  panelHeader:    { flexDirection: "row", alignItems: "center", gap: 10 },
  panelIconCircle:{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.goldLight, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.goldBorder },
  panelTitle:     { fontSize: 14, fontWeight: "900", color: C.greenDark, flex: 1 },
  panelBadge:     { backgroundColor: C.greenDark, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  panelBadgeText: { fontSize: 8, fontWeight: "800", color: C.gold, letterSpacing: 1.6 },

  // Input row
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  inputWrap: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: C.cream, borderRadius: 12,
    borderWidth: 1, borderColor: C.goldBorder, overflow: "hidden",
  },
  inputWrapFocused: { borderColor: C.gold, borderWidth: 1.5 },
  inputIconCol: {
    width: 38, height: 46, alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderRightColor: C.goldBorder, backgroundColor: C.goldLight,
  },
  textInput: {
    flex: 1, height: 46, paddingHorizontal: 12,
    fontSize: 13, fontWeight: "700", color: C.greenDark,
  },
  clearBtn: { paddingHorizontal: 10 },

  addBtn: {
    backgroundColor: C.gold, borderRadius: 14,
    height: 46, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center", gap: 6,
    shadowColor: "#5C3D00", shadowOpacity: 0.26,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 7, elevation: 3,
  },
  addBtnText: { fontSize: 14, fontWeight: "900", color: C.greenDark, letterSpacing: 0.3 },
});

export default Categories;