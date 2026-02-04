const makeWASocket = require("@whiskeysockets/baileys").default;
const {
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");

let sock;

async function initWhatsApp() {
  console.log("📲 Inicializando WhatsApp...");

  // Esto guarda la sesión automáticamente en la carpeta whatsapp_auth/
  const { state, saveCreds } = await useMultiFileAuthState(
    "../../whatsapp_auth"
  );

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // deprecated
  });

  // Guardamos credenciales automáticamente
  sock.ev.on("creds.update", saveCreds);

  // Escuchar eventos de conexión
  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      console.log("📸 Escanea este QR con tu WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ WhatsApp conectado correctamente");
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode ?? "desconocida";

      console.log("❌ WhatsApp desconectado. Razón:", reason);

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando...");
        initWhatsApp();
      }
    }
  });
}

/**
 * Enviar mensaje de WhatsApp
 * @param {string} phone Número con código país (ej: 5355555555)
 * @param {string} message Mensaje a enviar
 */
async function sendWhatsAppMessage(phone, message) {
  if (!sock) throw new Error("WhatsApp no inicializado");

  const jid = `${phone}@s.whatsapp.net`;

  await sock.sendMessage(jid, { text: message });
}

module.exports = {
  initWhatsApp,
  sendWhatsAppMessage,
};
