import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Dimensions, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import mime from 'mime';
import axios from 'axios';
import baseURL from '../../assets/common/baseurl';
import AuthGlobal from '../../Context/Store/AuthGlobal';
import { logoutUser } from '../../Context/Actions/Auth.actions';

const { width } = Dimensions.get('window');

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  // Hero / dark areas → olive green
  heroBg:      '#3D4F2A',          // main olive
  heroDeep:    '#2C3A1E',          // darker olive for depth

  // White stays white
  pageBg:      '#FFFFFF',
  cardBg:      '#FFFFFF',
  sectionBg:   '#F4FAF5',

  // Gold — outlines, icons, accents
  gold:        '#C9A84C',
  goldDeep:    '#A87B28',
  goldLight:   'rgba(201,168,76,0.13)',
  goldBorder:  'rgba(201,168,76,0.35)',

  // Text
  greenDark:   '#1C2510',
  greenMid:    '#3D4F2A',
  greenMuted:  'rgba(28,37,16,0.48)',

  // Borders on white cards → gold
  cardBorder:  'rgba(201,168,76,0.30)',

  // Utility
  white:       '#FFFFFF',
  red:         '#8B1A1A',
  redLight:    'rgba(139,26,26,0.07)',
  redBorder:   'rgba(139,26,26,0.20)',
};

// ─── Gold top bar (for white cards) ──────────────────────────────────────────
const GoldBar = () => (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: C.gold }} />
);

