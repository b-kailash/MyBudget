import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { BudgetPeriod } from '@mybudget/shared';

interface Budget {
  id: string;
  categoryId: string;
  accountId: string | null;
  periodType: BudgetPeriod;
  amount: string;
  startDate: string;
  endDate: string;
  category?: { name: string; color: string };
  account?: { name: string };
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface Account {
  id: string;
  name: string;
}

interface BudgetFormData {
  categoryId: string;
  accountId: string | null;
  periodType: BudgetPeriod;
  amount: string;
  startDate: string;
  endDate: string;
}

const PERIOD_TYPES: { value: BudgetPeriod; label: string }[] = [
  { value: BudgetPeriod.WEEKLY, label: 'Weekly' },
  { value: BudgetPeriod.MONTHLY, label: 'Monthly' },
  { value: BudgetPeriod.YEARLY, label: 'Yearly' },
];

export function BudgetsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const queryClient = useQueryClient();

  const { data: budgets, isLoading, error } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.budgets.list() as Promise<Budget[]>,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list() as Promise<Category[]>,
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.accounts.list() as Promise<Account[]>,
  });

  const createMutation = useMutation({
    mutationFn: (data: BudgetFormData) => api.budgets.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetFormData> }) =>
      api.budgets.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsModalOpen(false);
      setEditingBudget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.budgets.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  // Filter expense categories for budgets
  const expenseCategories = categories?.filter((c) => c.type === 'EXPENSE') || [];

  const handleCreate = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data: BudgetFormData) => {
    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <button onClick={handleCreate} className="btn-primary">
            Add Budget
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="card bg-red-50 text-red-700">
            Failed to load budgets. Please try again.
          </div>
        ) : budgets && budgets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => (
              <div key={budget.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: budget.category?.color || '#gray' }}
                      ></div>
                      <h3 className="font-semibold text-gray-900">
                        {budget.category?.name || 'Unknown Category'}
                      </h3>
                    </div>
                    <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                      {PERIOD_TYPES.find((p) => p.value === budget.periodType)?.label || budget.periodType}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Delete"
                      disabled={deleteMutation.isPending}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="text-2xl font-semibold text-gray-900 mb-2">
                  ${parseFloat(budget.amount).toFixed(2)}
                </div>

                {/* Progress bar placeholder - would need actual spending data */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: '0%' }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatDate(budget.startDate)}</span>
                  <span>{formatDate(budget.endDate)}</span>
                </div>

                {budget.account && (
                  <p className="text-xs text-gray-500 mt-2">
                    Account: {budget.account.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No budgets yet. Create your first budget to start tracking spending!</p>
            <button onClick={handleCreate} className="btn-primary">
              Add Budget
            </button>
          </div>
        )}
      </div>

      {/* Budget Modal */}
      {isModalOpen && (
        <BudgetModal
          budget={editingBudget}
          categories={expenseCategories}
          accounts={accounts || []}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBudget(null);
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

interface BudgetModalProps {
  budget: Budget | null;
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onSubmit: (data: BudgetFormData) => void;
  isLoading: boolean;
  error: string | null;
}

function BudgetModal({
  budget,
  categories,
  accounts,
  onClose,
  onSubmit,
  isLoading,
  error,
}: BudgetModalProps) {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [formData, setFormData] = useState<BudgetFormData>({
    categoryId: budget?.categoryId || '',
    accountId: budget?.accountId || null,
    periodType: budget?.periodType || BudgetPeriod.MONTHLY,
    amount: budget?.amount || '',
    startDate: budget?.startDate?.split('T')[0] || firstOfMonth || '',
    endDate: budget?.endDate?.split('T')[0] || lastOfMonth || '',
  });

  const handlePeriodChange = (periodType: BudgetPeriod) => {
    const now = new Date();
    let startDate = '';
    let endDate = '';

    switch (periodType) {
      case 'WEEKLY':
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        startDate = startOfWeek.toISOString().split('T')[0] || '';
        endDate = endOfWeek.toISOString().split('T')[0] || '';
        break;
      case 'MONTHLY':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0] || '';
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0] || '';
        break;
      case 'YEARLY':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0] || '';
        endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0] || '';
        break;
    }

    setFormData({ ...formData, periodType, startDate, endDate });
  };

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
            {budget ? 'Edit Budget' : 'Add Budget'}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="categoryId" className="label">Category</label>
              <select
                id="categoryId"
                required
                className="input"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                disabled={isLoading}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="periodType" className="label">Period</label>
              <select
                id="periodType"
                required
                className="input"
                value={formData.periodType}
                onChange={(e) => handlePeriodChange(e.target.value as BudgetPeriod)}
                disabled={isLoading}
              >
                {PERIOD_TYPES.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="label">Budget Amount</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                required
                className="input"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="label">Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  required
                  className="input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="label">End Date</label>
                <input
                  id="endDate"
                  type="date"
                  required
                  className="input"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="accountId" className="label">Account (optional)</label>
              <select
                id="accountId"
                className="input"
                value={formData.accountId || ''}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value || null })}
                disabled={isLoading}
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Optionally limit this budget to a specific account.
              </p>
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
                {isLoading ? 'Saving...' : budget ? 'Save Changes' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
