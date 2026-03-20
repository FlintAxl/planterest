import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import TrafficLight from "./StyledComponents/TrafficLight";
import EasyButton from "./StyledComponents/EasyButton";
import Toast from "react-native-toast-message";
import { Picker } from "@react-native-picker/picker";

import axios from "axios";
import baseURL from "../assets/common/baseurl";
import { useNavigation } from "@react-navigation/native";
import { getAuthToken } from "../assets/common/token-storage";

// ─── Palette ──────────────────────────────────────────────────────────────────
const GOLD        = "#C9A84C";
const GOLD_LIGHT  = "rgba(201,168,76,0.12)";
const GOLD_BORDER = "rgba(201,168,76,0.22)";
const GREEN_DARK  = "#0E2416";
const GREEN_MID   = "#1A5C2E";
const GREEN_SOFT  = "rgba(26,92,46,0.08)";
const CREAM       = "#F5F0E8";

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  "3": { label: "Pending",   icon: "time-outline",             color: "#9A7200", bg: "rgba(184,134,11,0.10)", border: "rgba(184,134,11,0.28)" },
  "2": { label: "Shipped",   icon: "paper-plane-outline",      color: "#1A6B3C", bg: "rgba(26,107,60,0.10)",  border: "rgba(26,107,60,0.28)"  },
  "1": { label: "Delivered", icon: "checkmark-circle-outline", color: "#1A5C2E", bg: "rgba(26,92,46,0.12)",   border: "rgba(26,92,46,0.32)"   },
  "4": { label: "Cancelled", icon: "close-circle-outline",     color: "#8B1A1A", bg: "rgba(139,26,26,0.08)",  border: "rgba(139,26,26,0.25)"  },
};

const codes = [
  { name: "Pending",   code: "3" },
  { name: "Shipped",   code: "2" },
  { name: "Delivered", code: "1" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseNumeric = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Thin gold ornamental divider with centre diamond */
const GoldDivider = ({ style }) => (
  <View style={[divStyles.row, style]}>
    <View style={divStyles.line} />
    <View style={divStyles.diamond} />
    <View style={divStyles.line} />
  </View>
);
const divStyles = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "center", marginVertical: 14 },
  line:    { flex: 1, height: 1, backgroundColor: GOLD_BORDER },
  diamond: { width: 6, height: 6, backgroundColor: GOLD, transform: [{ rotate: "45deg" }], marginHorizontal: 8 },
});

