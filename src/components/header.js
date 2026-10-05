import { CONFIG } from '../config.js';
import { openInquiryViaWhatsApp, getInquiryUrl } from '../services/whatsapp.service.js';

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
  const title = options.title || CONFIG.NEGOCIO || 'Almacén Quique';
  const subtitle = options.subtitle || 'Bebidas frías • Picadas • Almacén de barrio';
  const badgeText = options.badgeText || 'Abierto';
  const inquiryUrl = getInquiryUrl(options.inquiryGreeting);

  container.className = 'sticky top-0 z-30 bg-base/95 backdrop-blur-md border-b border-line shadow-xs';
  container.innerHTML = `
    <div class="max-w-xl mx-auto px-4 py-4 sm:py-5 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3.5 sm:gap-4 min-w-0">
        <a href="${logoHref}" class="shrink-0" aria-label="Inicio ${title}">
          <img src="/logo/logo.png" alt="${title}" class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl object-cover bg-white border border-line shadow-sm" />
        </a>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="font-black text-xl sm:text-2xl leading-tight truncate text-ink tracking-tight">${title}</h1>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] sm:text-xs font-extrabold text-emerald-700 border border-emerald-200 shrink-0">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ${badgeText}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-muted truncate mt-0.5 font-medium">${subtitle}</p>
        </div>
      </div>

      <div class="shrink-0">
        <a id="btn-wa-header" href="${inquiryUrl}" target="_blank" rel="noopener"
           class="btn-wa-inquiry inline-flex items-center gap-1.5 rounded-2xl bg-wa hover:bg-[#20ba59] active:scale-95 text-white px-3.5 sm:px-4 py-2.5 text-xs font-black shadow-sm transition-all cursor-pointer"
           aria-label="WhatsApp">
          <span class="text-sm">✆</span>
          <span class="hidden sm:inline">WhatsApp</span>
        </a>
      </div>
    </div>
  `;
}
