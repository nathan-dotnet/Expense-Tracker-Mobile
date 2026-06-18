import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import { updateExpense } from '../store/expensesSlice';
import { COLORS, CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, PAYMENT_METHODS } from '../constants/theme';

export default function EditExpenseScreen({ navigation, route }) {
  const { expense } = route.params;
  const dispatch = useDispatch();

  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(String(expense.amount));
  const [category, setCategory] = useState(expense.category);
  const [date, setDate] = useState(new Date(expense.date));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState(expense.notes || '');
  const [paymentMethod, setPaymentMethod] = useState(expense.paymentMethod || 'credit_card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return Toast.show({ type: 'error', text1: 'Title is required' });
    if (!amount || parseFloat(amount) <= 0) return Toast.show({ type: 'error', text1: 'Enter a valid amount' });

    setIsSubmitting(true);
    const result = await dispatch(updateExpense({
      id: expense.id,
      data: {
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date: date.toISOString(),
        notes: notes.trim() || undefined,
        paymentMethod,
      },
    }));
    setIsSubmitting(false);

    if (result.meta.requestStatus === 'fulfilled') {
      Toast.show({ type: 'success', text1: 'Expense updated' });
      navigation.goBack();
    } else {
      Toast.show({ type: 'error', text1: 'Update failed', text2: result.payload });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Amount</Text>
      <View style={styles.amountRow}>
        <Text style={styles.currencyPrefix}>$</Text>
        <TextInput style={[styles.input, { flex: 1, marginLeft: 4 }]} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          const color = CATEGORY_COLORS[cat];
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, active && { backgroundColor: color, borderColor: color }]}
              onPress={() => setCategory(cat)}
            >
              <Ionicons name={CATEGORY_ICONS[cat]} size={14} color={active ? COLORS.white : color} style={{ marginRight: 6 }} />
              <Text style={[styles.categoryChipText, active && { color: COLORS.white }]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
        <Text style={{ color: COLORS.text }}>{format(date, 'MMMM d, yyyy')}</Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={date}
        onConfirm={(d) => { setDate(d); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)}
        maximumDate={new Date()}
      />

      <Text style={styles.label}>Payment Method</Text>
      <View style={styles.categoryGrid}>
        {PAYMENT_METHODS.map((pm) => (
          <TouchableOpacity
            key={pm.value}
            style={[styles.categoryChip, paymentMethod === pm.value && styles.categoryChipActiveSimple]}
            onPress={() => setPaymentMethod(pm.value)}
          >
            <Text style={[styles.categoryChipText, paymentMethod === pm.value && { color: COLORS.white }]}>{pm.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitButtonText}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, justifyContent: 'center' },
  amountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  currencyPrefix: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  categoryChipActiveSimple: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryChipText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  submitButton: { backgroundColor: COLORS.primary, borderRadius: 12, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  submitButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});
