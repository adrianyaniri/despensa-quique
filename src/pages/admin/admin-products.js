import { fetchProducts, saveProduct, toggleProductAvailability, deleteProduct as apiDeleteProduct } from '../../services/products.service.js';
import { sbClient } from '../../supabase.js';
import { showToast } from '../../components/toast.js';

let products = [];
let activeAdminCat = 'Todos';
let adminQuery = '';

export async function loadProducts() {
  const table = document.getElementById('products-table');
  if (!table) return;
  table.innerHTML = '<div class="p-8 text-center text-xs text-muted">Cargando catálogo desde la base de datos...</div>';

  products = await fetchProducts();
  renderStats();
  renderCategories();
  renderProducts();
}

function renderStats() {
  const total = products.length;
  const active = products.filter(p => p.disponible !== false).length;
  const inactive = total - active;
  const elTotal = document.getElementById('stat-total');
  const elActive = document.getElementById('stat-active');
  const elInactive = document.getElementById('stat-inactive');
  const badgeProd = document.getElementById('tab-badge-products');
  if (elTotal) elTotal.textContent = total;
  if (elActive) elActive.textContent = active;
  if (elInactive) elInactive.textContent = inactive;
  if (badgeProd) badgeProd.textContent = total;
}

function renderCategories() {
  const catBox = document.getElementById('admin-categories');
  const datalist = document.getElementById('category-datalist');
  const uniqueCats = [...new Set(products.map(p => p.categoria).filter(Boolean))];

  if (catBox) {
    const filterCats = ['Todos', ...uniqueCats];
    catBox.innerHTML = filterCats.map(c => `
      <button type="button" data-cat="${c}" class="admin-cat-btn shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
        c === activeAdminCat ? 'bg-ink text-white shadow-xs' : 'bg-white border border-line text-stone-600 hover:bg-stone-100'
      }">${c}</button>
    `).join('');

    catBox.querySelectorAll('.admin-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeAdminCat = btn.getAttribute('data-cat');
        renderCategories();
        renderProducts();
      });
    });
  }

  if (datalist) {
    datalist.innerHTML = uniqueCats.map(c => `<option value="${c}"></option>`).join('');
  }

  renderQuickCategoryPills(uniqueCats);
}

function renderQuickCategoryPills(categories) {
  const pillsBox = document.getElementById('quick-category-pills');
  if (!pillsBox) return;

  pillsBox.innerHTML = categories.map(c => `
    <button type="button" data-choose-cat="${c}"
      class="quick-cat-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 transition-colors cursor-pointer border border-stone-200">
      ${c}
    </button>
  `).join('');

  pillsBox.querySelectorAll('.quick-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-choose-cat');
      const input = document.getElementById('prod-category');
      if (input) input.value = cat;
    });
  });
}

