/**
 * Event Handlers Específicos para Cuentas por Pagar (CXP)
 * Maneja todos los eventos de la página CXP.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de CXP
  const isCXPPage = window.location.pathname.includes('CXP.html');
  if (!isCXPPage) {
    return; // No ejecutar si no estamos en CXP
  }

  /**
   * Mapa de acciones específicas de CXP
   */
  const cxpActions = {
    // Estado de cuenta
    generarEstadoCuentaProveedor: function (event) {
      event.preventDefault();
      if (typeof window.generarEstadoCuentaProveedor === 'function') {
        window.generarEstadoCuentaProveedor();
      } else {
        console.error('generarEstadoCuentaProveedor no está disponible');
      }
    },

    previewEstadoCuentaProveedor: function (event) {
      event.preventDefault();
      if (typeof window.previewEstadoCuentaProveedor === 'function') {
        window.previewEstadoCuentaProveedor();
      } else {
        console.error('previewEstadoCuentaProveedor no está disponible');
      }
    },

    generarPDFEstadoCuentaProveedor: function (event) {
      event.preventDefault();
      if (typeof window.generarPDFEstadoCuentaProveedor === 'function') {
        window.generarPDFEstadoCuentaProveedor();
      } else {
        console.error('generarPDFEstadoCuentaProveedor no está disponible');
      }
    },

    // Facturas
    abrirModalNuevaFactura: function (event) {
      event.preventDefault();
      if (typeof window.abrirModalNuevaFactura === 'function') {
        window.abrirModalNuevaFactura();
      } else {
        console.error('abrirModalNuevaFactura no está disponible');
      }
    },

    guardarNuevaFactura: function (event) {
      event.preventDefault();
      if (typeof window.guardarNuevaFactura === 'function') {
        window.guardarNuevaFactura();
      } else {
        console.error('guardarNuevaFactura no está disponible');
      }
    },

    // Filtros
    aplicarFiltrosCXP: function (event) {
      event.preventDefault();
      if (typeof window.aplicarFiltrosCXP === 'function') {
        window.aplicarFiltrosCXP();
      } else {
        console.error('aplicarFiltrosCXP no está disponible');
      }
    },

    limpiarFiltrosCXP: function (event) {
      event.preventDefault();
      if (typeof window.limpiarFiltrosCXP === 'function') {
        window.limpiarFiltrosCXP();
      } else {
        console.error('limpiarFiltrosCXP no está disponible');
      }
    },

    // Exportación
    exportarCXPExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarCXPExcel === 'function') {
        window.exportarCXPExcel();
      } else {
        console.error('exportarCXPExcel no está disponible');
      }
    },

    exportarSolicitudesCXPExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarSolicitudesCXPExcel === 'function') {
        window.exportarSolicitudesCXPExcel();
      } else {
        console.error('exportarSolicitudesCXPExcel no está disponible');
      }
    },

    // Solicitudes de pago
    crearSolicitudPagoSeleccionadas: function (event) {
      event.preventDefault();
      if (typeof window.crearSolicitudPagoSeleccionadas === 'function') {
        window.crearSolicitudPagoSeleccionadas();
      } else {
        console.error('crearSolicitudPagoSeleccionadas no está disponible');
      }
    },

    crearSolicitudPago: function (event) {
      event.preventDefault();
      if (typeof window.crearSolicitudPago === 'function') {
        window.crearSolicitudPago();
      } else {
        console.error('crearSolicitudPago no está disponible');
      }
    },

    aprobarSolicitudesSeleccionadas: function (event) {
      event.preventDefault();
      if (typeof window.aprobarSolicitudesSeleccionadas === 'function') {
        if (confirm('¿Estás seguro de que deseas autorizar las solicitudes seleccionadas?')) {
          window.aprobarSolicitudesSeleccionadas();
        }
      } else {
        console.error('aprobarSolicitudesSeleccionadas no está disponible');
      }
    },

    rechazarSolicitudesSeleccionadas: function (event) {
      event.preventDefault();
      if (typeof window.rechazarSolicitudesSeleccionadas === 'function') {
        if (confirm('¿Estás seguro de que deseas rechazar las solicitudes seleccionadas?')) {
          window.rechazarSolicitudesSeleccionadas();
        }
      } else {
        console.error('rechazarSolicitudesSeleccionadas no está disponible');
      }
    },

    // Toggle select all (checkboxes)
    toggleSelectAllFacturasCXP: function (event) {
      // Para checkboxes, el evento es 'change', no 'click'
      const checkbox = event.target;
      if (typeof window.toggleSelectAllFacturasCXP === 'function') {
        window.toggleSelectAllFacturasCXP(checkbox);
      } else {
        console.error('toggleSelectAllFacturasCXP no está disponible');
      }
    },

    toggleSelectAllSolicitudesCXP: function (event) {
      // Para checkboxes, el evento es 'change', no 'click'
      const checkbox = event.target;
      if (typeof window.toggleSelectAllSolicitudesCXP === 'function') {
        window.toggleSelectAllSolicitudesCXP(checkbox);
      } else {
        console.error('toggleSelectAllSolicitudesCXP no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de CXP
   */
  function initCXPEventHandlers() {
    console.log('🔧 Inicializando event handlers de CXP...');

    // Registrar todas las acciones en el sistema global
    Object.keys(cxpActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, cxpActions[action]);
      }
    });

    // Agregar listeners a elementos con data-action (botones)
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (cxpActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          // Para checkboxes, usar 'change', para botones usar 'click'
          const eventType = element.type === 'checkbox' ? 'change' : 'click';
          element.addEventListener(eventType, cxpActions[action]);
          element.setAttribute('data-handler-attached', 'true');
          console.log(`✅ Handler de CXP registrado: ${action}`);
        }
      }
    });

    // Manejar checkboxes específicos que tienen onclick inline
    const selectAllFacturas = document.getElementById('selectAllFacturasCXP');
    if (selectAllFacturas && !selectAllFacturas.hasAttribute('data-handler-attached')) {
      selectAllFacturas.addEventListener('change', cxpActions.toggleSelectAllFacturasCXP);
      selectAllFacturas.setAttribute('data-handler-attached', 'true');
    }

    const selectAllSolicitudes = document.getElementById('selectAllSolicitudesCXP');
    if (selectAllSolicitudes && !selectAllSolicitudes.hasAttribute('data-handler-attached')) {
      selectAllSolicitudes.addEventListener('change', cxpActions.toggleSelectAllSolicitudesCXP);
      selectAllSolicitudes.setAttribute('data-handler-attached', 'true');
    }

    console.log('✅ Event handlers de CXP inicializados');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCXPEventHandlers);
  } else {
    initCXPEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initCXPEventHandlers, 200);

  console.log('✅ Módulo de event handlers de CXP cargado');
})();
