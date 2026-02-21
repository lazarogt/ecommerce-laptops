// backend/src/utils/orderStatus.js

const allowedTransitions = {
  PENDING: ["PAID", "CANCELED"],
  PAID: ["SHIPPED", "CANCELED"],
  SHIPPED: [], 
  CANCELED: [], 
};

function validateOrderStatusTransition(current, next) {
  if (!current || !next) {
    return { ok: false, message: "Estados inválidos" };
  }

  const cur = String(current).toUpperCase();
  const nxt = String(next).toUpperCase();

  if (cur === nxt) {
    return { ok: false, message: "El pedido ya tiene ese estado" };
  }

  if (!Object.prototype.hasOwnProperty.call(allowedTransitions, cur)) {
    return { ok: false, message: `Estado actual no reconocido: ${cur}` };
  }

  if (!Object.prototype.hasOwnProperty.call(allowedTransitions, nxt)) {
    return { ok: false, message: `Estado objetivo no reconocido: ${nxt}` };
  }

  const allowed = allowedTransitions[cur] || [];
  if (allowed.includes(nxt)) {
    return { ok: true };
  }

  return {
    ok: false,
    message: `Transición no permitida: ${cur} → ${nxt}`,
  };
}

module.exports = {
  validateOrderStatusTransition,
  allowedTransitions,
};
