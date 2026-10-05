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
  const copyright = options.copyrightText || '© Almacén Quique — Todos los derechos reservados.';
  const igHandle = CONFIG.INSTAGRAM_HANDLE || '@almacen.quique';
  const igUrl = CONFIG.INSTAGRAM_URL || '/ig';

  container.className = 'bg-white border-t border-line mt-auto';
  container.innerHTML = `
    <div class="max-w-xl mx-auto px-4 py-8 space-y-4">
      <!-- Tarjeta Oficial de Instagram -->
      <div class="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-pink-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-2xs">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <div class="min-w-0">
            <h4 id="ig-handle" class="font-black text-sm text-ink truncate">Instagram ${igHandle}</h4>
            <p class="text-xs text-stone-600 truncate">${instagramNotice}</p>
          </div>
        </div>
        <a id="ig-btn" href="${igUrl}" target="_blank" rel="noopener"
           class="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 active:scale-95 text-white px-4 py-2.5 text-xs font-black shadow-sm transition-all shrink-0">
          <span>Abrir Instagram</span>
          <span class="text-xs font-bold">↗</span>
        </a>
      </div>

      ${showShare ? `
        <!-- Tarjeta Compartir Catálogo -->
        <div class="p-4 sm:p-5 rounded-3xl bg-stone-50 border border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <h4 class="font-extrabold text-xs sm:text-sm text-ink">¿Armás una juntada o una comida?</h4>
            <p class="text-xs text-muted mt-0.5">Compartí el catálogo con tus amigos o familia para elegir lo que quieran.</p>
          </div>
          <button type="button" class="btn-share-trigger inline-flex items-center gap-1.5 rounded-2xl bg-stone-900 hover:bg-black active:scale-95 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer">
            <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.368 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            <span>Compartir Catálogo</span>
          </button>
        </div>
      ` : ''}

      <!-- Derechos Reservados -->
      <div class="pt-3 border-t border-line text-center text-[11px] text-muted">
        <p>${copyright}</p>
      </div>
    </div>
  `;
}
