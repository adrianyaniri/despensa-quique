import { sbClient } from '../../supabase.js';
import { showToast } from '../../components/toast.js';

/**
 * Initializes authentication listeners, login, recovery, and logout flows.
 * @param {object} callbacks
 * @param {Function} callbacks.onLogin - called when a session becomes active
 * @param {Function} callbacks.onLogout - called when session terminates
 */
export function initAdminAuth({ onLogin, onLogout }) {
  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');
  const userEmail = document.getElementById('user-email');
  const userEmailShort = document.getElementById('user-email-short');

  function handleSession(session) {
    if (session) {
      if (loginView) loginView.classList.add('hidden');
      if (dashboardView) dashboardView.classList.remove('hidden');
      if (userEmail && session.user?.email) userEmail.textContent = session.user.email;
      if (userEmailShort && session.user?.email) {
        userEmailShort.textContent = session.user.email.split('@')[0];
      }
      if (typeof onLogin === 'function') onLogin(session);
    } else {
      if (loginView) loginView.classList.remove('hidden');
      if (dashboardView) dashboardView.classList.add('hidden');
      if (typeof onLogout === 'function') onLogout();
    }
  }

  // Auth State Listener
  sbClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      const recoveryModal = document.getElementById('recovery-pwd-modal');
      if (recoveryModal) recoveryModal.showModal();
      return;
    }
    handleSession(session);
  });

  // Initial check
  sbClient.auth.getSession().then(({ data: { session } }) => {
    handleSession(session);
  });

  // Login Form
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

  // Forgot password views toggle
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
      if (authSubtitle) authSubtitle.textContent = 'Iniciá sesión para gestionar precios y productos';
    });
  }

  // Forgot Password Submit
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();
      const errorBox = document.getElementById('forgot-error');
      const successBox = document.getElementById('forgot-success');
      const btn = document.getElementById('forgot-btn');

      errorBox.classList.add('hidden');
      successBox.classList.add('hidden');
      btn.disabled = true;
      btn.textContent = 'Enviando enlace...';

      const redirectTo = window.location.origin + '/admin';
      const { error } = await sbClient.auth.resetPasswordForEmail(email, { redirectTo });
      btn.disabled = false;
      btn.textContent = 'Enviar enlace de recuperación';

      if (error) {
        errorBox.textContent = 'Error: ' + error.message;
        errorBox.classList.remove('hidden');
      } else {
        successBox.textContent = 'Te enviamos un correo con las instrucciones para restablecer tu contraseña. Revisá tu bandeja de entrada o spam.';
        successBox.classList.remove('hidden');
      }
    });
  }

  // Recovery Password Modal Submit
  const recoveryForm = document.getElementById('recovery-pwd-form');
  const recoveryModal = document.getElementById('recovery-pwd-modal');
  if (recoveryForm && recoveryModal) {
    recoveryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPwd = document.getElementById('recovery-new-password').value;
      const confirmPwd = document.getElementById('recovery-confirm-password').value;
      const errorBox = document.getElementById('recovery-pwd-error');
      const btn = document.getElementById('recovery-pwd-btn');

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
      btn.textContent = 'Guardar nueva contraseña';

      if (error) {
        errorBox.textContent = 'Error: ' + error.message;
        errorBox.classList.remove('hidden');
      } else {
        recoveryModal.close();
        showToast('Contraseña restablecida con éxito');
      }
    });
  }

  // Change Password Modal Submit
  const btnChangePwd = document.getElementById('btn-change-pwd');
  const changePwdModal = document.getElementById('change-pwd-modal');
  const cancelChangePwdBtn = document.getElementById('cancel-change-pwd-btn');
  const changePwdForm = document.getElementById('change-pwd-form');

  if (btnChangePwd && changePwdModal) {
    btnChangePwd.addEventListener('click', () => changePwdModal.showModal());
  }

  if (cancelChangePwdBtn && changePwdModal) {
    cancelChangePwdBtn.addEventListener('click', () => changePwdModal.close());
  }

  if (changePwdForm && changePwdModal) {
    changePwdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPwd = document.getElementById('new-password').value;
      const confirmPwd = document.getElementById('confirm-password').value;
      const errorBox = document.getElementById('change-pwd-error');
      const btn = document.getElementById('save-pwd-btn');

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
}
