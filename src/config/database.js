// backend/src/config/database.js
const path = require("path");
const { Sequelize } = require("sequelize");
require("dotenv").config();

const storagePath =
  process.env.SQLITE_STORAGE ||
  path.resolve(__dirname, "../../database.sqlite");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: storagePath,
  logging: false,
});

module.exports = sequelize;
