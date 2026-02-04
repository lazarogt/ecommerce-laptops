const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const isAdmin = require("../middlewares/isAdmin");

//listar productos (publico)
router.get("/", productController.getProducts);

//Obtener producto por id (publico)
router.get("/:id", productController.getproductById);

//Crear producto (solo admin)
router.post("/", authMiddleware, isAdmin, productController.createProduct);

//Actualizar producto (solo admin)
router.put("/:id", authMiddleware, isAdmin, productController.updateProduct);

//Borrar producto (solo admin)
router.delete("/:id", authMiddleware, isAdmin, productController.deleteProduct);

module.exports = router;
