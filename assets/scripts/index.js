// Funciones para recordar credenciales
function saveCredentials(email, password, remember) {
  if (remember) {
    // Guardar credenciales de forma segura (usando encriptación básica)
    try {
      const credentials = {
        email: email,
        password: btoa(password), // Codificación base64 (no es encriptación real, pero mejor que texto plano)
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('erp_saved_credentials', JSON.stringify(credentials));
      localStorage.setItem('erp_remember_me', 'true');
      console.log('✅ Credenciales guardadas');
    } catch (error) {
      console.error('❌ Error guardando credenciales:', error);
    }
  } else {
    // Eliminar credenciales guardadas si no se marca recordar
    localStorage.removeItem('erp_saved_credentials');
    localStorage.removeItem('erp_remember_me');
    console.log('✅ Credenciales eliminadas');
  }
}

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
    // Si hay error, limpiar credenciales corruptas
    localStorage.removeItem('erp_saved_credentials');
    localStorage.removeItem('erp_remember_me');
  }
  return null;
}

// Modal login validation
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('modalLoginForm');
  if (form) {
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
        let mensajeError = 'Error de inicio de sesión: ';

        if (err && err.code) {
          switch (err.code) {
            case 'auth/user-not-found':
              mensajeError =
                'Usuario no encontrado. El usuario no existe en el sistema. Por favor, verifica el email o contacta al administrador para crear tu cuenta.';
              break;
            case 'auth/wrong-password':
              mensajeError =
                'Contraseña incorrecta. Por favor, verifica tu contraseña e intenta nuevamente.';
              break;
            case 'auth/invalid-email':
              mensajeError = 'Email inválido. Por favor, ingresa un email válido.';
              break;
            case 'auth/invalid-credential':
              mensajeError = 'Credenciales inválidas. El email o la contraseña son incorrectos.';
              break;
            case 'auth/too-many-requests':
              mensajeError =
                'Demasiados intentos fallidos. Por favor, espera unos minutos antes de intentar nuevamente.';
              break;
            default:
              mensajeError +=
                err.message || 'Error desconocido. Por favor, contacta al administrador.';
          }
        } else if (err && err.message) {
          mensajeError += err.message;
        } else {
          mensajeError +=
            'Error desconocido. Por favor, verifica tus credenciales o contacta al administrador.';
        }

        alert(mensajeError);
        console.error('Error de inicio de sesión:', err);
      }
    });
  }
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

  // Toggle password visibility
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
});

// Funcionalidad de scroll suave para navegación
function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    const offsetTop = element.offsetTop - 80;
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  }
}

// Función para scroll a la comparación
function _scrollToComparison() {
  const comparisonSection = document.getElementById('comparacion');
  if (comparisonSection) {
    const offsetTop = comparisonSection.offsetTop - 100;
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  }
}

// Event listeners para navegación
document.addEventListener('DOMContentLoaded', () => {
  // Navegación suave para enlaces del menú
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      scrollToSection(targetId);

      // Cerrar menú móvil si está abierto
      const navbarCollapse = document.getElementById('navbarNav');
      if (navbarCollapse.classList.contains('show')) {
        const bsCollapse = new bootstrap.Collapse(navbarCollapse);
        bsCollapse.hide();
      }
    });
  });

  // Activar enlace activo según scroll
  window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.pageYOffset >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
});

// Animación de entrada para elementos
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observar elementos para animación
document.addEventListener('DOMContentLoaded', () => {
  const animatedElements = document.querySelectorAll(
    '.feature-card, .about-content, .contact-grid'
  );
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});
