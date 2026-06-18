import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import { CATEGORY_COLORS, CATEGORY_ICONS, COLORS } from "../constants/theme";
import { getCurrencySymbol } from "../utils/currency";

export default function ExpenseListItem({ expense, onPress }) {
  const { user } = useSelector((state) => state.auth);
  const color = CATEGORY_COLORS[expense.category] || COLORS.textSecondary;
  const icon = CATEGORY_ICONS[expense.category] || "ellipsis-horizontal";
  const symbol = getCurrencySymbol(user?.currency);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {expense.title}
        </Text>
        <Text style={styles.meta}>
          {expense.category} · {format(new Date(expense.date), "MMM d")}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>
          -{symbol}
          {parseFloat(expense.amount).toFixed(2)}
        </Text>
        {expense.receiptUrl && (
          <Ionicons
            name="receipt"
            size={14}
            color={COLORS.textSecondary}
            style={{ marginTop: 2 }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: "500", color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  right: { alignItems: "flex-end" },
  amount: { fontSize: 15, fontWeight: "600", color: COLORS.text },
});
