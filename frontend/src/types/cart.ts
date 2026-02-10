// src/types/cart.ts

export interface CartItem {
  productId:string;
  name: string;
  price: number;
  quantity: number;
  description:string;
};

export type CustomerInfo = {
    name:string;
    phone:string;
};

export type OrderPayload = {
    items:{productId:string, quantity:number, price:number}[];
    customer:CustomerInfo;
    total:number;
};