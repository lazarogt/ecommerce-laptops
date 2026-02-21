// backend/src/routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const {authenticateToken,isAdmin} = require("../middlewares/authMiddleware");

router.post("/", authenticateToken, orderController.createOrder);

router.get("/", authenticateToken, orderController.getOrders);

router.patch(
  "/:id/status",
  authenticateToken,
  isAdmin,
  orderController.updateOrderStatus
);

router.get(
  "/admin/status-transitions",
  authenticateToken,
  isAdmin,
  orderController.getOrderStatusTransitions
);

module.exports = router;
