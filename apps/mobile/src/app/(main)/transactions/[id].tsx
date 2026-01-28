import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  accountId: string;
  categoryId: string;
  transferAccountId: string | null;
  account: { id: string; name: string };
  category: { id: string; name: string; color: string };
}

interface Account {
  id: string;
  name: string;
  currency: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
}

type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

function formatDateForInput(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [payee, setPayee] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => api.transactions.get(id!) as Promise<Transaction>,
    enabled: !!id,
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.accounts.list() as Promise<Account[]>,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list() as Promise<Category[]>,
  });

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(Math.abs(transaction.amount).toString());
      setPayee(transaction.payee);
      setNotes(transaction.notes || '');
      setDate(formatDateForInput(transaction.date));
      setAccountId(transaction.accountId);
      setCategoryId(transaction.categoryId);
    }
  }, [transaction]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.transactions.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsEditing(false);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update transaction');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.transactions.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete transaction');
    },
  });

  const handleSave = () => {
    if (!amount || !payee || !accountId || !categoryId || !date) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const selectedAccount = accounts?.find((a) => a.id === accountId);

    updateMutation.mutate({
      type,
      amount: parseFloat(amount),
      currency: selectedAccount?.currency || 'EUR',
      date: new Date(date).toISOString(),
      payee,
      notes: notes || null,
      accountId,
      categoryId,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  const selectedAccount = accounts?.find((a) => a.id === accountId);
  const selectedCategory = categories?.find((c) => c.id === categoryId);
  const filteredCategories = categories?.filter(
    (c) => c.type === type || (type === 'TRANSFER' && c.type === 'EXPENSE')
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading transaction..." />;
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {isEditing ? (
            <>
              <View style={styles.typeSelector}>
                {(['INCOME', 'EXPENSE', 'TRANSFER'] as TransactionType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeButton,
                      type === t && styles.typeButtonActive,
                      type === t && t === 'INCOME' && styles.typeButtonIncome,
                      type === t && t === 'EXPENSE' && styles.typeButtonExpense,
                      type === t && t === 'TRANSFER' && styles.typeButtonTransfer,
                    ]}
                    onPress={() => setType(t)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === t && styles.typeButtonTextActive,
                      ]}
                    >
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Amount *</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Payee / Description *</Text>
                <TextInput
                  style={styles.input}
                  value={payee}
                  onChangeText={setPayee}
                  placeholder="Enter payee"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Account *</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowAccountPicker(!showAccountPicker)}
                >
                  <Text style={selectedAccount ? styles.pickerText : styles.pickerPlaceholder}>
                    {selectedAccount?.name || 'Select account'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
                </TouchableOpacity>
                {showAccountPicker && (
                  <View style={styles.pickerOptions}>
                    {accounts?.map((account) => (
                      <TouchableOpacity
                        key={account.id}
                        style={[
                          styles.pickerOption,
                          accountId === account.id && styles.pickerOptionActive,
                        ]}
                        onPress={() => {
                          setAccountId(account.id);
                          setShowAccountPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            accountId === account.id && styles.pickerOptionTextActive,
                          ]}
                        >
                          {account.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category *</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                >
                  <View style={styles.pickerWithDot}>
                    {selectedCategory && (
                      <View
                        style={[styles.categoryDot, { backgroundColor: selectedCategory.color }]}
                      />
                    )}
                    <Text style={selectedCategory ? styles.pickerText : styles.pickerPlaceholder}>
                      {selectedCategory?.name || 'Select category'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
                </TouchableOpacity>
                {showCategoryPicker && (
                  <View style={styles.pickerOptions}>
                    {filteredCategories?.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.pickerOption,
                          categoryId === category.id && styles.pickerOptionActive,
                        ]}
                        onPress={() => {
                          setCategoryId(category.id);
                          setShowCategoryPicker(false);
                        }}
                      >
                        <View style={styles.pickerWithDot}>
                          <View
                            style={[styles.categoryDot, { backgroundColor: category.color }]}
                          />
                          <Text
                            style={[
                              styles.pickerOptionText,
                              categoryId === category.id && styles.pickerOptionTextActive,
                            ]}
                          >
                            {category.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add notes (optional)"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </>
          ) : (
            <View style={styles.detailView}>
              <View style={styles.amountCard}>
                <Text
                  style={[
                    styles.displayAmount,
                    transaction.type === 'INCOME'
                      ? styles.incomeAmount
                      : styles.expenseAmount,
                  ]}
                >
                  {transaction.type === 'INCOME' ? '+' : '-'}€
                  {Math.abs(transaction.amount).toFixed(2)}
                </Text>
                <View
                  style={[
                    styles.typeBadge,
                    transaction.type === 'INCOME' && styles.typeBadgeIncome,
                    transaction.type === 'EXPENSE' && styles.typeBadgeExpense,
                    transaction.type === 'TRANSFER' && styles.typeBadgeTransfer,
                  ]}
                >
                  <Text style={styles.typeBadgeText}>
                    {transaction.type.charAt(0) + transaction.type.slice(1).toLowerCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={20} color={colors.gray[400]} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Payee</Text>
                  <Text style={styles.detailValue}>{transaction.payee}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.gray[400]} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(transaction.date).toLocaleDateString('en-IE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="wallet-outline" size={20} color={colors.gray[400]} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Account</Text>
                  <Text style={styles.detailValue}>{transaction.account.name}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: transaction.category.color },
                  ]}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{transaction.category.name}</Text>
                </View>
              </View>

              {transaction.notes && (
                <View style={styles.detailRow}>
                  <Ionicons name="document-text-outline" size={20} color={colors.gray[400]} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailValue}>{transaction.notes}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, updateMutation.isPending && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <LoadingSpinner size="small" color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.viewActions}>
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={20} color={colors.white} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, deleteMutation.isPending && styles.buttonDisabled]}
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Ionicons name="trash" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.gray[600],
  },
  typeButtonIncome: {
    backgroundColor: colors.success[600],
  },
  typeButtonExpense: {
    backgroundColor: colors.error[600],
  },
  typeButtonTransfer: {
    backgroundColor: colors.primary[600],
  },
  typeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[600],
  },
  typeButtonTextActive: {
    color: colors.white,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  pickerWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: fontSize.base,
    color: colors.text,
  },
  pickerPlaceholder: {
    fontSize: fontSize.base,
    color: colors.textMuted,
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
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    marginRight: spacing[2],
  },
  detailView: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  amountCard: {
    padding: spacing[6],
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  displayAmount: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
  },
  incomeAmount: {
    color: colors.success[600],
  },
  expenseAmount: {
    color: colors.error[600],
  },
  typeBadge: {
    marginTop: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  typeBadgeIncome: {
    backgroundColor: colors.success[100],
  },
  typeBadgeExpense: {
    backgroundColor: colors.error[100],
  },
  typeBadgeTransfer: {
    backgroundColor: colors.primary[100],
  },
  typeBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[700],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  categoryIcon: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.sm,
  },
  detailContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing[0.5],
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: fontSize.base,
    color: colors.text,
  },
  footer: {
    padding: spacing[4],
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  editButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  deleteButton: {
    backgroundColor: colors.error[600],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editActions: {
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
