import { createContext, useContext } from "react";
import type { CartItem } from "../types/cart";
import type { Product } from "../types/product";

export interface CartContextType {
  items:CartItem[];
  addToCart: (product:Product)=>void;
  removeFromCart: (id:string)=>void;
  clearCart: ()=>void;
  total:number;
  updateQuantity: (productId:string, quantity:number)=>void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if(!ctx){
    throw new Error('useCart debe usarse dentro de CartProvider');
  }

  return ctx;
}