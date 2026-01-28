import React, { useState, useMemo } from 'react';
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
import { LoadingSpinner } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/theme/spacing';

interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  parentId: string | null;
  color: string;
  icon: string;
}

type CategoryType = 'INCOME' | 'EXPENSE';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export default function CategoriesScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CategoryType>('EXPENSE');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [showParentPicker, setShowParentPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const {
    data: categories,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list() as Promise<Category[]>,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.categories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.categories.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete category');
    },
  });

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((c) => c.type === activeTab);
  }, [categories, activeTab]);

  const parentCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((c) => c.type === type && !c.parentId);
  }, [categories, type]);

  const categoriesWithChildren = useMemo(() => {
    const parents = filteredCategories.filter((c) => !c.parentId);
    return parents.map((parent) => ({
      ...parent,
      children: filteredCategories.filter((c) => c.parentId === parent.id),
    }));
  }, [filteredCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setType(activeTab);
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setParentId(null);
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setType(category.type);
    setColor(category.color);
    setParentId(category.parentId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setShowParentPicker(false);
    setShowColorPicker(false);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a category name');
      return;
    }

    const data = {
      name: name.trim(),
      type,
      color,
      icon: 'tag',
      parentId: parentId || null,
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (category: Category) => {
    const hasChildren = filteredCategories.some((c) => c.parentId === category.id);
    if (hasChildren) {
      Alert.alert(
        'Cannot Delete',
        'This category has subcategories. Please delete them first.'
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(category.id),
        },
      ]
    );
  };

  const selectedParent = parentCategories.find((c) => c.id === parentId);

  const renderCategory = ({ item }: { item: Category & { children: Category[] } }) => (
    <View style={styles.categoryGroup}>
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => openEditModal(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
        <Text style={styles.categoryName}>{item.name}</Text>
        <View style={styles.categoryMeta}>
          {item.children.length > 0 && (
            <Text style={styles.childCount}>
              {item.children.length} sub
            </Text>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
        </View>
      </TouchableOpacity>
      {item.children.length > 0 && (
        <View style={styles.childrenContainer}>
          {item.children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={styles.childCard}
              onPress={() => openEditModal(child)}
              onLongPress={() => handleDelete(child)}
            >
              <View style={[styles.childColor, { backgroundColor: child.color }]} />
              <Text style={styles.childName}>{child.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.tabContainer}>
      {(['EXPENSE', 'INCOME'] as CategoryType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab === 'EXPENSE' ? 'Expenses' : 'Income'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="pricetag-outline" size={64} color={colors.gray[300]} />
      <Text style={styles.emptyTitle}>No categories yet</Text>
      <Text style={styles.emptySubtitle}>Tap + to add a category</Text>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading categories..." />;
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load categories</Text>
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
        data={categoriesWithChildren}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        ListHeaderComponent={renderHeader}
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
                {editingCategory ? 'Edit Category' : 'New Category'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Groceries"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Type *</Text>
                <View style={styles.typeSelector}>
                  {(['EXPENSE', 'INCOME'] as CategoryType[]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeButton,
                        type === t && styles.typeButtonActive,
                        type === t && t === 'INCOME' && styles.typeButtonIncome,
                        type === t && t === 'EXPENSE' && styles.typeButtonExpense,
                      ]}
                      onPress={() => {
                        setType(t);
                        setParentId(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          type === t && styles.typeButtonTextActive,
                        ]}
                      >
                        {t === 'EXPENSE' ? 'Expense' : 'Income'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Color *</Text>
                <TouchableOpacity
                  style={styles.colorButton}
                  onPress={() => setShowColorPicker(!showColorPicker)}
                >
                  <View style={[styles.colorPreview, { backgroundColor: color }]} />
                  <Text style={styles.colorText}>{color}</Text>
                  <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
                </TouchableOpacity>
                {showColorPicker && (
                  <View style={styles.colorGrid}>
                    {PRESET_COLORS.map((presetColor) => (
                      <TouchableOpacity
                        key={presetColor}
                        style={[
                          styles.colorOption,
                          { backgroundColor: presetColor },
                          color === presetColor && styles.colorOptionSelected,
                        ]}
                        onPress={() => {
                          setColor(presetColor);
                          setShowColorPicker(false);
                        }}
                      >
                        {color === presetColor && (
                          <Ionicons name="checkmark" size={16} color={colors.white} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Parent Category (Optional)</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowParentPicker(!showParentPicker)}
                >
                  <Text style={selectedParent ? styles.pickerText : styles.pickerPlaceholder}>
                    {selectedParent?.name || 'None (Top-level category)'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
                </TouchableOpacity>
                {showParentPicker && (
                  <View style={styles.pickerOptions}>
                    <TouchableOpacity
                      style={[styles.pickerOption, !parentId && styles.pickerOptionActive]}
                      onPress={() => {
                        setParentId(null);
                        setShowParentPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          !parentId && styles.pickerOptionTextActive,
                        ]}
                      >
                        None (Top-level category)
                      </Text>
                    </TouchableOpacity>
                    {parentCategories
                      .filter((c) => c.id !== editingCategory?.id)
                      .map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.pickerOption,
                            parentId === category.id && styles.pickerOptionActive,
                          ]}
                          onPress={() => {
                            setParentId(category.id);
                            setShowParentPicker(false);
                          }}
                        >
                          <View style={styles.pickerWithColor}>
                            <View
                              style={[styles.smallColorDot, { backgroundColor: category.color }]}
                            />
                            <Text
                              style={[
                                styles.pickerOptionText,
                                parentId === category.id && styles.pickerOptionTextActive,
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
                    {editingCategory ? 'Save Changes' : 'Create Category'}
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
    paddingBottom: spacing[20],
    flexGrow: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing[1],
    margin: spacing[4],
    borderRadius: borderRadius.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[2.5],
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.primary[600],
  },
  tabText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  categoryGroup: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: borderRadius.sm,
    marginRight: spacing[3],
  },
  categoryName: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  childCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
  },
  childrenContainer: {
    marginLeft: spacing[8],
    marginTop: spacing[1],
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginTop: spacing[1],
    borderLeftWidth: 2,
    borderLeftColor: colors.gray[200],
  },
  childColor: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.sm,
    marginRight: spacing[3],
  },
  childName: {
    fontSize: fontSize.sm,
    color: colors.text,
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
  typeSelector: {
    flexDirection: 'row',
    gap: spacing[2],
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
  typeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[600],
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  colorButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    marginRight: spacing[3],
  },
  colorText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
    padding: spacing[2],
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: colors.white,
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
  pickerWithColor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallColorDot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    marginRight: spacing[2],
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
    maxHeight: 200,
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
