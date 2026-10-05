import { initAdminAuth } from './pages/admin/admin-auth.js';
import { initAdminSettings } from './pages/admin/admin-settings.js';
import { initAdminProducts, loadProducts } from './pages/admin/admin-products.js';
import { initAdminOffers, loadOfertas } from './pages/admin/admin-offers.js';
import { initAdminPosters, setupPrintPoster } from './pages/admin/admin-poster.js';

// ================== GESTIÓN DE PESTAÑAS (TABS) ==================
function initAdminTabs() {
  const tabProducts = document.getElementById('tab-btn-products');
  const tabOfertas = document.getElementById('tab-btn-ofertas');
  const tabPosters = document.getElementById('tab-btn-posters');

  const secProducts = document.getElementById('section-products');
  const secOfertas = document.getElementById('section-ofertas');
  const secPosters = document.getElementById('section-posters');

  function switchTab(target) {
    [tabProducts, tabOfertas, tabPosters].forEach(btn => {
      if (!btn) return;
      btn.className = 'tab-nav-btn px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 border-transparent text-stone-500 hover:text-ink flex items-center gap-1.5 cursor-pointer transition-all';
    });

    if (secProducts) secProducts.classList.add('hidden');
    if (secOfertas) secOfertas.classList.add('hidden');
    if (secPosters) secPosters.classList.add('hidden');

    if (target === 'products') {
      if (tabProducts) tabProducts.className = 'tab-nav-btn px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 border-ink text-ink flex items-center gap-1.5 cursor-pointer transition-all';
      if (secProducts) secProducts.classList.remove('hidden');
    } else if (target === 'ofertas') {
      if (tabOfertas) tabOfertas.className = 'tab-nav-btn px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 border-amber-600 text-amber-700 flex items-center gap-1.5 cursor-pointer transition-all';
      if (secOfertas) secOfertas.classList.remove('hidden');
    } else if (target === 'posters') {
      if (tabPosters) tabPosters.className = 'tab-nav-btn px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 border-ink text-ink flex items-center gap-1.5 cursor-pointer transition-all';
      if (secPosters) secPosters.classList.remove('hidden');
    }
  }

  if (tabProducts) tabProducts.addEventListener('click', () => switchTab('products'));
  if (tabOfertas) tabOfertas.addEventListener('click', () => switchTab('ofertas'));
  if (tabPosters) tabPosters.addEventListener('click', () => switchTab('posters'));
}

// Menú Desplegable de Ajustes Admin
const adminMenu = document.getElementById('admin-menu-dropdown');
if (adminMenu) {
  document.addEventListener('click', (e) => {
    if (adminMenu.open && !adminMenu.contains(e.target)) {
      adminMenu.removeAttribute('open');
    }
  });
  adminMenu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      adminMenu.removeAttribute('open');
    });
  });
}

// ================== ORQUESTACIÓN PRINCIPAL ==================
initAdminTabs();
initAdminProducts();
initAdminOffers();
initAdminSettings(() => setupPrintPoster('precios'));
initAdminPosters();

initAdminAuth({
  onLogin: () => {
    loadProducts();
    loadOfertas();
    setupPrintPoster('precios');
  },
  onLogout: () => {
    // Session reset if needed
  }
});
