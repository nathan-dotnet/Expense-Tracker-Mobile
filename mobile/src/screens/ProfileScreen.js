import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import { COLORS } from "../constants/theme";
import { authAPI } from "../services/api";
import { logout } from "../store/authSlice";
import { CURRENCIES } from "../utils/currency";

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const handleCurrencyChange = async (currencyCode) => {
    setIsUpdating(true);
    try {
      await authAPI.updateProfile({ currency: currencyCode });
      Toast.show({ type: "success", text1: "Currency updated!" });
      setShowCurrencyModal(false);
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to update currency" });
    } finally {
      setIsUpdating(false);
    }
  };

  const MENU_ITEMS = [
    { icon: "person-outline", label: "Edit Profile" },
    { icon: "card-outline", label: "Payment Methods" },
    { icon: "notifications-outline", label: "Notifications" },
    { icon: "document-text-outline", label: "Export Reports" },
    { icon: "shield-checkmark-outline", label: "Privacy & Security" },
    { icon: "help-circle-outline", label: "Help & Support" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <TouchableOpacity
            style={styles.currencyBadge}
            onPress={() => setShowCurrencyModal(true)}
          >
            <Text style={styles.currencyBadgeText}>
              {user?.currency || "PHP"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.currencyHint}>Tap to change currency</Text>
        </View>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuRow,
                i < MENU_ITEMS.length - 1 && styles.menuRowBorder,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={COLORS.textSecondary}
                style={{ marginRight: 14 }}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color={COLORS.danger}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Expense Tracker v1.0.0</Text>
      </ScrollView>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.currencyList}>
              {CURRENCIES.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.currencyItem,
                    user?.currency === currency.code &&
                      styles.currencyItemSelected,
                  ]}
                  onPress={() => handleCurrencyChange(currency.code)}
                  disabled={isUpdating}
                >
                  <View>
                    <Text style={styles.currencyCode}>{currency.code}</Text>
                    <Text style={styles.currencyName}>{currency.name}</Text>
                  </View>
                  <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                  {user?.currency === currency.code && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { color: COLORS.white, fontSize: 28, fontWeight: "700" },
  userName: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  userEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  currencyBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  currencyBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },
  currencyHint: { color: COLORS.textSecondary, fontSize: 11, marginTop: 6 },
  menuCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  menuRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuLabel: { flex: 1, fontSize: 14, color: COLORS.text },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${COLORS.danger}10`,
    borderRadius: 12,
    height: 50,
    marginBottom: 20,
  },
  logoutText: { color: COLORS.danger, fontWeight: "600", fontSize: 15 },
  versionText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  currencyList: {
    padding: 20,
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 12,
  },
  currencyItemSelected: {
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  currencyName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  currencySymbol: {
    marginLeft: "auto",
    marginRight: 12,
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.primary,
  },
});
