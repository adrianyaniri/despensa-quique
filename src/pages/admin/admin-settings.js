import { getSettings, saveSettings } from '../../services/settings.service.js';
import { showToast } from '../../components/toast.js';

export const TONE_PRESETS = {
  barrio: {
    name: 'De Barrio y Amiguero',
    consulta: '¡Buenas! ¿Cómo andan? Les quería hacer una consultita sobre los productos del almacén. ¡Muchas gracias!',
    saludo: '¡Hola Quique! ¿Cómo andás? Te paso el pedido para cuando puedas:',
    pie: 'Avisame cuánto demora y el total con el envío. ¡Muchas gracias!',
    autoReply: '¡Hola! 👋 ¡Qué hacés! Gracias por escribir a Almacén Quique. Ya leímos tu mensaje y en un toque te contestamos para prepararte el pedido o responderte la consulta. ¡Aguantanos unos minutitos!'
  },
  agil: {
    name: 'Ágil y Directo',
    consulta: 'Hola Almacén Quique, quería consultar disponibilidad de unos productos.',
    saludo: 'Hola Almacén Quique. Les comparto el pedido armado desde el catálogo:',
    pie: 'Por favor confirmame stock, método de pago y tiempo de entrega. Saludos.',
    autoReply: '¡Hola! 🛵 Gracias por comunicarte con Almacén Quique. Recibimos tu pedido/consulta. En breve te confirmamos stock y demora de entrega. ¡Ya te atendemos!'
  },
  profesional: {
    name: 'Profesional y Cordial',
    consulta: 'Estimados, buenas tardes. Me comunico desde su catálogo web para hacerles una consulta. Muchas gracias.',
    saludo: 'Estimados, les comparto el detalle de mi pedido realizado en la web:',
    pie: 'Quedo a la espera de su confirmación para coordinar el pago y la entrega. Atentamente.',
    autoReply: '¡Buenas tardes! Gracias por comunicarse con Almacén Quique. Hemos recibido su mensaje. En breve un asesor se pondrá en contacto con usted para asistirlo. ¡Que tenga un excelente día!'
  },
  previa: {
    name: 'Previas y Picadas',
    consulta: '¡Hola gente! ¿Cómo va? Quería consultarles por las bebidas y promos del almacén.',
    saludo: '¡Buenas! Acá sale el pedido para la previa / picada 🍻:',
    pie: '¡Que las birras salgan bien frías por favor! Avisame el total para transferir.',
    autoReply: '¡Esaaa! 🍻 Gracias por escribir a Almacén Quique. Las bebidas ya están en la heladera esperándote 😉. Danos 5 minutos y te confirmamos el pedido para que salga volando.'
  },
  moderno: {
    name: 'Moderno y Conciso',
    consulta: 'Hola Almacén Quique, me comunico desde la web para realizar una consulta.',
    saludo: 'Pedido web - Almacén Quique 🛒:',
    pie: 'Aguardamos confirmación de total y tiempo estimado. ¡Muchas gracias!',
    autoReply: '¡Hola! 🛒 Gracias por tu contacto con Almacén Quique. Tu solicitud ingresó a nuestra cola de atención. Te responderemos en el orden de llegada. ¡Muchas gracias por tu paciencia!'
  }
};

/**
 * Initializes the settings modal, presets selector, and settings form.
 * @param {Function} [onSettingsSaved] - callback when settings are saved
 */
export function initAdminSettings(onSettingsSaved) {
  const btnSettings = document.getElementById('btn-settings');
  const settingsModal = document.getElementById('settings-modal');
  const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
  const settingsForm = document.getElementById('settings-form');
  const tonePresetSelect = document.getElementById('tone-preset-select');
  const btnCopyAutoReply = document.getElementById('btn-copy-auto-reply');
  const suggestedAutoReplyText = document.getElementById('suggested-auto-reply-text');

  if (btnSettings && settingsModal) {
    btnSettings.addEventListener('click', () => {
      const s = getSettings();
      document.getElementById('setting-wa-number').value = s.whatsapp_number || '';
      document.getElementById('setting-wa-consulta').value = s.mensaje_consulta || '';
      document.getElementById('setting-wa-saludo').value = s.mensaje_pedido_saludo || '';
      document.getElementById('setting-wa-pie').value = s.mensaje_pedido_pie || '';
      if (suggestedAutoReplyText) suggestedAutoReplyText.textContent = s.auto_reply || TONE_PRESETS.barrio.autoReply;
      if (tonePresetSelect) tonePresetSelect.value = 'custom';
      settingsModal.showModal();
    });
  }

  if (cancelSettingsBtn && settingsModal) {
    cancelSettingsBtn.addEventListener('click', () => settingsModal.close());
  }

  if (tonePresetSelect) {
    tonePresetSelect.addEventListener('change', (e) => {
      const presetKey = e.target.value;
      const p = TONE_PRESETS[presetKey];
      if (p) {
        document.getElementById('setting-wa-consulta').value = p.consulta;
        document.getElementById('setting-wa-saludo').value = p.saludo;
        document.getElementById('setting-wa-pie').value = p.pie;
        if (suggestedAutoReplyText) suggestedAutoReplyText.textContent = p.autoReply;
      }
    });
  }

  if (btnCopyAutoReply && suggestedAutoReplyText) {
    btnCopyAutoReply.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(suggestedAutoReplyText.textContent.trim());
        showToast('¡Texto para celular copiado al portapapeles!');
      } catch (e) {
        showToast('Seleccioná y copiá el texto manualmente');
      }
    });
  }

  if (settingsForm && settingsModal) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('save-settings-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';

      const newSettings = {
        whatsapp_number: document.getElementById('setting-wa-number').value.trim(),
        mensaje_consulta: document.getElementById('setting-wa-consulta').value.trim(),
        mensaje_pedido_saludo: document.getElementById('setting-wa-saludo').value.trim(),
        mensaje_pedido_pie: document.getElementById('setting-wa-pie').value.trim(),
        auto_reply: suggestedAutoReplyText ? suggestedAutoReplyText.textContent.trim() : ''
      };

      const ok = await saveSettings(newSettings);

      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar Configuración';
      settingsModal.close();

      showToast(ok ? '¡Ajustes de WhatsApp guardados!' : 'Guardado localmente (revisar conexión)');
      if (typeof onSettingsSaved === 'function') onSettingsSaved();
    });
  }
}
