import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { LoadingSpinner, Card } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/theme/spacing';

interface Account {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'CASH' | 'INVESTMENT' | 'OTHER';
  currency: string;
  openingBalance: number;
  isActive: boolean;
  balance?: number;
}

type AccountType = Account['type'];

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'CHECKING', label: 'Checking', icon: 'card' },
  { value: 'SAVINGS', label: 'Savings', icon: 'wallet' },
  { value: 'CREDIT_CARD', label: 'Credit Card', icon: 'card-outline' },
  { value: 'CASH', label: 'Cash', icon: 'cash' },
  { value: 'INVESTMENT', label: 'Investment', icon: 'trending-up' },
  { value: 'OTHER', label: 'Other', icon: 'ellipsis-horizontal' },
];

const CURRENCIES = ['EUR', 'USD', 'GBP'];

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
  }).format(amount);
}

function getAccountTypeInfo(type: AccountType) {
  return ACCOUNT_TYPES.find((t) => t.value === type) || ACCOUNT_TYPES[5];
}

export default function AccountsScreen() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [currency, setCurrency] = useState('EUR');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const {
    data: accounts,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.accounts.list() as Promise<Account[]>,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.accounts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create account');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.accounts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update account');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.accounts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete account');
    },
  });

  const openCreateModal = () => {
    setEditingAccount(null);
    setName('');
    setType('CHECKING');
    setCurrency('EUR');
    setOpeningBalance('0');
    setShowModal(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setName(account.name);
    setType(account.type);
    setCurrency(account.currency);
    setOpeningBalance(account.openingBalance.toString());
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    setShowTypePicker(false);
    setShowCurrencyPicker(false);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter an account name');
      return;
    }

    const data = {
      name: name.trim(),
      type,
      currency,
      openingBalance: parseFloat(openingBalance) || 0,
      isActive: true,
    };

    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (account: Account) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"? This will also delete all transactions associated with this account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(account.id),
        },
      ]
    );
  };

  const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.balance ?? acc.openingBalance), 0) ?? 0;

  const renderAccount = ({ item }: { item: Account }) => {
    const typeInfo = getAccountTypeInfo(item.type);
    const balance = item.balance ?? item.openingBalance;

    return (
      <TouchableOpacity
        style={styles.accountCard}
        onPress={() => openEditModal(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.accountIcon}>
          <Ionicons
            name={typeInfo.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={colors.primary[600]}
          />
        </View>
        <View style={styles.accountDetails}>
          <Text style={styles.accountName}>{item.name}</Text>
          <Text style={styles.accountType}>{typeInfo.label}</Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text
            style={[
              styles.accountBalance,
              balance >= 0 ? styles.positiveBalance : styles.negativeBalance,
            ]}
          >
            {formatCurrency(balance, item.currency)}
          </Text>
          <Text style={styles.currencyLabel}>{item.currency}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <Card style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>Total Balance</Text>
      <Text style={styles.summaryAmount}>{formatCurrency(totalBalance)}</Text>
      <Text style={styles.accountCount}>
        {accounts?.length ?? 0} account{(accounts?.length ?? 0) !== 1 ? 's' : ''}
      </Text>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="wallet-outline" size={64} color={colors.gray[300]} />
      <Text style={styles.emptyTitle}>No accounts yet</Text>
      <Text style={styles.emptySubtitle}>Tap + to add your first account</Text>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading accounts..." />;
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load accounts</Text>
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
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={renderAccount}
        ListHeaderComponent={accounts?.length ? renderHeader : null}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary[600]}
          />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAccount ? 'Edit Account' : 'New Account'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Account Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Main Checking"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Account Type *</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTypePicker(!showTypePicker)}
                >
                  <View style={styles.pickerWithIcon}>
                    <Ionicons
                      name={getAccountTypeInfo(type).icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={colors.primary[600]}
                    />
                    <Text style={styles.pickerText}>{getAccountTypeInfo(type).label}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
                </TouchableOpacity>
                {showTypePicker && (
                  <View style={styles.pickerOptions}>
                    {ACCOUNT_TYPES.map((accountType) => (
                      <TouchableOpacity
                        key={accountType.value}
                        style={[
                          styles.pickerOption,
                          type === accountType.value && styles.pickerOptionActive,
                        ]}
                        onPress={() => {
                          setType(accountType.value);
                          setShowTypePicker(false);
                        }}
                      >
                        <View style={styles.pickerWithIcon}>
                          <Ionicons
                            name={accountType.icon as keyof typeof Ionicons.glyphMap}
                            size={20}
                            color={
                              type === accountType.value
                                ? colors.primary[600]
                                : colors.gray[400]
                            }
                          />
                          <Text
                            style={[
                              styles.pickerOptionText,
                              type === accountType.value && styles.pickerOptionTextActive,
                            ]}
                          >
                            {accountType.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Currency *</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
                >
                  <Text style={styles.pickerText}>{currency}</Text>
                  <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
                </TouchableOpacity>
                {showCurrencyPicker && (
                  <View style={styles.pickerOptions}>
                    {CURRENCIES.map((curr) => (
                      <TouchableOpacity
                        key={curr}
                        style={[
                          styles.pickerOption,
                          currency === curr && styles.pickerOptionActive,
                        ]}
                        onPress={() => {
                          setCurrency(curr);
                          setShowCurrencyPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            currency === curr && styles.pickerOptionTextActive,
                          ]}
                        >
                          {curr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Opening Balance</Text>
                <TextInput
                  style={styles.input}
                  value={openingBalance}
                  onChangeText={setOpeningBalance}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (createMutation.isPending || updateMutation.isPending) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <LoadingSpinner size="small" color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingAccount ? 'Save Changes' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    padding: spacing[4],
    flexGrow: 1,
  },
  summaryCard: {
    padding: spacing[5],
    marginBottom: spacing[4],
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  summaryAmount: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  accountCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing[2],
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing[0.5],
  },
  accountType: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  positiveBalance: {
    color: colors.success[600],
  },
  negativeBalance: {
    color: colors.error[600],
  },
  currencyLabel: {
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
    maxHeight: '85%',
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
  formGroup: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    color: colors.text,
  },
  pickerButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  pickerText: {
    fontSize: fontSize.base,
    color: colors.text,
  },
  pickerOptions: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginTop: spacing[1],
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  pickerOptionActive: {
    backgroundColor: colors.primary[50],
  },
  pickerOptionText: {
    fontSize: fontSize.base,
    color: colors.text,
  },
  pickerOptionTextActive: {
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  modalFooter: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
