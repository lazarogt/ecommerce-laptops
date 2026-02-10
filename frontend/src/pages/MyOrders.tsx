// frontend/src/pages/MyOrders.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import type { CartItem } from "../types/cart"; // reused shape for order items if you have one

type OrderItem = {
  productId: number;
  name?: string;
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  customerName: string | null;
  customerPhone: string | null;
  total: number;
  status: string;
  createdAt: string;
  Products?: Array<OrderItem & { description?: string }>;
};

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // For guest lookup by phone
  const [phone, setPhone] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // no auto fetch if not logged
    setLoading(true);
    axios
      .get("/api/orders", { // adjust base URL if needed (http://localhost:3000)
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setOrders(res.data.orders || res.data.data || []);
      })
      .catch((err) => {
        console.error("Error fetching my orders:", err);
        setError("Error cargando tus pedidos");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLookupByPhone = async () => {
    setSearching(true);
    setError(null);
    try {
      const normalized = phone.replace(/\D/g, "");
      if (!normalized) {
        setError("Ingresa un teléfono válido");
        setSearching(false);
        return;
      }
      const res = await axios.get(`/api/orders/lookup?phone=${encodeURIComponent(normalized)}`);
      setOrders(res.data.orders || res.data.data || []);
    } catch (err) {
      console.error("Lookup error:", err);
      setError("No se encontraron pedidos para ese teléfono");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1>Mis pedidos</h1>

      {!localStorage.getItem("token") && (
        <div style={{ marginBottom: 20, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <p>
            No estás identificado. Si quieres ver pedidos asociados al teléfono, ingresa tu número aquí:
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="tel"
              placeholder="Ej: 5358362951 (incluye prefijo país sin +)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ flex: 1, padding: 8 }}
            />
            <button onClick={handleLookupByPhone} disabled={searching}>
              {searching ? "Buscando..." : "Buscar por teléfono"}
            </button>
          </div>
          <small style={{ color: "#666" }}>
            Si más adelante implementas login, la lista también aparecerá automáticamente cuando inicies sesión.
          </small>
        </div>
      )}

      {loading ? (
        <p>Cargando pedidos...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : orders.length === 0 ? (
        <p>No hay pedidos para mostrar.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {orders.map((o) => (
            <div key={o.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                  {(o.Products || []).map((p: any) => (
                    <li key={p.productId} style={{ marginBottom: 6 }}>
                      <div>
                        <strong>{p.name}</strong>
                      </div>
                      {p.description && <div style={{ color: "#555" }}>{p.description}</div>}
                      <div style={{ fontSize: 13, color: "#333" }}>
                        {p.quantity} × ${Number(p.price).toFixed(2)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;