import { getInquiryUrl } from './services/whatsapp.service.js';
import { syncSettings } from './services/settings.service.js';
import { CONFIG } from './config.js';

function updateLandingLinks() {
  const waBtn = document.getElementById('btn-wa-landing');
  const waHeroBtn = document.getElementById('btn-wa-hero');
  const igHandle = document.getElementById('landing-ig-handle');
  const igBtn = document.getElementById('landing-ig-btn');

  const inquiryUrl = getInquiryUrl('¡Hola! Me comunico desde la web de Almacén Quique.');

  if (waBtn) waBtn.href = inquiryUrl;
  if (waHeroBtn) waHeroBtn.href = inquiryUrl;

  if (igHandle && CONFIG.INSTAGRAM_HANDLE) {
    igHandle.textContent = CONFIG.INSTAGRAM_HANDLE;
  }
  if (igBtn && CONFIG.INSTAGRAM_URL) {
    igBtn.href = CONFIG.INSTAGRAM_URL;
  }
}

updateLandingLinks();
syncSettings(() => {
  updateLandingLinks();
});
