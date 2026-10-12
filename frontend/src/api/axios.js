import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try refresh then retry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const url = original?.url || '';
    const isAuthUrl = url.includes('/auth/login/') || url.includes('/auth/refresh/') || url.includes('/auth/register/');

    if (error.response?.status === 401 && !original._retry && !isAuthUrl) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${API_BASE}/api/v1/auth/refresh/`,
          {},
          {
            withCredentials: true,
          }
        );
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('active_profile');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

