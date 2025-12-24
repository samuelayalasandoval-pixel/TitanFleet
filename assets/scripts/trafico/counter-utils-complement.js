/**
 * Funciones del Contador (complementarias) - trafico.html
 * Funciones adicionales para gestiÃ³n del contador
 *
 * @module trafico/counter-utils-complement
 */

(function () {
  'use strict';
  window.detenerBucleContador = function () {
    console.log('ðŸ›‘ Deteniendo bucle de contador...');

    // Limpiar observer
    if (window._contadorObserver) {
      window._contadorObserver.disconnect();
      window._contadorObserver = null;
      console.log('âœ… Observer desconectado');
    }

    // Limpiar interval
    if (window._contadorInterval) {
      clearInterval(window._contadorInterval);
      window._contadorInterval = null;
      console.log('âœ… Interval limpiado');
    }

    console.log('ðŸŽ‰ Bucle detenido completamente');
  };

  window.reiniciarContador = function () {
    console.log('ðŸ”„ Reiniciando contador limpiamente...');

    // Primero detener todo
    window.detenerBucleContador();

    // Esperar un momento y reiniciar con sistema optimizado
    setTimeout(() => {
      try {
        // Una sola actualizaciÃ³n manual
        if (typeof window.actualizarContador === 'function') {
          const valor = window.actualizarContador();
          console.log(`âœ… Contador reiniciado con valor: ${valor}`);
        } else {
          console.warn('âš ï¸ actualizarContador no estÃ¡ disponible');
        }

        // Configurar sistema optimizado (sin bucles)
        if (typeof window.configurarContadorOptimizado === 'function') {
          window.configurarContadorOptimizado();
        } else {
          console.warn('âš ï¸ configurarContadorOptimizado no estÃ¡ disponible');
        }
      } catch (error) {
        console.error('âŒ Error en reinicio de contador:', error);
      }
    }, 500);
  };

  window.configurarContadorOptimizado = function () {
    console.log('âš™ï¸ Configurando contador optimizado...');

    const contador = document.getElementById('contadorPendientesTrafico');
    if (!contador) {
      return;
    }

    let ultimoValorConocido = null;
    let timeoutId = null;

    // FunciÃ³n de actualizaciÃ³n controlada
    const actualizarSiEsNecesario = () => {
      if (timeoutId) {
        return;
      } // Ya hay una actualizaciÃ³n pendiente

      timeoutId = setTimeout(() => {
        const valorActual = window.actualizarContador();
        if (valorActual !== ultimoValorConocido) {
          ultimoValorConocido = valorActual;
          console.log(`ðŸ”„ Contador actualizado: ${valorActual}`);
        }
        timeoutId = null;
      }, 100);
    };

    // Observer muy especÃ­fico (solo cambios externos)
    if (window._contadorObserver) {
      window._contadorObserver.disconnect();
    }

    window._contadorObserver = new MutationObserver(_mutations => {
      // Solo actuar si el cambio viene de fuera (no de nuestras actualizaciones)
      const textoActual = contador.textContent;
      if (textoActual !== ultimoValorConocido?.toString() && !timeoutId) {
        actualizarSiEsNecesario();
      }
    });

    window._contadorObserver.observe(contador, {
      childList: true,
      characterData: true
    });

    // ActualizaciÃ³n inicial
    actualizarSiEsNecesario();

    console.log('âœ… Contador optimizado configurado (sin bucles)');
  };
})();
