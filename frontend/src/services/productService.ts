import api from './api';
import type { Product } from '../types/product';

export const getProducts = async (): Promise<Product[]> => {
  const res = await api.get('/products');
  return res.data as Product[];
};

export const getProduct = async (id: string): Promise<Product> => {
  const res = await api.get(`/products/${id}`);
  return res.data as Product;
};