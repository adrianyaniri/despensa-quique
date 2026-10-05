import { fetchProducts } from './services/products.service.js';
import { syncSettings } from './services/settings.service.js';
import { openInquiryViaWhatsApp } from './services/whatsapp.service.js';
import { cartStore } from './state/cart.state.js';
import { formatPrice } from './utils/formatters.js';
import { showToast, initCartDrawer, initHeader, initFooter } from './components/index.js';
import { CONFIG } from './config.js';

let allProducts = [];
let activeCategory = 'Todas';
let searchQuery = '';

export async function loadCatalog() {
  const listEl = document.getElementById('lista');
  if (listEl) {
    listEl.innerHTML = `
      <div class="py-12 text-center">
        <div class="inline-block w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs text-muted mt-2">Cargando catálogo...</p>
      </div>`;
  }

  allProducts = await fetchProducts();
  renderFilters();
  renderProducts();
}

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
          <h2 class="text-xs font-extrabold uppercase tracking-wider text-muted">${category}</h2>
          <span class="text-[10px] font-bold text-stone-400 bg-stone-100 rounded-full px-2 py-0.5">${items.length}</span>
        </div>
        <div class="grid grid-cols-1 gap-2.5">
          ${items.map(renderProductCard).join('')}
        </div>
      </section>
    `).join('');
  } else {
    listEl.innerHTML = `
      <div class="grid grid-cols-1 gap-2.5">
        ${filtered.map(renderProductCard).join('')}
      </div>`;
  }
}

function renderProductCard(p) {
  const isAvailable = p.disponible !== false;
  const inCart = cartStore.getQuantity(p.id);

  return `
    <div class="p-3.5 sm:p-4 rounded-2xl border border-line bg-white shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 ${
      !isAvailable ? 'opacity-50' : ''
    }">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
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
              class="w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center font-bold text-xs text-stone-700 active:scale-90 cursor-pointer">
              −
            </button>
            <span class="text-xs font-extrabold text-ink min-w-5 text-center">${inCart}</span>
            <button type="button" data-inc-id="${p.id}"
              class="w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center font-bold text-xs text-stone-700 active:scale-90 cursor-pointer">
              +
            </button>
          </div>
        `}
      </div>
    </div>
  `;
}

// Global Event Delegation for Product Cards
document.addEventListener('click', (e) => {
  const addBtn = e.target.closest('[data-add-id]');
  if (addBtn) {
    const id = addBtn.getAttribute('data-add-id');
    const prod = allProducts.find(x => x.id === id);
    if (prod) {
      cartStore.addItem({
        id: prod.id,
        title: prod.nombre,
        price: prod.precio
      }, 1);
    }
    return;
  }

  const incBtn = e.target.closest('[data-inc-id]');
  if (incBtn) {
    const id = incBtn.getAttribute('data-inc-id');
    cartStore.increment(id);
    return;
  }

  const decBtn = e.target.closest('[data-dec-id]');
  if (decBtn) {
    const id = decBtn.getAttribute('data-dec-id');
    cartStore.decrement(id);
    return;
  }

  const waInquiryBtn = e.target.closest('.btn-wa-inquiry');
  if (waInquiryBtn && !waInquiryBtn.getAttribute('href')) {
    openInquiryViaWhatsApp();
    return;
  }

  const shareBtn = e.target.closest('.btn-share-trigger');
  if (shareBtn) {
    shareCatalog();
  }
});

// Search input
const searchInput = document.getElementById('search');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderProducts();
  });
}

// Share catalog
async function shareCatalog() {
  const shareData = {
    title: `${CONFIG.NEGOCIO} — Catálogo de Precios`,
    text: `Mirá los precios actualizados y hacé tu pedido en ${CONFIG.NEGOCIO}:`,
    url: CONFIG.CATALOGO_URL || window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      showToast('¡Catálogo compartido!');
    } catch (e) {}
  } else {
    try {
      await navigator.clipboard.writeText(shareData.url);
      showToast('¡Enlace del catálogo copiado!');
    } catch (e) {
      showToast('Copiá el enlace: ' + shareData.url);
    }
  }
}

// Initialize Modular Components
initHeader({
  logoHref: '/',
  subtitle: 'Bebidas frías • Picadas • Almacén de barrio'
});

initFooter({
  showShareCard: true,
  instagramNotice: 'Seguinos para ver novedades y ofertas diarias'
});

initCartDrawer({
  itemTypeLabel: 'producto',
  itemTypeLabelPlural: 'productos',
  modalTitle: 'Tu Pedido',
  modalSubtitle: 'Revisá los productos antes de enviar',
  onCartChange: () => renderProducts()
});

loadCatalog();
syncSettings(() => {
  initHeader({
    logoHref: '/',
    subtitle: 'Bebidas frías • Picadas • Almacén de barrio'
  });
});
