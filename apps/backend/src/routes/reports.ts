import { Router, Request, Response } from 'express';
import { ApiResponse, TransactionType } from '@mybudget/shared';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * Helper to get date range for a given month
 */
function getMonthDateRange(year: number, month: number): { startDate: Date; endDate: Date } {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

/**
 * GET /api/v1/reports/monthly-summary
 * Get income vs expenses summary for a specific month
 * Query params:
 * - year: Year (default: current year)
 * - month: Month 1-12 (default: current month)
 */
router.get(
  '/monthly-summary',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const now = new Date();
      const year = parseInt(req.query.year as string, 10) || now.getFullYear();
      const month = parseInt(req.query.month as string, 10) || now.getMonth() + 1;

      // Validate month
      if (month < 1 || month > 12) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Month must be between 1 and 12',
          },
        };
        res.status(400).json(response);
        return;
      }

      const { startDate, endDate } = getMonthDateRange(year, month);

      // Get income total
      const incomeResult = await prisma.transaction.aggregate({
        where: {
          familyId,
          isDeleted: false,
          type: TransactionType.INCOME,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      });

      // Get expense total
      const expenseResult = await prisma.transaction.aggregate({
        where: {
          familyId,
          isDeleted: false,
          type: TransactionType.EXPENSE,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      });

      const totalIncome = incomeResult._sum.amount?.toNumber() ?? 0;
      const totalExpenses = expenseResult._sum.amount?.toNumber() ?? 0;
      const netSavings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

      const response: ApiResponse<{
        year: number;
        month: number;
        totalIncome: number;
        totalExpenses: number;
        netSavings: number;
        savingsRate: number;
        incomeTransactionCount: number;
        expenseTransactionCount: number;
      }> = {
        data: {
          year,
          month,
          totalIncome,
          totalExpenses,
          netSavings,
          savingsRate: Math.round(savingsRate * 100) / 100,
          incomeTransactionCount: incomeResult._count,
          expenseTransactionCount: expenseResult._count,
        },
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Monthly summary error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve monthly summary',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/v1/reports/category-breakdown
 * Get spending breakdown by category
 * Query params:
 * - year: Year (default: current year)
 * - month: Month 1-12 (default: current month)
 * - type: Transaction type - 'income' or 'expense' (default: expense)
 */
router.get(
  '/category-breakdown',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const now = new Date();
      const year = parseInt(req.query.year as string, 10) || now.getFullYear();
      const month = parseInt(req.query.month as string, 10) || now.getMonth() + 1;
      const typeParam = (req.query.type as string)?.toUpperCase() || 'EXPENSE';

      // Validate month
      if (month < 1 || month > 12) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Month must be between 1 and 12',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Validate type
      if (typeParam !== 'INCOME' && typeParam !== 'EXPENSE') {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Type must be either income or expense',
          },
        };
        res.status(400).json(response);
        return;
      }

      const { startDate, endDate } = getMonthDateRange(year, month);

      // Group transactions by category
      const categoryBreakdown = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          familyId,
          isDeleted: false,
          type: typeParam as TransactionType,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      });

      // Get category details
      const categoryIds = categoryBreakdown.map((item) => item.categoryId);
      const categories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
        },
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
        },
      });

      const categoryMap = new Map(categories.map((c) => [c.id, c]));

      // Calculate total for percentages
      const total = categoryBreakdown.reduce(
        (sum, item) => sum + (item._sum.amount?.toNumber() ?? 0),
        0
      );

      // Build breakdown with percentages
      const breakdown = categoryBreakdown
        .map((item) => {
          const category = categoryMap.get(item.categoryId);
          const amount = item._sum.amount?.toNumber() ?? 0;
          return {
            categoryId: item.categoryId,
            categoryName: category?.name ?? 'Unknown',
            categoryColor: category?.color ?? '#888888',
            categoryIcon: category?.icon ?? null,
            amount,
            percentage: total > 0 ? Math.round((amount / total) * 10000) / 100 : 0,
            transactionCount: item._count,
          };
        })
        .sort((a, b) => b.amount - a.amount);

      const response: ApiResponse<{
        year: number;
        month: number;
        type: string;
        total: number;
        breakdown: typeof breakdown;
      }> = {
        data: {
          year,
          month,
          type: typeParam.toLowerCase(),
          total,
          breakdown,
        },
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Category breakdown error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve category breakdown',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/v1/reports/trend
 * Get month-over-month trend data
 * Query params:
 * - months: Number of months to include (default: 6, max: 24)
 */
router.get(
  '/trend',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const monthsCount = Math.min(
        24,
        Math.max(1, parseInt(req.query.months as string, 10) || 6)
      );

      const now = new Date();
      const trends: Array<{
        year: number;
        month: number;
        income: number;
        expenses: number;
        netSavings: number;
      }> = [];

      // Calculate data for each month
      for (let i = monthsCount - 1; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        const { startDate, endDate } = getMonthDateRange(year, month);

        const [incomeResult, expenseResult] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              familyId,
              isDeleted: false,
              type: TransactionType.INCOME,
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            _sum: {
              amount: true,
            },
          }),
          prisma.transaction.aggregate({
            where: {
              familyId,
              isDeleted: false,
              type: TransactionType.EXPENSE,
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            _sum: {
              amount: true,
            },
          }),
        ]);

        const income = incomeResult._sum.amount?.toNumber() ?? 0;
        const expenses = expenseResult._sum.amount?.toNumber() ?? 0;

        trends.push({
          year,
          month,
          income,
          expenses,
          netSavings: income - expenses,
        });
      }

      // Calculate averages
      const avgIncome =
        trends.reduce((sum, t) => sum + t.income, 0) / trends.length;
      const avgExpenses =
        trends.reduce((sum, t) => sum + t.expenses, 0) / trends.length;

      const response: ApiResponse<{
        months: typeof trends;
        averages: {
          income: number;
          expenses: number;
          netSavings: number;
        };
      }> = {
        data: {
          months: trends,
          averages: {
            income: Math.round(avgIncome * 100) / 100,
            expenses: Math.round(avgExpenses * 100) / 100,
            netSavings: Math.round((avgIncome - avgExpenses) * 100) / 100,
          },
        },
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Trend error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve trend data',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/v1/dashboard
 * Get aggregated data for dashboard widgets
 * Returns current month summary, recent transactions, and top spending categories
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const { startDate, endDate } = getMonthDateRange(year, month);

      // Run all queries in parallel
      const [
        incomeResult,
        expenseResult,
        recentTransactions,
        topCategories,
        accountBalances,
      ] = await Promise.all([
        // Income total
        prisma.transaction.aggregate({
          where: {
            familyId,
            isDeleted: false,
            type: TransactionType.INCOME,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        // Expense total
        prisma.transaction.aggregate({
          where: {
            familyId,
            isDeleted: false,
            type: TransactionType.EXPENSE,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        // Recent transactions
        prisma.transaction.findMany({
          where: {
            familyId,
            isDeleted: false,
          },
          include: {
            account: {
              select: {
                id: true,
                name: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                color: true,
                icon: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take: 5,
        }),
        // Top spending categories this month
        prisma.transaction.groupBy({
          by: ['categoryId'],
          where: {
            familyId,
            isDeleted: false,
            type: TransactionType.EXPENSE,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            amount: true,
          },
          orderBy: {
            _sum: {
              amount: 'desc',
            },
          },
          take: 5,
        }),
        // Account data
        prisma.account.findMany({
          where: {
            familyId,
            isDeleted: false,
          },
          select: {
            id: true,
            name: true,
            type: true,
            openingBalance: true,
            currency: true,
          },
          orderBy: {
            openingBalance: 'desc',
          },
        }),
      ]);

      // Get category details for top spending
      const categoryIds = topCategories.map((item) => item.categoryId);
      const categories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
        },
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
        },
      });

      const categoryMap = new Map(categories.map((c) => [c.id, c]));

      const totalIncome = incomeResult._sum.amount?.toNumber() ?? 0;
      const totalExpenses = expenseResult._sum.amount?.toNumber() ?? 0;
      const netSavings = totalIncome - totalExpenses;

      // Calculate current balance for each account (openingBalance + income - expenses)
      const accountIds = accountBalances.map((acc) => acc.id);
      const accountTransactionSums = await prisma.transaction.groupBy({
        by: ['accountId', 'type'],
        where: {
          accountId: { in: accountIds },
          isDeleted: false,
        },
        _sum: {
          amount: true,
        },
      });

      // Build a map of account balances
      const accountBalanceMap = new Map<string, number>();
      for (const acc of accountBalances) {
        accountBalanceMap.set(acc.id, acc.openingBalance?.toNumber() ?? 0);
      }

      // Adjust for transactions
      for (const txSum of accountTransactionSums) {
        const currentBalance = accountBalanceMap.get(txSum.accountId) ?? 0;
        const amount = txSum._sum.amount?.toNumber() ?? 0;
        if (txSum.type === TransactionType.INCOME) {
          accountBalanceMap.set(txSum.accountId, currentBalance + amount);
        } else if (txSum.type === TransactionType.EXPENSE) {
          accountBalanceMap.set(txSum.accountId, currentBalance - amount);
        }
        // For transfers, the balance effect depends on direction (handled elsewhere)
      }

      // Calculate total balance across all accounts
      let totalBalance = 0;
      for (const balance of accountBalanceMap.values()) {
        totalBalance += balance;
      }

      const response: ApiResponse<{
        summary: {
          year: number;
          month: number;
          totalIncome: number;
          totalExpenses: number;
          netSavings: number;
          totalBalance: number;
        };
        recentTransactions: typeof recentTransactions;
        topCategories: Array<{
          categoryId: string;
          categoryName: string;
          categoryColor: string;
          categoryIcon: string | null;
          amount: number;
        }>;
        accounts: Array<{
          id: string;
          name: string;
          type: string;
          currency: string;
          balance: number;
        }>;
      }> = {
        data: {
          summary: {
            year,
            month,
            totalIncome,
            totalExpenses,
            netSavings,
            totalBalance,
          },
          recentTransactions,
          topCategories: topCategories.map((item) => {
            const category = categoryMap.get(item.categoryId);
            return {
              categoryId: item.categoryId,
              categoryName: category?.name ?? 'Unknown',
              categoryColor: category?.color ?? '#888888',
              categoryIcon: category?.icon ?? null,
              amount: item._sum.amount?.toNumber() ?? 0,
            };
          }),
          accounts: accountBalances.map((acc) => ({
            id: acc.id,
            name: acc.name,
            type: acc.type,
            currency: acc.currency,
            balance: accountBalanceMap.get(acc.id) ?? 0,
          })),
        },
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Dashboard error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve dashboard data',
        },
      };
      res.status(500).json(response);
    }
  }
);

export default router;
