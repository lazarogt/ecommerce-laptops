import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import axios from "axios";

import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Login from "./pages/Login";

/* ===============================
   Hook para validar token al cargar app
================================= */
function useAuthValidation() {
  const navigate = useNavigate();

  useEffect(() => {
    const validate = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        // No hay token: redirigir a login/registro
        navigate("/auth", { replace: true });
        return;
      }

      try {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        await axios.get("/api/auth/me");
      } catch (err) {
        console.error("Token inválido o expirado:",err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete axios.defaults.headers.common["Authorization"];
        navigate("/auth", { replace: true });
      }
    };

    validate();
  }, [navigate]);
}

/* ===============================
   Componente para proteger rutas
================================= */
interface ProtectedRouteProps {
  children: React.ReactElement;
}

function ProtectedRoute({ children }: ProtectedRouteProps): React.ReactElement {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

/* ===============================
   Contenedor principal con router
================================= */
function AppContent() {
  useAuthValidation();

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        }
      />

      <Route
        path="/logistics"
        element={
          <ProtectedRoute>
            <Login />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ===============================
   App raíz
================================= */
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}