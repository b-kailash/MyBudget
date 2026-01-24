import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { CategoryType } from '@mybudget/shared';

interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  color: string;
  icon: string;
  createdAt: string;
}

interface CategoryFormData {
  name: string;
  type: CategoryType;
  parentId: string | null;
  color: string;
  icon: string;
}

const CATEGORY_TYPES: { value: CategoryType; label: string }[] = [
  { value: CategoryType.EXPENSE, label: 'Expense' },
  { value: CategoryType.INCOME, label: 'Income' },
  { value: CategoryType.TRANSFER, label: 'Transfer' },
];

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E',
];

const ICONS = ['shopping-cart', 'home', 'car', 'utensils', 'heart', 'briefcase', 'gift', 'plane', 'music', 'gamepad'];

export function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list() as Promise<Category[]>,
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => api.categories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      api.categories.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
      setEditingCategory(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // Group categories by type
  const groupedCategories = categories?.reduce(
    (acc, category) => {
      const type = category.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(category);
      return acc;
    },
    {} as Record<CategoryType, Category[]>
  );

  const handleCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <button onClick={handleCreate} className="btn-primary">
            Add Category
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="card bg-red-50 text-red-700">
            Failed to load categories. Please try again.
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="space-y-8">
            {CATEGORY_TYPES.map((type) => {
              const typeCats = groupedCategories?.[type.value] || [];
              if (typeCats.length === 0) return null;

              // Separate parent and child categories
              const parentCats = typeCats.filter(c => !c.parentId);
              const childCats = typeCats.filter(c => c.parentId);

              return (
                <div key={type.value}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span
                      className={`w-3 h-3 rounded-full mr-2 ${
                        type.value === 'INCOME'
                          ? 'bg-green-500'
                          : type.value === 'EXPENSE'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                    ></span>
                    {type.label} Categories
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {parentCats.map((category) => (
                      <div key={category.id}>
                        <CategoryCard
                          category={category}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          isDeleting={deleteMutation.isPending}
                        />
                        {/* Show child categories */}
                        {childCats
                          .filter(c => c.parentId === category.id)
                          .map(child => (
                            <div key={child.id} className="ml-6 mt-2">
                              <CategoryCard
                                category={child}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                isDeleting={deleteMutation.isPending}
                                isChild
                              />
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No categories yet. Add your first category to get started!</p>
            <button onClick={handleCreate} className="btn-primary">
              Add Category
            </button>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <CategoryModal
          category={editingCategory}
          categories={categories || []}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
          error={
            (createMutation.error instanceof ApiError && createMutation.error.message) ||
            (updateMutation.error instanceof ApiError && updateMutation.error.message) ||
            null
          }
        />
      )}
    </Layout>
  );
}

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  isChild?: boolean;
}

function CategoryCard({ category, onEdit, onDelete, isDeleting, isChild }: CategoryCardProps) {
  return (
    <div className={`card ${isChild ? 'bg-gray-50' : ''} py-3 px-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
            style={{ backgroundColor: category.color }}
          >
            {category.icon.charAt(0).toUpperCase()}
          </div>
          <span className={`font-medium ${isChild ? 'text-sm' : ''}`}>
            {category.name}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(category)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="Delete"
            disabled={isDeleting}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface CategoryModalProps {
  category: Category | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => void;
  isLoading: boolean;
  error: string | null;
}

function CategoryModal({ category, categories, onClose, onSubmit, isLoading, error }: CategoryModalProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    type: category?.type || CategoryType.EXPENSE,
    parentId: category?.parentId || null,
    color: category?.color || COLORS[0] || '#3B82F6',
    icon: category?.icon || ICONS[0] || 'shopping-cart',
  });

  // Filter parent categories (only show categories of same type that are not the current one)
  const parentOptions = categories.filter(
    (c) => c.type === formData.type && !c.parentId && c.id !== category?.id
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="label">Category Name</label>
              <input
                id="name"
                type="text"
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="type" className="label">Type</label>
              <select
                id="type"
                required
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CategoryType, parentId: null })}
                disabled={isLoading}
              >
                {CATEGORY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="parentId" className="label">Parent Category (optional)</label>
              <select
                id="parentId"
                className="input"
                value={formData.parentId || ''}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                disabled={isLoading}
              >
                <option value="">None (Top-level category)</option>
                {parentOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="icon" className="label">Icon</label>
              <select
                id="icon"
                required
                className="input"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                disabled={isLoading}
              >
                {ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : category ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
