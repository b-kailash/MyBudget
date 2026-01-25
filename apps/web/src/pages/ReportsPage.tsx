import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Layout } from '@/components/Layout';
import { SpendingChart } from '@/components/SpendingChart';
import { api } from '@/lib/api';

/**
 * Format currency value with appropriate symbol
 */
function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get month name from month number
 */
function getMonthName(month: number, short = false): string {
  return new Date(2024, month - 1).toLocaleDateString('en-IE', {
    month: short ? 'short' : 'long',
  });
}

/**
 * Generate array of years for selector
 */
function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
}

/**
 * Generate array of months for selector
 */
function getMonthOptions(): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1),
  }));
}

export function ReportsPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [trendMonths, setTrendMonths] = useState(6);

  // Fetch monthly summary
  const { data: monthlySummary, isLoading: loadingSummary } = useQuery({
    queryKey: ['reports', 'monthly-summary', selectedYear, selectedMonth],
    queryFn: () =>
      api.reports.monthlySummary({
        year: selectedYear,
        month: selectedMonth,
      }),
  });

  // Fetch category breakdown
  const { data: categoryBreakdown, isLoading: loadingBreakdown } = useQuery({
    queryKey: ['reports', 'category-breakdown', selectedYear, selectedMonth],
    queryFn: () =>
      api.reports.categoryBreakdown({
        year: selectedYear,
        month: selectedMonth,
        type: 'expense',
      }),
  });

  // Fetch trend data
  const { data: trendData, isLoading: loadingTrend } = useQuery({
    queryKey: ['reports', 'trend', trendMonths],
    queryFn: () => api.reports.trend({ months: trendMonths }),
  });

  // Prepare trend chart data
  const trendChartData =
    trendData?.months.map((m) => ({
      name: `${getMonthName(m.month, true)} ${m.year}`,
      Income: m.income,
      Expenses: m.expenses,
      'Net Savings': m.netSavings,
    })) ?? [];

  const isLoading = loadingSummary || loadingBreakdown || loadingTrend;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          {/* Date Range Filter */}
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="input w-32"
            >
              {getMonthOptions().map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input w-24"
            >
              {getYearOptions().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Monthly Summary */}
            {monthlySummary && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {getMonthName(monthlySummary.month)} {monthlySummary.year} Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card">
                    <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
                    <p className="mt-2 text-2xl font-semibold text-green-600">
                      {formatCurrency(monthlySummary.totalIncome)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {monthlySummary.incomeTransactionCount} transaction
                      {monthlySummary.incomeTransactionCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="card">
                    <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
                    <p className="mt-2 text-2xl font-semibold text-red-600">
                      {formatCurrency(monthlySummary.totalExpenses)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {monthlySummary.expenseTransactionCount} transaction
                      {monthlySummary.expenseTransactionCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="card">
                    <h3 className="text-sm font-medium text-gray-500">Net Savings</h3>
                    <p
                      className={`mt-2 text-2xl font-semibold ${
                        monthlySummary.netSavings >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(monthlySummary.netSavings)}
                    </p>
                  </div>
                  <div className="card">
                    <h3 className="text-sm font-medium text-gray-500">Savings Rate</h3>
                    <p
                      className={`mt-2 text-2xl font-semibold ${
                        monthlySummary.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {monthlySummary.savingsRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">of income saved</p>
                  </div>
                </div>
              </div>
            )}

            {/* Category Breakdown */}
            {categoryBreakdown && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Spending by Category
                </h2>
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Donut Chart */}
                  <div className="card">
                    <SpendingChart
                      data={categoryBreakdown.breakdown}
                      totalExpenses={categoryBreakdown.total}
                    />
                  </div>
                  {/* Category Table */}
                  <div className="card">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">
                      Category Details
                    </h3>
                    {categoryBreakdown.breakdown.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                %
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Txns
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {categoryBreakdown.breakdown.map((cat) => (
                              <tr key={cat.categoryId}>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: cat.categoryColor }}
                                    />
                                    <span className="text-sm text-gray-900">
                                      {cat.categoryName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                  {formatCurrency(cat.amount)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-gray-500">
                                  {cat.percentage.toFixed(1)}%
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-gray-500">
                                  {cat.transactionCount}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                Total
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                {formatCurrency(categoryBreakdown.total)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-gray-500">
                                100%
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-gray-500">
                                {categoryBreakdown.breakdown.reduce(
                                  (sum, cat) => sum + cat.transactionCount,
                                  0
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        No expenses recorded for this period
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Month-over-Month Trend */}
            {trendData && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Income vs Expenses Trend
                  </h2>
                  <select
                    value={trendMonths}
                    onChange={(e) => setTrendMonths(Number(e.target.value))}
                    className="input w-32"
                  >
                    <option value={3}>Last 3 months</option>
                    <option value={6}>Last 6 months</option>
                    <option value={12}>Last 12 months</option>
                  </select>
                </div>
                <div className="card">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value ?? 0))}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Net Savings Trend Line Chart */}
                <div className="card mt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Net Savings Trend</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value ?? 0))}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Net Savings"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Averages */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="card bg-green-50">
                    <h3 className="text-sm font-medium text-gray-500">
                      Average Monthly Income
                    </h3>
                    <p className="mt-2 text-xl font-semibold text-green-600">
                      {formatCurrency(trendData.averages.income)}
                    </p>
                  </div>
                  <div className="card bg-red-50">
                    <h3 className="text-sm font-medium text-gray-500">
                      Average Monthly Expenses
                    </h3>
                    <p className="mt-2 text-xl font-semibold text-red-600">
                      {formatCurrency(trendData.averages.expenses)}
                    </p>
                  </div>
                  <div className="card bg-blue-50">
                    <h3 className="text-sm font-medium text-gray-500">
                      Average Monthly Savings
                    </h3>
                    <p
                      className={`mt-2 text-xl font-semibold ${
                        trendData.averages.netSavings >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(trendData.averages.netSavings)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
