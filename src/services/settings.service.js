import { sbClient } from '../supabase.js';
import { CONFIG } from '../config.js';
import { sanitizePhoneNumber } from '../utils/phone.js';

const STORAGE_KEY = 'quique_settings';

/**
 * Default settings derived from environment config.
 * Used as fallback when Supabase is unavailable.
 * @returns {object}
 */
function getDefaults() {
  return {
    whatsapp_number: sanitizePhoneNumber(CONFIG.WHATSAPP_NUMBER),
    mensaje_consulta: CONFIG.MENSAJE_CONSULTA,
    mensaje_pedido_saludo: CONFIG.MENSAJE_PEDIDO.saludo,
    mensaje_pedido_pie: CONFIG.MENSAJE_PEDIDO.pie,
  };
}

/**
 * Returns the active settings, merging cached localStorage data with defaults.
 * Phone number is always sanitized before return.
 * @returns {{ whatsapp_number: string, mensaje_consulta: string, mensaje_pedido_saludo: string, mensaje_pedido_pie: string }}
 */
export function getSettings() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const defaults = getDefaults();
      return {
        whatsapp_number: sanitizePhoneNumber(parsed.whatsapp_number || defaults.whatsapp_number),
        mensaje_consulta: parsed.mensaje_consulta || defaults.mensaje_consulta,
        mensaje_pedido_saludo: parsed.mensaje_pedido_saludo || defaults.mensaje_pedido_saludo,
        mensaje_pedido_pie: parsed.mensaje_pedido_pie || defaults.mensaje_pedido_pie,
      };
    } catch (e) {}
  }
  return getDefaults();
}

/**
 * Saves settings to both localStorage and Supabase (best-effort).
 * Always writes to localStorage first to ensure availability.
 * @param {object} settings
 * @returns {Promise<boolean>} true if saved to Supabase, false if only local
 */
export async function saveSettings(settings) {
  const payload = {
    id: 'general',
    ...settings,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

  try {
    const { error } = await sbClient.from('configuracion').upsert(payload);
    return !error;
  } catch (e) {
    console.warn('Settings: could not persist to Supabase:', e);
    return false;
  }
}

/**
 * Fetches fresh settings from Supabase and updates localStorage cache.
 * Silently ignores network errors (localStorage is the fallback).
 * @param {Function} [onUpdate] - optional callback fired when remote data arrives
 * @returns {Promise<void>}
 */
export async function syncSettings(onUpdate) {
  try {
    const { data, error } = await sbClient
      .from('configuracion')
      .select('*')
      .eq('id', 'general')
      .single();

    if (!error && data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      onUpdate?.();
    }
  } catch (e) {
    console.warn('Settings: sync failed, using cached data:', e);
  }
}
