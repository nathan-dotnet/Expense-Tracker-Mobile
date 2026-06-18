import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchExpenses } from '../store/expensesSlice';
import ExpenseListItem from '../components/ExpenseListItem';
import { COLORS, CATEGORIES } from '../constants/theme';

export default function ExpensesListScreen({ navigation }) {
  const dispatch = useDispatch();
  const { items, pagination, isLoading, isRefreshing } = useSelector((state) => state.expenses);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const loadExpenses = useCallback((page = 1) => {
    dispatch(fetchExpenses({ page, limit: 20, search: search || undefined, category: activeCategory || undefined }));
  }, [dispatch, search, activeCategory]);

  useEffect(() => { loadExpenses(1); }, [activeCategory]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => loadExpenses(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && !isLoading) {
      loadExpenses(pagination.page + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddExpense')}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={['All', ...CATEGORIES]}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const isActive = item === 'All' ? !activeCategory : activeCategory === item;
          return (
            <TouchableOpacity
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveCategory(item === 'All' ? null : item)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ExpenseListItem expense={item} onPress={() => navigation.navigate('ExpenseDetail', { id: item.id })} />
        )}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadExpenses(1)} colors={[COLORS.primary]} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={isLoading && !isRefreshing ? <ActivityIndicator style={{ marginVertical: 16 }} color={COLORS.primary} /> : null}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No expenses found</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12,
    paddingHorizontal: 14, marginHorizontal: 20, height: 46, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  filterRow: { paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  filterChipTextActive: { color: COLORS.white },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: COLORS.textSecondary, marginTop: 12 },
});
