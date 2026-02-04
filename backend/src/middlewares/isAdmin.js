// backend/src/middlewares/isAdmin.js
module.exports = (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "No autenticado" });
    if (req.user.role && req.user.role === "admin") return next();
    return res
      .status(403)
      .json({ error: "Requiere permisos de administrador" });
  } catch (err) {
    console.error("isAdmin error:", err);
    return res.status(500).json({ error: "Error en autorización" });
  }
};
