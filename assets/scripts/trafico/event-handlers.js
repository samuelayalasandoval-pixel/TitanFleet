/**
 * Event Handlers Específicos para Tráfico
 * Maneja todos los eventos de la página trafico.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de tráfico
  const isTraficoPage = window.location.pathname.includes('trafico.html');
  if (!isTraficoPage) {
    return; // No ejecutar si no estamos en tráfico
  }

  /**
   * Mapa de acciones específicas de tráfico
   */
  const traficoActions = {
    // Búsqueda de datos
    buscarDatosConValidacion: function (event) {
      event.preventDefault();
      if (typeof window.buscarDatosConValidacion === 'function') {
        window.buscarDatosConValidacion();
      } else {
        alert('Función no disponible aún, espera un momento');
      }
    },

    // Actualización de listas
    refreshEstanciasListTrafico: function (event) {
      event.preventDefault();
      if (typeof window.refreshEstanciasListTrafico === 'function') {
        window.refreshEstanciasListTrafico();
      } else {
        console.error('refreshEstanciasListTrafico no está disponible');
      }
    },

    // Desplegar listas
    desplegarListaEconomicos: function (event) {
      event.preventDefault();
      if (typeof window.desplegarListaEconomicos === 'function') {
        window.desplegarListaEconomicos();
      } else {
        console.error('desplegarListaEconomicos no está disponible');
      }
    },

    desplegarListaOperadores: function (event) {
      event.preventDefault();
      const button = event.target.closest('button') || event.target;
      const tipo = button.getAttribute('data-tipo') || 'principal';

      if (typeof window.desplegarListaOperadores === 'function') {
        window.desplegarListaOperadores(tipo);
      } else {
        console.error('desplegarListaOperadores no está disponible');
      }
    },

    desplegarListaOperadoresGastos: function (event) {
      event.preventDefault();
      const button = event.target.closest('button') || event.target;
      const indice = button.getAttribute('data-indice');
      const indiceNum = indice ? parseInt(indice, 10) : 1;

      if (typeof window.desplegarListaOperadoresGastos === 'function') {
        window.desplegarListaOperadoresGastos(indiceNum);
      } else {
        console.error('desplegarListaOperadoresGastos no está disponible');
      }
    },

    // Gastos de operadores
    limpiarGastosOperadores: function (event) {
      event.preventDefault();
      if (typeof window.limpiarGastosOperadores === 'function') {
        if (confirm('¿Estás seguro de que deseas limpiar todos los gastos de operadores?')) {
          window.limpiarGastosOperadores();
        }
      } else {
        console.error('limpiarGastosOperadores no está disponible');
      }
    },

    eliminarGastoOperador: function (event) {
      event.preventDefault();
      const button = event.target.closest('button') || event.target;
      const indice = button.getAttribute('data-indice');
      const indiceNum = indice ? parseInt(indice, 10) : 1;

      if (typeof window.eliminarGastoOperador === 'function') {
        if (confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
          window.eliminarGastoOperador(indiceNum);
        }
      } else {
        console.error('eliminarGastoOperador no está disponible');
      }
    },

    agregarGastoOperador: function (event) {
      event.preventDefault();
      if (typeof window.agregarGastoOperador === 'function') {
        window.agregarGastoOperador();
      } else {
        console.error('agregarGastoOperador no está disponible');
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
    exportarTraficoExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarTraficoExcel === 'function') {
        window.exportarTraficoExcel();
      } else {
        console.error('exportarTraficoExcel no está disponible');
      }
    },

    // Filtros
    filtrarPorEstadoPlataforma: function (event) {
      event.preventDefault();
      const button = event.target.closest('button') || event.target;
      const estado = button.getAttribute('data-estado') || '';

      if (typeof window.filtrarPorEstadoPlataforma === 'function') {
        window.filtrarPorEstadoPlataforma(estado);
      } else {
        console.error('filtrarPorEstadoPlataforma no está disponible');
      }
    },

    aplicarFiltrosTrafico: function (event) {
      // NO prevenir el comportamiento por defecto en inputs para permitir escritura normal
      // Solo prevenir en botones
      if (event && event.target && event.target.tagName === 'BUTTON') {
        event.preventDefault();
      }

      // Usar debounce para evitar demasiadas llamadas mientras el usuario escribe
      if (window._filtrosTraficoTimeout) {
        clearTimeout(window._filtrosTraficoTimeout);
      }

      window._filtrosTraficoTimeout = setTimeout(() => {
        if (typeof window.aplicarFiltrosTrafico === 'function') {
          window.aplicarFiltrosTrafico();
        } else {
          console.error('aplicarFiltrosTrafico no está disponible');
        }
      }, 300); // Esperar 300ms después de que el usuario deje de escribir
    },

    limpiarFiltrosTrafico: function (event) {
      event.preventDefault();
      if (typeof window.limpiarFiltrosTrafico === 'function') {
        window.limpiarFiltrosTrafico();
      } else {
        console.error('limpiarFiltrosTrafico no está disponible');
      }
    },

    toggleCamposDescarga: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.toggleCamposDescarga === 'function') {
        window.toggleCamposDescarga();
      } else {
        console.error('toggleCamposDescarga no está disponible');
      }
    },

    // Confirmación de descarga
    confirmarDescarga: function (event) {
      event.preventDefault();
      if (typeof window.confirmarDescarga === 'function') {
        window.confirmarDescarga();
      } else {
        console.error('confirmarDescarga no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de tráfico
   */
  function initTraficoEventHandlers() {
    console.log('🔧 Inicializando event handlers de tráfico...');

    // Registrar todas las acciones en el sistema global
    Object.keys(traficoActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, traficoActions[action]);
      }
    });

    // Agregar listeners a elementos con data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (traficoActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          // Determinar el tipo de evento según el tipo de elemento
          const tagName = element.tagName.toLowerCase();
          const inputType = element.type ? element.type.toLowerCase() : '';

          // Para inputs, selects y textareas usar 'change', para botones usar 'click'
          // Para inputs de tipo text usar 'keyup' e 'input' para filtros automáticos
          if (tagName === 'input' && inputType === 'text' && action === 'aplicarFiltrosTrafico') {
            // Para inputs de texto con filtros, usar keyup e input para aplicar automáticamente
            element.addEventListener('keyup', traficoActions[action]);
            element.addEventListener('input', traficoActions[action]);
          } else if (tagName === 'input' && inputType === 'text') {
            // Para otros inputs de texto, usar keyup
            element.addEventListener('keyup', traficoActions[action]);
          } else if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
            element.addEventListener('change', traficoActions[action]);
          } else {
            element.addEventListener('click', traficoActions[action]);
          }

          element.setAttribute('data-handler-attached', 'true');
          const eventType =
            tagName === 'input' && inputType === 'text'
              ? 'keyup'
              : tagName === 'input' || tagName === 'select' || tagName === 'textarea'
                ? 'change'
                : 'click';
          console.log(`✅ Handler de tráfico registrado: ${action} (${eventType})`);
        }
      }
    });

    console.log('✅ Event handlers de tráfico inicializados');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTraficoEventHandlers);
  } else {
    initTraficoEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initTraficoEventHandlers, 200);

  console.log('✅ Módulo de event handlers de tráfico cargado');
})();
