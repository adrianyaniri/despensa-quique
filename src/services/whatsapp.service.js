import { formatPrice } from '../utils/formatters.js';
import { buildWhatsAppUrl, openUrlSafe } from '../utils/phone.js';
import { getSettings } from './settings.service.js';
import { CONFIG } from '../config.js';

/**
 * Builds a standardized plain text message for a cart order.
 * @param {Array<{ title: string, price: number, qty: number }>} items
 * @param {object} [options]
 * @param {string} [options.greeting]
 * @param {string} [options.closing]
 * @param {number} [options.totalSavings]
 * @returns {string}
 */
export function buildOrderMessage(items, options = {}) {
  const s = getSettings();
  const negocio = CONFIG.NEGOCIO;
  const totalPrice = items.reduce((sum, item) => sum + item.qty * item.price, 0);

  const itemsText = items
    .map(i => `• ${i.qty}x *${i.title}* — ${formatPrice(i.price * i.qty)}`)
    .join('\n');

  const greeting = (options.greeting || s.mensaje_pedido_saludo || '¡Hola {negocio}! Les comparto mi pedido:').replace('{negocio}', negocio);
  const closing = options.closing || s.mensaje_pedido_pie || '¡Muchas gracias!';

  let customerInfo = '';
  if (options.customerData) {
    const { name, payment } = options.customerData;
    customerInfo = `*Datos del Cliente*\n• Nombre: ${name}\n• Entrega: Retiro en local\n• Medio de pago: ${payment === 'efectivo' ? 'Efectivo' : 'Transferencia / Alias'}\n\n`;
  }

  return `${greeting}\n\n${customerInfo}*Pedido*\n${itemsText}\n\n*Total estimado: ${formatPrice(totalPrice)}*\n\n${closing}`;
}

/**
 * Builds a general inquiry message.
 * @param {string} [customGreeting]
 * @returns {string}
 */
export function buildInquiryMessage(customGreeting) {
  const s = getSettings();
  const negocio = CONFIG.NEGOCIO;
  const template = customGreeting || s.mensaje_consulta || CONFIG.MENSAJE_CONSULTA;
  return template.replace('{negocio}', negocio);
}

/**
 * Generates direct wa.me inquiry link.
 * @param {string} [customGreeting]
 * @returns {string}
 */
export function getInquiryUrl(customGreeting) {
  const s = getSettings();
  const msg = buildInquiryMessage(customGreeting);
  return buildWhatsAppUrl(s.whatsapp_number, msg);
}

/**
 * Directly opens WhatsApp with the cart order, using safe fallback navigation.
 * @param {Array<{ title: string, price: number, qty: number }>} items
 * @param {object} [options]
 */
export function checkoutViaWhatsApp(items, options = {}) {
  const s = getSettings();
  const message = buildOrderMessage(items, options);
  const url = buildWhatsAppUrl(s.whatsapp_number, message);
  openUrlSafe(url);
}

/**
 * Directly opens WhatsApp with a general inquiry.
 * @param {string} [customGreeting]
 */
export function openInquiryViaWhatsApp(customGreeting) {
  const url = getInquiryUrl(customGreeting);
  openUrlSafe(url);
}
