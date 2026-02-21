// src/pages/Register.tsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { setAuth } from "../utils/auth";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/auth/register", { name, email, password, phone });

      // Login automático
      const loginRes = await axios.post("/api/auth/login", { email, password });
      const token: string | undefined = loginRes.data?.token;
      if (!token) throw new Error("No se recibió token después del registro");

      setAuth(token, null);
      const meRes = await axios.get("/api/auth/me");
      const user = meRes.data?.user || meRes.data;
      setAuth(token, user);

      navigate("/", { replace: true });
    } catch (err: unknown) {
      console.error("register error:", err);
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error || err.message);
      } else if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Error al registrar (ver consola)");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h2>Crear cuenta</h2>
      <form onSubmit={handleRegister}>
        <input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%", padding: 8, marginBottom: 8 }} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{ width: "100%", padding: 8, marginBottom: 8 }} />
        <input placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
        <input placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={{ width: "100%", padding: 8, marginBottom: 8 }} />
        <button type="submit" disabled={loading} style={{ padding: "8px 12px" }}>
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
};

export default Register;