// src/services/orderService.ts
import api from './api';
//import type { Product } from '../types/product';

export type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
  name?: string;
};

export type OrderPayload = {
  items: OrderItem[];
  total: number;
  customer: {
    name?: string;
    phone: string;
    email?: string;
  };
};

export const createOrder = async (orderData: OrderPayload) => {
  const res = await api.post('/orders', orderData);
  return res.data;
};