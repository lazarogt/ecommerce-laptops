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

  const handleSendOrder = async () => {
  if (!token) {
    navigate("/login", { state: { from: "/cart", message: "Debes iniciar sesión para completar tu compra" }});
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
    console.log("Enviando pedido -> payload:", payload);

    const res = await axios.post("/api/orders", payload, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      validateStatus: () => true // siempre retornar respuesta para manejarla nosotros
    });

    console.log("POST /api/orders response status:", res.status, "data:", res.data);

    // considerar cualquier 2xx como éxito
    if (res.status >= 200 && res.status < 300) {
      // Navegar ANTES de onClose para evitar que el modal desmonte el componente
      // Ajusta target si tu "página de logística" es otra (p.ej. "/logistica")
      const target = "/my-orders";
      navigate(target);

      // Si quieres que el modal se cierre visualmente un instante después:
      if (onClose) {
        // opcional: pequeño retardo para que el navegador procese la navegación visualmente
        setTimeout(() => onClose(), 150);
      }

      clearCart();
      return;
    }

    // Si no fue 2xx, mostrar el mensaje que venga del backend
    const errMsg = res.data?.error || res.data?.message || `HTTP ${res.status}`;
    console.error("Error al procesar pedido (server):", res.data);
    alert("No se pudo procesar el pedido: " + errMsg);
  } catch (err: unknown) {
    console.error("Error enviando pedido (catch):", err);
    // manejo seguro de axios errors si quieres más detalle
    if (axios.isAxiosError(err)) {
      alert("Error al enviar pedido: " + (err.response?.data?.error || err.message));
    } else if (err instanceof Error) {
      alert("Error al enviar pedido: " + err.message);
    } else {
      alert("Error al enviar pedido (ver consola)");
    }
  } finally {
    setSending(false);
  }
};

  if (!items || items.length === 0) return <p>El carrito está vacío</p>;

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      {onClose && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} aria-label="Cerrar carrito" style={{ fontSize: 18 }}>
            ✖
          </button>
        </div>
      )}

      <h2>Carrito</h2>

      {items.map((item: CartItem) => (
        <div key={item.productId} style={{ marginBottom: 12, borderBottom: "1px solid #eee", paddingBottom: 8 }}>
          <strong>{item.name}</strong>
          {item.description && <p style={{ margin: "6px 0", color: "#555" }}>{item.description}</p>}
          <p style={{ margin: "6px 0" }}>${Number(item.price).toFixed(2)}</p>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
              disabled={!token}
            >
              -
            </button>
            <span>{item.quantity}</span>
            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={!token}>
              +
            </button>
            <button onClick={() => removeFromCart(item.productId)} style={{ marginLeft: 12 }} disabled={!token}>
              Eliminar
            </button>
          </div>
        </div>
      ))}

      <hr />
      <p>
        <strong>Total:</strong> ${Number(total).toFixed(2)}
      </p>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          placeholder="Tu nombre"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          disabled={!token}
          style={{ padding: 8 }}
        />
        <input
          placeholder="Tu teléfono (incluye prefijo país)"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          disabled={!token}
          style={{ padding: 8 }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        {!token ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() =>
                navigate("/login", {
                  state: { from: "/cart", message: "Debes iniciar sesión para completar tu compra" },
                })
              }
              style={{
                padding: "10px 12px",
                backgroundColor: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Inicia sesión para comprar
            </button>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "10px 12px",
                backgroundColor: "#eee",
                border: "1px solid #ccc",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Registrarme
            </button>
          </div>
        ) : (
          <button
            onClick={handleSendOrder}
            disabled={sending}
            style={{
              padding: "10px 12px",
              marginTop: 8,
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: sending ? "not-allowed" : "pointer",
            }}
          >
            {sending ? "Enviando..." : "Confirmar pedido"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Cart;