import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear localStorage and redirect to login
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
