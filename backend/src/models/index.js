// backend/src/models/index.js
const sequelize = require("../config/database");

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const OrderProduct = require("../models/OrderProduct");

User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

Product.belongsToMany(Order, { through: OrderProduct });
Order.belongsToMany(Product, { through: OrderProduct });

module.exports = {
  sequelize,
  User,
  Product,
  Order,
};
