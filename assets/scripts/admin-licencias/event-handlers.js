/**
 * Event Handlers Específicos para Admin Licencias
 * Maneja todos los eventos de la página admin-licencias.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de admin-licencias
  const isAdminLicenciasPage = window.location.pathname.includes('admin-licencias.html');
  if (!isAdminLicenciasPage) {
    return; // No ejecutar si no estamos en admin-licencias
  }

  /**
   * Mapa de acciones específicas de admin-licencias
   */
  const adminLicenciasActions = {
    generateLicenses: function (event) {
      event.preventDefault();
      if (typeof window.generateLicenses === 'function') {
        window.generateLicenses();
      } else {
        console.error('generateLicenses no está disponible');
      }
    },

    exportLicenses: function (event) {
      event.preventDefault();
      if (typeof window.exportLicenses === 'function') {
        window.exportLicenses();
      } else {
        console.error('exportLicenses no está disponible');
      }
    },

    loadLicenses: function (event) {
      event.preventDefault();
      if (typeof window.loadLicenses === 'function') {
        window.loadLicenses();
      } else {
        console.error('loadLicenses no está disponible');
      }
    },

    copyLicenseKey: function (event) {
      event.preventDefault();
      if (typeof window.copyLicenseKey === 'function') {
        window.copyLicenseKey();
      } else {
        console.error('copyLicenseKey no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de admin-licencias
   */
  function initAdminLicenciasEventHandlers() {
    console.log('🔧 Inicializando event handlers de admin-licencias...');

    // Registrar todas las acciones en el sistema global
    Object.keys(adminLicenciasActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, adminLicenciasActions[action]);
      }
    });

    // Agregar listeners a elementos con data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (adminLicenciasActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          element.addEventListener('click', adminLicenciasActions[action]);
          element.setAttribute('data-handler-attached', 'true');
          console.log(`✅ Handler de admin-licencias registrado: ${action}`);
        }
      }
    });

    console.log('✅ Event handlers de admin-licencias inicializados');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminLicenciasEventHandlers);
  } else {
    initAdminLicenciasEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initAdminLicenciasEventHandlers, 200);

  console.log('✅ Módulo de event handlers de admin-licencias cargado');
})();
