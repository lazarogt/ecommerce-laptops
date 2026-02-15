// backend/src/models/OrderProduct.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderProduct = sequelize.define('OrderProduct', {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'OrderProduct',
  timestamps: false,
});

module.exports = OrderProduct;