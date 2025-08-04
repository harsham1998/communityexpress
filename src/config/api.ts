// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://communityexpress-api.onrender.com',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
      JOIN_COMMUNITY: '/auth/join-community',
      LOGOUT: '/auth/logout',
    },
    COMMUNITIES: '/communities/',
    VENDORS: '/vendors/',
    PRODUCTS: '/products/',
    ORDERS: '/orders/',
    PAYMENTS: '/payments/',
    DASHBOARD: '/dashboard/',
    USERS: '/users/',
  },
  TIMEOUT: 60000, // 60 seconds for Render.com free tier
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};