import { cartStore } from '../state/cart.state.js';
import { formatPrice } from '../utils/formatters.js';
import { checkoutViaWhatsApp } from '../services/whatsapp.service.js';
import { showToast } from './toast.js';

/**
 * Initializes the unified Cart Drawer & Floating Bar.
 * Wires DOM events, listens to CartStore changes, and triggers WhatsApp checkout.
 *
 * @param {object} [options]
 * @param {string} [options.itemTypeLabel='producto'] - singular noun for items ('producto', 'promoción')
 * @param {string} [options.itemTypeLabelPlural='productos'] - plural noun for items ('productos', 'promociones')
 * @param {Function} [options.onCartChange] - callback to sync page-specific card steppers
 */
export function initCartDrawer(options = {}) {
  const itemLabelSingular = options.itemTypeLabel || 'producto';
  const itemLabelPlural = options.itemTypeLabelPlural || 'productos';
  const onCartChange = options.onCartChange;

  const cartBar = document.getElementById('cart-bar');
  const cartBadge = document.getElementById('cart-badge');
  const cartTotal = document.getElementById('cart-total');
  const cartModal = document.getElementById('cart-modal');
  const modalList = document.getElementById('cart-modal-items');
  const modalTotal = document.getElementById('cart-modal-total');
  const savingsBox = document.getElementById('cart-modal-savings-box');
  const savingsEl = document.getElementById('cart-modal-savings');
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
      if (savingsBox) savingsBox.classList.add('hidden');
      return;
    }

    if (modalTotal) modalTotal.textContent = formatPrice(snapshot.totalPrice);
    if (savingsBox && savingsEl) {
      if (snapshot.totalSavings > 0) {
        savingsBox.classList.remove('hidden');
        savingsEl.textContent = formatPrice(snapshot.totalSavings);
      } else {
        savingsBox.classList.add('hidden');
      }
    }

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
      checkoutViaWhatsApp(items, { totalSavings: cartStore.getTotalSavings() });
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
