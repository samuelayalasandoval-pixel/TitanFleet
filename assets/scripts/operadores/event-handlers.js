/**
 * Event Handlers Específicos para Operadores
 * Maneja todos los eventos de la página operadores.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de operadores
  const isOperadoresPage = window.location.pathname.includes('operadores.html');
  if (!isOperadoresPage) {
    return; // No ejecutar si no estamos en operadores
  }

  /**
   * Mapa de acciones específicas de operadores
   */
  const operadoresActions = {
    // Desplegar listas - Gastos
    desplegarListaOperadoresOperadores: function (event) {
      event.preventDefault();
      if (typeof window.desplegarListaOperadoresOperadores === 'function') {
        window.desplegarListaOperadoresOperadores();
      } else {
        console.warn('desplegarListaOperadoresOperadores no está disponible aún');
      }
    },

    desplegarListaTractocamionesOperadores: function (event) {
      event.preventDefault();
      if (typeof window.desplegarListaTractocamionesOperadores === 'function') {
        window.desplegarListaTractocamionesOperadores();
      } else {
        console.error('desplegarListaTractocamionesOperadores no está disponible');
      }
    },

    // Desplegar listas - Incidencias
    desplegarListaOperadoresIncidencia: function (event) {
      event.preventDefault();
      if (typeof window.desplegarListaOperadoresIncidencia === 'function') {
        window.desplegarListaOperadoresIncidencia();
      } else {
        console.warn('desplegarListaOperadoresIncidencia no está disponible aún');
      }
    },

    desplegarListaTractocamionesIncidencia: function (event) {
      event.preventDefault();
      if (typeof window.desplegarListaTractocamionesIncidencia === 'function') {
        window.desplegarListaTractocamionesIncidencia();
      } else {
        console.warn('desplegarListaTractocamionesIncidencia no está disponible aún');
      }
    },

    // Desplegar listas - Editar Gasto
    desplegarListaOperadoresGastosEditar: function (event) {
      event.preventDefault();
      if (typeof window.desplegarListaOperadoresGastosEditar === 'function') {
        window.desplegarListaOperadoresGastosEditar();
      } else {
        console.error('desplegarListaOperadoresGastosEditar no está disponible');
      }
    },

    desplegarListaTractocamionesGastosEditar: function (event) {
      event.preventDefault();
      if (typeof window.desplegarListaTractocamionesGastosEditar === 'function') {
        window.desplegarListaTractocamionesGastosEditar();
      } else {
        console.error('desplegarListaTractocamionesGastosEditar no está disponible');
      }
    },

    // Formularios
    limpiarFormulario: function (event) {
      event.preventDefault();
      if (typeof window.limpiarFormulario === 'function') {
        if (
          confirm(
            '¿Estás seguro de que deseas limpiar el formulario? Se perderán todos los datos no guardados.'
          )
        ) {
          window.limpiarFormulario();
        }
      } else {
        console.error('limpiarFormulario no está disponible');
      }
    },

    // Exportación
    exportarGastosExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarGastosExcel === 'function') {
        window.exportarGastosExcel();
      } else {
        console.error('exportarGastosExcel no está disponible');
      }
    },

    exportarIncidenciasExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarIncidenciasExcel === 'function') {
        window.exportarIncidenciasExcel();
      } else {
        console.error('exportarIncidenciasExcel no está disponible');
      }
    },

    // Filtros - Gastos
    aplicarFiltrosGastos: function (event) {
      event.preventDefault();
      if (typeof window.aplicarFiltrosGastos === 'function') {
        window.aplicarFiltrosGastos();
      } else {
        console.error('aplicarFiltrosGastos no está disponible');
      }
    },

    limpiarFiltrosGastos: function (event) {
      event.preventDefault();
      if (typeof window.limpiarFiltrosGastos === 'function') {
        window.limpiarFiltrosGastos();
      } else {
        console.error('limpiarFiltrosGastos no está disponible');
      }
    },

    // Filtros - Incidencias
    aplicarFiltrosIncidencias: function (event) {
      event.preventDefault();
      if (typeof window.aplicarFiltrosIncidencias === 'function') {
        window.aplicarFiltrosIncidencias();
      } else {
        console.error('aplicarFiltrosIncidencias no está disponible');
      }
    },

    limpiarFiltrosIncidencias: function (event) {
      event.preventDefault();
      if (typeof window.limpiarFiltrosIncidencias === 'function') {
        window.limpiarFiltrosIncidencias();
      } else {
        console.error('limpiarFiltrosIncidencias no está disponible');
      }
    },

    // Guardar gasto
    guardarGasto: function (event) {
      event.preventDefault();
      event.stopPropagation();
      console.log('💾 [EVENT-HANDLERS] Click en botón guardarGasto detectado');

      const gastosForm = document.getElementById('gastosForm');
      if (!gastosForm) {
        console.error('❌ [EVENT-HANDLERS] Formulario gastosForm no encontrado');
        return;
      }

      // Validar número de registro antes de guardar
      const numeroRegistroInput = document.getElementById('numeroRegistroGasto');
      if (numeroRegistroInput) {
        // Llamar a validarNumeroRegistro si existe
        if (typeof validarNumeroRegistro === 'function') {
          validarNumeroRegistro(numeroRegistroInput, 'numeroRegistroGasto');
        }
        if (!numeroRegistroInput.checkValidity()) {
          console.warn('⚠️ [EVENT-HANDLERS] Número de registro inválido');
          numeroRegistroInput.reportValidity();
          return;
        }
      }

      // Validar formulario completo
      console.log('🔍 [EVENT-HANDLERS] Validando formulario completo...');
      if (!gastosForm.checkValidity()) {
        console.warn('⚠️ [EVENT-HANDLERS] Formulario inválido');
        gastosForm.classList.add('was-validated');
        gastosForm.reportValidity();
        return;
      }

      console.log('✅ [EVENT-HANDLERS] Formulario válido, llamando window.guardarGasto()');

      // Llamar a la función de guardar
      if (typeof window.guardarGasto === 'function') {
        console.log('✅ [EVENT-HANDLERS] window.guardarGasto es una función, ejecutando...');
        window.guardarGasto().catch(error => {
          console.error('❌ [EVENT-HANDLERS] Error al ejecutar guardarGasto:', error);
        });
      } else {
        console.error(
          '❌ [EVENT-HANDLERS] window.guardarGasto no está disponible. Tipo:',
          typeof window.guardarGasto
        );
        if (typeof showNotification === 'function') {
          showNotification('Error: función de guardar no disponible', 'error');
        }
      }
    },

    // Guardar incidencia
    guardarIncidencia: function (event) {
      event.preventDefault();
      event.stopPropagation();
      console.log('💾 [EVENT-HANDLERS] Click en botón guardarIncidencia detectado');

      const incidenciasForm = document.getElementById('incidenciasForm');
      if (!incidenciasForm) {
        console.error('❌ [EVENT-HANDLERS] Formulario incidenciasForm no encontrado');
        return;
      }

      // Validar número de registro antes de guardar
      const numeroRegistroInput = document.getElementById('numeroRegistroIncidencia');
      if (numeroRegistroInput) {
        // Llamar a validarNumeroRegistro si existe
        if (typeof validarNumeroRegistro === 'function') {
          validarNumeroRegistro(numeroRegistroInput, 'numeroRegistroIncidencia');
        }
        if (!numeroRegistroInput.checkValidity()) {
          console.warn('⚠️ [EVENT-HANDLERS] Número de registro inválido');
          numeroRegistroInput.reportValidity();
          return;
        }
      }

      // Validar formulario completo
      console.log('🔍 [EVENT-HANDLERS] Validando formulario de incidencias...');
      if (!incidenciasForm.checkValidity()) {
        console.warn('⚠️ [EVENT-HANDLERS] Formulario de incidencias inválido');
        incidenciasForm.classList.add('was-validated');
        incidenciasForm.reportValidity();
        return;
      }

      console.log(
        '✅ [EVENT-HANDLERS] Formulario de incidencias válido, llamando window.guardarIncidencia()'
      );

      // Llamar a la función de guardar
      if (typeof window.guardarIncidencia === 'function') {
        console.log('✅ [EVENT-HANDLERS] window.guardarIncidencia es una función, ejecutando...');
        window.guardarIncidencia().catch(error => {
          console.error('❌ [EVENT-HANDLERS] Error al ejecutar guardarIncidencia:', error);
        });
      } else {
        console.error(
          '❌ [EVENT-HANDLERS] window.guardarIncidencia no está disponible. Tipo:',
          typeof window.guardarIncidencia
        );
        if (typeof showNotification === 'function') {
          showNotification('Error: función de guardar incidencia no disponible', 'error');
        }
      }
    },

    // Edición
    guardarGastoEditado: function (event) {
      event.preventDefault();
      if (typeof window.guardarGastoEditado === 'function') {
        window.guardarGastoEditado();
      } else {
        console.error('guardarGastoEditado no está disponible');
      }
    },

    guardarIncidenciaEditada: function (event) {
      event.preventDefault();
      if (typeof window.guardarIncidenciaEditada === 'function') {
        window.guardarIncidenciaEditada();
      } else {
        console.error('guardarIncidenciaEditada no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de operadores
   */
  function initOperadoresEventHandlers() {
    console.log('🔧 Inicializando event handlers de operadores...');

    // Registrar todas las acciones en el sistema global
    Object.keys(operadoresActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, operadoresActions[action]);
      }
    });

    // Agregar listeners a elementos con data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (operadoresActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          element.addEventListener('click', operadoresActions[action]);
          element.setAttribute('data-handler-attached', 'true');
          console.log(`✅ Handler de operadores registrado: ${action}`);
        }
      }
    });

    console.log('✅ Event handlers de operadores inicializados');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOperadoresEventHandlers);
  } else {
    initOperadoresEventHandlers();
  }

  // También inicializar después de múltiples delays para asegurar que otros scripts se hayan cargado
  setTimeout(initOperadoresEventHandlers, 200);
  setTimeout(initOperadoresEventHandlers, 500);
  setTimeout(initOperadoresEventHandlers, 1000);

  // Re-inicializar cuando la ventana esté completamente cargada
  window.addEventListener('load', () => {
    setTimeout(initOperadoresEventHandlers, 100);
  });

  // Re-inicializar cuando operadores.js esté listo (si existe una señal)
  const checkOperadoresReady = setInterval(() => {
    if (
      typeof window.guardarGasto === 'function' &&
      typeof window.guardarIncidencia === 'function'
    ) {
      console.log('✅ Funciones de operadores disponibles, re-inicializando event handlers...');
      initOperadoresEventHandlers();
      clearInterval(checkOperadoresReady);
    }
  }, 500);

  // Limpiar el intervalo después de 10 segundos para evitar ejecución infinita
  setTimeout(() => {
    clearInterval(checkOperadoresReady);
  }, 10000);

  console.log('✅ Módulo de event handlers de operadores cargado');
})();
