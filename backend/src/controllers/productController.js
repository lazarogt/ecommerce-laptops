const { Product } = require("../models");
const { OP } = require("sequelize");

async function createProduct(req, res) {
  try {
    const { name, description = "", price, stock } = req.body;

    if (!name || price === undefined || price == null) {
      return res.status(400).json({ error: "name y price son obligatorios" });
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      stock: Number(stock),
    });

    return res.status(201).json({ message: "Producto creado", product });
  } catch (error) {
    console.error("productController.createProduct: ", error);
    return res
      .status(500)
      .json({ error: "Error al crear el producto", detalle: error.message });
  }
}


async function getProducts(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.q) {
      where.name = { [require("sequelize").Op.like]: `%${req.query.q}%` };
    }

    const result = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const total = Number(result.count || 0);
    const pages = Math.max(1, Math.ceil(total / limit));

    return res.json({
      page,
      limit,
      total,
      pages,
      data: result.rows, 
    });
  } catch (err) {
    console.error("ERROR getProducts:", err);
    return res
      .status(500)
      .json({ error: "Error al listar productos", detalle: err.message });
  }
}


async function getproductById(req, res) {
  try {
    const id = req.params.id;
    const product = await Product.findByPk(id);
    if (!product)
      return res.status(404).json({ error: "Producto no encontrado" });
    return res.json(product);
  } catch (error) {
    console.error("productController.getProductById: ", error);
    return res
      .status(500)
      .json({ error: "Error al obtener producto", detalle: error.message });
  }
}


async function updateProduct(req, res) {
  try {
    const id = req.params.id;
    const { name, description, price, stock } = req.body;

    const product = await Product.findByPk(id);
    if (!product)
      return res.status(404).json({ error: "Producto no encontrado" });

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);

    await product.save();
    return res.json({ message: "Producto actualizado", product });
  } catch (error) {
    console.error("productController.updateProduct:", error);
    return res
      .status(500)
      .json({ error: "Error al actualizar producto", detalle: error.message });
  }
}


async function deleteProduct(req, res) {
  try {
    const id = req.params.id;
    const product = await Product.findByPk(id);
    if (!product)
      return res.status(404).json({ error: "Producto no encontrado" });
    await product.destroy();
    return res.json({ message: "Producto eliminado" });
  } catch (error) {
    console.error("productController.deleteProduct: ", error);
    return res
      .status(500)
      .json({ error: "Error al eliminar producto", detalle: error.message });
  }
}

module.exports = {
  createProduct,
  getProducts,
  getproductById,
  updateProduct,
  deleteProduct,
};
