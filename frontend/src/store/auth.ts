import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tokenStorage } from '@/api/client';
import { authApi } from '@/api/auth';
import type { User } from '@/api/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      async login(email, password) {
        set({ loading: true });
        try {
          const data = await authApi.login(email, password);
          tokenStorage.set(data.accessToken, data.refreshToken);
          set({ user: data.user });
        } finally {
          set({ loading: false });
        }
      },
      async register(payload) {
        set({ loading: true });
        try {
          const data = await authApi.register(payload);
          tokenStorage.set(data.accessToken, data.refreshToken);
          set({ user: data.user });
        } finally {
          set({ loading: false });
        }
      },
      logout() {
        tokenStorage.clear();
        set({ user: null });
      },
      async refreshMe() {
        if (!tokenStorage.getAccess()) return;
        try {
          const user = await authApi.me();
          set({ user });
        } catch {
          tokenStorage.clear();
          set({ user: null });
        }
      },
    }),
    { name: 'coffee.auth', partialize: (s) => ({ user: s.user }) },
  ),
);
