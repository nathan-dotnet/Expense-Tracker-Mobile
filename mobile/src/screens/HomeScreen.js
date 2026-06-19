import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { CATEGORY_COLORS, CATEGORY_ICONS, COLORS } from "../constants/theme";
import { fetchBudgets } from "../store/budgetsSlice";
import { fetchSummary } from "../store/expensesSlice";
import { getCurrencySymbol } from "../utils/currency";

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { summary } = useSelector((state) => state.expenses);
  const { items: budgets } = useSelector((state) => state.budgets);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    dispatch(fetchSummary({}));
    dispatch(fetchBudgets({}));
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalBudget = budgets.find((b) => b.category === "Total");
  const symbol = getCurrencySymbol(user?.currency);
  const pieData = (summary?.categoryBreakdown || []).slice(0, 6).map((c) => ({
    name: c.category,
    population: c.total,
    color: CATEGORY_COLORS[c.category] || COLORS.textSecondary,
    legendFontColor: COLORS.textSecondary,
    legendFontSize: 12,
  }));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.name?.split(" ")[0] || "there"} 👋
            </Text>
            <Text style={styles.headerSubtitle}>
              Here's your spending overview
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={styles.avatarText}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total spend card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>This Month's Spending</Text>
          <Text style={styles.totalAmount}>
            {symbol}
            {(summary?.total || 0).toFixed(2)}
          </Text>
          <Text style={styles.totalCount}>
            {summary?.count || 0} transactions
          </Text>

          {totalBudget && (
            <View style={styles.budgetBarContainer}>
              <View style={styles.budgetBarTrack}>
                <View
                  style={[
                    styles.budgetBarFill,
                    {
                      width: `${Math.min(totalBudget.percentage, 100)}%`,
                      backgroundColor: totalBudget.isOverBudget
                        ? COLORS.danger
                        : totalBudget.isNearLimit
                          ? COLORS.warning
                          : COLORS.secondary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.budgetBarText}>
                {symbol}
                {totalBudget.spent.toFixed(0)} of {symbol}
                {totalBudget.amount.toFixed(0)} budget
              </Text>
            </View>
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("AddExpense")}
          >
            <View
              style={[styles.actionIcon, { backgroundColor: COLORS.primary }]}
            >
              <Ionicons name="add" size={22} color={COLORS.white} />
            </View>
            <Text style={styles.actionLabel}>Add Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("ReceiptScanner")}
          >
            <View
              style={[styles.actionIcon, { backgroundColor: COLORS.secondary }]}
            >
              <Ionicons name="camera" size={22} color={COLORS.white} />
            </View>
            <Text style={styles.actionLabel}>Scan Receipt</Text>
          </TouchableOpacity>
        </View>

        {/* Category breakdown chart */}
        {pieData.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending by Category</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 64}
              height={180}
              chartConfig={{ color: () => COLORS.text }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              center={[10, 0]}
              absolute
            />
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.border} />
            <Text style={styles.emptyText}>No expenses yet this month</Text>
            <TouchableOpacity onPress={() => navigation.navigate("AddExpense")}>
              <Text style={styles.emptyLink}>Add your first expense</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Top categories list */}
        {summary?.categoryBreakdown?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top Categories</Text>
            {summary.categoryBreakdown.slice(0, 5).map((c) => (
              <View key={c.category} style={styles.categoryRow}>
                <View
                  style={[
                    styles.categoryIconCircle,
                    { backgroundColor: `${CATEGORY_COLORS[c.category]}20` },
                  ]}
                >
                  <Ionicons
                    name={CATEGORY_ICONS[c.category]}
                    size={18}
                    color={CATEGORY_COLORS[c.category]}
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{c.category}</Text>
                  <Text style={styles.categoryCount}>
                    {c.count} transactions
                  </Text>
                </View>
                <Text style={styles.categoryAmount}>${c.total.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },
  totalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  totalLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  totalAmount: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: "700",
    marginTop: 4,
  },
  totalCount: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  budgetBarContainer: { marginTop: 16 },
  budgetBarTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    overflow: "hidden",
  },
  budgetBarFill: { height: 8, borderRadius: 4 },
  budgetBarText: { color: "rgba(255,255,255,0.9)", fontSize: 12, marginTop: 6 },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionButton: { alignItems: "center", flex: 1 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  actionLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: { color: COLORS.textSecondary, marginTop: 12, fontSize: 14 },
  emptyLink: { color: COLORS.primary, marginTop: 8, fontWeight: "600" },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: "500", color: COLORS.text },
  categoryCount: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  categoryAmount: { fontSize: 15, fontWeight: "600", color: COLORS.text },
});
