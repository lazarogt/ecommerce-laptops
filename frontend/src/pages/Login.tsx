// src/pages/Login.tsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

type LocationState = {
  from?: string;
  message?: string;
};

type LoginResponse = {
  token: string;
  user: {
    id: number;
    name?: string;
    email?: string;
    // agrega campos que use tu app
  };
};

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;
  const from = state.from || "/";
  const message = state.message;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post<LoginResponse>("/api/auth/login", { email, password });
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      alert("Credenciales incorrectas o error del servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Iniciar sesión</h2>
      {message && <p style={{ color: "red" }}>{message}</p>}
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: "8px 12px" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
};

export default Login;