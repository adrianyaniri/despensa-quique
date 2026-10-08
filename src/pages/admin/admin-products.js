import * as XLSX from 'xlsx';
import { fetchProducts, saveProduct, toggleProductAvailability, toggleProductCatalogVisibility, deleteProduct as apiDeleteProduct } from '../../services/products.service.js';
import { fetchCategories } from '../../services/categories.service.js';
import { loadAdminCategories } from './admin-categories.js';
import { refreshComboProducts } from './admin-offers.js';
import { sbClient } from '../../supabase.js';
import { showToast } from '../../components/toast.js';

let products = [];
let categoriesList = [];
let activeAdminCat = 'Todos';
let adminQuery = '';
let currentPage = 1;
let pageSize = 15;
let sortField = 'nombre';
let sortDirection = 'asc';

export async function loadProducts() {
  const table = document.getElementById('products-table');
  if (table) {
    table.innerHTML = '<div class="p-10 text-center text-xs text-muted">Cargando inventario maestro...</div>';
  }

  const [prodsData, catsData] = await Promise.all([
    fetchProducts(),
    fetchCategories()
  ]);

  products = prodsData;
  categoriesList = catsData;

  renderStats();
  renderCategoriesFilters();
  populateCategorySelect();
  renderProducts();

  // Keep categories tab in sync
  loadAdminCategories(products);
  refreshComboProducts();
}

function renderStats() {
  const total = products.length;
  const active = products.filter(p => p.disponible !== false).length;
  const inactive = total - active;
  const elTotal = document.getElementById('stat-total');
  const elActive = document.getElementById('stat-active');
  const elInactive = document.getElementById('stat-inactive');
  const badgeProd = document.getElementById('tab-badge-products');
  const countBadge = document.getElementById('products-count-badge');

  if (elTotal) elTotal.textContent = total;
  if (elActive) elActive.textContent = active;
  if (elInactive) elInactive.textContent = inactive;
  if (badgeProd) badgeProd.textContent = total;
  if (countBadge) countBadge.textContent = `${total} artículos en catálogo`;
}

function renderCategoriesFilters() {
  const catBox = document.getElementById('admin-categories');
  if (!catBox) return;

  const names = ['Todos', ...new Set(categoriesList.map(c => c.nombre).filter(Boolean))];

  catBox.innerHTML = names.map(c => `
    <button type="button" data-cat="${c}" class="admin-cat-btn shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
      c === activeAdminCat
        ? 'bg-ink text-white shadow-xs'
        : 'bg-white border border-line text-stone-600 hover:bg-stone-100'
    }">${c}</button>
  `).join('');

  catBox.querySelectorAll('.admin-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeAdminCat = btn.getAttribute('data-cat');
      currentPage = 1;
      renderCategoriesFilters();
      renderProducts();
    });
  });
}

function populateCategorySelect() {
  const select = document.getElementById('prod-category');
  if (!select) return;

  select.innerHTML = categoriesList.map(c => `
    <option value="${c.nombre}">${c.nombre}</option>
  `).join('');
}

