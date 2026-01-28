import type { ApiResponse, LoginResponse, RefreshResponse } from '@mybudget/shared';
import { getStoredTokens, storeTokens, clearTokens, getAccessToken } from './storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = await getStoredTokens();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await clearTokens();
      return null;
    }

    const result: ApiResponse<RefreshResponse> = await response.json();
    if (result.data) {
      await storeTokens(result.data.accessToken, result.data.refreshToken);
      return result.data.accessToken;
    }
    return null;
  } catch {
    await clearTokens();
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const accessToken = await getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(endpoint, options, false);
    }
  }

  const result: ApiResponse<T> = await response.json();

  if (result.error) {
    throw new ApiError(result.error.code, result.error.message, response.status);
  }

  return result.data as T;
}

export const api = {
  auth: {
    register: (data: {
      email: string;
      password: string;
      name: string;
      familyName: string;
    }) =>
      request<LoginResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: (refreshToken: string) =>
      request<{ message: string }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),

    me: () =>
      request<{
        id: string;
        email: string;
        name: string;
        familyId: string;
        role: string;
        status: string;
      }>('/auth/me'),
  },

  accounts: {
    list: () => request<unknown[]>('/accounts'),
    get: (id: string) => request<unknown>(`/accounts/${id}`),
    create: (data: unknown) =>
      request<unknown>('/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request<unknown>(`/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/accounts/${id}`, {
        method: 'DELETE',
      }),
  },

  categories: {
    list: () => request<unknown[]>('/categories'),
    get: (id: string) => request<unknown>(`/categories/${id}`),
    create: (data: unknown) =>
      request<unknown>('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request<unknown>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/categories/${id}`, {
        method: 'DELETE',
      }),
  },

  transactions: {
    list: (params?: Record<string, string>) => {
      const searchParams = params ? `?${new URLSearchParams(params)}` : '';
      return request<{
        items: unknown[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/transactions${searchParams}`);
    },
    get: (id: string) => request<unknown>(`/transactions/${id}`),
    create: (data: unknown) =>
      request<unknown>('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request<unknown>(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/transactions/${id}`, {
        method: 'DELETE',
      }),
  },

  budgets: {
    list: () => request<unknown[]>('/budgets'),
    create: (data: unknown) =>
      request<unknown>('/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request<unknown>(`/budgets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/budgets/${id}`, {
        method: 'DELETE',
      }),
  },

  dashboard: {
    get: () =>
      request<{
        summary: {
          year: number;
          month: number;
          totalIncome: number;
          totalExpenses: number;
          netSavings: number;
          totalBalance: number;
        };
        recentTransactions: Array<{
          id: string;
          type: string;
          amount: number;
          currency: string;
          date: string;
          payee: string;
          notes: string | null;
          account: { id: string; name: string };
          category: { id: string; name: string; color: string; icon: string | null };
        }>;
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
      }>('/dashboard'),
  },

  reports: {
    monthlySummary: (params?: { year?: number; month?: number }) => {
      const searchParams = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
      return request<{
        year: number;
        month: number;
        totalIncome: number;
        totalExpenses: number;
        netSavings: number;
        savingsRate: number;
        incomeTransactionCount: number;
        expenseTransactionCount: number;
      }>(`/reports/monthly-summary${searchParams}`);
    },

    categoryBreakdown: (params?: { year?: number; month?: number; type?: 'income' | 'expense' }) => {
      const searchParams = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
      return request<{
        year: number;
        month: number;
        type: string;
        total: number;
        breakdown: Array<{
          categoryId: string;
          categoryName: string;
          categoryColor: string;
          categoryIcon: string | null;
          amount: number;
          percentage: number;
          transactionCount: number;
        }>;
      }>(`/reports/category-breakdown${searchParams}`);
    },

    trend: (params?: { months?: number }) => {
      const searchParams = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
      return request<{
        months: Array<{
          year: number;
          month: number;
          income: number;
          expenses: number;
          netSavings: number;
        }>;
        averages: {
          income: number;
          expenses: number;
          netSavings: number;
        };
      }>(`/reports/trend${searchParams}`);
    },
  },

  family: {
    members: () =>
      request<
        {
          id: string;
          email: string;
          name: string;
          role: string;
          status: string;
        }[]
      >('/family/members'),
  },
};

export { storeTokens, clearTokens, getStoredTokens };
