import { fetchOffers, saveOffer as apiSaveOffer, toggleOfferActive, deleteOffer as apiDeleteOffer } from '../../services/offers.service.js';
import { fetchProducts } from '../../services/products.service.js';
import { showToast } from '../../components/toast.js';

let ofertas = [];
let availableProducts = [];
let currentComboItems = []; // Array of { id, nombre, precio, qty }

export async function loadOfertas() {
  const table = document.getElementById('ofertas-table');
  if (!table) return;

  ofertas = await fetchOffers();
  renderOfertasStats();
  renderOfertas();
}

function renderOfertasStats() {
  const now = new Date();
  const activeCount = ofertas.filter(o => o.activo !== false && (!o.vigencia_hasta || new Date(o.vigencia_hasta) > now)).length;
  const elStat = document.getElementById('stat-ofertas');
  const badgeOfertas = document.getElementById('tab-badge-ofertas');

  if (elStat) elStat.textContent = activeCount;
  if (badgeOfertas) badgeOfertas.textContent = ofertas.length;
}

function renderOfertas() {
  const table = document.getElementById('ofertas-table');
  if (!table) return;

  if (ofertas.length === 0) {
    table.innerHTML = `
      <div class="p-8 text-center text-xs text-muted space-y-2">
        <p>No tenés ofertas ni combos cargados todavía.</p>
        <p>Hacé clic en <strong>+ Nueva Oferta</strong> para publicar tu primera promoción.</p>
      </div>`;
    return;
  }

  const now = new Date();

  table.innerHTML = ofertas.map(o => {
    const isExpired = o.vigencia_hasta && new Date(o.vigencia_hasta) <= now;
    const isActiva = o.activo !== false && !isExpired;
    const discount = (o.precio_regular && o.precio_regular > o.precio_oferta)
      ? Math.round((1 - o.precio_oferta / o.precio_regular) * 100)
      : null;

    let vigenciaText = 'Sin vencimiento';
    if (o.vigencia_hasta) {
      const d = new Date(o.vigencia_hasta);
      vigenciaText = isExpired ? 'Vencida' : `Hasta ${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return `
      <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/80 transition-colors">
        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h4 class="font-bold text-sm text-ink truncate">${o.titulo}</h4>
            ${isActiva ? `
              <span class="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                ● Activa
              </span>
            ` : isExpired ? `
              <span class="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10px] font-bold">
                ⏰ Vencida
              </span>
            ` : `
              <span class="rounded-full bg-stone-100 text-stone-500 border border-stone-200 px-2 py-0.5 text-[10px] font-bold">
                Pausada
              </span>
            `}

            ${discount ? `
              <span class="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-black">
                -${discount}% OFF
              </span>
            ` : ''}

            ${o.stock_limite ? `
              <span class="rounded-full bg-stone-100 text-stone-600 px-2 py-0.5 text-[10px] font-medium">
                Stock: ${o.stock_limite} un.
              </span>
            ` : ''}
          </div>

          <p class="text-xs text-muted line-clamp-2">${o.descripcion}</p>

          <div class="flex items-center gap-3 text-[11px] text-stone-500 pt-0.5">
            <span class="font-bold text-ink text-xs">$${Number(o.precio_oferta).toLocaleString('es-AR')}</span>
            ${o.precio_regular ? `<span class="line-through text-stone-400">$${Number(o.precio_regular).toLocaleString('es-AR')}</span>` : ''}
            <span>•</span>
            <span>📅 ${vigenciaText}</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          <button type="button" data-toggle-oferta="${o.id}" title="${o.activo ? 'Pausar oferta' : 'Activar oferta'}"
            class="rounded-xl border border-line px-2.5 py-1.5 text-xs font-semibold hover:bg-white active:scale-95 transition-all cursor-pointer shadow-2xs">
            ${o.activo ? '⏸ Pausar' : '▶ Activar'}
          </button>

          <button type="button" data-edit-oferta="${o.id}" title="Editar oferta"
            class="rounded-xl border border-line px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-white active:scale-95 transition-all cursor-pointer shadow-2xs">
            ✏️ Editar
          </button>

          <button type="button" data-delete-oferta="${o.id}" title="Eliminar oferta"
            class="rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 px-2.5 py-1.5 text-xs font-semibold text-rose-700 active:scale-95 transition-all cursor-pointer shadow-2xs">
            🗑
          </button>
        </div>
      </div>
    `;
  }).join('');

  table.querySelectorAll('[data-toggle-oferta]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-toggle-oferta');
      const oferta = ofertas.find(o => o.id === id);
      if (!oferta) return;

      const nuevoEstado = !oferta.activo;
      oferta.activo = nuevoEstado;
      await toggleOfferActive(id, nuevoEstado);

      showToast(nuevoEstado ? 'Oferta activada' : 'Oferta pausada');
      renderOfertasStats();
      renderOfertas();
    });
  });

  table.querySelectorAll('[data-edit-oferta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-oferta');
      const oferta = ofertas.find(o => o.id === id);
      if (oferta) openOfertaModal(oferta);
    });
  });

  table.querySelectorAll('[data-delete-oferta]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-oferta');
      if (!confirm('¿Estás seguro de que querés eliminar esta oferta?')) return;

      await apiDeleteOffer(id);
      ofertas = ofertas.filter(o => o.id !== id);
      showToast('Oferta eliminada');
      renderOfertasStats();
      renderOfertas();
    });
  });
}

let selectedProductForCombo = null;
let selectedComboMode = 'unit'; // 'unit' | 'weight'
let activeSearchCat = 'Todas';

export async function refreshComboProducts() {
  try {
    availableProducts = await fetchProducts();
    availableProducts.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
  } catch (e) {
    console.error('Error refreshing combo products:', e);
  }
}

function renderSearchResults(query = '') {
  const resultsContainer = document.getElementById('combo-search-results');
  if (!resultsContainer) return;

  const q = query.trim().toLowerCase();
  const categories = ['Todas', ...new Set(availableProducts.map(p => p.categoria).filter(Boolean))];

  const filtered = availableProducts.filter(p => {
    const matchesCat = activeSearchCat === 'Todas' || p.categoria === activeSearchCat;
    if (!matchesCat) return false;
    if (!q) return true;
    return (
      (p.nombre || '').toLowerCase() + ' ' +
      (p.categoria || '').toLowerCase() + ' ' +
      (p.descripcion || '').toLowerCase()
    ).includes(q);
  });

  const categoryChipsHtml = `
    <div class="p-2.5 border-b border-stone-100 bg-stone-50/95 flex flex-col gap-1.5 sticky top-0 z-10 backdrop-blur-xs">
      <div class="flex items-center justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wider">
        <span>Catálogo Maestro</span>
        <span class="text-ink font-extrabold">${filtered.length} de ${availableProducts.length} productos</span>
      </div>
      <div class="flex flex-wrap gap-1.5 py-1 max-h-28 overflow-y-auto">
        ${categories.map(c => `
          <button type="button" data-filter-cat="${c}"
            class="combo-cat-chip rounded-full px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
              c === activeSearchCat
                ? 'bg-ink text-white shadow-2xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }">${c}</button>
        `).join('')}
      </div>
    </div>
  `;

  if (filtered.length === 0) {
    resultsContainer.innerHTML = `
      ${categoryChipsHtml}
      <div class="py-8 px-4 text-center text-xs text-muted">
        No se encontraron productos coincidentes en esta categoría.
      </div>
    `;
    attachSearchEvents(resultsContainer, query);
    resultsContainer.classList.remove('hidden');
    return;
  }

  resultsContainer.innerHTML = `
    ${categoryChipsHtml}
    <div class="divide-y divide-stone-100 max-h-60 overflow-y-auto">
      ${filtered.map(p => {
        const isPesable = p.unidad === 'kg' || (p.categoria || '').toLowerCase() === 'fiambres' || (p.categoria || '').toLowerCase().includes('queso');
        return `
          <button type="button" data-select-prod-id="${p.id}"
            class="w-full text-left px-3 py-2.5 hover:bg-amber-50/80 flex items-center justify-between gap-2 transition-colors cursor-pointer text-xs">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-bold text-ink truncate">${p.nombre}</span>
                <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                  isPesable ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-stone-100 text-stone-600'
                }">
                  ${isPesable ? '⚖️ Pesable / kg' : p.categoria}
                </span>
              </div>
              ${p.descripcion ? `<p class="text-[10px] text-muted truncate mt-0.5">${p.descripcion}</p>` : ''}
            </div>
            <div class="shrink-0 text-right">
              <span class="font-black text-ink text-xs">$${Number(p.precio).toLocaleString('es-AR')}</span>
              <span class="text-[10px] text-stone-400 block">${isPesable ? '/kg' : 'c/u'}</span>
            </div>
          </button>
        `;
      }).join('')}
    </div>
  `;

  attachSearchEvents(resultsContainer, query);
  resultsContainer.classList.remove('hidden');
}

function attachSearchEvents(resultsContainer, currentQuery) {
  resultsContainer.querySelectorAll('.combo-cat-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      activeSearchCat = btn.getAttribute('data-filter-cat');
      renderSearchResults(currentQuery);
    });
  });

  resultsContainer.querySelectorAll('[data-select-prod-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-select-prod-id');
      const prod = availableProducts.find(x => x.id === id);
      if (prod) selectComboProduct(prod);
    });
  });
}

function selectComboProduct(prod) {
  selectedProductForCombo = prod;

  const isPesable = prod.unidad === 'kg' || (prod.categoria || '').toLowerCase() === 'fiambres' || (prod.categoria || '').toLowerCase().includes('queso');
  selectedComboMode = isPesable ? 'weight' : 'unit';

  const resultsContainer = document.getElementById('combo-search-results');
  const searchInput = document.getElementById('combo-search-input');
  const searchClear = document.getElementById('combo-search-clear');
  const panel = document.getElementById('combo-selected-panel');
  const name = document.getElementById('combo-selected-name');

  if (resultsContainer) resultsContainer.classList.add('hidden');
  if (searchInput) searchInput.value = '';
  if (searchClear) searchClear.classList.add('hidden');
  if (!panel) return;

  if (name) name.textContent = prod.nombre;

  updateModeUI();
  panel.classList.remove('hidden');
}

function setComboMode(mode) {
  selectedComboMode = mode;
  updateModeUI();
}

function updateModeUI() {
  if (!selectedProductForCombo) return;
  const prod = selectedProductForCombo;

  const btnUnit = document.getElementById('btn-mode-unit');
  const btnWeight = document.getElementById('btn-mode-weight');
  const badge = document.getElementById('combo-selected-badge');
  const price = document.getElementById('combo-selected-price');
  const unitWrapper = document.getElementById('combo-input-unit-wrapper');

  if (btnUnit && btnWeight) {
    if (selectedComboMode === 'weight') {
      btnWeight.className = 'px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer bg-amber-500 text-white shadow-2xs';
      btnUnit.className = 'px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-stone-500 hover:text-stone-800';
    } else {
      btnUnit.className = 'px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer bg-white text-stone-800 shadow-2xs';
      btnWeight.className = 'px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-stone-500 hover:text-stone-800';
    }
  }

  if (badge) {
    if (selectedComboMode === 'weight') {
      badge.textContent = '⚖️ Por Peso (Gramos)';
      badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300';
    } else {
      badge.textContent = '📦 Por Unidad (c/u)';
      badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 text-stone-700 border border-stone-200';
    }
  }

  if (price) {
    if (selectedComboMode === 'weight') {
      price.textContent = `$${Number(prod.precio).toLocaleString('es-AR')} por kilo ($/kg) — mínimo 100g`;
    } else {
      price.textContent = `$${Number(prod.precio).toLocaleString('es-AR')} por unidad`;
    }
  }

  if (unitWrapper) {
    if (selectedComboMode === 'weight') {
      unitWrapper.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-stone-700">Gramos a incluir:</span>
            <div class="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-xl">
              <input id="combo-product-grams" type="number" min="100" step="50" value="200"
                class="w-16 bg-white border border-stone-200 rounded px-1 text-xs font-black text-center text-ink outline-none" />
              <span class="text-xs text-stone-600 font-bold">gramos</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span class="text-[10px] font-bold text-stone-400 mr-0.5">Atajos:</span>
            <button type="button" data-gram-val="100" class="btn-quick-gram px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 cursor-pointer">100g</button>
            <button type="button" data-gram-val="150" class="btn-quick-gram px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 cursor-pointer">150g</button>
            <button type="button" data-gram-val="200" class="btn-quick-gram px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 cursor-pointer">200g</button>
            <button type="button" data-gram-val="250" class="btn-quick-gram px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 cursor-pointer">250g</button>
            <button type="button" data-gram-val="300" class="btn-quick-gram px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 cursor-pointer">300g</button>
            <button type="button" data-gram-val="500" class="btn-quick-gram px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 cursor-pointer">500g</button>
          </div>
        </div>
      `;

      const gramsInput = document.getElementById('combo-product-grams');
      if (gramsInput) {
        gramsInput.addEventListener('input', updateSelectedSubtotalPreview);
      }
      unitWrapper.querySelectorAll('.btn-quick-gram').forEach(b => {
        b.addEventListener('click', () => {
          if (gramsInput) {
            gramsInput.value = b.getAttribute('data-gram-val');
            updateSelectedSubtotalPreview();
          }
        });
      });
    } else {
      unitWrapper.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-stone-700">Cantidad a incluir:</span>
          <div class="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-xl">
            <input id="combo-product-qty" type="number" min="1" max="99" value="1"
              class="w-14 bg-white border border-stone-200 rounded px-1 text-xs font-black text-center text-ink outline-none" />
            <span class="text-xs text-stone-600 font-bold">unidades</span>
          </div>
        </div>
      `;

      const qtyInput = document.getElementById('combo-product-qty');
      if (qtyInput) {
        qtyInput.addEventListener('input', updateSelectedSubtotalPreview);
      }
    }
  }

  updateSelectedSubtotalPreview();
}

function updateSelectedSubtotalPreview() {
  const preview = document.getElementById('combo-item-subtotal-preview');
  if (!preview || !selectedProductForCombo) return;

  let subtotal = 0;
  if (selectedComboMode === 'weight') {
    const gramsInput = document.getElementById('combo-product-grams');
    const grams = parseInt(gramsInput?.value, 10) || 100;
    subtotal = Math.round((selectedProductForCombo.precio / 1000) * grams);
  } else {
    const qtyInput = document.getElementById('combo-product-qty');
    const qty = parseInt(qtyInput?.value, 10) || 1;
    subtotal = Math.round(selectedProductForCombo.precio * qty);
  }

  preview.textContent = `$${subtotal.toLocaleString('es-AR')}`;
}

function deselectComboProduct() {
  selectedProductForCombo = null;
  const panel = document.getElementById('combo-selected-panel');
  if (panel) panel.classList.add('hidden');
}

function renderComboItems() {
  const container = document.getElementById('combo-items-list');
  if (!container) return;

  if (currentComboItems.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = currentComboItems.map((item, idx) => {
    const isKg = item.unidad === 'kg';
    const badgeText = isKg ? `${item.gramos}g` : `${item.qty}x`;
    const subtotal = item.subtotal || (isKg ? Math.round((item.precio / 1000) * item.gramos) : Math.round(item.precio * item.qty));

    return `
      <div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-stone-200 text-xs shadow-2xs">
        <div class="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <span class="px-2 py-0.5 rounded-lg ${isKg ? 'bg-amber-200 text-amber-950' : 'bg-amber-100 text-amber-900'} font-extrabold text-[11px] shrink-0">
            ${badgeText}
          </span>
          <span class="font-bold text-ink truncate">${item.nombre}</span>
          <span class="text-[11px] text-muted shrink-0">($${subtotal.toLocaleString('es-AR')})</span>
        </div>
        <button type="button" data-remove-combo-idx="${idx}"
          class="btn-remove-combo-item w-7 h-7 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 font-bold flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          title="Quitar del combo">
          ✕
        </button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-remove-combo-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-remove-combo-idx'), 10);
      currentComboItems.splice(idx, 1);
      renderComboItems();
    });
  });

  // 1. Suma automática en Precio Regular
  const regularTotal = currentComboItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const regInput = document.getElementById('oferta-precio-regular');
  if (regInput) {
    regInput.value = regularTotal;
  }

  // 2. Autogeneración de detalle / qué incluye el combo
  const descTextarea = document.getElementById('oferta-descripcion');
  if (descTextarea && currentComboItems.length > 0) {
    descTextarea.value = currentComboItems.map(it => {
      if (it.unidad === 'kg') {
        return `${it.gramos}g ${it.nombre}`;
      }
      return `${it.qty > 1 ? it.qty + 'x ' : ''}${it.nombre}`;
    }).join(' + ');
  }

  // 3. Sugerencia de título si está vacío
  const titleInput = document.getElementById('oferta-titulo');
  if (titleInput && (!titleInput.value || titleInput.value.startsWith('Combo '))) {
    titleInput.value = 'Combo ' + currentComboItems.map(it => it.nombre).slice(0, 2).join(' + ');
  }

  // 4. Actualizar cálculo de ahorro y porcentaje
  updateOfertaCalcPreview();
}