/** Labelled info row with icon pip */
const InfoRow = ({ icon, label, value }) => (
  <View style={infoStyles.row}>
    <View style={infoStyles.pip}>
      <Ionicons name={icon} size={12} color={GOLD} />
    </View>
    <Text style={infoStyles.label}>{label}</Text>
    <Text style={infoStyles.value} numberOfLines={1}>{value}</Text>
  </View>
);
const infoStyles = StyleSheet.create({
  row:   { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  pip:   { width: 22, height: 22, borderRadius: 11, backgroundColor: GOLD_LIGHT, alignItems: "center", justifyContent: "center", marginRight: 9 },
  label: { fontSize: 10, fontWeight: "700", color: "rgba(10,30,12,0.45)", textTransform: "uppercase", letterSpacing: 0.6, flex: 1 },
  value: { fontSize: 12, fontWeight: "700", color: GREEN_DARK, textAlign: "right", maxWidth: "58%", flexShrink: 1 },
});

/** Decorative corner rings (top-right) */
const CornerRings = () => (
  <View style={cornerStyles.wrap} pointerEvents="none">
    {[44, 32, 20].map((s, i) => (
      <View key={i} style={[cornerStyles.ring, { width: s, height: s, borderRadius: s / 2, opacity: 0.5 - i * 0.12 }]} />
    ))}
  </View>
);
const cornerStyles = StyleSheet.create({
  wrap: { position: "absolute", top: -10, right: -10, width: 54, height: 54, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", borderWidth: 1, borderColor: GOLD },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const OrderCard = ({ item, update, isCustomer }) => {
  const orderId      = item?.id || item?._id;
  const createdDate  = item?.dateOrdered?.split("T")?.[0] || "—";
  const computedTotal = Array.isArray(item?.orderItems)
    ? item.orderItems.reduce((s, l) => s + parseNumeric(l?.quantity) * parseNumeric(l?.product?.price), 0)
    : 0;
  const totalSource  = item?.totalPrice ?? item?.totalprice ?? item?.total ?? computedTotal;
  const safeTotal    = Math.max(parseNumeric(totalSource), computedTotal);
  const itemCount    = Array.isArray(item?.orderItems) ? item.orderItems.length : 0;
  const orderRef     = typeof orderId === "string" ? orderId.slice(-6).toUpperCase() : orderId;

  const [statusChange, setStatusChange]     = useState(item.status);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason]     = useState("");
  const [loading, setLoading]               = useState(false);

  const navigation = useNavigation();
  const statusCfg  = STATUS_CONFIG[item.status] || STATUS_CONFIG["3"];
  const isCardPressEnabled = !update;

  const navigateAfterMutation = () => {
    if (navigation.canGoBack()) { navigation.goBack(); return; }
    navigation.navigate(isCustomer ? "My Orders" : "Orders");
  };

  // ── API calls ──────────────────────────────────────────────────────────────
  const updateOrder = () => {
    getAuthToken().then((res) => {
      const cfg = { headers: { Authorization: `Bearer ${res}` } };
      const order = { city: item.city, country: item.country, dateOrdered: item.dateOrdered,
        id: orderId, orderItems: item.orderItems, phone: item.phone,
        shippingAddress1: item.shippingAddress1, shippingAddress2: item.shippingAddress2,
        status: statusChange, totalPrice: item.totalPrice, user: item.user, zip: item.zip };
      return axios.put(`${baseURL}orders/${orderId}`, order, cfg);
    }).then((res) => {
      if ([200, 201].includes(res.status)) {
        Toast.show({ topOffset: 60, type: "success", text1: "Order Updated" });
        setTimeout(navigateAfterMutation, 500);
      }
    }).catch(() => Toast.show({ topOffset: 60, type: "error", text1: "Something went wrong", text2: "Please try again" }));
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) { Alert.alert("Required", "Please provide a cancellation reason."); return; }
    setLoading(true);
    try {
      const token = await getAuthToken();
      await axios.put(`${baseURL}orders/${orderId}/cancel`, { cancelReason }, { headers: { Authorization: `Bearer ${token}` } });
      Toast.show({ topOffset: 60, type: "success", text1: "Order Cancelled" });
      setShowCancelModal(false); setCancelReason("");
      setTimeout(navigateAfterMutation, 500);
    } catch {
      Toast.show({ topOffset: 60, type: "error", text1: "Failed to cancel order" });
    } finally { setLoading(false); }
  };

  const handleReceiveOrder = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const order = { city: item.city, country: item.country, dateOrdered: item.dateOrdered,
        id: orderId, orderItems: item.orderItems, phone: item.phone,
        shippingAddress1: item.shippingAddress1, shippingAddress2: item.shippingAddress2,
        status: "1", totalPrice: item.totalPrice, user: item.user, zip: item.zip };
      await axios.put(`${baseURL}orders/${orderId}`, order, { headers: { Authorization: `Bearer ${token}` } });
      Toast.show({ topOffset: 60, type: "success", text1: "Order Received", text2: "Thank you for your purchase!" });
      setTimeout(navigateAfterMutation, 500);
    } catch {
      Toast.show({ topOffset: 60, type: "error", text1: "Failed to update order" });
    } finally { setLoading(false); }
  };

  const handleViewDetails = () => {
    if (isCustomer) {
      navigation.navigate("Order Details", { order: item, isCustomer });
      return;
    }

    navigation.navigate("User", { screen: "Order Details", params: { order: item, isCustomer } });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={isCardPressEnabled ? handleViewDetails : undefined}
        activeOpacity={0.93}
        disabled={!isCardPressEnabled}
      >

        {/* Decorative corner */}
        <CornerRings />

        {/* Gold top bar */}
        <View style={styles.goldBar} />

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.refRow}>
              <View style={styles.refTag}><Text style={styles.refTagText}>ORDER</Text></View>
              <Text style={styles.refNum}>#{orderRef || "——"}</Text>
            </View>
            <Text style={styles.dateText}>
              <Ionicons name="calendar-outline" size={11} color={GOLD} />{"  "}{createdDate}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
            <Ionicons name={statusCfg.icon} size={13} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        <GoldDivider />

        {/* ── INFO ROWS ── */}
        <InfoRow icon="cube-outline"     label="Items"    value={`${itemCount} item${itemCount !== 1 ? "s" : ""}`} />
        <InfoRow icon="call-outline"     label="Contact"  value={item?.phone || "No phone"} />
        <InfoRow icon="location-outline" label="Ship to"  value={[item.shippingAddress1, item.shippingAddress2].filter(Boolean).join(", ")} />
        <InfoRow icon="business-outline" label="City"     value={[item.city, item.country].filter(Boolean).join(", ")} />

        {/* ── TOTAL BLOCK ── */}
        <View style={styles.totalWrap}>
          <View style={styles.totalInner}>
            <View>
              <Text style={styles.totalLabel}>ORDER TOTAL</Text>
              <Text style={styles.totalHint}>Incl. all items</Text>
            </View>
            <View style={styles.totalAmtRow}>
              <Text style={styles.totalCurrency}>$</Text>
              <Text style={styles.totalAmt}>{safeTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* ── CANCELLATION REASON ── */}
        {item.status === "4" && item.cancelReason && (
          <View style={styles.cancelBox}>
            <View style={styles.cancelBoxHeader}>
              <Ionicons name="alert-circle-outline" size={13} color="#8B1A1A" />
              <Text style={styles.cancelBoxTitle}>Cancellation Reason</Text>
            </View>
            <Text style={styles.cancelBoxBody}>{item.cancelReason}</Text>
          </View>
        )}

        {/* ── CUSTOMER ACTIONS ── */}
        {isCustomer && !update && (
          <View style={styles.actionRow}>
            {item.status === "2" && (
              <TouchableOpacity style={styles.btnReceive} onPress={handleReceiveOrder}>
                <View style={styles.btnPip}><Ionicons name="checkmark-outline" size={15} color={CREAM} /></View>
                <Text style={styles.btnReceiveText}>Mark as Received</Text>
                <Ionicons name="chevron-forward-outline" size={14} color="rgba(245,240,232,0.6)" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            )}
            {item.status === "3" && (
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowCancelModal(true)}>
                <View style={styles.btnPipRed}><Ionicons name="close-outline" size={15} color={CREAM} /></View>
                <Text style={styles.btnCancelText}>Cancel Order</Text>
                <Ionicons name="chevron-forward-outline" size={14} color="rgba(245,240,232,0.6)" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── ADMIN UPDATE ── */}
        {update && item.status !== "4" && (
          <View style={styles.adminSection}>
            <GoldDivider style={{ marginTop: 4 }} />
            <Text style={styles.adminTitle}>
              <Ionicons name="settings-outline" size={12} color={GOLD} />{"  "}Admin — Update Status
            </Text>
            <View style={styles.pickerWrap}>
              <Picker style={styles.picker} selectedValue={statusChange} onValueChange={setStatusChange} dropdownIconColor={GOLD}>
                {codes.map((c) => <Picker.Item key={c.code} label={c.name} value={c.code} color={GREEN_DARK} />)}
              </Picker>
            </View>
            <TouchableOpacity style={styles.btnUpdate} onPress={updateOrder}>
              <Ionicons name="sync-outline" size={15} color={GREEN_DARK} />
              <Text style={styles.btnUpdateText}>Apply Update</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnViewDetails} onPress={handleViewDetails}>
              <Ionicons name="eye-outline" size={14} color={GREEN_DARK} />
              <Text style={styles.btnViewDetailsText}>View Full Details</Text>
            </TouchableOpacity>
          </View>
        )}

        {update && item.status === "3" && (
          <TouchableOpacity style={styles.btnAdminCancel} onPress={() => setShowCancelModal(true)}>
            <Ionicons name="ban-outline" size={14} color="#8B1A1A" />
            <Text style={styles.btnAdminCancelText}>Cancel This Order</Text>
          </TouchableOpacity>
        )}

        {/* ── BOTTOM HINT ── */}
        <View style={styles.tapHint}>
          <View style={styles.tapHintLine} />
          <Ionicons name="eye-outline" size={10} color="rgba(201,168,76,0.45)" />
          <Text style={styles.tapHintText}>Tap to view full details</Text>
          <View style={styles.tapHintLine} />
        </View>
      </TouchableOpacity>

      {/* ══════════════ CANCEL MODAL ══════════════ */}
      <Modal animationType="slide" transparent visible={showCancelModal} onRequestClose={() => setShowCancelModal(false)}>
        <View style={modal.overlay}>
          <View style={modal.sheet}>
            <View style={modal.handle} />

            <View style={modal.iconCircle}>
              <Ionicons name="alert-circle-outline" size={30} color="#8B1A1A" />
            </View>

            <Text style={modal.title}>Cancel Order</Text>
            <Text style={modal.subtitle}>
              This cannot be undone. Please provide a brief reason so we can improve.
            </Text>

            <GoldDivider />

            <Text style={modal.inputLabel}>REASON FOR CANCELLATION</Text>
            <TextInput
              style={modal.input}
              placeholder="e.g. Changed my mind, wrong item…"
              placeholderTextColor="rgba(10,30,12,0.35)"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={4}
            />

            <View style={modal.btnRow}>
              <TouchableOpacity style={modal.btnClose} onPress={() => { setShowCancelModal(false); setCancelReason(""); }}>
                <Text style={modal.btnCloseText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modal.btnConfirm} onPress={handleCancelOrder} disabled={loading}>
                <Ionicons name="trash-outline" size={14} color={CREAM} />
                <Text style={modal.btnConfirmText}>{loading ? "Processing…" : "Confirm Cancel"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FAFDF7",
    borderRadius: 20,
    marginVertical: 9,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    overflow: "hidden",
    shadowColor: "#071209",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 6,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 14,
  },
  goldBar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 4,
    backgroundColor: GOLD,
  },

  // Header
  header:   { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 2 },
  headerLeft: { flex: 1, paddingRight: 12 },
  refRow:   { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  refTag:   { backgroundColor: GREEN_DARK, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 },
  refTagText: { fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 1.5 },
  refNum:   { fontSize: 20, fontWeight: "900", color: GREEN_DARK, letterSpacing: 0.3 },
  dateText: { fontSize: 11, color: "rgba(10,30,12,0.48)", fontWeight: "500", letterSpacing: 0.2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginTop: 2 },
  statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },

  // Total
  totalWrap: { marginVertical: 4 },
  totalInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: GOLD_LIGHT, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16,
    borderWidth: 1, borderColor: GOLD_BORDER,
  },
  totalLabel:   { fontSize: 10, fontWeight: "800", color: GREEN_MID, letterSpacing: 1.2, textTransform: "uppercase" },
  totalHint:    { fontSize: 10, color: "rgba(10,30,12,0.40)", marginTop: 3, fontStyle: "italic" },
  totalAmtRow:  { flexDirection: "row", alignItems: "flex-start" },
  totalCurrency:{ fontSize: 14, fontWeight: "800", color: GOLD, marginTop: 5, marginRight: 1 },
  totalAmt:     { fontSize: 30, fontWeight: "900", color: GREEN_DARK, lineHeight: 32 },

  // Cancel reason
  cancelBox: { backgroundColor: "rgba(139,26,26,0.07)", borderLeftWidth: 3, borderLeftColor: "#8B1A1A", borderRadius: 8, padding: 12, marginTop: 12 },
  cancelBoxHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  cancelBoxTitle: { fontSize: 10, fontWeight: "800", color: "#8B1A1A", letterSpacing: 0.6, textTransform: "uppercase" },
  cancelBoxBody: { fontSize: 13, color: "rgba(10,30,12,0.70)", lineHeight: 18, fontStyle: "italic" },

  // Action buttons
  actionRow: { marginTop: 14, gap: 10 },
  btnReceive: {
    backgroundColor: GREEN_MID, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "rgba(26,92,46,0.45)",
    shadowColor: GREEN_DARK, shadowOpacity: 0.22, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3,
  },
  btnCancel: {
    backgroundColor: "#7A1515", borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "rgba(122,21,21,0.45)",
  },
  btnPip:    { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(245,240,232,0.18)", alignItems: "center", justifyContent: "center" },
  btnPipRed: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(245,240,232,0.15)", alignItems: "center", justifyContent: "center" },
  btnReceiveText: { color: CREAM, fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },
  btnCancelText:  { color: CREAM, fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },

  // Admin
  adminSection: { marginTop: 4 },
  adminTitle: { fontSize: 11, fontWeight: "700", color: GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  pickerWrap: { backgroundColor: GREEN_SOFT, borderRadius: 10, borderWidth: 1, borderColor: GOLD_BORDER, marginBottom: 12, overflow: "hidden" },
  picker:     { color: GREEN_DARK, height: 48 },
  btnUpdate: {
    backgroundColor: GOLD, borderRadius: 14, paddingVertical: 13,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: "#5C3D00", shadowOpacity: 0.28, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3,
  },
  btnUpdateText: { color: GREEN_DARK, fontSize: 14, fontWeight: "900", letterSpacing: 0.4 },
  btnViewDetails: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    backgroundColor: GREEN_SOFT,
  },
  btnViewDetailsText: { fontSize: 13, fontWeight: "700", color: GREEN_DARK, letterSpacing: 0.3 },
  btnAdminCancel: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    paddingVertical: 11, marginTop: 10, borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(139,26,26,0.32)", backgroundColor: "rgba(139,26,26,0.06)",
  },
  btnAdminCancelText: { fontSize: 13, fontWeight: "700", color: "#8B1A1A", letterSpacing: 0.3 },

  // Tap hint
  tapHint:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 },
  tapHintLine: { flex: 1, height: 1, backgroundColor: GOLD_BORDER },
  tapHintText: { fontSize: 10, color: "rgba(201,168,76,0.50)", fontWeight: "600", letterSpacing: 0.4, fontStyle: "italic" },
});

