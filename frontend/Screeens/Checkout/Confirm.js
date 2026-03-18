import React, { useState, useContext } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from '../../assets/common/baseurl';
import AuthGlobal from '../../Context/Store/AuthGlobal';
import Toast from 'react-native-toast-message';
import { clearCart } from '../../Redux/Actions/cartActions';

var { width, height } = Dimensions.get('window');

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
  greenSoft:   'rgba(26,92,46,0.08)',
  greenBorder: 'rgba(26,92,46,0.18)',
  mutedText:   'rgba(11,31,16,0.48)',
  amber:       '#B5650D',
  amberLight:  'rgba(181,101,13,0.10)',
};

// ─── Decorative helpers ───────────────────────────────────────────────────────
const GoldBar = () => (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: C.gold }} />
);

const GoldDivider = ({ style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', marginVertical: 14 }, style]}>
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

// ─── Info row inside shipping card ───────────────────────────────────────────
const InfoRow = ({ label, value, icon, last }) => (
  <View style={[infoRow.wrap, last && { borderBottomWidth: 0 }]}>
    <View style={infoRow.left}>
      <View style={infoRow.iconPip}>
        <Ionicons name={icon} size={10} color={C.gold} />
      </View>
      <Text style={infoRow.label}>{label}</Text>
    </View>
    <Text style={infoRow.value} numberOfLines={2}>{value || '—'}</Text>
  </View>
);
const infoRow = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.goldBorder },
  left:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  iconPip: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 11, fontWeight: '700', color: C.mutedText, textTransform: 'uppercase', letterSpacing: 0.5 },
  value:   { fontSize: 13, fontWeight: '700', color: C.greenDark, maxWidth: '55%', textAlign: 'right' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const Confirm = (props) => {
  const context    = useContext(AuthGlobal);
  const [token,    setToken] = useState();
  const dispatch   = useDispatch();
  const navigation = useNavigation();

  const finalOrder = props.route.params;
  const order      = finalOrder?.order?.order;

  const subtotal = order?.orderItems?.reduce((s, i) => s + i.price * (i.quantity || 1), 0) ?? 0;
  const savedAmt = order?.orderItems?.reduce((s, i) => {
    if (i.discountPercentage && i.originalPrice)
      return s + (i.originalPrice - i.price) * (i.quantity || 1);
    return s;
  }, 0) ?? 0;
  const hasDiscount = savedAmt > 0;

  const confirmOrder = () => {
    AsyncStorage.getItem('jwt')
      .then(res => { setToken(res); })
      .catch(console.log);

    axios.post(`${baseURL}orders`, order, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        Toast.show({ topOffset: 60, type: 'success', text1: 'Order Placed!', text2: 'Your plants are on their way 🌿' });
        setTimeout(() => {
          dispatch(clearCart(context.stateUser?.user?.userId));
          navigation.navigate('Cart Screen', { screen: 'Cart' });
        }, 500);
      })
      .catch(() => Toast.show({ topOffset: 60, type: 'error', text1: 'Something went wrong', text2: 'Please try again' }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.orbTR} />
      <View style={styles.orbBL} />
      <DotCluster style={{ top: 80, right: 16 }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── PAGE HEADER ── */}
        <View style={styles.headerCard}>
          <GoldBar />
          <CornerRings />
          <View style={styles.headerRow}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="receipt-outline" size={20} color={C.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.taglineRow}>
                <View style={styles.taglineLine} />
                <Text style={styles.taglineText}>STEP 03</Text>
                <View style={styles.taglineLine} />
              </View>
              <Text style={styles.headerTitle}>Review Order</Text>
              <Text style={styles.headerSub}>Check all details before placing your order</Text>
            </View>
          </View>
        </View>

        {props.route.params ? (
          <>
            {/* ── SHIPPING CARD ── */}
            <View style={styles.card}>
              <GoldBar />
              <CornerRings size={56} color="rgba(201,168,76,0.18)" />

              <View style={styles.sectionHead}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="location-outline" size={13} color={C.gold} />
                </View>
                <Text style={styles.sectionTitle}>Shipping To</Text>
                <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>DELIVERY</Text></View>
              </View>

              <GoldDivider style={{ marginTop: 8 }} />

              <InfoRow icon="home-outline"     label="Address"   value={order?.shippingAddress1} />
              <InfoRow icon="business-outline" label="Address 2" value={order?.shippingAddress2} />
              <InfoRow icon="map-outline"      label="City"      value={order?.city} />
              <InfoRow icon="mail-outline"     label="ZIP Code"  value={order?.zip} />
              <InfoRow icon="flag-outline"     label="Country"   value={order?.country} last />
            </View>

            {/* ── ORDER ITEMS CARD ── */}
            <View style={styles.card}>
              <GoldBar />

              <View style={styles.sectionHead}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="leaf-outline" size={13} color={C.gold} />
                </View>
                <Text style={styles.sectionTitle}>Order Items</Text>
                <View style={[styles.sectionBadge, { backgroundColor: C.greenMid }]}>
                  <Text style={styles.sectionBadgeText}>{order?.orderItems?.length} ITEM{order?.orderItems?.length !== 1 ? 'S' : ''}</Text>
                </View>
              </View>

              <GoldDivider style={{ marginTop: 8 }} />

              {order?.orderItems?.map((item, idx) => {
                const hasItemDiscount = item.discountPercentage > 0;
                return (
                  <View style={[styles.itemRow, idx === order.orderItems.length - 1 && { marginBottom: 0 }]} key={item.id || idx}>
                    {/* Left accent */}
                    <View style={styles.itemAccent} />

                    {/* Image */}
                    <View style={styles.itemImageWrap}>
                      <Image
                        style={styles.itemImage}
                        source={{ uri: item.image || 'https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png' }}
                      />
                      {hasItemDiscount && (
                        <View style={styles.salePill}>
                          <Text style={styles.salePillText}>SALE</Text>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                      <View style={styles.itemPriceRow}>
                        <Text style={styles.itemPrice}>${item.price}</Text>
                        {hasItemDiscount && (
                          <>
                            <Text style={styles.itemOriginalPrice}>${item.originalPrice}</Text>
                            <View style={styles.discBadge}>
                              <Text style={styles.discBadgeText}>{item.discountPercentage}% OFF</Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>

                    {/* Qty */}
                    <View style={styles.qtyTag}>
                      <Text style={styles.qtyTagText}>×{item.quantity || 1}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* ── TOTAL CARD ── */}
            <View style={styles.card}>
              <GoldBar />

              <View style={styles.sectionHead}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="calculator-outline" size={13} color={C.gold} />
                </View>
                <Text style={styles.sectionTitle}>Order Summary</Text>
              </View>

              <GoldDivider style={{ marginTop: 8 }} />

              {/* Subtotal */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>

              {/* Savings */}
              {hasDiscount && (
                <View style={[styles.summaryRow, styles.savingsRow]}>
                  <View style={styles.savingsLeft}>
                    <Ionicons name="sparkles-outline" size={12} color={C.gold} />
                    <Text style={styles.savingsLabel}>You Save</Text>
                  </View>
                  <Text style={styles.savingsValue}>-${savedAmt.toFixed(2)}</Text>
                </View>
              )}

              {/* Divider + final */}
              <View style={styles.totalFinalWrap}>
                <View style={styles.totalFinalRow}>
                  <View>
                    <Text style={styles.totalFinalLabel}>ORDER TOTAL</Text>
                    <Text style={styles.totalFinalHint}>Incl. all discounts</Text>
                  </View>
                  <View style={styles.totalAmtRow}>
                    <Text style={styles.totalCurrency}>$</Text>
                    <Text style={styles.totalAmt}>{subtotal.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── PLACE ORDER CTA ── */}
            <TouchableOpacity style={styles.ctaBtn} onPress={confirmOrder} activeOpacity={0.88}>
              <View style={styles.ctaIconCircle}>
                <Ionicons name="bag-check-outline" size={18} color={C.greenDark} />
              </View>
              <Text style={styles.ctaBtnText}>Place Order</Text>
              <Ionicons name="chevron-forward-outline" size={15} color={C.greenDark} style={{ marginLeft: 'auto', opacity: 0.6 }} />
            </TouchableOpacity>

            {/* Reassurance note */}
            <View style={styles.reassuranceRow}>
              <Ionicons name="shield-checkmark-outline" size={13} color={C.mutedText} />
              <Text style={styles.reassuranceText}>Your order is secured and encrypted</Text>
            </View>
          </>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.bg },
  orbTR:         { position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(201,168,76,0.08)' },
  orbBL:         { position: 'absolute', top: 340, left: -70,  width: 180, height: 180, borderRadius: 90,  backgroundColor: 'rgba(26,92,46,0.06)' },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14 },

  // Header card
  headerCard: {
    backgroundColor: C.bgCard, borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 22, paddingBottom: 16, marginBottom: 14,
    shadowColor: '#071209', shadowOpacity: 0.09, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 5,
  },
  headerRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  headerIconCircle: { width: 44, height: 44, borderRadius: 13, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  taglineRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  taglineLine:      { height: 1, width: 16, backgroundColor: C.goldBorder },
  taglineText:      { fontSize: 8, fontWeight: '800', color: C.goldBorder, letterSpacing: 2, textTransform: 'uppercase' },
  headerTitle:      { fontSize: 20, fontWeight: '900', color: C.greenDark, letterSpacing: 0.2 },
  headerSub:        { fontSize: 11, color: C.mutedText, fontWeight: '500', marginTop: 3 },

  // Generic white card
  card: {
    backgroundColor: C.bgCard, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 20, paddingBottom: 18, marginBottom: 14,
    shadowColor: '#071209', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 5 }, shadowRadius: 12, elevation: 4,
  },
  sectionHead:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:      { fontSize: 13, fontWeight: '900', color: C.greenDark, flex: 1, letterSpacing: 0.2 },
  sectionBadge:      { backgroundColor: C.greenDark, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  sectionBadgeText:  { fontSize: 8, fontWeight: '800', color: C.gold, letterSpacing: 1.5 },

  // Order item rows
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 14,
    borderWidth: 1, borderColor: C.goldBorder,
    marginBottom: 10, paddingVertical: 12, paddingRight: 12,
    overflow: 'hidden', gap: 12,
  },
  itemAccent:   { width: 4, alignSelf: 'stretch', backgroundColor: C.gold, borderRadius: 2 },
  itemImageWrap:{ position: 'relative' },
  itemImage:    { width: 52, height: 52, borderRadius: 11, borderWidth: 1, borderColor: C.goldBorder, backgroundColor: C.goldLight },
  salePill:     { position: 'absolute', top: -4, right: -4, backgroundColor: C.amber, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2, borderWidth: 1.5, borderColor: '#FFFFFF' },
  salePillText: { fontSize: 7, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  itemName:     { fontSize: 13, fontWeight: '800', color: C.greenDark, marginBottom: 5, lineHeight: 17 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemPrice:    { fontSize: 14, fontWeight: '900', color: C.goldDeep },
  itemOriginalPrice: { fontSize: 11, color: C.mutedText, textDecorationLine: 'line-through' },
  discBadge:    { backgroundColor: C.amberLight, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(181,101,13,0.28)' },
  discBadgeText:{ fontSize: 9, fontWeight: '800', color: C.amber },
  qtyTag: {
    backgroundColor: C.goldLight, borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 5,
    borderWidth: 1, borderColor: C.goldBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyTagText: { fontSize: 12, fontWeight: '900', color: C.greenDark },

  // Summary rows
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabel:  { fontSize: 13, fontWeight: '600', color: C.mutedText },
  summaryValue:  { fontSize: 14, fontWeight: '700', color: C.greenDark },
  savingsRow:    { backgroundColor: C.goldLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: C.goldBorder, marginBottom: 8 },
  savingsLeft:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  savingsLabel:  { fontSize: 12, fontWeight: '700', color: C.goldDeep },
  savingsValue:  { fontSize: 13, fontWeight: '900', color: C.goldDeep },

  // Total final block
  totalFinalWrap:  { backgroundColor: C.greenSoft, borderRadius: 14, borderWidth: 1, borderColor: C.greenBorder, marginTop: 4 },
  totalFinalRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14 },
  totalFinalLabel: { fontSize: 10, fontWeight: '800', color: C.greenMid, textTransform: 'uppercase', letterSpacing: 1.2 },
  totalFinalHint:  { fontSize: 10, color: C.mutedText, marginTop: 3, fontStyle: 'italic' },
  totalAmtRow:     { flexDirection: 'row', alignItems: 'flex-start' },
  totalCurrency:   { fontSize: 14, fontWeight: '800', color: C.gold, marginTop: 5, marginRight: 1 },
  totalAmt:        { fontSize: 28, fontWeight: '900', color: C.greenDark, lineHeight: 30 },

  // CTA
  ctaBtn: {
    backgroundColor: C.gold, borderRadius: 16,
    paddingVertical: 15, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#5C3D00', shadowOpacity: 0.28, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, elevation: 4,
    marginBottom: 10,
  },
  ctaIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(11,31,16,0.14)', alignItems: 'center', justifyContent: 'center' },
  ctaBtnText:    { fontSize: 15, fontWeight: '900', color: C.greenDark, letterSpacing: 0.3 },

  // Reassurance
  reassuranceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 },
  reassuranceText:{ fontSize: 11, color: C.mutedText, fontStyle: 'italic' },
});

export default Confirm;