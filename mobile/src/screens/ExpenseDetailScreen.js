import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  COLORS,
  PAYMENT_METHODS,
} from "../constants/theme";
import { getExpenseById } from "../services/localDb";
import { deleteExpense } from "../store/expensesSlice";
import { getCurrencySymbol } from "../utils/currency";

export default function ExpenseDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [expense, setExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getExpenseById(id)
      .then((data) => setExpense(data))
      .catch(() =>
        Toast.show({ type: "error", text1: "Failed to load expense" }),
      )
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await dispatch(deleteExpense(id));
            if (result.meta.requestStatus === "fulfilled") {
              Toast.show({ type: "success", text1: "Expense deleted" });
              navigation.goBack();
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.center}>
        <Text>Expense not found</Text>
      </View>
    );
  }

  const color = CATEGORY_COLORS[expense.category] || COLORS.textSecondary;
  const icon = CATEGORY_ICONS[expense.category] || "ellipsis-horizontal";
  const paymentLabel =
    PAYMENT_METHODS.find((p) => p.value === expense.paymentMethod)?.label ||
    "Other";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.headerCard}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={28} color={color} />
        </View>
        <Text style={styles.amount}>
          {getCurrencySymbol(user?.currency)}
          {parseFloat(expense.amount).toFixed(2)}
        </Text>
        <Text style={styles.titleText}>{expense.title}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.categoryBadgeText, { color }]}>
            {expense.category}
          </Text>
        </View>
      </View>

      {expense.receiptUrl && (
        <View style={styles.receiptSection}>
          <Text style={styles.sectionLabel}>Receipt</Text>
          <Image
            source={{ uri: expense.receiptUrl }}
            style={styles.receiptImage}
          />
        </View>
      )}

      <View style={styles.detailsCard}>
        <DetailRow
          icon="calendar-outline"
          label="Date"
          value={format(new Date(expense.date), "MMMM d, yyyy")}
        />
        <DetailRow
          icon="card-outline"
          label="Payment Method"
          value={paymentLabel}
        />
        {expense.notes && (
          <DetailRow
            icon="document-text-outline"
            label="Notes"
            value={expense.notes}
          />
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => navigation.navigate("EditExpense", { expense })}
        >
          <Ionicons name="pencil" size={18} color={COLORS.primary} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={18} color={COLORS.danger} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons
        name={icon}
        size={18}
        color={COLORS.textSecondary}
        style={{ marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  scroll: { padding: 20, paddingBottom: 60 },
  headerCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  amount: { fontSize: 32, fontWeight: "700", color: COLORS.text },
  titleText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: "600" },
  receiptSection: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  receiptImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    resizeMode: "cover",
  },
  detailsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  detailLabel: { fontSize: 12, color: COLORS.textSecondary },
  detailValue: { fontSize: 15, color: COLORS.text, marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    borderRadius: 12,
    gap: 8,
  },
  editBtn: {
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editBtnText: { color: COLORS.primary, fontWeight: "600" },
  deleteBtn: {
    backgroundColor: `${COLORS.danger}15`,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  deleteBtnText: { color: COLORS.danger, fontWeight: "600" },
});
