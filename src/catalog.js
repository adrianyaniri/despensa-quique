import { sbClient } from './supabase.js';
import { CONFIG } from './config.js';

let allProducts = [];
let activeCategory = 'Todas';
let searchQuery = '';
let cart = {}; // { [productId]: { product, qty } }

// Toast helper
export function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const msgEl = document.getElementById('toast-msg');
  const iconEl = document.getElementById('toast-icon');
  if (msgEl) msgEl.textContent = msg;
  if (iconEl) iconEl.textContent = isError ? '⚠' : '✓';

  toast.className = `fixed top-4 right-4 z-50 transition-all duration-300 ${isError ? 'bg-red-600' : 'bg-ink'} text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 transform translate-y-0 opacity-100 pointer-events-auto`;
  setTimeout(() => {
    toast.className = 'fixed top-4 right-4 z-50 transition-all duration-300 bg-ink text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 transform -translate-y-12 opacity-0 pointer-events-none';
  }, 2500);
}

// Format price in ARS
export function formatPrice(amount) {
  return '$' + Number(amount || 0).toLocaleString('es-AR');
}

// Load products (Supabase with menu.json fallback)
export async function loadCatalog() {
  syncRemoteSettings();
  const listEl = document.getElementById('lista');
  if (listEl) {
    listEl.innerHTML = `
      <div class="py-12 text-center">
        <div class="inline-block w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs text-muted mt-2">Cargando catálogo...</p>
      </div>`;
  }

  try {
    const { data, error } = await sbClient
      .from('productos')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Fallo Supabase, intentando menu.json local:', error);
      const res = await fetch('/menu.json');
      const fallback = await res.json();
      allProducts = fallback.map(x => ({
        id: x.id || x.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        nombre: x.nombre,
        categoria: x.categoria,
        precio: x.precio,
        descripcion: x.descripcion || '',
        disponible: x.disponible !== false
      }));
    } else {
      allProducts = data;
    }
  } catch (err) {
    console.warn('Error de red, cargando fallback menu.json:', err);
    try {
      const res = await fetch('/menu.json');
      const fallback = await res.json();
      allProducts = fallback.map(x => ({
        id: x.id || x.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        nombre: x.nombre,
        categoria: x.categoria,
        precio: x.precio,
        descripcion: x.descripcion || '',
        disponible: x.disponible !== false
      }));
    } catch (e) {
      allProducts = [];
    }
  }

  renderFilters();
  renderProducts();
}

// Render Category Filter Pills
function renderFilters() {
  const filtersEl = document.getElementById('filters');
  if (!filtersEl) return;

  const categories = ['Todas', ...new Set(allProducts.map(p => p.categoria).filter(Boolean))];
  filtersEl.innerHTML = categories.map(cat => `
    <button type="button" data-cat="${cat}" class="cat-pill shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
      cat === activeCategory
        ? 'bg-ink text-white shadow-xs'
        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
    }">
      ${cat}
    </button>
  `).join('');

  filtersEl.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.getAttribute('data-cat');
      renderFilters();
      renderProducts();
    });
  });
}

// Filter and Render Products
function renderProducts() {
  const listEl = document.getElementById('lista');
  if (!listEl) return;

  const filtered = allProducts.filter(p => {
    const matchCat = activeCategory === 'Todas' || p.categoria === activeCategory;
    const matchQuery = (p.nombre + ' ' + (p.descripcion || '') + ' ' + p.categoria).toLowerCase().includes(searchQuery);
    return matchCat && matchQuery;
  });

  if (!filtered.length) {
    listEl.innerHTML = `
      <div class="py-16 text-center text-muted">
        <p class="text-3xl mb-2">🔍</p>
        <p class="text-sm font-semibold text-ink">No encontramos productos coincidentes</p>
        <p class="text-xs mt-1">Probá con otra palabra o seleccioná otra categoría.</p>
      </div>`;
    return;
  }

  // Group by category if "Todas" is selected, else flat list
  if (activeCategory === 'Todas' && !searchQuery) {
    const grouped = {};
    filtered.forEach(p => {
      const cat = p.categoria || 'Varios';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });

    listEl.innerHTML = Object.entries(grouped).map(([category, items]) => `
      <section class="space-y-2.5">
        <div class="flex items-center gap-2 pt-2">
          <h2 class="font-extrabold text-sm uppercase tracking-wide text-stone-700">${category}</h2>
          <span class="text-[11px] text-muted font-semibold">(${items.length})</span>
        </div>
        <div class="grid grid-cols-1 gap-2.5">
          ${items.map(p => renderProductCard(p)).join('')}
        </div>
      </section>
    `).join('');
  } else {
    listEl.innerHTML = `
      <div class="grid grid-cols-1 gap-2.5">
        ${filtered.map(p => renderProductCard(p)).join('')}
      </div>`;
  }

  attachCardEvents();
}