function renderProducts() {
  const tableContainer = document.getElementById('products-table');
  const paginationContainer = document.getElementById('products-pagination');
  if (!tableContainer) return;

  // 1. Filtrado
  const filtered = products.filter(p => {
    const matchesCat = activeAdminCat === 'Todos' || p.categoria === activeAdminCat;
    const query = adminQuery.toLowerCase();
    const matchesQuery = (
      (p.nombre || '').toLowerCase() + ' ' +
      (p.descripcion || '').toLowerCase() + ' ' +
      (p.categoria || '').toLowerCase()
    ).includes(query);
    return matchesCat && matchesQuery;
  });

  // 2. Ordenamiento (por Nombre A-Z o Precio)
  filtered.sort((a, b) => {
    if (sortField === 'nombre') {
      const comp = (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' });
      return sortDirection === 'asc' ? comp : -comp;
    }
    if (sortField === 'precio') {
      const comp = (Number(a.precio) || 0) - (Number(b.precio) || 0);
      return sortDirection === 'asc' ? comp : -comp;
    }
    return 0;
  });

  if (!filtered.length) {
    tableContainer.innerHTML = `
      <div class="py-12 px-4 text-center text-xs text-muted space-y-1">
        <p class="text-2xl">📦</p>
        <p class="font-bold text-stone-700 text-sm">No se encontraron productos coincidentes</p>
        <p>Probá cambiando el filtro de categoría o limpiando la búsqueda.</p>
      </div>`;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  // 3. Paginación
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = filtered.slice(startIndex, endIndex);

  // Indicadores de ordenamiento visual
  const arrowNombre = sortField === 'nombre' ? (sortDirection === 'asc' ? '▲ A-Z' : '▼ Z-A') : '⇅';
  const arrowPrecio = sortField === 'precio' ? (sortDirection === 'asc' ? '▲ Menor' : '▼ Mayor') : '⇅';

  // 4. Renderizado de Tabla Limpia
  tableContainer.innerHTML = `
    <table class="w-full text-left border-collapse min-w-[620px]">
      <thead>
        <tr class="border-b border-line bg-stone-50/70 text-[11px] font-bold text-stone-500 uppercase tracking-wider select-none">
          <th id="sort-col-nombre" class="py-3 px-4 cursor-pointer hover:bg-stone-100 transition-colors" title="Hacé clic para ordenar por nombre de producto">
            <div class="flex items-center gap-1.5">
              <span>Producto</span>
              <span class="text-[10px] font-bold ${sortField === 'nombre' ? 'text-ink' : 'text-stone-400'}">${arrowNombre}</span>
            </div>
          </th>
          <th id="sort-col-precio" class="py-3 px-3 text-right w-32 cursor-pointer hover:bg-stone-100 transition-colors" title="Hacé clic para ordenar por precio">
            <div class="flex items-center gap-1.5 justify-end">
              <span>Precio ($)</span>
              <span class="text-[10px] font-bold ${sortField === 'precio' ? 'text-ink' : 'text-stone-400'}">${arrowPrecio}</span>
            </div>
          </th>
          <th class="py-3 px-3 text-center w-36">Stock</th>
          <th class="py-3 px-3 text-center w-36">Visible en Web</th>
          <th class="py-3 px-4 text-right w-24">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-line text-xs">
        ${currentItems.map(p => {
          const isAvailable = p.disponible !== false;
          const isPublic = p.mostrar_en_precios !== false;

          return `
            <tr class="hover:bg-stone-50/80 transition-colors">
              <!-- Columna: Producto -->
              <td class="py-3 px-4">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="font-bold text-ink text-sm leading-snug">${p.nombre}</p>
                    <span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
                      ${p.categoria}
                    </span>
                    ${p.unidad === 'kg' ? '<span class="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">⚖️ /kg</span>' : ''}
                  </div>
                  ${p.descripcion ? `<p class="text-[11px] text-muted line-clamp-1">${p.descripcion}</p>` : ''}
                </div>
              </td>

              <!-- Columna: Precio -->
              <td class="py-3 px-3 text-right">
                <div class="inline-flex items-center gap-1 justify-end">
                  <span class="text-xs font-bold text-stone-400">$</span>
                  <input type="number" step="50" min="0" value="${p.precio}"
                    data-id="${p.id}"
                    class="price-input w-20 rounded-xl bg-stone-100 hover:bg-stone-200/60 focus:bg-white border border-stone-200 px-2 py-1.5 text-xs font-black text-ink outline-none focus:border-stone-400 text-right transition-all" />
                  ${p.unidad === 'kg' ? '<span class="text-[10px] font-bold text-stone-500">/kg</span>' : ''}
                </div>
              </td>

              <!-- Columna: Stock -->
              <td class="py-3 px-3 text-center">
                <label class="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" ${isAvailable ? 'checked' : ''} data-id="${p.id}" class="stock-toggle sr-only peer">
                  <div class="w-8 h-4.5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                  <span class="text-[11px] font-semibold w-16 text-left ${isAvailable ? 'text-emerald-700' : 'text-stone-400'}">
                    ${isAvailable ? 'En stock' : 'Agotado'}
                  </span>
                </label>
              </td>

              <!-- Columna: Visible en Web (/precios) -->
              <td class="py-3 px-3 text-center">
                <label class="inline-flex items-center gap-1.5 cursor-pointer select-none" title="Publicar o retirar del catálogo público web">
                  <input type="checkbox" ${isPublic ? 'checked' : ''} data-id="${p.id}" class="catalog-toggle sr-only peer">
                  <div class="w-8 h-4.5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600 relative"></div>
                  <span class="text-[11px] font-semibold w-16 text-left ${isPublic ? 'text-blue-700' : 'text-stone-400'}">
                    ${isPublic ? 'Visible' : 'Oculto'}
                  </span>
                </label>
              </td>

              <!-- Columna: Acciones -->
              <td class="py-3 px-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <button type="button" data-edit-id="${p.id}" title="Editar detalles"
                    class="btn-edit w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer">
                    ✎
                  </button>
                  <button type="button" data-delete-id="${p.id}" data-name="${p.nombre}" title="Eliminar del inventario"
                    class="btn-delete w-8 h-8 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-600 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer">
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

  // 4. Renderizado de Controles de Paginación
  if (paginationContainer) {
    paginationContainer.innerHTML = `
      <div class="text-stone-500 font-medium text-xs">
        Mostrando <span class="font-bold text-ink">${startIndex + 1}</span> a <span class="font-bold text-ink">${endIndex}</span> de <span class="font-bold text-ink">${totalItems}</span> productos
      </div>

      <div class="flex items-center gap-4">
        <!-- Selector de tamaño de página -->
        <div class="flex items-center gap-1.5 text-xs text-stone-500">
          <span>Por pág:</span>
          <select id="select-page-size" class="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-semibold text-ink outline-none cursor-pointer">
            <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
            <option value="15" ${pageSize === 15 ? 'selected' : ''}>15</option>
            <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
            <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
          </select>
        </div>

        <!-- Botones de navegación de página -->
        <div class="inline-flex items-center gap-1">
          <button type="button" id="btn-page-prev" ${currentPage <= 1 ? 'disabled' : ''}
            class="px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-bold transition-colors ${
              currentPage <= 1 ? 'text-stone-300 border-stone-100 cursor-not-allowed' : 'bg-white hover:bg-stone-100 text-stone-700 cursor-pointer'
            }">
            ← Ant
          </button>

          <span class="px-2 py-1 text-xs font-bold text-ink">
            ${currentPage} / ${totalPages}
          </span>

          <button type="button" id="btn-page-next" ${currentPage >= totalPages ? 'disabled' : ''}
            class="px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-bold transition-colors ${
              currentPage >= totalPages ? 'text-stone-300 border-stone-100 cursor-not-allowed' : 'bg-white hover:bg-stone-100 text-stone-700 cursor-pointer'
            }">
            Sig →
          </button>
        </div>
      </div>
    `;

    // Eventos de Paginación
    const btnPrev = document.getElementById('btn-page-prev');
    const btnNext = document.getElementById('btn-page-next');
    const selPageSize = document.getElementById('select-page-size');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderProducts();
        }
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderProducts();
        }
      });
    }

    if (selPageSize) {
      selPageSize.addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value, 10) || 15;
        currentPage = 1;
        renderProducts();
      });
    }
  }

  // 5. Enlace de Eventos de Ordenamiento
  tableContainer.querySelector('#sort-col-nombre')?.addEventListener('click', () => {
    if (sortField === 'nombre') {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = 'nombre';
      sortDirection = 'asc';
    }
    currentPage = 1;
    renderProducts();
  });

  tableContainer.querySelector('#sort-col-precio')?.addEventListener('click', () => {
    if (sortField === 'precio') {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = 'precio';
      sortDirection = 'asc';
    }
    currentPage = 1;
    renderProducts();
  });

  // 6. Enlace de Eventos de la Tabla
  tableContainer.querySelectorAll('.price-input').forEach(input => {
    input.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const val = parseFloat(e.target.value);
      if (isNaN(val) || val < 0) {
        showToast('Precio inválido', true);
        return;
      }
      const { error } = await sbClient.from('productos').update({ precio: val }).eq('id', id);
      if (error) {
        showToast('Error al actualizar precio: ' + error.message, true);
      } else {
        const prod = products.find(x => x.id === id);
        if (prod) prod.precio = val;
        showToast(`Precio actualizado: $${val.toLocaleString('es-AR')}`);
      }
    });
  });

  tableContainer.querySelectorAll('.stock-toggle').forEach(chk => {
    chk.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const isAvailable = e.target.checked;
      const res = await toggleProductAvailability(id, isAvailable);
      if (!res.success) {
        showToast('Error al actualizar disponibilidad', true);
        renderProducts();
      } else {
        const prod = products.find(x => x.id === id);
        if (prod) prod.disponible = isAvailable;
        renderStats();
        renderProducts();
        showToast(isAvailable ? 'Marcado como En Stock' : 'Marcado como Agotado');
      }
    });
  });

  tableContainer.querySelectorAll('.catalog-toggle').forEach(chk => {
    chk.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const isPublic = e.target.checked;
      const res = await toggleProductCatalogVisibility(id, isPublic);
      if (!res.success) {
        showToast('Error al actualizar visibilidad web', true);
        renderProducts();
      } else {
        const prod = products.find(x => x.id === id);
        if (prod) prod.mostrar_en_precios = isPublic;
        renderProducts();
        showToast(isPublic ? 'Visible en catálogo web (/precios)' : 'Oculto de la web pública');
      }
    });
  });

  tableContainer.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-id');
      openEditModal(id);
    });
  });

  tableContainer.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-id');
      const name = btn.getAttribute('data-name');
      if (!confirm(`¿Estás seguro de que querés eliminar "${name}" del inventario?`)) return;

      const res = await apiDeleteProduct(id);
      if (!res.success) {
        showToast('Error al eliminar producto', true);
      } else {
        products = products.filter(p => p.id !== id);
        renderStats();
        renderCategoriesFilters();
        renderProducts();
        loadAdminCategories(products);
        showToast(`"${name}" eliminado`);
      }
    });
  });
}

