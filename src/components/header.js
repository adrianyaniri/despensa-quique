import { CONFIG } from '../config.js';
import { getInquiryUrl } from '../services/whatsapp.service.js';

/**
 * Mounts the standardized store header into `#site-header`.
 *
 * @param {object} [options]
 * @param {string} [options.logoHref='/'] - URL destination when clicking the logo
 * @param {string} [options.title] - header title (defaults to CONFIG.NEGOCIO)
 * @param {string} [options.subtitle] - store subtitle
 * @param {string} [options.badgeText='Abierto'] - status pill text
 * @param {string} [options.inquiryGreeting] - customized WhatsApp greeting
 */
export function initHeader(options = {}) {
  const container = document.getElementById('site-header');
  if (!container) return;

  const logoHref = options.logoHref || '/';
  const title = options.title || CONFIG.NEGOCIO || 'Despensa Quique';
  const subtitle = options.subtitle || 'Fiambres • Bebidas • Almacén';
  const badgeText = options.badgeText || 'Abierto';
  const inquiryUrl = getInquiryUrl(options.inquiryGreeting);

  container.className = 'sticky top-0 z-30 bg-base/95 backdrop-blur-md border-b border-line shadow-xs';
  container.innerHTML = `
    <div class="max-w-xl mx-auto px-4 py-3.5 sm:py-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 sm:gap-3.5 min-w-0">
        <a href="${logoHref}" class="shrink-0 transition-transform hover:scale-105 active:scale-95" title="Ir a la portada principal">
          <img src="/logo/logo.png" alt="${title}" class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover bg-white border border-line shadow-2xs" />
        </a>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <a href="${logoHref}" class="font-black text-lg sm:text-xl leading-tight truncate text-espresso tracking-tight hover:opacity-80 transition-opacity" title="Ir a la portada principal">
              ${title}
            </a>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-stone-200/60 px-2 py-0.5 text-[10px] sm:text-[11px] font-extrabold text-stone-700 border border-stone-300/60 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span> ${badgeText}
            </span>
          </div>
          <p class="text-xs text-muted truncate mt-0.5 font-medium">${subtitle}</p>
        </div>
      </div>

      <div class="shrink-0 flex items-center gap-2">
        <a id="btn-wa-header" href="${inquiryUrl}" target="_blank" rel="noopener"
           class="btn-wa-inquiry inline-flex items-center gap-1.5 rounded-2xl bg-wa hover:bg-[#20ba59] active:scale-95 text-white px-3.5 sm:px-4 py-2 text-xs font-black shadow-sm transition-all cursor-pointer"
           aria-label="WhatsApp">
          <span class="text-sm">✆</span>
          <span class="hidden sm:inline">WhatsApp</span>
        </a>
      </div>
    </div>
  `;
}