function renderProductCard(p) {
  const isAvailable = p.disponible !== false;
  const inCart = cart[p.id]?.qty || 0;

  return `
    <div class="p-3.5 rounded-2xl bg-white border border-line shadow-xs flex items-center justify-between gap-3 ${
      !isAvailable ? 'opacity-55 grayscale' : ''
    }">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="font-bold text-sm text-ink leading-snug">${p.nombre}</span>
          ${!isAvailable ? '<span class="px-1.5 py-0.5 rounded bg-stone-200 text-stone-600 text-[10px] font-bold">Sin stock</span>' : ''}
        </div>
        ${p.descripcion ? `<p class="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">${p.descripcion}</p>` : ''}
        <p class="text-sm font-black text-ink mt-1.5">${formatPrice(p.precio)}</p>
      </div>

      <div class="shrink-0 flex items-center">
        ${!isAvailable ? `
          <button disabled class="rounded-xl bg-stone-100 text-stone-400 px-3 py-1.5 text-xs font-bold cursor-not-allowed">
            Agotado
          </button>
        ` : inCart === 0 ? `
          <button type="button" data-add-id="${p.id}"
            class="btn-add-item rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer">
            <span class="text-sm leading-none">+</span>
            <span>Agregar</span>
          </button>
        ` : `
          <div class="flex items-center gap-2 bg-stone-100 rounded-xl p-1 border border-stone-200">
            <button type="button" data-dec-id="${p.id}"
              class="btn-dec-item w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center font-bold text-xs text-stone-700 active:scale-90 cursor-pointer">
              −
            </button>
            <span class="text-xs font-extrabold text-ink min-w-5 text-center">${inCart}</span>
            <button type="button" data-inc-id="${p.id}"
              class="btn-inc-item w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center font-bold text-xs text-stone-700 active:scale-90 cursor-pointer">
              +
            </button>
          </div>
        `}
      </div>
    </div>
  `;
}

function attachCardEvents() {
  document.querySelectorAll('.btn-add-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-add-id');
      const prod = allProducts.find(x => x.id === id);
      if (prod) {
        cart[id] = { product: prod, qty: 1 };
        updateCartUI();
        renderProducts();
      }
    });
  });

  document.querySelectorAll('.btn-inc-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-inc-id');
      if (cart[id]) {
        cart[id].qty++;
        updateCartUI();
        renderProducts();
      }
    });
  });

  document.querySelectorAll('.btn-dec-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-dec-id');
      if (cart[id]) {
        cart[id].qty--;
        if (cart[id].qty <= 0) {
          delete cart[id];
        }
        updateCartUI();
        renderProducts();
      }
    });
  });
}

// Cart UI State & Bottom Sheet
function updateCartUI() {
  const items = Object.values(cart);
  const totalCount = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.qty * item.product.precio, 0);

  const cartBar = document.getElementById('cart-bar');
  const cartBadge = document.getElementById('cart-badge');
  const cartTotal = document.getElementById('cart-total');

  if (cartBadge) cartBadge.textContent = `${totalCount} ${totalCount === 1 ? 'producto' : 'productos'}`;
  if (cartTotal) cartTotal.textContent = formatPrice(totalPrice);

  if (totalCount > 0) {
    if (cartBar) {
      cartBar.classList.remove('translate-y-36', 'translate-y-28', 'translate-y-24', 'opacity-0', 'pointer-events-none');
      cartBar.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
    }
  } else {
    if (cartBar) {
      cartBar.classList.add('translate-y-36', 'opacity-0', 'pointer-events-none');
      cartBar.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
    }
    closeCartModal();
  }

  renderCartModal();
}

function renderCartModal() {
  const modalList = document.getElementById('cart-modal-items');
  const modalTotal = document.getElementById('cart-modal-total');
  if (!modalList) return;

  const items = Object.values(cart);
  if (!items.length) {
    modalList.innerHTML = '<p class="text-xs text-muted text-center py-6">Tu carrito está vacío.</p>';
    if (modalTotal) modalTotal.textContent = '$0';
    return;
  }

  const totalPrice = items.reduce((sum, item) => sum + item.qty * item.product.precio, 0);
  if (modalTotal) modalTotal.textContent = formatPrice(totalPrice);

  modalList.innerHTML = items.map(({ product, qty }) => `
    <div class="flex items-center justify-between gap-3 py-2 border-b border-line last:border-0">
      <div class="min-w-0 flex-1">
        <p class="font-bold text-xs text-ink truncate">${product.nombre}</p>
        <p class="text-[11px] text-muted">${formatPrice(product.precio)} c/u</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1">
          <button type="button" data-modal-dec="${product.id}" class="w-6 h-6 rounded bg-white shadow-2xs font-bold text-xs flex items-center justify-center cursor-pointer">−</button>
          <span class="text-xs font-bold min-w-4 text-center">${qty}</span>
          <button type="button" data-modal-inc="${product.id}" class="w-6 h-6 rounded bg-white shadow-2xs font-bold text-xs flex items-center justify-center cursor-pointer">+</button>
        </div>
        <p class="font-extrabold text-xs text-ink min-w-16 text-right">${formatPrice(product.precio * qty)}</p>
      </div>
    </div>
  `).join('');

  modalList.querySelectorAll('[data-modal-dec]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-modal-dec');
      if (cart[id]) {
        cart[id].qty--;
        if (cart[id].qty <= 0) delete cart[id];
        updateCartUI();
        renderProducts();
      }
    });
  });

  modalList.querySelectorAll('[data-modal-inc]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-modal-inc');
      if (cart[id]) {
        cart[id].qty++;
        updateCartUI();
        renderProducts();
      }
    });
  });
}

