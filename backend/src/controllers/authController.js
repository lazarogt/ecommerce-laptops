const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

/**
 * Helper para generar token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Helper para devolver usuario seguro
 */
function buildSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/**
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Faltan campos: name, email o password" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email ya registrado" });
    }

    const hashed = await bcrypt.hash(password, 8);

    const normalizePhone = (phone = "") => phone.replace(/\D/g, "");
    const phoneNormalized = normalizePhone(phone);

    const user = await User.create({
      name,
      email,
      password: hashed,
      phone: phoneNormalized,
    });

    const token = generateToken(user);
    const safeUser = buildSafeUser(user);

    return res.status(201).json({
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("authController.register:", err);
    return res.status(500).json({
      error: "Error al registrar usuario",
      detalle: err.message,
    });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Faltan campos: email o password" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Credenciales invalidas" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales invalidas" });
    }

    const token = generateToken(user);
    const safeUser = buildSafeUser(user);

    return res.status(200).json({
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("authController.login:", err);
    return res.status(500).json({
      error: "Error login",
      detalle: err.message,
    });
  }
}

/**GET /api/auth/me
 * 
 */
async function me(req,res) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes:["id","name","email","phone","role","createdAt"],
    });

    if(!user){
      return res.status(401).json({error:"Usuario no encontrado"});
    }

    return res.status(200).json({user});
  } catch (error) {
     console.error("authController.me:",error);
     return res.status(500).json({error:"Error obteniendo usuario"});
  }
  
}

module.exports = { register, login, me };