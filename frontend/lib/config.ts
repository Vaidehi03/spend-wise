export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  nextAuthUrl: process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'http://localhost:3000',
  nextAuthSecret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
} as const;

export const apiEndpoints = {
  auth: {
    register: `${config.apiUrl}/api/users/register`,
    login: `${config.apiUrl}/api/users/token`,
    me: `${config.apiUrl}/api/users/me`,
  },
  transactions: {
    upload: `${config.apiUrl}/api/transactions/upload`,
    list: `${config.apiUrl}/api/transactions/`,
    get: (id: number) => `${config.apiUrl}/api/transactions/${id}`,
    update: (id: number) => `${config.apiUrl}/api/transactions/${id}`,
    delete: (id: number) => `${config.apiUrl}/api/transactions/${id}`,
  },
  categories: {
    list: `${config.apiUrl}/api/categories/`,
    create: `${config.apiUrl}/api/categories/`,
    get: (id: number) => `${config.apiUrl}/api/categories/${id}`,
    update: (id: number) => `${config.apiUrl}/api/categories/${id}`,
    delete: (id: number) => `${config.apiUrl}/api/categories/${id}`,
    addKeyword: (id: number) => `${config.apiUrl}/api/categories/${id}/keywords`,
    deleteKeyword: (categoryId: number, keywordId: number) => 
      `${config.apiUrl}/api/categories/${categoryId}/keywords/${keywordId}`,
  },
  reports: {
    summary: `${config.apiUrl}/api/reports/summary`,
    monthly: `${config.apiUrl}/api/reports/monthly`,
    categoryComparison: `${config.apiUrl}/api/reports/category-comparison`,
  },
} as const; 