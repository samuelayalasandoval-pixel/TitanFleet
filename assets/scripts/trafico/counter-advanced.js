/**
 * Funciones Avanzadas del Contador - trafico.html
 * Funciones avanzadas para el manejo del contador de pendientes
 *
 * @module trafico/counter-advanced
 */

(function () {
  'use strict';

  // Función para actualizar contador manualmente (sin efectos secundarios)
  window.actualizarContadorManual = function () {
    console.log('🔄 Actualización manual del contador...');

    // Detener cualquier bucle activo
    if (window._contadorInterval) {
      clearInterval(window._contadorInterval);
      window._contadorInterval = null;
    }

    // Una sola actualización
    const valor = window.actualizarContador();
    console.log(`✅ Contador actualizado manualmente: ${valor}`);

    return valor;
  };

  // Función para deshabilitar TODAS las actualizaciones automáticas
  window.deshabilitarActualizacionesAutomaticas = function () {
    console.log('🛑 Deshabilitando TODAS las actualizaciones automáticas...');

    // Limpiar todos los observers
    if (window._contadorObserver) {
      window._contadorObserver.disconnect();
      window._contadorObserver = null;
      console.log('✅ Observer principal desconectado');
    }

    // Limpiar todos los intervals
    if (window._contadorInterval) {
      clearInterval(window._contadorInterval);
      window._contadorInterval = null;
      console.log('✅ Interval principal limpiado');
    }

    // Buscar y limpiar otros posibles intervals/timeouts
    for (let i = 1; i < 10000; i++) {
      clearInterval(i);
      clearTimeout(i);
    }

    // Sobrescribir funciones problemáticas temporalmente
    window._actualizarContadorPendientesOriginal = window.actualizarContadorPendientes;
    window._fijarContadorPendientesOriginal = window.fijarContadorPendientes;

    window.actualizarContadorPendientes = function () {
      console.log('🚫 actualizarContadorPendientes deshabilitado');
    };

    window.fijarContadorPendientes = function () {
      console.log('🚫 fijarContadorPendientes deshabilitado');
    };

    console.log('🎉 Todas las actualizaciones automáticas deshabilitadas');
  };

  // Función para habilitar actualizaciones manuales únicamente
  window.habilitarSoloActualizacionManual = function () {
    console.log('🔧 Habilitando solo actualización manual...');

    // Primero deshabilitar todo
    window.deshabilitarActualizacionesAutomaticas();

    // Crear función de actualización manual mejorada
    window.actualizarContadorSoloManual = function () {
      console.log('🔄 Actualización manual única...');

      const traficoData = localStorage.getItem('erp_trafico');
      let registrosPendientes = [];

      if (traficoData) {
        const registros = JSON.parse(traficoData);

        // Eliminar duplicados
        const registrosUnicos = [];
        const idsVistos = new Set();

        registros.forEach(r => {
          const id = r.numeroRegistro || r.id;
          if (id && !idsVistos.has(id)) {
            idsVistos.add(id);
            registrosUnicos.push(r);
          }
        });

        // Filtrar pendientes
        registrosPendientes = registrosUnicos.filter(r => {
          const estado = r.estado || r.estadoPlataforma || '';
          const numeroRegistro = r.numeroRegistro || r.id || '';

          const esPendientePorEstado =
            estado === 'pendiente' || estado === 'registrado' || r.estadoPlataforma === 'pendiente';

          const tieneNumeroValido =
            numeroRegistro &&
            (numeroRegistro.match(/^25\d{5}$/) || numeroRegistro.match(/^2025-\d{2}-\d{4}$/));

          return (
            esPendientePorEstado &&
            tieneNumeroValido &&
            estado !== 'completado' &&
            estado !== 'facturado'
          );
        });
      }

      // Actualizar contador directamente
      const contador = document.getElementById('contadorPendientesTrafico');
      if (contador) {
        contador.textContent = registrosPendientes.length;
        contador.classList.remove('bg-danger', 'bg-success');
        contador.classList.add(registrosPendientes.length > 0 ? 'bg-warning' : 'bg-success');
      }

      console.log(`✅ Contador actualizado manualmente: ${registrosPendientes.length}`);
      return registrosPendientes.length;
    };

    console.log('✅ Solo actualización manual habilitada');
  };

  // Función para inicializar contador inteligente (automático pero sin bucles)
  window.inicializarContadorInteligente = function () {
    console.log('🧠 Inicializando contador inteligente...');

    // Limpiar cualquier sistema anterior
    if (window._contadorObserver) {
      window._contadorObserver.disconnect();
      window._contadorObserver = null;
    }
    if (window._contadorInterval) {
      clearInterval(window._contadorInterval);
      window._contadorInterval = null;
    }

    let ultimaActualizacion = 0;
    let valorActual = null;

    // Función de actualización inteligente (con throttling)
    const actualizarInteligente = () => {
      const ahora = Date.now();

      // Solo actualizar si han pasado al menos 2 segundos desde la última actualización
      if (ahora - ultimaActualizacion < 2000) {
        return valorActual;
      }

      ultimaActualizacion = ahora;

      const traficoData = localStorage.getItem('erp_trafico');
      let registrosPendientes = [];

      if (traficoData) {
        const registros = JSON.parse(traficoData);

        // Eliminar duplicados
        const registrosUnicos = [];
        const idsVistos = new Set();

        registros.forEach(r => {
          const id = r.numeroRegistro || r.id;
          if (id && !idsVistos.has(id)) {
            idsVistos.add(id);
            registrosUnicos.push(r);
          }
        });

        // Filtrar pendientes
        registrosPendientes = registrosUnicos.filter(r => {
          const estado = r.estado || r.estadoPlataforma || '';
          const numeroRegistro = r.numeroRegistro || r.id || '';

          const esPendientePorEstado =
            estado === 'pendiente' || estado === 'registrado' || r.estadoPlataforma === 'pendiente';

          const tieneNumeroValido =
            numeroRegistro &&
            (numeroRegistro.match(/^25\d{5}$/) || numeroRegistro.match(/^2025-\d{2}-\d{4}$/));

          return (
            esPendientePorEstado &&
            tieneNumeroValido &&
            estado !== 'completado' &&
            estado !== 'facturado'
          );
        });
      }

      const nuevoValor = registrosPendientes.length;

      // Solo actualizar DOM si el valor cambió
      if (nuevoValor !== valorActual) {
        valorActual = nuevoValor;

        const contador = document.getElementById('contadorPendientesTrafico');
        if (contador) {
          contador.textContent = valorActual;
          contador.classList.remove('bg-danger', 'bg-success');
          contador.classList.add(valorActual > 0 ? 'bg-warning' : 'bg-success');
        }

        console.log(`🔄 Contador inteligente actualizado: ${valorActual}`);
      }

      return valorActual;
    };

    // Actualización inicial
    actualizarInteligente();

    // Observer muy específico (solo para cambios en localStorage)
    const observarCambios = () => {
      let ultimoHash = '';

      const verificarCambios = () => {
        const traficoData = localStorage.getItem('erp_trafico') || '';
        const logisticaData = localStorage.getItem('erp_logistica') || '';
        const nuevoHash = traficoData + logisticaData;

        if (nuevoHash !== ultimoHash) {
          ultimoHash = nuevoHash;
          actualizarInteligente();
        }
      };

      // Verificar cambios cada 5 segundos (no cada segundo)
      window._contadorInterval = setInterval(verificarCambios, 5000);
    };

    observarCambios();

    // Actualizar cuando se agreguen nuevos registros
    const originalSaveLogistica = window.saveLogisticaData;
    const originalSaveTrafico = window.saveTraficoData;

    if (originalSaveLogistica) {
      window.saveLogisticaData = function (...args) {
        const resultado = originalSaveLogistica.apply(this, args);
        setTimeout(actualizarInteligente, 1000);
        return resultado;
      };
    }

    if (originalSaveTrafico) {
      window.saveTraficoData = function (...args) {
        const resultado = originalSaveTrafico.apply(this, args);
        setTimeout(actualizarInteligente, 1000);
        return resultado;
      };
    }

    console.log('✅ Contador inteligente inicializado (actualización automática controlada)');

    // Función especial para mantener el valor después de hacer clic
    window.mantenerValorDespuesDeClick = function () {
      const contador = document.getElementById('contadorPendientesTrafico');
      if (!contador) {
        return;
      }

      // Crear un observer que impida que el contador se resetee
      let bloqueandoReseteo = false;

      const observerAntiReset = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const valorActualDOM = contador.textContent;

            // Recalcular el valor real cada vez
            const valorReal = actualizarInteligente();

            // Si el valor se cambió a 0 pero debería ser mayor
            if (valorActualDOM === '0' && valorReal > 0 && !bloqueandoReseteo) {
              bloqueandoReseteo = true;
              console.log(
                `🛡️ Protegiendo contador: restaurando ${valorReal} (se había cambiado a 0)`
              );
              contador.textContent = valorReal;
              contador.classList.remove('bg-danger', 'bg-success');
              contador.classList.add('bg-warning');

              setTimeout(() => {
                bloqueandoReseteo = false;
              }, 100);
            }
          }
        });
      });

      observerAntiReset.observe(contador, {
        childList: true,
        characterData: true,
        subtree: true
      });

      // Guardar referencia para poder desconectarlo después
      window._observerAntiReset = observerAntiReset;

      console.log('🛡️ Protección anti-reset activada');
    };

    // Activar protección después de la inicialización
    setTimeout(() => {
      window.mantenerValorDespuesDeClick();
    }, 2000);
  };

  // Función de protección temprana (se activa inmediatamente al cargar)
  window.activarProteccionTemprana = function () {
    console.log('⚡ Activando protección temprana...');

    const contador = document.getElementById('contadorPendientesTrafico');
    if (!contador) {
      return;
    }

    let valorCorrectoCalculado = null;
    let proteccionActiva = true;

    // Calcular valor correcto inmediatamente
    const calcularValorCorreto = () => {
      const traficoData = localStorage.getItem('erp_trafico');
      if (!traficoData) {
        return 0;
      }

      try {
        const registros = JSON.parse(traficoData);
        const registrosUnicos = [];
        const idsVistos = new Set();

        registros.forEach(r => {
          const id = r.numeroRegistro || r.id;
          if (id && !idsVistos.has(id)) {
            idsVistos.add(id);
            registrosUnicos.push(r);
          }
        });

        const pendientes = registrosUnicos.filter(r => {
          const estado = r.estado || r.estadoPlataforma || '';
          const numeroRegistro = r.numeroRegistro || r.id || '';

          const esPendientePorEstado =
            estado === 'pendiente' || estado === 'registrado' || r.estadoPlataforma === 'pendiente';

          const tieneNumeroValido =
            numeroRegistro &&
            (numeroRegistro.match(/^25\d{5}$/) || numeroRegistro.match(/^2025-\d{2}-\d{4}$/));

          return (
            esPendientePorEstado &&
            tieneNumeroValido &&
            estado !== 'completado' &&
            estado !== 'facturado'
          );
        });

        return pendientes.length;
      } catch (e) {
        return 0;
      }
    };

    // Calcular y establecer valor inicial
    valorCorrectoCalculado = calcularValorCorreto();
    if (valorCorrectoCalculado > 0) {
      contador.textContent = valorCorrectoCalculado;
      contador.classList.remove('bg-danger', 'bg-success');
      contador.classList.add('bg-warning');
      console.log(`⚡ Valor inicial establecido: ${valorCorrectoCalculado}`);
    }

    // Observer agresivo para protección temprana
    const observerTemprano = new MutationObserver(mutations => {
      if (!proteccionActiva) {
        return;
      }

      mutations.forEach(mutation => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const valorActual = contador.textContent;

          // Si se resetea a 0 pero debería ser mayor
          if (valorActual === '0' && valorCorrectoCalculado > 0) {
            contador.textContent = valorCorrectoCalculado;
            contador.classList.remove('bg-danger', 'bg-success');
            contador.classList.add('bg-warning');
            console.log(
              `⚡ PROTECCIÓN TEMPRANA: Restaurado ${valorCorrectoCalculado} (era ${valorActual})`
            );
          }
        }
      });
    });

    observerTemprano.observe(contador, {
      childList: true,
      characterData: true,
      subtree: true
    });

    // Verificaciones adicionales cada 200ms durante los primeros 5 segundos
    let verificaciones = 0;
    const intervalVerificacion = setInterval(() => {
      verificaciones++;

      if (verificaciones > 25) {
        // 5 segundos / 200ms = 25 verificaciones
        clearInterval(intervalVerificacion);
        proteccionActiva = false;
        observerTemprano.disconnect();
        console.log('⚡ Protección temprana completada');
        return;
      }

      const valorActual = contador.textContent;
      if (valorActual === '0' && valorCorrectoCalculado > 0) {
        contador.textContent = valorCorrectoCalculado;
        contador.classList.remove('bg-danger', 'bg-success');
        contador.classList.add('bg-warning');
        console.log(`⚡ VERIFICACIÓN ${verificaciones}: Restaurado ${valorCorrectoCalculado}`);
      }
    }, 200);

    console.log(`⚡ Protección temprana activada con valor: ${valorCorrectoCalculado}`);
  };
})();
