/**
 * Event Handlers Específicos para Mantenimiento
 * Maneja todos los eventos de la página mantenimiento.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de mantenimiento
  const isMantenimientoPage = window.location.pathname.includes('mantenimiento.html');
  if (!isMantenimientoPage) {
    return; // No ejecutar si no estamos en mantenimiento
  }

  /**
   * Mapa de acciones específicas de mantenimiento
   */
  const mantenimientoActions = {
    // Listas
    desplegarListaEconomicosMantenimiento: function (event) {
      event.preventDefault();
      if (typeof window.desplegarListaEconomicosMantenimiento === 'function') {
        window.desplegarListaEconomicosMantenimiento();
      } else {
        console.error('desplegarListaEconomicosMantenimiento no está disponible');
      }
    },

    // Refacciones
    limpiarDatosRefacciones: function (event) {
      event.preventDefault();
      if (typeof window.limpiarDatosRefacciones === 'function') {
        if (
          confirm(
            '¿Estás seguro de que deseas limpiar todos los datos de refacciones? Esta acción no se puede deshacer.'
          )
        ) {
          window.limpiarDatosRefacciones();
        }
      } else {
        console.error('limpiarDatosRefacciones no está disponible');
      }
    },

    mostrarListaRefacciones: function (event) {
      event.preventDefault();
      const button = event.target.closest('button') || event.target;
      const indice = button.getAttribute('data-indice');
      const indiceNum = indice ? parseInt(indice, 10) : 1;

      if (typeof window.mostrarListaRefacciones === 'function') {
        window.mostrarListaRefacciones(indiceNum);
      } else {
        console.error('mostrarListaRefacciones no está disponible');
      }
    },

    actualizarListaRefacciones: function (event) {
      event.preventDefault();
      if (typeof window.actualizarListaRefacciones === 'function') {
        window.actualizarListaRefacciones();
      } else {
        console.error('actualizarListaRefacciones no está disponible');
      }
    },

    eliminarFilaRefaccion: function (event) {
      event.preventDefault();
      const button = event.target.closest('button') || event.target;
      const indice = button.getAttribute('data-indice');
      const indiceNum = indice ? parseInt(indice, 10) : 1;

      if (typeof window.eliminarFilaRefaccion === 'function') {
        if (confirm('¿Estás seguro de que deseas eliminar esta refacción?')) {
          window.eliminarFilaRefaccion(indiceNum);
        }
      } else {
        console.error('eliminarFilaRefaccion no está disponible');
      }
    },

    agregarFilaRefaccion: function (event) {
      event.preventDefault();
      if (typeof window.agregarFilaRefaccion === 'function') {
        window.agregarFilaRefaccion();
      } else {
        console.error('agregarFilaRefaccion no está disponible');
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

    saveMantenimientoData: function (event) {
      event.preventDefault();
      event.stopPropagation(); // Prevenir propagación del evento

      // Prevenir dobles clics verificando si ya hay un proceso en curso
      const submitButton =
        event.target.closest('button[data-action="saveMantenimientoData"]') || event.target;
      if (submitButton && submitButton.disabled) {
        console.log('⚠️ Botón ya está deshabilitado, ignorando clic duplicado');
        return false;
      }

      if (typeof window.saveMantenimientoData === 'function') {
        window.saveMantenimientoData();
      } else {
        console.error('saveMantenimientoData no está disponible');
      }
    },

    guardarMantenimientoEditado: function (event) {
      event.preventDefault();
      if (typeof window.guardarMantenimientoEditado === 'function') {
        window.guardarMantenimientoEditado();
      } else {
        console.error('guardarMantenimientoEditado no está disponible');
      }
    },

    // Funciones del modal de edición
    filtrarEconomicosMantenimientoEditar: function (event) {
      if (event) {
        event.preventDefault();
      }
      const input = event ? event.target : null;
      const busqueda = input ? input.value : '';
      if (typeof window.filtrarEconomicosMantenimientoEditar === 'function') {
        window.filtrarEconomicosMantenimientoEditar(busqueda);
      } else {
        console.error('filtrarEconomicosMantenimientoEditar no está disponible');
      }
    },

    // Event listeners adicionales para el input económico del modal
    setupEconomicoModalListeners: function () {
      const economicoInput = document.getElementById('editarMantenimiento_economico');
      if (economicoInput && !economicoInput.hasAttribute('data-listeners-attached')) {
        economicoInput.addEventListener('focus', () => {
          if (typeof window.mostrarDropdownEconomicosMantenimientoEditar === 'function') {
            window.mostrarDropdownEconomicosMantenimientoEditar();
          }
        });

        economicoInput.addEventListener('blur', () => {
          setTimeout(() => {
            if (typeof window.ocultarDropdownEconomicosMantenimientoEditar === 'function') {
              window.ocultarDropdownEconomicosMantenimientoEditar();
            }
          }, 250);
        });

        economicoInput.addEventListener('keydown', event => {
          if (typeof window.manejarTecladoEconomicosMantenimientoEditar === 'function') {
            window.manejarTecladoEconomicosMantenimientoEditar(event);
          }
        });

        economicoInput.setAttribute('data-listeners-attached', 'true');
      }
    },

    mostrarDropdownEconomicosMantenimientoEditar: function (event) {
      console.log('🔘 Botón de desplegar dropdown clickeado');
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (typeof window.mostrarDropdownEconomicosMantenimientoEditar === 'function') {
        console.log(
          '✅ Función mostrarDropdownEconomicosMantenimientoEditar encontrada, llamando...'
        );
        try {
          window.mostrarDropdownEconomicosMantenimientoEditar();
        } catch (error) {
          console.error('❌ Error al llamar mostrarDropdownEconomicosMantenimientoEditar:', error);
        }
      } else {
        console.error('❌ mostrarDropdownEconomicosMantenimientoEditar no está disponible');
      }
    },

    agregarFilaRefaccionEditar: function (event) {
      if (event) {
        event.preventDefault();
      }
      if (typeof window.agregarFilaRefaccionEditar === 'function') {
        window.agregarFilaRefaccionEditar();
      } else {
        console.error('agregarFilaRefaccionEditar no está disponible');
      }
    },

    eliminarFilaRefaccionEditar: function (event) {
      if (event) {
        event.preventDefault();
      }
      const button = event ? event.target.closest('button') || event.target : null;
      const indice = button ? button.getAttribute('data-indice') : null;
      const indiceNum = indice ? parseInt(indice, 10) : 1;
      if (typeof window.eliminarFilaRefaccionEditar === 'function') {
        window.eliminarFilaRefaccionEditar(indiceNum);
      } else {
        console.error('eliminarFilaRefaccionEditar no está disponible');
      }
    },

    filtrarRefaccionesEditar: function (event) {
      if (event) {
        event.preventDefault();
      }
      const input = event ? event.target : null;
      const indice = input
        ? input.getAttribute('data-indice') || input.id.match(/\d+/)?.[0] || '1'
        : '1';
      if (typeof window.filtrarRefaccionesEditar === 'function') {
        window.filtrarRefaccionesEditar(parseInt(indice, 10));
      } else {
        console.error('filtrarRefaccionesEditar no está disponible');
      }
    },

    mostrarListaRefaccionesEditar: function (event) {
      if (event) {
        event.preventDefault();
      }
      const button = event ? event.target.closest('button') || event.target : null;
      const indice = button ? button.getAttribute('data-indice') : null;
      const indiceNum = indice ? parseInt(indice, 10) : 1;
      if (typeof window.mostrarListaRefaccionesEditar === 'function') {
        window.mostrarListaRefaccionesEditar(indiceNum);
      } else {
        console.error('mostrarListaRefaccionesEditar no está disponible');
      }
    },

    // Funciones para el input económico principal
    filtrarEconomicosMantenimiento: function (event) {
      if (event) {
        event.preventDefault();
      }
      const input = event ? event.target : null;
      const busqueda = input ? input.value : '';
      if (typeof window.filtrarEconomicosMantenimiento === 'function') {
        window.filtrarEconomicosMantenimiento(busqueda);
      } else {
        console.error('filtrarEconomicosMantenimiento no está disponible');
      }
    },

    mostrarDropdownEconomicosMantenimiento: function (event) {
      if (event) {
        event.preventDefault();
      }
      if (typeof window.mostrarDropdownEconomicosMantenimiento === 'function') {
        window.mostrarDropdownEconomicosMantenimiento();
      } else {
        console.error('mostrarDropdownEconomicosMantenimiento no está disponible');
      }
    },

    // Exportación
    exportarMantenimientoExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarMantenimientoExcel === 'function') {
        window.exportarMantenimientoExcel();
      } else {
        console.error('exportarMantenimientoExcel no está disponible');
      }
    },

    // Filtros
    aplicarFiltrosMantenimiento: function (event) {
      // Permitir que funcione tanto para click como para change/keyup
      if (event) {
        event.preventDefault();
      }
      if (typeof window.aplicarFiltrosMantenimiento === 'function') {
        window.aplicarFiltrosMantenimiento();
      } else {
        console.error('aplicarFiltrosMantenimiento no está disponible');
      }
    },

    limpiarFiltrosMantenimiento: function (event) {
      event.preventDefault();
      if (typeof window.limpiarFiltrosMantenimiento === 'function') {
        window.limpiarFiltrosMantenimiento();
      } else {
        console.error('limpiarFiltrosMantenimiento no está disponible');
      }
    },

    // Refacciones
    filtrarRefacciones: function (event) {
      // Permitir que funcione tanto para click como para keyup
      if (event) {
        event.preventDefault();
      }
      const input = event ? event.target : null;
      const indice = input ? input.id.match(/\d+/)?.[0] || '1' : '1';
      if (typeof window.filtrarRefacciones === 'function') {
        window.filtrarRefacciones(parseInt(indice, 10));
      } else {
        console.error('filtrarRefacciones no está disponible');
      }
    },

    validarCantidadRefaccion: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      const input = event ? event.target : null;
      const indice = input ? input.id.match(/\d+/)?.[0] || '1' : '1';
      if (typeof window.validarCantidadRefaccion === 'function') {
        window.validarCantidadRefaccion(parseInt(indice, 10));
      } else {
        console.error('validarCantidadRefaccion no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de mantenimiento
   */
  function initMantenimientoEventHandlers() {
    console.log('🔧 Inicializando event handlers de mantenimiento...');

    // Registrar todas las acciones en el sistema global
    Object.keys(mantenimientoActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, mantenimientoActions[action]);
      }
    });

    // Agregar listeners a elementos con data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (mantenimientoActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          // Determinar el tipo de evento según el tipo de elemento
          const tagName = element.tagName.toLowerCase();
          const inputType = element.type ? element.type.toLowerCase() : '';

          // Para inputs, selects y textareas usar 'change', para botones usar 'click'
          // Para inputs de tipo text usar 'input' y 'keyup' para mejor compatibilidad
          if (tagName === 'input' && inputType === 'text') {
            // Para inputs de texto, usar input y keyup para mejor compatibilidad
            element.addEventListener('input', mantenimientoActions[action]);
            element.addEventListener('keyup', mantenimientoActions[action]);
          } else if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
            element.addEventListener('change', mantenimientoActions[action]);
          } else {
            element.addEventListener('click', mantenimientoActions[action]);
          }

          element.setAttribute('data-handler-attached', 'true');
          const eventType =
            tagName === 'input' && inputType === 'text'
              ? 'input/keyup'
              : tagName === 'input' || tagName === 'select' || tagName === 'textarea'
                ? 'change'
                : 'click';
          console.log(`✅ Handler de mantenimiento registrado: ${action} (${eventType})`);
        }
      }
    });

    // Configurar listeners adicionales para el modal cuando esté disponible
    setTimeout(() => {
      if (mantenimientoActions.setupEconomicoModalListeners) {
        mantenimientoActions.setupEconomicoModalListeners();
      }
    }, 500);

    console.log('✅ Event handlers de mantenimiento inicializados');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMantenimientoEventHandlers);
  } else {
    initMantenimientoEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initMantenimientoEventHandlers, 200);

  console.log('✅ Módulo de event handlers de mantenimiento cargado');
})();
