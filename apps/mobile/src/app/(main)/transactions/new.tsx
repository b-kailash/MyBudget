import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/theme/spacing';

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

function formatDateForInput(): string {
  return new Date().toISOString().split('T')[0];
}

export default function NewTransactionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [payee, setPayee] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(formatDateForInput());
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.accounts.list() as Promise<Account[]>,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list() as Promise<Category[]>,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.transactions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create transaction');
    },
  });

  const handleSave = () => {
    if (!amount || !payee || !accountId || !categoryId || !date) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const selectedAccount = accounts?.find((a) => a.id === accountId);

    createMutation.mutate({
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

  const selectedAccount = accounts?.find((a) => a.id === accountId);
  const selectedCategory = categories?.find((c) => c.id === categoryId);
  const filteredCategories = categories?.filter(
    (c) => c.type === type || (type === 'TRANSFER' && c.type === 'EXPENSE')
  );

  if (accountsLoading || categoriesLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
                onPress={() => {
                  setType(t);
                  setCategoryId('');
                }}
              >
                <Text
                  style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}
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
              autoFocus
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
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, createMutation.isPending && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <LoadingSpinner size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Create Transaction</Text>
            )}
          </TouchableOpacity>
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
  footer: {
    padding: spacing[4],
    backgroundColor: colors.white,
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
