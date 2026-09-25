import { sbClient } from './supabase.js';
import { CONFIG } from './config.js';

let products = [];
let activeAdminCat = 'Todos';
let adminQuery = '';

// Toast Helper
export function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const msgEl = document.getElementById('toast-msg');
  const iconEl = document.getElementById('toast-icon');
  if (msgEl) msgEl.textContent = msg;
  if (iconEl) iconEl.textContent = isError ? '⚠' : '✓';
  
  toast.className = `fixed top-4 right-4 left-4 sm:left-auto sm:max-w-xs z-50 transition-all duration-300 ${isError ? 'bg-red-600' : 'bg-ink'} text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 transform translate-y-0 opacity-100 pointer-events-auto`;
  setTimeout(() => {
    toast.className = 'fixed top-4 right-4 left-4 sm:left-auto sm:max-w-xs z-50 transition-all duration-300 bg-ink text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 transform -translate-y-12 opacity-0 pointer-events-none';
  }, 2500);
}

// Auth State Listener
sbClient.auth.onAuthStateChange(async (event, session) => {
  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');
  const userEmail = document.getElementById('user-email');

  if (event === 'PASSWORD_RECOVERY') {
    // El usuario vino desde el enlace de recuperación de contraseña en su correo
    const recoveryModal = document.getElementById('recovery-pwd-modal');
    if (recoveryModal) recoveryModal.showModal();
    return;
  }

  if (session) {
    if (loginView) loginView.classList.add('hidden');
    if (dashboardView) dashboardView.classList.remove('hidden');
    if (userEmail) userEmail.textContent = session.user.email;
    loadProducts();
  } else {
    if (loginView) loginView.classList.remove('hidden');
    if (dashboardView) dashboardView.classList.add('hidden');
  }
});

// Initial Session Check
async function initSession() {
  const { data: { session } } = await sbClient.auth.getSession();
  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');
  const userEmail = document.getElementById('user-email');

  if (session) {
    if (loginView) loginView.classList.add('hidden');
    if (dashboardView) dashboardView.classList.remove('hidden');
    if (userEmail) userEmail.textContent = session.user.email;
    loadProducts();
  } else {
    if (loginView) loginView.classList.remove('hidden');
    if (dashboardView) dashboardView.classList.add('hidden');
  }
}

// Login Form Submit
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorBox = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    errorBox.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Verificando...';

    const { error } = await sbClient.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    btn.textContent = 'Iniciar Sesión';

    if (error) {
      errorBox.textContent = 'Credenciales inválidas: ' + error.message;
      errorBox.classList.remove('hidden');
    } else {
      showToast('Bienvenido al panel');
    }
  });
}

// Toggle between Login Form and Forgot Password Form
const btnShowForgot = document.getElementById('btn-show-forgot');
const btnBackLogin = document.getElementById('btn-back-login');
const forgotForm = document.getElementById('forgot-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');

if (btnShowForgot && forgotForm && loginForm) {
  btnShowForgot.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    forgotForm.classList.remove('hidden');
    if (authTitle) authTitle.textContent = 'Recuperar Acceso';
    if (authSubtitle) authSubtitle.textContent = 'Restablecé tu contraseña de administrador';
  });
}

if (btnBackLogin && forgotForm && loginForm) {
  btnBackLogin.addEventListener('click', () => {
    forgotForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    if (authTitle) authTitle.textContent = 'Panel de Control';
    if (authSubtitle) authSubtitle.textContent = 'Almacén Quique — Iniciar Sesión';
  });
}

// Forgot Password Form Submit
if (forgotForm) {
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    const msgBox = document.getElementById('forgot-msg');
    const btn = document.getElementById('forgot-btn');

    msgBox.className = 'hidden';
    btn.disabled = true;
    btn.textContent = 'Enviando enlace...';

    const { error } = await sbClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/admin'
    });

    btn.disabled = false;
    btn.textContent = 'Enviar enlace de recuperación';

    if (error) {
      msgBox.textContent = 'Error: ' + error.message;
      msgBox.className = 'text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 block';
    } else {
      msgBox.textContent = '✓ ¡Listo! Te enviamos un correo con el enlace seguro para crear una nueva clave.';
      msgBox.className = 'text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 block font-semibold';
      document.getElementById('forgot-email').value = '';
    }
  });
}

