import { fetchOffers } from './services/offers.service.js';
import { getInquiryUrl } from './services/whatsapp.service.js';
import { syncSettings } from './services/settings.service.js';
import { cartStore } from './state/cart.state.js';
import { formatPrice, formatVigencia, calculateDiscountPercent, calculateSavings } from './utils/formatters.js';
import { showToast, initCartDrawer, initSocialFooter } from './components/index.js';

let activeOffers = [];

export async function loadOfertas() {
  const container = document.getElementById('ofertas-container');
  if (!container) return;

  activeOffers = await fetchOffers();
  renderOfertas();
}

function renderOfertas() {
  const container = document.getElementById('ofertas-container');
  if (!container) return;

  const now = new Date();
  const validOffers = activeOffers.filter(o => {
    if (o.activo === false) return false;
    if (o.vigencia_hasta && new Date(o.vigencia_hasta) <= now) return false;
    return true;
  });

  if (validOffers.length === 0) {
    const inquiryUrl = getInquiryUrl('¡Hola! Quería consultar por las ofertas del día.');
    container.innerHTML = `
      <div class="p-8 text-center bg-white rounded-3xl border border-line space-y-3 shadow-2xs">
        <div class="text-4xl">⏳</div>
        <h3 class="font-extrabold text-base text-ink">No hay ofertas activas en este momento</h3>
        <p class="text-xs text-muted max-w-sm mx-auto leading-relaxed">
          Estamos preparando los próximos combos del día. Escribinos directamente por WhatsApp para consultar las próximas promociones.
        </p>
        <div class="pt-2">
          <a href="${inquiryUrl}" target="_blank" rel="noopener" class="btn-wa-inquiry inline-flex items-center gap-1.5 rounded-xl bg-wa text-white px-4 py-2.5 text-xs font-bold hover:bg-[#20ba59] transition-all shadow-xs cursor-pointer">
            <span>✆ Consultar por WhatsApp</span>
          </a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = validOffers.map(o => {
    const ahorro = calculateSavings(o.precio_regular, o.precio_oferta);
    const porcentajeOff = calculateDiscountPercent(o.precio_regular, o.precio_oferta);
    const vigenciaInfo = formatVigencia(o.vigencia_hasta);
    const inCart = cartStore.getQuantity(o.id);
    const maxStock = o.stock_limite || 99;

    return `
      <article class="bg-white rounded-3xl border border-line p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4 relative overflow-hidden group">
        <!-- Barra de Destacado / Descuento Superior -->
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            ${porcentajeOff ? `
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 uppercase tracking-tight shadow-2xs">
                🔥 -${porcentajeOff}% OFF
              </span>
            ` : `
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-tight shadow-2xs">
                ⭐ Oferta Especial
              </span>
            `}

            ${o.stock_limite ? `
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                📦 Quedan ${o.stock_limite} un.
              </span>
            ` : ''}
          </div>

          ${vigenciaInfo ? `
            <span class="inline-flex items-center gap-1 text-[11px] font-bold ${
              vigenciaInfo.urgent ? 'text-rose-600 animate-pulse' : 'text-stone-500'
            }">
              <span>⏰</span>
              <span>${vigenciaInfo.label}</span>
            </span>
          ` : ''}
        </div>

        <!-- Título y Detalle del Combo -->
        <div class="space-y-1.5">
          <h3 class="font-extrabold text-base sm:text-lg text-ink leading-snug tracking-tight">
            ${o.titulo}
          </h3>
          <p class="text-xs sm:text-sm text-stone-600 leading-relaxed">
            ${o.descripcion}
          </p>
        </div>

        <!-- Precios y Ahorro -->
        <div class="p-4 rounded-2xl bg-[#F8F6F0] border border-line/70 flex items-baseline justify-between gap-3">
          <div>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                ${formatPrice(o.precio_oferta)}
              </span>
              ${o.precio_regular ? `
                <span class="text-xs sm:text-sm text-stone-400 line-through font-semibold">
                  ${formatPrice(o.precio_regular)}
                </span>
              ` : ''}
            </div>
            ${ahorro > 0 ? `
              <p class="text-[11px] font-bold text-emerald-700 mt-0.5">
                Ahorrás ${formatPrice(ahorro)} en este combo
              </p>
            ` : ''}
          </div>

          <div class="text-right">
            <span class="text-[10px] uppercase font-bold text-muted tracking-wider block">Precio Final</span>
            <span class="text-[11px] font-medium text-stone-600">Por combo / unidad</span>
          </div>
        </div>

        <!-- Acciones: Agregar al Pedido / Stepper y Compartir -->
        <div class="flex items-center gap-2 pt-1">
          ${inCart === 0 ? `
            <button type="button" data-add-oferta="${o.id}"
              class="flex-1 rounded-2xl bg-wa hover:bg-[#20ba59] active:scale-98 text-white px-4 py-3 text-xs sm:text-sm font-black shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
              <span class="text-base font-bold">+</span>
              <span>Agregar al pedido</span>
            </button>
          ` : `
            <div class="flex-1 flex items-center justify-between bg-stone-100 rounded-2xl p-1.5 border border-stone-200">
              <button type="button" data-dec-oferta="${o.id}"
                class="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center font-bold text-base text-stone-700 active:scale-90 cursor-pointer">
                −
              </button>
              <div class="text-center px-2">
                <span class="text-[10px] uppercase font-bold text-muted block leading-none">Agregados</span>
                <span class="text-sm font-black text-ink leading-tight">${inCart} ${inCart === 1 ? 'combo' : 'combos'}</span>
              </div>
              <button type="button" data-inc-oferta="${o.id}" ${inCart >= maxStock ? 'disabled class="w-9 h-9 rounded-xl bg-stone-200 text-stone-400 flex items-center justify-center font-bold text-base cursor-not-allowed"' : 'class="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center font-bold text-base text-stone-700 active:scale-90 cursor-pointer"'}>
                +
              </button>
            </div>
          `}

          <button type="button" data-share-oferta="${o.id}" title="Compartir esta oferta"
            class="rounded-2xl border border-line bg-white hover:bg-stone-50 active:scale-95 text-stone-700 p-3 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center">
            <span>🔗</span>
          </button>
        </div>
      </article>
    `;
  }).join('');
}

async function shareOferta(oferta) {
  const url = window.location.origin + '/ofertas';
  const shareData = {
    title: `${oferta.titulo}`,
    text: `¡Mirá esta oferta! ${oferta.titulo} a sólo ${formatPrice(oferta.precio_oferta)}:`,
    url: url
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      showToast('¡Oferta compartida!');
    } catch (e) {}
  } else {
    try {
      await navigator.clipboard.writeText(`${shareData.text} ${url}`);
      showToast('¡Enlace copiado al portapapeles!');
    } catch (e) {
      showToast('Copiá el enlace: ' + url);
    }
  }
}

function updateHeaderWhatsAppLink() {
  const headerBtn = document.getElementById('btn-wa-header');
  if (headerBtn) {
    headerBtn.href = getInquiryUrl('¡Hola! Quería consultar por las ofertas del día.');
  }
}

// Card Event Delegation
document.addEventListener('click', (e) => {
  const addBtn = e.target.closest('[data-add-oferta]');
  if (addBtn) {
    e.preventDefault();
    const id = addBtn.getAttribute('data-add-oferta');
    const oferta = activeOffers.find(item => item.id === id);
    if (oferta) {
      const ok = cartStore.addItem({
        id: oferta.id,
        title: oferta.titulo,
        price: oferta.precio_oferta,
        regularPrice: oferta.precio_regular,
        maxStock: oferta.stock_limite
      }, 1);
      if (ok) showToast('¡Promo agregada al pedido!');
    }
    return;
  }

  const incBtn = e.target.closest('[data-inc-oferta]');
  if (incBtn) {
    e.preventDefault();
    const id = incBtn.getAttribute('data-inc-oferta');
    const ok = cartStore.increment(id);
    if (!ok) showToast('Alcanzaste el límite de stock de este combo', true);
    return;
  }

  const decBtn = e.target.closest('[data-dec-oferta]');
  if (decBtn) {
    e.preventDefault();
    const id = decBtn.getAttribute('data-dec-oferta');
    cartStore.decrement(id);
    return;
  }

  const shareBtn = e.target.closest('[data-share-oferta]');
  if (shareBtn) {
    e.preventDefault();
    const id = shareBtn.getAttribute('data-share-oferta');
    const oferta = activeOffers.find(item => item.id === id);
    if (oferta) shareOferta(oferta);
    return;
  }
});

// Initialization
initCartDrawer({
  itemTypeLabel: 'promoción',
  itemTypeLabelPlural: 'promociones',
  onCartChange: () => renderOfertas()
});

updateHeaderWhatsAppLink();
initSocialFooter();
loadOfertas();

syncSettings(() => {
  updateHeaderWhatsAppLink();
  renderOfertas();
});
