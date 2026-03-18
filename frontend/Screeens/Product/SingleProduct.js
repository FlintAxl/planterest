import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Image, View, StyleSheet, Text, ScrollView,
  TouchableOpacity, Dimensions, TextInput, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { addToCart } from '../../Redux/Actions/cartActions';
import Toast from "react-native-toast-message";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import baseURL from "../../assets/common/baseurl";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  // Olive greens
  olive:       '#3D4F2A',
  oliveMid:    '#4A5C38',
  oliveLight:  'rgba(74,92,56,0.10)',
  oliveBorder: 'rgba(74,92,56,0.22)',
  // White
  white:       '#FFFFFF',
  cardBg:      '#FFFFFF',
  pageBg:      '#F4FAF5',
  // Gold
  gold:        '#C9A84C',
  goldDeep:    '#A87B28',
  goldLight:   'rgba(201,168,76,0.13)',
  goldBorder:  'rgba(201,168,76,0.35)',
  // Text
  darkText:    '#1C2510',
  mutedText:   'rgba(28,37,16,0.50)',
  // Red
  red:         '#8B1A1A',
  redLight:    'rgba(139,26,26,0.08)',
};

// ─── Decorative helpers ───────────────────────────────────────────────────────
const GoldBar = () => (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: C.gold }} />
);

const GoldDivider = ({ style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }, style]}>
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
    <View style={{ width: 4, height: 4, backgroundColor: C.gold, transform: [{ rotate: '45deg' }], marginHorizontal: 7 }} />
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
  </View>
);

