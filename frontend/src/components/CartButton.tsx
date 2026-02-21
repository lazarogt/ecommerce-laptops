// src/components/CartButton.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

type CartButtonProps = {
  onClick?: () => void; // opcional
};

const CartButton: React.FC<CartButtonProps> = ({ onClick }) => {
  const { items } = useCart();
  const navigate = useNavigate();

  const count = items.reduce((s, i) => s + i.quantity, 0);

  const handle = () => {
    if (onClick) return onClick();
    navigate("/cart");
  };

  return (
    <button
      className="cart-button"
      onClick={handle}
      aria-label="Abrir carrito"
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        background: "#fff",
        borderRadius: 999,
        width: 56,
        height: 56,
        border: "1px solid #ddd",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 20 }}>🛒</span>
      {count > 0 && (
        <span
          style={{
            position: "absolute",
            right: 6,
            top: 6,
            background: "crimson",
            color: "white",
            borderRadius: 12,
            padding: "2px 6px",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export default CartButton;