// ─── Modal ────────────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(7,18,9,0.78)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: CREAM, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 42,
    borderTopWidth: 1, borderColor: GOLD_BORDER,
  },
  handle: { width: 40, height: 4, borderRadius: 99, backgroundColor: "rgba(10,30,12,0.14)", alignSelf: "center", marginBottom: 22 },
  iconCircle: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: "rgba(139,26,26,0.09)", alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 14, borderWidth: 1, borderColor: "rgba(139,26,26,0.22)",
  },
  title:    { fontSize: 20, fontWeight: "900", color: GREEN_DARK, textAlign: "center", marginBottom: 6, letterSpacing: 0.3 },
  subtitle: { fontSize: 13, color: "rgba(10,30,12,0.52)", textAlign: "center", lineHeight: 19, paddingHorizontal: 10 },
  inputLabel: { fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 },
  input: {
    backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: GOLD_BORDER,
    color: GREEN_DARK, padding: 14, fontSize: 14, textAlignVertical: "top", minHeight: 100,
    marginBottom: 22,
  },
  btnRow:    { flexDirection: "row", gap: 12 },
  btnClose:  { flex: 1, backgroundColor: "rgba(10,30,12,0.06)", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: GOLD_BORDER },
  btnCloseText: { color: GREEN_MID, fontSize: 14, fontWeight: "700" },
  btnConfirm: {
    flex: 1, backgroundColor: "#7A1515", borderRadius: 14, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: "#3a0000", shadowOpacity: 0.25, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3,
  },
  btnConfirmText: { color: CREAM, fontSize: 14, fontWeight: "800" },
});

export default OrderCard;