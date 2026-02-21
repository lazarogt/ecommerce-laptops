// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";

import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Admin from "./pages/Admin"; // Asegúrate que exista en src/pages/Admin.tsx

import CartButton from "./components/CartButton";
import BackToProductsButton from "./components/BackToProductsButton";

/* ===============================
   Hook para validar token al cargar app
   - Se ejecuta dentro de AppContent (por eso usa useNavigate)
================================= */
function useAuthValidation() {
  const navigate = useNavigate();

  React.useEffect(() => {
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
        console.error("Token inválido o expirado:", err);
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
   Componente para proteger rutas (usuario autenticado)
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
   AdminRoute: verifica rol admin
   - Primero mira localStorage.user
   - Si no está o está corrupto, consulta /api/auth/me
================================= */
function AdminRoute({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const [allowed, setAllowed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const check = async () => {
      if (!token) {
        if (mounted) setAllowed(false);
        return;
      }

      // Intentar leer usuario desde localStorage
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        try {
          const u = JSON.parse(userRaw);
          if (mounted) {
            setAllowed(Boolean(u?.role === "admin"));
            return;
          }
        } catch {
          // seguir al fallback
        }
      }

      // Fallback: llamar a /api/auth/me
      try {
        const res = await axios.get("/api/auth/me");
        const u = res.data.user || res.data;
        if (mounted) setAllowed(Boolean(u?.role === "admin"));
        if (u && typeof u === "object") localStorage.setItem("user", JSON.stringify(u));
      } catch (err) {
        console.error("No se pudo verificar usuario admin:", err);
        if (mounted) setAllowed(false);
      }
    };

    check();

    return () => {
      mounted = false;
    };
  }, [token, location]);

  if (allowed === null) {
    return <div style={{ padding: 20 }}>Comprobando permisos...</div>;
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/* ===============================
   Contenido principal con router
================================= */
function AppContent() {
  useAuthValidation();
  const location = useLocation();

  return (
    <>
      {/* Mostrar BackToProductsButton cuando no estamos en /cart */}
      {location.pathname !== "/cart" && <BackToProductsButton />}

      {/* Botón del carrito */}
      <CartButton />

      <Routes>
        {/* Rutas públicas */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
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

        {/* RUTA ADMIN (solo admin) */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
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