// Modal Recovery Password (al volver del correo)
const recoveryModal = document.getElementById('recovery-pwd-modal');
const recoveryForm = document.getElementById('recovery-pwd-form');
if (recoveryForm && recoveryModal) {
  recoveryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('recovery-password-input').value;
    const errorBox = document.getElementById('recovery-pwd-error');
    const btn = document.getElementById('save-recovery-pwd-btn');

    if (password.length < 6) {
      errorBox.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      errorBox.classList.remove('hidden');
      return;
    }

    errorBox.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const { error } = await sbClient.auth.updateUser({ password });
    btn.disabled = false;
    btn.textContent = 'Guardar y Entrar';

    if (error) {
      errorBox.textContent = 'Error al actualizar contraseña: ' + error.message;
      errorBox.classList.remove('hidden');
    } else {
      recoveryModal.close();
      showToast('¡Contraseña reestablecida con éxito!');
      initSession();
    }
  });
}

// Modal Cambiar Contraseña (desde el dashboard)
const changePwdBtn = document.getElementById('btn-change-pwd');
const changePwdModal = document.getElementById('change-pwd-modal');
const cancelChangePwdBtn = document.getElementById('cancel-change-pwd-btn');
const changePwdForm = document.getElementById('change-pwd-form');

if (changePwdBtn && changePwdModal) {
  changePwdBtn.addEventListener('click', () => {
    document.getElementById('new-password-input').value = '';
    document.getElementById('confirm-password-input').value = '';
    document.getElementById('change-pwd-error').classList.add('hidden');
    changePwdModal.showModal();
  });
}

if (cancelChangePwdBtn && changePwdModal) {
  cancelChangePwdBtn.addEventListener('click', () => {
    changePwdModal.close();
  });
}

if (changePwdForm && changePwdModal) {
  changePwdForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPwd = document.getElementById('new-password-input').value;
    const confirmPwd = document.getElementById('confirm-password-input').value;
    const errorBox = document.getElementById('change-pwd-error');
    const btn = document.getElementById('save-pwd-btn');

    if (newPwd.length < 6) {
      errorBox.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.';
      errorBox.classList.remove('hidden');
      return;
    }

    if (newPwd !== confirmPwd) {
      errorBox.textContent = 'Las contraseñas no coinciden.';
      errorBox.classList.remove('hidden');
      return;
    }

    errorBox.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Actualizando...';

    const { error } = await sbClient.auth.updateUser({ password: newPwd });
    btn.disabled = false;
    btn.textContent = 'Actualizar Contraseña';

    if (error) {
      errorBox.textContent = 'Error al actualizar: ' + error.message;
      errorBox.classList.remove('hidden');
    } else {
      changePwdModal.close();
      showToast('Contraseña modificada correctamente');
    }
  });
}

// Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await sbClient.auth.signOut();
    showToast('Sesión cerrada');
  });
}

// Cargar productos de Supabase
export async function loadProducts() {
  const table = document.getElementById('products-table');
  if (!table) return;
  table.innerHTML = '<div class="p-8 text-center text-xs text-muted">Cargando catálogo desde la base de datos...</div>';

  const { data, error } = await sbClient
    .from('productos')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    table.innerHTML = `<div class="p-8 text-center text-xs text-red-600 font-bold">Error al cargar productos: ${error.message}</div>`;
    return;
  }

  products = data || [];
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
  if (elTotal) elTotal.textContent = total;
  if (elActive) elActive.textContent = active;
  if (elInactive) elInactive.textContent = inactive;
}

