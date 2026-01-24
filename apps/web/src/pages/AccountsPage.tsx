import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { AccountType } from '@mybudget/shared';

interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: string;
  isActive: boolean;
  createdAt: string;
}

interface AccountFormData {
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: string;
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: AccountType.BANK, label: 'Bank Account' },
  { value: AccountType.CASH, label: 'Cash' },
  { value: AccountType.CARD, label: 'Credit Card' },
  { value: AccountType.SAVINGS, label: 'Savings' },
];

export function AccountsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const queryClient = useQueryClient();

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.accounts.list() as Promise<Account[]>,
  });

  const createMutation = useMutation({
    mutationFn: (data: AccountFormData) => api.accounts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AccountFormData> }) =>
      api.accounts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsModalOpen(false);
      setEditingAccount(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.accounts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const handleCreate = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data: AccountFormData) => {
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <button onClick={handleCreate} className="btn-primary">
            Add Account
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="card bg-red-50 text-red-700">
            Failed to load accounts. Please try again.
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <div key={account.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.name}</h3>
                    <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 mt-1">
                      {ACCOUNT_TYPES.find((t) => t.value === account.type)?.label ||
                        account.type}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
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
                <div className="text-2xl font-semibold text-gray-900">
                  {account.currency} {parseFloat(account.openingBalance).toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {account.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No accounts yet. Add your first account to get started!</p>
            <button onClick={handleCreate} className="btn-primary">
              Add Account
            </button>
          </div>
        )}
      </div>

      {/* Account Modal */}
      {isModalOpen && (
        <AccountModal
          account={editingAccount}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAccount(null);
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

interface AccountModalProps {
  account: Account | null;
  onClose: () => void;
  onSubmit: (data: AccountFormData) => void;
  isLoading: boolean;
  error: string | null;
}

function AccountModal({ account, onClose, onSubmit, isLoading, error }: AccountModalProps) {
  const [formData, setFormData] = useState<AccountFormData>({
    name: account?.name || '',
    type: account?.type || AccountType.BANK,
    currency: account?.currency || 'USD',
    openingBalance: account?.openingBalance || '0',
  });

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
            {account ? 'Edit Account' : 'Add Account'}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="label">Account Name</label>
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
              <label htmlFor="type" className="label">Account Type</label>
              <select
                id="type"
                required
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                disabled={isLoading}
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="currency" className="label">Currency</label>
              <input
                id="currency"
                type="text"
                required
                maxLength={3}
                className="input uppercase"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="openingBalance" className="label">Opening Balance</label>
              <input
                id="openingBalance"
                type="number"
                step="0.01"
                required
                className="input"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
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
                {isLoading ? 'Saving...' : account ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
