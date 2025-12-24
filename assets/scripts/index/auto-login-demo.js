/**
 * Auto-login para Demo - index.html
 * Maneja el login automático cuando hay licencia demo activa
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
   * Verificar y hacer auto-login en modo demo
   */
  async function checkAndAutoLoginDemo() {
    try {
      // Verificar PRIMERO si el usuario cerró sesión explícitamente
      if (wasExplicitLogout()) {
        console.log('🚫 Usuario cerró sesión explícitamente, NO se hará auto-login');
        return;
      }

      // Verificar si hay una licencia demo activa (cliente demo normal)
      const licenseStr = localStorage.getItem('titanfleet_license');
      if (!licenseStr || !window.DEMO_CONFIG) {
        return;
      }

      const licenseData = JSON.parse(licenseStr);
      const isDemo =
        licenseData.licenseKey === window.DEMO_CONFIG.licenseKey ||
        licenseData.tenantId === window.DEMO_CONFIG.tenantId;

      if (!isDemo) {
        return;
      }

      // Verificar si ya hay una sesión activa
      const session = localStorage.getItem('erpSession');
      const currentUser = localStorage.getItem('erpCurrentUser');

      if (session && currentUser) {
        try {
          const userData = JSON.parse(currentUser);
          // Si ya hay sesión y el usuario es el demo, redirigir directamente
          if (userData.email === window.DEMO_CONFIG.email) {
            console.log('✅ Sesión demo activa, redirigiendo...');
            setTimeout(() => {
              window.location.href = 'pages/menu.html';
            }, 1000);
            return;
          }
        } catch (e) {
          // Continuar con auto-login
        }
      }

      // Esperar a que Firebase esté listo
      let attempts = 0;
      while (!window.firebaseSignIn && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }

      // Verificar NUEVAMENTE antes de hacer login
      if (wasExplicitLogout()) {
        console.log('🚫 Usuario cerró sesión explícitamente, CANCELANDO auto-login');
        return;
      }

      // Esperar unos segundos antes de hacer auto-login
      console.log('🔄 Modo demo detectado, iniciando sesión automática en 3 segundos...');
      setTimeout(async () => {
        // Verificar UNA VEZ MÁS antes de hacer login
        if (wasExplicitLogout()) {
          console.log('🚫 Usuario cerró sesión explícitamente, CANCELANDO auto-login');
          return;
        }

        try {
          if (!window.DEMO_CONFIG) {
            console.error('❌ DEMO_CONFIG no está disponible');
            return;
          }

          const demoEmail = window.DEMO_CONFIG.email;
          const demoPassword = window.DEMO_CONFIG.password;
          const demoTenantId = window.DEMO_CONFIG.tenantId;

          // Usar firebaseSignIn
          if (window.firebaseSignIn) {
            await window.firebaseSignIn(demoEmail, demoPassword, demoTenantId);
            console.log('✅ Auto-login demo exitoso');
            window.location.href = 'menu.html';
          }
        } catch (error) {
          console.error('❌ Error en auto-login demo:', error);
          // No hacer nada, dejar que el usuario inicie sesión manualmente
        }
      }, 3000); // Esperar 3 segundos
    } catch (error) {
      console.error('Error verificando modo demo:', error);
    }
  }

  /**
   * Inicializar auto-login cuando el DOM esté listo
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', async () => {
        // Verificar SIEMPRE primero si se cerró sesión explícitamente
        if (wasExplicitLogout()) {
          console.log('🚫 Sesión cerrada explícitamente, NO se hará auto-login');
          return;
        }

        // Solo si NO se cerró sesión explícitamente, hacer auto-login
        console.log('✅ No hay logout explícito, procediendo con auto-login demo...');
        await checkAndAutoLoginDemo();
      });
    } else {
      // DOM ya está listo
      if (!wasExplicitLogout()) {
        checkAndAutoLoginDemo();
      }
    }
  }

  init();
})();
