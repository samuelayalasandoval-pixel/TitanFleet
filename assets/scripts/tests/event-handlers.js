/**
 * Event Handlers Específicos para Tests
 * Maneja todos los eventos de la página tests.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de tests
  const isTestsPage = window.location.pathname.includes('tests.html');
  if (!isTestsPage) {
    return; // No ejecutar si no estamos en tests
  }

  /**
   * Mapa de acciones específicas de tests
   */
  const testsActions = {
    ejecutarUnitTests: function (event) {
      event.preventDefault();
      if (typeof window.ejecutarUnitTests === 'function') {
        window.ejecutarUnitTests();
      } else {
        console.error('ejecutarUnitTests no está disponible');
      }
    },

    ejecutarOfflineTests: function (event) {
      event.preventDefault();
      if (typeof window.ejecutarOfflineTests === 'function') {
        window.ejecutarOfflineTests();
      } else {
        console.error('ejecutarOfflineTests no está disponible');
      }
    },

    ejecutarIntegrationTests: function (event) {
      event.preventDefault();
      if (typeof window.ejecutarIntegrationTests === 'function') {
        window.ejecutarIntegrationTests();
      } else {
        console.error('ejecutarIntegrationTests no está disponible');
      }
    },

    ejecutarTodosLosTests: function (event) {
      event.preventDefault();
      if (typeof window.ejecutarTodosLosTests === 'function') {
        window.ejecutarTodosLosTests();
      } else {
        console.error('ejecutarTodosLosTests no está disponible');
      }
    },

    limpiarResultados: function (event) {
      event.preventDefault();
      const button = event.target.closest('button') || event.target;
      const tipo = button.getAttribute('data-tipo') || 'unit';

      if (typeof window.limpiarResultados === 'function') {
        window.limpiarResultados(tipo);
      } else {
        console.error('limpiarResultados no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de tests
   */
  function initTestsEventHandlers() {
    console.log('🔧 Inicializando event handlers de tests...');

    // Registrar todas las acciones en el sistema global
    Object.keys(testsActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, testsActions[action]);
      }
    });

    // Agregar listeners a elementos con data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (testsActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          element.addEventListener('click', testsActions[action]);
          element.setAttribute('data-handler-attached', 'true');
          console.log(`✅ Handler de tests registrado: ${action}`);
        }
      }
    });

    console.log('✅ Event handlers de tests inicializados');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTestsEventHandlers);
  } else {
    initTestsEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initTestsEventHandlers, 200);

  console.log('✅ Módulo de event handlers de tests cargado');
})();
