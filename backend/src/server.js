// Cargar variables de entorno
require("dotenv").config();

// Dependencias
const express = require("express");
const cors = require("cors");
const sequelise = require("./config/database");

require("./models/User");
require("./models/Product");
require("./models/Order");
require("./models/OrderProduct");

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

// Iniciar servidor
async function startServer() {
  try {
    console.log("Sincronizando base de datos....");
    await sequelise.sync({alter:true});
    console.log("Base de datos sincronizada");
    initWhatsApp();
    app.listen(PORT,()=>{console.log('Servidor activo en http://localhost:3000');});
  } catch (error) {
    console.error("Error al iniciar servidor:",error);
    process.exit(1);
    
  }
  
}

startServer();