function openCartModal() {
  const modal = document.getElementById('cart-modal');
  if (modal) modal.showModal();
}

function closeCartModal() {
  const modal = document.getElementById('cart-modal');
  if (modal && modal.open) modal.close();
}

function getActiveSettings() {
  const cached = localStorage.getItem('quique_settings');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return {
        whatsapp_number: parsed.whatsapp_number || CONFIG.WHATSAPP_NUMBER,
        mensaje_consulta: parsed.mensaje_consulta || CONFIG.MENSAJE_CONSULTA.replace('{negocio}', CONFIG.NEGOCIO),
        mensaje_pedido_saludo: parsed.mensaje_pedido_saludo || CONFIG.MENSAJE_PEDIDO.saludo.replace('{negocio}', CONFIG.NEGOCIO),
        mensaje_pedido_pie: parsed.mensaje_pedido_pie || CONFIG.MENSAJE_PEDIDO.pie,
      };
    } catch (e) {}
  }
  return {
    whatsapp_number: CONFIG.WHATSAPP_NUMBER,
    mensaje_consulta: CONFIG.MENSAJE_CONSULTA.replace('{negocio}', CONFIG.NEGOCIO),
    mensaje_pedido_saludo: CONFIG.MENSAJE_PEDIDO.saludo.replace('{negocio}', CONFIG.NEGOCIO),
    mensaje_pedido_pie: CONFIG.MENSAJE_PEDIDO.pie,
  };
}

async function syncRemoteSettings() {
  try {
    const { data } = await sbClient.from('configuracion').select('*').eq('id', 'general').single();
    if (data) {
      localStorage.setItem('quique_settings', JSON.stringify(data));
    }
  } catch (e) {}
}

// WhatsApp Order Checkout
function sendWhatsAppOrder() {
  const items = Object.values(cart);
  if (!items.length) {
    showToast('El carrito está vacío', true);
    return;
  }

  const s = getActiveSettings();
  const totalPrice = items.reduce((sum, item) => sum + item.qty * item.product.precio, 0);
  const itemsText = items
    .map(i => `• ${i.qty}x ${i.product.nombre} — ${formatPrice(i.product.precio * i.qty)}`)
    .join('\n');

  const greeting = s.mensaje_pedido_saludo.replace('{negocio}', CONFIG.NEGOCIO);
  const closing = s.mensaje_pedido_pie;
  const message = `${greeting}\n\n${itemsText}\n\n*Total estimado: ${formatPrice(totalPrice)}*\n\n${closing}`;

  const url = `https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

// WhatsApp Direct Inquiry
function openWhatsAppInquiry() {
  const s = getActiveSettings();
  const greeting = s.mensaje_consulta.replace('{negocio}', CONFIG.NEGOCIO);
  const url = `https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(greeting)}`;
  window.open(url, '_blank');
}

// Web Share API with Clipboard Fallback
export async function shareCatalog() {
  const shareData = {
    title: `${CONFIG.NEGOCIO} — Catálogo de Precios`,
    text: `Mirá los precios actualizados y hacé tu pedido en ${CONFIG.NEGOCIO}:`,
    url: CONFIG.CATALOGO_URL || window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      showToast('¡Catálogo compartido!');
    } catch (e) {
      // User dismissed or share error
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareData.url);
      showToast('¡Enlace del catálogo copiado!');
    } catch (e) {
      showToast('Copiá el enlace: ' + shareData.url);
    }
  }
}

// Search Input Listener
const searchInput = document.getElementById('search');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderProducts();
  });
}

// Share Buttons Listeners
document.querySelectorAll('.btn-share-trigger').forEach(btn => {
  btn.addEventListener('click', shareCatalog);
});

// WhatsApp Inquiry Buttons
document.querySelectorAll('.btn-wa-inquiry').forEach(btn => {
  btn.addEventListener('click', openWhatsAppInquiry);
});

// Cart Bar click -> Open Cart Modal
const cartBar = document.getElementById('cart-bar');
if (cartBar) {
  cartBar.addEventListener('click', openCartModal);
}

const closeCartBtn = document.getElementById('close-cart-btn');
if (closeCartBtn) {
  closeCartBtn.addEventListener('click', closeCartModal);
}

const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', sendWhatsAppOrder);
}

const clearCartBtn = document.getElementById('clear-cart-btn');
if (clearCartBtn) {
  clearCartBtn.addEventListener('click', () => {
    cart = {};
    updateCartUI();
    renderProducts();
    showToast('Carrito vaciado');
  });
}

// Initialize
loadCatalog();
