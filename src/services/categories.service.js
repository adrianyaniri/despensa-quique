import { sbClient } from '../supabase.js';

const STORAGE_KEY = 'quique_categorias';

const DEFAULT_CATEGORIES = [
  { id: 'bebidas', nombre: 'Bebidas' },
  { id: 'cervezas', nombre: 'Cervezas' },
  { id: 'promos', nombre: 'Promos' },
  { id: 'picadas', nombre: 'Picadas' },
  { id: 'snacks', nombre: 'Snacks' }
];

/**
 * Fetches all categories, ordered alphabetically by name.
 * Falls back to localStorage and DEFAULT_CATEGORIES.
 * @returns {Promise<Array<{ id: string, nombre: string }>>}
 */
export async function fetchCategories() {
  try {
    const { data, error } = await sbClient
      .from('categorias')
      .select('*')
      .order('nombre', { ascending: true });

    if (!error && data && data.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Categories: error fetching from Supabase, using cache/fallback:', err);
  }

  // Fallback 1: localStorage
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  // Fallback 2: static menu.json or defaults
  try {
    const res = await fetch('/menu.json');
    const menu = await res.json();
    if (menu && Array.isArray(menu.categorias)) {
      const cats = menu.categorias.map(c => ({
        id: c.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        nombre: c
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
      return cats;
    }
  } catch (e) {}

  return DEFAULT_CATEGORIES;
}

/**
 * Saves (creates or updates) a category.
 * Prevents duplicate names (case-insensitive).
 * @param {{ id?: string, nombre: string }} category
 * @param {Array} existingCategories
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function saveCategory(category, existingCategories = []) {
  const cleanName = (category.nombre || '').trim();
  if (!cleanName) {
    return { success: false, error: 'El nombre de la categoría no puede estar vacío.' };
  }

  const id = category.id || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Check for duplicate names (excluding current category when editing)
  const isDuplicate = existingCategories.some(c => 
    c.id !== id && c.nombre.trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (isDuplicate) {
    return { success: false, error: `Ya existe una categoría llamada "${cleanName}".` };
  }

  const payload = { id, nombre: cleanName };

  // Try Supabase first
  try {
    const { error } = await sbClient.from('categorias').upsert(payload);
    if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
      console.warn('Categories: upsert error in Supabase:', error);
    }
  } catch (e) {
    console.warn('Categories: exception in Supabase:', e);
  }

  // Update localStorage cache
  try {
    const current = await fetchCategories();
    const idx = current.findIndex(c => c.id === id);
    if (idx >= 0) {
      current[idx] = payload;
    } else {
      current.push(payload);
    }
    current.sort((a, b) => a.nombre.localeCompare(b.nombre));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {}

  return { success: true, data: payload };
}

/**
 * Deletes a category by ID.
 * Rejects if there are products assigned to this category.
 * @param {string} id
 * @param {string} categoryName
 * @param {Array} currentProducts
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function deleteCategory(id, categoryName, currentProducts = []) {
  // Check if any product is using this category
  const assignedProducts = currentProducts.filter(p => 
    p.categoria === categoryName || p.categoria?.toLowerCase() === categoryName.toLowerCase()
  );

  if (assignedProducts.length > 0) {
    return {
      success: false,
      error: `No se puede eliminar "${categoryName}" porque hay ${assignedProducts.length} producto(s) asignado(s) a esta categoría. Reasignalos antes de borrarla.`
    };
  }

  try {
    const { error } = await sbClient.from('categorias').delete().eq('id', id);
    if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
      console.warn('Categories: delete error in Supabase:', error);
    }
  } catch (e) {}

  // Update localStorage cache
  try {
    const current = await fetchCategories();
    const filtered = current.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {}

  return { success: true };
}

