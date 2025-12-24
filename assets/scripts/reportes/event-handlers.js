/**
 * Event Handlers Específicos para Reportes
 * Maneja todos los eventos de la página reportes.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de reportes
  const isReportesPage = window.location.pathname.includes('reportes.html');
  if (!isReportesPage) {
    return; // No ejecutar si no estamos en reportes
  }

  /**
   * Mapa de acciones específicas de reportes
   */
  const reportesActions = {
    // Análisis económico
    actualizarAnalisisEconomico: function (event) {
      event.preventDefault();
      if (
        window.reportesSystem &&
        typeof window.reportesSystem.actualizarAnalisisEconomico === 'function'
      ) {
        window.reportesSystem.actualizarAnalisisEconomico();
      } else {
        console.error('reportesSystem.actualizarAnalisisEconomico no está disponible');
      }
    },

    // Gráficos
    actualizarGraficoMovimientos: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.actualizarGraficoMovimientos === 'function') {
        window.actualizarGraficoMovimientos();
      } else {
        console.error('actualizarGraficoMovimientos no está disponible');
      }
    },

    // Filtros
    limpiarFiltrosMovimientos: function (event) {
      event.preventDefault();
      if (typeof window.limpiarFiltrosMovimientos === 'function') {
        window.limpiarFiltrosMovimientos();
      } else {
        console.error('limpiarFiltrosMovimientos no está disponible');
      }
    },

    // Filtro de mes para reportes
    aplicarFiltroMesReportes: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.aplicarFiltroMesReportes === 'function') {
        window.aplicarFiltroMesReportes();
      } else {
        console.error('aplicarFiltroMesReportes no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de reportes
   */
  function initReportesEventHandlers() {
    console.log('🔧 Inicializando event handlers de reportes...');

    // Registrar todas las acciones en el sistema global
    Object.keys(reportesActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, reportesActions[action]);
      }
    });

    // Agregar listeners a elementos con data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (reportesActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          // Determinar el tipo de evento según el tipo de elemento
          const tagName = element.tagName.toLowerCase();
          const _inputType = element.type ? element.type.toLowerCase() : '';

          // Para inputs, selects y textareas usar 'change', para botones usar 'click'
          if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
            element.addEventListener('change', reportesActions[action]);
          } else {
            element.addEventListener('click', reportesActions[action]);
          }

          element.setAttribute('data-handler-attached', 'true');
          console.log(
            `✅ Handler de reportes registrado: ${action} (${tagName === 'input' || tagName === 'select' ? 'change' : 'click'})`
          );
        }
      }
    });

    console.log('✅ Event handlers de reportes inicializados');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReportesEventHandlers);
  } else {
    initReportesEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initReportesEventHandlers, 200);

  console.log('✅ Módulo de event handlers de reportes cargado');
})();
