/**
 * Ensures the toast container element exists in the DOM.
 * @returns {HTMLElement}
 */
function ensureToastElement() {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'fixed top-4 right-4 left-4 sm:left-auto sm:max-w-xs z-50 transform -translate-y-12 opacity-0 pointer-events-none transition-all duration-300 bg-ink text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2';
    toast.innerHTML = '<span id="toast-icon">✓</span><span id="toast-msg">Acción completada</span>';
    document.body.appendChild(toast);
  }
  return toast;
}

/**
 * Reusable accessible toast notification component.
 * Auto-mounts DOM elements if missing.
 * @param {string} msg - notification message
 * @param {boolean} [isError=false] - whether this is an error alert
 */
export function showToast(msg, isError = false) {
  const toast = ensureToastElement();
  const msgEl = document.getElementById('toast-msg');
  const iconEl = document.getElementById('toast-icon');

  if (msgEl) msgEl.textContent = msg;
  if (iconEl) iconEl.textContent = isError ? '⚠' : '✓';

  toast.className = `fixed top-4 right-4 left-4 sm:left-auto sm:max-w-xs z-50 transition-all duration-300 ${
    isError ? 'bg-red-600' : 'bg-ink'
  } text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 transform translate-y-0 opacity-100 pointer-events-auto`;

  if (toast._timer) clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.className = 'fixed top-4 right-4 left-4 sm:left-auto sm:max-w-xs z-50 transition-all duration-300 bg-ink text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 transform -translate-y-12 opacity-0 pointer-events-none';
  }, 2500);
}
