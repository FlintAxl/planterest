import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg:          '#F4FAF5',
  white:       '#FFFFFF',
  greenDark:   '#0B1F10',
  greenMid:    '#1A5C2E',
  greenLight:  'rgba(26,92,46,0.08)',
  greenBorder: 'rgba(26,92,46,0.18)',
  mutedText:   'rgba(11,31,16,0.45)',
  gold:        '#C9A84C',
  goldLight:   'rgba(201,168,76,0.12)',
  goldBorder:  'rgba(201,168,76,0.30)',
};

const CategoryFilter = (props) => {
  return (
    <View style={styles.wrapper}>
      {/* Gold top hairline */}
      <View style={styles.goldLine} />
      {/* Gold bottom hairline */}
      <View style={styles.goldLineBottom} />

      <ScrollView
        bounces
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* "All" chip */}
        <TouchableOpacity
          key={1}
          onPress={() => { props.categoryFilter('all'); props.setActive(-1); }}
          style={[styles.chip, props.active === -1 ? styles.chipActive : styles.chipInactive]}
          activeOpacity={0.82}
        >
          {props.active === -1 && (
            <View style={styles.activeDot} />
          )}
          <Ionicons
            name={props.active === -1 ? 'leaf' : 'leaf-outline'}
            size={12}
            color={props.active === -1 ? C.white : C.mutedText}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.chipText, props.active === -1 ? styles.textActive : styles.textInactive]}>
            All
          </Text>
          {props.active === -1 && <View style={styles.goldUnderline} />}
        </TouchableOpacity>

        {/* Category chips */}
        {props.categories.map((item) => {
          const idx       = props.categories.indexOf(item);
          const isActive  = props.active === idx;
          return (
            <TouchableOpacity
              key={item._id}
              onPress={() => { props.categoryFilter(item._id); props.setActive(idx); }}
              style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
              activeOpacity={0.82}
            >
              {isActive && <View style={styles.activeDot} />}
              <Text style={[styles.chipText, isActive ? styles.textActive : styles.textInactive]}>
                {item.name}
              </Text>
              {isActive && <View style={styles.goldUnderline} />}
            </TouchableOpacity>
          );
        })}

        {/* Right fade spacer */}
        <View style={{ width: 8 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.greenBorder,
    position: 'relative',
  },

  // Gold hairlines top & bottom
  goldLine: {
    height: 2,
    backgroundColor: C.gold,
    opacity: 0.55,
  },
  goldLineBottom: {
    height: 1,
    backgroundColor: C.goldBorder,
  },

  scroll: {
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  chipActive: {
    backgroundColor: C.greenMid,
    borderColor: C.goldBorder,
    // Gold border hint on active
    shadowColor: C.gold,
    shadowOpacity: 0.20,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  chipInactive: {
    backgroundColor: C.greenLight,
    borderColor: C.greenBorder,
  },

  // Small gold dot top-left of active chip
  activeDot: {
    position: 'absolute',
    top: 5,
    left: 7,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.gold,
    opacity: 0.9,
  },

  // Gold underline inside active chip
  goldUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.gold,
    opacity: 0.55,
  },

  chipText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  textActive:   { color: C.white },
  textInactive: { color: C.mutedText },
});

export default CategoryFilter;