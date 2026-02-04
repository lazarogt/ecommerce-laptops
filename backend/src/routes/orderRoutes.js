// backend/src/routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const isAdmin = require("../middlewares/isAdmin");

//Crear orden (usuario)
router.post("/", authMiddleware, orderController.createOrder);

//Listar ordenes del usuario
router.get("/", authMiddleware, orderController.getOrders);

//Cambiar estado (solo admin)
router.patch(
  "/:id/status",
  authMiddleware,
  isAdmin,
  orderController.updateOrderStatus
);

//Listar estado de ordenes de transiciones
router.get(
  "/admin/status-transitions",
  authMiddleware,
  isAdmin,
  orderController.getOrderStatusTransitions
);

module.exports = router;
