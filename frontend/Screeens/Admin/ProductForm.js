import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

import FormContainer from "../../Shared/FormContainer";
import Input from "../../Shared/Input";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import baseURL from "../../assets/common/baseurl";
import Error from "../../Shared/Error";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import mime from "mime";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  cream:       "#F8F4EC",
  white:       "#FFFFFF",
  gold:        "#C9A84C",
  goldDeep:    "#A87B28",
  goldLight:   "rgba(201,168,76,0.13)",
  goldBorder:  "rgba(201,168,76,0.26)",
  greenDark:   "#0B1F10",
  greenMid:    "#1A5C2E",
  greenSoft:   "rgba(26,92,46,0.08)",
  greenBorder: "rgba(26,92,46,0.18)",
  mutedText:   "rgba(11,31,16,0.50)",
};

// ─── Decorative helpers ───────────────────────────────────────────────────────
const GoldBar = () => (
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: C.gold }} />
);

const GoldDivider = ({ style }) => (
  <View style={[{ flexDirection: "row", alignItems: "center", marginVertical: 14 }, style]}>
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
    <View style={{ width: 5, height: 5, backgroundColor: C.gold, transform: [{ rotate: "45deg" }], marginHorizontal: 8 }} />
    <View style={{ flex: 1, height: 1, backgroundColor: C.goldBorder }} />
  </View>
);

const CornerRings = ({ size = 80, color = C.goldBorder }) => (
  <View
    style={{ position: "absolute", top: -size * 0.3, right: -size * 0.3, width: size, height: size, overflow: "hidden" }}
    pointerEvents="none"
  >
    {[1, 0.68, 0.4].map((s, i) => (
      <View key={i} style={{
        position: "absolute",
        width: size * s, height: size * s, borderRadius: (size * s) / 2,
        borderWidth: 1, borderColor: color,
        top: (size - size * s) / 2, left: (size - size * s) / 2,
      }} />
    ))}
  </View>
);

/** Labelled field wrapper */
const FieldWrap = ({ icon, label, required, children, style }) => (
  <View style={[fw.wrap, style]}>
    <View style={fw.labelRow}>
      <View style={fw.iconPip}>
        <Ionicons name={icon} size={11} color={C.gold} />
      </View>
      <Text style={fw.labelText}>{label}</Text>
      {required && <Text style={fw.required}>*</Text>}
    </View>
    {children}
  </View>
);
const fw = StyleSheet.create({
  wrap:     { width: "100%", marginBottom: 14 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 },
  iconPip:  { width: 20, height: 20, borderRadius: 10, backgroundColor: C.goldLight, alignItems: "center", justifyContent: "center" },
  labelText:{ fontSize: 10, fontWeight: "800", color: C.greenMid, textTransform: "uppercase", letterSpacing: 0.9, flex: 1 },
  required: { fontSize: 12, color: C.gold, fontWeight: "900" },
});

