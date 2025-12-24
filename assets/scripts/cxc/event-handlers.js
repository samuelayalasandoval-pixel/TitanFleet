/**
 * Event Handlers Específicos para Cuentas por Cobrar (CXC)
 * Maneja todos los eventos de la página CXC.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de CXC
  const isCXCPage = window.location.pathname.includes('CXC.html');
  if (!isCXCPage) {
    return; // No ejecutar si no estamos en CXC
  }

  /**
   * Mapa de acciones específicas de CXC
   */
  const cxcActions = {
    // Filtros
    aplicarFiltrosCXC: function (event) {
      event.preventDefault();
      if (typeof window.aplicarFiltrosCXC === 'function') {
        window.aplicarFiltrosCXC();
      } else {
        console.error('aplicarFiltrosCXC no está disponible');
      }
    },

    limpiarFiltrosCXC: function (event) {
      event.preventDefault();
      if (typeof window.limpiarFiltrosCXC === 'function') {
        window.limpiarFiltrosCXC();
      } else {
        console.error('limpiarFiltrosCXC no está disponible');
      }
    },

    // Estado de cuenta
    generarEstadoCuenta: function (event) {
      event.preventDefault();
      if (typeof window.generarEstadoCuenta === 'function') {
        window.generarEstadoCuenta();
      } else {
        console.error('generarEstadoCuenta no está disponible');
      }
    },

    previewEstadoCuenta: function (event) {
      event.preventDefault();
      if (typeof window.previewEstadoCuenta === 'function') {
        window.previewEstadoCuenta();
      } else {
        console.error('previewEstadoCuenta no está disponible');
      }
    },

    generarPDFEstadoCuenta: function (event) {
      event.preventDefault();
      if (typeof window.generarPDFEstadoCuenta === 'function') {
        window.generarPDFEstadoCuenta();
      } else {
        console.error('generarPDFEstadoCuenta no está disponible');
      }
    },

    // Exportación
    exportCXCData: function (event) {
      event.preventDefault();
      if (typeof window.exportCXCData === 'function') {
        window.exportCXCData();
      } else {
        console.error('exportCXCData no está disponible');
      }
    },

    // Pagos
    abrirModalPagoMultiple: function (event) {
      event.preventDefault();
      if (typeof window.abrirModalPagoMultiple === 'function') {
        window.abrirModalPagoMultiple();
      } else {
        console.error('abrirModalPagoMultiple no está disponible');
      }
    },

    limpiarSelecciones: function (event) {
      event.preventDefault();
      if (typeof window.limpiarSelecciones === 'function') {
        if (confirm('¿Estás seguro de que deseas limpiar todas las selecciones?')) {
          window.limpiarSelecciones();
        }
      } else {
        console.error('limpiarSelecciones no está disponible');
      }
    },

    registrarPago: async function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      console.log('🖱️ Botón de registrar pago clickeado');

      if (typeof window.registrarPago === 'function') {
        console.log('✅ Función registrarPago encontrada, ejecutando...');
        try {
          await window.registrarPago();
        } catch (error) {
          console.error('❌ Error al ejecutar registrarPago:', error);
        }
      } else {
        console.error('❌ registrarPago no está disponible');
        console.log('🔍 Verificando funciones disponibles:', {
          registrarPago: typeof window.registrarPago,
          funcionesGlobales: Object.keys(window).filter(
            k => k.includes('registrar') || k.includes('pago')
          )
        });
        if (typeof window.showNotification === 'function') {
          window.showNotification(
            'Error: La función de registrar pago no está disponible. Por favor recarga la página.',
            'error'
          );
        } else {
          alert(
            'Error: La función de registrar pago no está disponible. Por favor recarga la página.'
          );
        }
      }
      return false;
    },

    procesarPagoMultiple: function (event) {
      event.preventDefault();
      if (typeof window.procesarPagoMultiple === 'function') {
        window.procesarPagoMultiple();
      } else {
        console.error('procesarPagoMultiple no está disponible');
      }
    },

    // Edición
    guardarEdicionFactura: function (event) {
      event.preventDefault();
      if (typeof window.guardarEdicionFactura === 'function') {
        window.guardarEdicionFactura();
      } else {
        console.error('guardarEdicionFactura no está disponible');
      }
    },

    // Selecciones
    toggleAllSelections: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.toggleAllSelections === 'function') {
        window.toggleAllSelections();
      } else {
        console.error('toggleAllSelections no está disponible');
      }
    },

    // Actualización de cuentas bancarias
    actualizarCuentasOrigenCXC: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.actualizarCuentasOrigenCXC === 'function') {
        window.actualizarCuentasOrigenCXC();
      } else {
        console.error('actualizarCuentasOrigenCXC no está disponible');
      }
    },

    actualizarCuentasOrigenMultipleCXC: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.actualizarCuentasOrigenMultipleCXC === 'function') {
        window.actualizarCuentasOrigenMultipleCXC();
      } else {
        console.error('actualizarCuentasOrigenMultipleCXC no está disponible');
      }
    },

    actualizarCuentasOrigenEditarCXC: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.actualizarCuentasOrigenEditarCXC === 'function') {
        window.actualizarCuentasOrigenEditarCXC();
      } else {
        console.error('actualizarCuentasOrigenEditarCXC no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de CXC
   */
  function initCXCEventHandlers() {
    console.log('🔧 Inicializando event handlers de CXC...');

    // Registrar todas las acciones en el sistema global
    Object.keys(cxcActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, cxcActions[action]);
      }
    });

    // Agregar listeners a elementos con data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (cxcActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          // Determinar el tipo de evento según el tipo de elemento
          const tagName = element.tagName.toLowerCase();
          const _inputType = element.type ? element.type.toLowerCase() : '';

          // Para inputs, selects y textareas usar 'change', para botones usar 'click'
          let eventType = 'click';
          if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
            eventType = 'change';
          }

          // Agregar listener
          element.addEventListener(eventType, cxcActions[action]);

          element.setAttribute('data-handler-attached', 'true');
          console.log(
            `✅ Handler de CXC registrado: ${action} (${eventType}) en elemento:`,
            element
          );
        } else {
          console.log(`⚠️ Handler ya registrado para: ${action}`);
        }
      }
    });

    // Verificar específicamente el botón de registrar pago
    const btnRegistrarPago = document.querySelector(
      '#modalRegistrarPago button[data-action="registrarPago"]'
    );
    if (btnRegistrarPago) {
      console.log('🔍 Botón de registrar pago encontrado:', {
        tieneHandler: btnRegistrarPago.hasAttribute('data-handler-attached'),
        action: btnRegistrarPago.getAttribute('data-action'),
        id: btnRegistrarPago.id,
        clase: btnRegistrarPago.className
      });

      // Si no tiene handler, agregarlo manualmente
      if (!btnRegistrarPago.hasAttribute('data-handler-attached')) {
        btnRegistrarPago.addEventListener('click', cxcActions.registrarPago);
        btnRegistrarPago.setAttribute('data-handler-attached', 'true');
        console.log('✅ Handler manual agregado al botón de registrar pago');
      }
    } else {
      console.warn('⚠️ Botón de registrar pago no encontrado en el DOM');
    }

    console.log('✅ Event handlers de CXC inicializados');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCXCEventHandlers);
  } else {
    initCXCEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initCXCEventHandlers, 200);

  console.log('✅ Módulo de event handlers de CXC cargado');
})();
