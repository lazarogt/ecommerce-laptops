// backend/reset_db.js
require("dotenv").config();
(async () => {
  try {
    const { sequelize } = require("./src/models");
    console.log(
      "🔁 Reconstruyendo la base de datos (force: true) — esto borrará tablas existentes..."
    );
    await sequelize.sync({ force: true });
    console.log(
      "✅ Base de datos recreada y tablas sincronizadas correctamente."
    );
    process.exit(0);
  } catch (err) {
    console.error("Error al recrear la BD:", err);
    process.exit(1);
  }
})();
