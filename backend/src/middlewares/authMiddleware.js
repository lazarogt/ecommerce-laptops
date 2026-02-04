const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    //leer header de forma case-insensitive
    let authHeader =
      req.headers.authorization || req.get || req.get("authorization") || "";

    if (!authHeader) {
      return res.status(401).json({ error: "Notoken proporcionado" });
    }

    //limpiar comillas y whitespace
    authHeader = String(authHeader).trim();
    if (
      (authHeader.startsWith("'") && authHeader.endsWith("'")) ||
      (authHeader.startsWith('"') && authHeader.endsWith('"'))
    ) {
      authHeader = authHeader.slice(1, -1).trim();
    }

    //aceptar "Bearer <token> o solo <token>"
    const parts = authHeader.split(/\s+/);
    let token = null;
    if (parts.length >= 2 && parts[0].toLowerCase() === "bearer") {
      token = parts.slice(1).join(""); //por si hay espacios
    } else {
      //por seguridad tambien intentar tomar la ultima parte
      token = parts[parts.length - 1];
    }

    token = String(token || "")
      .replace(/[\r\n\t\u200B-\u200D\uFEFF]/g, "")
      .trim();

    if (!token) {
      return res.status(401).json({ error: "Formato de token invalido" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("AuthMiddleware error: ", error.message);
    return res
      .status(401)
      .json({ error: "Token invalido o expirado", detalle: error.message });
  }
};
