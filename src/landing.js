import { getInquiryUrl } from './services/whatsapp.service.js';
import { syncSettings } from './services/settings.service.js';
import { CONFIG } from './config.js';

function initCinematicIntro() {
  const curtain = document.getElementById('intro-curtain');
  const startBtn = document.getElementById('btn-intro-start');
  if (!curtain) return;

  let dismissed = false;

  function dismissIntro() {
    if (dismissed) return;
    dismissed = true;
    curtain.classList.add('intro-hidden');
    setTimeout(() => {
      curtain.remove();
    }, 850);
  }

  if (localStorage.getItem('intro_seen')) {
    dismissIntro();
  }

  // Se inicia exclusivamente cuando el usuario hace clic en el botón o en la pantalla
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.setItem('intro_seen', 'true');
      dismissIntro();
    });
  }

  curtain.addEventListener('click', () => {
    localStorage.setItem('intro_seen', 'true');
    dismissIntro();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      localStorage.setItem('intro_seen', 'true');
      dismissIntro();
    }
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
