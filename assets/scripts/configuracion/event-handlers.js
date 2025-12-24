/**
 * Event Handlers Específicos para Configuración
 * Maneja todos los eventos de la página configuracion.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de configuración
  const isConfiguracionPage = window.location.pathname.includes('configuracion.html');
  if (!isConfiguracionPage) {
    return; // No ejecutar si no estamos en configuración
  }

  /**
   * Mapa de acciones específicas de configuración
   */
  const configuracionActions = {
    // Limpieza de datos
    limpiarDatosConfiguracion: function (event) {
      event.preventDefault();
      if (typeof window.limpiarTodosLosDatosConfiguracion === 'function') {
        if (
          confirm(
            '¿Estás seguro de que deseas limpiar todos los datos de configuración? Esta acción no se puede deshacer.'
          )
        ) {
          window.limpiarTodosLosDatosConfiguracion();
        }
      } else {
        console.error('limpiarTodosLosDatosConfiguracion no está disponible');
      }
    },

    limpiarDatosOperativos: function (event) {
      event.preventDefault();
      if (typeof window.limpiarTodosLosDatosOperativos === 'function') {
        if (
          confirm(
            '¿Estás seguro de que deseas limpiar todos los datos operativos? Esta acción no se puede deshacer.'
          )
        ) {
          window.limpiarTodosLosDatosOperativos();
        }
      } else {
        console.error('limpiarTodosLosDatosOperativos no está disponible');
      }
    },

    eliminarRegistrosEspecificos: function (event) {
      event.preventDefault();
      if (typeof window.eliminarRegistrosEspecificos === 'function') {
        window.eliminarRegistrosEspecificos();
      } else {
        console.error('eliminarRegistrosEspecificos no está disponible');
      }
    },

    // Económicos
    saveEconomico: function (event) {
      event.preventDefault();
      if (typeof window.saveEconomico === 'function') {
        window.saveEconomico();
      }
    },

    exportEconomicos: function (event) {
      event.preventDefault();
      if (typeof window.exportEconomicos === 'function') {
        window.exportEconomicos();
      }
    },

    // Operadores
    clearOperadorForm: function (event) {
      event.preventDefault();
      if (typeof window.clearOperadorForm === 'function') {
        window.clearOperadorForm();
      }
    },

    searchOperador: function (event) {
      event.preventDefault();
      if (typeof window.searchOperador === 'function') {
        window.searchOperador();
      }
    },

    updateOperador: function (event) {
      event.preventDefault();
      if (typeof window.updateOperador === 'function') {
        window.updateOperador();
      }
    },

    saveOperador: function (event) {
      event.preventDefault();
      if (typeof window.saveOperador === 'function') {
        window.saveOperador();
      }
    },

    loadOperadoresList: function (event) {
      event.preventDefault();
      if (typeof window.loadOperadoresList === 'function') {
        window.loadOperadoresList();
      }
    },

    exportOperadores: function (event) {
      event.preventDefault();
      if (typeof window.exportOperadores === 'function') {
        window.exportOperadores();
      }
    },

    showOperadoresStats: function (event) {
      event.preventDefault();
      if (typeof window.showOperadoresStats === 'function') {
        window.showOperadoresStats();
      }
    },

    limpiarTodosOperadores: function (event) {
      event.preventDefault();
      if (typeof window.limpiarTodosOperadores === 'function') {
        if (confirm('¿Estás seguro de que deseas eliminar todos los operadores?')) {
          window.limpiarTodosOperadores();
        }
      }
    },

    showDeleteOperadorModal: function (event) {
      event.preventDefault();
      if (typeof window.showDeleteOperadorModal === 'function') {
        window.showDeleteOperadorModal();
      }
    },

    // Clientes
    clearClienteForm: function (event) {
      event.preventDefault();
      if (typeof window.clearClienteForm === 'function') {
        window.clearClienteForm();
      }
    },

    searchCliente: function (event) {
      event.preventDefault();
      if (typeof window.searchCliente === 'function') {
        window.searchCliente();
      }
    },

    updateCliente: function (event) {
      event.preventDefault();
      if (typeof window.updateCliente === 'function') {
        window.updateCliente();
      }
    },

    saveCliente: function (event) {
      event.preventDefault();
      if (typeof window.saveCliente === 'function') {
        window.saveCliente();
      }
    },

    loadClientes: function (event) {
      event.preventDefault();
      if (typeof window.loadClientes === 'function') {
        window.loadClientes();
      }
    },

    exportClientes: function (event) {
      event.preventDefault();
      if (typeof window.exportClientes === 'function') {
        window.exportClientes();
      }
    },

    limpiarTodosClientes: function (event) {
      event.preventDefault();
      if (typeof window.limpiarTodosClientes === 'function') {
        if (confirm('¿Estás seguro de que deseas eliminar todos los clientes?')) {
          window.limpiarTodosClientes();
        }
      }
    },

    showDeleteClienteModal: function (event) {
      event.preventDefault();
      if (typeof window.showDeleteClienteModal === 'function') {
        window.showDeleteClienteModal();
      }
    },

    // Proveedores
    limpiarFormularioProveedor: function (event) {
      event.preventDefault();
      if (typeof window.limpiarFormularioProveedor === 'function') {
        window.limpiarFormularioProveedor();
      }
    },

    loadProveedores: function (event) {
      event.preventDefault();
      if (typeof window.loadProveedores === 'function') {
        window.loadProveedores();
      }
    },

    exportProveedores: function (event) {
      event.preventDefault();
      if (typeof window.exportProveedores === 'function') {
        window.exportProveedores();
      }
    },

    showProveedoresStats: function (event) {
      event.preventDefault();
      if (typeof window.showProveedoresStats === 'function') {
        window.showProveedoresStats();
      }
    },

    limpiarTodosProveedores: function (event) {
      event.preventDefault();
      if (typeof window.limpiarTodosProveedores === 'function') {
        if (confirm('¿Estás seguro de que deseas eliminar todos los proveedores?')) {
          window.limpiarTodosProveedores();
        }
      }
    },

    limpiarFiltrosProveedores: function (event) {
      event.preventDefault();
      if (typeof window.limpiarFiltrosProveedores === 'function') {
        window.limpiarFiltrosProveedores();
      }
    },

    // Usuarios
    toggleUsuarioPassword: function (event) {
      event.preventDefault();
      if (typeof window.toggleUsuarioPassword === 'function') {
        window.toggleUsuarioPassword();
      }
    },

    toggleUsuarioConfirmPassword: function (event) {
      event.preventDefault();
      if (typeof window.toggleUsuarioConfirmPassword === 'function') {
        window.toggleUsuarioConfirmPassword();
      }
    },

    selectAllPermisos: function (event) {
      event.preventDefault();
      if (typeof window.selectAllPermisos === 'function') {
        window.selectAllPermisos();
      }
    },

    togglePasswordVisibility: function (event) {
      event.preventDefault();
      const button = event.target.closest('button') || event.target;
      const fieldId = button.getAttribute('data-field-id');
      if (fieldId && typeof window.togglePasswordVisibility === 'function') {
        window.togglePasswordVisibility(fieldId);
      } else {
        console.warn('⚠️ No se encontró data-field-id para togglePasswordVisibility');
      }
    },

    clearUsuarioForm: function (event) {
      event.preventDefault();
      if (typeof window.clearUsuarioForm === 'function') {
        window.clearUsuarioForm();
      }
    },

    saveUsuario: function (event) {
      event.preventDefault();
      if (typeof window.saveUsuario === 'function') {
        window.saveUsuario();
      }
    },

    loadUsuariosTable: function (event) {
      event.preventDefault();
      if (typeof window.loadUsuariosTable === 'function') {
        window.loadUsuariosTable();
      }
    },

    exportUsuarios: function (event) {
      event.preventDefault();
      if (typeof window.exportUsuarios === 'function') {
        window.exportUsuarios();
      }
    },

    // Cuentas Bancarias
    clearCuentaBancariaForm: function (event) {
      event.preventDefault();
      if (typeof window.clearCuentaBancariaForm === 'function') {
        window.clearCuentaBancariaForm();
      }
    },

    saveCuentaBancaria: function (event) {
      event.preventDefault();
      if (typeof window.saveCuentaBancaria === 'function') {
        window.saveCuentaBancaria();
      }
    },

    loadCuentasBancariasTable: async function (event) {
      event.preventDefault();
      // Intentar usar la función de Firebase primero, luego fallback
      if (typeof window.loadCuentasBancariasTableFirebase === 'function') {
        await window.loadCuentasBancariasTableFirebase();
      } else if (typeof window.loadCuentasBancariasTable === 'function') {
        await window.loadCuentasBancariasTable();
      }
    },

    exportCuentasBancarias: function (event) {
      event.preventDefault();
      if (typeof window.exportCuentasBancarias === 'function') {
        window.exportCuentasBancarias();
      }
    },

    limpiarTodasCuentasBancarias: function (event) {
      event.preventDefault();
      if (typeof window.limpiarTodasCuentasBancarias === 'function') {
        if (confirm('¿Estás seguro de que deseas eliminar todas las cuentas bancarias?')) {
          window.limpiarTodasCuentasBancarias();
        }
      }
    },

    // Estancias
    clearEstanciaForm: function (event) {
      event.preventDefault();
      if (typeof window.clearEstanciaForm === 'function') {
        window.clearEstanciaForm();
      }
    },

    saveEstancia: function (event) {
      event.preventDefault();
      if (typeof window.saveEstancia === 'function') {
        window.saveEstancia();
      }
    },

    loadEstanciasTable: function (event) {
      event.preventDefault();
      if (typeof window.loadEstanciasTable === 'function') {
        window.loadEstanciasTable();
      }
    },

    exportEstancias: function (event) {
      event.preventDefault();
      if (typeof window.exportEstancias === 'function') {
        window.exportEstancias();
      }
    },

    limpiarTodasEstancias: function (event) {
      event.preventDefault();
      if (typeof window.limpiarTodasEstancias === 'function') {
        if (confirm('¿Estás seguro de que deseas eliminar todas las estancias?')) {
          window.limpiarTodasEstancias();
        }
      }
    },

    // Almacenes
    clearAlmacenForm: function (event) {
      event.preventDefault();
      if (typeof window.clearAlmacenForm === 'function') {
        window.clearAlmacenForm();
      }
    },

    saveAlmacen: function (event) {
      event.preventDefault();
      if (typeof window.saveAlmacen === 'function') {
        window.saveAlmacen();
      }
    },

    loadAlmacenesTable: function (event) {
      event.preventDefault();
      if (typeof window.loadAlmacenesTable === 'function') {
        window.loadAlmacenesTable();
      }
    },

    exportAlmacenes: function (event) {
      event.preventDefault();
      if (typeof window.exportAlmacenes === 'function') {
        window.exportAlmacenes();
      }
    },

    limpiarTodosAlmacenes: function (event) {
      event.preventDefault();
      if (typeof window.limpiarTodosAlmacenes === 'function') {
        if (confirm('¿Estás seguro de que deseas eliminar todos los almacenes?')) {
          window.limpiarTodosAlmacenes();
        }
      }
    },

    // Modales de confirmación
    confirmDeleteEconomico: function (event) {
      event.preventDefault();
      if (typeof window.confirmDeleteEconomicoFromModal === 'function') {
        window.confirmDeleteEconomicoFromModal();
      }
    },

    confirmDeleteOperador: function (event) {
      event.preventDefault();
      if (typeof window.confirmDeleteOperadorFromModal === 'function') {
        window.confirmDeleteOperadorFromModal();
      }
    },

    confirmDeleteCliente: function (event) {
      event.preventDefault();
      if (typeof window.confirmDeleteClienteFromModal === 'function') {
        window.confirmDeleteClienteFromModal();
      }
    },

    // Edición
    saveEditedEconomico: function (event) {
      event.preventDefault();
      if (typeof window.saveEditedEconomico === 'function') {
        window.saveEditedEconomico();
      }
    },

    saveEditedOperador: function (event) {
      event.preventDefault();
      if (typeof window.saveEditedOperador === 'function') {
        window.saveEditedOperador();
      }
    },

    saveEditedCliente: function (event) {
      event.preventDefault();
      if (typeof window.saveEditedCliente === 'function') {
        window.saveEditedCliente();
      }
    },

    saveEditedProveedor: function (event) {
      event.preventDefault();
      if (typeof window.saveEditedProveedor === 'function') {
        window.saveEditedProveedor();
      }
    },

    saveEditedEstancia: function (event) {
      event.preventDefault();
      if (typeof window.saveEditedEstancia === 'function') {
        window.saveEditedEstancia();
      }
    },

    saveEditedAlmacen: function (event) {
      event.preventDefault();
      if (typeof window.saveEditedAlmacen === 'function') {
        window.saveEditedAlmacen();
      }
    },

    saveEditedCuentaBancaria: function (event) {
      event.preventDefault();
      if (typeof window.saveEditedCuentaBancaria === 'function') {
        window.saveEditedCuentaBancaria();
      }
    },

    saveEditedUsuario: function (event) {
      event.preventDefault();
      if (typeof window.saveEditedUsuario === 'function') {
        window.saveEditedUsuario();
      }
    },
    // Filtros
    filterEconomicos: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.filterEconomicos === 'function') {
        window.filterEconomicos();
      } else {
        console.error('filterEconomicos no está disponible');
      }
    },

    filterOperadores: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.filterOperadores === 'function') {
        window.filterOperadores();
      } else {
        console.error('filterOperadores no está disponible');
      }
    },

    filterClientes: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.filterClientes === 'function') {
        window.filterClientes();
      } else {
        console.error('filterClientes no está disponible');
      }
    },

    filterProveedores: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.filterProveedores === 'function') {
        window.filterProveedores();
      } else {
        console.error('filterProveedores no está disponible');
      }
    },

    filterCuentasBancarias: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.filterCuentasBancarias === 'function') {
        window.filterCuentasBancarias();
      } else {
        console.error('filterCuentasBancarias no está disponible');
      }
    },

    filterUsuarios: function (event) {
      // Permitir que funcione tanto para click como para change/keyup
      if (event) {
        event.preventDefault();
      }
      if (typeof window.filterUsuarios === 'function') {
        window.filterUsuarios();
      } else {
        console.error('filterUsuarios no está disponible');
      }
    },

    filterEstancias: function (event) {
      // Permitir que funcione tanto para click como para change/keyup
      if (event) {
        event.preventDefault();
      }
      if (typeof window.filterEstancias === 'function') {
        window.filterEstancias();
      } else {
        console.error('filterEstancias no está disponible');
      }
    },

    filterAlmacenes: function (event) {
      // Permitir que funcione tanto para click como para change/keyup
      if (event) {
        event.preventDefault();
      }
      if (typeof window.filterAlmacenes === 'function') {
        window.filterAlmacenes();
      } else {
        console.error('filterAlmacenes no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de configuración
   */
  function initConfiguracionEventHandlers() {
    // console.log('🔧 Inicializando event handlers de configuración...');

    // Registrar todas las acciones en el sistema global
    Object.keys(configuracionActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, configuracionActions[action]);
      }
    });

    // Agregar listeners a elementos con data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (configuracionActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          // Determinar el tipo de evento según el tipo de elemento
          const tagName = element.tagName.toLowerCase();
          const inputType = element.type ? element.type.toLowerCase() : '';

          // Para inputs, selects y textareas usar 'change', para botones usar 'click'
          // Para inputs de tipo text usar 'keyup' si es necesario
          if (tagName === 'input' && inputType === 'text') {
            // Para inputs de texto, usar keyup
            element.addEventListener('keyup', configuracionActions[action]);
          } else if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
            element.addEventListener('change', configuracionActions[action]);
          } else {
            element.addEventListener('click', configuracionActions[action]);
          }

          element.setAttribute('data-handler-attached', 'true');
          const _eventType =
            tagName === 'input' && inputType === 'text'
              ? 'keyup'
              : tagName === 'input' || tagName === 'select' || tagName === 'textarea'
                ? 'change'
                : 'click';
          // console.log(`✅ Handler de configuración registrado: ${action} (${_eventType})`);
        }
      }
    });

    // console.log('✅ Event handlers de configuración inicializados');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfiguracionEventHandlers);
  } else {
    initConfiguracionEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initConfiguracionEventHandlers, 200);

  // console.log('✅ Módulo de event handlers de configuración cargado');
})();
