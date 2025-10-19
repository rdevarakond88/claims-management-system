import apiClient from '../api/client';

// Admin API
export const adminAPI = {
  // List all users with optional filters
  listUsers: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/admin/users${queryParams ? `?${queryParams}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  // Create new user with temporary password
  createUser: async (userData) => {
    const response = await apiClient.post('/admin/users', userData);
    return response.data;
  }
};

// Auth API
export const authAPI = {
  // Set new password on first login
  setPassword: async (passwordData) => {
    const response = await apiClient.post('/auth/set-password', passwordData);
    return response.data;
  },

  // Login
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};

// Provider/Payer API (for organization dropdowns)
export const organizationAPI = {
  // Get all providers
  getProviders: async () => {
    const response = await apiClient.get('/providers');
    return response.data;
  },

  // Get all payers
  getPayers: async () => {
    const response = await apiClient.get('/payers');
    return response.data;
  }
};