// ─── Gold divider ─────────────────────────────────────────────────────────────
const GoldDivider = ({ style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', marginVertical: 14 }, style]}>
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
    <View style={{ width: 5, height: 5, backgroundColor: C.gold, transform: [{ rotate: '45deg' }], marginHorizontal: 8 }} />
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
  </View>
);

// ─── Corner rings (gold) ──────────────────────────────────────────────────────
const CornerRings = ({ size = 80 }) => (
  <View style={{ position: 'absolute', top: -size * 0.3, right: -size * 0.3, width: size, height: size }} pointerEvents="none">
    {[1, 0.65, 0.38].map((s, i) => (
      <View key={i} style={{
        position: 'absolute',
        width: size * s, height: size * s, borderRadius: (size * s) / 2,
        borderWidth: 1, borderColor: C.goldBorder,
        top: (size - size * s) / 2, left: (size - size * s) / 2,
      }} />
    ))}
  </View>
);

// ─── Stat pill ────────────────────────────────────────────────────────────────
const StatPill = ({ icon, value, label }) => (
  <View style={sp.pill}>
    <View style={sp.iconWrap}>
      <Ionicons name={icon} size={15} color={C.gold} />
    </View>
    <Text style={sp.value}>{value}</Text>
    <Text style={sp.label}>{label}</Text>
  </View>
);
const sp = StyleSheet.create({
  pill:    { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: C.goldBorder, backgroundColor: C.goldLight, paddingVertical: 13, paddingHorizontal: 8, alignItems: 'center', gap: 5 },
  iconWrap:{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(201,168,76,0.18)', borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center' },
  value:   { fontSize: 20, fontWeight: '900', color: C.greenDark, letterSpacing: 0.2 },
  label:   { fontSize: 9, fontWeight: '700', color: C.greenMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
});

// ─── Action row ───────────────────────────────────────────────────────────────
const ActionRow = ({ icon, label, onPress, danger, last }) => (
  <TouchableOpacity
    style={[act.row, danger && act.rowDanger, last && { marginBottom: 0 }]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[act.iconCircle, danger && act.iconCircleDanger]}>
      <Ionicons name={icon} size={16} color={danger ? C.red : C.gold} />
    </View>
    <Text style={[act.label, danger && act.labelDanger]}>{label}</Text>
    <Ionicons name="chevron-forward-outline" size={14} color={danger ? C.red : C.goldBorder} />
  </TouchableOpacity>
);
const act = StyleSheet.create({
  row:              { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.cardBg, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: C.cardBorder, shadowColor: C.greenDark, shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 2 },
  rowDanger:        { backgroundColor: C.redLight, borderColor: C.redBorder },
  iconCircle:       { width: 34, height: 34, borderRadius: 11, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center' },
  iconCircleDanger: { backgroundColor: C.redLight, borderColor: C.redBorder },
  label:            { flex: 1, fontSize: 14, fontWeight: '800', color: C.greenDark, letterSpacing: 0.2 },
  labelDanger:      { color: C.red },
});

// ─── Edit input ───────────────────────────────────────────────────────────────
const EditField = ({ icon, label, value, onChangeText, keyboardType, autoCapitalize, focused, onFocus, onBlur }) => (
  <View style={ef.wrap}>
    <Text style={ef.label}>{label}</Text>
    <View style={[ef.inputWrap, focused && ef.focused]}>
      <View style={ef.iconCol}>
        <Ionicons name={icon} size={14} color={focused ? C.gold : C.greenMuted} />
      </View>
      <TextInput
        style={ef.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Enter your ${label.toLowerCase()}`}
        placeholderTextColor={C.greenMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'words'}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  </View>
);
const ef = StyleSheet.create({
  wrap:      { marginBottom: 12 },
  label:     { fontSize: 10, fontWeight: '800', color: C.goldDeep, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.sectionBg, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden' },
  focused:   { borderColor: C.gold, borderWidth: 1.5 },
  iconCol:   { width: 42, height: 48, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: C.cardBorder, backgroundColor: C.goldLight },
  input:     { flex: 1, height: 48, paddingHorizontal: 14, fontSize: 14, fontWeight: '600', color: C.greenDark },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const UserProfile = () => {
  const context    = useContext(AuthGlobal);
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState('');
  const [editing,     setEditing]     = useState(false);
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [image,       setImage]       = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [focused,     setFocused]     = useState(null);

  useFocusEffect(useCallback(() => {
    if (context.stateUser.isAuthenticated === false) { navigation.navigate('Login'); return; }
    const userId = context.stateUser.user?.userId;
    if (!userId) return;
    AsyncStorage.getItem('jwt').then(res => {
      if (!res) { navigation.navigate('Login'); return; }
      axios.get(`${baseURL}users/${userId}`, { headers: { Authorization: `Bearer ${res}` } })
        .then(u => setUserProfile(u.data))
        .catch(err => { if (err.response?.status === 401) navigation.navigate('Login'); });
    }).catch(() => navigation.navigate('Login'));
    return () => setUserProfile();
  }, [context.stateUser.isAuthenticated, context.stateUser.user, navigation]));

  const startEditing  = () => { setName(userProfile?.name || ''); setEmail(userProfile?.email || ''); setPhone(userProfile?.phone || ''); setImage(null); setEditing(true); };
  const cancelEditing = () => { setEditing(false); setImage(null); };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera roll permission is required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const saveProfile = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) { Alert.alert('Error', 'Name, email, and phone are required.'); return; }
    setSaving(true);
    try {
      const token  = await AsyncStorage.getItem('jwt');
      const userId = context.stateUser.user?.userId;
      const fd     = new FormData();
      fd.append('name', name); fd.append('email', email); fd.append('phone', phone);
      if (image) {
        const uri = 'file:///' + image.split('file:/').join('');
        fd.append('image', { uri, type: mime.getType(uri), name: uri.split('/').pop() });
      }
      const res = await axios.put(`${baseURL}users/${userId}`, fd, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
      setUserProfile(res.data); setEditing(false); setImage(null);
      Alert.alert('Success', 'Profile updated!');
    } catch { Alert.alert('Error', 'Failed to update profile.'); }
    finally { setSaving(false); }
  };

  const initials  = userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U';
  const avatarUri = image || userProfile?.image || `https://via.placeholder.com/150/3D4F2A/FFFFFF?text=${initials}`;

  return (
    <View style={styles.container}>

      {/* ── OLIVE GREEN HERO ── */}
      <View style={styles.greenHero}>
        <CornerRings size={100} />

        {/* Dot grid */}
        <View style={styles.heroDots} pointerEvents="none">
          {[0,1,2,3,4].map(r => (
            <View key={r} style={{ flexDirection: 'row', gap: 14, marginBottom: 14 }}>
              {[0,1,2,3,4,5].map(col => (
                <View key={col} style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.10)' }} />
              ))}
            </View>
          ))}
        </View>

        {/* Avatar */}
        <TouchableOpacity style={styles.avatarWrap} onPress={editing ? pickImage : null} activeOpacity={editing ? 0.8 : 1}>
          <View style={styles.avatarRing}>
            <Image style={styles.avatar} source={{ uri: avatarUri }} />
          </View>
          {editing && (
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color={C.greenDark} />
            </View>
          )}
        </TouchableOpacity>

        {editing ? (
          <Text style={styles.editHint}>Tap photo to change</Text>
        ) : (
          <>
            <Text style={styles.heroName}>{userProfile?.name || 'Loading…'}</Text>
            <View style={styles.heroRoleChip}>
              <Ionicons name="leaf" size={11} color={C.gold} />
              <Text style={styles.heroRole}>Plant Enthusiast</Text>
            </View>
          </>
        )}

        {/* Gold trim at bottom of hero */}
        <View style={styles.heroGoldTrim} />
      </View>

      {/* ── WHITE SCROLL AREA ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: C.pageBg }}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatPill icon="leaf-outline"  value="12"  label="Plants" />
          <StatPill icon="bag-outline"   value="8"   label="Orders" />
          <StatPill icon="star-outline"  value="4.8" label="Rating" />
        </View>

        {/* Personal Info Card — WHITE with gold outline */}
        <View style={styles.card}>
          <GoldBar />
          <CornerRings size={52} />

          <View style={styles.cardHead}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="person-outline" size={13} color={C.gold} />
            </View>
            <Text style={styles.cardTitle}>Personal Information</Text>
            {!editing && (
              <TouchableOpacity style={styles.editChip} onPress={startEditing}>
                <Ionicons name="create-outline" size={12} color={C.goldDeep} />
                <Text style={styles.editChipText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <GoldDivider style={{ marginTop: 8 }} />

          {editing ? (
            <>
              <EditField icon="person-outline" label="Name"  value={name}  onChangeText={setName}  focused={focused==='name'}  onFocus={()=>setFocused('name')}  onBlur={()=>setFocused(null)} />
              <EditField icon="mail-outline"   label="Email" value={email} onChangeText={setEmail} focused={focused==='email'} onFocus={()=>setFocused('email')} onBlur={()=>setFocused(null)} keyboardType="email-address" autoCapitalize="none" />
              <EditField icon="call-outline"   label="Phone" value={phone} onChangeText={setPhone} focused={focused==='phone'} onFocus={()=>setFocused('phone')} onBlur={()=>setFocused(null)} keyboardType="phone-pad" autoCapitalize="none" />

              <View style={styles.editBtnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelEditing} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving} activeOpacity={0.88}>
                  {saving
                    ? <ActivityIndicator size="small" color={C.greenDark} />
                    : <>
                        <Ionicons name="save-outline" size={15} color={C.greenDark} />
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {[
                { icon: 'person-outline', label: 'Full Name', value: userProfile?.name  },
                { icon: 'mail-outline',   label: 'Email',     value: userProfile?.email },
                { icon: 'call-outline',   label: 'Phone',     value: userProfile?.phone },
              ].map(({ icon, label, value }, idx, arr) => (
                <View key={label} style={[styles.infoRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.infoIconCircle}>
                    <Ionicons name={icon} size={12} color={C.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{value || '—'}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Quick Actions Card — WHITE with gold outline */}
        <View style={styles.card}>
          <GoldBar />
          <View style={styles.cardHead}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="apps-outline" size={13} color={C.gold} />
            </View>
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>
          <GoldDivider style={{ marginTop: 8 }} />

          <ActionRow icon="bag-outline"      label="My Orders"  onPress={() => navigation.navigate('My Orders')} />
          <ActionRow icon="heart-outline"    label="Favourites" onPress={() => {}} />
          <ActionRow icon="settings-outline" label="Settings"   onPress={() => {}} last />
        </View>

        {/* Sign Out */}
        <ActionRow
          icon="log-out-outline"
          label="Sign Out"
          danger
          onPress={() => { AsyncStorage.removeItem('jwt'); logoutUser(context.dispatch); }}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.heroDeep },

  // Olive hero
  greenHero: {
    backgroundColor: C.heroBg,
    paddingTop: 48, paddingBottom: 36,
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 2,
    borderBottomColor: C.gold,
  },
  heroDots:     { position: 'absolute', top: 16, left: 16 },
  heroGoldTrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: C.gold },

  // Avatar
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatarRing: {
    width: 114, height: 114, borderRadius: 57,
    borderWidth: 3, borderColor: C.gold,          // gold ring
    padding: 3, backgroundColor: 'rgba(201,168,76,0.10)',
    shadowColor: C.gold, shadowOpacity: 0.30, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
  },
  avatar:      { width: '100%', height: '100%', borderRadius: 54 },
  cameraBtn:   { position: 'absolute', bottom: 2, right: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.white },
  editHint:    { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', marginTop: 4 },
  heroName:    { fontSize: 23, fontWeight: '900', color: C.white, letterSpacing: 0.2, marginBottom: 8 },
  heroRoleChip:{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)' },
  heroRole:    { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' },

  scrollContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 24 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },

  // White card with gold outline
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1.5, borderColor: C.gold,         // gold outline
    paddingHorizontal: 18, paddingTop: 20, paddingBottom: 18, marginBottom: 14,
    shadowColor: C.gold, shadowOpacity: 0.12, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, elevation: 4,
  },
  cardHead:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center' },
  cardTitle:      { fontSize: 13, fontWeight: '900', color: C.greenDark, flex: 1, letterSpacing: 0.2 },
  editChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: C.goldBorder, backgroundColor: C.goldLight },
  editChipText:   { fontSize: 11, fontWeight: '800', color: C.goldDeep },

  // Info rows
  infoRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.goldBorder, gap: 12 },
  infoIconCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center' },
  infoLabel:      { fontSize: 10, fontWeight: '700', color: C.greenMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 },
  infoValue:      { fontSize: 14, fontWeight: '700', color: C.greenDark },

  // Edit buttons
  editBtnRow:   { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn:    { flex: 1, backgroundColor: C.goldLight, borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: C.goldBorder },
  cancelBtnText:{ fontSize: 13, fontWeight: '800', color: C.goldDeep },
  saveBtn:      { flex: 2, backgroundColor: C.gold, borderRadius: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#5C3D00', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3 },
  saveBtnText:  { fontSize: 13, fontWeight: '900', color: C.greenDark, letterSpacing: 0.3 },
});

export default UserProfile;