const CornerRings = ({ size = 70, color = C.goldBorder }) => (
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

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ rating, size = 16, onRate }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    {[1, 2, 3, 4, 5].map(star => (
      <TouchableOpacity key={star} disabled={!onRate} onPress={() => onRate?.(star)} style={{ marginRight: 2 }}>
        <Ionicons
          name={rating >= star ? "star" : rating >= star - 0.5 ? "star-half" : "star-outline"}
          size={size}
          color={C.gold}
        />
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Section card wrapper ─────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <View style={[card.wrap, style]}>
    <GoldBar />
    <CornerRings />
    {children}
  </View>
);
const card = StyleSheet.create({
  wrap: {
    backgroundColor: C.cardBg, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1.5, borderColor: C.gold,
    marginHorizontal: 14, marginBottom: 14,
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16,
    shadowColor: C.gold, shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4,
  },
});

// ─── Section heading ──────────────────────────────────────────────────────────
const SectionHead = ({ icon, title }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
    <View style={sh.circle}>
      <Ionicons name={icon} size={13} color={C.gold} />
    </View>
    <Text style={sh.title}>{title}</Text>
  </View>
);
const sh = StyleSheet.create({
  circle:{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '900', color: C.darkText, letterSpacing: 0.2 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const SingleProduct = ({ route, navigation }) => {
  const [item]            = useState(route.params.item);
  const dispatch          = useDispatch();
  const context           = useContext(AuthGlobal);

  const [reviews,         setReviews]         = useState([]);
  const [canReview,       setCanReview]       = useState(false);
  const [hasReviewed,     setHasReviewed]     = useState(false);
  const [existingReview,  setExistingReview]  = useState(null);
  const [editing,         setEditing]         = useState(false);
  const [reviewRating,    setReviewRating]    = useState(0);
  const [reviewComment,   setReviewComment]   = useState('');
  const [submitting,      setSubmitting]      = useState(false);
  const [loadingReviews,  setLoadingReviews]  = useState(true);
  const [isAdmin,         setIsAdmin]         = useState(false);
  const [token,           setToken]           = useState(null);

  const productId = item._id || item.id;
  const userId    = context.stateUser?.user?.userId;

  const hasActiveDiscount = item.discount && item.discount.percentage > 0 && new Date(item.discount.endDate) > new Date();
  const discountPct       = hasActiveDiscount ? item.discount.percentage : 0;
  const discountedPrice   = hasActiveDiscount ? (item.price * (100 - discountPct) / 100).toFixed(2) : item.price;

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const fetchReviews = useCallback(() => {
    setLoadingReviews(true);
    fetch(`${baseURL}reviews/product/${productId}`)
      .then(r => r.json()).then(d => { setReviews(Array.isArray(d) ? d : []); setLoadingReviews(false); })
      .catch(() => setLoadingReviews(false));
  }, [productId]);

  const checkCanReview = useCallback(() => {
    if (!userId) return;
    fetch(`${baseURL}reviews/check/${productId}/${userId}`)
      .then(r => r.json()).then(d => {
        setCanReview(d.canReview); setHasReviewed(d.hasReviewed);
        if (d.hasReviewed && d.existingReview) setExistingReview(d.existingReview);
      }).catch(() => {});
  }, [productId, userId]);

  useEffect(() => {
    AsyncStorage.getItem("jwt").then(res => { setToken(res); if (res) setIsAdmin(true); }).catch(console.log);
  }, []);

  useFocusEffect(useCallback(() => { fetchReviews(); checkCanReview(); }, [fetchReviews, checkCanReview]));

  const handleSubmitReview = async () => {
    if (!reviewRating) { Toast.show({ topOffset: 60, type: "error", text1: "Please select a rating" }); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${baseURL}reviews`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ user: userId, product: productId, rating: reviewRating, comment: reviewComment }) });
      if (res.ok) { Toast.show({ topOffset: 60, type: "success", text1: "Review submitted!" }); setReviewRating(0); setReviewComment(''); setHasReviewed(true); setCanReview(false); fetchReviews(); }
      else { const msg = await res.text(); Toast.show({ topOffset: 60, type: "error", text1: msg || "Failed" }); }
    } catch { Toast.show({ topOffset: 60, type: "error", text1: "Network error" }); }
    setSubmitting(false);
  };

  const handleUpdateReview = async () => {
    if (!reviewRating) { Toast.show({ topOffset: 60, type: "error", text1: "Please select a rating" }); return; }
    setSubmitting(true);
    try {
      const id  = existingReview._id || existingReview.id;
      const res = await fetch(`${baseURL}reviews/${id}`, { method: 'PUT', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ user: userId, rating: reviewRating, comment: reviewComment }) });
      if (res.ok) { const upd = await res.json(); Toast.show({ topOffset: 60, type: "success", text1: "Review updated!" }); setExistingReview(upd); setEditing(false); fetchReviews(); checkCanReview(); }
      else { const msg = await res.text(); Toast.show({ topOffset: 60, type: "error", text1: msg || "Failed" }); }
    } catch { Toast.show({ topOffset: 60, type: "error", text1: "Network error" }); }
    setSubmitting(false);
  };

  const startEditing  = () => { if (existingReview) { setReviewRating(existingReview.rating); setReviewComment(existingReview.comment || ''); } setEditing(true); };
  const cancelEditing = () => { setEditing(false); setReviewRating(0); setReviewComment(''); };

  const handleAddToCart = () => {
    if (!context?.stateUser?.isAuthenticated) {
      Toast.show({ topOffset: 60, type: "info", text1: "Please log in first", text2: "Log in to add products to your cart" });
      navigation.navigate("User", { screen: "Login" }); return;
    }
    dispatch(addToCart({ ...item, price: hasActiveDiscount ? discountedPrice : item.price, originalPrice: hasActiveDiscount ? item.price : null, discountPercentage: discountPct, quantity: 1 }, userId));
    Toast.show({ topOffset: 60, type: "success", text1: `${item.name} added to Cart` });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── IMAGE CARD ── */}
        <View style={styles.imageCard}>
          <GoldBar />
          <CornerRings size={80} />
          <Image
            source={{ uri: item.image || 'https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png' }}
            resizeMode="contain"
            style={styles.image}
          />
          {hasActiveDiscount && (
            <View style={styles.discountPill}>
              <Ionicons name="pricetag" size={11} color={C.darkText} />
              <Text style={styles.discountPillText}>{discountPct}% OFF</Text>
            </View>
          )}
        </View>

        {/* ── PRODUCT IDENTITY CARD ── */}
        <Card>
          <Text style={styles.productName}>{item.name}</Text>
          {item.brand && <Text style={styles.brandText}>{item.brand}</Text>}

          {/* Rating row */}
          <View style={styles.ratingRow}>
            <StarRating rating={Math.round(avgRating * 2) / 2} size={16} />
            <Text style={styles.ratingLabel}>
              {avgRating > 0 ? avgRating.toFixed(1) : '0'}
              {'  '}·{'  '}
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <GoldDivider />

          {/* Price block */}
          <View style={styles.priceBlock}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>${discountedPrice}</Text>
              {hasActiveDiscount && <Text style={styles.originalPrice}>${item.price}</Text>}
            </View>
            <View style={styles.stockBadge}>
              <View style={[styles.stockDot, { backgroundColor: item.countInStock > 0 ? C.gold : C.red }]} />
              <Text style={styles.stockText}>
                {item.countInStock > 0 ? `${item.countInStock} in stock` : 'Out of stock'}
              </Text>
            </View>
          </View>
        </Card>

        {/* ── DESCRIPTION CARD ── */}
        <Card>
          <SectionHead icon="leaf-outline" title="About this Plant" />
          <GoldDivider style={{ marginTop: 6 }} />
          <Text style={styles.descText}>
            {item.description || 'Premium quality plant with excellent care instructions. Perfect for indoor gardening enthusiasts.'}
          </Text>

          {/* Detail chips */}
          <View style={styles.detailsRow}>
            {item.category && (
              <View style={styles.detailChip}>
                <Ionicons name="grid-outline" size={12} color={C.gold} />
                <Text style={styles.detailChipText}>{item.category.name || 'Plant'}</Text>
              </View>
            )}
            <View style={styles.detailChip}>
              <Ionicons name="ribbon-outline" size={12} color={C.gold} />
              <Text style={styles.detailChipText}>Premium Quality</Text>
            </View>
          </View>
        </Card>

        {/* ── REVIEW FORM ── */}
        {userId && canReview && !hasReviewed && (
          <Card>
            <SectionHead icon="create-outline" title="Leave a Review" />
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={13} color={C.gold} />
              <Text style={styles.verifiedText}>Verified Purchase</Text>
            </View>
            <GoldDivider style={{ marginTop: 6 }} />
            <View style={styles.ratingSelectRow}>
              <Text style={styles.ratingSelectLabel}>Your Rating</Text>
              <StarRating rating={reviewRating} size={26} onRate={setReviewRating} />
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review (optional)"
              placeholderTextColor={C.mutedText}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline maxLength={500}
            />
            <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmitReview} disabled={submitting}>
              {submitting ? <ActivityIndicator color={C.darkText} size="small" /> : <Text style={styles.submitBtnText}>Submit Review</Text>}
            </TouchableOpacity>
          </Card>
        )}

        {/* ── YOUR EXISTING REVIEW ── */}
        {userId && hasReviewed && !editing && existingReview && (
          <Card>
            <View style={styles.existingReviewHead}>
              <SectionHead icon="star-outline" title="Your Review" />
              <TouchableOpacity style={styles.editChip} onPress={startEditing}>
                <Ionicons name="pencil" size={12} color={C.goldDeep} />
                <Text style={styles.editChipText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <GoldDivider style={{ marginTop: 6 }} />
            <StarRating rating={existingReview.rating} size={18} />
            {existingReview.comment ? <Text style={styles.existingComment}>{existingReview.comment}</Text> : null}
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={13} color={C.gold} />
              <Text style={styles.verifiedText}>Verified Purchase</Text>
            </View>
          </Card>
        )}

        {/* ── EDIT REVIEW FORM ── */}
        {userId && hasReviewed && editing && (
          <Card>
            <SectionHead icon="create-outline" title="Edit Your Review" />
            <GoldDivider style={{ marginTop: 6 }} />
            <View style={styles.ratingSelectRow}>
              <Text style={styles.ratingSelectLabel}>Your Rating</Text>
              <StarRating rating={reviewRating} size={26} onRate={setReviewRating} />
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review (optional)"
              placeholderTextColor={C.mutedText}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline maxLength={500}
            />
            <View style={styles.editBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelEditing}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { flex: 1 }, submitting && { opacity: 0.6 }]} onPress={handleUpdateReview} disabled={submitting}>
                {submitting ? <ActivityIndicator color={C.darkText} size="small" /> : <Text style={styles.submitBtnText}>Update Review</Text>}
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* ── REVIEWS LIST ── */}
        <Card>
          <SectionHead icon="chatbubbles-outline" title={`Reviews (${reviews.length})`} />
          <GoldDivider style={{ marginTop: 6 }} />

          {loadingReviews ? (
            <ActivityIndicator color={C.gold} style={{ marginVertical: 20 }} />
          ) : reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet — be the first!</Text>
          ) : (
            reviews.map(review => (
              <View key={review._id || review.id} style={styles.reviewRow}>
                <View style={styles.reviewRowAccent} />
                <View style={{ flex: 1 }}>
                  <View style={styles.reviewRowHead}>
                    <Text style={styles.reviewerName}>{review.user?.name || 'User'}</Text>
                    <StarRating rating={review.rating} size={12} />
                  </View>
                  {review.verifiedPurchase && (
                    <View style={styles.verifiedRow}>
                      <Ionicons name="checkmark-circle" size={11} color={C.gold} />
                      <Text style={[styles.verifiedText, { fontSize: 10 }]}>Verified</Text>
                    </View>
                  )}
                  {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                  <Text style={styles.reviewDate}>{new Date(review.dateCreated).toLocaleDateString()}</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── BOTTOM BAR ── */}
      <View style={styles.bottomBar}>
        <GoldBar />

        {isAdmin && (
          <TouchableOpacity style={styles.editProductBtn} onPress={() => navigation.navigate("ProductForm", { item })}>
            <Ionicons name="pencil" size={16} color={C.darkText} />
            <Text style={styles.editProductBtnText}>Edit</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPriceBlock}>
          <Text style={styles.bottomPriceLabel}>Total</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={styles.bottomPriceCurrency}>$</Text>
            <Text style={styles.bottomPrice}>{discountedPrice}</Text>
          </View>
        </View>

        {item.countInStock > 0 ? (
          <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart} activeOpacity={0.88}>
            <View style={styles.addToCartIconCircle}>
              <Ionicons name="bag-add" size={16} color={C.darkText} />
            </View>
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.outOfStockBtn}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.pageBg },

  // Image card — olive bg
  imageCard: {
    backgroundColor: C.oliveMid, marginHorizontal: 14, marginTop: 14,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1.5, borderColor: C.gold,
    padding: 20, alignItems: 'center',
    shadowColor: C.gold, shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4,
  },
  image: { width: width - 100, height: 230 },
  discountPill: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.gold, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  discountPillText: { fontSize: 11, fontWeight: '900', color: C.darkText, letterSpacing: 0.3 },

  // Product name area
  productName: { fontSize: 22, fontWeight: '900', fontStyle: 'italic', color: C.darkText, textAlign: 'center', marginBottom: 4 },
  brandText:   { fontSize: 13, color: C.mutedText, textAlign: 'center', marginBottom: 10 },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ratingLabel: { fontSize: 12, color: C.mutedText, fontWeight: '600' },

  // Price block
  priceBlock:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceRow:      { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price:         { fontSize: 26, fontWeight: '900', color: C.olive },
  originalPrice: { fontSize: 16, color: C.mutedText, textDecorationLine: 'line-through' },
  stockBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.goldLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: C.goldBorder },
  stockDot:      { width: 7, height: 7, borderRadius: 3.5 },
  stockText:     { fontSize: 11, fontWeight: '700', color: C.darkText },

  // Description
  descText:     { fontSize: 14, color: C.mutedText, lineHeight: 22 },
  detailsRow:   { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  detailChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.goldLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: C.goldBorder },
  detailChipText:{ fontSize: 12, fontWeight: '700', color: C.darkText },

  // Review form
  verifiedRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  verifiedText:     { fontSize: 11, fontWeight: '700', color: C.goldDeep },
  ratingSelectRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  ratingSelectLabel:{ fontSize: 12, fontWeight: '700', color: C.mutedText, textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewInput: {
    backgroundColor: C.pageBg, borderRadius: 12,
    borderWidth: 1, borderColor: C.goldBorder,
    padding: 12, color: C.darkText, fontSize: 13,
    minHeight: 80, textAlignVertical: 'top', marginBottom: 12,
  },
  submitBtn:     { backgroundColor: C.gold, paddingVertical: 13, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: C.darkText, fontWeight: '900', fontSize: 14, letterSpacing: 0.3 },

  // Existing review
  existingReviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editChip:           { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.goldLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.goldBorder },
  editChipText:       { fontSize: 11, fontWeight: '800', color: C.goldDeep },
  existingComment:    { fontSize: 13, color: C.mutedText, lineHeight: 19, marginVertical: 8 },

  // Edit buttons
  editBtnRow:   { flexDirection: 'row', gap: 10 },
  cancelBtn:    { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: C.goldBorder, backgroundColor: C.goldLight, alignItems: 'center' },
  cancelBtnText:{ fontSize: 13, fontWeight: '700', color: C.goldDeep },

  // Review list rows
  reviewRow:       { flexDirection: 'row', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.goldBorder },
  reviewRowAccent: { width: 3, alignSelf: 'stretch', backgroundColor: C.gold, borderRadius: 2 },
  reviewRowHead:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewerName:    { fontSize: 13, fontWeight: '800', color: C.darkText },
  reviewComment:   { fontSize: 13, color: C.mutedText, lineHeight: 19, marginVertical: 6 },
  reviewDate:      { fontSize: 10, color: C.mutedText, fontStyle: 'italic' },
  noReviews:       { textAlign: 'center', color: C.mutedText, fontSize: 13, fontStyle: 'italic', paddingVertical: 16 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white,
    paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 20,
    borderTopWidth: 1.5, borderTopColor: C.gold,
    overflow: 'hidden',
    shadowColor: C.gold, shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -3 }, shadowRadius: 8, elevation: 8,
  },
  bottomPriceBlock:   { flex: 1 },
  bottomPriceLabel:   { fontSize: 10, fontWeight: '700', color: C.mutedText, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 },
  bottomPriceCurrency:{ fontSize: 13, fontWeight: '800', color: C.gold, marginTop: 3, marginRight: 1 },
  bottomPrice:        { fontSize: 24, fontWeight: '900', color: C.olive, lineHeight: 26 },
  addToCartBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.gold, paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#5C3D00', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 3 }, shadowRadius: 7, elevation: 3,
  },
  addToCartIconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(28,37,16,0.14)', alignItems: 'center', justifyContent: 'center' },
  addToCartText:       { color: C.darkText, fontWeight: '900', fontSize: 14, letterSpacing: 0.3 },
  outOfStockBtn:       { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, backgroundColor: C.redLight, borderWidth: 1, borderColor: 'rgba(139,26,26,0.25)' },
  outOfStockText:      { fontSize: 13, fontWeight: '800', color: C.red },
  editProductBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.goldLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.goldBorder, marginRight: 10 },
  editProductBtnText:  { fontSize: 13, fontWeight: '800', color: C.goldDeep },
});

export default SingleProduct;