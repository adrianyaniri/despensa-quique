import { CONFIG } from '../../config.js';
import { getSettings } from '../../services/settings.service.js';

/**
 * Updates DOM elements in the printable A4 poster container.
 * @param {'precios'|'ofertas'} [type='precios']
 */
export function setupPrintPoster(type = 'precios') {
  const s = getSettings();
  const printNegocio = document.getElementById('print-negocio');
  const printRubro = document.getElementById('print-rubro');
  const printQrImg = document.getElementById('print-qr-img');
  const printTitle = document.getElementById('print-title');
  const printDesc = document.getElementById('print-desc');
  const printUrl = document.getElementById('print-url');
  const printWa = document.getElementById('print-wa');
  const printIg = document.getElementById('print-ig');

  if (printNegocio) printNegocio.textContent = CONFIG.NEGOCIO || 'Almacén Quique';

  if (type === 'ofertas') {
    if (printRubro) printRubro.textContent = '🔥 OFERTAS DEL DÍA • COMBOS PROMOCIONALES';
    if (printQrImg) printQrImg.src = '/qr/qr-ofertas-1000px.png';
    if (printTitle) printTitle.textContent = '¡ESCANEÁ Y APROVECHÁ LAS OFERTAS DE HOY!';
    if (printDesc) printDesc.textContent = 'Combos por tiempo limitado. Encargá directo por WhatsApp antes de que se agoten.';
    if (printUrl) printUrl.textContent = window.location.origin + '/ofertas';
  } else {
    if (printRubro) printRubro.textContent = 'Bebidas Frías • Picadas • Almacén';
    if (printQrImg) printQrImg.src = '/qr/qr-precios-1000px.png';
    if (printTitle) printTitle.textContent = '¡Escaneá el código QR con tu celular!';
    if (printDesc) printDesc.textContent = 'Mirá todos los precios actualizados y armá tu pedido al instante';
    if (printUrl) printUrl.textContent = CONFIG.CATALOGO_URL || (window.location.origin + '/precios');
  }

  if (printWa) {
    const rawNumber = String(s.whatsapp_number || CONFIG.WHATSAPP_NUMBER || '').trim();
    let formattedNumber = rawNumber;
    if (rawNumber.startsWith('549') && rawNumber.length === 13) {
      const area = rawNumber.slice(3, 5); // 11
      const p1 = rawNumber.slice(5, 9);   // 6616
      const p2 = rawNumber.slice(9);      // 8970
      formattedNumber = `${area} ${p1}-${p2}`;
    }
    printWa.textContent = `✆ WhatsApp: ${formattedNumber}`;
  }

  if (printIg) {
    const handle = CONFIG.INSTAGRAM_HANDLE || '@almacen.quique';
    printIg.textContent = `📷 Instagram: ${handle}`;
  }
}

/**
 * Initializes poster preview buttons and print triggers.
 */
export function initAdminPosters() {
  const printPreciosBtn = document.getElementById('print-poster-precios-btn');
  const printOfertasBtn = document.getElementById('print-poster-ofertas-btn');

  if (printPreciosBtn) {
    printPreciosBtn.addEventListener('click', () => {
      setupPrintPoster('precios');
      window.print();
    });
  }

  if (printOfertasBtn) {
    printOfertasBtn.addEventListener('click', () => {
      setupPrintPoster('ofertas');
      window.print();
    });
  }

  window.addEventListener('beforeprint', () => setupPrintPoster('precios'));
}
