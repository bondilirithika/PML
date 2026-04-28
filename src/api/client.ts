import axios from 'axios';
import toast from 'react-hot-toast';

// All API calls go through this instance.
// The Vite proxy forwards /api/* → http://localhost:8081/api/*
// so no CORS issues in development.
const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Response interceptor ─────────────────────────────────────────────────────
// Unwraps the ApiResponse<T> wrapper so callers get .data directly.
// Also handles errors globally — no try/catch in every component.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    // Don't toast on 404 — components handle empty states themselves
    if (error.response?.status !== 404) {
      toast.error(message, { duration: 4000 });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
