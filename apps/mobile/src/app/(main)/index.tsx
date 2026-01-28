import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui';
import { SummaryCards, RecentTransactions, AccountBalances } from '@/components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/colors';
import { spacing, fontSize, fontWeight } from '@/theme/spacing';

export default function DashboardScreen() {
  const { user } = useAuth();

  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard.get(),
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  if (isError || !dashboardData) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load dashboard</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { summary, recentTransactions, accounts } = dashboardData;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary[600]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.subGreeting}>
            {new Date().toLocaleDateString('en-IE', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.section}>
          <SummaryCards
            totalBalance={summary.totalBalance}
            totalIncome={summary.totalIncome}
            totalExpenses={summary.totalExpenses}
            netSavings={summary.netSavings}
          />
        </View>

        <AccountBalances accounts={accounts} />

        <View style={styles.section}>
          <RecentTransactions transactions={recentTransactions} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[6],
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  greeting: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subGreeting: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },
  section: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.error[600],
  },
});
