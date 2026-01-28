import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/theme/spacing';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  payee: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IE', {
    month: 'short',
    day: 'numeric',
  });
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const router = useRouter();

  if (transactions.length === 0) {
    return (
      <Card style={styles.container}>
        <Text style={styles.title}>Recent Transactions</Text>
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => router.push('/transactions')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      {transactions.slice(0, 5).map((transaction) => (
        <TouchableOpacity
          key={transaction.id}
          style={styles.transactionRow}
          onPress={() => router.push(`/transactions/${transaction.id}`)}
        >
          <View
            style={[
              styles.categoryDot,
              { backgroundColor: transaction.category.color },
            ]}
          />
          <View style={styles.transactionDetails}>
            <Text style={styles.payee} numberOfLines={1}>
              {transaction.payee}
            </Text>
            <Text style={styles.categoryName}>{transaction.category.name}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text
              style={[
                styles.amount,
                transaction.type === 'INCOME'
                  ? styles.incomeAmount
                  : styles.expenseAmount,
              ]}
            >
              {transaction.type === 'INCOME' ? '+' : '-'}
              {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
            </Text>
            <Text style={styles.date}>{formatDate(transaction.date)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  viewAll: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    marginRight: spacing[3],
  },
  transactionDetails: {
    flex: 1,
  },
  payee: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing[0.5],
  },
  categoryName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  incomeAmount: {
    color: colors.success[600],
  },
  expenseAmount: {
    color: colors.error[600],
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing[0.5],
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
