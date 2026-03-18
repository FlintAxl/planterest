import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, Image, Modal, TextInput,
  Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from '../../assets/common/baseurl';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:          '#F8F4EC',
  bgCard:      '#FFFFFF',
  gold:        '#C9A84C',
  goldDeep:    '#A87B28',
  goldLight:   'rgba(201,168,76,0.12)',
  goldBorder:  'rgba(201,168,76,0.28)',
  greenDark:   '#0B1F10',
  greenMid:    '#1A5C2E',
  greenDeep:   '#122B18',
  greenSoft:   'rgba(26,92,46,0.08)',
  greenBorder: 'rgba(26,92,46,0.18)',
  mutedText:   'rgba(11,31,16,0.48)',
  red:         '#8B1A1A',
  redLight:    'rgba(139,26,26,0.08)',
  redBorder:   'rgba(139,26,26,0.25)',
  amber:       '#B5650D',
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  '3': { label: 'Pending',   icon: 'time-outline',             color: '#9A7200', bg: 'rgba(184,134,11,0.10)', border: 'rgba(184,134,11,0.28)' },
  '2': { label: 'Shipped',   icon: 'paper-plane-outline',      color: '#1A6B3C', bg: 'rgba(26,107,60,0.10)',  border: 'rgba(26,107,60,0.28)'  },
  '1': { label: 'Delivered', icon: 'checkmark-circle-outline', color: '#1A5C2E', bg: 'rgba(26,92,46,0.12)',   border: 'rgba(26,92,46,0.32)'   },
  '4': { label: 'Cancelled', icon: 'close-circle-outline',     color: '#8B1A1A', bg: 'rgba(139,26,26,0.08)',  border: 'rgba(139,26,26,0.25)'  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getImageUrl = (imageName) => {
  if (!imageName) return null;
  if (imageName.startsWith('http://') || imageName.startsWith('https://')) return imageName;
  const clean = imageName.startsWith('/') ? imageName.slice(1) : imageName;
  return `${baseURL}products/uploads/${clean}`;
};

const fmt = (price) => parseFloat(price || 0).toFixed(2);

// ─── Decorative helpers ───────────────────────────────────────────────────────
const GoldBar = () => (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: C.gold }} />
);

const GoldDivider = ({ style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', marginVertical: 13 }, style]}>
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
    <View style={{ width: 5, height: 5, backgroundColor: C.gold, transform: [{ rotate: '45deg' }], marginHorizontal: 8 }} />
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
  </View>
);

const CornerRings = ({ size = 80, color = C.goldBorder }) => (
  <View style={{ position: 'absolute', top: -size * 0.3, right: -size * 0.3, width: size, height: size }} pointerEvents="none">
    {[1, 0.65, 0.38].map((s, i) => (
      <View key={i} style={{
        position: 'absolute',
        width: size * s, height: size * s, borderRadius: (size * s) / 2,
        borderWidth: 1, borderColor: color,
        top: (size - size * s) / 2, left: (size - size * s) / 2,
      }} />
    ))}
  </View>
);

const DotCluster = ({ style }) => (
  <View style={[{ position: 'absolute', gap: 4 }, style]} pointerEvents="none">
    {[0, 1, 2].map(r => (
      <View key={r} style={{ flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2].map(col => (
          <View key={col} style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.goldBorder, opacity: 1 - (r + col) * 0.1 }} />
        ))}
      </View>
    ))}
  </View>
);

