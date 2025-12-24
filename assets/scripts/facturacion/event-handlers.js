/**
 * Event Handlers Específicos para Facturación
 * Maneja todos los eventos de la página facturacion.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de facturación
  const isFacturacionPage = window.location.pathname.includes('facturacion.html');
  if (!isFacturacionPage) {
    return; // No ejecutar si no estamos en facturación
  }

  /**
   * Mapa de acciones específicas de facturación
   */
  const facturacionActions = {
    // Búsqueda
    safeSearchAndFillData: function (event) {
      event.preventDefault();
      const numeroRegistroInput = document.getElementById('numeroRegistro');
      if (numeroRegistroInput && typeof window.safeSearchAndFillData === 'function') {
        window.safeSearchAndFillData(numeroRegistroInput.value);
      } else {
        console.error('safeSearchAndFillData no está disponible');
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

    // Filtros
    aplicarFiltrosFacturacion: function (event) {
      // Permitir que funcione tanto para click como para change/keyup
      if (event) {
        event.preventDefault();
      }
      if (typeof window.aplicarFiltrosFacturacion === 'function') {
        window.aplicarFiltrosFacturacion();
      } else {
        console.error('aplicarFiltrosFacturacion no está disponible');
      }
    },

    // Exportación
    exportarFacturacionExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarFacturacionExcel === 'function') {
        window.exportarFacturacionExcel();
      } else {
        console.error('exportarFacturacionExcel no está disponible');
      }
    },

    // Filtros
    limpiarFiltrosFacturacion: function (event) {
      event.preventDefault();
      if (typeof window.limpiarFiltrosFacturacion === 'function') {
        window.limpiarFiltrosFacturacion();
      } else {
        console.error('limpiarFiltrosFacturacion no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de facturación
   */
  function initFacturacionEventHandlers() {
    console.log('🔧 Inicializando event handlers de facturación...');

    // Registrar todas las acciones en el sistema global
    Object.keys(facturacionActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, facturacionActions[action]);
      }
    });

    // Emitir evento cuando se hayan registrado todas las acciones
    // Esto permite que otros sistemas sepan que las acciones están listas
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('facturacionActionsRegistered', {
          detail: { actions: Object.keys(facturacionActions) }
        })
      );
    }, 100);

    // Agregar listeners a elementos con data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (facturacionActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          // Determinar el tipo de evento según el tipo de elemento
          const tagName = element.tagName.toLowerCase();
          const inputType = element.type ? element.type.toLowerCase() : '';

          // Para inputs, selects y textareas usar 'change', para botones usar 'click'
          // Para inputs de tipo text usar 'keyup' o 'input' si es necesario
          if (tagName === 'input' && inputType === 'text') {
            // Para inputs de texto, usar keyup si tiene onkeyup, sino usar change
            element.addEventListener('keyup', facturacionActions[action]);
          } else if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
            element.addEventListener('change', facturacionActions[action]);
          } else {
            element.addEventListener('click', facturacionActions[action]);
          }

          element.setAttribute('data-handler-attached', 'true');
          const eventType =
            tagName === 'input' && inputType === 'text'
              ? 'keyup'
              : tagName === 'input' || tagName === 'select' || tagName === 'textarea'
                ? 'change'
                : 'click';
          console.log(`✅ Handler de facturación registrado: ${action} (${eventType})`);
        }
      }
    });

    // Inicializar manejo de observaciones
    initObservacionesHandler();

    console.log('✅ Event handlers de facturación inicializados');
  }

  /**
   * Inicializa el manejo de mostrar/ocultar campo de observaciones
   */
  function initObservacionesHandler() {
    const observacionesSi = document.getElementById('observacionesSi');
    const observacionesNo = document.getElementById('observacionesNo');
    const descripcionObservaciones = document.getElementById('descripcionObservaciones');

    if (!observacionesSi || !observacionesNo || !descripcionObservaciones) {
      console.warn('⚠️ Elementos de observaciones no encontrados');
      return;
    }

    // Función para mostrar/ocultar el campo
    function toggleObservacionesField() {
      if (observacionesSi.checked) {
        // Mostrar el campo
        descripcionObservaciones.style.display = 'block';
        descripcionObservaciones.classList.add('show');
        const textarea = document.getElementById('descripcionFacturacion');
        if (textarea) {
          textarea.required = false; // No requerido, solo visible
        }
      } else {
        // Ocultar el campo
        descripcionObservaciones.style.display = 'none';
        descripcionObservaciones.classList.remove('show');
        const textarea = document.getElementById('descripcionFacturacion');
        if (textarea) {
          textarea.value = ''; // Limpiar el campo al ocultarlo
          textarea.required = false;
        }
      }
    }

    // Agregar event listeners
    observacionesSi.addEventListener('change', toggleObservacionesField);
    observacionesNo.addEventListener('change', toggleObservacionesField);

    // Inicializar estado (oculto por defecto ya que "No" está checked)
    toggleObservacionesField();

    console.log('✅ Handler de observaciones inicializado');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFacturacionEventHandlers);
  } else {
    initFacturacionEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initFacturacionEventHandlers, 200);

  console.log('✅ Módulo de event handlers de facturación cargado');
})();
