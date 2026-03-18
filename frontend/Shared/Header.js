import React from "react";
import { StyleSheet, View, Dimensions, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

var { width } = Dimensions.get("window");

const C = {
  greenDeep:  "#122B18",
  gold:       "#C9A84C",
  goldBorder: "rgba(201,168,76,0.30)",
  goldLight:  "rgba(201,168,76,0.15)",
  white:      "#FFFFFF",
};

const DotCluster = ({ style }) => (
  <View style={[{ position: "absolute", gap: 4 }, style]} pointerEvents="none">
    {[0, 1, 2].map((row) => (
      <View key={row} style={{ flexDirection: "row", gap: 4 }}>
        {[0, 1, 2].map((col) => (
          <View key={col} style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.goldBorder, opacity: 1 - (row + col) * 0.1 }} />
        ))}
      </View>
    ))}
  </View>
);

const GoldRule = () => (
  <View style={{ flexDirection: "row", alignItems: "center", width: "70%" }}>
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, marginHorizontal: 6, transform: [{ rotate: "45deg" }] }} />
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
  </View>
);

const Header = () => {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bgGlow} />

      <View style={styles.cornerWrap} pointerEvents="none">
        {[64, 44, 26].map((s, i) => (
          <View key={i} style={[styles.cornerRing, { width: s, height: s, borderRadius: s / 2, opacity: 0.35 - i * 0.08 }]} />
        ))}
      </View>

      <DotCluster style={{ top: 14, left: 16 }} />
      <DotCluster style={{ bottom: 10, right: 16 }} />

      <View style={styles.goldBar} />

      <View style={styles.content}>
        <View style={styles.badge}>
          <View style={styles.badgeInner}>
            <Ionicons name="leaf" size={18} color={C.gold} />
          </View>
        </View>

        <View style={styles.wordmark}>
          <View style={styles.taglineRow}>
            <View style={styles.taglineLine} />
            <Text style={styles.tagline}>EST. PLANT SHOP</Text>
            <View style={styles.taglineLine} />
          </View>
          <Text style={styles.brandName}>Planterest</Text>
          <GoldRule />
        </View>

        {/* Invisible spacer to keep wordmark perfectly centred */}
        <View style={{ width: 42 }} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { backgroundColor: "#122B18", overflow: "hidden" },

  bgGlow: {
    position: "absolute", top: -60, left: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(26,92,46,0.35)",
  },

  cornerWrap: {
    position: "absolute", top: -20, right: -20,
    width: 80, height: 80, alignItems: "center", justifyContent: "center",
  },
  cornerRing: { position: "absolute", borderWidth: 1, borderColor: C.gold },

  goldBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: C.gold,
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 18,
  },

  badge: {
    width: 42, height: 42, borderRadius: 12,
    borderWidth: 1, borderColor: C.goldBorder,
    backgroundColor: C.goldLight,
    alignItems: "center", justifyContent: "center",
  },
  badgeInner: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "rgba(201,168,76,0.18)",
    alignItems: "center", justifyContent: "center",
  },

  wordmark: { flex: 1, alignItems: "center", gap: 4, marginHorizontal: 12 },
  taglineRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  taglineLine: { height: 1, width: 18, backgroundColor: C.goldBorder },
  tagline: {
    fontSize: 8, fontWeight: "800", color: C.goldBorder,
    letterSpacing: 2, textTransform: "uppercase",
  },
  brandName: {
    fontSize: 26, fontWeight: "900", color: C.white,
    letterSpacing: 1.5, fontStyle: "italic",
    textShadowColor: "rgba(201,168,76,0.30)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});

export default Header;