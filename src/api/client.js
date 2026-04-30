import axios from 'axios';
import toast from 'react-hot-toast';

const TOKEN_KEY = 'pml_auth_token';
const USER_KEY  = 'pml_auth_user';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';

    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (status === 403) {
      toast.error('You do not have permission to perform this action', { duration: 4000 });
      return Promise.reject(error);
    }

    // Don't toast on 404 — components handle empty states themselves
    if (status !== 404) {
      toast.error(message, { duration: 4000 });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
