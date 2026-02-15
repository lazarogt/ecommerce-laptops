// backend/src/models/index.js
const sequelize = require("../config/database");

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const OrderProduct = require("../models/OrderProduct");

// Asociaciones (usar foreignKey explícito)
User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

// Many-to-many products <-> orders via OrderProduct
Product.belongsToMany(Order, { through: OrderProduct });
Order.belongsToMany(Product, { through: OrderProduct });

module.exports = {
  sequelize,
  User,
  Product,
  Order,
};
