import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { fetchBudgets, saveBudget } from '../store/budgetsSlice';
import { COLORS, CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from '../constants/theme';
import { getCurrencySymbol } from '../utils/currency';

export default function BudgetScreen() {
  const dispatch = useDispatch();
  const { items: budgets, isLoading } = useSelector((state) => state.budgets);
  const { user } = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Total');
  const [amountInput, setAmountInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(() => dispatch(fetchBudgets({})), [dispatch]);
  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openModal = (category, currentAmount) => {
    setSelectedCategory(category);
    setAmountInput(currentAmount ? String(currentAmount) : '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!amountInput || parseFloat(amountInput) <= 0) {
      return Toast.show({ type: 'error', text1: 'Enter a valid amount' });
    }
    setIsSaving(true);
    const result = await dispatch(saveBudget({ category: selectedCategory, amount: parseFloat(amountInput) }));
    setIsSaving(false);
    if (result.meta.requestStatus === 'fulfilled') {
      Toast.show({ type: 'success', text1: 'Budget saved' });
      setModalVisible(false);
      load();
    }
  };

  const totalBudget = budgets.find((b) => b.category === 'Total');
  const categoryBudgets = budgets.filter((b) => b.category !== 'Total');
  const unbudgeted = CATEGORIES.filter((c) => !categoryBudgets.find((b) => b.category === c));
  const currencySymbol = getCurrencySymbol(user?.currency);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <Text style={styles.title}>Budgets</Text>
        <Text style={styles.subtitle}>Set spending limits and track progress</Text>

        {/* Total budget */}
        <TouchableOpacity style={styles.totalCard} onPress={() => openModal('Total', totalBudget?.amount)}>
          <View style={styles.totalCardHeader}>
            <Text style={styles.totalCardLabel}>Overall Monthly Budget</Text>
            <Ionicons name="pencil" size={16} color="rgba(255,255,255,0.8)" />
          </View>
          {totalBudget ? (
            <>
              <Text style={styles.totalCardAmount}>
                {currencySymbol}{totalBudget.spent.toFixed(0)} <Text style={styles.totalCardOf}>of {currencySymbol}{totalBudget.amount.toFixed(0)}</Text>
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(totalBudget.percentage, 100)}%`,
                      backgroundColor: totalBudget.isOverBudget ? '#FF6B6B' : COLORS.white,
                    },
                  ]}
                />
              </View>
              <Text style={styles.totalCardPercent}>{totalBudget.percentage}% used</Text>
            </>
          ) : (
            <Text style={styles.setBudgetPrompt}>Tap to set a monthly budget</Text>
          )}
        </TouchableOpacity>

        {/* Category budgets */}
        <Text style={styles.sectionTitle}>By Category</Text>
        {categoryBudgets.map((b) => (
          <CategoryBudgetCard key={b.id} budget={b} currencySymbol={currencySymbol} onPress={() => openModal(b.category, b.amount)} />
        ))}

        {unbudgeted.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Add a Budget</Text>
            <View style={styles.unbudgetedGrid}>
              {unbudgeted.map((cat) => (
                <TouchableOpacity key={cat} style={styles.unbudgetedChip} onPress={() => openModal(cat, null)}>
                  <Ionicons name={CATEGORY_ICONS[cat]} size={14} color={CATEGORY_COLORS[cat]} style={{ marginRight: 6 }} />
                  <Text style={styles.unbudgetedChipText}>{cat}</Text>
                  <Ionicons name="add-circle" size={16} color={COLORS.primary} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Budget edit modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedCategory} Budget</Text>
            <View style={styles.modalInputRow}>
              <Text style={styles.modalCurrency}>{currencySymbol}</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                value={amountInput}
                onChangeText={setAmountInput}
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function CategoryBudgetCard({ budget, currencySymbol, onPress }) {
  const color = CATEGORY_COLORS[budget.category] || COLORS.textSecondary;
  return (
    <TouchableOpacity style={styles.categoryCard} onPress={onPress}>
      <View style={styles.categoryCardHeader}>
        <View style={styles.categoryCardLeft}>
          <View style={[styles.categoryIconCircle, { backgroundColor: `${color}20` }]}>
            <Ionicons name={CATEGORY_ICONS[budget.category]} size={16} color={color} />
          </View>
          <Text style={styles.categoryCardTitle}>{budget.category}</Text>
        </View>
        <Text style={styles.categoryCardAmount}>
          {currencySymbol}{budget.spent.toFixed(0)} / {currencySymbol}{budget.amount.toFixed(0)}
        </Text>
      </View>
      <View style={styles.progressTrackLight}>
        <View
          style={[
            styles.progressFillLight,
            {
              width: `${Math.min(budget.percentage, 100)}%`,
              backgroundColor: budget.isOverBudget ? COLORS.danger : budget.isNearLimit ? COLORS.warning : color,
            },
          ]}
        />
      </View>
      {budget.isOverBudget && (
        <Text style={styles.overBudgetText}>Over budget by {currencySymbol}{(budget.spent - budget.amount).toFixed(2)}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, marginBottom: 20 },
  totalCard: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 20, marginBottom: 24 },
  totalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalCardLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
  totalCardAmount: { color: COLORS.white, fontSize: 28, fontWeight: '700', marginTop: 8 },
  totalCardOf: { fontSize: 16, fontWeight: '400', color: 'rgba(255,255,255,0.8)' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  totalCardPercent: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 6 },
  setBudgetPrompt: { color: 'rgba(255,255,255,0.8)', marginTop: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 12, marginTop: 4 },
  categoryCard: { backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 10 },
  categoryCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryCardLeft: { flexDirection: 'row', alignItems: 'center' },
  categoryIconCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  categoryCardTitle: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  categoryCardAmount: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  progressTrackLight: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressFillLight: { height: 6, borderRadius: 3 },
  overBudgetText: { fontSize: 11, color: COLORS.danger, marginTop: 6, fontWeight: '500' },
  unbudgetedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unbudgetedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  unbudgetedChipText: { fontSize: 13, color: COLORS.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  modalInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 24 },
  modalCurrency: { fontSize: 20, color: COLORS.textSecondary, fontWeight: '600', marginRight: 6 },
  modalInput: { flex: 1, fontSize: 20, color: COLORS.text },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  modalCancelText: { color: COLORS.text, fontWeight: '600' },
  modalSaveBtn: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
  modalSaveText: { color: COLORS.white, fontWeight: '600' },
});
