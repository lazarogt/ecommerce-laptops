// Cargar variables de entorno
require("dotenv").config();

// Dependencias
const express = require("express");
const cors = require("cors");

// Importar WhatsApp Service
const { initWhatsApp } = require("./services/whatsappService");

// Importar rutas
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const debugRoutes = require("./routes/debugRoutes");

// Inicializar app
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/debug", debugRoutes);

// Ruta principal de prueba
app.get("/", (req, res) => {
  res.send("Backend Ecommerce laptops funcionando");
});

// Inicializar WhatsApp
initWhatsApp();

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});
