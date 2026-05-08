import { apiClient } from './client';
import type { Category, MenuItem } from './types';

export const categoriesApi = {
  list: async () => {
    const { data } = await apiClient.get<Category[]>('/categories');
    return data;
  },
};

export const menuApi = {
  list: async (params?: { categoryId?: string; available?: boolean }) => {
    const { data } = await apiClient.get<MenuItem[]>('/menu', {
      params: {
        categoryId: params?.categoryId,
        available: params?.available === undefined ? undefined : String(params.available),
      },
    });
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<MenuItem>(`/menu/${id}`);
    return data;
  },
};