// ─── Section card wrapper ─────────────────────────────────────────────────────
const Card = ({ icon, title, badge, badgeBg, children, style }) => (
  <View style={[card.wrap, style]}>
    <GoldBar />
    <CornerRings size={56} color="rgba(201,168,76,0.18)" />
    <View style={card.head}>
      <View style={card.iconCircle}>
        <Ionicons name={icon} size={13} color={C.gold} />
      </View>
      <Text style={card.title}>{title}</Text>
      {badge && (
        <View style={[card.badge, { backgroundColor: badgeBg || C.greenDark }]}>
          <Text style={card.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
    <GoldDivider style={{ marginTop: 8 }} />
    {children}
  </View>
);
const card = StyleSheet.create({
  wrap:       { backgroundColor: C.bgCard, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.goldBorder, paddingHorizontal: 18, paddingTop: 20, paddingBottom: 18, marginBottom: 14, shadowColor: '#071209', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 5 }, shadowRadius: 12, elevation: 4 },
  head:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 13, fontWeight: '900', color: C.greenDark, flex: 1, letterSpacing: 0.2 },
  badge:      { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText:  { fontSize: 8, fontWeight: '800', color: C.gold, letterSpacing: 1.5 },
});

// ─── Address info row ─────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, last }) => (
  <View style={[ir.wrap, last && { borderBottomWidth: 0 }]}>
    <View style={ir.left}>
      <View style={ir.pip}><Ionicons name={icon} size={10} color={C.gold} /></View>
      <Text style={ir.label}>{label}</Text>
    </View>
    <Text style={ir.value} numberOfLines={2}>{value || '—'}</Text>
  </View>
);
const ir = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.goldBorder },
  left:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pip:   { width: 18, height: 18, borderRadius: 9, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '700', color: C.mutedText, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 12, fontWeight: '700', color: C.greenDark, maxWidth: '55%', textAlign: 'right' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const OrderDetails = () => {
  const navigation = useNavigation();
  const route      = useRoute();
  const { order, isCustomer } = route.params;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason,    setCancelReason]    = useState('');
  const [loading,         setLoading]         = useState(false);

  const statusCfg = STATUS[order.status] || STATUS['3'];
  const orderId   = order.id || order._id || '';
  const orderRef  = typeof orderId === 'string' ? orderId.slice(-6).toUpperCase() : orderId;

  const calculateTotal = () =>
    order.orderItems?.reduce((t, i) => t + (i.product?.price || 0) * (i.quantity || 1), 0) ?? order.totalPrice ?? 0;

  const handleReceiveOrder = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwt');
      await axios.put(`${baseURL}orders/${orderId}`, {
        ...order, id: orderId, status: '1',
      }, { headers: { Authorization: `Bearer ${token}` } });
      Toast.show({ topOffset: 60, type: 'success', text1: 'Order Received', text2: 'Thank you! Marked as received.' });
      setTimeout(() => navigation.goBack(), 500);
    } catch {
      Toast.show({ topOffset: 60, type: 'error', text1: 'Error', text2: 'Failed to update order.' });
    } finally { setLoading(false); }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) { Alert.alert('Required', 'Please provide a reason.'); return; }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwt');
      await axios.put(`${baseURL}orders/${orderId}/cancel`, { cancelReason }, { headers: { Authorization: `Bearer ${token}` } });
      Toast.show({ topOffset: 60, type: 'success', text1: 'Order Cancelled' });
      setShowCancelModal(false); setCancelReason('');
      setTimeout(() => navigation.goBack(), 500);
    } catch {
      Toast.show({ topOffset: 60, type: 'error', text1: 'Error', text2: 'Failed to cancel order.' });
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.orbTR} />
      <View style={styles.orbBL} />
      <DotCluster style={{ top: 80, right: 14 }} />

      {/* ── STICKY TOP NAVBAR ── */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={16} color={C.gold} />
          <Text style={styles.navBackText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Order Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── ORDER IDENTITY CARD ── */}
        <View style={styles.identityCard}>
          <GoldBar />
          <CornerRings />

          <View style={styles.idRow}>
            {/* Ref + date */}
            <View style={styles.idLeft}>
              <View style={styles.idTagRow}>
                <View style={styles.idTag}><Text style={styles.idTagText}>ORDER</Text></View>
                <Text style={styles.idRef}>#{orderRef}</Text>
              </View>
              <Text style={styles.idDate}>
                <Ionicons name="calendar-outline" size={11} color={C.mutedText} />{'  '}
                {order.dateOrdered?.split('T')?.[0] || '—'}
              </Text>
            </View>

            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
              <Ionicons name={statusCfg.icon} size={13} color={statusCfg.color} />
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          </View>

          <GoldDivider />

          {/* Quick meta strip */}
          <View style={styles.metaStrip}>
            <View style={styles.metaItem}>
              <Ionicons name="cube-outline" size={12} color={C.gold} />
              <Text style={styles.metaText}>{order.orderItems?.length || 0} item{order.orderItems?.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Ionicons name="call-outline" size={12} color={C.gold} />
              <Text style={styles.metaText}>{order.phone || 'No phone'}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={12} color={C.gold} />
              <Text style={styles.metaText}>{order.city || '—'}</Text>
            </View>
          </View>
        </View>

        {/* ── SHIPPING CARD ── */}
        <Card icon="location-outline" title="Shipping Address" badge="DELIVERY">
          <InfoRow icon="home-outline"     label="Address 1" value={order.shippingAddress1} />
          <InfoRow icon="business-outline" label="Address 2" value={order.shippingAddress2} />
          <InfoRow icon="map-outline"      label="City"      value={`${order.city || '—'}, ${order.zip || '—'}`} />
          <InfoRow icon="flag-outline"     label="Country"   value={order.country} />
          <InfoRow icon="call-outline"     label="Phone"     value={order.phone} last />
        </Card>

        {/* ── ORDER ITEMS CARD ── */}
        <Card icon="leaf-outline" title="Order Items" badge={`${order.orderItems?.length || 0} ITEMS`} badgeBg={C.greenMid}>
          {order.orderItems?.length > 0 ? (
            <FlatList
              scrollEnabled={false}
              data={order.orderItems}
              keyExtractor={(item, idx) => item._id?.toString() || `item-${idx}`}
              renderItem={({ item, index }) => {
                const isLast = index === order.orderItems.length - 1;
                return (
                  <View style={[styles.itemRow, isLast && { marginBottom: 0 }]}>
                    <View style={styles.itemAccent} />

                    {/* Image */}
                    <View style={styles.itemImageWrap}>
                      {item.product?.image ? (
                        <Image style={styles.itemImage} source={{ uri: getImageUrl(item.product.image) }} />
                      ) : (
                        <View style={[styles.itemImage, styles.imagePlaceholder]}>
                          <Ionicons name="leaf-outline" size={22} color={C.goldBorder} />
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName} numberOfLines={2}>{item.product?.name || 'Unknown Product'}</Text>
                      <View style={styles.itemMeta}>
                        <Text style={styles.itemUnitPrice}>${fmt(item.product?.price)} each</Text>
                        <View style={styles.itemQtyTag}>
                          <Text style={styles.itemQtyText}>×{item.quantity || 1}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Line total */}
                    <Text style={styles.itemTotal}>${fmt((item.product?.price || 0) * (item.quantity || 1))}</Text>
                  </View>
                );
              }}
            />
          ) : (
            <View style={styles.noItemsWrap}>
              <Ionicons name="cube-outline" size={24} color={C.goldBorder} />
              <Text style={styles.noItemsText}>No items found</Text>
            </View>
          )}
        </Card>

        {/* ── PRICE SUMMARY CARD ── */}
        <Card icon="receipt-outline" title="Price Summary">
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>${fmt(calculateTotal())}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping</Text>
            <View style={styles.freeChip}><Text style={styles.freeChipText}>FREE</Text></View>
          </View>

          {/* Final total block */}
          <View style={styles.totalBlock}>
            <View style={styles.totalBlockInner}>
              <View>
                <Text style={styles.totalBlockLabel}>ORDER TOTAL</Text>
                <Text style={styles.totalBlockHint}>Incl. shipping</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text style={styles.totalCurrency}>$</Text>
                <Text style={styles.totalAmt}>{fmt(calculateTotal())}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* ── CANCELLATION REASON ── */}
        {order.status === '4' && order.cancelReason && (
          <View style={styles.cancelReasonCard}>
            <GoldBar />
            <View style={styles.cancelReasonHead}>
              <Ionicons name="alert-circle-outline" size={14} color={C.red} />
              <Text style={styles.cancelReasonTitle}>Cancellation Reason</Text>
            </View>
            <Text style={styles.cancelReasonText}>{order.cancelReason}</Text>
          </View>
        )}

        {/* ── CUSTOMER ACTIONS ── */}
        {isCustomer && (
          <View style={styles.actionSection}>
            {order.status === '2' && (
              <TouchableOpacity style={styles.receiveBtn} onPress={handleReceiveOrder} disabled={loading} activeOpacity={0.88}>
                {loading ? (
                  <ActivityIndicator size="small" color={C.greenDark} />
                ) : (
                  <>
                    <View style={styles.actionIconCircle}>
                      <Ionicons name="checkmark-outline" size={16} color={C.greenDark} />
                    </View>
                    <Text style={styles.receiveBtnText}>Mark as Received</Text>
                    <Ionicons name="chevron-forward-outline" size={14} color={C.greenDark} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                  </>
                )}
              </TouchableOpacity>
            )}
            {order.status === '3' && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCancelModal(true)} disabled={loading} activeOpacity={0.88}>
                <View style={styles.actionIconCircleRed}>
                  <Ionicons name="close-outline" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.cancelBtnText}>Cancel Order</Text>
                <Ionicons name="chevron-forward-outline" size={14} color="#FFFFFF" style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ══════ CANCEL MODAL ══════ */}
      <Modal animationType="slide" transparent visible={showCancelModal} onRequestClose={() => setShowCancelModal(false)}>
        <View style={modal.overlay}>
          <View style={modal.sheet}>
            <GoldBar />
            <CornerRings size={50} color="rgba(201,168,76,0.18)" />
            <View style={modal.handle} />

            <View style={modal.iconCircle}>
              <Ionicons name="alert-circle-outline" size={30} color={C.red} />
            </View>
            <Text style={modal.title}>Cancel Order</Text>
            <Text style={modal.subtitle}>This cannot be undone. Please describe your reason below.</Text>

            <GoldDivider />

            <Text style={modal.inputLabel}>REASON FOR CANCELLATION</Text>
            <TextInput
              style={modal.input}
              placeholder="e.g. Changed my mind, ordered wrong item…"
              placeholderTextColor={C.mutedText}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={4}
            />

            <View style={modal.btnRow}>
              <TouchableOpacity style={modal.btnClose} onPress={() => { setShowCancelModal(false); setCancelReason(''); }}>
                <Text style={modal.btnCloseText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modal.btnConfirm} onPress={handleCancelOrder} disabled={loading}>
                <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                <Text style={modal.btnConfirmText}>{loading ? 'Processing…' : 'Confirm Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.bg },
  orbTR:         { position: 'absolute', top: -80,  right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(201,168,76,0.08)' },
  orbBL:         { position: 'absolute', top: 380,  left: -70,  width: 180, height: 180, borderRadius: 90,  backgroundColor: 'rgba(26,92,46,0.06)' },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24 },

  // Navbar
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12, paddingTop: 16,
    backgroundColor: C.bgCard,
    borderBottomWidth: 1, borderBottomColor: C.goldBorder,
    shadowColor: '#071209', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 4,
  },
  navBackBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.goldBorder, backgroundColor: C.goldLight },
  navBackText: { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 0.3 },
  navTitle:    { fontSize: 15, fontWeight: '900', color: C.greenDark, letterSpacing: 0.2 },

  // Identity card
  identityCard: {
    backgroundColor: C.bgCard, borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 20, paddingBottom: 16, marginBottom: 14,
    shadowColor: '#071209', shadowOpacity: 0.09, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 5,
  },
  idRow:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  idLeft:      {},
  idTagRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  idTag:       { backgroundColor: C.greenDark, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  idTagText:   { fontSize: 9, fontWeight: '800', color: C.gold, letterSpacing: 1.5 },
  idRef:       { fontSize: 20, fontWeight: '900', color: C.greenDark, letterSpacing: 0.3 },
  idDate:      { fontSize: 11, color: C.mutedText, fontWeight: '500' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginTop: 2 },
  statusText:  { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  // Meta strip
  metaStrip: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:  { fontSize: 11, fontWeight: '700', color: C.greenDark },
  metaDot:   { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.goldBorder },

  // Item rows
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.goldBorder,
    marginBottom: 10, paddingVertical: 12, paddingRight: 12,
    overflow: 'hidden', gap: 12,
  },
  itemAccent:      { width: 4, alignSelf: 'stretch', backgroundColor: C.gold, borderRadius: 2 },
  itemImageWrap:   {},
  itemImage:       { width: 54, height: 54, borderRadius: 11, borderWidth: 1, borderColor: C.goldBorder, backgroundColor: C.goldLight },
  imagePlaceholder:{ alignItems: 'center', justifyContent: 'center' },
  itemName:        { fontSize: 13, fontWeight: '800', color: C.greenDark, marginBottom: 6, lineHeight: 17 },
  itemMeta:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemUnitPrice:   { fontSize: 11, fontWeight: '700', color: C.mutedText, fontStyle: 'italic' },
  itemQtyTag:      { backgroundColor: C.goldLight, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.goldBorder },
  itemQtyText:     { fontSize: 11, fontWeight: '900', color: C.greenDark },
  itemTotal:       { fontSize: 14, fontWeight: '900', color: C.goldDeep, minWidth: 56, textAlign: 'right' },
  noItemsWrap:     { alignItems: 'center', paddingVertical: 20, gap: 8 },
  noItemsText:     { fontSize: 13, color: C.mutedText, fontStyle: 'italic' },

  // Price summary
  priceRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.goldBorder },
  priceLabel:    { fontSize: 12, fontWeight: '600', color: C.mutedText, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceValue:    { fontSize: 13, fontWeight: '700', color: C.greenDark },
  freeChip:      { backgroundColor: C.greenSoft, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: C.greenBorder },
  freeChipText:  { fontSize: 10, fontWeight: '900', color: C.greenMid, letterSpacing: 0.5 },
  totalBlock:    { backgroundColor: C.greenSoft, borderRadius: 14, borderWidth: 1, borderColor: C.greenBorder, marginTop: 8 },
  totalBlockInner:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14 },
  totalBlockLabel:{ fontSize: 10, fontWeight: '800', color: C.greenMid, textTransform: 'uppercase', letterSpacing: 1.2 },
  totalBlockHint: { fontSize: 10, color: C.mutedText, marginTop: 2, fontStyle: 'italic' },
  totalCurrency:  { fontSize: 13, fontWeight: '800', color: C.gold, marginTop: 4, marginRight: 1 },
  totalAmt:       { fontSize: 26, fontWeight: '900', color: C.greenDark, lineHeight: 28 },

  // Cancel reason
  cancelReasonCard: { backgroundColor: C.bgCard, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderLeftWidth: 4, borderColor: C.redBorder, borderLeftColor: C.red, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16, marginBottom: 14 },
  cancelReasonHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  cancelReasonTitle:{ fontSize: 11, fontWeight: '800', color: C.red, textTransform: 'uppercase', letterSpacing: 0.6 },
  cancelReasonText: { fontSize: 13, color: C.mutedText, lineHeight: 19, fontStyle: 'italic' },

  // Actions
  actionSection: { gap: 10, marginBottom: 4 },
  receiveBtn: {
    backgroundColor: C.gold, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#5C3D00', shadowOpacity: 0.26, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3,
  },
  actionIconCircle:    { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(11,31,16,0.14)', alignItems: 'center', justifyContent: 'center' },
  receiveBtnText:      { fontSize: 14, fontWeight: '900', color: C.greenDark, letterSpacing: 0.3 },
  cancelBtn: {
    backgroundColor: C.red, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: C.redBorder,
  },
  actionIconCircleRed: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(248,244,236,0.15)', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText:       { fontSize: 14, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.3 },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(7,18,9,0.60)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 42, borderTopWidth: 1, borderColor: C.goldBorder },
  handle:      { width: 40, height: 4, borderRadius: 99, backgroundColor: C.goldBorder, alignSelf: 'center', marginBottom: 22 },
  iconCircle:  { width: 62, height: 62, borderRadius: 31, backgroundColor: C.redLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14, borderWidth: 1, borderColor: C.redBorder },
  title:       { fontSize: 20, fontWeight: '900', color: C.greenDark, textAlign: 'center', marginBottom: 6, letterSpacing: 0.3 },
  subtitle:    { fontSize: 13, color: C.mutedText, textAlign: 'center', lineHeight: 19, paddingHorizontal: 10 },
  inputLabel:  { fontSize: 10, fontWeight: '800', color: C.gold, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  input:       { backgroundColor: C.bgCard, borderRadius: 12, borderWidth: 1, borderColor: C.goldBorder, color: C.greenDark, padding: 14, fontSize: 14, textAlignVertical: 'top', minHeight: 100, marginBottom: 22 },
  btnRow:      { flexDirection: 'row', gap: 12 },
  btnClose:    { flex: 1, backgroundColor: C.greenSoft, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: C.greenBorder },
  btnCloseText:{ color: C.greenMid, fontSize: 14, fontWeight: '700' },
  btnConfirm:  { flex: 1, backgroundColor: C.red, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnConfirmText:{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});

export default OrderDetails;