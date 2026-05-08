import { apiClient } from './client';
import type { Order, OrderStatus } from './types';

export interface CreateOrderPayload {
  customerName: string;
  phone: string;
  comment?: string;
  pickupTime: string;
  items: Array<{ menuItemId: string; quantity: number }>;
}

export const ordersApi = {
  create: async (payload: CreateOrderPayload) => {
    const { data } = await apiClient.post<Order>('/orders', payload);
    return data;
  },
  list: async (params?: { status?: OrderStatus; page?: number; pageSize?: number }) => {
    const { data } = await apiClient.get<{
      items: Order[];
      total: number;
      page: number;
      pageSize: number;
    }>('/orders', { params });
    return data;
  },
  updateStatus: async (id: string, status: OrderStatus) => {
    const { data } = await apiClient.patch<Order>(`/orders/${id}/status`, { status });
    return data;
  },
};
