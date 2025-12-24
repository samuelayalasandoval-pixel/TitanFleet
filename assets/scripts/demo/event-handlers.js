/**
 * Event Handlers Específicos para Demo
 * Maneja todos los eventos de la página demo.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de demo
  const isDemoPage = window.location.pathname.includes('demo.html');
  if (!isDemoPage) {
    return; // No ejecutar si no estamos en demo
  }

  /**
   * Mapa de acciones específicas de demo
   */
  const demoActions = {
    startDemo: function (event) {
      event.preventDefault();
      if (typeof window.startDemo === 'function') {
        window.startDemo();
      } else {
        console.error('startDemo no está disponible');
      }
    },

    scrollToFeatures: function (event) {
      event.preventDefault();
      if (typeof window.scrollToFeatures === 'function') {
        window.scrollToFeatures();
      } else {
        // Fallback: scroll suave a la sección de características
        const featuresSection =
          document.getElementById('features') || document.querySelector('.features-section');
        if (featuresSection) {
          featuresSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    },

    verificarAvisoYIniciarDemo: function (event) {
      event.preventDefault();
      if (typeof window.verificarAvisoYIniciarDemo === 'function') {
        window.verificarAvisoYIniciarDemo();
      } else {
        console.error('verificarAvisoYIniciarDemo no está disponible');
      }
    },

    rechazarAvisoPrivacidad: function (event) {
      event.preventDefault();
      if (typeof window.rechazarAvisoPrivacidad === 'function') {
        window.rechazarAvisoPrivacidad();
      } else {
        console.error('rechazarAvisoPrivacidad no está disponible');
      }
    },

    aceptarAvisoPrivacidad: function (event) {
      event.preventDefault();
      if (typeof window.aceptarAvisoPrivacidad === 'function') {
        window.aceptarAvisoPrivacidad();
      } else {
        console.error('aceptarAvisoPrivacidad no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de demo
   */
  function initDemoEventHandlers() {
    console.log('🔧 Inicializando event handlers de demo...');

    // Registrar todas las acciones en el sistema global
    Object.keys(demoActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        window.registerGlobalAction(action, demoActions[action]);
      }
    });

    // Agregar listeners a elementos con data-action
    document.querySelectorAll('[data-action]').forEach(element => {
      const action = element.getAttribute('data-action');

      if (demoActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          element.addEventListener('click', demoActions[action]);
          element.setAttribute('data-handler-attached', 'true');
          console.log(`✅ Handler de demo registrado: ${action}`);
        }
      }
    });

    console.log('✅ Event handlers de demo inicializados');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDemoEventHandlers);
  } else {
    initDemoEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initDemoEventHandlers, 200);

  console.log('✅ Módulo de event handlers de demo cargado');
})();
