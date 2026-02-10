import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

const Cart = () => {
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [sending, setSending] = useState(false);

  const token = localStorage.getItem("token");

  const handleSendOrder = async () => {
    // 🔒 BLOQUEO DURO SI NO HAY LOGIN
    if (!token) {
      navigate("/login", {
        state: {
          from: "/cart",
          message: "Debes iniciar sesión para completar tu compra",
        },
      });
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Nombre y teléfono son obligatorios");
      return;
    }

    try {
      setSending(true);

      await axios.post("http://localhost:3000/api/orders", {
        customerName,
        customerPhone,
        items,
      });

      alert("Pedido enviado correctamente ✅");
      clearCart();
    } catch (err) {
      console.error(err);
      alert("Error al enviar pedido");
    } finally {
      setSending(false);
    }
  };

  if (items.length === 0) {
    return <p>El carrito está vacío</p>;
  }

  return (
    <div>
      <h2>Carrito</h2>

      {items.map((item) => (
        <div key={item.productId}>
          <strong>{item.name}</strong>
          <p>{item.description}</p>
          <p>${item.price}</p>

          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
          <span>{item.quantity}</span>
          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>

          <button onClick={() => removeFromCart(item.productId)}>Eliminar</button>
        </div>
      ))}

      <hr />
      <p>Total: ${total}</p>

      {!token && (
        <p style={{ color: "red" }}>
          Debes iniciar sesión para finalizar la compra
        </p>
      )}

      <input
        placeholder="Tu nombre"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        disabled={!token}
      />

      <input
        placeholder="Tu teléfono"
        value={customerPhone}
        onChange={(e) => setCustomerPhone(e.target.value)}
        disabled={!token}
      />

      <button onClick={handleSendOrder} disabled={!token || sending}>
        {!token ? "Inicia sesión para comprar" : sending ? "Enviando..." : "Confirmar pedido"}
      </button>
    </div>
  );
};

export default Cart;