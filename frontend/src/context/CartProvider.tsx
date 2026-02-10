import React, { useState, useEffect } from "react";
import { CartContext} from "./CartContext";
import type { CartContextType } from "./CartContext";
import type { CartItem } from "../types/cart";
import type { Product } from "../types/product";

interface Props {
  children: React.ReactNode;
}

export const CartProvider: React.FC<Props> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  // Función para agregar producto al carrito
  const addToCart = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        // Si ya está, aumentar cantidad
        return prev.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        // Si no está, agregar nuevo
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            description: product.description || "", // Valor por defecto
          },
        ];
      }
    });
  };

  // Función para eliminar producto
  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  // Función para actualizar cantidad
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev =>
      prev.map(i => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  // Vaciar carrito
  const clearCart = () => setItems([]);

  // Total derivado del carrito
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const contextValue: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
  };

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};