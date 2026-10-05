import { CONFIG } from '../config.js';
import { showToast } from './toast.js';

/**
 * Mounts the standardized store footer into `#site-footer`.
 *
 * @param {object} [options]
 * @param {string} [options.instagramNotice] - subtitle on Instagram card
 * @param {boolean} [options.showShareCard=true] - whether to include the share card
 * @param {string} [options.copyrightText] - copyright line at the bottom
 */
export function initFooter(options = {}) {
  const container = document.getElementById('site-footer');
  if (!container) return;

  const instagramNotice = options.instagramNotice || 'Seguinos para ver novedades y ofertas diarias';
  const showShare = options.showShareCard !== false;
  const copyright = options.copyrightText || '© Despensa Quique — Todos los derechos reservados.';
  const igHandle = CONFIG.INSTAGRAM_HANDLE || '@almacen.quique';
  const igUrl = CONFIG.INSTAGRAM_URL || '/ig';

  container.className = 'bg-base border-t border-line mt-auto';
  container.innerHTML = `
    <div class="max-w-xl mx-auto px-4 py-8 space-y-4">
      <!-- Tarjeta Oficial de Instagram (Paleta Oficial de la Marca) -->
      <div class="p-4 sm:p-5 rounded-3xl bg-white border border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-2xs">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-11 h-11 rounded-2xl bg-stone-100 border border-line flex items-center justify-center text-espresso text-lg shadow-2xs shrink-0">
            📷
          </div>
          <div class="min-w-0">
            <h4 id="ig-handle" class="font-extrabold text-sm text-espresso truncate">Instagram ${igHandle}</h4>
            <p class="text-xs text-muted truncate">${instagramNotice}</p>
          </div>
        </div>
        <a id="ig-btn" href="${igUrl}" target="_blank" rel="noopener"
           class="inline-flex items-center gap-1.5 rounded-2xl bg-espresso hover:bg-stone-800 active:scale-95 text-white px-4 py-2.5 text-xs font-black shadow-xs transition-all shrink-0">
          <span>Abrir Instagram</span>
          <span class="text-xs font-bold text-tan">↗</span>
        </a>
      </div>

      ${showShare ? `
        <!-- Tarjeta Compartir Catálogo -->
        <div class="p-4 sm:p-5 rounded-3xl bg-white border border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-2xs">
          <div>
            <h4 class="font-extrabold text-xs sm:text-sm text-espresso">¿Armás una juntada o una comida?</h4>
            <p class="text-xs text-muted mt-0.5">Compartí el catálogo con tus amigos o familia para elegir lo que quieran.</p>
          </div>
          <button type="button" class="btn-share-trigger inline-flex items-center gap-1.5 rounded-2xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-espresso border border-line px-4 py-2.5 text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer">
            <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.368 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            <span>Compartir</span>
          </button>
        </div>
      ` : ''}

      <!-- Derechos Reservados y Enlace a Portada -->
      <div class="pt-3 border-t border-line text-center text-[11px] text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>${copyright}</p>
        <a href="/" class="text-tan hover:text-espresso font-semibold transition-colors">
          Ir a la Portada &rarr;
        </a>
      </div>
    </div>
  `;
}
