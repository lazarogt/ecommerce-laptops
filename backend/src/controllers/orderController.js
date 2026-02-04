// backend/src/controllers/orderController.js
const { Order, Product } = require("../models");
const sequelize = require("../config/database");
const { sendWhatsAppMessage } = require("../services/whatsappService");
const {
  validateOrderStatusTransition,
  allowedTransitions,
} = require("../utils/orderStatus");

/**
 * createOrder
 * - Acepta body con:
 *    - products: [{ productId, quantity }, ...]  <-- preferido
 *    - o items: [{ productId, quantity }, ...]     <-- alternativa
 *  O en modo simple:
 *    - customerName, customerPhone, total
 */

async function createOrder(req, res) {
  const t = await sequelize.transaction();
  try {
    const userId = req.user ? req.user.id : null;
    const { customerName, customerPhone, total: totalFromBody } = req.body;

    // aceptar products o items (tolerante)
    const productsInput = req.body.products || req.body.items || [];

    // si no hay productos y tampoco datos simples -> error
    if (
      (!productsInput || productsInput.length === 0) &&
      (!customerName || !customerPhone || !totalFromBody)
    ) {
      await t.rollback();
      return res.status(400).json({
        ok: false,
        error:
          "Datos incompletos: enviar products/items o customerName+customerPhone+total",
      });
    }

    // Normalizar datos de cliente
    const customerNameFinal =
      (customerName && String(customerName).trim()) ||
      (req.user && req.user.name) ||
      "Cliente";
    const customerPhoneFinal =
      (customerPhone && String(customerPhone).replace(/\D/g, "")) ||
      (req.user && req.user.phone) ||
      "";

    // Crear orden preliminar
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

    // Si vienen productos/items -> procesarlos (modo ecommerce)
    if (
      productsInput &&
      Array.isArray(productsInput) &&
      productsInput.length > 0
    ) {
      for (const it of productsInput) {
        const productId = it.productId || it.id;
        const quantity = Number(it.quantity) || 0;
        if (!productId || quantity <= 0) {
          await t.rollback();
          return res.status(400).json({
            ok: false,
            error: "products/items inválidos (productId y quantity > 0)",
          });
        }

        // Obtener producto y verificar stock
        const product = await Product.findByPk(productId, { transaction: t });
        if (!product) {
          await t.rollback();
          return res.status(400).json({
            ok: false,
            error: `Producto no encontrado (id: ${productId})`,
          });
        }

        if (product.stock < quantity) {
          await t.rollback();
          return res.status(400).json({
            ok: false,
            error: `Stock insuficiente para producto ${product.name} (id: ${productId})`,
          });
        }

        // Calcular línea y agregar al total
        const linePrice = Number(product.price) * quantity;
        total += linePrice;

        // Agregar relación many-to-many con through { quantity, price }
        await order.addProduct(product, {
          through: { quantity, price: product.price },
          transaction: t,
        });

        // Descontar stock
        product.stock = product.stock - quantity;
        await product.save({ transaction: t });

        itemsMessage += `- ${product.name} x${quantity} → $${Number(
          product.price
        ).toFixed(2)}\n`;
      }
    } else {
      // Modo simple (sin detalle de productos)
      total = Number(totalFromBody) || 0;
    }

    // Guardar total y confirmar
    order.total = total;
    await order.save({ transaction: t });
    await t.commit();

    // Mensajes WhatsApp (no bloqueantes)
    const clientMsg = `✅ Confirmación de pedido\n\nHola ${customerNameFinal}\nTu pedido (ID: ${
      order.id
    }) fue registrado.\nTotal: $${order.total.toFixed(
      2
    )}\n\nGracias por tu compra.`;
    const adminPhone = (
      process.env.ADMIN_PHONE ||
      process.env.OWNER_PHONE ||
      ""
    ).replace(/\D/g, "");
    const adminMsg = `📣 NUEVO PEDIDO\nID: ${
      order.id
    }\nCliente: ${customerNameFinal}\nTel: ${
      customerPhoneFinal || "(no provisto)"
    }\nTotal: $${order.total.toFixed(2)}\n\nProductos:\n${
      itemsMessage || "(sin detalle de productos)"
    }`;

    const normalizePhone = (phone = "") => phone.replace(/\D/g, "");
    customerPhoneFinal = normalizePhone(customerPhone || req.user?.phone);

    if (customerPhoneFinal) {
      sendWhatsAppMessage(customerPhoneFinal, clientMsg)
        .then(() =>
          console.log(
            "WhatsApp: mensaje enviado al cliente",
            customerPhoneFinal
          )
        )
        .catch((err) =>
          console.error("WhatsApp (cliente) error:", err && err.message)
        );
    } else {
      console.warn("WhatsApp: no se envió a cliente (teléfono no disponible)");
    }

    if (adminPhone) {
      sendWhatsAppMessage(adminPhone, adminMsg)
        .then(() =>
          console.log("WhatsApp: notificación enviada al admin", adminPhone)
        )
        .catch((err) =>
          console.error("WhatsApp (admin) error:", err && err.message)
        );
    } else {
      console.warn(
        "WhatsApp: ADMIN_PHONE no configurado; no se envió notificación admin."
      );
    }

    return res.status(201).json({ ok: true, message: "Pedido creado", order });
  } catch (error) {
    await t.rollback();
    console.error("ERROR crear orden:", error && (error.message || error));
    return res.status(500).json({
      ok: false,
      error: "Error al crear pedido",
      detalle: error && error.message,
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
