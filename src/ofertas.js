import { sbClient } from './supabase.js';
import { CONFIG } from './config.js';

let ofertas = [];

// Toast Helper
export function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const msgEl = document.getElementById('toast-msg');
  const iconEl = document.getElementById('toast-icon');
  if (msgEl) msgEl.textContent = msg;
  if (iconEl) iconEl.textContent = isError ? '⚠' : '✓';

  toast.className = `fixed top-4 right-4 left-4 sm:left-auto sm:max-w-xs z-50 transition-all duration-300 ${
    isError ? 'bg-red-600' : 'bg-ink'
  } text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 transform translate-y-0 opacity-100 pointer-events-auto`;

  setTimeout(() => {
    toast.className = 'fixed top-4 right-4 left-4 sm:left-auto sm:max-w-xs z-50 transition-all duration-300 bg-ink text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 transform -translate-y-12 opacity-0 pointer-events-none';
  }, 2500);
}

// Formateador de moneda en ARS
export function formatPrice(amount) {
  return '$' + Number(amount || 0).toLocaleString('es-AR');
}

// Formateador de vigencia restante
function formatVigencia(isoDate) {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  const now = new Date();
  const diffMs = target - now;

  if (diffMs <= 0) return { label: 'Oferta finalizada', expired: true };

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 2) {
    return {
      label: `Vence en ${diffDays} días`,
      expired: false,
      urgent: false
    };
  } else if (diffDays === 1) {
    return {
      label: `Vence mañana`,
      expired: false,
      urgent: false
    };
  } else if (diffHours > 1) {
    return {
      label: `¡Termina hoy! (${diffHours} hs restantes)`,
      expired: false,
      urgent: true
    };
  } else {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return {
      label: `¡Últimos ${diffMinutes} minutos!`,
      expired: false,
      urgent: true
    };
  }
}

// Sanitizador de número de WhatsApp para wa.me (sólo dígitos con código de país)
export function sanitizeWhatsAppNumber(raw) {
  let num = String(raw || '').replace(/[^0-9]/g, '');
  if (!num) return '5491170649039';
  if (num.length === 10 && num.startsWith('11')) {
    num = '549' + num;
  }
  return num;
}

// Configuración de WhatsApp y negocio
function getActiveSettings() {
  const cached = localStorage.getItem('quique_settings');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return {
        whatsapp_number: sanitizeWhatsAppNumber(parsed.whatsapp_number || CONFIG.WHATSAPP_NUMBER),
        mensaje_consulta: parsed.mensaje_consulta || CONFIG.MENSAJE_CONSULTA,
        negocio: CONFIG.NEGOCIO
      };
    } catch (e) {}
  }
  return {
    whatsapp_number: sanitizeWhatsAppNumber(CONFIG.WHATSAPP_NUMBER),
    mensaje_consulta: CONFIG.MENSAJE_CONSULTA,
    negocio: CONFIG.NEGOCIO
  };
}

// Generador de URL de consulta general
function getWhatsAppInquiryUrl() {
  const s = getActiveSettings();
  const greeting = (s.mensaje_consulta || CONFIG.MENSAJE_CONSULTA || '¡Hola {negocio}! Quería consultar por las ofertas del día.').replace('{negocio}', s.negocio);
  return `https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(greeting)}`;
}

// Generador de URL de encargo de oferta específica
function formatWhatsAppOrderUrl(oferta) {
  const s = getActiveSettings();
  const mensaje = `¡Hola ${s.negocio}! Quiero encargar la oferta del día:\n\n🔥 *${oferta.titulo}* — ${formatPrice(oferta.precio_oferta)}\n_${oferta.descripcion}_\n\n¿Tienen disponibilidad para coordinar la entrega o retiro? ¡Muchas gracias!`;
  return `https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(mensaje)}`;
}

// Redirección segura anti-bloqueo de popups móviles
function openUrlSafe(url) {
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = url;
    }
  } catch (e) {
    window.location.href = url;
  }
}

// Sincronizar enlaces estáticos con el número y mensaje actual
function updateWhatsAppLinks() {
  const url = getWhatsAppInquiryUrl();
  document.querySelectorAll('.btn-wa-inquiry').forEach(el => {
    if (el.tagName === 'A') {
      el.href = url;
    }
  });
}

