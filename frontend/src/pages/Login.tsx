// src/pages/Login.tsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { setAuth } from "../utils/auth";

type LocationState = {
  from?: string;
  message?: string;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const destination = state.from || "/";

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      const token: string | undefined = res.data?.token;
      if (!token) throw new Error("No se recibió token del servidor");

      // Configurar token global temporalmente
      setAuth(token, null);

      // Obtener usuario
      const meRes = await axios.get("/api/auth/me");
      const user = meRes.data?.user || meRes.data;

      setAuth(token, user);

      navigate(destination, { replace: true });
    } catch (err: unknown) {
      console.error("login error:", err);

      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.error || err.response?.data?.message || err.message;
        alert("Error al iniciar sesión: " + msg);

        // Si es 401/403, limpiar auth por seguridad
        if (err.response?.status === 401 || err.response?.status === 403) {
          setAuth(null, null);
        }
      } else if (err instanceof Error) {
        alert("Error al iniciar sesión: " + err.message);
      } else {
        alert("Error al iniciar sesión (ver consola)");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 16 }}>
      <h2>Iniciar sesión</h2>
      {state.message && <p style={{ color: "darkorange" }}>{state.message}</p>}
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          Contraseña
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading} style={{ padding: "8px 12px" }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;