/**
 * Inicialización de pestañas de configuración
 * Asegura que las pestañas sean visibles y funcionales
 */

(function () {
  'use strict';

  /**
   * Inicializar las pestañas de configuración
   */
  function initTabs() {
    const navTabs = document.getElementById('configTabs');
    if (!navTabs) {
      console.error('❌ No se encontró el elemento configTabs');
      return false;
    }

    // Obtener estilos computados para diagnóstico (solo en desarrollo)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const computedStyle = window.getComputedStyle(navTabs);
      console.log('🔍 Estilos computados de configTabs:', {
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        height: computedStyle.height,
        width: computedStyle.width
      });
    }

    // Asegurar que las pestañas sean visibles con !important usando setProperty
    navTabs.style.setProperty('display', 'flex', 'important');
    navTabs.style.setProperty('visibility', 'visible', 'important');
    navTabs.style.setProperty('opacity', '1', 'important');
    navTabs.style.setProperty('height', 'auto', 'important');
    navTabs.style.setProperty('overflow', 'visible', 'important');
    navTabs.style.setProperty('position', 'relative', 'important');
    navTabs.style.setProperty('z-index', '1', 'important');
    navTabs.style.setProperty('margin-top', '20px', 'important');
    navTabs.style.setProperty('margin-bottom', '0', 'important');

    // Asegurar que todos los elementos nav-item dentro sean visibles
    const navItems = navTabs.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.style.setProperty('display', 'list-item', 'important');
      item.style.setProperty('visibility', 'visible', 'important');
      item.style.setProperty('opacity', '1', 'important');
      item.style.setProperty('height', 'auto', 'important');
      item.style.setProperty('overflow', 'visible', 'important');

      // También asegurar que los botones dentro sean visibles
      const navLink = item.querySelector('.nav-link');
      if (navLink) {
        navLink.style.setProperty('display', 'block', 'important');
        navLink.style.setProperty('visibility', 'visible', 'important');
        navLink.style.setProperty('opacity', '1', 'important');
      }
    });

    // Verificar que el elemento sea visible después de aplicar estilos (solo en desarrollo)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const finalComputedStyle = window.getComputedStyle(navTabs);
      console.log('🔍 Estilos finales de configTabs:', {
        display: finalComputedStyle.display,
        visibility: finalComputedStyle.visibility,
        opacity: finalComputedStyle.opacity
      });
      console.log(`✅ ${navItems.length} pestañas encontradas y visibles`);
    }

    // Inicializar la primera pestaña si Bootstrap está disponible
    if (typeof bootstrap !== 'undefined' && bootstrap.Tab) {
      const firstTab = document.getElementById('economicos-tab');
      if (firstTab) {
        // Bootstrap Tab ya está inicializado por los atributos data-bs-toggle
        // No necesitamos crear una nueva instancia
        return true;
      }
    }

    return true;
  }

  /**
   * Verificar que Bootstrap esté cargado
   */
  function checkBootstrap() {
    if (typeof bootstrap === 'undefined') {
      console.error('❌ Bootstrap no se cargó correctamente');
      return false;
    }
    return true;
  }

  /**
   * Inicializar cuando el DOM esté listo
   */
  function initialize() {
    if (!checkBootstrap()) {
      return;
    }

    // Intentar inicializar inmediatamente si el DOM ya está listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initTabs();
      });
    } else {
      initTabs();
    }

    // También intentar después de pequeños delays por si acaso
    setTimeout(initTabs, 100);
    setTimeout(initTabs, 500);
    setTimeout(initTabs, 1000);
  }

  // Inicializar
  initialize();

  // Exponer función globalmente para uso manual si es necesario
  window.initConfigTabs = initTabs;
})();
