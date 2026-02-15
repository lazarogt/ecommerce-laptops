// src/pages/MyOrders.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

type OrderItem = {
  productId: number;
  name?: string;
  description?: string;
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  Products?: OrderItem[];
};

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get("/api/orders"); // backend debe devolver orders del user
        // Ajusta si tu backend responde { orders } o { data }
        setOrders(res.data.orders || res.data.data || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <p>Cargando pedidos...</p>;
  if (!orders.length) return <p>No tienes pedidos aún.</p>;

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <h1>Mis pedidos</h1>
      <div style={{ display: "grid", gap: 12 }}>
        {orders.map((o) => (
          <div key={o.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong>Pedido #{o.id}</strong>
                <div style={{ color: "#666", fontSize: 13 }}>
                  {new Date(o.createdAt).toLocaleString()} · {o.status}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div>Total</div>
                <div style={{ fontWeight: 700 }}>${Number(o.total).toFixed(2)}</div>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 14, marginBottom: 6 }}><strong>Productos:</strong></div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {(o.Products || []).map((p) => (
                  <li key={p.productId} style={{ marginBottom: 8 }}>
                    <div><strong>{p.name}</strong></div>
                    {p.description && <div style={{ color: "#555" }}>{p.description}</div>}
                    <div style={{ fontSize: 13 }}>{p.quantity} × ${Number(p.price).toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;