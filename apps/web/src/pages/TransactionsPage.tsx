import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { TransactionType } from '@mybudget/shared';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  currency: string;
  date: string;
  payee: string;
  notes: string;
  accountId: string;
  categoryId: string;
  account?: { name: string };
  category?: { name: string; color: string };
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

interface TransactionFormData {
  type: TransactionType;
  amount: string;
  currency: string;
  date: string;
  payee: string;
  notes: string;
  accountId: string;
  categoryId: string;
}

const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: TransactionType.EXPENSE, label: 'Expense' },
  { value: TransactionType.INCOME, label: 'Income' },
  { value: TransactionType.TRANSFER, label: 'Transfer' },
];

export function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    accountId: '',
    categoryId: '',
  });
  const queryClient = useQueryClient();

  const { data: transactionsData, isLoading, error } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (filters.startDate) params['startDate'] = filters.startDate;
      if (filters.endDate) params['endDate'] = filters.endDate;
      if (filters.accountId) params['accountId'] = filters.accountId;
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
      return api.transactions.list(params);
    },
  });

  const transactions = transactionsData?.items as Transaction[] | undefined;

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.accounts.list() as Promise<Account[]>,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list() as Promise<Category[]>,
  });

  const createMutation = useMutation({
    mutationFn: (data: TransactionFormData) => api.transactions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionFormData> }) =>
      api.transactions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsModalOpen(false);
      setEditingTransaction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.transactions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleCreate = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data: TransactionFormData) => {
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
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
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <button onClick={handleCreate} className="btn-primary">
            Add Transaction
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">From Date</label>
              <input
                type="date"
                className="input"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">To Date</label>
              <input
                type="date"
                className="input"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Account</label>
              <select
                className="input"
                value={filters.accountId}
                onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
              >
                <option value="">All Accounts</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              >
                <option value="">All Categories</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="card bg-red-50 text-red-700">
            Failed to load transactions. Please try again.
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="card overflow-hidden p-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.payee}
                      </div>
                      {transaction.notes && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {transaction.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: transaction.category?.color + '20',
                          color: transaction.category?.color,
                        }}
                      >
                        {transaction.category?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.account?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span
                        className={`font-medium ${
                          transaction.type === 'INCOME'
                            ? 'text-green-600'
                            : transaction.type === 'EXPENSE'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {transaction.type === 'EXPENSE' ? '-' : '+'}
                        {transaction.currency} {parseFloat(transaction.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-gray-400 hover:text-gray-600 mr-2"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete"
                        disabled={deleteMutation.isPending}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No transactions yet. Add your first transaction to start tracking!</p>
            <button onClick={handleCreate} className="btn-primary">
              Add Transaction
            </button>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {isModalOpen && (
        <TransactionModal
          transaction={editingTransaction}
          accounts={accounts || []}
          categories={categories || []}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
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

interface TransactionModalProps {
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
  isLoading: boolean;
  error: string | null;
}

function TransactionModal({
  transaction,
  accounts,
  categories,
  onClose,
  onSubmit,
  isLoading,
  error,
}: TransactionModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const defaultAccount = accounts[0];

  const [formData, setFormData] = useState<TransactionFormData>({
    type: transaction?.type || TransactionType.EXPENSE,
    amount: transaction?.amount || '',
    currency: transaction?.currency || defaultAccount?.currency || 'USD',
    date: transaction?.date?.split('T')[0] || today || '',
    payee: transaction?.payee || '',
    notes: transaction?.notes || '',
    accountId: transaction?.accountId || defaultAccount?.id || '',
    categoryId: transaction?.categoryId || '',
  });

  // Filter categories by type
  const filteredCategories = categories.filter((c) => c.type === formData.type);

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    setFormData({
      ...formData,
      accountId,
      currency: account?.currency || formData.currency,
    });
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
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Type</label>
              <div className="flex gap-2">
                {TRANSACTION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      formData.type === type.value
                        ? type.value === 'INCOME'
                          ? 'bg-green-100 text-green-700 border-2 border-green-500'
                          : type.value === 'EXPENSE'
                          ? 'bg-red-100 text-red-700 border-2 border-red-500'
                          : 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                    }`}
                    onClick={() => setFormData({ ...formData, type: type.value, categoryId: '' })}
                    disabled={isLoading}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="label">Amount</label>
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
              <div>
                <label htmlFor="date" className="label">Date</label>
                <input
                  id="date"
                  type="date"
                  required
                  className="input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="payee" className="label">Payee</label>
              <input
                id="payee"
                type="text"
                required
                className="input"
                value={formData.payee}
                onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="accountId" className="label">Account</label>
              <select
                id="accountId"
                required
                className="input"
                value={formData.accountId}
                onChange={(e) => handleAccountChange(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>
            </div>

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
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="label">Notes (optional)</label>
              <textarea
                id="notes"
                rows={2}
                className="input"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isLoading}
              />
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
                {isLoading ? 'Saving...' : transaction ? 'Save Changes' : 'Create Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
