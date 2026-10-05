import { fetchOffers, saveOffer as apiSaveOffer, toggleOfferActive, deleteOffer as apiDeleteOffer } from '../../services/offers.service.js';
import { showToast } from '../../components/toast.js';

let ofertas = [];

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

function openOfertaModal(oferta = null) {
  const modal = document.getElementById('oferta-modal');
  const title = document.getElementById('oferta-modal-title');
  const form = document.getElementById('oferta-form');
  if (!modal || !form) return;

  form.reset();
  updateOfertaCalcPreview();

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
