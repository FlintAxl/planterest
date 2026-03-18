import React, { useEffect, useState, useContext } from 'react';
import { Text, View, StyleSheet, Dimensions, TextInput, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
const countries = require('../../assets/data/countries.json');
import AuthGlobal from '../../Context/Store/AuthGlobal';
import Toast from 'react-native-toast-message';

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

// ─── Labelled field ───────────────────────────────────────────────────────────
const Field = ({ icon, label, required, children, style }) => (
  <View style={[field.wrap, style]}>
    <View style={field.labelRow}>
      <View style={field.iconPip}>
        <Ionicons name={icon} size={11} color={C.gold} />
      </View>
      <Text style={field.label}>{label}</Text>
      {required && <Text style={field.required}>*</Text>}
    </View>
    {children}
  </View>
);
const field = StyleSheet.create({
  wrap:     { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  iconPip:  { width: 20, height: 20, borderRadius: 10, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center' },
  label:    { fontSize: 10, fontWeight: '800', color: C.greenMid, textTransform: 'uppercase', letterSpacing: 0.9, flex: 1 },
  required: { fontSize: 12, color: C.gold, fontWeight: '900' },
});

// ─── Text input ───────────────────────────────────────────────────────────────
const StyledInput = ({ placeholder, value, onChangeText, keyboardType, icon, focused, onFocus, onBlur }) => (
  <View style={[inp.wrap, focused && inp.wrapFocused]}>
    <View style={inp.iconCol}>
      <Ionicons name={icon} size={15} color={focused ? C.gold : C.mutedText} />
    </View>
    <TextInput
      style={inp.input}
      placeholder={placeholder}
      placeholderTextColor={C.mutedText}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  </View>
);
const inp = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: C.goldBorder, overflow: 'hidden',
    shadowColor: '#071209', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 1,
  },
  wrapFocused: { borderColor: C.gold, borderWidth: 1.5 },
  iconCol: {
    width: 42, height: 48, alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: C.goldBorder, backgroundColor: C.goldLight,
  },
  input: { flex: 1, height: 48, paddingHorizontal: 14, fontSize: 14, fontWeight: '600', color: C.greenDark },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const Checkout = () => {
  const [user,     setUser]     = useState('');
  const [orderItems,setOrderItems]=useState([]);
  const [address,  setAddress]  = useState('');
  const [address2, setAddress2] = useState('');
  const [city,     setCity]     = useState('');
  const [zip,      setZip]      = useState('');
  const [country,  setCountry]  = useState('Philippines');
  const [phone,    setPhone]    = useState('');

  // Track which field is focused for border highlight
  const [focused, setFocused]   = useState(null);

  const navigation  = useNavigation();
  const cartItems   = useSelector(state => state.cartItems);
  const context     = useContext(AuthGlobal);

  useEffect(() => {
    setOrderItems(cartItems);
    if (context.stateUser.isAuthenticated) {
      setUser(context.stateUser.user.userId);
    } else {
      navigation.navigate('User', { screen: 'Login' });
      Toast.show({ topOffset: 60, type: 'error', text1: 'Please Login to Checkout' });
    }
    return () => setOrderItems();
  }, []);

  const checkOut = () => {
    const order = {
      city, country, dateOrdered: Date.now(),
      orderItems, phone,
      shippingAddress1: address, shippingAddress2: address2,
      status: '3', user, zip,
    };
    navigation.navigate('Payment', { order });
  };

  return (
    <View style={styles.container}>
      {/* Fixed background orbs */}
      <View style={styles.orbTR} />
      <View style={styles.orbBL} />
      <DotCluster style={{ top: 80, right: 16 }} />

      <KeyboardAwareScrollView
        viewIsInsideTabBar={true}
        extraHeight={200}
        enableOnAndroid={true}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: 'transparent' }}
      >

        {/* ── PAGE HEADER ── */}
        <View style={styles.headerCard}>
          <GoldBar />
          <CornerRings />

          <View style={styles.headerRow}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="location-outline" size={20} color={C.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.taglineRow}>
                <View style={styles.taglineLine} />
                <Text style={styles.taglineText}>STEP 01</Text>
                <View style={styles.taglineLine} />
              </View>
              <Text style={styles.headerTitle}>Shipping Address</Text>
              <Text style={styles.headerSub}>Enter your delivery details below</Text>
            </View>
          </View>
        </View>

        {/* ── ADDRESS CARD ── */}
        <View style={styles.card}>
          <GoldBar />
          <CornerRings size={56} color="rgba(201,168,76,0.18)" />

          {/* Section heading */}
          <View style={styles.sectionHead}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="call-outline" size={13} color={C.gold} />
            </View>
            <Text style={styles.sectionTitle}>Contact & Address</Text>
            <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>REQUIRED</Text></View>
          </View>

          <GoldDivider style={{ marginTop: 8 }} />

          <Field icon="call-outline" label="Phone Number" required>
            <StyledInput
              icon="call-outline"
              placeholder="e.g. 09171234567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="numeric"
              focused={focused === 'phone'}
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused(null)}
            />
          </Field>

          <Field icon="home-outline" label="Shipping Address 1" required>
            <StyledInput
              icon="home-outline"
              placeholder="Street address, P.O. box"
              value={address}
              onChangeText={setAddress}
              focused={focused === 'address'}
              onFocus={() => setFocused('address')}
              onBlur={() => setFocused(null)}
            />
          </Field>

          <Field icon="business-outline" label="Shipping Address 2">
            <StyledInput
              icon="business-outline"
              placeholder="Apt, suite, unit (optional)"
              value={address2}
              onChangeText={setAddress2}
              focused={focused === 'address2'}
              onFocus={() => setFocused('address2')}
              onBlur={() => setFocused(null)}
            />
          </Field>

          {/* City + Zip row */}
          <View style={styles.rowFields}>
            <Field icon="map-outline" label="City" required style={{ flex: 1, marginRight: 10 }}>
              <StyledInput
                icon="map-outline"
                placeholder="City"
                value={city}
                onChangeText={setCity}
                focused={focused === 'city'}
                onFocus={() => setFocused('city')}
                onBlur={() => setFocused(null)}
              />
            </Field>
            <Field icon="mail-outline" label="ZIP Code" required style={{ flex: 1 }}>
              <StyledInput
                icon="mail-outline"
                placeholder="00000"
                value={zip}
                onChangeText={setZip}
                keyboardType="numeric"
                focused={focused === 'zip'}
                onFocus={() => setFocused('zip')}
                onBlur={() => setFocused(null)}
              />
            </Field>
          </View>
        </View>

        {/* ── COUNTRY CARD ── */}
        <View style={styles.card}>
          <GoldBar />

          <View style={styles.sectionHead}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="globe-outline" size={13} color={C.gold} />
            </View>
            <Text style={styles.sectionTitle}>Country</Text>
          </View>

          <GoldDivider style={{ marginTop: 8 }} />

          <Field icon="flag-outline" label="Select Country" required>
            <View style={styles.pickerWrap}>
              <View style={styles.pickerIconCol}>
                <Ionicons name="chevron-down-outline" size={14} color={C.gold} />
              </View>
              <Picker
                style={styles.picker}
                selectedValue={country}
                onValueChange={setCountry}
                dropdownIconColor={C.gold}
              >
                {countries.map(c => (
                  <Picker.Item key={c.code} label={c.name} value={c.code} color={C.greenDark} />
                ))}
              </Picker>
            </View>
          </Field>
        </View>

        {/* ── SUMMARY STRIP ── */}
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Ionicons name="cube-outline" size={14} color={C.gold} />
            <Text style={styles.summaryText}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.summaryDot} />
          <View style={styles.summaryItem}>
            <Ionicons name="location-outline" size={14} color={C.gold} />
            <Text style={styles.summaryText}>{city || 'City not set'}</Text>
          </View>
          <View style={styles.summaryDot} />
          <View style={styles.summaryItem}>
            <Ionicons name="flag-outline" size={14} color={C.gold} />
            <Text style={styles.summaryText}>{country}</Text>
          </View>
        </View>

        {/* ── CTA BUTTON ── */}
        <TouchableOpacity style={styles.ctaBtn} onPress={checkOut} activeOpacity={0.88}>
          <View style={styles.ctaIconCircle}>
            <Ionicons name="arrow-forward-outline" size={17} color={C.greenDark} />
          </View>
          <Text style={styles.ctaBtnText}>Continue to Payment</Text>
          <Ionicons name="chevron-forward-outline" size={15} color={C.greenDark} style={{ marginLeft: 'auto', opacity: 0.6 }} />
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </KeyboardAwareScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  orbTR: { position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(201,168,76,0.08)' },
  orbBL: { position: 'absolute', top: 300, left: -70, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(26,92,46,0.06)' },

  scrollContent: { paddingHorizontal: 14, paddingTop: 14 },

  // Header card
  headerCard: {
    backgroundColor: C.bgCard, borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 22, paddingBottom: 16,
    marginBottom: 14,
    shadowColor: '#071209', shadowOpacity: 0.09, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 5,
  },
  headerRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  headerIconCircle: { width: 44, height: 44, borderRadius: 13, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  taglineRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  taglineLine:      { height: 1, width: 16, backgroundColor: C.goldBorder },
  taglineText:      { fontSize: 8, fontWeight: '800', color: C.goldBorder, letterSpacing: 2, textTransform: 'uppercase' },
  headerTitle:      { fontSize: 20, fontWeight: '900', color: C.greenDark, letterSpacing: 0.2 },
  headerSub:        { fontSize: 11, color: C.mutedText, fontWeight: '500', marginTop: 3 },

  // Form card
  card: {
    backgroundColor: C.bgCard, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 20, paddingBottom: 18,
    marginBottom: 14,
    shadowColor: '#071209', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 5 }, shadowRadius: 12, elevation: 4,
  },

  // Section heading inside card
  sectionHead:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:      { fontSize: 13, fontWeight: '900', color: C.greenDark, flex: 1, letterSpacing: 0.2 },
  sectionBadge:      { backgroundColor: C.greenDark, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  sectionBadgeText:  { fontSize: 8, fontWeight: '800', color: C.gold, letterSpacing: 1.5 },

  // Row fields
  rowFields: { flexDirection: 'row' },

  // Country picker
  pickerWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: C.goldBorder, overflow: 'hidden',
  },
  pickerIconCol: {
    width: 42, height: 50, alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: C.goldBorder, backgroundColor: C.goldLight,
  },
  picker: { flex: 1, height: 50, color: C.greenDark },

  // Summary strip
  summaryStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.bgCard, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 16,
    borderWidth: 1, borderColor: C.goldBorder,
    marginBottom: 16, gap: 10,
    shadowColor: '#071209', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 2,
  },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  summaryText: { fontSize: 12, fontWeight: '700', color: C.greenDark },
  summaryDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: C.goldBorder },

  // CTA
  ctaBtn: {
    backgroundColor: C.gold, borderRadius: 16,
    paddingVertical: 15, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#5C3D00', shadowOpacity: 0.28, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, elevation: 4,
  },
  ctaIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(11,31,16,0.14)', alignItems: 'center', justifyContent: 'center',
  },
  ctaBtnText: { fontSize: 15, fontWeight: '900', color: C.greenDark, letterSpacing: 0.3 },
});

export default Checkout;