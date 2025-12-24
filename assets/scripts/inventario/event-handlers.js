/**
 * Event Handlers Específicos para Inventario
 * Maneja todos los eventos de la página inventario.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de inventario
  const isInventarioPage = window.location.pathname.includes('inventario.html');
  if (!isInventarioPage) {
    return; // No ejecutar si no estamos en inventario
  }

  /**
   * Mapa de acciones específicas de inventario
   */
  const inventarioActions = {
    // Exportación
    exportarAlertasStockBajoExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarAlertasStockBajoExcel === 'function') {
        window.exportarAlertasStockBajoExcel();
      } else {
        console.error('exportarAlertasStockBajoExcel no está disponible');
      }
    },

    exportarPlataformasDescargaExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarPlataformasDescargaExcel === 'function') {
        window.exportarPlataformasDescargaExcel();
      } else {
        console.error('exportarPlataformasDescargaExcel no está disponible');
      }
    },

    exportarInventarioPlataformasExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarInventarioPlataformasExcel === 'function') {
        window.exportarInventarioPlataformasExcel();
      } else {
        console.error('exportarInventarioPlataformasExcel no está disponible');
      }
    },

    exportarPlataformasGestiónExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarPlataformasGestiónExcel === 'function') {
        window.exportarPlataformasGestiónExcel();
      } else {
        console.error('exportarPlataformasGestiónExcel no está disponible');
      }
    },

    exportarRefaccionesMovimientosExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarRefaccionesMovimientosExcel === 'function') {
        window.exportarRefaccionesMovimientosExcel();
      } else {
        console.error('exportarRefaccionesMovimientosExcel no está disponible');
      }
    },

    exportarMovimientosRefaccionesExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarMovimientosRefaccionesExcel === 'function') {
        window.exportarMovimientosRefaccionesExcel();
      } else {
        console.error('exportarMovimientosRefaccionesExcel no está disponible');
      }
    },

    // Transferencias
    confirmarTransferenciaPlataforma: function (event) {
      event.preventDefault();
      if (typeof window.confirmarTransferenciaPlataforma === 'function') {
        window.confirmarTransferenciaPlataforma();
      } else {
        console.error('confirmarTransferenciaPlataforma no está disponible');
      }
    },

    // Filtros
    aplicarFiltrosInventario: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (window.inventarioUI && typeof window.inventarioUI.aplicarFiltros === 'function') {
        window.inventarioUI.aplicarFiltros();
      } else {
        console.error('inventarioUI.aplicarFiltros no está disponible');
      }
    },

    aplicarFiltrosPlataformasDescarga: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.aplicarFiltrosPlataformasDescarga === 'function') {
        window.aplicarFiltrosPlataformasDescarga();
      } else {
        console.error('aplicarFiltrosPlataformasDescarga no está disponible');
      }
    },

    actualizarTablaInventario: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.actualizarTablaInventario === 'function') {
        window.actualizarTablaInventario();
      } else {
        console.error('actualizarTablaInventario no está disponible');
      }
    },

    aplicarFiltrosRefacciones: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (
        window.refaccionesUI &&
        typeof window.refaccionesUI.aplicarFiltrosUnificados === 'function'
      ) {
        window.refaccionesUI.aplicarFiltrosUnificados();
      } else {
        console.error('refaccionesUI.aplicarFiltrosUnificados no está disponible');
      }
    },

    limpiarFiltrosUnificados: function (event) {
      event.preventDefault();
      if (
        window.refaccionesUI &&
        typeof window.refaccionesUI.limpiarFiltrosUnificados === 'function'
      ) {
        window.refaccionesUI.limpiarFiltrosUnificados();
      } else {
        console.error('refaccionesUI.limpiarFiltrosUnificados no está disponible');
      }
    },

    // Refacciones UI
    refreshProveedores: function (event) {
      event.preventDefault();
      if (window.refaccionesUI && typeof window.refaccionesUI.refreshProveedores === 'function') {
        window.refaccionesUI.refreshProveedores();
      } else {
        console.error('refaccionesUI.refreshProveedores no está disponible');
      }
    },

    refreshAlmacenes: function (event) {
      event.preventDefault();
      if (window.refaccionesUI && typeof window.refaccionesUI.refreshAlmacenes === 'function') {
        window.refaccionesUI.refreshAlmacenes();
      } else {
        console.error('refaccionesUI.refreshAlmacenes no está disponible');
      }
    },

    abrirConfiguracionProveedores: function (event) {
      event.preventDefault();
      window.open('configuracion.html#proveedores', '_blank');
    },

    abrirConfiguracionAlmacenes: function (event) {
      event.preventDefault();
      window.open('configuracion.html#almacenes', '_blank');
    },

    registrarMovimiento: function (event) {
      event.preventDefault();
      if (window.refaccionesUI && typeof window.refaccionesUI.registrarMovimiento === 'function') {
        window.refaccionesUI.registrarMovimiento();
      } else {
        console.error('refaccionesUI.registrarMovimiento no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de inventario
   */
  function initInventarioEventHandlers() {
    console.log('🔧 Inicializando event handlers de inventario...');

    // Registrar todas las acciones en el sistema global
    Object.keys(inventarioActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, inventarioActions[action]);
      }
    });

    // Agregar listeners a elementos con data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (inventarioActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          // Determinar el tipo de evento según el tipo de elemento
          const tagName = element.tagName.toLowerCase();
          const inputType = element.type ? element.type.toLowerCase() : '';

          // Para inputs, selects y textareas usar 'change', para botones usar 'click'
          // Para inputs de tipo text usar 'keyup' o 'input' si es necesario
          if (tagName === 'input' && inputType === 'text') {
            // Para inputs de texto, usar keyup si tiene onkeyup, sino usar change
            element.addEventListener('keyup', inventarioActions[action]);
          } else if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
            element.addEventListener('change', inventarioActions[action]);
          } else {
            element.addEventListener('click', inventarioActions[action]);
          }

          element.setAttribute('data-handler-attached', 'true');
          const eventType =
            tagName === 'input' && inputType === 'text'
              ? 'keyup'
              : tagName === 'input' || tagName === 'select' || tagName === 'textarea'
                ? 'change'
                : 'click';
          console.log(`✅ Handler de inventario registrado: ${action} (${eventType})`);
        }
      }
    });

    console.log('✅ Event handlers de inventario inicializados');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInventarioEventHandlers);
  } else {
    initInventarioEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initInventarioEventHandlers, 200);

  console.log('✅ Módulo de event handlers de inventario cargado');
})();