// Sincronizar configuración remota desde Supabase
async function syncRemoteSettings() {
  try {
    const { data } = await sbClient.from('configuracion').select('*').eq('id', 'general').single();
    if (data) {
      localStorage.setItem('quique_settings', JSON.stringify(data));
      updateWhatsAppLinks();
      renderOfertas();
    }
  } catch (e) {
    console.warn('No se pudo sincronizar la configuración remota de WhatsApp:', e);
  }
}

// Cargar ofertas desde Supabase (sincronización real con la base de datos)
export async function loadOfertas() {
  const container = document.getElementById('ofertas-container');
  if (!container) return;

  try {
    const { data, error } = await sbClient
      .from('ofertas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error al consultar tabla "ofertas" en Supabase:', error);
      const local = localStorage.getItem('quique_ofertas');
      ofertas = local ? JSON.parse(local) : [];
    } else {
      ofertas = data || [];
      localStorage.setItem('quique_ofertas', JSON.stringify(ofertas));
    }
  } catch (err) {
    console.warn('Error al conectar con Supabase:', err);
    const local = localStorage.getItem('quique_ofertas');
    ofertas = local ? JSON.parse(local) : [];
  }

  renderOfertas();
}

let cart = {}; // { [ofertaId]: { oferta, qty } }

// Actualizar la interfaz del carrito flotante
function updateCartUI() {
  const items = Object.values(cart);
  const totalCount = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.qty * item.oferta.precio_oferta, 0);

  const cartBar = document.getElementById('cart-bar');
  const cartBadge = document.getElementById('cart-badge');
  const cartTotal = document.getElementById('cart-total');

  if (cartBadge) {
    cartBadge.textContent = `${totalCount} ${totalCount === 1 ? 'promoción' : 'promociones'}`;
  }
  if (cartTotal) {
    cartTotal.textContent = formatPrice(totalPrice);
  }

  if (totalCount > 0) {
    if (cartBar) {
      cartBar.classList.remove('translate-y-36', 'opacity-0', 'pointer-events-none');
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

// Renderizar contenido del modal del carrito
function renderCartModal() {
  const modalList = document.getElementById('cart-modal-items');
  const modalTotal = document.getElementById('cart-modal-total');
  const savingsBox = document.getElementById('cart-modal-savings-box');
  const savingsEl = document.getElementById('cart-modal-savings');
  if (!modalList) return;

  const items = Object.values(cart);
  if (!items.length) {
    modalList.innerHTML = '<p class="text-xs text-muted text-center py-6">Tu pedido de ofertas está vacío.</p>';
    if (modalTotal) modalTotal.textContent = '$0';
    if (savingsBox) savingsBox.classList.add('hidden');
    return;
  }

  const totalPrice = items.reduce((sum, item) => sum + item.qty * item.oferta.precio_oferta, 0);
  const totalSavings = items.reduce((sum, item) => {
    const reg = item.oferta.precio_regular || item.oferta.precio_oferta;
    return sum + item.qty * Math.max(0, reg - item.oferta.precio_oferta);
  }, 0);

  if (modalTotal) modalTotal.textContent = formatPrice(totalPrice);
  if (savingsBox && savingsEl) {
    if (totalSavings > 0) {
      savingsBox.classList.remove('hidden');
      savingsEl.textContent = formatPrice(totalSavings);
    } else {
      savingsBox.classList.add('hidden');
    }
  }

  modalList.innerHTML = items.map(({ oferta, qty }) => {
    const maxStock = oferta.stock_limite || 99;
    return `
      <div class="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0">
        <div class="min-w-0 flex-1">
          <p class="font-bold text-xs text-ink truncate">${oferta.titulo}</p>
          <p class="text-[11px] text-muted">${formatPrice(oferta.precio_oferta)} c/u</p>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1">
            <button type="button" data-modal-dec="${oferta.id}" class="w-6 h-6 rounded bg-white shadow-2xs font-bold text-xs flex items-center justify-center cursor-pointer active:scale-90">−</button>
            <span class="text-xs font-bold min-w-4 text-center">${qty}</span>
            <button type="button" data-modal-inc="${oferta.id}" ${qty >= maxStock ? 'disabled class="w-6 h-6 rounded bg-stone-200 text-stone-400 font-bold text-xs flex items-center justify-center cursor-not-allowed"' : 'class="w-6 h-6 rounded bg-white shadow-2xs font-bold text-xs flex items-center justify-center cursor-pointer active:scale-90"'}">+</button>
          </div>
          <p class="font-extrabold text-xs text-ink min-w-16 text-right">${formatPrice(oferta.precio_oferta * qty)}</p>
        </div>
      </div>
    `;
  }).join('');
}

function openCartModal() {
  const modal = document.getElementById('cart-modal');
  if (modal) modal.showModal();
}

function closeCartModal() {
  const modal = document.getElementById('cart-modal');
  if (modal && modal.open) modal.close();
}

// Enviar pedido consolidado de ofertas por WhatsApp
function sendWhatsAppOrder() {
  const items = Object.values(cart);
  if (!items.length) {
    showToast('El carrito está vacío', true);
    return;
  }

  const s = getActiveSettings();
  const totalPrice = items.reduce((sum, item) => sum + item.qty * item.oferta.precio_oferta, 0);
  const totalSavings = items.reduce((sum, item) => {
    const reg = item.oferta.precio_regular || item.oferta.precio_oferta;
    return sum + item.qty * Math.max(0, reg - item.oferta.precio_oferta);
  }, 0);

  const itemsText = items
    .map(i => `• ${i.qty}x *${i.oferta.titulo}* — ${formatPrice(i.oferta.precio_oferta * i.qty)}`)
    .join('\n');

  const greeting = `¡Hola ${s.negocio}! Quiero encargar las siguientes ofertas del día:`;
  const savingsText = totalSavings > 0 ? `\n_(Ahorro total estimado: ${formatPrice(totalSavings)})_` : '';
  const closing = `¿Tienen disponibilidad para coordinar la entrega o retiro? ¡Muchas gracias!`;

  const message = `${greeting}\n\n${itemsText}\n\n*Total estimado: ${formatPrice(totalPrice)}*${savingsText}\n\n${closing}`;
  const url = `https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(message)}`;

  openUrlSafe(url);
  closeCartModal();
  cart = {};
  updateCartUI();
  renderOfertas();
  showToast('¡Pedido enviado a WhatsApp!');
}

// Renderizar tarjetas de ofertas
function renderOfertas() {
  const container = document.getElementById('ofertas-container');
  if (!container) return;

  // Filtrar ofertas activas y no vencidas
  const now = new Date();
  const activas = ofertas.filter(o => {
    if (o.activo === false) return false;
    if (o.vigencia_hasta && new Date(o.vigencia_hasta) <= now) return false;
    return true;
  });

  if (activas.length === 0) {
    const inquiryUrl = getWhatsAppInquiryUrl();
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

  container.innerHTML = activas.map(o => {
    const ahorro = Math.max(0, (o.precio_regular || 0) - (o.precio_oferta || 0));
    const porcentajeOff = (o.precio_regular && o.precio_regular > o.precio_oferta)
      ? Math.round((1 - o.precio_oferta / o.precio_regular) * 100)
      : null;
    const vigenciaInfo = formatVigencia(o.vigencia_hasta);
    const inCart = cart[o.id] ? cart[o.id].qty : 0;
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

        <!-- Acciones: Agregar al Carrito (o Modificador de Cantidad) y Compartir -->
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

// Compartir oferta individual con Web Share API
async function shareOferta(oferta) {
  const url = window.location.origin + '/ofertas';
  const shareData = {
    title: `${oferta.titulo} — ${CONFIG.NEGOCIO}`,
    text: `¡Mirá esta oferta en ${CONFIG.NEGOCIO}! ${oferta.titulo} a sólo ${formatPrice(oferta.precio_oferta)}:`,
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

// Inicializar Footer de Redes Sociales
function initSocialFooter() {
  const igHandle = document.getElementById('ig-handle');
  const igBtn = document.getElementById('ig-btn');

  if (igHandle && CONFIG.INSTAGRAM_HANDLE) {
    igHandle.textContent = `Instagram ${CONFIG.INSTAGRAM_HANDLE}`;
  }
  if (igBtn && CONFIG.INSTAGRAM_URL) {
    igBtn.href = CONFIG.INSTAGRAM_URL;
  }
}

// Delegación de eventos global para clicks en WhatsApp, carrito y compartir
document.addEventListener('click', (e) => {
  const waInquiry = e.target.closest('.btn-wa-inquiry');
  if (waInquiry) {
    const url = getWhatsAppInquiryUrl();
    if (waInquiry.tagName === 'A') {
      waInquiry.href = url;
    } else {
      e.preventDefault();
      openUrlSafe(url);
    }
    showToast('Abriendo WhatsApp...');
    return;
  }

  // Agregar oferta al carrito
  const addBtn = e.target.closest('[data-add-oferta]');
  if (addBtn) {
    e.preventDefault();
    const id = addBtn.getAttribute('data-add-oferta');
    const oferta = ofertas.find(item => item.id === id);
    if (oferta) {
      cart[id] = { oferta, qty: 1 };
      updateCartUI();
      renderOfertas();
      showToast('¡Promo agregada al pedido!');
    }
    return;
  }

  // Incrementar desde la tarjeta
  const incBtn = e.target.closest('[data-inc-oferta]');
  if (incBtn) {
    e.preventDefault();
    const id = incBtn.getAttribute('data-inc-oferta');
    if (cart[id]) {
      const max = cart[id].oferta.stock_limite || 99;
      if (cart[id].qty < max) {
        cart[id].qty++;
        updateCartUI();
        renderOfertas();
      } else {
        showToast('Alcanzaste el límite de stock de este combo', true);
      }
    }
    return;
  }

  // Decrementar desde la tarjeta
  const decBtn = e.target.closest('[data-dec-oferta]');
  if (decBtn) {
    e.preventDefault();
    const id = decBtn.getAttribute('data-dec-oferta');
    if (cart[id]) {
      cart[id].qty--;
      if (cart[id].qty <= 0) {
        delete cart[id];
      }
      updateCartUI();
      renderOfertas();
    }
    return;
  }

  // Incrementar desde el modal
  const modalInc = e.target.closest('[data-modal-inc]');
  if (modalInc) {
    e.preventDefault();
    const id = modalInc.getAttribute('data-modal-inc');
    if (cart[id]) {
      const max = cart[id].oferta.stock_limite || 99;
      if (cart[id].qty < max) {
        cart[id].qty++;
        updateCartUI();
        renderOfertas();
      }
    }
    return;
  }

  // Decrementar desde el modal
  const modalDec = e.target.closest('[data-modal-dec]');
  if (modalDec) {
    e.preventDefault();
    const id = modalDec.getAttribute('data-modal-dec');
    if (cart[id]) {
      cart[id].qty--;
      if (cart[id].qty <= 0) {
        delete cart[id];
      }
      updateCartUI();
      renderOfertas();
    }
    return;
  }

  // Abrir carrito desde barra flotante
  const bar = e.target.closest('#cart-bar');
  if (bar) {
    openCartModal();
    return;
  }

  // Cerrar modal
  const closeBtn = e.target.closest('#close-cart-btn');
  if (closeBtn) {
    closeCartModal();
    return;
  }

  // Enviar pedido por WhatsApp
  const checkoutBtn = e.target.closest('#checkout-btn');
  if (checkoutBtn) {
    sendWhatsAppOrder();
    return;
  }

  // Vaciar carrito
  const clearBtn = e.target.closest('#clear-cart-btn');
  if (clearBtn) {
    cart = {};
    updateCartUI();
    renderOfertas();
    showToast('Pedido vaciado');
    return;
  }

  // Compartir oferta
  const shareBtn = e.target.closest('[data-share-oferta]');
  if (shareBtn) {
    e.preventDefault();
    const id = shareBtn.getAttribute('data-share-oferta');
    const oferta = ofertas.find(item => item.id === id);
    if (oferta) shareOferta(oferta);
    return;
  }
});

// Cerrar modal si hace clic en el backdrop
const cartModal = document.getElementById('cart-modal');
if (cartModal) {
  cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) closeCartModal();
  });
}

// Inicialización de la página
updateWhatsAppLinks();
syncRemoteSettings();
loadOfertas();
initSocialFooter();

