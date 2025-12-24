/**
 * Sistema Centralizado de Event Handlers
 * Reemplaza atributos onclick inline con event listeners
 *
 * Uso:
 * - Agregar data-action="nombreAccion" al elemento
 * - Registrar el handler en initGlobalEventHandlers()
 */

(function () {
  'use strict';

  // Mapa de acciones globales (comunes a todas las páginas)
  const globalActions = {
    // Logout
    logout: async function (event) {
      event.preventDefault();
      if (window.erpAuth && typeof window.erpAuth.logout === 'function') {
        await window.erpAuth.logout();
      } else {
        console.error('erpAuth.logout no está disponible');
      }
    },

    // Toggle sidebar
    toggleSidebar: function (event) {
      event.preventDefault();
      if (typeof window.toggleSidebar === 'function') {
        window.toggleSidebar();
      } else if (document.getElementById('sidebar')) {
        // Fallback básico
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
      }
    },

    // Close sidebar
    closeSidebar: function (event) {
      event.preventDefault();
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.add('collapsed');
      }
    }
  };

  /**
   * Inicializar event handlers globales
   * Se ejecuta cuando el DOM está listo
   * @param {boolean} silent - Si es true, no muestra warnings para acciones no registradas
   */
  function initGlobalEventHandlers(silent = false) {
    // console.log('🔧 Inicializando event handlers globales...');

    // Handlers por data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      // NO agregar listeners de click a inputs de tipo date para permitir que el calendario nativo funcione
      const isDateInput = element.tagName === 'INPUT' && element.type === 'date';
      if (isDateInput) {
        // Para inputs de fecha, solo usar el sistema de handlers específicos de la página
        // que ya maneja correctamente el evento 'change' sin bloquear el calendario
        console.log(
          `⏭️ Input de fecha con data-action="${action}" omitido del sistema global (calendario nativo)`
        );
        return;
      }

      // También omitir inputs de tipo text, select y textarea del sistema global
      // ya que estos deben usar 'change' o 'keyup', no 'click'
      const isFormInput =
        (element.tagName === 'INPUT' && element.type !== 'button' && element.type !== 'submit') ||
        element.tagName === 'SELECT' ||
        element.tagName === 'TEXTAREA';

      if (isFormInput && !globalActions[action]) {
        // Los inputs de formulario sin acción global registrada no necesitan handler de click
        return;
      }

      if (globalActions[action]) {
        // Solo agregar listeners de click a elementos que NO son inputs de formulario
        // (botones, enlaces, etc.)
        if (isFormInput) {
          // Para inputs de formulario, el sistema específico de la página manejará los eventos
          return;
        }

        // Remover listener anterior si existe
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);

        // Agregar nuevo listener
        newElement.addEventListener('click', e => {
          e.preventDefault();
          globalActions[action](e);
        });

        // console.log(`✅ Handler registrado para data-action="${action}"`);
      } else {
        // Solo mostrar warning si no estamos en modo silencioso
        // y si ya han pasado suficientes intentos (para dar tiempo a que se registren)
        if (!silent) {
          console.warn(`⚠️ Acción no registrada: ${action}`);
        }
      }
    });

    // Handler específico para botones de logout (compatibilidad)
    document.querySelectorAll('.logout-btn, [data-action="logout"]').forEach(btn => {
      if (!btn.hasAttribute('data-action')) {
        btn.setAttribute('data-action', 'logout');
      }
    });

    // console.log('✅ Event handlers globales inicializados');
  }

  /**
   * Registrar una acción global
   * @param {string} actionName - Nombre de la acción
   * @param {Function} handler - Función handler
   */
  window.registerGlobalAction = function (actionName, handler) {
    if (typeof handler === 'function') {
      globalActions[actionName] = handler;
      // console.log(`✅ Acción global registrada: ${actionName}`);

      // Re-ejecutar initGlobalEventHandlers para conectar elementos existentes
      // Usar un pequeño delay para permitir que se registren múltiples acciones
      clearTimeout(window._reinitHandlersTimeout);
      window._reinitHandlersTimeout = setTimeout(() => {
        initGlobalEventHandlers(true); // Modo silencioso para no mostrar warnings
      }, 50);
    } else {
      console.error(`❌ Error: handler debe ser una función para ${actionName}`);
    }
  };

  /**
   * Obtener todas las acciones registradas
   */
  window.getRegisteredActions = function () {
    return Object.keys(globalActions);
  };

  // Inicializar cuando el DOM esté listo (primera vez en modo silencioso para evitar warnings prematuros)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initGlobalEventHandlers(true); // Modo silencioso inicial
    });
  } else {
    // DOM ya está listo
    initGlobalEventHandlers(true); // Modo silencioso inicial
  }

  // También inicializar después de delays para asegurar que otros scripts se hayan cargado
  // Primera ejecución silenciosa (para dar tiempo a que se registren acciones)
  setTimeout(() => initGlobalEventHandlers(true), 100);

  // Segunda ejecución silenciosa (para dar más tiempo a scripts con defer)
  setTimeout(() => initGlobalEventHandlers(true), 300);

  // Tercera ejecución con warnings (para detectar acciones realmente faltantes)
  // Esperar más tiempo para scripts con defer
  setTimeout(() => initGlobalEventHandlers(false), 800);

  /**
   * Validar acceso a la página actual basado en permisos
   * Se ejecuta después de que los scripts de autenticación estén cargados
   */
  function validatePageAccess() {
    // Esperar a que auth.js esté disponible
    if (typeof window.checkPageAccess !== 'function') {
      setTimeout(validatePageAccess, 500);
      return;
    }

    const currentPage = window.location.pathname.split('/').pop();

    // No validar en index.html o menu.html
    if (currentPage === 'index.html' || currentPage === 'menu.html' || !currentPage) {
      return;
    }

    // Validar acceso usando checkPageAccess de auth.js
    try {
      // console.log('🔒 [event-handlers] Validando acceso a página:', currentPage);
      const hasAccess = window.checkPageAccess();
      if (!hasAccess) {
        console.warn('🚫 [event-handlers] Acceso denegado a:', currentPage);
      } else {
        // console.log('✅ [event-handlers] Acceso permitido a:', currentPage);
      }
    } catch (error) {
      console.error('❌ [event-handlers] Error validando acceso:', error);
    }
  }

  // Validar acceso después de que los scripts estén cargados
  // Esperar tiempo suficiente para que auth.js esté disponible
  setTimeout(validatePageAccess, 2000);

  // console.log('✅ Sistema de event handlers globales cargado');
})();