function openEditModal(id) {
  const modal = document.getElementById('product-modal');
  const p = products.find(x => x.id === id);
  if (!p || !modal) return;

  populateCategorySelect();

  document.getElementById('modal-title').textContent = 'Editar Producto';
  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-name').value = p.nombre;
  document.getElementById('prod-category').value = p.categoria;
  document.getElementById('prod-price').value = p.precio;
  const unitSelect = document.getElementById('prod-unit');
  if (unitSelect) unitSelect.value = p.unidad || 'c/u';
  document.getElementById('prod-desc').value = p.descripcion || '';
  document.getElementById('prod-available').checked = p.disponible !== false;
  const catChk = document.getElementById('prod-catalog');
  if (catChk) catChk.checked = p.mostrar_en_precios !== false;

  modal.showModal();
}

/**
 * Exporta el inventario filtrado o completo a formato Excel (.xlsx) o CSV (.csv).
 * @param {'xlsx' | 'csv'} format
 */
export function exportProducts(format = 'xlsx') {
  if (!products || products.length === 0) {
    showToast('No hay productos para exportar', true);
    return;
  }

  const exportList = activeAdminCat === 'Todos'
    ? [...products]
    : products.filter(p => p.categoria === activeAdminCat);

  if (!exportList.length) {
    showToast(`No hay productos en la categoría "${activeAdminCat}"`, true);
    return;
  }

  // Ordenar la exportación con el mismo criterio activo
  exportList.sort((a, b) => {
    if (sortField === 'nombre') {
      const comp = (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' });
      return sortDirection === 'asc' ? comp : -comp;
    }
    if (sortField === 'precio') {
      const comp = (Number(a.precio) || 0) - (Number(b.precio) || 0);
      return sortDirection === 'asc' ? comp : -comp;
    }
    return 0;
  });

  // Mapeo limpio y tipado para la planilla
  const data = exportList.map(p => ({
    'Código': p.id || '',
    'Producto': p.nombre || '',
    'Categoría': p.categoria || '',
    'Precio ($)': Number(p.precio) || 0,
    'Stock': p.disponible !== false ? 'En Stock' : 'Agotado',
    'Visible en Web (/precios)': p.mostrar_en_precios !== false ? 'Visible' : 'Oculto',
    'Descripción': p.descripcion || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

  const catSlug = activeAdminCat === 'Todos' ? 'completo' : activeAdminCat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const dateStr = new Date().toISOString().slice(0, 10);

  if (format === 'xlsx') {
    XLSX.writeFile(workbook, `inventario_quique_${catSlug}_${dateStr}.xlsx`);
    showToast(`Excel descargado (${exportList.length} productos)`);
  } else {
    XLSX.writeFile(workbook, `inventario_quique_${catSlug}_${dateStr}.csv`, { bookType: 'csv' });
    showToast(`CSV descargado (${exportList.length} productos)`);
  }
}

export function initAdminProducts() {
  const adminSearch = document.getElementById('admin-search');
  if (adminSearch) {
    adminSearch.addEventListener('input', (e) => {
      adminQuery = e.target.value.trim();
      currentPage = 1;
      renderProducts();
    });
  }

  const exportXlsxBtn = document.getElementById('export-products-xlsx-btn');
  if (exportXlsxBtn) {
    exportXlsxBtn.addEventListener('click', () => exportProducts('xlsx'));
  }

  const exportCsvBtn = document.getElementById('export-products-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => exportProducts('csv'));
  }

  const modal = document.getElementById('product-modal');
  const addProdBtn = document.getElementById('add-product-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');
  const prodForm = document.getElementById('product-form');
  const btnQuickCat = document.getElementById('btn-quick-new-cat');

  if (btnQuickCat) {
    btnQuickCat.addEventListener('click', () => {
      const catModal = document.getElementById('category-modal');
      if (catModal) {
        document.getElementById('cat-id').value = '';
        document.getElementById('cat-name').value = '';
        catModal.showModal();
      }
    });
  }

  if (addProdBtn && modal) {
    addProdBtn.addEventListener('click', () => {
      populateCategorySelect();
      document.getElementById('modal-title').textContent = 'Nuevo Producto';
      document.getElementById('prod-id').value = '';
      document.getElementById('prod-name').value = '';
      const catSelect = document.getElementById('prod-category');
      if (catSelect) {
        catSelect.value = (activeAdminCat !== 'Todos' && categoriesList.some(c => c.nombre === activeAdminCat))
          ? activeAdminCat
          : (categoriesList[0]?.nombre || 'Bebidas');
      }
      document.getElementById('prod-price').value = '';
      const unitSelect = document.getElementById('prod-unit');
      if (unitSelect) unitSelect.value = 'c/u';
      document.getElementById('prod-desc').value = '';
      document.getElementById('prod-available').checked = true;
      const catChk = document.getElementById('prod-catalog');
      if (catChk) catChk.checked = true;
      modal.showModal();
    });
  }

  if (cancelModalBtn && modal) {
    cancelModalBtn.addEventListener('click', () => modal.close());
  }

  if (prodForm) {
    prodForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idInput = document.getElementById('prod-id').value.trim();
      const name = document.getElementById('prod-name').value.trim();
      const category = document.getElementById('prod-category').value.trim();
      const price = parseFloat(document.getElementById('prod-price').value);
      const unit = document.getElementById('prod-unit')?.value || 'c/u';
      const desc = document.getElementById('prod-desc').value.trim();
      const available = document.getElementById('prod-available').checked;
      const inCatalog = document.getElementById('prod-catalog').checked;

      // 1. Validación de Duplicados (Punto 1 del requerimiento)
      const isDuplicate = products.some(p => 
        p.id !== idInput && p.nombre.trim().toLowerCase() === name.toLowerCase()
      );
      if (isDuplicate) {
        showToast(`Ya existe un producto con el nombre "${name}". No se permiten duplicados.`, true);
        return;
      }

      const saveBtn = document.getElementById('save-prod-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';

      const prodId = idInput || (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4));
      const payload = {
        id: prodId,
        nombre: name,
        categoria: category,
        precio: price,
        descripcion: desc,
        disponible: available,
        mostrar_en_precios: inCatalog,
        unidad: unit
      };

      const res = await saveProduct(payload);
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar';

      if (!res.success) {
        showToast('Error al guardar el producto', true);
      } else {
        if (modal) modal.close();
        showToast(idInput ? 'Producto actualizado' : 'Producto creado con éxito');
        loadProducts();
      }
    });
  }
}
