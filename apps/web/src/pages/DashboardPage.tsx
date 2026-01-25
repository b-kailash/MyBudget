import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { SpendingChart } from '@/components/SpendingChart';
import { api } from '@/lib/api';
import { TransactionType } from '@mybudget/shared';

/**
 * Format currency value with appropriate symbol
 */
function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IE', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get month name from month number
 */
function getMonthName(month: number): string {
  return new Date(2024, month - 1).toLocaleDateString('en-IE', { month: 'long' });
}

export function DashboardPage() {
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard.get(),
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="card bg-red-50 text-red-700">
            Failed to load dashboard data. Please try again.
          </div>
        ) : dashboard ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {formatCurrency(dashboard.summary.totalBalance)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Across {dashboard.accounts.length} account{dashboard.accounts.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500">
                  Income ({getMonthName(dashboard.summary.month)})
                </h3>
                <p className="mt-2 text-3xl font-semibold text-green-600">
                  {formatCurrency(dashboard.summary.totalIncome)}
                </p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500">
                  Expenses ({getMonthName(dashboard.summary.month)})
                </h3>
                <p className="mt-2 text-3xl font-semibold text-red-600">
                  {formatCurrency(dashboard.summary.totalExpenses)}
                </p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500">Net Savings</h3>
                <p
                  className={`mt-2 text-3xl font-semibold ${
                    dashboard.summary.netSavings >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(dashboard.summary.netSavings)}
                </p>
                {dashboard.summary.totalIncome > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {Math.round((dashboard.summary.netSavings / dashboard.summary.totalIncome) * 100)}% savings rate
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/transactions" className="card hover:bg-gray-50 text-center py-8 transition-colors">
                  <svg
                    className="w-8 h-8 mx-auto text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Add Transaction
                  </span>
                </Link>
                <Link to="/accounts" className="card hover:bg-gray-50 text-center py-8 transition-colors">
                  <svg
                    className="w-8 h-8 mx-auto text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Manage Accounts
                  </span>
                </Link>
                <Link to="/categories" className="card hover:bg-gray-50 text-center py-8 transition-colors">
                  <svg
                    className="w-8 h-8 mx-auto text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Categories
                  </span>
                </Link>
                <Link to="/budgets" className="card hover:bg-gray-50 text-center py-8 transition-colors">
                  <svg
                    className="w-8 h-8 mx-auto text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Budgets
                  </span>
                </Link>
              </div>
            </div>

            {/* Spending by Category Chart */}
            {dashboard.topCategories.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Spending by Category
                </h2>
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Donut Chart */}
                  <div className="card">
                    <SpendingChart
                      data={dashboard.topCategories}
                      totalExpenses={dashboard.summary.totalExpenses}
                    />
                  </div>
                  {/* Category Breakdown List */}
                  <div className="card">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Category Breakdown</h3>
                    <div className="space-y-4">
                      {dashboard.topCategories.map((category) => {
                        const percentage =
                          dashboard.summary.totalExpenses > 0
                            ? (category.amount / dashboard.summary.totalExpenses) * 100
                            : 0;
                        return (
                          <div key={category.categoryId}>
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.categoryColor }}
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  {category.categoryName}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(category.amount)}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: category.categoryColor,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Transactions
                </h2>
                <Link to="/transactions" className="text-sm link">
                  View all
                </Link>
              </div>
              {dashboard.recentTransactions.length > 0 ? (
                <div className="card divide-y divide-gray-100">
                  {dashboard.recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tx.category?.color || '#888888' }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{tx.payee}</p>
                          <p className="text-xs text-gray-500">
                            {tx.category?.name || 'Uncategorized'} • {tx.account.name} • {formatDate(tx.date)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-semibold ${
                          tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.type === TransactionType.INCOME ? '+' : '-'}
                        {formatCurrency(Number(tx.amount), tx.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card">
                  <p className="text-gray-500 text-center py-8">
                    No transactions yet. Add your first transaction to get started!
                  </p>
                </div>
              )}
            </div>

            {/* Account Balances */}
            {dashboard.accounts.length > 0 && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Account Balances
                  </h2>
                  <Link to="/accounts" className="text-sm link">
                    Manage
                  </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dashboard.accounts.map((account) => (
                    <div key={account.id} className="card">
                      <h3 className="font-medium text-gray-900">{account.name}</h3>
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 mt-1">
                        {account.type}
                      </span>
                      <p className="mt-2 text-2xl font-semibold text-gray-900">
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </Layout>
  );
}