async function openOfertaModal(oferta = null) {
  const modal = document.getElementById('oferta-modal');
  const title = document.getElementById('oferta-modal-title');
  const form = document.getElementById('oferta-form');
  if (!modal || !form) return;

  form.reset();
  deselectComboProduct();
  currentComboItems = [];
  renderComboItems();
  activeSearchCat = 'Todas';
  await refreshComboProducts();
  updateOfertaCalcPreview();

  const searchInput = document.getElementById('combo-search-input');
  if (searchInput) searchInput.value = '';
  const searchClear = document.getElementById('combo-search-clear');
  if (searchClear) searchClear.classList.add('hidden');
  const searchResults = document.getElementById('combo-search-results');
  if (searchResults) searchResults.classList.add('hidden');

  if (oferta) {
    if (title) title.textContent = 'Editar Oferta / Combo';
    document.getElementById('oferta-id').value = oferta.id || '';
    document.getElementById('oferta-titulo').value = oferta.titulo || '';
    document.getElementById('oferta-descripcion').value = oferta.descripcion || '';
    document.getElementById('oferta-precio-regular').value = oferta.precio_regular || '';
    document.getElementById('oferta-precio-oferta').value = oferta.precio_oferta || '';
    if (oferta.vigencia_hasta) {
      const d = new Date(oferta.vigencia_hasta);
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      document.getElementById('oferta-vigencia').value = iso;
    } else {
      document.getElementById('oferta-vigencia').value = '';
    }
    document.getElementById('oferta-stock').value = oferta.stock_limite || '';
    document.getElementById('oferta-activo').checked = oferta.activo !== false;
    updateOfertaCalcPreview();
  } else {
    if (title) title.textContent = 'Nueva Oferta / Combo';
    document.getElementById('oferta-id').value = '';
    document.getElementById('oferta-activo').checked = true;
  }

  modal.showModal();
}

