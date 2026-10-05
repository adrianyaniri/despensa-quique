import { getInquiryUrl } from './services/whatsapp.service.js';
import { syncSettings } from './services/settings.service.js';
import { CONFIG } from './config.js';

function initCinematicIntro() {
  const curtain = document.getElementById('intro-curtain');
  if (!curtain) return;

  let dismissed = false;

  function dismissIntro() {
    if (dismissed) return;
    dismissed = true;
    curtain.classList.add('intro-hidden');
    setTimeout(() => {
      curtain.remove();
    }, 750);
  }

  // Auto-dismiss after 1.9s or immediately upon tap/click
  const timer = setTimeout(dismissIntro, 1900);

  curtain.addEventListener('click', () => {
    clearTimeout(timer);
    dismissIntro();
  });

  window.addEventListener('keydown', () => {
    clearTimeout(timer);
    dismissIntro();
  }, { once: true });
}

function updateLandingLinks() {
  const waBtn = document.getElementById('btn-wa-landing');
  const igHandle = document.getElementById('landing-ig-handle');
  const igBtn = document.getElementById('landing-ig-btn');

  const inquiryUrl = getInquiryUrl('¡Hola! Me comunico desde la web de Almacén Quique.');

  if (waBtn) waBtn.href = inquiryUrl;

  if (igHandle && CONFIG.INSTAGRAM_HANDLE) {
    igHandle.textContent = CONFIG.INSTAGRAM_HANDLE;
  }
  if (igBtn && CONFIG.INSTAGRAM_URL) {
    igBtn.href = CONFIG.INSTAGRAM_URL;
  }
}

initCinematicIntro();
updateLandingLinks();
syncSettings(() => {
  updateLandingLinks();
});
