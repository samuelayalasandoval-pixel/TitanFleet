/**
 * Event Handlers Específicos para Diesel
 * Maneja todos los eventos de la página diesel.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de diesel
  const isDieselPage = window.location.pathname.includes('diesel.html');
  if (!isDieselPage) {
    return; // No ejecutar si no estamos en diesel
  }

  /**
   * Mapa de acciones específicas de diesel
   */
  const dieselActions = {
    // Listas
    desplegarListaEconomicosDiesel: function (event) {
      event.preventDefault();
      if (typeof window.desplegarListaEconomicosDiesel === 'function') {
        window.desplegarListaEconomicosDiesel();
      } else {
        console.error('desplegarListaEconomicosDiesel no está disponible');
      }
    },

    desplegarListaOperadoresDiesel: function (event) {
      event.preventDefault();
      const button = event.target.closest('button') || event.target;
      const tipo = button.getAttribute('data-tipo') || 'principal';

      if (typeof window.desplegarListaOperadoresDiesel === 'function') {
        window.desplegarListaOperadoresDiesel(tipo);
      } else {
        console.error('desplegarListaOperadoresDiesel no está disponible');
      }
    },

    // Formulario
    clearCurrentForm: function (event) {
      event.preventDefault();
      if (typeof window.clearCurrentForm === 'function') {
        if (
          confirm(
            '¿Estás seguro de que deseas limpiar el formulario? Se perderán todos los datos no guardados.'
          )
        ) {
          window.clearCurrentForm();
        }
      } else {
        console.error('clearCurrentForm no está disponible');
      }
    },

    guardarMovimientoDiesel: async function (event) {
      event.preventDefault();
      event.stopPropagation();

      console.log('🔍 Verificando disponibilidad de dieselUI...', {
        tieneDieselUI: Boolean(window.dieselUI),
        tieneGuardarMovimiento: Boolean(
          window.dieselUI && typeof window.dieselUI.guardarMovimiento === 'function'
        )
      });

      // Intentar múltiples veces si no está disponible inmediatamente
      if (!window.dieselUI || typeof window.dieselUI.guardarMovimiento !== 'function') {
        console.warn('⚠️ dieselUI no está disponible, esperando...');

        // Esperar hasta que dieselUI esté disponible (máximo 5 segundos)
        let attempts = 0;
        const maxAttempts = 10;

        while (
          attempts < maxAttempts &&
          (!window.dieselUI || typeof window.dieselUI.guardarMovimiento !== 'function')
        ) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!window.dieselUI || typeof window.dieselUI.guardarMovimiento !== 'function') {
          console.error('❌ dieselUI.guardarMovimiento no está disponible después de esperar');
          alert(
            'Error: El sistema aún no está listo. Por favor, espera unos segundos y vuelve a intentar.'
          );
          return;
        }
      }

      try {
        await window.dieselUI.guardarMovimiento();
      } catch (error) {
        console.error('❌ Error al ejecutar guardarMovimiento:', error);
        alert('Error al guardar el movimiento. Por favor, verifica la consola para más detalles.');
      }
    },

    // Exportación
    exportarDieselExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarDieselExcel === 'function') {
        window.exportarDieselExcel();
      } else {
        console.error('exportarDieselExcel no está disponible');
      }
    },

    // Filtros
    aplicarFiltrosDiesel: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.aplicarFiltrosDiesel === 'function') {
        window.aplicarFiltrosDiesel();
      } else {
        console.error('aplicarFiltrosDiesel no está disponible');
      }
    },

    limpiarFiltrosDiesel: function (event) {
      event.preventDefault();
      if (typeof window.limpiarFiltrosDiesel === 'function') {
        window.limpiarFiltrosDiesel();
      } else {
        console.error('limpiarFiltrosDiesel no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de diesel
   */
  function initDieselEventHandlers() {
    console.log('🔧 Inicializando event handlers de diesel...');

    // Registrar todas las acciones en el sistema global
    Object.keys(dieselActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, dieselActions[action]);
      }
    });

    // Agregar listeners a elementos con data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (dieselActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          // Determinar el tipo de evento según el tipo de elemento
          const tagName = element.tagName.toLowerCase();
          const _inputType = element.type ? element.type.toLowerCase() : '';

          // Para inputs, selects y textareas usar 'change', para botones usar 'click'
          if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
            element.addEventListener('change', dieselActions[action]);
          } else {
            element.addEventListener('click', dieselActions[action]);
          }

          element.setAttribute('data-handler-attached', 'true');
          const eventType =
            tagName === 'input' || tagName === 'select' || tagName === 'textarea'
              ? 'change'
              : 'click';
          console.log(`✅ Handler de diesel registrado: ${action} (${eventType})`);
        }
      }
    });

    console.log('✅ Event handlers de diesel inicializados');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDieselEventHandlers);
  } else {
    initDieselEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initDieselEventHandlers, 200);

  console.log('✅ Módulo de event handlers de diesel cargado');
})();
