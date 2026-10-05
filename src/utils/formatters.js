/**
 * Formats a numeric amount as Argentine Peso (ARS) string.
 * @param {number} amount
 * @returns {string} e.g. "$12.500"
 */
export function formatPrice(amount) {
  return '$' + Number(amount || 0).toLocaleString('es-AR');
}

/**
 * Calculates the savings between a regular price and an offer price.
 * Returns 0 if there is no regular price or no discount.
 * @param {number} regularPrice
 * @param {number} offerPrice
 * @returns {number}
 */
export function calculateSavings(regularPrice, offerPrice) {
  return Math.max(0, (regularPrice || 0) - (offerPrice || 0));
}

/**
 * Calculates the discount percentage between a regular and offer price.
 * Returns null if there is no valid discount.
 * @param {number} regularPrice
 * @param {number} offerPrice
 * @returns {number|null}
 */
export function calculateDiscountPercent(regularPrice, offerPrice) {
  if (regularPrice && regularPrice > offerPrice) {
    return Math.round((1 - offerPrice / regularPrice) * 100);
  }
  return null;
}

/**
 * Computes a human-readable label for how much time remains until an expiry date.
 * Returns null if no date is provided.
 * @param {string|null} isoDate
 * @returns {{ label: string, expired: boolean, urgent: boolean }|null}
 */
export function formatVigencia(isoDate) {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  const now = new Date();
  const diffMs = target - now;

  if (diffMs <= 0) return { label: 'Oferta finalizada', expired: true, urgent: false };

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 2) return { label: `Vence en ${diffDays} días`, expired: false, urgent: false };
  if (diffDays === 1) return { label: 'Vence mañana', expired: false, urgent: false };
  if (diffHours > 1) return { label: `¡Termina hoy! (${diffHours} hs restantes)`, expired: false, urgent: true };

  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  return { label: `¡Últimos ${diffMinutes} minutos!`, expired: false, urgent: true };
}
