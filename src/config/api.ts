// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://communityexpress-api.onrender.com',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
      JOIN_COMMUNITY: '/auth/join-community',
    },
    VENDORS: '/vendors',
    PRODUCTS: '/products',
    ORDERS: '/orders',
    PAYMENTS: '/payments',
  },
  TIMEOUT: 10000, // 10 seconds
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};