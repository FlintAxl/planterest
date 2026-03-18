import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from '../../assets/common/baseurl';
import AuthGlobal from '../../Context/Store/AuthGlobal';
import OrderCard from '../../Shared/OrderCard';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:         '#0E2416',
  bgMid:      '#122B18',
  gold:       '#C9A84C',
  goldDeep:   '#A87B28',
  goldLight:  'rgba(201,168,76,0.13)',
  goldBorder: 'rgba(201,168,76,0.28)',
  white:      '#FFFFFF',
  cream:      '#F8F4EC',
  mutedCream: 'rgba(248,244,236,0.55)',
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
    {[0, 1, 2].map(row => (
      <View key={row} style={{ flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2].map(col => (
          <View key={col} style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.goldBorder, opacity: 1 - (row + col) * 0.1 }} />
        ))}
      </View>
    ))}
  </View>
);

const MiniPill = ({ value, label, icon }) => (
  <View style={pill.wrap}>
    <View style={pill.icon}><Ionicons name={icon} size={11} color={C.gold} /></View>
    <Text style={pill.value}>{value}</Text>
    <Text style={pill.label}>{label}</Text>
  </View>
);
const pill = StyleSheet.create({
  wrap:  { alignItems: 'center', gap: 3, flex: 1 },
  icon:  { width: 24, height: 24, borderRadius: 12, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 16, fontWeight: '900', color: C.white, letterSpacing: 0.2 },
  label: { fontSize: 9, fontWeight: '700', color: C.mutedCream, textTransform: 'uppercase', letterSpacing: 0.7 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const MyOrders = () => {
  const context    = useContext(AuthGlobal);
  const navigation = useNavigation();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const safeOrders     = Array.isArray(orders) ? orders : [];
  const pendingCount   = safeOrders.filter(o => o.status === '3').length;
  const deliveredCount = safeOrders.filter(o => o.status === '1').length;

  const fetchOrders = (jwt) => {
    const userId = context.stateUser.user?.userId;
    if (!userId) { setLoading(false); setRefreshing(false); return; }
    axios.get(`${baseURL}orders/my-orders/${userId}`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then(res => { setOrders(res.data); })
      .catch(err => console.log(err))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useFocusEffect(
    useCallback(() => {
      if (context.stateUser.isAuthenticated === false) {
        navigation.navigate('Login');
        return;
      }

      if (context.stateUser.isAuthenticated !== true) {
        return;
      }

      setLoading(true);
      AsyncStorage.getItem('jwt').then(fetchOrders).catch(err => { console.log(err); setLoading(false); });
      return () => setOrders([]);
    }, [context.stateUser.isAuthenticated, context.stateUser.user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    AsyncStorage.getItem('jwt').then(fetchOrders).catch(() => setRefreshing(false));
  };

  // ── Header card — injected as ListHeaderComponent so it scrolls ─────────────
  const ListHeader = () => (
    <>
      <View style={styles.headerCard}>
        <GoldBar />
        <CornerRings />

        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('User Profile')} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={14} color={C.gold} />
          <Text style={styles.backText}>Profile</Text>
        </TouchableOpacity>

        {/* Title block */}
        <View style={styles.titleBlock}>
          <View style={styles.titleIconCircle}>
            <Ionicons name="receipt-outline" size={18} color={C.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleTagRow}>
              <View style={styles.titleTagLine} />
              <Text style={styles.titleTag}>ORDER HISTORY</Text>
              <View style={styles.titleTagLine} />
            </View>
            <Text style={styles.titleMain}>My Orders</Text>
            <Text style={styles.titleSub}>Track your plant purchases & deliveries</Text>
          </View>
        </View>

        <GoldDivider />

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <MiniPill value={safeOrders.length} label="Total"     icon="receipt-outline"         />
          <View style={styles.statsDivider} />
          <MiniPill value={pendingCount}      label="Pending"   icon="time-outline"             />
          <View style={styles.statsDivider} />
          <MiniPill value={deliveredCount}    label="Delivered" icon="checkmark-circle-outline" />
        </View>
      </View>

      {/* Sub-count row */}
      {!loading && safeOrders.length > 0 && (
        <View style={styles.countRow}>
          <Ionicons name="layers-outline" size={12} color={C.mutedCream} />
          <Text style={styles.countText}>
            {safeOrders.length} order{safeOrders.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Fixed decorative background — stays behind scroll */}
      <View style={styles.bgGlow} />
      <View style={styles.bgGlow2} />
      <DotCluster style={{ top: 100, right: 16 }} />

      {loading ? (
        // Loading state — header + spinner, all scrollable
        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={() => 'empty'}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View style={styles.spinnerWrap}>
              <View style={styles.spinnerCard}>
                <ActivityIndicator size="large" color={C.gold} />
                <Text style={styles.spinnerText}>Loading your orders…</Text>
              </View>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : safeOrders.length === 0 ? (
        // Empty state — header + empty card, all scrollable
        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={() => 'empty'}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCard}>
                <GoldBar />
                <CornerRings size={60} color="rgba(201,168,76,0.20)" />
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="bag-outline" size={34} color={C.gold} />
                </View>
                <Text style={styles.emptyTitle}>No Orders Yet</Text>
                <GoldDivider style={{ width: '50%', alignSelf: 'center' }} />
                <Text style={styles.emptySub}>
                  Your order history will appear here once you've made a purchase.
                </Text>
                <TouchableOpacity style={styles.emptyCtaBtn} onPress={() => navigation.goBack()}>
                  <Ionicons name="leaf-outline" size={15} color={C.bg} />
                  <Text style={styles.emptyCtaText}>Browse Plants</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
        />
      ) : (
        // Full list — header scrolls with order cards
        <FlatList
          data={safeOrders}
          keyExtractor={item => (item.id || item._id || '').toString()}
          renderItem={({ item }) => <OrderCard item={item} update={false} isCustomer={true} />}
          ListHeaderComponent={<ListHeader />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
        />
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  bgGlow:  { position: 'absolute', top: -80,  right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(201,168,76,0.07)' },
  bgGlow2: { position: 'absolute', top: 240,  left: -70,  width: 180, height: 180, borderRadius: 90,  backgroundColor: 'rgba(26,92,46,0.12)' },

  // Header card
  headerCard: {
    marginHorizontal: 14, marginTop: 52, marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16,
    shadowColor: '#071209', shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 6,
  },

  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginBottom: 14,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    borderColor: C.goldBorder, backgroundColor: C.goldLight,
  },
  backText: { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 0.3 },

  titleBlock:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleIconCircle:{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.goldLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.goldBorder, marginTop: 4 },
  titleTagRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  titleTagLine:   { height: 1, width: 14, backgroundColor: C.goldBorder },
  titleTag:       { fontSize: 8, fontWeight: '800', color: C.goldBorder, letterSpacing: 2, textTransform: 'uppercase' },
  titleMain:      { fontSize: 22, fontWeight: '900', color: C.white, letterSpacing: 0.2 },
  titleSub:       { fontSize: 11, color: C.mutedCream, fontWeight: '500', marginTop: 3 },

  statsStrip:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, borderWidth: 1, borderColor: C.goldBorder, paddingVertical: 12, paddingHorizontal: 16 },
  statsDivider: { width: 1, height: 30, backgroundColor: C.goldBorder, marginHorizontal: 4 },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginHorizontal: 14, marginBottom: 6, marginTop: 2 },
  countText: { fontSize: 12, fontWeight: '700', color: C.mutedCream, letterSpacing: 0.3 },

  listContent: { paddingHorizontal: 14, paddingBottom: 30 },

  // Spinner
  spinnerWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  spinnerCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, paddingVertical: 28, paddingHorizontal: 40, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: C.goldBorder },
  spinnerText: { fontSize: 12, fontWeight: '700', color: C.mutedCream, fontStyle: 'italic' },

  // Empty
  emptyWrap: { paddingHorizontal: 0, paddingTop: 16 },
  emptyCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, overflow: 'hidden', paddingVertical: 40, paddingHorizontal: 28, alignItems: 'center', borderWidth: 1, borderColor: C.goldBorder },
  emptyIconCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.goldLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.goldBorder, marginBottom: 18 },
  emptyTitle:  { fontSize: 19, fontWeight: '900', color: C.white, letterSpacing: 0.2 },
  emptySub:    { fontSize: 13, color: C.mutedCream, textAlign: 'center', lineHeight: 20, fontStyle: 'italic', paddingHorizontal: 8 },
  emptyCtaBtn: { marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.gold, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 24, shadowColor: '#5C3D00', shadowOpacity: 0.28, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3 },
  emptyCtaText:{ fontSize: 14, fontWeight: '900', color: C.bg, letterSpacing: 0.3 },
});

export default MyOrders;