import { boot } from 'quasar/wrappers';
import axios, { type AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
});

export default boot(({ router }) => {
  api.interceptors.request.use((config) => {
    const token: string | null = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        void router.push('/admin/login');
      }
      return Promise.reject(error);
    },
  );
});

export { api };
