// backend/src/controllers/orderController.js
const { Order, Product, User } = require("../models");
const sequelize = require("../config/database");
const { sendWhatsAppMessage } = require("../services/whatsappService");
const {
  validateOrderStatusTransition,
  allowedTransitions,
} = require("../utils/orderStatus");

function normalizePhone(phone = "") {
  return String(phone || "").replace(/\D/g, "");
}

/**
 * createOrder
 * - Acepta body con:
 *    - products: [{ productId, quantity }, ...]  <-- preferido
 *    - o items: [{ productId, quantity }, ...]     <-- alternativa
 *  O en modo simple:
 *    - customerName, customerPhone, total
 */
async function createOrder(req, res) {
  console.log("createOrder called. req.user:", req.user);
  // Requerir auth antes de abrir transacción
  if (!req.user || !req.user.id) {
    return res.status(401).json({ ok: false, error: "Autenticación requerida" });
  }
  const userId = req.user.id;

  const userExists = await User.findByPk(userId);
  if(!userExists){
    console.error(`createOrder:userId ${userId} no encontrado en Users`);
    return res.status(400).json({ok:false, error:"Usuario no encontrado (userId invalido)"});
  }

  // Leer inputs (sin tocar DB aún)
  const { customerName, customerPhone, total: totalFromBody } = req.body || {};
  const productsInput = req.body.products || req.body.items || [];

  if (
    (!productsInput || productsInput.length === 0) &&
    (!customerName || !customerPhone || !totalFromBody)
  ) {
    return res.status(400).json({
      ok: false,
      error:
        "Datos incompletos: enviar products/items o customerName+customerPhone+total",
    });
  }

  // Normalizar cliente (inmediato; es seguro)
  const customerNameFinal =
    (customerName && String(customerName).trim()) || req.user.name || "Cliente";
  let customerPhoneFinal =
    (customerPhone && normalizePhone(customerPhone)) || normalizePhone(req.user?.phone) || "";

  try {
    // Usamos transacción gestionada: commit/rollback automático según éxito/fallo
    const txResult = await sequelize.transaction(async (t) => {
      // Crear orden preliminar ligada al userId
      const order = await Order.create(
        {
          userId,
          customerName: customerNameFinal,
          customerPhone: customerPhoneFinal,
          total: 0,
          status: "PENDING",
        },
        { transaction: t }
      );

      let total = 0;
      let itemsMessage = "";

      if (productsInput && Array.isArray(productsInput) && productsInput.length > 0) {
        for (const it of productsInput) {
          const productId = it.productId || it.id;
          const quantity = Number(it.quantity) || 0;
          if (!productId || quantity <= 0) {
            // lanzar para que la transacción haga rollback automáticamente
            const err = new Error("products/items inválidos (productId y quantity > 0)");
            err.statusCode = 400;
            throw err;
          }

          // Buscar producto dentro de la transacción
          const product = await Product.findByPk(productId, { transaction: t });
          if (!product) {
            const err = new Error(`Producto no encontrado (id: ${productId})`);
            err.statusCode = 400;
            throw err;
          }

          if (product.stock < quantity) {
            const err = new Error(
              `Stock insuficiente para producto ${product.name} (id: ${productId})`
            );
            err.statusCode = 400;
            throw err;
          }

          const linePrice = Number(product.price) * quantity;
          total += linePrice;

          // Relación many-to-many con through { quantity, price }
          await order.addProduct(product, {
            through: { quantity, price: product.price },
            transaction: t,
          });

          // Descontar stock
          product.stock = product.stock - quantity;
          await product.save({ transaction: t });

          itemsMessage += `- ${product.name} x${quantity} → $${Number(product.price).toFixed(2)}\n`;
        }
      } else {
        // Modo simple (sin detalle de productos)
        total = Number(totalFromBody) || 0;
      }

      // Guardar total y persistir
      order.total = total;
      await order.save({ transaction: t });

      // Devuelve datos útiles fuera de la transacción
      return { order, itemsMessage, customerNameFinal, customerPhoneFinal };
    }); // fin transaction

    // txResult contiene lo retornado dentro: { order, itemsMessage, ... }
    const { order, itemsMessage } = txResult;
    // customerPhoneFinal y customerNameFinal vienen del scope superior

    // Mensajes WhatsApp (fuera de la transacción, no bloqueantes)
    const clientMsg = `✅ Confirmación de pedido\n\nHola ${customerNameFinal}\nTu pedido (ID: ${order.id}) fue registrado.\nTotal: $${order.total.toFixed(
      2
    )}\n\nProductos:\n${itemsMessage || "(sin detalle de productos)"}\n\nGracias por tu compra.`;

    const adminPhone = (process.env.ADMIN_PHONE || process.env.OWNER_PHONE || "").replace(/\D/g, "");
    const adminMsg = `📣 NUEVO PEDIDO\nID: ${order.id}\nCliente: ${customerNameFinal}\nTel: ${
      customerPhoneFinal || "(no provisto)"
    }\nTotal: $${order.total.toFixed(2)}\n\nProductos:\n${itemsMessage || "(sin detalle de productos)"}`;

    // Envío asincrónico (no bloquear la respuesta)
    if (customerPhoneFinal) {
      sendWhatsAppMessage(customerPhoneFinal, clientMsg)
        .then(() => console.log("WhatsApp: mensaje enviado al cliente", customerPhoneFinal))
        .catch((err) => console.error("WhatsApp (cliente) error:", err && err.message));
    } else {
      console.warn("WhatsApp: no se envió a cliente (teléfono no disponible)");
    }

    if (adminPhone) {
      sendWhatsAppMessage(adminPhone, adminMsg)
        .then(() => console.log("WhatsApp: notificación enviada al admin", adminPhone))
        .catch((err) => console.error("WhatsApp (admin) error:", err && err.message));
    } else {
      console.warn("WhatsApp: ADMIN_PHONE no configurado; no se envió notificación admin.");
    }

    return res.status(201).json({ ok: true, message: "Pedido creado", order });
  } catch (error) {
    // Si error tiene statusCode lo devolvemos con 400 (errores de validación/control)
    console.error("ERROR crear orden:", error && (error.stack || error.message || error));

    // Si es un SequelizeValidationError, extraer mensajes
    let detalle = error && error.message;
    if (error && Array.isArray(error.errors)) {
      detalle = error.errors.map((e) => e.message).join("; ");
    }

    // Si el error fue lanzado con statusCode (400), devolver 400
    if (error && error.statusCode === 400) {
      return res.status(400).json({ ok: false, error: "Error creando pedido", detalle });
    }

    return res.status(500).json({
      ok: false,
      error: "Error al crear pedido",
      detalle,
    });
  }
}

