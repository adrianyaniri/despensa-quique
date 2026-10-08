import { fetchCategories, saveCategory, deleteCategory } from '../../services/categories.service.js';
import { saveProduct } from '../../services/products.service.js';
import { showToast } from '../../components/toast.js';

let categories = [];
let allProducts = [];
let onCategoriesUpdatedCallback = null;

export async function loadAdminCategories(products = []) {
  if (products && products.length > 0) {
    allProducts = products;
  }
  categories = await fetchCategories();
  renderCategoriesBadge();
  renderCategoriesTable();
}

function renderCategoriesBadge() {
  const badge = document.getElementById('tab-badge-categories');
  if (badge) badge.textContent = categories.length;
}

function renderCategoriesTable() {
  const container = document.getElementById('categories-table');
  if (!container) return;

  if (categories.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-xs text-muted space-y-2">
        <p>No hay categorías registradas.</p>
        <p>Hacé clic en <strong>+ Nueva Categoría</strong> para crear la primera.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <table class="w-full text-left border-collapse text-xs">
      <thead>
        <tr class="border-b border-line bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
          <th class="py-3 px-4">Categoría</th>
          <th class="py-3 px-4 text-center">Productos Asignados</th>
          <th class="py-3 px-4 text-right">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-line">
        ${categories.map(cat => {
          const count = allProducts.filter(p => 
            p.categoria === cat.nombre || p.categoria?.toLowerCase() === cat.nombre.toLowerCase()
          ).length;

          return `
            <tr class="hover:bg-stone-50/60 transition-colors">
              <td class="py-3.5 px-4 font-bold text-sm text-ink">
                ${cat.nombre}
              </td>
              <td class="py-3.5 px-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  count > 0 ? 'bg-stone-100 text-stone-800' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }">
                  ${count} ${count === 1 ? 'producto' : 'productos'}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button type="button" data-edit-cat-id="${cat.id}" data-cat-name="${cat.nombre}"
                    title="Editar categoría"
                    class="btn-edit-cat w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer">
                    ✎
                  </button>
                  <button type="button" data-delete-cat-id="${cat.id}" data-cat-name="${cat.nombre}"
                    title="Eliminar categoría"
                    class="btn-delete-cat w-8 h-8 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-600 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer">
                    🗑
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  // Wire buttons
  container.querySelectorAll('.btn-edit-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-cat-id');
      const name = btn.getAttribute('data-cat-name');
      openCategoryModal(id, name);
    });
  });

  container.querySelectorAll('.btn-delete-cat').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-cat-id');
      const name = btn.getAttribute('data-cat-name');

      if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;

      const res = await deleteCategory(id, name, allProducts);
      if (!res.success) {
        showToast(res.error, true);
      } else {
        showToast(`Categoría "${name}" eliminada`);
        await loadAdminCategories(allProducts);
        if (onCategoriesUpdatedCallback) onCategoriesUpdatedCallback();
      }
    });
  });
}

function openCategoryModal(id = '', name = '') {
  const modal = document.getElementById('category-modal');
  const title = document.getElementById('category-modal-title');
  const inputId = document.getElementById('cat-id');
  const inputName = document.getElementById('cat-name');

  if (!modal || !inputName) return;

  if (id) {
    if (title) title.textContent = 'Editar Categoría';
    inputId.value = id;
    inputId.setAttribute('data-old-name', name);
    inputName.value = name;
  } else {
    if (title) title.textContent = 'Nueva Categoría';
    inputId.value = '';
    inputId.removeAttribute('data-old-name');
    inputName.value = '';
  }

  modal.showModal();
}

export function initAdminCategories(onUpdated) {
  onCategoriesUpdatedCallback = onUpdated;

  const addCatBtn = document.getElementById('add-category-btn');
  const cancelCatBtn = document.getElementById('cancel-category-btn');
  const catModal = document.getElementById('category-modal');
  const catForm = document.getElementById('category-form');

  if (addCatBtn) {
    addCatBtn.addEventListener('click', () => openCategoryModal());
  }

  if (cancelCatBtn && catModal) {
    cancelCatBtn.addEventListener('click', () => catModal.close());
  }

  if (catForm) {
    catForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inputId = document.getElementById('cat-id');
      const inputName = document.getElementById('cat-name');
      const id = inputId.value.trim();
      const oldName = inputId.getAttribute('data-old-name');
      const name = inputName.value.trim();

      const saveBtn = document.getElementById('save-cat-btn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';
      }

      const res = await saveCategory({ id: id || undefined, nombre: name }, categories);

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar';
      }

      if (!res.success) {
        showToast(res.error, true);
        return;
      }

      // If category was renamed, update any products using the old name
      if (id && oldName && oldName !== name) {
        const toUpdate = allProducts.filter(p => p.categoria === oldName);
        for (const prod of toUpdate) {
          prod.categoria = name;
          await saveProduct(prod);
        }
      }

      if (catModal) catModal.close();
      showToast(id ? 'Categoría actualizada' : 'Categoría creada con éxito');
      await loadAdminCategories(allProducts);
      if (onCategoriesUpdatedCallback) onCategoriesUpdatedCallback();
    });
  }
}

