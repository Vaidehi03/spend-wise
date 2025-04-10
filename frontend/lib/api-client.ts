import { apiEndpoints } from './config';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | (string | number)[]>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...restOptions } = options;
  
  // Convert params to strings and handle arrays
  const stringParams = params ? Object.entries(params).reduce((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value.join(',');
    } else {
      acc[key] = String(value);
    }
    return acc;
  }, {} as Record<string, string>) : undefined;

  // Add query parameters if provided
  const url = stringParams
    ? `${endpoint}?${new URLSearchParams(stringParams).toString()}`
    : endpoint;

  // Get the token from localStorage
  const token = localStorage.getItem('token');
  
  console.log(`API Request: ${url}`);
  console.log('Request headers:', {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...restOptions.headers,
  });

  const response = await fetch(url, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...restOptions.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    console.error(`API Error (${response.status}):`, error);
    throw new ApiError(response.status, error.message);
  }

  const data = await response.json();
  console.log(`API Response for ${url}:`, data);
  return data;
}

// Auth API functions
export const authApi = {
  register: (userData: { email: string; password: string; full_name: string }) =>
    apiClient(apiEndpoints.auth.register, {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  login: (credentials: { username: string; password: string }) =>
    apiClient<{ access_token: string; token_type: string }>(apiEndpoints.auth.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: credentials.username,
        password: credentials.password,
        grant_type: 'password',
      }).toString(),
    }),
  getMe: () => apiClient(apiEndpoints.auth.me),
};

// Transactions API functions
export const transactionsApi = {
  upload: (file: File, bankType?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (bankType) {
      formData.append('bank_type', bankType);
    }
    return apiClient(apiEndpoints.transactions.upload, {
      method: 'POST',
      body: formData,
    });
  },
  list: (params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    category_id?: number;
    is_expense?: boolean;
  }) => apiClient(apiEndpoints.transactions.list, { params }),
  get: (id: number) => apiClient(apiEndpoints.transactions.get(id)),
  update: (id: number, data: any) =>
    apiClient(apiEndpoints.transactions.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiClient(apiEndpoints.transactions.delete(id), {
      method: 'DELETE',
    }),
};

// Categories API functions
export const categoriesApi = {
  list: (params?: { type?: string; parent_id?: number }) =>
    apiClient(apiEndpoints.categories.list, { params }),
  create: (data: { name: string; description?: string; is_expense?: boolean; parent_id?: number }) =>
    apiClient(apiEndpoints.categories.create, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (id: number) => apiClient(apiEndpoints.categories.get(id)),
  update: (id: number, data: any) =>
    apiClient(apiEndpoints.categories.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiClient(apiEndpoints.categories.delete(id), {
      method: 'DELETE',
    }),
  addKeyword: (categoryId: number, keyword: string) =>
    apiClient(apiEndpoints.categories.addKeyword(categoryId), {
      method: 'POST',
      body: JSON.stringify({ keyword }),
    }),
  deleteKeyword: (categoryId: number, keywordId: number) =>
    apiClient(apiEndpoints.categories.deleteKeyword(categoryId, keywordId), {
      method: 'DELETE',
    }),
};

// Reports API functions
export const reportsApi = {
  getSummary: (params?: { start_date?: string; end_date?: string }) =>
    apiClient(apiEndpoints.reports.summary, { params }),
  getMonthly: (year: number, month?: number) =>
    apiClient(apiEndpoints.reports.monthly, {
      params: {
        year: year.toString(),
        ...(month !== undefined ? { month: month.toString() } : {}),
      },
    }),
  getCategoryComparison: (params?: {
    start_date?: string;
    end_date?: string;
    category_ids?: number[];
  }) => apiClient(apiEndpoints.reports.categoryComparison, { params }),
}; 