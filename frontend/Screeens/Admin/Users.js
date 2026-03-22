import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Searchbar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import Toast from "react-native-toast-message";
import axios from "axios";

import baseURL from "../../assets/common/baseurl";

const C = {
  cream: "#F8F4EC",
  white: "#FFFFFF",
  gold: "#C9A84C",
  goldDeep: "#A87B28",
  goldLight: "rgba(201,168,76,0.14)",
  goldBorder: "rgba(201,168,76,0.28)",
  greenDark: "#0B1F10",
  greenMid: "#1A5C2E",
  greenSoft: "rgba(26,92,46,0.10)",
  greenBorder: "rgba(26,92,46,0.20)",
  mutedText: "rgba(11,31,16,0.50)",
  red: "#8B1A1A",
  redSoft: "rgba(139,26,26,0.10)",
  redBorder: "rgba(139,26,26,0.20)",
};

const Users = () => {
  const [token, setToken] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [userList, setUserList] = useState([]);
  const [updatingMap, setUpdatingMap] = useState({});

  const filteredList = useMemo(() => {
    const list = Array.isArray(userList) ? userList : [];
    if (!searchText.trim()) {
      return list;
    }

    const keyword = searchText.toLowerCase();
    return list.filter((user) => {
      const name = String(user?.name || "").toLowerCase();
      const email = String(user?.email || "").toLowerCase();
      return name.includes(keyword) || email.includes(keyword);
    });
  }, [userList, searchText]);

  const activeCount = filteredList.filter((user) => user?.isActive !== false).length;
  const adminCount = filteredList.filter((user) => user?.isAdmin === true).length;

  const markUpdating = (id, value) => {
    setUpdatingMap((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const fetchUsers = async (authToken) => {
    const effectiveToken = authToken || token;
    if (!effectiveToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${baseURL}users/admin/list`, {
        headers: { Authorization: `Bearer ${effectiveToken}` },
      });

      setUserList(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.log(error);
      Toast.show({
        topOffset: 60,
        type: "error",
        text1: "Failed to load users",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const prepare = async () => {
        try {
          const storedToken = await AsyncStorage.getItem("jwt");
          if (!storedToken || !isMounted) {
            setLoading(false);
            return;
          }

          setToken(storedToken);

          try {
            const decoded = jwtDecode(storedToken);
            if (decoded?.userId) {
              setCurrentUserId(String(decoded.userId));
            }
          } catch (decodeError) {
            console.log("Failed to decode token", decodeError);
          }

          await fetchUsers(storedToken);
        } catch (error) {
          console.log(error);
          setLoading(false);
        }
      };

      prepare();

      return () => {
        isMounted = false;
        setUserList([]);
        setRefreshing(false);
        setLoading(true);
      };
    }, [])
  );

  const updateUserAdminState = async ({ userId, payload, successText }) => {
    if (!token || !userId) {
      return;
    }

    markUpdating(userId, true);

    try {
      await axios.put(`${baseURL}users/admin/${userId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserList((prev) =>
        prev.map((user) => {
          const id = String(user?.id || user?._id);
          if (id !== String(userId)) {
            return user;
          }

          return {
            ...user,
            ...payload,
          };
        })
      );

      Toast.show({
        topOffset: 60,
        type: "success",
        text1: successText,
      });
    } catch (error) {
      const message = error?.response?.data?.message || "User update failed";
      Toast.show({
        topOffset: 60,
        type: "error",
        text1: message,
      });
    } finally {
      markUpdating(userId, false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
  };

  const renderUserItem = ({ item }) => {
    const id = String(item?.id || item?._id || "");
    const isSelf = currentUserId && id === currentUserId;
    const isUpdating = updatingMap[id] === true;
    const roleLabel = item?.isAdmin ? "Admin" : "User";
    const statusLabel = item?.isActive === false ? "Inactive" : "Active";

    return (
      <View style={styles.userCard}>
        <View style={styles.rowTop}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-outline" size={16} color={C.greenDark} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{item?.name || "Unnamed"}</Text>
            <Text style={styles.email} numberOfLines={1}>{item?.email || "No email"}</Text>
          </View>

          {isSelf && (
            <View style={styles.selfBadge}>
              <Text style={styles.selfBadgeText}>You</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.rolePill}>
            <Ionicons name={item?.isAdmin ? "shield-checkmark-outline" : "person-outline"} size={12} color={C.goldDeep} />
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>

          <View style={[styles.statusPill, item?.isActive === false ? styles.statusInactive : styles.statusActive]}>
            <Ionicons
              name={item?.isActive === false ? "close-circle-outline" : "checkmark-circle-outline"}
              size={12}
              color={item?.isActive === false ? C.red : C.greenMid}
            />
            <Text style={[styles.statusText, { color: item?.isActive === false ? C.red : C.greenMid }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isUpdating}
            onPress={() =>
              updateUserAdminState({
                userId: id,
                payload: { isAdmin: !(item?.isAdmin === true) },
                successText: item?.isAdmin ? "Role changed to user" : "Role changed to admin",
              })
            }
            style={styles.actionBtn}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={C.greenDark} />
            ) : (
              <>
                <Ionicons name="swap-horizontal-outline" size={14} color={C.greenDark} />
                <Text style={styles.actionText}>Toggle Role</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isUpdating || isSelf}
            onPress={() =>
              updateUserAdminState({
                userId: id,
                payload: { isActive: !(item?.isActive !== false) },
                successText: item?.isActive === false ? "User activated" : "User deactivated",
              })
            }
            style={[styles.actionBtn, item?.isActive === false ? styles.activateBtn : styles.deactivateBtn, isSelf && styles.disabledBtn]}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={item?.isActive === false ? C.greenMid : C.red} />
            ) : (
              <>
                <Ionicons
                  name={item?.isActive === false ? "checkmark-circle-outline" : "ban-outline"}
                  size={14}
                  color={item?.isActive === false ? C.greenMid : C.red}
                />
                <Text style={[styles.actionText, { color: item?.isActive === false ? C.greenMid : C.red }]}> 
                  {item?.isActive === false ? "Activate" : "Deactivate"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? (
        <View style={styles.spinnerWrap}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={styles.spinnerText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item, index) => String(item?.id || item?._id || index)}
          renderItem={renderUserItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <View style={styles.goldBar} />

              <View style={styles.titleRow}>
                <View style={styles.titleBadge}>
                  <Text style={styles.titleBadgeText}>ADMIN</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>User Management</Text>
                  <Text style={styles.subtitle}>Control roles and account activation</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{filteredList.length}</Text>
                  <Text style={styles.statLabel}>Visible</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{adminCount}</Text>
                  <Text style={styles.statLabel}>Admins</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{activeCount}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
              </View>

              <View style={styles.searchWrap}>
                <View style={styles.searchIconWrap}>
                  <Ionicons name="search-outline" size={16} color={C.gold} />
                </View>
                <Searchbar
                  placeholder="Search by name or email"
                  onChangeText={setSearchText}
                  value={searchText}
                  style={styles.searchBar}
                  inputStyle={styles.searchInput}
                  iconColor="transparent"
                  elevation={0}
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No users found for this search.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.cream,
  },
  spinnerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerText: {
    marginTop: 10,
    color: C.mutedText,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 24,
  },
  headerCard: {
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: C.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.goldBorder,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 16,
  },
  goldBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: C.gold,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  titleBadge: {
    backgroundColor: C.greenDark,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 4,
  },
  titleBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: C.gold,
    letterSpacing: 1.8,
  },
  title: {
    fontSize: 23,
    fontWeight: "900",
    color: C.greenDark,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 11,
    color: C.mutedText,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  statPill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.goldBorder,
    backgroundColor: C.goldLight,
    paddingVertical: 10,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: C.greenDark,
  },
  statLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: C.mutedText,
    fontWeight: "700",
  },
  searchWrap: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.goldBorder,
    overflow: "hidden",
  },
  searchIconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: C.goldBorder,
    backgroundColor: C.goldLight,
  },
  searchBar: {
    flex: 1,
    backgroundColor: "transparent",
    elevation: 0,
    height: 44,
    margin: 0,
    padding: 0,
  },
  searchInput: {
    fontSize: 13,
    color: C.greenDark,
    paddingLeft: 4,
  },
  userCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.goldBorder,
    borderRadius: 16,
    marginHorizontal: 14,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.greenSoft,
    borderWidth: 1,
    borderColor: C.greenBorder,
    marginRight: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "900",
    color: C.greenDark,
  },
  email: {
    marginTop: 2,
    fontSize: 11,
    color: C.mutedText,
  },
  selfBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: C.goldLight,
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  selfBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.goldDeep,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.goldLight,
    borderWidth: 1,
    borderColor: C.goldBorder,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.goldDeep,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusActive: {
    backgroundColor: C.greenSoft,
    borderColor: C.greenBorder,
  },
  statusInactive: {
    backgroundColor: C.redSoft,
    borderColor: C.redBorder,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.goldBorder,
    backgroundColor: C.goldLight,
    paddingVertical: 10,
  },
  activateBtn: {
    borderColor: C.greenBorder,
    backgroundColor: C.greenSoft,
  },
  deactivateBtn: {
    borderColor: C.redBorder,
    backgroundColor: C.redSoft,
  },
  disabledBtn: {
    opacity: 0.55,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "800",
    color: C.greenDark,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 12,
    color: C.mutedText,
    fontWeight: "700",
  },
});

export default Users;
