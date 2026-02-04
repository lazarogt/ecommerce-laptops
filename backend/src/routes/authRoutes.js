const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

//Registro de usuario
//POST /api/auth/register
router.post("/register", authController.register);

//LOGIN
//POST /api/auth/login
router.post("/login", authController.login);

//DEBUG temporal
const jwt = require("jsonwebtoken");

router.post("/verify", (req, res1) => {
  const auth = req.get("authorization") || req.headers.authorization;
  if (!auth) return res.status(400).json({ ok: true, error: "No auth header" });

  //limpiar
  let token = String(auth)
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/[\r\n\t]/g, "");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "");
    return res.json({ ok: true, payload });
  } catch (error) {
    return res.status(401).json({ ok: false, error: error.message });
  }
});

module.exports = router;
