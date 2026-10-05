import { cartStore } from '../state/cart.state.js';
import { formatPrice } from '../utils/formatters.js';
import { checkoutViaWhatsApp } from '../services/whatsapp.service.js';
import { showToast } from './toast.js';

/**
 * Ensures floating cart bar and dialog modal elements exist in the DOM.
 * If not present, mounts them automatically.
 */
function ensureCartDomElements(title = 'Tu Pedido', subtitle = 'Revisá los items antes de enviar') {
  if (!document.getElementById('cart-bar')) {
    const bar = document.createElement('div');
    bar.id = 'cart-bar';
    bar.className = 'fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto bg-stone-900 text-white rounded-2xl p-3 sm:p-3.5 shadow-2xl flex items-center justify-between cursor-pointer transform translate-y-36 opacity-0 pointer-events-none transition-all duration-300 border border-stone-800';
    bar.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-base shrink-0">🛒</span>
        <div class="min-w-0">
          <p id="cart-badge" class="text-xs font-bold leading-tight truncate">0 productos</p>
          <span id="cart-total" class="font-black text-sm text-emerald-400">$0</span>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" class="rounded-xl bg-wa hover:bg-[#20ba59] active:scale-95 text-white px-3.5 sm:px-4 py-2 text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-all">
          <span>Finalizar Pedido</span>
          <span class="text-sm font-bold">&rarr;</span>
        </button>
      </div>
    `;
    document.body.appendChild(bar);
  }

  if (!document.getElementById('cart-modal')) {
    const modal = document.createElement('dialog');
    modal.id = 'cart-modal';
    modal.className = 'rounded-3xl border border-line p-0 backdrop:bg-ink/40 shadow-2xl max-w-md w-[92vw] mx-auto';
    modal.innerHTML = `
      <div class="p-5 sm:p-6">
        <div class="flex items-center justify-between pb-3 border-b border-line mb-3">
          <div>
            <h3 class="font-extrabold text-base text-ink">${title}</h3>
            <p class="text-xs text-muted">${subtitle}</p>
          </div>
          <button id="close-cart-btn" type="button" class="text-stone-400 hover:text-ink text-lg leading-none font-bold p-1 cursor-pointer">✕</button>
        </div>

        <div id="cart-modal-items" class="max-h-60 overflow-y-auto no-scrollbar space-y-1 py-1"></div>

        <div class="pt-3 mt-3 border-t border-line space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-stone-600">Total estimado:</span>
            <span id="cart-modal-total" class="font-black text-lg text-ink">$0</span>
          </div>
        </div>

        <div class="pt-4 space-y-3">
          <div>
            <label class="block text-xs font-bold text-stone-600 mb-1">Nombre y Apellido</label>
            <input type="text" id="checkout-name" class="w-full rounded-xl border border-line px-3 py-2 text-sm" placeholder="Ej: Juan Pérez">
          </div>
          <div>
            <label class="block text-xs font-bold text-stone-600 mb-1">Medio de Pago</label>
            <select id="checkout-payment" class="w-full rounded-xl border border-line px-3 py-2 text-sm bg-white">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia / MercadoPago / Alias</option>
            </select>
          </div>
        </div>

        <div class="mt-4 space-y-2.5">
          <button id="checkout-btn" type="button"
            class="w-full rounded-2xl bg-wa hover:bg-[#20ba59] active:scale-95 text-white py-3.5 text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer">
            <span class="text-base">✆</span>
            <span>Enviar pedido por WhatsApp</span>
          </button>

          <div class="flex items-center justify-between pt-1">
            <button id="clear-cart-btn" type="button" class="text-[11px] text-stone-500 hover:text-rose-600 font-semibold underline cursor-pointer">
              Vaciar pedido
            </button>
            <span class="text-[10px] text-muted">Se abrirá WhatsApp listo para enviar</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

/**
 * Initializes the unified Cart Drawer & Floating Bar.
 * Wires DOM events, listens to CartStore changes, and triggers WhatsApp checkout.
 * Auto-mounts DOM elements into document.body if absent.
 *
 * @param {object} [options]
 * @param {string} [options.itemTypeLabel='producto'] - singular noun for items ('producto', 'promoción')
 * @param {string} [options.itemTypeLabelPlural='productos'] - plural noun for items ('productos', 'promociones')
 * @param {string} [options.modalTitle='Tu Pedido'] - modal header title
 * @param {string} [options.modalSubtitle='Revisá los items antes de enviar'] - modal header subtitle
 * @param {Function} [options.onCartChange] - callback to sync page-specific card steppers
 */
export function initCartDrawer(options = {}) {
  const itemLabelSingular = options.itemTypeLabel || 'producto';
  const itemLabelPlural = options.itemTypeLabelPlural || 'productos';
  const onCartChange = options.onCartChange;

  ensureCartDomElements(options.modalTitle, options.modalSubtitle);

  const cartBar = document.getElementById('cart-bar');
  const cartBadge = document.getElementById('cart-badge');
  const cartTotal = document.getElementById('cart-total');
  const cartModal = document.getElementById('cart-modal');
  const modalList = document.getElementById('cart-modal-items');
  const modalTotal = document.getElementById('cart-modal-total');
  const closeBtn = document.getElementById('close-cart-btn');
  const checkoutBtn = document.getElementById('checkout-btn');
  const clearBtn = document.getElementById('clear-cart-btn');

  function openModal() {
    if (cartModal && !cartModal.open) cartModal.showModal();
  }

  function closeModal() {
    if (cartModal && cartModal.open) cartModal.close();
  }

  function renderModal(snapshot) {
    if (!modalList) return;

    if (snapshot.isEmpty) {
      modalList.innerHTML = `<p class="text-xs text-muted text-center py-6">Tu carrito de ${itemLabelPlural} está vacío.</p>`;
      if (modalTotal) modalTotal.textContent = '$0';
      return;
    }

    if (modalTotal) modalTotal.textContent = formatPrice(snapshot.totalPrice);

    modalList.innerHTML = snapshot.items.map(item => {
      const maxStock = item.maxStock || Infinity;
      return `
        <div class="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0">
          <div class="min-w-0 flex-1">
            <p class="font-bold text-xs text-ink truncate">${item.title}</p>
            <p class="text-[11px] text-muted">${formatPrice(item.price)} c/u</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1">
              <button type="button" data-modal-dec="${item.id}"
                class="w-6 h-6 rounded bg-white shadow-2xs font-bold text-xs flex items-center justify-center cursor-pointer active:scale-90">−</button>
              <span class="text-xs font-bold min-w-4 text-center">${item.qty}</span>
              <button type="button" data-modal-inc="${item.id}" ${item.qty >= maxStock ? 'disabled class="w-6 h-6 rounded bg-stone-200 text-stone-400 font-bold text-xs flex items-center justify-center cursor-not-allowed"' : 'class="w-6 h-6 rounded bg-white shadow-2xs font-bold text-xs flex items-center justify-center cursor-pointer active:scale-90"'}">+</button>
            </div>
            <p class="font-extrabold text-xs text-ink min-w-16 text-right">${formatPrice(item.price * item.qty)}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  function handleSnapshot(snapshot) {
    if (cartBadge) {
      cartBadge.textContent = `${snapshot.totalCount} ${snapshot.totalCount === 1 ? itemLabelSingular : itemLabelPlural}`;
    }
    if (cartTotal) {
      cartTotal.textContent = formatPrice(snapshot.totalPrice);
    }

    if (cartBar) {
      if (snapshot.totalCount > 0) {
        cartBar.classList.remove('translate-y-36', 'opacity-0', 'pointer-events-none');
        cartBar.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
      } else {
        cartBar.classList.add('translate-y-36', 'opacity-0', 'pointer-events-none');
        cartBar.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
        closeModal();
      }
    }

    renderModal(snapshot);
    if (typeof onCartChange === 'function') {
      onCartChange(snapshot);
    }
  }

  // Subscribe to CartStore changes
  cartStore.subscribe(handleSnapshot);

  // Wire UI event listeners
  if (cartBar) {
    cartBar.addEventListener('click', openModal);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (cartModal) {
    cartModal.addEventListener('click', (e) => {
      if (e.target === cartModal) closeModal();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      cartStore.clear();
      showToast('Carrito vaciado');
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const items = cartStore.getItems();
      if (!items.length) {
        showToast('El carrito está vacío', true);
        return;
      }

      const name = document.getElementById('checkout-name')?.value.trim();
      const payment = document.getElementById('checkout-payment')?.value;

      if (!name) {
        showToast('Ingresá tu nombre', true);
        return;
      }

      const customerData = { name, payment };

      checkoutViaWhatsApp(items, { 
        customerData
      });
      closeModal();
      cartStore.clear();
      showToast('¡Pedido enviado a WhatsApp!');
    });
  }

  // Delegate modal + and - buttons
  if (modalList) {
    modalList.addEventListener('click', (e) => {
      const decBtn = e.target.closest('[data-modal-dec]');
      if (decBtn) {
        const id = decBtn.getAttribute('data-modal-dec');
        cartStore.decrement(id);
        return;
      }

      const incBtn = e.target.closest('[data-modal-inc]');
      if (incBtn) {
        const id = incBtn.getAttribute('data-modal-inc');
        cartStore.increment(id);
      }
    });
  }

  // Initial render
  handleSnapshot(cartStore.getSnapshot());

  return {
    open: openModal,
    close: closeModal
  };
}
