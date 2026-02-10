export interface OrderItem {
  productId: number;
  quantity: number;
}

export interface OrderPayload {
  items: OrderItem[];
  total: number;
  customerName?: string;
  customerPhone?: string;
}