import { apiClient } from './client';
import type { AuthTokens, User } from './types';

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<AuthTokens>('/auth/login', {
      email,
      password,
    });
    return data;
  },
  register: async (payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => {
    const { data } = await apiClient.post<AuthTokens>('/auth/register', payload);
    return data;
  },
  me: async () => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },
};