/** Section heading with badge */
const SectionHeading = ({ icon, title, badge }) => (
  <View style={sh.row}>
    <View style={sh.iconCircle}>
      <Ionicons name={icon} size={14} color={C.gold} />
    </View>
    <Text style={sh.title}>{title}</Text>
    {badge && <View style={sh.badge}><Text style={sh.badgeText}>{badge}</Text></View>}
  </View>
);
const sh = StyleSheet.create({
  row:       { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  iconCircle:{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.goldLight, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.goldBorder },
  title:     { fontSize: 13, fontWeight: "900", color: C.greenDark, flex: 1, letterSpacing: 0.2 },
  badge:     { backgroundColor: C.greenDark, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 8, fontWeight: "800", color: C.gold, letterSpacing: 1.5 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const ProductForm = (props) => {
  const [pickerValue,    setPickerValue]    = useState("");
  const [brand,          setBrand]          = useState("");
  const [name,           setName]           = useState("");
  const [price,          setPrice]          = useState("");
  const [description,    setDescription]    = useState("");
  const [image,          setImage]          = useState("");
  const [mainImage,      setMainImage]      = useState(null);
  const [category,       setCategory]       = useState("");
  const [categories,     setCategories]     = useState([]);
  const [token,          setToken]          = useState();
  const [error,          setError]          = useState();
  const [countInStock,   setCountInStock]   = useState("");
  const [rating,         setRating]         = useState(0);
  const [isFeatured,     setIsFeatured]     = useState(false);
  const [richDescription,setRichDescription]= useState("");
  const [numReviews,     setNumReviews]     = useState(0);
  const [item,           setItem]           = useState(null);

  const navigation = useNavigation();
  const isEditing  = item !== null;

  useEffect(() => {
    if (!props.route?.params) {
      setItem(null);
    } else {
      const p = props.route.params.item;
      setItem(p);
      setBrand(p.brand);
      setName(p.name);
      setPrice(p.price.toString());
      setDescription(p.description);
      setMainImage(p.image);
      setImage(p.image);
      setCategory(p.category._id);
      setPickerValue(p.category._id);
      setCountInStock(p.countInStock.toString());
    }
    AsyncStorage.getItem("jwt").then(setToken).catch(console.log);
    axios.get(`${baseURL}categories`).then((res) => setCategories(res.data)).catch(() => alert("Error loading categories"));
    (async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") alert("Camera roll permission is needed.");
      }
    })();
    return () => setCategories([]);
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setMainImage(result.assets[0].uri);
      setImage(result.assets[0].uri);
    }
  };

  const addProduct = () => {
    if (!name || !brand || !price || !description || !category || !countInStock) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);

    const formData = new FormData();
    const newImageUri = image ? "file:///" + image.split("file:/").join("") : "";
    formData.append("name", name);
    formData.append("brand", brand);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("countInStock", countInStock);
    formData.append("richDescription", richDescription);
    formData.append("rating", rating);
    formData.append("numReviews", numReviews);
    formData.append("isFeatured", isFeatured);
    if (image && !image.startsWith("http")) {
      formData.append("image", { uri: newImageUri, type: mime.getType(newImageUri), name: newImageUri.split("/").pop() });
    }

    const config = { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } };

    const request = isEditing
      ? axios.put(`${baseURL}products/${item.id || item._id}`, formData, config)
      : axios.post(`${baseURL}products`, formData, config);

    request.then((res) => {
      if ([200, 201].includes(res.status)) {
        Toast.show({ topOffset: 60, type: "success", text1: isEditing ? "Product Updated" : "Product Added" });
        setTimeout(() => isEditing ? navigation.goBack() : navigation.navigate("Products"), 500);
      }
    }).catch(() => Toast.show({ topOffset: 60, type: "error", text1: "Something went wrong", text2: "Please try again" }));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.scrollBg}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Background orbs */}
      <View style={styles.orbTR} />
      <View style={styles.orbBL} />

      {/* ══════ PAGE HEADER ══════ */}
      <View style={styles.pageHeader}>
        <GoldBar />
        <CornerRings />
        <View style={styles.pageHeaderInner}>
          <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>{isEditing ? "Edit Product" : "New Product"}</Text>
            <Text style={styles.pageSubtitle}>
              {isEditing ? "Update the details below and save changes" : "Fill in the details to list a new product"}
            </Text>
          </View>
        </View>
      </View>

      {/* ══════ IMAGE CARD ══════ */}
      <View style={styles.card}>
        <GoldBar />
        <CornerRings size={56} color="rgba(201,168,76,0.18)" />

        <SectionHeading icon="image-outline" title="Product Cover" badge="PHOTO" />
        <GoldDivider style={{ marginTop: 8 }} />

        {/* Image circle */}
        <View style={styles.imageOuter}>
          <View style={styles.imageRing}>
            <Image
              style={styles.image}
              source={mainImage || image ? { uri: mainImage || image } : undefined}
            />
            {!(mainImage || image) && (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="leaf-outline" size={36} color={C.goldBorder} />
                <Text style={styles.imagePlaceholderText}>No image</Text>
              </View>
            )}
          </View>

          {/* Camera button */}
          <TouchableOpacity style={styles.cameraBtn} onPress={pickImage} activeOpacity={0.85}>
            <Ionicons name="camera" size={16} color={C.greenDark} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.uploadChip} onPress={pickImage} activeOpacity={0.85}>
          <Ionicons name="cloud-upload-outline" size={14} color={C.gold} />
          <Text style={styles.uploadChipText}>{mainImage ? "Change photo" : "Upload photo"}</Text>
        </TouchableOpacity>
      </View>

      {/* ══════ BASIC INFO CARD ══════ */}
      <View style={styles.card}>
        <GoldBar />
        <SectionHeading icon="cube-outline" title="Basic Information" badge="REQUIRED" />
        <GoldDivider style={{ marginTop: 8 }} />

        <FieldWrap icon="storefront-outline" label="Brand" required>
          <Input
            placeholder="e.g. Green Roots"
            name="brand" id="brand"
            value={brand}
            onChangeText={setBrand}
          />
        </FieldWrap>

        <FieldWrap icon="leaf-outline" label="Product Name" required>
          <Input
            placeholder="e.g. Peace Lily"
            name="name" id="name"
            value={name}
            onChangeText={setName}
          />
        </FieldWrap>

        {/* Price + Stock row */}
        <View style={styles.rowFields}>
          <FieldWrap icon="cash-outline" label="Price" required style={{ flex: 1, marginRight: 10 }}>
            <Input
              placeholder="0.00"
              name="price" id="price"
              value={price}
              keyboardType="numeric"
              onChangeText={setPrice}
            />
          </FieldWrap>
          <FieldWrap icon="layers-outline" label="In Stock" required style={{ flex: 1 }}>
            <Input
              placeholder="0"
              name="stock" id="stock"
              value={countInStock}
              keyboardType="numeric"
              onChangeText={setCountInStock}
            />
          </FieldWrap>
        </View>

        <FieldWrap icon="document-text-outline" label="Description" required>
          <Input
            placeholder="Describe the product…"
            name="description" id="description"
            value={description}
            onChangeText={setDescription}
          />
        </FieldWrap>
      </View>

      {/* ══════ CATEGORY CARD ══════ */}
      <View style={styles.card}>
        <GoldBar />
        <SectionHeading icon="grid-outline" title="Category" />
        <GoldDivider style={{ marginTop: 8 }} />

        <FieldWrap icon="list-outline" label="Select Category" required>
          <View style={styles.pickerWrap}>
            <View style={styles.pickerIconCol}>
              <Ionicons name="chevron-down-outline" size={14} color={C.gold} />
            </View>
            <Picker
              style={styles.picker}
              selectedValue={pickerValue}
              onValueChange={(e) => { setPickerValue(e); setCategory(e); }}
              dropdownIconColor={C.gold}
            >
              <Picker.Item label="Select a category…" value="" color={C.mutedText} />
              {categories.map((c, i) => (
                <Picker.Item key={c.id || c._id || i} label={c.name} value={c.id || c._id} color={C.greenDark} />
              ))}
            </Picker>
          </View>
        </FieldWrap>
      </View>

      {/* ══════ FEATURED TOGGLE ══════ */}
      <View style={styles.card}>
        <GoldBar />
        <SectionHeading icon="star-outline" title="Featured Product" />
        <GoldDivider style={{ marginTop: 8 }} />

        <TouchableOpacity
          style={[styles.toggleRow, isFeatured && styles.toggleRowOn]}
          onPress={() => setIsFeatured(!isFeatured)}
          activeOpacity={0.85}
        >
          <View style={[styles.toggleIconCircle, isFeatured && styles.toggleIconCircleOn]}>
            <Ionicons name={isFeatured ? "star" : "star-outline"} size={16} color={isFeatured ? C.greenDark : C.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleLabel, isFeatured && styles.toggleLabelOn]}>
              {isFeatured ? "Featured — shown in highlights" : "Not featured"}
            </Text>
            <Text style={styles.toggleHint}>Featured products appear on the home screen</Text>
          </View>
          <View style={[styles.togglePill, isFeatured && styles.togglePillOn]}>
            <View style={[styles.toggleKnob, isFeatured && styles.toggleKnobOn]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error ? <Error message={error} /> : null}

      {/* ══════ SUBMIT BUTTON ══════ */}
      <TouchableOpacity style={styles.submitBtn} onPress={addProduct} activeOpacity={0.88}>
        <View style={styles.submitIconCircle}>
          <Ionicons name={isEditing ? "save-outline" : "add-circle-outline"} size={18} color={C.greenDark} />
        </View>
        <Text style={styles.submitText}>{isEditing ? "Save Changes" : "Add Product"}</Text>
        <Ionicons name="chevron-forward-outline" size={15} color={C.greenDark} style={{ marginLeft: "auto", opacity: 0.6 }} />
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  scrollBg:      { flex: 1, backgroundColor: C.cream },
  scrollContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 32 },

  // Orbs
  orbTR: { position: "absolute", top: -80,  right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(201,168,76,0.09)" },
  orbBL: { position: "absolute", top: 340,  left: -70,  width: 190, height: 190, borderRadius: 95,  backgroundColor: "rgba(26,92,46,0.07)"   },

  // Page header
  pageHeader: {
    backgroundColor: C.white, borderRadius: 22, overflow: "hidden",
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 22, paddingBottom: 16,
    marginBottom: 14,
    shadowColor: "#071209", shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 5,
  },
  pageHeaderInner: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  adminBadge:      { backgroundColor: C.greenDark, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginTop: 4 },
  adminBadgeText:  { fontSize: 9, fontWeight: "800", color: C.gold, letterSpacing: 1.8 },
  pageTitle:       { fontSize: 22, fontWeight: "900", color: C.greenDark, letterSpacing: 0.2 },
  pageSubtitle:    { fontSize: 11, color: C.mutedText, fontWeight: "500", marginTop: 3 },

  // Card
  card: {
    backgroundColor: C.white, borderRadius: 20, overflow: "hidden",
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 18, paddingTop: 20, paddingBottom: 18,
    marginBottom: 14,
    shadowColor: "#071209", shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 4,
  },

  // Image section
  imageOuter: { alignItems: "center", marginVertical: 16, position: "relative" },
  imageRing: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 3, borderColor: C.goldBorder,
    backgroundColor: C.goldLight, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#071209", shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4,
  },
  image:            { width: "100%", height: "100%", borderRadius: 80 },
  imagePlaceholder: { position: "absolute", alignItems: "center", gap: 6 },
  imagePlaceholderText: { fontSize: 11, color: C.goldBorder, fontWeight: "600", fontStyle: "italic" },
  cameraBtn: {
    position: "absolute", bottom: 0, right: "28%",
    backgroundColor: C.gold, width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.white,
    shadowColor: "#5C3D00", shadowOpacity: 0.3, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 4,
  },
  uploadChip: {
    alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: C.goldBorder, backgroundColor: C.goldLight,
  },
  uploadChipText: { fontSize: 12, fontWeight: "700", color: C.goldDeep },

  // Row fields
  rowFields: { flexDirection: "row", width: "100%" },

  // Picker
  pickerWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.greenSoft, borderRadius: 12,
    borderWidth: 1, borderColor: C.goldBorder, overflow: "hidden",
  },
  pickerIconCol: {
    width: 38, height: 50, alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderRightColor: C.goldBorder, backgroundColor: C.goldLight,
  },
  picker: { flex: 1, height: 50, color: C.greenDark },

  // Featured toggle
  toggleRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.greenSoft, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.greenBorder,
  },
  toggleRowOn: { backgroundColor: C.goldLight, borderColor: C.goldBorder },
  toggleIconCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.goldLight, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.goldBorder,
  },
  toggleIconCircleOn: { backgroundColor: C.gold, borderColor: C.goldDeep },
  toggleLabel:    { fontSize: 13, fontWeight: "800", color: C.greenDark },
  toggleLabelOn:  { color: C.goldDeep },
  toggleHint:     { fontSize: 10, color: C.mutedText, marginTop: 2, fontStyle: "italic" },
  togglePill: {
    width: 44, height: 24, borderRadius: 12,
    backgroundColor: "rgba(11,31,16,0.12)", borderWidth: 1, borderColor: C.greenBorder,
    justifyContent: "center", paddingHorizontal: 3,
  },
  togglePillOn: { backgroundColor: C.gold, borderColor: C.goldDeep },
  toggleKnob:   { width: 18, height: 18, borderRadius: 9, backgroundColor: C.white, shadowColor: "#000", shadowOpacity: 0.15, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 2 },
  toggleKnobOn: { transform: [{ translateX: 20 }] },

  // Submit
  submitBtn: {
    backgroundColor: C.gold, borderRadius: 16,
    paddingVertical: 15, paddingHorizontal: 18,
    flexDirection: "row", alignItems: "center", gap: 12,
    marginTop: 4,
    shadowColor: "#5C3D00", shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, elevation: 4,
  },
  submitIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(11,31,16,0.14)", alignItems: "center", justifyContent: "center",
  },
  submitText: { fontSize: 15, fontWeight: "900", color: C.greenDark, letterSpacing: 0.3 },
});

export default ProductForm;