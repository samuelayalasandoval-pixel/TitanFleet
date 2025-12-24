/**
 * Event Handlers Específicos para Logística
 * Maneja todos los eventos de la página logistica.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de logística
  const isLogisticaPage = window.location.pathname.includes('logistica.html');
  if (!isLogisticaPage) {
    return; // No ejecutar si no estamos en logística
  }

  /**
   * Mapa de acciones específicas de logística
   */
  const logisticaActions = {
    // Clientes
    refreshClientesList: function (event) {
      event.preventDefault();
      if (typeof window.refreshClientesList === 'function') {
        window.refreshClientesList();
      } else {
        console.error('refreshClientesList no está disponible');
      }
    },

    openConfiguracionClientes: function (event) {
      event.preventDefault();
      if (typeof window.openConfiguracionClientes === 'function') {
        window.openConfiguracionClientes();
      } else {
        // Fallback: abrir configuración en nueva pestaña
        window.open('configuracion.html#clientes', '_blank');
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

    // Exportación
    exportarLogisticaExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarLogisticaExcel === 'function') {
        window.exportarLogisticaExcel();
      } else {
        console.error('exportarLogisticaExcel no está disponible');
      }
    },

    // Filtros
    aplicarFiltrosLogistica: function (event) {
      // NO prevenir el comportamiento por defecto en inputs para permitir escritura normal
      // Solo prevenir en botones
      if (event && event.target && event.target.tagName === 'BUTTON') {
        event.preventDefault();
      }

      // NO aplicar filtros en click de inputs de fecha, solo en change
      if (
        event &&
        (event.type === 'click' || event.type === 'mousedown' || event.type === 'pointerdown')
      ) {
        const { target } = event;
        const isDateInput = target && target.tagName === 'INPUT' && target.type === 'date';
        if (isDateInput) {
          // No aplicar filtros en click de inputs de fecha, solo en change
          return;
        }
      }

      // Usar debounce para evitar demasiadas llamadas mientras el usuario escribe
      if (window._filtrosLogisticaTimeout) {
        clearTimeout(window._filtrosLogisticaTimeout);
      }

      window._filtrosLogisticaTimeout = setTimeout(() => {
        if (typeof window.aplicarFiltrosLogistica === 'function') {
          window.aplicarFiltrosLogistica();
        } else {
          console.error('aplicarFiltrosLogistica no está disponible');
        }
      }, 300); // Esperar 300ms después de que el usuario deje de escribir
    },

    limpiarFiltrosLogistica: function (event) {
      event.preventDefault();
      if (typeof window.limpiarFiltrosLogistica === 'function') {
        window.limpiarFiltrosLogistica();
      } else {
        console.error('limpiarFiltrosLogistica no está disponible');
      }
    },

    // Cliente
    loadClienteData: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      const select = event ? event.target : document.getElementById('cliente');

      // Verificar que el select existe y tiene un valor válido
      if (!select) {
        return;
      }

      const selectedValue = select.value;

      // No hacer nada si no hay valor seleccionado o está vacío
      if (!selectedValue || selectedValue === '' || selectedValue === '0') {
        // Limpiar campos si se deselecciona el cliente
        const rfcInput = document.getElementById('rfcCliente');
        if (rfcInput) {
          rfcInput.value = '';
        }
        return;
      }

      // Solo llamar a loadClienteData si hay un valor válido
      if (typeof window.loadClienteData === 'function') {
        window.loadClienteData(selectedValue);
      } else {
        console.error('loadClienteData no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de logística
   */
  function initLogisticaEventHandlers() {
    console.log('🔧 Inicializando event handlers de logística...');

    // Registrar todas las acciones en el sistema global
    Object.keys(logisticaActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, logisticaActions[action]);
      }
    });

    // Emitir evento cuando se hayan registrado todas las acciones
    // Esto permite que otros sistemas sepan que las acciones están listas
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('logisticaActionsRegistered', {
          detail: { actions: Object.keys(logisticaActions) }
        })
      );
    }, 100);

    // Agregar listeners a elementos con data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (logisticaActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          // Determinar el tipo de evento según el tipo de elemento
          const tagName = element.tagName.toLowerCase();
          const inputType = element.type ? element.type.toLowerCase() : '';

          // Para inputs, selects y textareas usar 'change', para botones usar 'click'
          // Para inputs de tipo text usar 'keyup' e 'input' para filtros automáticos
          // Para inputs de tipo date, NO agregar listener de click para permitir que el calendario nativo funcione
          if (tagName === 'input' && inputType === 'text' && action === 'aplicarFiltrosLogistica') {
            // Para inputs de texto con filtros, usar keyup e input para aplicar automáticamente
            element.addEventListener('keyup', logisticaActions[action]);
            element.addEventListener('input', logisticaActions[action]);
          } else if (tagName === 'input' && inputType === 'text') {
            // Para otros inputs de texto, usar keyup
            element.addEventListener('keyup', logisticaActions[action]);
          } else if (tagName === 'input' && inputType === 'date') {
            // Para inputs de fecha, solo usar 'change' para no interferir con el calendario nativo
            element.addEventListener('change', logisticaActions[action]);
          } else if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
            element.addEventListener('change', logisticaActions[action]);
          } else {
            element.addEventListener('click', logisticaActions[action]);
          }

          element.setAttribute('data-handler-attached', 'true');
          const eventType =
            tagName === 'input' && inputType === 'text'
              ? 'keyup'
              : tagName === 'input' && inputType === 'date'
                ? 'change'
                : tagName === 'input' || tagName === 'select' || tagName === 'textarea'
                  ? 'change'
                  : 'click';
          console.log(`✅ Handler de logística registrado: ${action} (${eventType})`);
        }
      }
    });

    console.log('✅ Event handlers de logística inicializados');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogisticaEventHandlers);
  } else {
    initLogisticaEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initLogisticaEventHandlers, 200);

  console.log('✅ Módulo de event handlers de logística cargado');
})();
