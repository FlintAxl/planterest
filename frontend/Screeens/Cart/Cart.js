import React, { useContext } from 'react';
import {
  Text, View, TouchableHighlight, StyleSheet,
  Dimensions, TouchableOpacity, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { SwipeListView } from 'react-native-swipe-list-view';
import { removeFromCart, clearCart, updateQuantity } from '../../Redux/Actions/cartActions';
import { Ionicons } from '@expo/vector-icons';
import AuthGlobal from '../../Context/Store/AuthGlobal';

var { height, width } = Dimensions.get('window');

// ─── Palette — mostly white ───────────────────────────────────────────────────
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
  mutedText:   'rgba(11,31,16,0.50)',
  red:         '#8B1A1A',
  redLight:    'rgba(139,26,26,0.07)',
  redBorder:   'rgba(139,26,26,0.22)',
  amber:       '#B5650D',
  amberLight:  'rgba(181,101,13,0.10)',
};

// ─── Decorative helpers ───────────────────────────────────────────────────────
const GoldBar = () => (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: C.gold }} />
);

const GoldDivider = ({ style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }, style]}>
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const Cart = () => {
  const navigation    = useNavigation();
  const dispatch      = useDispatch();
  const cartItems     = useSelector(state => state.cartItems);
  const context       = useContext(AuthGlobal);
  const currentUserId = context.stateUser?.isAuthenticated
    ? context.stateUser?.user?.userId : 'guest';

  let total = 0, originalTotal = 0;
  cartItems.forEach(cart => {
    const qty = cart.quantity || 1;
    total         += cart.price * qty;
    originalTotal += (cart.originalPrice || cart.price) * qty;
  });
  const savings = originalTotal - total;

  // ── Item row ─────────────────────────────────────────────────────────────────
  const renderItem = ({ item }) => (
    <TouchableHighlight underlayColor="rgba(201,168,76,0.05)" style={row.wrapper}>
      <View style={row.card}>
        <View style={row.leftAccent} />

        <View style={row.imageWrap}>
          <Image
            style={row.image}
            source={{ uri: item.image || 'https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png' }}
          />
          {item.originalPrice && (
            <View style={row.salePill}>
              <Text style={row.salePillText}>SALE</Text>
            </View>
          )}
        </View>

        <View style={row.info}>
          <Text style={row.name} numberOfLines={2}>{item.name}</Text>
          <Text style={row.desc} numberOfLines={1}>{item.description || 'Premium quality plant'}</Text>
          <View style={row.priceRow}>
            <Text style={row.price}>${item.price}</Text>
            {item.originalPrice && (
              <>
                <Text style={row.originalPrice}>${item.originalPrice}</Text>
                <View style={row.discBadge}>
                  <Text style={row.discBadgeText}>{item.discountPercentage}% OFF</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={row.stepper}>
          <TouchableOpacity
            style={[row.stepBtn, row.stepBtnAdd]}
            onPress={() => dispatch(updateQuantity(item._id || item.id, (item.quantity || 1) + 1, currentUserId))}
          >
            <Text style={[row.stepText, { color: C.greenDark }]}>+</Text>
          </TouchableOpacity>
          <View style={row.qtyBox}>
            <Text style={row.qtyText}>{item.quantity || 1}</Text>
          </View>
          <TouchableOpacity
            style={row.stepBtn}
            onPress={() => dispatch(updateQuantity(item._id || item.id, (item.quantity || 1) - 1, currentUserId))}
          >
            <Text style={row.stepText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableHighlight>
  );

  // ── Hidden delete ─────────────────────────────────────────────────────────────
  const renderHiddenItem = (data) => (
    <View style={hidden.wrap}>
      <TouchableOpacity style={hidden.btn} onPress={() => dispatch(removeFromCart(data.item, currentUserId))}>
        <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
        <Text style={hidden.text}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Empty ─────────────────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.orbTR} />
        <View style={styles.orbBL} />
        <DotCluster style={{ top: 60, right: 20 }} />
        <View style={styles.emptyCard}>
          <GoldBar />
          <CornerRings />
          <View style={styles.emptyIconCircle}>
            <Ionicons name="bag-outline" size={36} color={C.gold} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <GoldDivider style={{ width: '50%', alignSelf: 'center' }} />
          <Text style={styles.emptySub}>Browse our collection and add some beautiful plants to get started.</Text>
          <TouchableOpacity style={styles.emptyCtaBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="leaf-outline" size={15} color="#FFFFFF" />
            <Text style={styles.emptyCtaText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Filled ────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.orbTR} />
      <View style={styles.orbBL} />
      <DotCluster style={{ top: 80, right: 16 }} />

      {/* Header */}
      <View style={styles.headerCard}>
        <GoldBar />
        <CornerRings />
        <View style={styles.headerRow}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>CART</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Shopping Cart</Text>
            <Text style={styles.headerSub}>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your basket
            </Text>
          </View>
          {savings > 0 && (
            <View style={styles.savingsBadge}>
              <Ionicons name="pricetag-outline" size={10} color={C.gold} />
              <Text style={styles.savingsBadgeText}>-${savings.toFixed(2)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* List */}
      <SwipeListView
        data={cartItems}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        disableRightSwipe={true}
        leftOpenValue={0}
        rightOpenValue={-90}
        previewOpenValue={-40}
        previewOpenDelay={3000}
        keyExtractor={item => item._id?.$oid || item.id || Math.random().toString()}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 6, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        <GoldBar />
        <CornerRings size={52} color="rgba(201,168,76,0.22)" />

        {savings > 0 && (
          <View style={styles.savingsRow}>
            <View style={styles.savingsIconCircle}>
              <Ionicons name="sparkles-outline" size={12} color={C.gold} />
            </View>
            <Text style={styles.savingsText}>
              You're saving{' '}
              <Text style={{ fontWeight: '900', color: C.goldDeep }}>${savings.toFixed(2)}</Text>
              {' '}on this order
            </Text>
          </View>
        )}

        <GoldDivider style={{ marginTop: savings > 0 ? 10 : 0, marginBottom: 2 }} />

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>ORDER TOTAL</Text>
            <Text style={styles.totalHint}>Including all discounts</Text>
          </View>
          <View style={styles.totalAmtRow}>
            <Text style={styles.totalCurrency}>$</Text>
            <Text style={styles.totalAmt}>{total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.clearBtn} onPress={() => dispatch(clearCart(currentUserId))}>
            <View style={styles.clearIconCircle}>
              <Ionicons name="trash-outline" size={13} color={C.red} />
            </View>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate('Checkout')} activeOpacity={0.88}>
            <View style={styles.checkoutIconCircle}>
              <Ionicons name="bag-check-outline" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.checkoutBtnText}>Checkout</Text>
            <Ionicons name="chevron-forward-outline" size={14} color="#FFFFFF" style={{ marginLeft: 'auto', opacity: 0.7 }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const row = StyleSheet.create({
  wrapper: { marginHorizontal: 14, marginVertical: 5, borderRadius: 18, overflow: 'hidden' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: C.goldBorder,
    paddingVertical: 13, paddingRight: 14, gap: 12,
    shadowColor: '#071209', shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 2,
  },
  leftAccent: { width: 4, alignSelf: 'stretch', backgroundColor: C.gold, borderRadius: 2 },
  imageWrap:  { position: 'relative' },
  image: {
    width: 60, height: 60, borderRadius: 12,
    borderWidth: 1, borderColor: C.goldBorder, backgroundColor: C.goldLight,
  },
  salePill: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: C.amber, borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  salePillText:  { fontSize: 7, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  info:          { flex: 1 },
  name:          { fontSize: 13, fontWeight: '900', color: C.greenDark, marginBottom: 3, lineHeight: 17 },
  desc:          { fontSize: 11, color: C.mutedText, marginBottom: 6, fontStyle: 'italic' },
  priceRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price:         { fontSize: 15, fontWeight: '900', color: C.goldDeep },
  originalPrice: { fontSize: 11, color: C.mutedText, textDecorationLine: 'line-through' },
  discBadge:     { backgroundColor: C.amberLight, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(181,101,13,0.30)' },
  discBadgeText: { fontSize: 9, fontWeight: '800', color: C.amber },
  stepper:       { alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.greenSoft, borderWidth: 1, borderColor: C.greenBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnAdd: { backgroundColor: C.goldLight, borderColor: C.goldBorder },
  stepText:   { fontSize: 16, fontWeight: '900', color: C.goldDeep, lineHeight: 18 },
  qtyBox: {
    backgroundColor: C.goldLight, borderRadius: 7,
    paddingHorizontal: 10, paddingVertical: 4,
    minWidth: 34, alignItems: 'center',
    borderWidth: 1, borderColor: C.goldBorder,
  },
  qtyText: { fontSize: 13, fontWeight: '900', color: C.greenDark },
});

const hidden = StyleSheet.create({
  wrap: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 14, marginVertical: 5 },
  btn: {
    backgroundColor: C.red, width: 76, height: '85%',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    gap: 5, borderWidth: 1, borderColor: C.redBorder,
    shadowColor: C.red, shadowOpacity: 0.2, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 3,
  },
  text: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  orbTR: { position: 'absolute', top: -80,  right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(201,168,76,0.08)' },
  orbBL: { position: 'absolute', top: 260,  left: -70,  width: 180, height: 180, borderRadius: 90,  backgroundColor: 'rgba(26,92,46,0.06)' },

  headerCard: {
    marginHorizontal: 14, marginTop: 10, marginBottom: 8,
    backgroundColor: C.bgCard, borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 20, paddingBottom: 16,
    shadowColor: '#071209', shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 5,
  },
  headerRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headerBadge:     { backgroundColor: C.greenDark, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginTop: 3 },
  headerBadgeText: { fontSize: 9, fontWeight: '900', color: C.gold, letterSpacing: 1.8 },
  headerTitle:     { fontSize: 20, fontWeight: '900', color: C.greenDark, letterSpacing: 0.2 },
  headerSub:       { fontSize: 11, color: C.mutedText, fontWeight: '500', marginTop: 3 },
  savingsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.goldLight, borderRadius: 10,
    paddingHorizontal: 9, paddingVertical: 6,
    borderWidth: 1, borderColor: C.goldBorder,
  },
  savingsBadgeText: { fontSize: 11, fontWeight: '800', color: C.goldDeep },

  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.bgCard, overflow: 'hidden',
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    borderTopWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 30,
    shadowColor: '#071209', shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: -4 }, shadowRadius: 14, elevation: 10,
  },

  savingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.goldLight, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.goldBorder,
  },
  savingsIconCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(201,168,76,0.22)', alignItems: 'center', justifyContent: 'center',
  },
  savingsText: { fontSize: 12, fontWeight: '600', color: C.greenDark, flex: 1 },

  totalRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  totalLabel:    { fontSize: 10, fontWeight: '800', color: C.mutedText, textTransform: 'uppercase', letterSpacing: 1.2 },
  totalHint:     { fontSize: 10, color: C.mutedText, marginTop: 3, fontStyle: 'italic' },
  totalAmtRow:   { flexDirection: 'row', alignItems: 'flex-start' },
  totalCurrency: { fontSize: 14, fontWeight: '800', color: C.gold, marginTop: 5, marginRight: 1 },
  totalAmt:      { fontSize: 30, fontWeight: '900', color: C.greenDark, lineHeight: 32 },

  btnRow: { flexDirection: 'row', gap: 10 },
  clearBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: C.redLight, borderRadius: 14,
    paddingVertical: 13, borderWidth: 1, borderColor: C.redBorder,
  },
  clearIconCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(139,26,26,0.14)', alignItems: 'center', justifyContent: 'center',
  },
  clearBtnText: { fontSize: 13, fontWeight: '800', color: C.red },

  checkoutBtn: {
    flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.greenMid, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(26,92,46,0.5)',
    shadowColor: '#0B1F10', shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4,
  },
  checkoutIconCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  checkoutBtnText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.3 },

  emptyCard: {
    margin: 20, marginTop: 70,
    backgroundColor: C.bgCard, borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: C.goldBorder,
    paddingVertical: 44, paddingHorizontal: 28, alignItems: 'center',
    shadowColor: '#071209', shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 4,
  },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.goldLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.goldBorder, marginBottom: 20,
  },
  emptyTitle:  { fontSize: 20, fontWeight: '900', color: C.greenDark, letterSpacing: 0.2 },
  emptySub:    { fontSize: 13, color: C.mutedText, textAlign: 'center', lineHeight: 20, fontStyle: 'italic', paddingHorizontal: 8, marginBottom: 4 },
  emptyCtaBtn: {
    marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.greenMid, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 24,
    borderWidth: 1, borderColor: 'rgba(26,92,46,0.45)',
    shadowColor: '#0B1F10', shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 7, elevation: 3,
  },
  emptyCtaText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.3 },
});

export default Cart;