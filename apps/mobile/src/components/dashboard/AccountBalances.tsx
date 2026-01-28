import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/theme/spacing';

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
}

interface AccountBalancesProps {
  accounts: Account[];
}

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
  }).format(amount);
}

function getAccountIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'CHECKING':
      return 'card';
    case 'SAVINGS':
      return 'cash';
    case 'CREDIT_CARD':
      return 'card-outline';
    case 'CASH':
      return 'wallet';
    case 'INVESTMENT':
      return 'trending-up';
    default:
      return 'wallet';
  }
}

function getAccountColor(type: string): string {
  switch (type) {
    case 'CHECKING':
      return colors.primary[500];
    case 'SAVINGS':
      return colors.success[500];
    case 'CREDIT_CARD':
      return colors.warning[500];
    case 'CASH':
      return colors.gray[500];
    case 'INVESTMENT':
      return colors.primary[700];
    default:
      return colors.gray[500];
  }
}

export function AccountBalances({ accounts }: AccountBalancesProps) {
  if (accounts.length === 0) {
    return (
      <Card style={styles.container}>
        <Text style={styles.title}>Accounts</Text>
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.emptyText}>No accounts yet</Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accounts</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {accounts.map((account) => (
          <Card key={account.id} style={styles.accountCard}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: getAccountColor(account.type) + '20' },
              ]}
            >
              <Ionicons
                name={getAccountIcon(account.type)}
                size={20}
                color={getAccountColor(account.type)}
              />
            </View>
            <Text style={styles.accountName} numberOfLines={1}>
              {account.name}
            </Text>
            <Text style={styles.accountType}>{account.type.replace('_', ' ')}</Text>
            <Text
              style={[
                styles.balance,
                account.balance < 0 && styles.negativeBalance,
              ]}
            >
              {formatCurrency(account.balance, account.currency)}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing[3],
    paddingHorizontal: spacing[4],
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  accountCard: {
    width: 160,
    padding: spacing[4],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  accountName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing[0.5],
  },
  accountType: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'capitalize',
    marginBottom: spacing[2],
  },
  balance: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  negativeBalance: {
    color: colors.error[600],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing[3],
  },
});
