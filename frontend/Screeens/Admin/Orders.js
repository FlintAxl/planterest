import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { useFocusEffect } from "@react-navigation/native";
import OrderCard from "../../Shared/OrderCard";

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
  mutedText:   "rgba(11,31,16,0.50)",
  amber:       "#B5650D",
  amberLight:  "rgba(181,101,13,0.12)",
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
      <View
        key={i}
        style={{
          position: "absolute",
          width: size * s, height: size * s,
          borderRadius: (size * s) / 2,
          borderWidth: 1, borderColor: color,
          top: (size - size * s) / 2, left: (size - size * s) / 2,
        }}
      />
    ))}
  </View>
);

/** Single stat pill */
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const Orders = () => {
  const [orderList, setOrderList] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const safeList     = Array.isArray(orderList) ? orderList : [];
  const pendingCount = safeList.filter((o) => o.status === "3").length;
  const shippedCount = safeList.filter((o) => o.status === "2").length;
  const deliveredCount = safeList.filter((o) => o.status === "1").length;

  useFocusEffect(
    useCallback(() => {
      getOrders();
      return () => { setOrderList([]); setLoading(true); };
    }, [])
  );

  const getOrders = () => {
    setLoading(true);
    axios.get(`${baseURL}orders`)
      .then((res) => setOrderList(res.data))
      .catch((e) => console.log(e))
      .finally(() => setLoading(false));
  };

  const onRefresh = () => {
    setRefreshing(true);
    axios.get(`${baseURL}orders`)
      .then((res) => setOrderList(res.data))
      .catch((e) => console.log(e))
      .finally(() => setRefreshing(false));
  };

  // ── Orders meta row (injected under hero card) ─────────────────────────────
  const OrdersMetaRow = () => (
    <View style={styles.listHeader}>
      <Ionicons name="receipt-outline" size={13} color={C.mutedText} />
      <Text style={styles.listHeaderText}>{safeList.length} order{safeList.length !== 1 ? "s" : ""} total</Text>
      <View style={{ flex: 1 }} />
      <TouchableOpacity style={styles.refreshChip} onPress={onRefresh}>
        <Ionicons name="refresh-outline" size={13} color={C.gold} />
        <Text style={styles.refreshChipText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>

      {/* Background orbs */}
      <View style={styles.orbTR} />
      <View style={styles.orbBL} />
      <View style={styles.orbMid} />

      {/* ══════ CONTENT ══════ */}
      {loading ? (
        <View style={styles.spinnerWrap}>
          <View style={styles.spinnerCard}>
            <ActivityIndicator size="large" color={C.gold} />
            <Text style={styles.spinnerText}>Loading orders…</Text>
          </View>
        </View>
      ) : (
        <FlatList
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />
          }
          ListHeaderComponent={
            <>
              <View style={styles.headerCard}>
                <GoldBar />
                <CornerRings />

                {/* Title */}
                <View style={styles.titleRow}>
                  <View style={styles.titleBadge}>
                    <Text style={styles.titleBadgeText}>ADMIN</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.titleMain}>Order Desk</Text>
                    <Text style={styles.titleSub}>Track incoming orders and update fulfilment status</Text>
                  </View>
                </View>

                <GoldDivider />

                {/* Stats row */}
                <View style={styles.statsRow}>
                  <StatPill
                    value={safeList.length}
                    label="Total"
                    icon="receipt-outline"
                    accent={C.gold}
                  />
                  <StatPill
                    value={pendingCount}
                    label="Pending"
                    icon="time-outline"
                    accent={C.amber}
                  />
                  <StatPill
                    value={shippedCount}
                    label="Shipped"
                    icon="paper-plane-outline"
                    accent={C.greenMid}
                  />
                  <StatPill
                    value={deliveredCount}
                    label="Delivered"
                    icon="checkmark-circle-outline"
                    accent={C.goldDeep}
                  />
                </View>

                {/* Status legend strip */}
                <GoldDivider style={{ marginBottom: 4 }} />
                <View style={styles.legendRow}>
                  {[
                    { dot: C.amber,    label: "Pending"   },
                    { dot: C.greenMid, label: "Shipped"   },
                    { dot: C.goldDeep, label: "Delivered" },
                    { dot: "#7A1515",  label: "Cancelled" },
                  ].map(({ dot, label }) => (
                    <View key={label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: dot }]} />
                      <Text style={styles.legendText}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <OrdersMetaRow />
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCard}>
                <GoldBar />
                <CornerRings size={56} color="rgba(201,168,76,0.2)" />

                <View style={styles.emptyIconCircle}>
                  <Ionicons name="receipt-outline" size={32} color={C.gold} />
                </View>

                <Text style={styles.emptyTitle}>No orders yet</Text>
                <GoldDivider style={{ width: "50%", alignSelf: "center" }} />
                <Text style={styles.emptySub}>
                  New orders will appear here. Pull down to refresh.
                </Text>

                <TouchableOpacity style={styles.emptyRefreshBtn} onPress={onRefresh}>
                  <Ionicons name="refresh-outline" size={15} color={C.greenDark} />
                  <Text style={styles.emptyRefreshText}>Refresh Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          contentContainerStyle={styles.listContent}
          data={safeList}
          renderItem={({ item }) => <OrderCard item={item} update={true} />}
          keyExtractor={(item) => item.id || item._id}
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
  safe: { flex: 1, backgroundColor: C.cream },

  // Orbs
  orbTR:  { position: "absolute", top: -80,  right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: "rgba(201,168,76,0.09)" },
  orbBL:  { position: "absolute", bottom: 60, left: -70, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(26,92,46,0.07)"   },
  orbMid: { position: "absolute", top: "44%", right: -50, width: 130, height: 130, borderRadius: 65,  backgroundColor: "rgba(201,168,76,0.06)" },

  // Header card
  headerCard: {
    marginHorizontal: 14, marginTop: 10, marginBottom: 10,
    backgroundColor: C.white, borderRadius: 22, overflow: "hidden",
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 22, paddingBottom: 16,
    shadowColor: "#071209", shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 6,
  },

  titleRow:      { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  titleBadge:    { backgroundColor: C.greenDark, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginTop: 4 },
  titleBadgeText:{ fontSize: 9, fontWeight: "800", color: C.gold, letterSpacing: 1.8 },
  titleMain:     { fontSize: 22, fontWeight: "900", color: C.greenDark, letterSpacing: 0.2 },
  titleSub:      { fontSize: 11, color: C.mutedText, fontWeight: "500", marginTop: 3 },

  statsRow: { flexDirection: "row", gap: 8 },

  // Legend
  legendRow: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
  legendItem:{ flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText:{ fontSize: 10, fontWeight: "600", color: C.mutedText, textTransform: "uppercase", letterSpacing: 0.5 },

  // List header row
  listHeader: {
    flexDirection: "row", alignItems: "center", gap: 7,
    marginHorizontal: 14, marginBottom: 8, marginTop: 4,
  },
  listHeaderText: { fontSize: 12, fontWeight: "700", color: C.mutedText, letterSpacing: 0.3 },
  refreshChip:    {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
    borderColor: C.goldBorder, backgroundColor: C.goldLight,
  },
  refreshChipText: { fontSize: 11, fontWeight: "700", color: C.gold },

  // List
  listContent: { paddingBottom: 24, paddingHorizontal: 14 },

  // Spinner
  spinnerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  spinnerCard: {
    backgroundColor: C.white, borderRadius: 20,
    paddingVertical: 28, paddingHorizontal: 40, alignItems: "center", gap: 14,
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
  emptySub:   { fontSize: 13, color: C.mutedText, textAlign: "center", lineHeight: 20, fontStyle: "italic", paddingHorizontal: 8 },
  emptyRefreshBtn: {
    marginTop: 20, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.gold, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 22,
    shadowColor: "#5C3D00", shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 7, elevation: 2,
  },
  emptyRefreshText: { fontSize: 14, fontWeight: "900", color: C.greenDark, letterSpacing: 0.3 },
});

export default Orders;