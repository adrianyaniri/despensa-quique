/**
 * Sanitizes a raw phone number string to digits-only international format
 * suitable for wa.me deep links.
 *
 * Strips all non-digit characters. If the result is a 10-digit Argentine
 * mobile starting with '11', prepends '549' (country + carrier code).
 *
 * @param {string} raw
 * @returns {string} digits-only phone number
 */
export function sanitizePhoneNumber(raw) {
  let num = String(raw || '').replace(/[^0-9]/g, '');
  if (!num) return '5491170649039';
  if (num.length === 10 && num.startsWith('11')) {
    num = '549' + num;
  }
  return num;
}

/**
 * Builds a wa.me URL with an encoded text message.
 * @param {string} phoneNumber - raw or sanitized phone number
 * @param {string} message - plain text message (will be URI-encoded)
 * @returns {string} full wa.me URL
 */
export function buildWhatsAppUrl(phoneNumber, message) {
  const clean = sanitizePhoneNumber(phoneNumber);
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

/**
 * Opens a URL safely, avoiding mobile popup-blocker issues.
 * Falls back to window.location.href if window.open is blocked.
 * @param {string} url
 */
export function openUrlSafe(url) {
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = url;
    }
  } catch (e) {
    window.location.href = url;
  }
}