/**
 * Pre-fills the offer modal with data from an inventory product and opens it.
 * @param {{ id?: string, titulo?: string, descripcion?: string, precio_regular?: number, precio_oferta?: number, unidad?: string }} data
 */
export async function openNewOfferWithData(data = {}) {
  const modal = document.getElementById('oferta-modal');
  const title = document.getElementById('oferta-modal-title');
  if (!modal) return;

  await refreshComboProducts();
  deselectComboProduct();

  if (title) title.textContent = 'Nueva Oferta desde Inventario';
  document.getElementById('oferta-id').value = '';
  document.getElementById('oferta-titulo').value = data.titulo || '';
  document.getElementById('oferta-descripcion').value = data.descripcion || '';
  document.getElementById('oferta-precio-regular').value = data.precio_regular || '';
  document.getElementById('oferta-precio-oferta').value = data.precio_oferta || '';
  document.getElementById('oferta-vigencia').value = '';
  document.getElementById('oferta-stock').value = '';
  document.getElementById('oferta-activo').checked = true;

  if (data.titulo && data.precio_regular) {
    const isKg = data.unidad === 'kg';
    const subtotal = Number(data.precio_regular);
    currentComboItems = [{
      id: data.id || 'item-1',
      nombre: data.titulo,
      precio: subtotal,
      unidad: isKg ? 'kg' : 'c/u',
      gramos: isKg ? 200 : undefined,
      qty: isKg ? undefined : 1,
      subtotal: isKg ? Math.round((subtotal / 1000) * 200) : subtotal
    }];
  } else {
    currentComboItems = [];
  }
  renderComboItems();

  updateOfertaCalcPreview();
  modal.showModal();
}

