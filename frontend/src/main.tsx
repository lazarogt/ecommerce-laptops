// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import { CartProvider } from "./context/CartProvider";
import "./index.css";

// Ajusta la base URL según tu backend
axios.defaults.baseURL = "http://localhost:3000";

// Si hay token en localStorage, úsalo en todas las peticiones
const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Interceptor: en 401 -> limpiar token y redirigir a login/auth
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // redirigir a la pantalla de auth (login/registro)
      window.location.href = "/auth";
    }
    return Promise.reject(err);
  }
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);