async function getOrders(req, res) {
  try {
    const userId = req.user ? req.user.id : null;

    const where = {};
    if (userId) where.userId = userId;

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Product,
          through: { attributes: ["quantity", "price"] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({ ok: true, orders });
  } catch (error) {
    console.error("ERROR obtener órdenes:", error && (error.message || error));
    return res.status(500).json({
      ok: false,
      error: "Error al obtener pedidos",
      detalle: error && error.message,
    });
  }
}

/**
 * updateOrderStatus
 * - Valida la transición (validateOrderStatusTransition)
 * - Solo admin debe llamar a la ruta (rutas lo controla)
 * - Notifica al cliente por WhatsApp del nuevo estado (no bloqueante)
 */
async function updateOrderStatus(req, res) {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const newStatus = String(status || "").toUpperCase();

    const validStates = ["PENDING", "PAID", "SHIPPED", "CANCELED"];
    if (!validStates.includes(newStatus)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ error: "Orden no encontrada" });

    const currentStatus = String(order.status || "PENDING").toUpperCase();

    const check = validateOrderStatusTransition(currentStatus, newStatus);
    if (!check.ok) {
      return res
        .status(400)
        .json({ error: "Transición inválida", detalle: check.message });
    }

    order.status = newStatus;
    await order.save();

    // Notificar cliente
    const clientPhone = (order.customerPhone || "").replace(/\D/g, "");
    if (clientPhone) {
      const msg = `🔔 Estado de tu pedido #${order.id}: ${newStatus}`;
      sendWhatsAppMessage(clientPhone, msg).catch((e) =>
        console.error("WhatsApp notify error:", e && e.message)
      );
    }

    return res.json({ ok: true, order });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res.status(500).json({ error: "Error actualizando estado" });
  }
}

//Listar transiciones permitidas (solo admin)
async function getOrderStatusTransitions(req, res) {
  try {
    return res.json({
      ok: true,
      states: Object.keys(allowedTransitions),
      transitions: allowedTransitions,
    });
  } catch (error) {
    console.error("Error obteniendo transiciones: ", error.message);
    return res.status(500).json({
      ok: false,
      error: "Error obteniendo transiciones de estado",
    });
  }
}

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderStatusTransitions,
};