function updateOfertaCalcPreview() {
  const regInput = document.getElementById('oferta-precio-regular');
  const ofInput = document.getElementById('oferta-precio-oferta');
  const box = document.getElementById('oferta-calc-box');
  const tag = document.getElementById('oferta-calc-tag');
  const ahorro = document.getElementById('oferta-calc-ahorro');
  if (!box || !regInput || !ofInput) return;

  const reg = Number(regInput.value) || 0;
  const of = Number(ofInput.value) || 0;

  if (reg > of && of > 0) {
    const pct = Math.round((1 - of / reg) * 100);
    const diff = reg - of;
    tag.textContent = `🔥 -${pct}% OFF`;
    ahorro.textContent = `Ahorro: $${diff.toLocaleString('es-AR')}`;
    box.classList.remove('hidden');
  } else {
    box.classList.add('hidden');
  }
}

export function initAdminOffers() {
  const addOfertaBtn = document.getElementById('add-oferta-btn');
  const cancelOfertaBtn = document.getElementById('cancel-oferta-btn');
  const ofertaForm = document.getElementById('oferta-form');
  const ofertaModal = document.getElementById('oferta-modal');
  const inputPrecioReg = document.getElementById('oferta-precio-regular');
  const inputPrecioOf = document.getElementById('oferta-precio-oferta');

  // Combo Search Events
  const searchInput = document.getElementById('combo-search-input');
  const searchClear = document.getElementById('combo-search-clear');
  const searchResults = document.getElementById('combo-search-results');
  const deselectBtn = document.getElementById('combo-deselect-btn');
  const btnModeUnit = document.getElementById('btn-mode-unit');
  const btnModeWeight = document.getElementById('btn-mode-weight');
  const btnAddCombo = document.getElementById('btn-add-combo-item');

  if (btnModeUnit) {
    btnModeUnit.addEventListener('click', () => setComboMode('unit'));
  }
  if (btnModeWeight) {
    btnModeWeight.addEventListener('click', () => setComboMode('weight'));
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      if (searchClear) {
        if (q.trim()) searchClear.classList.remove('hidden');
        else searchClear.classList.add('hidden');
      }
      renderSearchResults(q);
    });

    searchInput.addEventListener('focus', (e) => {
      renderSearchResults(e.target.value);
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      searchClear.classList.add('hidden');
      renderSearchResults('');
    });
  }

  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (searchResults && !searchResults.contains(e.target) && e.target !== searchInput && e.target !== searchClear) {
      searchResults.classList.add('hidden');
    }
  });

  if (deselectBtn) {
    deselectBtn.addEventListener('click', deselectComboProduct);
  }

  if (btnAddCombo) {
    btnAddCombo.addEventListener('click', () => {
      if (!selectedProductForCombo) {
        showToast('Elegí un producto para sumar al combo', true);
        return;
      }

      const prod = selectedProductForCombo;
      const isWeight = selectedComboMode === 'weight';

      if (isWeight) {
        const gramsInput = document.getElementById('combo-product-grams');
        const grams = parseInt(gramsInput?.value, 10) || 100;
        if (grams < 100) {
          showToast('El mínimo de venta para fiambres y pesables es 100g', true);
          return;
        }

        const subtotal = Math.round((prod.precio / 1000) * grams);
        const existing = currentComboItems.find(it => it.id === prod.id && it.unidad === 'kg');
        if (existing) {
          existing.gramos += grams;
          existing.subtotal = Math.round((existing.precio / 1000) * existing.gramos);
        } else {
          currentComboItems.push({
            id: prod.id,
            nombre: prod.nombre,
            precio: prod.precio,
            unidad: 'kg',
            gramos: grams,
            subtotal
          });
        }

        showToast(`Sumado al combo: ${grams}g ${prod.nombre}`);
      } else {
        const qtyInput = document.getElementById('combo-product-qty');
        const qty = parseInt(qtyInput?.value, 10) || 1;
        const subtotal = Math.round(prod.precio * qty);
        const existing = currentComboItems.find(it => it.id === prod.id && it.unidad !== 'kg');
        if (existing) {
          existing.qty += qty;
          existing.subtotal = Math.round(existing.precio * existing.qty);
        } else {
          currentComboItems.push({
            id: prod.id,
            nombre: prod.nombre,
            precio: prod.precio,
            unidad: 'c/u',
            qty,
            subtotal
          });
        }

        showToast(`Sumado al combo: ${qty}x ${prod.nombre}`);
      }

      deselectComboProduct();
      renderComboItems();
    });
  }

  if (addOfertaBtn) {
    addOfertaBtn.addEventListener('click', () => openOfertaModal());
  }

  if (cancelOfertaBtn && ofertaModal) {
    cancelOfertaBtn.addEventListener('click', () => ofertaModal.close());
  }

  if (ofertaForm) {
    ofertaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idInput = document.getElementById('oferta-id').value.trim();
      const titulo = document.getElementById('oferta-titulo').value.trim();
      const descripcion = document.getElementById('oferta-descripcion').value.trim();
      const precioRegularVal = document.getElementById('oferta-precio-regular').value;
      const precioOfertaVal = document.getElementById('oferta-precio-oferta').value;
      const vigenciaVal = document.getElementById('oferta-vigencia').value;
      const stockVal = document.getElementById('oferta-stock').value;
      const activo = document.getElementById('oferta-activo').checked;
      const saveBtn = document.getElementById('save-oferta-btn');

      if (!titulo || !descripcion || !precioOfertaVal) {
        showToast('Completá todos los campos obligatorios', true);
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';

      const isEdit = Boolean(idInput);
      const ofertaId = isEdit
        ? idInput
        : titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

      const payload = {
        id: ofertaId,
        titulo,
        descripcion,
        precio_regular: precioRegularVal ? Number(precioRegularVal) : null,
        precio_oferta: Number(precioOfertaVal),
        vigencia_hasta: vigenciaVal ? new Date(vigenciaVal).toISOString() : null,
        stock_limite: stockVal ? Number(stockVal) : null,
        activo
      };

      const res = await apiSaveOffer(payload);
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar Oferta';

      if (ofertaModal && ofertaModal.open) ofertaModal.close();
      showToast(res.success ? 'Oferta guardada correctamente' : 'Guardado localmente (revisar conexión)');
      loadOfertas();
    });
  }

  if (inputPrecioReg && inputPrecioOf) {
    inputPrecioReg.addEventListener('input', updateOfertaCalcPreview);
    inputPrecioOf.addEventListener('input', updateOfertaCalcPreview);
  }
}
