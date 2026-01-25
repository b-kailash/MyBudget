import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CategoryData {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
}

interface SpendingChartProps {
  data: CategoryData[];
  totalExpenses: number;
  currency?: string;
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

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

export function SpendingChart({ data, totalExpenses, currency = 'EUR' }: SpendingChartProps) {
  const chartData: ChartDataItem[] = data.map((item) => ({
    name: item.categoryName,
    value: item.amount,
    color: item.categoryColor,
    percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0,
  }));

  // Custom tooltip - using explicit any to work around recharts typing issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function CustomTooltip({ active, payload }: any) {
    if (active && payload && payload.length > 0) {
      const chartItem = payload[0].payload as ChartDataItem;
      return (
        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200">
          <p className="font-medium text-gray-900">{chartItem.name}</p>
          <p className="text-sm text-gray-600">{formatCurrency(chartItem.value, currency)}</p>
          <p className="text-xs text-gray-500">{chartItem.percentage.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No spending data available
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={500}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ paddingTop: '16px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center -mt-4">
        <p className="text-sm text-gray-500">Total Spending</p>
        <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalExpenses, currency)}</p>
      </div>
    </div>
  );
}
