// src/pages/Cart.tsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import type { CartItem } from "../types/cart";

export interface CartProps {
  onClose?: () => void;
}

const Cart: React.FC<CartProps> = ({ onClose }) => {
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);

  const token = localStorage.getItem("token");

  const handleContinueShopping = () => {
    if (onClose) return onClose();
    navigate("/");
  };

  const handleSendOrder = async () => {
    if (!token) {
      navigate("/auth", { state: { from: "/cart", message: "Debes iniciar sesión para completar tu compra" } });
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Nombre y teléfono son obligatorios");
      return;
    }

    const normalizedPhone = customerPhone.replace(/\D/g, "");
    if (!normalizedPhone) {
      alert("Teléfono inválido");
      return;
    }

    const payload = {
      customerName: customerName.trim(),
      customerPhone: normalizedPhone,
      products: items.map((i: CartItem) => ({ productId: i.productId, quantity: i.quantity })),
      total,
    };

    try {
      setSending(true);

      const res = await axios.post("/api/orders", payload, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      });

      if (res.status >= 200 && res.status < 300) {
        clearCart();
        navigate("/my-orders");
        if (onClose) setTimeout(() => onClose(), 150);
        return;
      }

      const serverMsg = (res.data && (res.data.error || res.data.message || res.data.detalle)) || `HTTP ${res.status}`;
      alert("No se pudo procesar el pedido: " + serverMsg);
    } catch (err: unknown) {
      console.error("Error enviando pedido:", err);
      alert("Error al enviar pedido (ver consola)");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="cart-container">
      {/* Header */}
      <div className="cart-header">
        <h2>Carrito</h2>
        {items.length > 0 && (
          <button className="continue-btn" onClick={handleContinueShopping}>
            ← Seguir comprando
          </button>
        )}
      </div>

      {/* Carrito vacío */}
      {items.length === 0 && (
        <div className="empty-cart">
          <p>El carrito está vacío 🛒</p>
          <button className="continue-btn" onClick={handleContinueShopping}>
            Ir a productos
          </button>
        </div>
      )}

      {/* Items */}
      {items.map((item: CartItem) => (
        <div key={item.productId} className="cart-item">
          <strong>{item.name}</strong>
          {item.description && <p className="cart-item-desc">{item.description}</p>}
          <p>${Number(item.price).toFixed(2)}</p>
          <div className="cart-item-actions">
            <button onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))} disabled={!token}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={!token}>+</button>
            <button onClick={() => removeFromCart(item.productId)} disabled={!token}>Eliminar</button>
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <>
          <hr />
          {/* Formulario */}
          <div className="cart-form">
            <input placeholder="Tu nombre" value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={!token} />
            <input placeholder="Tu teléfono (incluye prefijo país)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={!token} />
          </div>

          {/* Botones flotantes */}
          <div className="cart-footer">
            {!token ? (
              <>
                <button onClick={() => navigate("/auth", { state: { from: "/cart", message: "Debes iniciar sesión para completar tu compra" } })}>
                  Inicia sesión
                </button>
                <button onClick={() => navigate("/auth")}>Registrarme</button>
              </>
            ) : (
              <button onClick={handleSendOrder} disabled={sending}>
                {sending ? "Enviando..." : "Confirmar pedido"}
              </button>
            )}
            <div className="cart-total">Total: ${Number(total).toFixed(2)}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;