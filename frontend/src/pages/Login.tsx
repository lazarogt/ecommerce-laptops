import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from || "/";
  const message = (location.state as any)?.message;

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
        email,
        password,
      });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      navigate(from);
    } catch (err) {
      console.error(err);
      alert("Credenciales incorrectas");
    }
  };

  return (
    <div>
      <h2>Iniciar sesión</h2>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Entrar</button>
    </div>
  );
};

export default Login;