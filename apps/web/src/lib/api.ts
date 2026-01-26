import type { ApiResponse, LoginResponse, RefreshResponse } from '@mybudget/shared';

const API_BASE_URL = '/api/v1';

/**
 * Storage keys for auth tokens
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'mybudget_access_token',
  REFRESH_TOKEN: 'mybudget_refresh_token',
} as const;

/**
 * Get stored tokens
 */
export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
    refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  };
}

/**
 * Store tokens
 */
export function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
}

/**
 * Clear stored tokens
 */
export function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Custom error class for API errors
 */
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

/**
 * Attempt to refresh the access token
 */
async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const result: ApiResponse<RefreshResponse> = await response.json();
    if (result.data) {
      storeTokens(result.data.accessToken, result.data.refreshToken);
      return result.data.accessToken;
    }
    return null;
  } catch {
    clearTokens();
    return null;
  }
}

/**
 * Make an API request
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const { accessToken } = getStoredTokens();

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

  // Handle 401 with token refresh
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

/**
 * API methods
 */
export const api = {
  // Auth
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

    forgotPassword: (email: string) =>
      request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token: string, password: string) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),

    acceptInvite: (data: { token: string; name: string; password: string }) =>
      request<LoginResponse>('/auth/accept-invite', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Accounts
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

  // Categories
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

  // Transactions
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

  // Budgets
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

  // Dashboard & Reports
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

  // Import
  import: {
    upload: async (file: File) => {
      const { accessToken } = getStoredTokens();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/import/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result: ApiResponse<{
        importId: string;
        filename: string;
        totalRows: number;
        preview: Array<Record<string, string>>;
        suggestedMapping: Record<string, string>;
        headers: string[];
      }> = await response.json();

      if (result.error) {
        throw new ApiError(result.error.code, result.error.message, response.status);
      }

      return result.data!;
    },

    preview: async (
      file: File,
      importId: string,
      accountId: string,
      mapping: Record<string, string>,
      dateFormat?: string
    ) => {
      const { accessToken } = getStoredTokens();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('importId', importId);
      formData.append('accountId', accountId);
      formData.append('mapping', JSON.stringify(mapping));
      if (dateFormat) formData.append('dateFormat', dateFormat);

      const response = await fetch(`${API_BASE_URL}/import/preview`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result: ApiResponse<{
        importId: string;
        totalRows: number;
        validRows: number;
        duplicateRows: number;
        errorRows: number;
        rows: Array<{
          rowNumber: number;
          date: string | null;
          amount: number | null;
          payee: string | null;
          notes: string | null;
          isValid: boolean;
          isDuplicate: boolean;
          errors: string[];
        }>;
      }> = await response.json();

      if (result.error) {
        throw new ApiError(result.error.code, result.error.message, response.status);
      }

      return result.data!;
    },

    commit: async (
      file: File,
      accountId: string,
      mapping: Record<string, string>,
      options?: {
        dateFormat?: string;
        negativeIsExpense?: boolean;
        skipDuplicates?: boolean;
        defaultCategoryId?: string;
      }
    ) => {
      const { accessToken } = getStoredTokens();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('accountId', accountId);
      formData.append('mapping', JSON.stringify(mapping));
      if (options?.dateFormat) formData.append('dateFormat', options.dateFormat);
      if (options?.negativeIsExpense !== undefined)
        formData.append('negativeIsExpense', String(options.negativeIsExpense));
      if (options?.skipDuplicates !== undefined)
        formData.append('skipDuplicates', String(options.skipDuplicates));
      if (options?.defaultCategoryId) formData.append('defaultCategoryId', options.defaultCategoryId);

      const response = await fetch(`${API_BASE_URL}/import/commit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result: ApiResponse<{
        importId: string;
        importedCount: number;
        skippedCount: number;
        errorCount: number;
        message: string;
      }> = await response.json();

      if (result.error) {
        throw new ApiError(result.error.code, result.error.message, response.status);
      }

      return result.data!;
    },

    history: () =>
      request<
        Array<{
          id: string;
          filename: string;
          fileType: string;
          status: string;
          totalRows: number;
          importedCount: number;
          skippedCount: number;
          errorCount: number;
          createdAt: string;
          completedAt: string | null;
        }>
      >('/import/history'),
  },

  // Family
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
    invite: (data: { email: string; role: 'MEMBER' | 'VIEWER' }) =>
      request<unknown>('/family/invite', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    invitations: () => request<unknown[]>('/family/invitations'),
    revokeInvitation: (id: string) =>
      request<{ message: string }>(`/family/invitations/${id}`, {
        method: 'DELETE',
      }),
    updateMemberRole: (id: string, role: string) =>
      request<unknown>(`/family/members/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
    updateMemberStatus: (id: string, status: string) =>
      request<unknown>(`/family/members/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    removeMember: (id: string) =>
      request<{ message: string }>(`/family/members/${id}`, {
        method: 'DELETE',
      }),
  },
};
