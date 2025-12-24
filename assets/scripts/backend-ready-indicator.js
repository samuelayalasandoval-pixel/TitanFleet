/**
 * Backend Ready Indicator
 * Sistema de indicador visual del estado de carga del backend
 * Muestra un indicador cuando Firebase y los repositorios están listos
 *
 * INSTRUCCIONES DE USO:
 *
 * 1. Incluir el CSS en el <head>:
 *    <link rel="stylesheet" href="../styles/backend-indicator.css">
 *
 * 2. Agregar los elementos HTML dentro de <div class="page-title-section">,
 *    después del <h1 class="page-title"> (recomendado, formato como operadores):
 *    <div class="backend-status-container">
 *      <span id="backendReadyIndicator" class="backend-loading-indicator" style="display: none;">
 *        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
 *        <span class="ms-2">Cargando datos...</span>
 *      </span>
 *      <span id="backendReadyBadge" class="backend-ready-badge" style="display: none;">
 *        <i class="fas fa-check-circle"></i>
 *        <span class="ms-2">Listo para trabajar</span>
 *      </span>
 *    </div>
 *
 *    O inline dentro del <h1 class="page-title"> (formato alternativo):
 *    <span id="backendReadyIndicator" class="backend-loading-indicator" style="display: none;">
 *      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
 *      <span class="ms-2">Cargando datos...</span>
 *    </span>
 *    <span id="backendReadyBadge" class="backend-ready-badge" style="display: none;">
 *      <i class="fas fa-check-circle"></i>
 *      <span class="ms-2">Listo para trabajar</span>
 *    </span>
 *
 * 3. Incluir el script antes de cerrar </body>:
 *    <script src="../assets/scripts/backend-ready-indicator.js"></script>
 *
 * El script detectará automáticamente los elementos y mostrará el estado.
 * Si los elementos no están presentes, el script no causará errores.
 *
 * API PÚBLICA (disponible en window.BackendReadyIndicator):
 * - reinitialize(): Reinicializa el indicador
 * - checkStatus(): Retorna Promise<boolean> con el estado actual
 * - update(): Actualiza manualmente el indicador
 * - isReady(): Retorna boolean con el estado actual
 *
 * @author TitanFleet ERP
 * @version 1.0.0
 */

