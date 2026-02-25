import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'));

  const isAuthenticated = computed<boolean>(() => !!token.value);

  async function login(username: string, password: string): Promise<boolean> {
    try {
      const response = await api.post('/api/v1/auth/login', { username, password });
      const accessToken: string = response.data.accessToken;
      token.value = accessToken;
      localStorage.setItem('auth_token', accessToken);
      return true;
    } catch {
      return false;
    }
  }

  function logout(): void {
    token.value = null;
    localStorage.removeItem('auth_token');
  }

  return { token, isAuthenticated, login, logout };
});
