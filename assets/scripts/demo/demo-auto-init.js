/**
 * Auto-inicialización de Demo - demo.html
 * Maneja la inicialización automática cuando se carga la página
 */

(function () {
  'use strict';

  /**
   * Verificar si se cerró sesión explícitamente
   */
  function wasExplicitLogout() {
    const explicitLogout = sessionStorage.getItem('explicitLogout');
    const sessionClosed = localStorage.getItem('sessionClosedExplicitly');
    return explicitLogout === 'true' || sessionClosed === 'true';
  }

  /**
   * Verificar si hay sesión demo activa
   */
  function hasActiveDemoSession() {
    const session = localStorage.getItem('erpSession');
    const currentUser = localStorage.getItem('erpCurrentUser');

    if (session && currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        return userData.email === 'demo@titanfleet.com';
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  /**
   * Verificar si hay licencia demo
   */
  function hasDemoLicense() {
    const licenseStr = localStorage.getItem('titanfleet_license');
    if (!licenseStr) {
      return false;
    }

    try {
      const licenseData = JSON.parse(licenseStr);
      const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
      return (
        licenseData.licenseKey === 'TITAN-DEMO-0000-0000' ||
        licenseData.type === 'demo' ||
        licenseData.tenantId === demoTenantId
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Inicializar demo automáticamente
   */
  function initAutoDemo() {
    // Verificar si ya aceptó el aviso de privacidad
    if (typeof window.hasAcceptedPrivacy !== 'function' || !window.hasAcceptedPrivacy()) {
      // El modal de privacidad ya lo maneja privacy-handler.js
      return; // No continuar hasta que acepte
    }

    // Verificar SIEMPRE primero si se cerró sesión explícitamente
    if (wasExplicitLogout()) {
      console.log('🚫 Sesión cerrada explícitamente, NO se iniciará demo automáticamente');
      return; // NO iniciar demo automáticamente
    }

    // Verificar si ya hay una sesión activa
    // NO redirigir automáticamente - permitir que el usuario vea la página demo
    // La redirección solo ocurrirá cuando el usuario haga clic en "Iniciar Demo"
    if (hasActiveDemoSession()) {
      console.log('✅ Sesión demo ya activa, pero permitiendo que el usuario vea la página demo');
      // NO redirigir automáticamente - el usuario puede hacer clic en el botón si quiere
      return;
    }

    // NO iniciar demo automáticamente - el usuario debe hacer clic en el botón
    // Esto permite que el usuario vea la página demo y decida cuándo iniciar
    if (hasDemoLicense()) {
      console.log('✅ Licencia demo detectada, pero esperando acción del usuario para iniciar');
      // NO iniciar automáticamente - el usuario debe hacer clic en "Iniciar Demo"
      return;
    }
  }

  /**
   * Inicializar cuando el DOM esté listo
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        // Esperar un momento para que otros scripts se carguen
        setTimeout(initAutoDemo, 500);
      });
    } else {
      setTimeout(initAutoDemo, 500);
    }
  }

  init();
})();
