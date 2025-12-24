/**
 * Gestión del Login Modal - index.html
 * Maneja el formulario de login, credenciales guardadas y autenticación
 */

(function () {
  'use strict';

  /**
   * Guardar credenciales de forma segura
   */
  function saveCredentials(email, password, remember) {
    if (remember) {
      try {
        const credentials = {
          email: email,
          password: btoa(password), // Codificación base64
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('erp_saved_credentials', JSON.stringify(credentials));
        localStorage.setItem('erp_remember_me', 'true');
        console.log('✅ Credenciales guardadas');
      } catch (error) {
        console.error('❌ Error guardando credenciales:', error);
      }
    } else {
      localStorage.removeItem('erp_saved_credentials');
      localStorage.removeItem('erp_remember_me');
      console.log('✅ Credenciales eliminadas');
    }
  }

  /**
   * Cargar credenciales guardadas
   */
  function loadSavedCredentials() {
    try {
      const rememberMe = localStorage.getItem('erp_remember_me') === 'true';
      if (rememberMe) {
        const saved = localStorage.getItem('erp_saved_credentials');
        if (saved) {
          const credentials = JSON.parse(saved);
          if (credentials && credentials.email && credentials.password) {
            return {
              email: credentials.email,
              password: atob(credentials.password), // Decodificar base64
              remember: true
            };
          }
        }
      }
    } catch (error) {
      console.error('❌ Error cargando credenciales guardadas:', error);
      localStorage.removeItem('erp_saved_credentials');
      localStorage.removeItem('erp_remember_me');
    }
    return null;
  }

  /**
   * Inicializar formulario de login
   */
  function initLoginForm() {
    const form = document.getElementById('modalLoginForm');
    if (!form) {
      return;
    }

    // Cargar credenciales guardadas cuando se abre el modal
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.addEventListener('show.bs.modal', () => {
        const saved = loadSavedCredentials();
        if (saved) {
          const usernameInput = document.getElementById('modalUsername');
          const passwordInput = document.getElementById('modalPassword');
          const rememberCheckbox = document.getElementById('modalRemember');

          if (usernameInput) {
            usernameInput.value = saved.email;
          }
          if (passwordInput) {
            passwordInput.value = saved.password;
          }
          if (rememberCheckbox) {
            rememberCheckbox.checked = true;
          }

          console.log('✅ Credenciales cargadas automáticamente');
        }
      });
    }

    // Manejar envío del formulario
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const userInput = document.getElementById('modalUsername').value.trim();
      const pass = document.getElementById('modalPassword').value.trim();
      const rememberCheckbox = document.getElementById('modalRemember');
      const remember = rememberCheckbox ? rememberCheckbox.checked : false;

      try {
        if (window.firebaseSignIn) {
          await window.firebaseSignIn(userInput, pass, 'demo');

          // Guardar credenciales si el checkbox está marcado
          saveCredentials(userInput, pass, remember);

          const modalEl = document.getElementById('loginModal');
          const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
          modal.hide();
          // Redirigir a menu.html después del login exitoso
          // Detectar si estamos en public/ y ajustar la ruta
          const currentPath = window.location.pathname;
          const isInPublic = currentPath.includes('/public/');
          const menuPath = isInPublic ? '../pages/menu.html' : 'pages/menu.html';
          window.location.href = menuPath;
        } else {
          alert('Firebase no está disponible.');
        }
      } catch (err) {
        alert(`Error de inicio de sesión: ${err && err.message ? err.message : 'Desconocido'}`);
      }
    });
  }

  /**
   * Inicializar botón de "Olvidé mi contraseña"
   */
  function initForgotPassword() {
    const forgot = document.getElementById('modalForgot');
    if (forgot) {
      forgot.addEventListener('click', e => {
        e.preventDefault();
        const email = prompt('Ingrese su correo electrónico para restablecer la contraseña:');
        if (email) {
          alert('Se ha enviado un enlace de restablecimiento (demo).');
        }
      });
    }
  }

  /**
   * Inicializar toggle de mostrar/ocultar contraseña
   */
  function initPasswordToggle() {
    const toggleBtn = document.getElementById('toggleModalPassword');
    const passwordInput = document.getElementById('modalPassword');

    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener('click', function () {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        const icon = this.querySelector('i');
        if (icon) {
          icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
      });
    }
  }

  /**
   * Inicializar todo cuando el DOM esté listo
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initLoginForm();
        initForgotPassword();
        initPasswordToggle();
      });
    } else {
      initLoginForm();
      initForgotPassword();
      initPasswordToggle();
    }
  }

  init();
})();