// Categorías y Auto-relleno inteligente
function renderCategories() {
  const catBox = document.getElementById('admin-categories');
  const datalist = document.getElementById('category-datalist');
  const uniqueCats = [...new Set(products.map(p => p.categoria).filter(Boolean))];

  // 1. Píldoras del filtro superior
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

  // 2. Opciones del Datalist para auto-completar
  if (datalist) {
    datalist.innerHTML = uniqueCats.map(c => `<option value="${c}"></option>`).join('');
  }

  // 3. Píldoras de selección rápida en el modal de producto
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

const adminSearch = document.getElementById('admin-search');
if (adminSearch) {
  adminSearch.addEventListener('input', (e) => {
    adminQuery = e.target.value.toLowerCase().trim();
    renderProducts();
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
        <!-- Input de Precio Rápido -->
        <div class="flex items-center gap-1">
          <span class="text-xs font-bold text-stone-400">$</span>
          <input type="number" step="50" min="0" value="${p.precio}"
            data-id="${p.id}"
            class="price-input w-20 rounded-xl bg-stone-100 border border-stone-200 px-2 py-1.5 text-xs font-extrabold text-ink outline-none focus:bg-white focus:border-stone-400 text-right transition-all" />
        </div>

        <!-- Switch de Stock -->
        <label class="flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" ${isAvailable ? 'checked' : ''} data-id="${p.id}" class="stock-toggle sr-only peer">
          <div class="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
          <span class="text-[11px] font-semibold ${isAvailable ? 'text-emerald-700' : 'text-stone-400'} w-14">
            ${isAvailable ? 'En stock' : 'Agotado'}
          </span>
        </label>

        <!-- Botones de Acción -->
        <div class="flex items-center gap-1">
          <button type="button" data-edit-id="${p.id}" title="Editar detalles" class="btn-edit w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center transition-colors">✎</button>
          <button type="button" data-delete-id="${p.id}" data-name="${p.nombre}" title="Eliminar" class="btn-delete w-8 h-8 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-600 font-bold text-xs flex items-center justify-center transition-colors">🗑</button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Eventos de precio rápido
  table.querySelectorAll('.price-input').forEach(input => {
    input.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const val = parseFloat(e.target.value);
      if (isNaN(val) || val < 0) {
        showToast('Precio inválido', true);
        return;
      }
      const { error } = await sbClient
        .from('productos')
        .update({ precio: val })
        .eq('id', id);

      if (error) {
        showToast('Error al actualizar precio: ' + error.message, true);
      } else {
        const prod = products.find(x => x.id === id);
        if (prod) prod.precio = val;
        showToast(`Precio actualizado: $${val.toLocaleString('es-AR')}`);
      }
    });
  });

  // Eventos de stock
  table.querySelectorAll('.stock-toggle').forEach(chk => {
    chk.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const isAvailable = e.target.checked;
      const { error } = await sbClient
        .from('productos')
        .update({ disponible: isAvailable })
        .eq('id', id);

      if (error) {
        showToast('Error al actualizar stock: ' + error.message, true);
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
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-id');
      const name = btn.getAttribute('data-name');
      deleteProduct(id, name);
    });
  });
}

async function deleteProduct(id, name) {
  if (!confirm(`¿Estás seguro de que querés eliminar "${name}" del catálogo?`)) return;

  const { error } = await sbClient
    .from('productos')
    .delete()
    .eq('id', id);

  if (error) {
    showToast('Error al eliminar: ' + error.message, true);
  } else {
    products = products.filter(p => p.id !== id);
    renderStats();
    renderCategories();
    renderProducts();
    showToast(`"${name}" eliminado`);
  }
}

// Modal Agregar / Editar Producto
const modal = document.getElementById('product-modal');
const addProdBtn = document.getElementById('add-product-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');

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
  cancelModalBtn.addEventListener('click', () => {
    modal.close();
  });
}

function openEditModal(id) {
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

const prodForm = document.getElementById('product-form');
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

    if (idInput) {
      const { error } = await sbClient
        .from('productos')
        .update({
          nombre: name,
          categoria: category,
          precio: price,
          descripcion: desc,
          disponible: available
        })
        .eq('id', idInput);

      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar';

      if (error) {
        showToast('Error al editar: ' + error.message, true);
      } else {
        modal.close();
        showToast('Producto actualizado correctamente');
        loadProducts();
      }
    } else {
      const newId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
      const { error } = await sbClient
        .from('productos')
        .insert({
          id: newId,
          nombre: name,
          categoria: category,
          precio: price,
          descripcion: desc,
          disponible: available,
          unidad: 'c/u'
        });

      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar';

      if (error) {
        showToast('Error al crear: ' + error.message, true);
      } else {
        modal.close();
        showToast('Producto creado con éxito');
        loadProducts();
      }
    }
  });
}

// Imprimir Cartel
const printPosterBtn = document.getElementById('print-poster-btn');
if (printPosterBtn) {
  printPosterBtn.addEventListener('click', () => {
    window.print();
  });
}

// Inicializar
initSession();
