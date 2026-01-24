import { useAuth } from '@/contexts/AuthContext';

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-primary-600">MyBudget</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name}
              </span>
              <button onClick={logout} className="btn-outline text-sm">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Summary Cards */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">$0.00</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Income (This Month)</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">$0.00</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Expenses (This Month)</h3>
            <p className="mt-2 text-3xl font-semibold text-red-600">$0.00</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Net Savings</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">$0.00</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="card hover:bg-gray-50 text-center py-8 transition-colors">
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
            </button>
            <button className="card hover:bg-gray-50 text-center py-8 transition-colors">
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
            </button>
            <button className="card hover:bg-gray-50 text-center py-8 transition-colors">
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
            </button>
            <button className="card hover:bg-gray-50 text-center py-8 transition-colors">
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
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Transactions
          </h2>
          <div className="card">
            <p className="text-gray-500 text-center py-8">
              No transactions yet. Add your first transaction to get started!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
