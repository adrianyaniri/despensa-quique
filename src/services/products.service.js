import { sbClient } from '../supabase.js';

const STORAGE_KEY = 'quique_productos';

/**
 * Fetches all products from Supabase ordered by creation date.
 * Falls back to the local menu.json file if Supabase fails or is unavailable.
 * Caches the result in localStorage for offline resilience.
 *
 * @returns {Promise<Array>} array of product objects
 */
export async function fetchProducts() {
  try {
    const { data, error } = await sbClient
      .from('productos')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }

    console.warn('Products: Supabase returned empty or error, trying menu.json fallback:', error);
  } catch (err) {
    console.warn('Products: network error, trying menu.json fallback:', err);
  }

  // Fallback 1: cached localStorage
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }

  // Fallback 2: static menu.json
  try {
    const res = await fetch('/menu.json');
    const fallback = await res.json();
    const items = Array.isArray(fallback) ? fallback : (fallback.productos || []);
    return items.map(x => ({
      id: x.id || x.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      nombre: x.nombre,
      categoria: x.categoria,
      precio: x.precio,
      descripcion: x.descripcion || '',
      disponible: x.disponible !== false,
      mostrar_en_precios: x.mostrar_en_precios !== false,
      unidad: x.unidad || 'c/u',
    }));
  } catch (e) {
    console.error('Products: all data sources failed:', e);
    return [];
  }
}

/**
 * Fetches only products visible to the public in /precios.
 * @returns {Promise<Array>}
 */
export async function fetchPublicProducts() {
  const all = await fetchProducts();
  return all.filter(p => p.mostrar_en_precios !== false);
}

/**
 * Saves (upserts) a product to Supabase. Always returns the saved product.
 * @param {object} product
 * @returns {Promise<{ success: boolean, error?: object }>}
 */
export async function saveProduct(product) {
  try {
    const { error } = await sbClient.from('productos').upsert(product);
    if (error) {
      console.error('Products: upsert error:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (e) {
    console.error('Products: upsert exception:', e);
    return { success: false, error: e };
  }
}

/**
 * Toggles the `disponible` (stock) field of a product.
 * @param {string} id
 * @param {boolean} disponible
 * @returns {Promise<{ success: boolean }>}
 */
export async function toggleProductAvailability(id, disponible) {
  try {
    const { error } = await sbClient
      .from('productos')
      .update({ disponible })
      .eq('id', id);
    return { success: !error };
  } catch (e) {
    return { success: false };
  }
}

/**
 * Toggles the `mostrar_en_precios` (visibility in /precios) field of a product.
 * @param {string} id
 * @param {boolean} mostrar_en_precios
 * @returns {Promise<{ success: boolean, error?: object }>}
 */
export async function toggleProductCatalogVisibility(id, mostrar_en_precios) {
  try {
    const { error } = await sbClient
      .from('productos')
      .update({ mostrar_en_precios })
      .eq('id', id);
    if (error) {
      console.error('Products: error toggling catalog visibility:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (e) {
    console.error('Products: exception toggling catalog visibility:', e);
    return { success: false, error: e };
  }
}

/**
 * Deletes a product by ID.
 * @param {string} id
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteProduct(id) {
  try {
    const { error } = await sbClient.from('productos').delete().eq('id', id);
    return { success: !error };
  } catch (e) {
    return { success: false };
  }
}
