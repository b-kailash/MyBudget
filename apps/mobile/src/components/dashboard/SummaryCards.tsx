import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, fontSize, fontWeight } from '@/theme/spacing';

interface SummaryCardsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  currency?: string;
}

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface SummaryCardProps {
  title: string;
  amount: number;
  currency: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
}

function SummaryCard({
  title,
  amount,
  currency,
  icon,
  iconColor,
  iconBgColor,
}: SummaryCardProps) {
  return (
    <Card style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardAmount}>{formatCurrency(amount, currency)}</Text>
    </Card>
  );
}

export function SummaryCards({
  totalBalance,
  totalIncome,
  totalExpenses,
  netSavings,
  currency = 'EUR',
}: SummaryCardsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <SummaryCard
          title="Total Balance"
          amount={totalBalance}
          currency={currency}
          icon="wallet"
          iconColor={colors.primary[600]}
          iconBgColor={colors.primary[50]}
        />
        <SummaryCard
          title="Income"
          amount={totalIncome}
          currency={currency}
          icon="trending-up"
          iconColor={colors.success[600]}
          iconBgColor={colors.success[50]}
        />
      </View>
      <View style={styles.row}>
        <SummaryCard
          title="Expenses"
          amount={totalExpenses}
          currency={currency}
          icon="trending-down"
          iconColor={colors.error[600]}
          iconBgColor={colors.error[50]}
        />
        <SummaryCard
          title="Net Savings"
          amount={netSavings}
          currency={currency}
          icon="piggy-bank"
          iconColor={netSavings >= 0 ? colors.success[600] : colors.error[600]}
          iconBgColor={netSavings >= 0 ? colors.success[50] : colors.error[50]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  card: {
    flex: 1,
    padding: spacing[4],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  cardTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  cardAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
});
