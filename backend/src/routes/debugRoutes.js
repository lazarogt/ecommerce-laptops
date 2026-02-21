// backend/src/routes/debugRoutes.js
const express = require("express");
const router = express.Router();
const { sendWhatsAppMessage } = require("../services/whatsappService");

// POST /api/debug/send-whatsapp
router.post("/send-whatsapp", async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message)
      return res.status(400).json({ error: "phone y message son requeridos" });

    await sendWhatsAppMessage(phone.replace(/\D/g, ""), message);
    return res.json({ ok: true, message: "Mensaje enviado" });
  } catch (err) {
    console.error("Debug send-whatsapp error:", err && (err.message || err));
    return res.status(500).json({ ok: false, error: err.message || "error" });
  }
});

module.exports = router;
