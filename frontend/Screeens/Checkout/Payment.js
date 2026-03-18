import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

var { width } = Dimensions.get('window');

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
  greenBorder: 'rgba(26,92,46,0.20)',
  mutedText:   'rgba(11,31,16,0.48)',
};

const methods = [
  { name: 'Cash on Delivery', value: 1, icon: 'cash-outline',     activeIcon: 'cash',         desc: 'Pay when your order arrives' },
  { name: 'Bank Transfer',    value: 2, icon: 'business-outline',  activeIcon: 'business',     desc: 'Transfer directly to our account' },
  { name: 'Card Payment',     value: 3, icon: 'card-outline',      activeIcon: 'card',         desc: 'Visa, Mastercard & more' },
];

const paymentCards = [
  { name: 'Wallet',     value: 1 },
  { name: 'Visa',       value: 2 },
  { name: 'MasterCard', value: 3 },
  { name: 'Other',      value: 4 },
];

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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const Payment = ({ route }) => {
  const order = route.params;
  const [selected, setSelected] = useState('');
  const [card,     setCard]     = useState('');
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Fixed background orbs */}
      <View style={styles.orbTR} />
      <View style={styles.orbBL} />
      <DotCluster style={{ top: 80, right: 16 }} />

      {/* ── PAGE HEADER ── */}
      <View style={styles.headerCard}>
        <GoldBar />
        <CornerRings />

        <View style={styles.headerRow}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="wallet-outline" size={20} color={C.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.taglineRow}>
              <View style={styles.taglineLine} />
              <Text style={styles.taglineText}>STEP 02</Text>
              <View style={styles.taglineLine} />
            </View>
            <Text style={styles.headerTitle}>Payment Method</Text>
            <Text style={styles.headerSub}>Choose how you'd like to pay</Text>
          </View>
        </View>
      </View>

      {/* ── METHODS CARD ── */}
      <View style={styles.card}>
        <GoldBar />
        <CornerRings size={56} color="rgba(201,168,76,0.18)" />

        {/* Section heading */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionIconCircle}>
            <Ionicons name="list-outline" size={13} color={C.gold} />
          </View>
          <Text style={styles.sectionTitle}>Select a Method</Text>
          <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>REQUIRED</Text></View>
        </View>

        <GoldDivider style={{ marginTop: 8 }} />

        {methods.map((item, index) => {
          const isSelected = selected === item.value;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.methodRow, isSelected && styles.methodRowSelected]}
              onPress={() => setSelected(item.value)}
              activeOpacity={0.85}
            >
              {/* Left accent */}
              <View style={[styles.methodAccent, isSelected && styles.methodAccentOn]} />

              {/* Icon circle */}
              <View style={[styles.methodIconCircle, isSelected && styles.methodIconCircleOn]}>
                <Ionicons
                  name={isSelected ? item.activeIcon : item.icon}
                  size={17}
                  color={isSelected ? C.greenDark : C.mutedText}
                />
              </View>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodName, isSelected && styles.methodNameOn]}>{item.name}</Text>
                <Text style={styles.methodDesc}>{item.desc}</Text>
              </View>

              {/* Radio / check */}
              <View style={[styles.radio, isSelected && styles.radioOn]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── CARD TYPE PICKER (conditional) ── */}
      {selected === 3 && (
        <View style={styles.card}>
          <GoldBar />

          <View style={styles.sectionHead}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="card-outline" size={13} color={C.gold} />
            </View>
            <Text style={styles.sectionTitle}>Card Type</Text>
          </View>

          <GoldDivider style={{ marginTop: 8 }} />

          <View style={styles.pickerWrap}>
            <View style={styles.pickerIconCol}>
              <Ionicons name="chevron-down-outline" size={14} color={C.gold} />
            </View>
            <Picker
              style={styles.picker}
              selectedValue={card}
              onValueChange={setCard}
              dropdownIconColor={C.gold}
            >
              {paymentCards.map(c => (
                <Picker.Item key={c.name} label={c.name} value={c.name} color={C.greenDark} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* ── SELECTED SUMMARY CHIP ── */}
      {selected !== '' && (
        <View style={styles.selectedChip}>
          <View style={styles.selectedChipIcon}>
            <Ionicons name="checkmark-circle" size={14} color={C.gold} />
          </View>
          <Text style={styles.selectedChipText}>
            {methods.find(m => m.value === selected)?.name} selected
          </Text>
        </View>
      )}

      {/* ── CTA BUTTON ── */}
      <TouchableOpacity
        style={[styles.ctaBtn, !selected && styles.ctaBtnDisabled]}
        onPress={() => selected && navigation.navigate('Confirm', { order })}
        activeOpacity={selected ? 0.88 : 1}
      >
        <View style={styles.ctaIconCircle}>
          <Ionicons name="checkmark-outline" size={17} color={selected ? C.greenDark : C.mutedText} />
        </View>
        <Text style={[styles.ctaBtnText, !selected && styles.ctaBtnTextDisabled]}>Review Order</Text>
        <Ionicons
          name="chevron-forward-outline"
          size={15}
          color={selected ? C.greenDark : C.mutedText}
          style={{ marginLeft: 'auto', opacity: 0.6 }}
        />
      </TouchableOpacity>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 14, paddingTop: 14 },

  orbTR: { position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(201,168,76,0.08)' },
  orbBL: { position: 'absolute', top: 320, left: -70, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(26,92,46,0.07)' },

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

  // Card
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

  // Method rows
  methodRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, borderColor: C.goldBorder,
    backgroundColor: C.bg, marginBottom: 10,
    paddingVertical: 13, paddingRight: 14,
    overflow: 'hidden', gap: 12,
  },
  methodRowSelected: {
    backgroundColor: C.greenSoft,
    borderColor: C.greenBorder,
    borderWidth: 1.5,
  },
  methodAccent:    { width: 4, alignSelf: 'stretch', backgroundColor: C.goldBorder, borderRadius: 2 },
  methodAccentOn:  { backgroundColor: C.gold },
  methodIconCircle: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  methodIconCircleOn: { backgroundColor: C.gold, borderColor: C.goldDeep },
  methodName:         { fontSize: 13, fontWeight: '800', color: C.mutedText, marginBottom: 2 },
  methodNameOn:       { color: C.greenDark },
  methodDesc:         { fontSize: 10, color: C.mutedText, fontStyle: 'italic' },

  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: C.goldBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn:  { borderColor: C.greenMid, backgroundColor: 'rgba(26,92,46,0.08)' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.greenMid },

  // Picker
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

  // Selected chip
  selectedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.bgCard, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.goldBorder,
    marginBottom: 14,
    shadowColor: '#071209', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 5, elevation: 1,
  },
  selectedChipIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.goldLight, alignItems: 'center', justifyContent: 'center',
  },
  selectedChipText: { fontSize: 12, fontWeight: '700', color: C.greenDark },

  // CTA
  ctaBtn: {
    backgroundColor: C.gold, borderRadius: 16,
    paddingVertical: 15, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#5C3D00', shadowOpacity: 0.28, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, elevation: 4,
  },
  ctaBtnDisabled: {
    backgroundColor: 'rgba(201,168,76,0.35)',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(11,31,16,0.14)', alignItems: 'center', justifyContent: 'center',
  },
  ctaBtnText:         { fontSize: 15, fontWeight: '900', color: C.greenDark, letterSpacing: 0.3 },
  ctaBtnTextDisabled: { color: C.mutedText },
});

export default Payment;