// src/pages/Admin.tsx
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import type { Product } from "../types/product";
import type { User } from "../types/user";
import type { Order } from "../types/order";

const Admin: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [productSearch, setProductSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");

  // fetchers memoizados
  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get("/api/products");
      if (res.data?.data) setProducts(res.data.data);
    } catch (err: unknown) {
      console.error("fetchProducts:", err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get("/api/admin/users");
      if (res.data?.data) setUsers(res.data.data);
    } catch (err: unknown) {
      console.error("fetchUsers:", err);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get("/api/admin/orders");
      if (res.data?.data) setOrders(res.data.data);
    } catch (err: unknown) {
      console.error("fetchOrders:", err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchUsers(), fetchOrders()]);
      setLoading(false);
    };
    load();
  }, [fetchProducts, fetchUsers, fetchOrders]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!confirm("¿Eliminar producto?")) return;
    try {
      await axios.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      console.error(err);
      alert("No se pudo eliminar el producto");
    }
  }, []);

  const changeOrderStatus = useCallback(async (orderId: string, status: string) => {
    try {
      const res = await axios.patch(`/api/orders/${orderId}`, { status });
      const updated = res.data?.order;
      if (updated) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      } else {
        // fallback: refetch
        fetchOrders();
      }
    } catch (err: unknown) {
      console.error(err);
      alert("No se pudo actualizar el estado del pedido");
    }
  }, [fetchOrders]);

  if (loading) return <p>Cargando datos del admin...</p>;

  const totalOrders = orders.length;
  const totalUsers = users.length;
  const lowStockProducts = products.filter((p) => p.stock <= 5).length;

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 20 }}>Panel Admin</h1>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 30 }}>
        {[
          { title: "Total Pedidos", value: totalOrders, color: "#1976d2" },
          { title: "Total Usuarios", value: totalUsers, color: "#4caf50" },
          { title: "Stock Bajo", value: lowStockProducts, color: "#f44336" },
        ].map((card) => (
          <div key={card.title} style={{
            flex: "1 1 220px", padding: 20, borderRadius: 10, backgroundColor: card.color,
            color: "#fff", fontWeight: "bold", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", boxShadow: "2px 2px 12px rgba(0,0,0,0.15)"
          }}>
            <div style={{ fontSize: 24 }}>{card.value}</div>
            <div style={{ marginTop: 8, fontSize: 16 }}>{card.title}</div>
          </div>
        ))}
      </div>

      {/* Productos grid */}
      <section style={{ marginBottom: 40 }}>
        <h2>Productos</h2>
        <input placeholder="Buscar producto..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} style={{ padding: 8, marginBottom: 12, width: "100%", maxWidth: 300 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
          {products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())).map((p) => (
            <div key={p.id} style={{ border: "1px solid #ccc", borderRadius: 10, padding: 12, background: "#fff" }}>
              <img src={p.image || "/placeholder.png"} alt={p.name} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />
              <h3 style={{ margin: "4px 0" }}>{p.name}</h3>
              <p style={{ fontSize: 14, color: "#555" }}>{p.description || "Sin descripción"}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <span style={{ fontWeight: "bold" }}>${p.price.toFixed(2)}</span>
                {p.stock <= 0 ? <span style={{ color: "#f44336", fontWeight: "bold" }}>Agotado</span> : p.stock <= 5 ? <span style={{ color: "#ff9800", fontWeight: "bold" }}>Bajo stock</span> : null}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button onClick={() => alert("Editar (abrir modal)")} style={{ flex: 1, padding: "6px 0", background: "#1976d2", color: "#fff", border: "none", borderRadius: 4 }}>Editar</button>
                <button onClick={() => deleteProduct(p.id)} style={{ flex: 1, padding: "6px 0", background: "#d32f2f", color: "#fff", border: "none", borderRadius: 4 }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pedidos */}
      <section style={{ marginBottom: 40 }}>
        <h2>Pedidos</h2>
        <input placeholder="Buscar pedido por ID o cliente..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} style={{ padding: 8, marginBottom: 12, width: "100%", maxWidth: 400 }} />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: 8 }}>ID</th>
              <th style={{ padding: 8 }}>Cliente</th>
              <th style={{ padding: 8 }}>Total</th>
              <th style={{ padding: 8 }}>Estado</th>
              <th style={{ padding: 8 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.filter(o => String(o.id).includes(orderSearch) || (o.customerName || "").toLowerCase().includes(orderSearch.toLowerCase())).map(o => (
              <tr key={o.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: 8 }}>{o.id}</td>
                <td style={{ padding: 8 }}>{o.customerName}</td>
                <td style={{ padding: 8 }}>${o.total.toFixed(2)}</td>
                <td style={{ padding: 8 }}>
                  <span style={{ padding: "2px 6px", borderRadius: 4, backgroundColor: o.status === "PENDING" ? "#ff9800" : "#4caf50", color: "#fff", fontWeight: "bold" }}>{o.status}</span>
                </td>
                <td style={{ padding: 8 }}>
                  {o.status === "PENDING" && <button onClick={() => changeOrderStatus(o.id, "PAID")} style={{ padding: "4px 8px", backgroundColor: "#1976d2", color: "#fff", border: "none", borderRadius: 4 }}>Marcar como Pagado</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Usuarios */}
      <section style={{ marginBottom: 40 }}>
        <h2>Usuarios</h2>
        <input placeholder="Buscar usuario..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} style={{ padding: 8, marginBottom: 12, width: "100%", maxWidth: 300 }} />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: 8 }}>ID</th>
              <th style={{ padding: 8 }}>Nombre</th>
              <th style={{ padding: 8 }}>Email</th>
              <th style={{ padding: 8 }}>Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: 8 }}>{u.id}</td>
                <td style={{ padding: 8 }}>{u.name}</td>
                <td style={{ padding: 8 }}>{u.email}</td>
                <td style={{ padding: 8 }}>{u.phone || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Admin;