(function () {
  'use strict';

  /**
   * Configuración del indicador
   */
  const CONFIG = {
    // IDs de los elementos HTML
    LOADING_INDICATOR_ID: 'backendReadyIndicator',
    READY_BADGE_ID: 'backendReadyBadge',

    // Tiempo máximo de espera (en milisegundos)
    MAX_WAIT_TIME: 15000, // 15 segundos (reducido para que no se quede bloqueado)

    // Intervalo de verificación (en milisegundos)
    CHECK_INTERVAL: 500,

    // Mensajes
    MESSAGES: {
      LOADING: 'Cargando datos...',
      READY: 'Listo para trabajar'
    }
  };

  /**
   * Estado del indicador
   */
  const state = {
    loadingIndicator: null,
    readyBadge: null,
    checkInterval: null,
    isReady: false,
    initialized: false,
    _initializationDelayApplied: false,
    _pageDataCheckLogged: false,
    _traficoRecordsCheckAttempted: false,
    _logisticaRecordsCheckAttempted: false,
    _facturacionRecordsCheckAttempted: false
  };

  /**
   * Verificación alternativa más flexible (fallback)
   * @returns {Promise<boolean>} true si el backend básico está listo
   */
  async function checkBackendReadyFallback() {
    try {
      // Verificación mínima: solo Firebase básico y repositorio principal
      if (!window.firebaseDb || !window.fs || !window.firebaseReady) {
        return false;
      }
      if (!window.firebaseRepos || !window.firebaseRepos.logistica) {
        return false;
      }
      // Intentar inicializar el repositorio si no tiene db
      const logisticaRepo = window.firebaseRepos.logistica;
      if (!logisticaRepo.db && typeof logisticaRepo.init === 'function') {
        try {
          await logisticaRepo.init();
        } catch (error) {
          console.warn('⚠️ Error inicializando repositorio en fallback:', error);
        }
      }
      // Si después de intentar inicializar aún no tiene db, pero Firebase está listo, considerar listo
      if (!logisticaRepo.db && window.firebaseDb && window.fs) {
        console.log(
          'ℹ️ Repositorio logistica sin db, pero Firebase está listo - mostrando como listo'
        );
        return true;
      }
      return Boolean(logisticaRepo.db);
    } catch (error) {
      console.error('❌ Error en verificación alternativa:', error);
      // Si Firebase básico está listo, considerar listo aunque haya error
      if (window.firebaseDb && window.fs && window.firebaseReady) {
        console.log('ℹ️ Firebase básico listo - mostrando como listo a pesar de error');
        return true;
      }
      return false;
    }
  }

  /**
   * Verificar si los datos de la página (registros, buzón) están cargados
   * @returns {Promise<boolean>} true si los datos de la página están cargados
   */
  async function checkPageDataLoaded() {
    try {
      const currentPath = window.location.pathname || '';
      const pageName = currentPath.split('/').pop() || '';

      // Para páginas que no necesitan registros (menu, demo, configuracion), retornar true
      if (
        pageName.includes('menu.html') ||
        pageName.includes('demo.html') ||
        pageName.includes('configuracion.html') ||
        pageName.includes('operadores.html') ||
        pageName.includes('tesoreria.html') ||
        pageName.includes('diesel.html') ||
        pageName.includes('mantenimiento.html') ||
        pageName.includes('inventario.html') ||
        pageName.includes('reportes.html')
      ) {
        return true;
      }

      // Para páginas con registros, verificar que se hayan cargado
      if (pageName.includes('trafico.html')) {
        // Verificar que los registros de tráfico se hayan cargado
        // Buscar la tabla de registros con múltiples selectores posibles
        const tableSelectors = [
          '#registrosTraficoTable tbody',
          '.registros-trafico tbody',
          '#tablaRegistrosTrafico tbody',
          'table.registros-trafico tbody',
          '.table-responsive tbody',
          '#contenedorRegistrosTrafico tbody'
        ];

        let registrosTable = null;
        for (const selector of tableSelectors) {
          registrosTable = document.querySelector(selector);
          if (registrosTable) {
            break;
          }
        }

        // Verificar que la tabla existe y tiene contenido (incluso si dice "No hay registros")
        const hasRecords =
          registrosTable &&
          (registrosTable.children.length > 0 ||
            registrosTable.textContent.trim() !== '' ||
            registrosTable.innerHTML.trim() !== '');

        // Verificar que el buzón de pendientes esté disponible
        const buzonAvailable = typeof window.mostrarBuzonPendientesTrafico === 'function';

        // Esperar un poco más si no hay registros visibles aún (puede estar cargando)
        if (!hasRecords && !state._traficoRecordsCheckAttempted) {
          state._traficoRecordsCheckAttempted = true;
          // Esperar hasta 3 segundos más para que se carguen los registros
          let attempts = 0;
          while (attempts < 6) {
            await new Promise(resolve => setTimeout(resolve, 500));
            // Re-buscar la tabla
            for (const selector of tableSelectors) {
              const checkTable = document.querySelector(selector);
              if (
                checkTable &&
                (checkTable.children.length > 0 ||
                  checkTable.textContent.trim() !== '' ||
                  checkTable.innerHTML.trim() !== '')
              ) {
                return buzonAvailable;
              }
            }
            attempts++;
          }
        }

        return hasRecords && buzonAvailable;
      }

      if (pageName.includes('logistica.html')) {
        // Verificar que los registros de logística se hayan cargado
        const tableSelectors = [
          '#registrosLogisticaTable tbody',
          '.registros-logistica tbody',
          '#tablaRegistrosLogistica tbody',
          'table.registros-logistica tbody',
          '.table-responsive tbody',
          '#contenedorRegistrosLogistica tbody'
        ];

        let registrosTable = null;
        for (const selector of tableSelectors) {
          registrosTable = document.querySelector(selector);
          if (registrosTable) {
            break;
          }
        }

        const hasRecords =
          registrosTable &&
          (registrosTable.children.length > 0 ||
            registrosTable.textContent.trim() !== '' ||
            registrosTable.innerHTML.trim() !== '');

        // Esperar un poco más si no hay registros visibles aún
        if (!hasRecords && !state._logisticaRecordsCheckAttempted) {
          state._logisticaRecordsCheckAttempted = true;
          let attempts = 0;
          while (attempts < 6) {
            await new Promise(resolve => setTimeout(resolve, 500));
            for (const selector of tableSelectors) {
              const checkTable = document.querySelector(selector);
              if (
                checkTable &&
                (checkTable.children.length > 0 ||
                  checkTable.textContent.trim() !== '' ||
                  checkTable.innerHTML.trim() !== '')
              ) {
                return true;
              }
            }
            attempts++;
          }
        }

        return hasRecords;
      }

      if (pageName.includes('facturacion.html')) {
        // Verificar que los registros de facturación se hayan cargado
        const tableSelectors = [
          '#registrosFacturacionTable tbody',
          '.registros-facturacion tbody',
          '#tablaRegistrosFacturacion tbody',
          'table.registros-facturacion tbody',
          '.table-responsive tbody',
          '#contenedorRegistrosFacturacion tbody'
        ];

        let registrosTable = null;
        for (const selector of tableSelectors) {
          registrosTable = document.querySelector(selector);
          if (registrosTable) {
            break;
          }
        }

        const hasRecords =
          registrosTable &&
          (registrosTable.children.length > 0 ||
            registrosTable.textContent.trim() !== '' ||
            registrosTable.innerHTML.trim() !== '');

        // Esperar un poco más si no hay registros visibles aún
        if (!hasRecords && !state._facturacionRecordsCheckAttempted) {
          state._facturacionRecordsCheckAttempted = true;
          let attempts = 0;
          while (attempts < 6) {
            await new Promise(resolve => setTimeout(resolve, 500));
            for (const selector of tableSelectors) {
              const checkTable = document.querySelector(selector);
              if (
                checkTable &&
                (checkTable.children.length > 0 ||
                  checkTable.textContent.trim() !== '' ||
                  checkTable.innerHTML.trim() !== '')
              ) {
                return true;
              }
            }
            attempts++;
          }
        }

        return hasRecords;
      }

      // Para otras páginas, considerar que los datos están cargados
      return true;
    } catch (error) {
      console.warn('⚠️ Error verificando datos de la página:', error);
      // En caso de error, considerar que está listo para no bloquear indefinidamente
      return true;
    }
  }

  /**
   * Verificar si Firebase y los repositorios están listos
   * @returns {Promise<boolean>} true si el backend está completamente listo
   */
  async function checkBackendReady() {
    try {
      // 1. Verificar Firebase básico
      if (!window.firebaseDb || !window.fs) {
        if (state.initialized) {
          console.log('⏳ Esperando Firebase básico...');
        }
        return false;
      }

      // 2. Esperar autenticación si existe
      if (window.__onAuthReady) {
        try {
          await window.__onAuthReady;
          if (state.initialized) {
            console.log('✅ Autenticación lista');
          }
        } catch (error) {
          console.warn('⚠️ Error esperando autenticación:', error);
        }
      }

      // 3. Esperar a que los repositorios estén listos si existe la promesa
      // Pero no bloquear si falla o tarda mucho
      if (window.__firebaseReposReady) {
        try {
          // Usar Promise.race para no esperar más de 5 segundos
          await Promise.race([
            window.__firebaseReposReady,
            new Promise(resolve => setTimeout(resolve, 5000))
          ]);
          if (state.initialized) {
            console.log('✅ Promesa __firebaseReposReady resuelta o timeout alcanzado');
          }
        } catch (error) {
          console.warn('⚠️ Error esperando __firebaseReposReady (continuando):', error);
          // No retornar false, continuar con la verificación
        }
      }

      // 4. Verificar repositorios (opcional - algunas páginas como menu.html no los necesitan)
      // Verificar si estamos en una página que realmente necesita repositorios
      const currentPath = window.location.pathname || '';
      const pageName = currentPath.split('/').pop() || '';
      const needsRepos = !pageName.includes('menu.html') && !pageName.includes('demo.html');

      if (needsRepos) {
        // Solo verificar repos si la página los necesita
        // Intentar esperar un poco más si firebaseRepos no está disponible
        if (!window.firebaseRepos) {
          // Esperar un poco más para que se inicialice (máximo 3 segundos)
          let waited = 0;
          const maxWait = 3000;
          const checkInterval = 200;
          while (!window.firebaseRepos && waited < maxWait) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
          }
          if (!window.firebaseRepos) {
            if (state.initialized) {
              // console.log('⏳ Esperando firebaseRepos (página lo requiere)...');
            }
            // Si Firebase básico está listo, considerar listo aunque no haya repos
            if (window.firebaseDb && window.fs && window.firebaseReady) {
              // console.log('ℹ️ Firebase básico listo, pero firebaseRepos no disponible - mostrando como listo');
              return true;
            }
            return false;
          }
        }

        // Verificar que al menos el repositorio principal (logística) esté listo
        if (!window.firebaseRepos.logistica) {
          // Intentar esperar un poco más (máximo 2 segundos adicionales)
          let waited = 0;
          const maxWait = 2000;
          const checkInterval = 200;
          while (!window.firebaseRepos.logistica && waited < maxWait) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
          }
          if (!window.firebaseRepos.logistica) {
            if (state.initialized) {
              // console.log('⏳ Esperando repositorio logistica...');
            }
            // Si Firebase básico está listo, considerar listo aunque no haya repos
            if (window.firebaseDb && window.fs && window.firebaseReady) {
              // console.log('ℹ️ Firebase básico listo, pero repositorio logistica no disponible - mostrando como listo');
              return true;
            }
            return false;
          }
        }

        // Verificar que logística tenga db (tenantId puede ser opcional para algunos casos)
        const logisticaRepo = window.firebaseRepos.logistica;
        if (!logisticaRepo.db) {
          // Intentar inicializar el repositorio si no está inicializado
          if (typeof logisticaRepo.init === 'function' && !logisticaRepo._initialized) {
            try {
              await logisticaRepo.init();
            } catch (error) {
              console.warn('⚠️ Error inicializando repositorio logistica:', error);
            }
          }
          // Si después de intentar inicializar aún no tiene db, pero Firebase está listo, considerar listo
          if (!logisticaRepo.db && window.firebaseDb && window.fs) {
            if (state.initialized) {
              console.log(
                'ℹ️ Repositorio logistica sin db, pero Firebase está listo - continuando'
              );
            }
            // No retornar false, continuar con la verificación
          } else if (!logisticaRepo.db) {
            if (state.initialized) {
              console.log('⏳ Repositorio logistica sin db...');
            }
            return false;
          }
        }
      } else {
        // Para páginas como menu.html, no necesitamos repositorios
        if (state.initialized && !state._initializationDelayApplied) {
          console.log('ℹ️ Página no requiere repositorios (menu/demo), usando verificación básica');
        }
      }

      // Verificar otros repositorios principales si existen (pero no bloquear si no están)
      // Solo verificamos que existan, no que tengan tenantId (puede ser opcional)
      if (window.firebaseRepos) {
        const optionalRepos = ['facturacion', 'operadores', 'tesoreria'];
        const missingRepos = [];
        optionalRepos.forEach(repoName => {
          const repo = window.firebaseRepos[repoName];
          if (!repo || !repo.db) {
            missingRepos.push(repoName);
          }
        });

        // Si faltan repos importantes, loguear pero no bloquear
        if (missingRepos.length > 0 && !state._initializationDelayApplied) {
          if (state.initialized) {
            console.log(
              `ℹ️ Repositorios adicionales pendientes: ${missingRepos.join(', ')} (no bloqueante)`
            );
          }
        }
      }

      // 5. Pequeño delay adicional para permitir que procesos de inicialización se completen
      // Solo aplicar el delay una vez, no en cada verificación
      if (!state._initializationDelayApplied) {
        state._initializationDelayApplied = true;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 6. Verificación final: asegurar que firebaseReady esté activo (o al menos Firebase básico)
      // Si firebaseReady no está activo, pero Firebase básico está, continuar
      if (!window.firebaseReady && !window.firebaseDb) {
        if (state.initialized) {
          console.log('⏳ Esperando Firebase básico...');
        }
        return false;
      }

      // 7. Verificar que los registros y datos de la página estén cargados
      const pageDataLoaded = await checkPageDataLoaded();
      if (!pageDataLoaded) {
        if (state.initialized && !state._pageDataCheckLogged) {
          console.log('⏳ Esperando que se carguen los registros y datos de la página...');
          state._pageDataCheckLogged = true;
        }
        return false;
      }

      // Todo está listo
      if (state.initialized && !state.isReady) {
        console.log('✅ Backend COMPLETAMENTE cargado y listo para trabajar');
      }
      return true;
    } catch (error) {
      console.error('❌ Error verificando backend:', error);
      return false;
    }
  }

  /**
   * Actualizar el indicador visual cuando el backend esté listo
   */
  async function updateBackendIndicator() {
    if (!state.loadingIndicator || !state.readyBadge) {
      return;
    }

    const isReady = await checkBackendReady();
    state.isReady = isReady;

    if (isReady) {
      // Ocultar indicador de carga y mostrar badge de listo
      state.loadingIndicator.style.display = 'none';
      state.readyBadge.style.display = 'inline-flex';
    } else {
      // Seguir mostrando indicador de carga
      state.loadingIndicator.style.display = 'inline-flex';
      state.readyBadge.style.display = 'none';
    }
  }

  /**
   * Inicializar el indicador
   */
  function initialize() {
    // Buscar los elementos en el DOM
    state.loadingIndicator = document.getElementById(CONFIG.LOADING_INDICATOR_ID);
    state.readyBadge = document.getElementById(CONFIG.READY_BADGE_ID);

    // Si no se encuentran los elementos, no hacer nada (página sin indicador)
    if (!state.loadingIndicator || !state.readyBadge) {
      if (state.initialized) {
        console.debug('ℹ️ Elementos del indicador de backend no encontrados en esta página');
      }
      return false;
    }

    // Mostrar el indicador de carga inicialmente
    state.loadingIndicator.style.display = 'inline-flex';
    state.readyBadge.style.display = 'none';

    state.initialized = true;
    return true;
  }

  /**
   * Iniciar la verificación periódica del estado del backend
   */
  function startChecking() {
    // Limpiar intervalo anterior si existe
    if (state.checkInterval) {
      clearInterval(state.checkInterval);
    }

    // Verificación inicial
    updateBackendIndicator();

    // Escuchar el evento firebaseReady si está disponible
    if (window.firebaseReady) {
      updateBackendIndicator();
    } else {
      window.addEventListener(
        'firebaseReady',
        () => {
          console.log('🔥 Evento firebaseReady recibido');
          if (state.checkInterval) {
            clearInterval(state.checkInterval);
          }
          updateBackendIndicator();
        },
        { once: true }
      );
    }

    // Verificar periódicamente hasta que esté listo o se alcance el tiempo máximo
    let attempts = 0;
    const maxAttempts = CONFIG.MAX_WAIT_TIME / CONFIG.CHECK_INTERVAL;

    state.checkInterval = setInterval(async () => {
      attempts++;
      const isReady = await checkBackendReady();

      if (isReady || attempts >= maxAttempts) {
        clearInterval(state.checkInterval);
        state.checkInterval = null;
        updateBackendIndicator();

        if (attempts >= maxAttempts && !isReady) {
          console.warn('⚠️ Tiempo máximo de espera alcanzado');
          // Intentar verificación alternativa más flexible
          const fallbackReady = await checkBackendReadyFallback();
          if (fallbackReady) {
            console.log('✅ Backend listo (verificación alternativa)');
            state.isReady = true;
            state.loadingIndicator.style.display = 'none';
            state.readyBadge.style.display = 'inline-flex';
          } else {
            console.warn('⚠️ Mostrando como listo a pesar de verificaciones fallidas');
            state.isReady = true;
            state.loadingIndicator.style.display = 'none';
            state.readyBadge.style.display = 'inline-flex';
          }
        }
      }
    }, CONFIG.CHECK_INTERVAL);

    // También verificar cuando los repositorios estén listos (si hay promesa)
    // Esta verificación es importante para páginas que cargan repositorios de forma asíncrona
    if (window.__firebaseReposReady) {
      window.__firebaseReposReady
        .then(() => {
          console.log('✅ Promesa __firebaseReposReady resuelta');
          // Forzar verificación inmediata después de que la promesa se resuelva
          setTimeout(() => {
            updateBackendIndicator();
            // Si después de 2 segundos aún no está listo, usar verificación alternativa
            setTimeout(() => {
              if (!state.isReady) {
                checkBackendReadyFallback().then(fallbackReady => {
                  if (fallbackReady) {
                    console.log('✅ Backend listo (verificación post-promesa)');
                    state.isReady = true;
                    if (state.loadingIndicator) {
                      state.loadingIndicator.style.display = 'none';
                    }
                    if (state.readyBadge) {
                      state.readyBadge.style.display = 'inline-flex';
                    }
                  }
                });
              }
            }, 2000);
          }, 500);
        })
        .catch(error => {
          console.warn('⚠️ Error en __firebaseReposReady (continuando):', error);
          // Intentar verificación alternativa si falla la promesa
          setTimeout(() => {
            checkBackendReadyFallback().then(fallbackReady => {
              if (fallbackReady) {
                console.log('✅ Backend listo (fallback después de error)');
                state.isReady = true;
                if (state.loadingIndicator) {
                  state.loadingIndicator.style.display = 'none';
                }
                if (state.readyBadge) {
                  state.readyBadge.style.display = 'inline-flex';
                }
              }
            });
          }, 1000);
        });
    } else {
      // Si no existe __firebaseReposReady, puede ser que los scripts aún no se hayan cargado
      // Esperar un poco y verificar si aparece
      setTimeout(() => {
        if (window.__firebaseReposReady) {
          window.__firebaseReposReady
            .then(() => {
              console.log('✅ Promesa __firebaseReposReady detectada y resuelta (tardía)');
              setTimeout(() => {
                updateBackendIndicator();
              }, 500);
            })
            .catch(() => {
              // Ignorar errores
            });
        }
      }, 2000);
    }
  }

  /**
   * Función pública para reinicializar el indicador
   */
  function reinitialize() {
    if (state.checkInterval) {
      clearInterval(state.checkInterval);
      state.checkInterval = null;
    }
    state.isReady = false;
    state._initializationDelayApplied = false;

    if (initialize()) {
      startChecking();
    }
  }

  /**
   * Limpiar recursos cuando la página se descarga
   */
  function cleanup() {
    if (state.checkInterval) {
      clearInterval(state.checkInterval);
      state.checkInterval = null;
    }
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (initialize()) {
        startChecking();
      }
    });
  } else {
    // DOM ya está listo
    if (initialize()) {
      startChecking();
    }
  }

  // Limpiar al descargar la página
  window.addEventListener('beforeunload', cleanup);

  // Exponer API pública
  window.BackendReadyIndicator = {
    reinitialize: reinitialize,
    checkStatus: checkBackendReady,
    update: updateBackendIndicator,
    isReady: () => state.isReady
  };

  console.log('✅ Backend Ready Indicator inicializado');
})();
