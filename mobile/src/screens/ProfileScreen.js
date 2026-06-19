import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import { COLORS, PAYMENT_METHODS } from "../constants/theme";
import { reportsAPI } from "../services/api";
import { logout, updateProfile } from "../store/authSlice";
import { CURRENCIES } from "../utils/currency";

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [infoModal, setInfoModal] = useState(null);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
      const result = await dispatch(updateProfile({ currency: currencyCode }));
      if (result.meta.requestStatus !== "fulfilled") {
        throw new Error(result.payload || "Failed to update currency");
      }
      Toast.show({ type: "success", text1: "Currency updated!" });
      setShowCurrencyModal(false);
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to update currency" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveProfile = async () => {
    const name = nameInput.trim();
    if (!name) {
      return Toast.show({ type: "error", text1: "Name is required" });
    }

    setIsUpdating(true);
    try {
      const result = await dispatch(updateProfile({ name }));
      if (result.meta.requestStatus !== "fulfilled") {
        throw new Error(result.payload || "Failed to update profile");
      }
      Toast.show({ type: "success", text1: "Profile updated!" });
      setShowEditModal(false);
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to update profile" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleNotifications = async (enabled) => {
    setIsUpdating(true);
    try {
      const result = await dispatch(updateProfile({ notificationsEnabled: enabled }));
      if (result.meta.requestStatus !== "fulfilled") {
        throw new Error(result.payload || "Failed to update notifications");
      }
      Toast.show({
        type: "success",
        text1: enabled ? "Notifications enabled" : "Notifications disabled",
      });
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to update notifications" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportReports = async () => {
    setIsExporting(true);
    try {
      const [monthly, yearly] = await Promise.all([
        reportsAPI.monthly({ months: 6 }),
        reportsAPI.yearly({ year: new Date().getFullYear() }),
      ]);
      const months = monthly.data.data || [];
      const year = yearly.data.data;
      const latest = months[months.length - 1];

      Alert.alert(
        "Report Ready",
        `Year ${year.year}: ${year.count} transactions, total ${year.total.toFixed(2)}.\n\nLatest month (${latest?.label || "N/A"}): ${latest?.count || 0} transactions, total ${(latest?.total || 0).toFixed(2)}.`
      );
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to export reports" });
    } finally {
      setIsExporting(false);
    }
  };

  const openInfoModal = (type) => {
    const content = {
      privacy: {
        title: "Privacy & Security",
        body:
          "Your account is protected with secure authentication. Expense, budget, and report data are only loaded for your signed-in account.",
      },
      help: {
        title: "Help & Support",
        body:
          "Use Expenses to add and review spending, Budget to set limits, Insights for AI analysis, and Profile to manage account preferences.",
      },
    };
    setInfoModal(content[type]);
  };

  const MENU_ITEMS = [
    { icon: "person-outline", label: "Edit Profile", onPress: () => {
      setNameInput(user?.name || "");
      setShowEditModal(true);
    } },
    { icon: "card-outline", label: "Payment Methods", onPress: () => setShowPaymentModal(true) },
    { icon: "notifications-outline", label: "Notifications", isSwitch: true },
    { icon: "document-text-outline", label: "Export Reports", onPress: handleExportReports, loading: isExporting },
    { icon: "shield-checkmark-outline", label: "Privacy & Security", onPress: () => openInfoModal("privacy") },
    { icon: "help-circle-outline", label: "Help & Support", onPress: () => openInfoModal("help") },
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
              onPress={item.onPress}
              disabled={item.isSwitch || item.loading}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={COLORS.textSecondary}
                style={{ marginRight: 14 }}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : item.isSwitch ? (
                <Switch
                  value={user?.notificationsEnabled !== false}
                  onValueChange={handleToggleNotifications}
                  disabled={isUpdating}
                  trackColor={{ false: COLORS.border, true: `${COLORS.primary}55` }}
                  thumbColor={user?.notificationsEnabled !== false ? COLORS.primary : COLORS.white}
                />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.border}
                />
              )}
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

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.formContent}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Your name"
                placeholderTextColor={COLORS.textSecondary}
              />
              <TouchableOpacity
                style={styles.secondaryRow}
                onPress={() => setShowCurrencyModal(true)}
              >
                <Text style={styles.secondaryRowText}>Currency</Text>
                <Text style={styles.secondaryRowValue}>{user?.currency || "USD"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isUpdating && styles.disabledButton]}
                onPress={handleSaveProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Methods</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.formContent}>
              {PAYMENT_METHODS.map((method) => (
                <View key={method.value} style={styles.paymentRow}>
                  <Ionicons name="card-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.paymentLabel}>{method.label}</Text>
                </View>
              ))}
              <Text style={styles.helperText}>
                Choose a payment method when adding or editing an expense.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!infoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModal(null)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.infoCard}>
            <Text style={styles.modalTitle}>{infoModal?.title}</Text>
            <Text style={styles.infoText}>{infoModal?.body}</Text>
            <TouchableOpacity style={styles.saveButton} onPress={() => setInfoModal(null)}>
              <Text style={styles.saveButtonText}>Done</Text>
            </TouchableOpacity>
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
  formContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  textInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 14,
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  secondaryRowText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  secondaryRowValue: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
  },
  saveButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentLabel: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  centerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    padding: 24,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    marginBottom: 20,
  },
});
