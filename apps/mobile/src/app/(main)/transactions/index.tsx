import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/theme/spacing';

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  currency: string;
  date: string;
  payee: string;
  notes: string | null;
  account: { id: string; name: string };
  category: { id: string; name: string; color: string; icon: string | null };
}

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER';

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function TransactionsListScreen() {
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [page, setPage] = useState(1);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: '20',
    };
    if (filterType !== 'ALL') params.type = filterType;
    if (selectedAccountId) params.accountId = selectedAccountId;
    if (selectedCategoryId) params.categoryId = selectedCategoryId;
    return params;
  }, [filterType, selectedAccountId, selectedCategoryId, page]);

  const {
    data: transactionsData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['transactions', queryParams],
    queryFn: () => api.transactions.list(queryParams),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.accounts.list() as Promise<Account[]>,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list() as Promise<Category[]>,
  });

  const transactions = transactionsData?.items as Transaction[] | undefined;
  const pagination = transactionsData?.pagination;

  const hasActiveFilters = filterType !== 'ALL' || selectedAccountId || selectedCategoryId;

  const clearFilters = () => {
    setFilterType('ALL');
    setSelectedAccountId(null);
    setSelectedCategoryId(null);
    setPage(1);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionRow}
      onPress={() => router.push(`/transactions/${item.id}`)}
    >
      <View style={[styles.categoryDot, { backgroundColor: item.category.color }]} />
      <View style={styles.transactionDetails}>
        <Text style={styles.payee} numberOfLines={1}>
          {item.payee}
        </Text>
        <Text style={styles.meta}>
          {item.category.name} • {item.account.name}
        </Text>
      </View>
      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amount,
            item.type === 'INCOME' ? styles.incomeAmount : styles.expenseAmount,
          ]}
        >
          {item.type === 'INCOME' ? '+' : '-'}
          {formatCurrency(Math.abs(item.amount), item.currency)}
        </Text>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChips}
      >
        {(['ALL', 'INCOME', 'EXPENSE', 'TRANSFER'] as FilterType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, filterType === type && styles.filterChipActive]}
            onPress={() => {
              setFilterType(type);
              setPage(1);
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                filterType === type && styles.filterChipTextActive,
              ]}
            >
              {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterChip, hasActiveFilters && styles.filterChipActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name="filter"
            size={14}
            color={hasActiveFilters ? colors.white : colors.gray[600]}
          />
          <Text
            style={[
              styles.filterChipText,
              { marginLeft: spacing[1] },
              hasActiveFilters && styles.filterChipTextActive,
            ]}
          >
            Filters
          </Text>
        </TouchableOpacity>
      </ScrollView>
      {hasActiveFilters && (
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Clear all</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={colors.gray[300]} />
      <Text style={styles.emptyTitle}>No transactions found</Text>
      <Text style={styles.emptySubtitle}>
        {hasActiveFilters
          ? 'Try adjusting your filters'
          : 'Tap + to add your first transaction'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={page === 1 ? colors.gray[300] : colors.primary[600]}
          />
        </TouchableOpacity>
        <Text style={styles.pageText}>
          Page {pagination.page} of {pagination.totalPages}
        </Text>
        <TouchableOpacity
          style={[
            styles.pageButton,
            page >= pagination.totalPages && styles.pageButtonDisabled,
          ]}
          onPress={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
          disabled={page >= pagination.totalPages}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={page >= pagination.totalPages ? colors.gray[300] : colors.primary[600]}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading transactions..." />;
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load transactions</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary[600]}
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/transactions/new')}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.filterLabel}>Account</Text>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  !selectedAccountId && styles.filterOptionActive,
                ]}
                onPress={() => setSelectedAccountId(null)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    !selectedAccountId && styles.filterOptionTextActive,
                  ]}
                >
                  All Accounts
                </Text>
              </TouchableOpacity>
              {accounts?.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.filterOption,
                    selectedAccountId === account.id && styles.filterOptionActive,
                  ]}
                  onPress={() => setSelectedAccountId(account.id)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedAccountId === account.id && styles.filterOptionTextActive,
                    ]}
                  >
                    {account.name}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.filterLabel, { marginTop: spacing[4] }]}>Category</Text>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  !selectedCategoryId && styles.filterOptionActive,
                ]}
                onPress={() => setSelectedCategoryId(null)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    !selectedCategoryId && styles.filterOptionTextActive,
                  ]}
                >
                  All Categories
                </Text>
              </TouchableOpacity>
              {categories?.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.filterOption,
                    selectedCategoryId === category.id && styles.filterOptionActive,
                  ]}
                  onPress={() => setSelectedCategoryId(category.id)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedCategoryId === category.id && styles.filterOptionTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setPage(1);
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  listContent: {
    flexGrow: 1,
  },
  headerContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing[3],
  },
  filterChips: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    gap: spacing[2],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
  },
  filterChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[600],
  },
  filterChipTextActive: {
    color: colors.white,
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginLeft: spacing[4],
    marginTop: spacing[2],
  },
  clearButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
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
  meta: {
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing[4],
  },
  emptySubtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    gap: spacing[4],
  },
  pageButton: {
    padding: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: spacing[6],
    right: spacing[4],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  retryButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  modalBody: {
    padding: spacing[4],
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
  },
  filterOption: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[1],
  },
  filterOptionActive: {
    backgroundColor: colors.primary[50],
  },
  filterOptionText: {
    fontSize: fontSize.base,
    color: colors.text,
  },
  filterOptionTextActive: {
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  modalFooter: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
