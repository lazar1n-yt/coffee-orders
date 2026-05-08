export type Role = 'CUSTOMER' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  position: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  available: boolean;
  categoryId: string;
  category?: Category;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  nameSnapshot: string;
  priceCents: number;
  quantity: number;
}

export interface Order {
  id: string;
  number: number;
  status: OrderStatus;
  customerName: string;
  phone: string;
  comment: string | null;
  pickupTime: string;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
