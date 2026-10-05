import { sbClient } from '../supabase.js';

const STORAGE_KEY = 'quique_ofertas';

/**
 * Fetches all offers from Supabase ordered by creation date.
 * If Supabase errors, falls back to local storage cache.
 * If table is empty, returns an empty array (no artificial mocks).
 *
 * @returns {Promise<Array>} array of offer objects
 */
export async function fetchOffers() {
  try {
    const { data, error } = await sbClient
      .from('ofertas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Offers: error from Supabase, attempting local cache fallback:', error);
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    }

    const offers = data || [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
    return offers;
  } catch (err) {
    console.warn('Offers: network error, attempting local cache fallback:', err);
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

/**
 * Saves (upserts) an offer to Supabase and syncs local storage.
 * @param {object} offer
 * @returns {Promise<{ success: boolean, error?: object }>}
 */
export async function saveOffer(offer) {
  try {
    const { error } = await sbClient.from('ofertas').upsert(offer);
    if (error) {
      console.error('Offers: upsert error in Supabase:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error('Offers: exception during upsert:', err);
    return { success: false, error: err };
  }
}

/**
 * Toggles the `activo` status of an offer.
 * @param {string} id
 * @param {boolean} activo
 * @returns {Promise<{ success: boolean }>}
 */
export async function toggleOfferActive(id, activo) {
  try {
    const { error } = await sbClient
      .from('ofertas')
      .update({ activo })
      .eq('id', id);
    return { success: !error };
  } catch (err) {
    return { success: false };
  }
}

/**
 * Deletes an offer by ID.
 * @param {string} id
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteOffer(id) {
  try {
    const { error } = await sbClient
      .from('ofertas')
      .delete()
      .eq('id', id);
    return { success: !error };
  } catch (err) {
    return { success: false };
  }
}
