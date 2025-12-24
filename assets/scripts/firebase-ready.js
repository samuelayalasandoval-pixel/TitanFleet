/**
 * Sistema de Garantía de Disponibilidad de Firebase
 * Asegura que Firebase esté completamente inicializado antes de permitir operaciones
 */

(function () {
  'use strict';

  // Estado de Firebase
  let firebaseReady = false;
  let firebaseReadyPromise = null;
  let firebaseReadyResolve = null;

  // Crear promesa que se resolverá cuando Firebase esté listo
  firebaseReadyPromise = new Promise(resolve => {
    firebaseReadyResolve = resolve;
  });

  /**
   * Verificar si Firebase está completamente inicializado
   */
  function isFirebaseReady() {
    const basicReady =
      window.firebaseDb &&
      window.firebaseAuth !== undefined &&
      window.fs &&
      window.fs.doc &&
      window.fs.setDoc &&
      window.fs.getDoc &&
      window.fs.collection &&
      window.fs.getDocs;

    // También verificar que los repositorios estén disponibles (opcional pero recomendado)
    const reposReady =
      window.firebaseRepos && window.firebaseRepos.trafico && window.firebaseRepos.logistica;

    return basicReady && reposReady;
  }

  /**
   * Esperar a que Firebase esté listo
   * @param {number} timeout - Tiempo máximo de espera en milisegundos (default: 30000 = 30 segundos)
   * @returns {Promise<boolean>} - true si Firebase está listo, false si timeout
   */
  window.waitForFirebase = async function (timeout = 30000) {
    // Si ya está listo, retornar inmediatamente
    if (isFirebaseReady() && firebaseReady) {
      return true;
    }

    // Si ya hay una promesa en curso, esperarla
    if (firebaseReadyPromise) {
      try {
        await Promise.race([
          firebaseReadyPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout esperando Firebase')), timeout)
          )
        ]);
        return true;
      } catch (error) {
        console.warn('⚠️ Timeout esperando Firebase:', error);
        return false;
      }
    }

    // Si no hay promesa, esperar activamente
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (isFirebaseReady()) {
        firebaseReady = true;
        if (firebaseReadyResolve) {
          firebaseReadyResolve();
        }
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
  };

  /**
   * Verificar y marcar Firebase como listo
   */
  function checkAndMarkReady() {
    const basicReady =
      window.firebaseDb &&
      window.firebaseAuth !== undefined &&
      window.fs &&
      window.fs.doc &&
      window.fs.setDoc &&
      window.fs.getDoc &&
      window.fs.collection &&
      window.fs.getDocs;

    const reposReady =
      window.firebaseRepos && window.firebaseRepos.trafico && window.firebaseRepos.logistica;

    if (basicReady && !firebaseReady) {
      // Marcar como listo incluso si los repositorios no están disponibles
      // (los repositorios se inicializarán después)
      firebaseReady = true;
      console.log('✅ Firebase completamente inicializado y verificado');
      if (reposReady) {
        console.log('✅ Repositorios Firebase también están disponibles');
      } else {
        console.log('⏳ Repositorios Firebase aún no están disponibles (se inicializarán después)');
      }
      if (firebaseReadyResolve) {
        firebaseReadyResolve();
        firebaseReadyResolve = null; // Evitar múltiples resoluciones
      }
    }
  }

  /**
   * Inicializar el sistema de verificación
   */
  function init() {
    // Verificar inmediatamente si Firebase ya está listo
    if (isFirebaseReady()) {
      firebaseReady = true;
      if (firebaseReadyResolve) {
        firebaseReadyResolve();
        firebaseReadyResolve = null;
      }
      console.log('✅ Firebase ya está disponible al cargar firebase-ready.js');
      return;
    }

    // Esperar al evento firebaseReady si existe
    if (window.firebaseReady) {
      // Firebase puede estar listo pero con un pequeño delay
      setTimeout(checkAndMarkReady, 100);
    } else {
      // Esperar al evento firebaseReady
      window.addEventListener(
        'firebaseReady',
        () => {
          setTimeout(checkAndMarkReady, 100);
        },
        { once: true }
      );
    }

    // Verificar periódicamente (fallback)
    let attempts = 0;
    const maxAttempts = 300; // 30 segundos (300 * 100ms)

    const intervalId = setInterval(() => {
      attempts++;
      checkAndMarkReady();

      if (firebaseReady || attempts >= maxAttempts) {
        clearInterval(intervalId);
        if (!firebaseReady) {
          console.warn('⚠️ Firebase no está disponible después de 30 segundos');
        }
      }
    }, 100);

    // También verificar cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndMarkReady);
    } else {
      checkAndMarkReady();
    }

    // Verificar cuando la ventana esté completamente cargada
    window.addEventListener('load', () => {
      setTimeout(checkAndMarkReady, 500);
    });
  }

  // Inicializar cuando el script se carga
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exponer función para verificar estado
  window.isFirebaseReady = function () {
    return firebaseReady && isFirebaseReady();
  };

  // Exponer promesa para que otros scripts puedan esperar
  window.firebaseReadyPromise = firebaseReadyPromise;

  console.log('📋 Sistema de garantía de Firebase inicializado');
})();
