import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { insightsAPI } from '../services/api';
import { COLORS } from '../constants/theme';

export default function InsightsScreen() {
  const [insight, setInsight] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [noData, setNoData] = useState(false);

  const loadInsight = async (refresh = false) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    setNoData(false);
    try {
      const res = refresh ? await insightsAPI.refresh({}) : await insightsAPI.get({});
      if (res.data.data) {
        setInsight({ ...res.data.data, tips: typeof res.data.data.tips === 'string' ? JSON.parse(res.data.data.tips) : res.data.data.tips });
      } else {
        setNoData(true);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load insights', text2: err.response?.data?.message || '' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadInsight(); }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analyzing your spending...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadInsight(true)} colors={[COLORS.primary]} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>AI Insights</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => loadInsight(true)}>
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {noData ? (
          <View style={styles.emptyState}>
            <Ionicons name="bulb-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptySubtitle}>Add some expenses this month to get personalized AI insights about your spending.</Text>
          </View>
        ) : insight ? (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconRow}>
                <Ionicons name="sparkles" size={20} color={COLORS.white} />
                <Text style={styles.summaryLabel}>Summary</Text>
              </View>
              <Text style={styles.summaryText}>{insight.summary}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Detailed Analysis</Text>
              <Text style={styles.contentText}>{insight.content}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>💡 Personalized Tips</Text>
              {insight.tips?.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { color: COLORS.textSecondary, marginTop: 12 },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  refreshButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${COLORS.primary}15`, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  summaryCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, marginBottom: 16 },
  summaryIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  summaryLabel: { color: COLORS.white, fontWeight: '600', fontSize: 13 },
  summaryText: { color: COLORS.white, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 18, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  contentText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  tipRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' },
  tipNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: `${COLORS.secondary}20`, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 1 },
  tipNumberText: { fontSize: 11, fontWeight: '700', color: COLORS.secondary },
  tipText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },
});