function renderProducts() {
  const table = document.getElementById('products-table');
  if (!table) return;

  const filtered = products.filter(p => {
    const matchesCat = activeAdminCat === 'Todos' || p.categoria === activeAdminCat;
    const matchesQuery = (p.nombre + ' ' + (p.descripcion || '') + ' ' + p.categoria).toLowerCase().includes(adminQuery);
    return matchesCat && matchesQuery;
  });

  if (!filtered.length) {
    table.innerHTML = '<div class="p-8 text-center text-xs text-muted">No se encontraron productos coincidentes.</div>';
    return;
  }

  table.innerHTML = filtered.map(p => {
    const isAvailable = p.disponible !== false;
    return `
    <div class="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/70 transition-colors border-b border-line/60 last:border-0">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
            p.categoria === 'Bebidas' ? 'bg-blue-50 text-blue-700' :
            p.categoria === 'Cervezas' ? 'bg-amber-50 text-amber-700' :
            p.categoria === 'Promos' ? 'bg-purple-50 text-purple-700' :
            p.categoria === 'Picadas' ? 'bg-rose-50 text-rose-700' : 'bg-stone-100 text-stone-700'
          }">${p.categoria}</span>
          <p class="font-bold text-sm text-ink truncate">${p.nombre}</p>
        </div>
        ${p.descripcion ? `<p class="text-xs text-muted truncate mt-0.5">${p.descripcion}</p>` : ''}
      </div>

      <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-0 border-stone-100">
        <div class="flex items-center gap-1">
          <span class="text-xs font-bold text-stone-400">$</span>
          <input type="number" step="50" min="0" value="${p.precio}"
            data-id="${p.id}"
            class="price-input w-20 rounded-xl bg-stone-100 border border-stone-200 px-2 py-1.5 text-xs font-extrabold text-ink outline-none focus:bg-white focus:border-stone-400 text-right transition-all" />
        </div>

        <label class="flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" ${isAvailable ? 'checked' : ''} data-id="${p.id}" class="stock-toggle sr-only peer">
          <div class="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
          <span class="text-[11px] font-semibold ${isAvailable ? 'text-emerald-700' : 'text-stone-400'} w-14">
            ${isAvailable ? 'En stock' : 'Agotado'}
          </span>
        </label>

        <div class="flex items-center gap-1">
          <button type="button" data-edit-id="${p.id}" title="Editar detalles" class="btn-edit w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center transition-colors">✎</button>
          <button type="button" data-delete-id="${p.id}" data-name="${p.nombre}" title="Eliminar" class="btn-delete w-8 h-8 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-600 font-bold text-xs flex items-center justify-center transition-colors">🗑</button>
        </div>
      </div>
    </div>`;
  }).join('');

  table.querySelectorAll('.price-input').forEach(input => {
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

  table.querySelectorAll('.stock-toggle').forEach(chk => {
    chk.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const isAvailable = e.target.checked;
      const res = await toggleProductAvailability(id, isAvailable);
      if (!res.success) {
        showToast('Error al actualizar stock', true);
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

  table.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-id');
      openEditModal(id);
    });
  });

  table.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-id');
      const name = btn.getAttribute('data-name');
      if (!confirm(`¿Estás seguro de que querés eliminar "${name}" del catálogo?`)) return;

      const res = await apiDeleteProduct(id);
      if (!res.success) {
        showToast('Error al eliminar', true);
      } else {
        products = products.filter(p => p.id !== id);
        renderStats();
        renderCategories();
        renderProducts();
        showToast(`"${name}" eliminado`);
      }
    });
  });
}

function openEditModal(id) {
  const modal = document.getElementById('product-modal');
  const p = products.find(x => x.id === id);
  if (!p || !modal) return;
  document.getElementById('modal-title').textContent = 'Editar Producto';
  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-name').value = p.nombre;
  document.getElementById('prod-category').value = p.categoria;
  document.getElementById('prod-price').value = p.precio;
  document.getElementById('prod-desc').value = p.descripcion || '';
  document.getElementById('prod-available').checked = p.disponible !== false;
  modal.showModal();
}

export function initAdminProducts() {
  const adminSearch = document.getElementById('admin-search');
  if (adminSearch) {
    adminSearch.addEventListener('input', (e) => {
      adminQuery = e.target.value.toLowerCase().trim();
      renderProducts();
    });
  }

  const modal = document.getElementById('product-modal');
  const addProdBtn = document.getElementById('add-product-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');
  const prodForm = document.getElementById('product-form');

  if (addProdBtn && modal) {
    addProdBtn.addEventListener('click', () => {
      document.getElementById('modal-title').textContent = 'Nuevo Producto';
      document.getElementById('prod-id').value = '';
      document.getElementById('prod-name').value = '';
      document.getElementById('prod-category').value = activeAdminCat === 'Todos' ? 'Bebidas' : activeAdminCat;
      document.getElementById('prod-price').value = '';
      document.getElementById('prod-desc').value = '';
      document.getElementById('prod-available').checked = true;
      modal.showModal();
    });
  }

  if (cancelModalBtn && modal) {
    cancelModalBtn.addEventListener('click', () => modal.close());
  }

  if (prodForm) {
    prodForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idInput = document.getElementById('prod-id').value;
      const name = document.getElementById('prod-name').value.trim();
      const category = document.getElementById('prod-category').value.trim();
      const price = parseFloat(document.getElementById('prod-price').value);
      const desc = document.getElementById('prod-desc').value.trim();
      const available = document.getElementById('prod-available').checked;

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
        unidad: 'c/u'
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
