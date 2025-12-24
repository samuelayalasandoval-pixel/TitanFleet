/**
 * Sistema de Caché Inteligente con localStorage como Apoyo
 * Firebase es SIEMPRE la fuente de verdad
 * localStorage solo se usa como caché temporal para mejorar rendimiento
 */

(function () {
  'use strict';

  console.log('📦 Sistema de caché inteligente inicializado');

  /**
   * Configuración de TTL (Time To Live) para diferentes tipos de datos
   * Tiempo en milisegundos
   */
  const CACHE_TTL = {
    clientes: 5 * 60 * 1000, // 5 minutos
    economicos: 5 * 60 * 1000, // 5 minutos
    operadores: 5 * 60 * 1000, // 5 minutos
    estancias: 5 * 60 * 1000, // 5 minutos
    motivosPago: 10 * 60 * 1000, // 10 minutos
    proveedores: 5 * 60 * 1000, // 5 minutos
    default: 5 * 60 * 1000 // 5 minutos por defecto
  };

  /**
   * Prefijo para las claves de caché en localStorage
   */
  const CACHE_PREFIX = 'erp_cache_';

  /**
   * Obtener TTL para un tipo de dato
   */
  function getTTL(type) {
    return CACHE_TTL[type] || CACHE_TTL.default;
  }

  /**
   * Obtener clave de caché
   */
  function getCacheKey(type) {
    return `${CACHE_PREFIX}${type}`;
  }

  /**
   * Guardar datos en caché con timestamp y TTL
   * @param {string} type - Tipo de dato (clientes, economicos, etc.)
   * @param {any} data - Datos a cachear
   * @returns {boolean} - true si se guardó correctamente
   */
  window.saveToCache = function (type, data) {
    const startTime = Date.now();
    try {
      const cacheKey = getCacheKey(type);
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        ttl: getTTL(type),
        type: type
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      const saveTime = Date.now() - startTime;
      recordSave(type);
      console.log(
        `✅ Datos guardados en caché: ${type} (${Array.isArray(data) ? data.length : 'N/A'} items) en ${saveTime}ms`
      );
      return true;
    } catch (error) {
      console.warn(`⚠️ Error guardando en caché (${type}):`, error);
      return false;
    }
  };

  /**
   * Obtener datos del caché si son válidos
   * @param {string} type - Tipo de dato
   * @returns {any|null} - Datos si son válidos, null si expiraron o no existen
   */
  window.getFromCache = function (type) {
    const startTime = Date.now();
    try {
      const cacheKey = getCacheKey(type);
      const cacheString = localStorage.getItem(cacheKey);

      if (!cacheString) {
        recordMiss(type);
        return null;
      }

      const cacheData = JSON.parse(cacheString);

      // Verificar si el caché expiró
      const age = Date.now() - cacheData.timestamp;
      if (age > cacheData.ttl) {
        console.log(
          `⏰ Caché expirado para ${type} (edad: ${Math.round(age / 1000)}s, TTL: ${Math.round(cacheData.ttl / 1000)}s)`
        );
        // Eliminar caché expirado
        localStorage.removeItem(cacheKey);
        recordMiss(type);
        return null;
      }

      const loadTime = Date.now() - startTime;
      recordHit(type);
      recordCacheLoadTime(loadTime);
      console.log(
        `✅ Datos obtenidos del caché: ${type} (válido por ${Math.round((cacheData.ttl - age) / 1000)}s más) en ${loadTime}ms`
      );
      return cacheData.data;
    } catch (error) {
      console.warn(`⚠️ Error obteniendo del caché (${type}):`, error);
      // Eliminar caché corrupto
      try {
        localStorage.removeItem(getCacheKey(type));
      } catch (e) {
        // Ignorar errores al eliminar
      }
      recordMiss(type);
      return null;
    }
  };

  /**
   * Invalidar caché (eliminar datos del caché)
   * @param {string} type - Tipo de dato a invalidar, o 'all' para invalidar todo
   */
  window.invalidateCache = function (type) {
    try {
      if (type === 'all') {
        // Invalidar todo el caché
        const keys = Object.keys(localStorage);
        let invalidated = 0;
        keys.forEach(key => {
          if (key.startsWith(CACHE_PREFIX)) {
            const cacheType = key.replace(CACHE_PREFIX, '');
            localStorage.removeItem(key);
            recordInvalidation(cacheType);
            invalidated++;
          }
        });
        console.log(`🗑️ Caché invalidado: ${invalidated} tipos de datos`);
      } else {
        // Invalidar un tipo específico
        const cacheKey = getCacheKey(type);
        localStorage.removeItem(cacheKey);
        recordInvalidation(type);
        console.log(`🗑️ Caché invalidado: ${type}`);
      }
    } catch (error) {
      console.warn(`⚠️ Error invalidando caché (${type}):`, error);
    }
  };

  /**
   * Verificar si el caché es válido (sin obtener los datos)
   * @param {string} type - Tipo de dato
   * @returns {boolean} - true si el caché existe y es válido
   */
  window.isCacheValid = function (type) {
    try {
      const cacheKey = getCacheKey(type);
      const cacheString = localStorage.getItem(cacheKey);

      if (!cacheString) {
        return false;
      }

      const cacheData = JSON.parse(cacheString);
      const age = Date.now() - cacheData.timestamp;

      return age < cacheData.ttl;
    } catch (error) {
      return false;
    }
  };

  /**
   * Obtener datos con estrategia: Firebase primero, luego caché
   * @param {string} type - Tipo de dato
   * @param {Function} firebaseLoader - Función async que carga desde Firebase
   * @returns {Promise<any>} - Datos desde Firebase o caché
   */
  window.getDataWithCache = async function (type, firebaseLoader) {
    const startTime = Date.now();

    // PRIORIDAD 1: Intentar cargar desde Firebase
    try {
      if (typeof firebaseLoader === 'function') {
        const data = await firebaseLoader();
        const firebaseLoadTime = Date.now() - startTime;
        recordFirebaseLoadTime(firebaseLoadTime);

        if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
          // Guardar en caché después de cargar desde Firebase
          window.saveToCache(type, data);
          recordFirebaseLoad(type);
          console.log(
            `✅ Datos cargados desde Firebase y guardados en caché: ${type} en ${firebaseLoadTime}ms`
          );
          return data;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error cargando desde Firebase (${type}):`, error);
    }

    // PRIORIDAD 2: Intentar obtener del caché (solo si Firebase falló)
    const cachedData = window.getFromCache(type);
    if (cachedData) {
      console.log(`📦 Datos obtenidos del caché (Firebase no disponible): ${type}`);
      return cachedData;
    }

    // PRIORIDAD 3: Retornar valor por defecto
    recordMiss(type);
    console.warn(`⚠️ No hay datos disponibles (ni Firebase ni caché): ${type}`);
    return Array.isArray(type) ? [] : {};
  };

  /**
   * Limpiar todo el caché (útil cuando se limpian datos intencionalmente)
   */
  window.clearAllCache = function () {
    window.invalidateCache('all');
    console.log('🧹 Todo el caché ha sido limpiado');
  };

  /**
   * Sistema de métricas del caché
   */
  const cacheMetrics = {
    hits: {}, // Aciertos por tipo: { clientes: 10, economicos: 5, ... }
    misses: {}, // Fallos por tipo: { clientes: 2, economicos: 1, ... }
    invalidations: {}, // Invalidaciones por tipo: { clientes: 3, economicos: 2, ... }
    saves: {}, // Guardados por tipo: { clientes: 8, economicos: 6, ... }
    firebaseLoads: {}, // Cargas desde Firebase por tipo: { clientes: 5, economicos: 3, ... }
    cacheLoadTimes: [], // Tiempos de carga desde caché (ms)
    firebaseLoadTimes: [], // Tiempos de carga desde Firebase (ms)
    startTime: Date.now() // Tiempo de inicio del sistema
  };

  /**
   * Registrar un hit (acierto) en el caché
   * @param {string} type - Tipo de dato
   */
  function recordHit(type) {
    if (!cacheMetrics.hits[type]) {
      cacheMetrics.hits[type] = 0;
    }
    cacheMetrics.hits[type]++;
  }

  /**
   * Registrar un miss (fallo) en el caché
   * @param {string} type - Tipo de dato
   */
  function recordMiss(type) {
    if (!cacheMetrics.misses[type]) {
      cacheMetrics.misses[type] = 0;
    }
    cacheMetrics.misses[type]++;
  }

  /**
   * Registrar una invalidación
   * @param {string} type - Tipo de dato
   */
  function recordInvalidation(type) {
    if (!cacheMetrics.invalidations[type]) {
      cacheMetrics.invalidations[type] = 0;
    }
    cacheMetrics.invalidations[type]++;
  }

  /**
   * Registrar un guardado en caché
   * @param {string} type - Tipo de dato
   */
  function recordSave(type) {
    if (!cacheMetrics.saves[type]) {
      cacheMetrics.saves[type] = 0;
    }
    cacheMetrics.saves[type]++;
  }

  /**
   * Registrar una carga desde Firebase
   * @param {string} type - Tipo de dato
   */
  function recordFirebaseLoad(type) {
    if (!cacheMetrics.firebaseLoads[type]) {
      cacheMetrics.firebaseLoads[type] = 0;
    }
    cacheMetrics.firebaseLoads[type]++;
  }

  /**
   * Registrar tiempo de carga desde caché
   * @param {number} timeMs - Tiempo en milisegundos
   */
  function recordCacheLoadTime(timeMs) {
    cacheMetrics.cacheLoadTimes.push(timeMs);
    // Mantener solo los últimos 100 tiempos
    if (cacheMetrics.cacheLoadTimes.length > 100) {
      cacheMetrics.cacheLoadTimes.shift();
    }
  }

  /**
   * Registrar tiempo de carga desde Firebase
   * @param {number} timeMs - Tiempo en milisegundos
   */
  function recordFirebaseLoadTime(timeMs) {
    cacheMetrics.firebaseLoadTimes.push(timeMs);
    // Mantener solo los últimos 100 tiempos
    if (cacheMetrics.firebaseLoadTimes.length > 100) {
      cacheMetrics.firebaseLoadTimes.shift();
    }
  }

  /**
   * Obtener estadísticas del caché (mejorado con métricas)
   * @returns {Object} - Estadísticas del caché
   */
  window.getCacheStats = function () {
    const stats = {
      total: 0,
      valid: 0,
      expired: 0,
      types: {},
      metrics: {
        hits: { ...cacheMetrics.hits },
        misses: { ...cacheMetrics.misses },
        invalidations: { ...cacheMetrics.invalidations },
        saves: { ...cacheMetrics.saves },
        firebaseLoads: { ...cacheMetrics.firebaseLoads },
        hitRate: {},
        missRate: {},
        totalRequests: {},
        averageCacheLoadTime: 0,
        averageFirebaseLoadTime: 0,
        uptime: Date.now() - cacheMetrics.startTime
      }
    };

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          stats.total++;
          const type = key.replace(CACHE_PREFIX, '');
          const isValid = window.isCacheValid(type);

          if (isValid) {
            stats.valid++;
          } else {
            stats.expired++;
          }

          // Calcular tamaño aproximado del caché
          try {
            const cacheString = localStorage.getItem(key);
            const sizeBytes = new Blob([cacheString]).size;
            const sizeKB = (sizeBytes / 1024).toFixed(2);

            stats.types[type] = {
              valid: isValid,
              key: key,
              sizeKB: parseFloat(sizeKB)
            };
          } catch (e) {
            stats.types[type] = {
              valid: isValid,
              key: key,
              sizeKB: 0
            };
          }
        }
      });

      // Calcular métricas agregadas
      const allTypes = new Set([
        ...Object.keys(cacheMetrics.hits),
        ...Object.keys(cacheMetrics.misses),
        ...Object.keys(cacheMetrics.invalidations),
        ...Object.keys(cacheMetrics.saves),
        ...Object.keys(cacheMetrics.firebaseLoads)
      ]);

      allTypes.forEach(type => {
        const hits = cacheMetrics.hits[type] || 0;
        const misses = cacheMetrics.misses[type] || 0;
        const total = hits + misses;

        stats.metrics.totalRequests[type] = total;
        stats.metrics.hitRate[type] = total > 0 ? `${((hits / total) * 100).toFixed(2)}%` : '0%';
        stats.metrics.missRate[type] = total > 0 ? `${((misses / total) * 100).toFixed(2)}%` : '0%';
      });

      // Calcular tiempos promedio
      if (cacheMetrics.cacheLoadTimes.length > 0) {
        const sum = cacheMetrics.cacheLoadTimes.reduce((a, b) => a + b, 0);
        stats.metrics.averageCacheLoadTime = `${(sum / cacheMetrics.cacheLoadTimes.length).toFixed(2)}ms`;
      }

      if (cacheMetrics.firebaseLoadTimes.length > 0) {
        const sum = cacheMetrics.firebaseLoadTimes.reduce((a, b) => a + b, 0);
        stats.metrics.averageFirebaseLoadTime = `${(sum / cacheMetrics.firebaseLoadTimes.length).toFixed(2)}ms`;
      }

      // Calcular tamaño total del caché
      let totalSizeKB = 0;
      Object.keys(stats.types).forEach(type => {
        totalSizeKB += stats.types[type].sizeKB || 0;
      });
      stats.totalSizeKB = totalSizeKB.toFixed(2);
    } catch (error) {
      console.warn('⚠️ Error obteniendo estadísticas del caché:', error);
    }

    return stats;
  };

  /**
   * Limpiar caché expirado automáticamente
   */
  window.cleanExpiredCache = function () {
    const stats = window.getCacheStats();
    let cleaned = 0;

    Object.keys(stats.types).forEach(type => {
      if (!stats.types[type].valid) {
        window.invalidateCache(type);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 Caché expirado limpiado: ${cleaned} tipos`);
    }

    return cleaned;
  };

  // Limpiar caché expirado al cargar
  window.cleanExpiredCache();

  // Limpiar caché expirado cada 10 minutos
  setInterval(
    () => {
      window.cleanExpiredCache();
    },
    10 * 60 * 1000
  );

  /**
   * Listeners de Firebase en tiempo real para invalidar caché automáticamente
   * cuando otros usuarios actualicen datos de configuración
   */
  const firebaseListeners = {
    clientes: null,
    economicos: null,
    operadores: null,
    estancias: null,
    proveedores: null
  };

  /**
   * Inicializar listeners de Firebase para invalidar caché en tiempo real
   * @returns {Promise<void>}
   */
  window.initializeCacheListeners = async function () {
    // Esperar a que Firebase esté disponible
    if (!window.firebaseDb || !window.fs || !window.fs.onSnapshot) {
      console.log('⏳ Esperando Firebase para inicializar listeners de caché...');

      // Intentar hasta 30 veces (15 segundos)
      let attempts = 0;
      while ((!window.firebaseDb || !window.fs || !window.fs.onSnapshot) && attempts < 30) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!window.firebaseDb || !window.fs || !window.fs.onSnapshot) {
        console.warn('⚠️ Firebase no disponible para listeners de caché después de esperar');
        return;
      }
    }

    console.log('📡 Inicializando listeners de Firebase para invalidación automática de caché...');

    try {
      // Listener para clientes
      const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
      firebaseListeners.clientes = window.fs.onSnapshot(
        clientesDocRef,
        doc => {
          if (doc.exists()) {
            console.log('📡 Cambio detectado en configuracion/clientes - invalidando caché');
            window.invalidateCache('clientes');
          }
        },
        error => {
          console.warn('⚠️ Error en listener de clientes:', error);
        }
      );

      // Listener para economicos (tractocamiones)
      const tractocamionesDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'tractocamiones'
      );
      firebaseListeners.economicos = window.fs.onSnapshot(
        tractocamionesDocRef,
        doc => {
          if (doc.exists()) {
            console.log('📡 Cambio detectado en configuracion/tractocamiones - invalidando caché');
            window.invalidateCache('economicos');
          }
        },
        error => {
          console.warn('⚠️ Error en listener de economicos:', error);
        }
      );

      // Listener para operadores
      const operadoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
      firebaseListeners.operadores = window.fs.onSnapshot(
        operadoresDocRef,
        doc => {
          if (doc.exists()) {
            console.log('📡 Cambio detectado en configuracion/operadores - invalidando caché');
            window.invalidateCache('operadores');
          }
        },
        error => {
          console.warn('⚠️ Error en listener de operadores:', error);
        }
      );

      // Listener para estancias
      const estanciasDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'estancias');
      firebaseListeners.estancias = window.fs.onSnapshot(
        estanciasDocRef,
        doc => {
          if (doc.exists()) {
            console.log('📡 Cambio detectado en configuracion/estancias - invalidando caché');
            window.invalidateCache('estancias');
          }
        },
        error => {
          console.warn('⚠️ Error en listener de estancias:', error);
        }
      );

      // Listener para proveedores
      const proveedoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'proveedores');
      firebaseListeners.proveedores = window.fs.onSnapshot(
        proveedoresDocRef,
        doc => {
          if (doc.exists()) {
            console.log('📡 Cambio detectado en configuracion/proveedores - invalidando caché');
            window.invalidateCache('proveedores');
          }
        },
        error => {
          console.warn('⚠️ Error en listener de proveedores:', error);
        }
      );

      console.log('✅ Listeners de Firebase inicializados para invalidación automática de caché');
    } catch (error) {
      console.error('❌ Error inicializando listeners de Firebase:', error);
    }
  };

  /**
   * Detener todos los listeners de Firebase
   */
  window.stopCacheListeners = function () {
    console.log('🛑 Deteniendo listeners de Firebase...');
    Object.keys(firebaseListeners).forEach(type => {
      if (firebaseListeners[type] && typeof firebaseListeners[type] === 'function') {
        try {
          firebaseListeners[type]();
          firebaseListeners[type] = null;
          console.log(`✅ Listener de ${type} detenido`);
        } catch (error) {
          console.warn(`⚠️ Error deteniendo listener de ${type}:`, error);
        }
      }
    });
  };

  /**
   * Intentar inicializar listeners cuando Firebase esté disponible
   */
  function tryInitializeListeners() {
    if (window.firebaseDb && window.fs && window.fs.onSnapshot && window.fs.doc) {
      // Verificar si ya se inicializaron
      if (
        firebaseListeners.clientes ||
        firebaseListeners.economicos ||
        firebaseListeners.operadores
      ) {
        return; // Ya están inicializados
      }

      window.initializeCacheListeners().catch(error => {
        console.warn('⚠️ Error inicializando listeners de caché:', error);
      });
    }
  }

  // Inicializar listeners cuando Firebase esté listo
  // Estrategia múltiple para asegurar inicialización

  // 1. Si Firebase ya está listo
  if (window.firebaseReady || (window.firebaseDb && window.fs)) {
    setTimeout(tryInitializeListeners, 1000);
  }

  // 2. Escuchar evento de Firebase listo
  window.addEventListener(
    'firebaseReady',
    () => {
      setTimeout(tryInitializeListeners, 1000);
    },
    { once: true }
  );

  // 3. Escuchar evento de firebaseReadyAndReposReady (de firebase-ready.js)
  window.addEventListener(
    'firebaseReadyAndReposReady',
    () => {
      setTimeout(tryInitializeListeners, 500);
    },
    { once: true }
  );

  // 4. Intentar periódicamente (fallback)
  let initAttempts = 0;
  const initInterval = setInterval(() => {
    initAttempts++;
    if (initAttempts > 20) {
      // 10 segundos máximo
      clearInterval(initInterval);
      return;
    }

    if (window.firebaseDb && window.fs && window.fs.onSnapshot) {
      tryInitializeListeners();
      clearInterval(initInterval);
    }
  }, 500);

  /**
   * Obtener métricas detalladas del caché
   * @returns {Object} - Métricas completas del caché
   */
  window.getCacheMetrics = function () {
    const stats = window.getCacheStats();
    return {
      ...stats,
      summary: {
        totalHits: Object.values(cacheMetrics.hits).reduce((a, b) => a + b, 0),
        totalMisses: Object.values(cacheMetrics.misses).reduce((a, b) => a + b, 0),
        totalInvalidations: Object.values(cacheMetrics.invalidations).reduce((a, b) => a + b, 0),
        totalSaves: Object.values(cacheMetrics.saves).reduce((a, b) => a + b, 0),
        totalFirebaseLoads: Object.values(cacheMetrics.firebaseLoads).reduce((a, b) => a + b, 0),
        overallHitRate: (() => {
          const total = stats.metrics.totalRequests;
          const totalRequests = Object.values(total).reduce((a, b) => a + b, 0);
          const totalHits = Object.values(cacheMetrics.hits).reduce((a, b) => a + b, 0);
          return totalRequests > 0 ? `${((totalHits / totalRequests) * 100).toFixed(2)}%` : '0%';
        })(),
        uptimeMinutes: Math.round((Date.now() - cacheMetrics.startTime) / 60000)
      }
    };
  };

  /**
   * Mostrar métricas del caché en la consola (formato legible)
   */
  window.logCacheMetrics = function () {
    const metrics = window.getCacheMetrics();
    console.group('📊 Métricas del Sistema de Caché');
    console.log('📈 Resumen General:');
    console.log(`   - Tiempo activo: ${metrics.summary.uptimeMinutes} minutos`);
    console.log(`   - Total de aciertos: ${metrics.summary.totalHits}`);
    console.log(`   - Total de fallos: ${metrics.summary.totalMisses}`);
    console.log(`   - Tasa de aciertos general: ${metrics.summary.overallHitRate}`);
    console.log(`   - Invalidaciones totales: ${metrics.summary.totalInvalidations}`);
    console.log(`   - Guardados totales: ${metrics.summary.totalSaves}`);
    console.log(`   - Cargas desde Firebase: ${metrics.summary.totalFirebaseLoads}`);
    console.log(`   - Tiempo promedio desde caché: ${metrics.metrics.averageCacheLoadTime}`);
    console.log(`   - Tiempo promedio desde Firebase: ${metrics.metrics.averageFirebaseLoadTime}`);
    console.log(`   - Tamaño total del caché: ${metrics.totalSizeKB} KB`);
    console.log('');
    console.log('📋 Por Tipo de Dato:');
    Object.keys(metrics.metrics.hitRate).forEach(type => {
      console.log(`   ${type}:`);
      console.log(`     - Aciertos: ${metrics.metrics.hits[type] || 0}`);
      console.log(`     - Fallos: ${metrics.metrics.misses[type] || 0}`);
      console.log(`     - Total requests: ${metrics.metrics.totalRequests[type] || 0}`);
      console.log(`     - Tasa de aciertos: ${metrics.metrics.hitRate[type]}`);
      console.log(`     - Invalidaciones: ${metrics.metrics.invalidations[type] || 0}`);
      console.log(`     - Guardados: ${metrics.metrics.saves[type] || 0}`);
      console.log(`     - Cargas desde Firebase: ${metrics.metrics.firebaseLoads[type] || 0}`);
      if (metrics.types[type]) {
        console.log(`     - Tamaño: ${metrics.types[type].sizeKB} KB`);
        console.log(`     - Estado: ${metrics.types[type].valid ? '✅ Válido' : '⏰ Expirado'}`);
      }
    });
    console.groupEnd();
    return metrics;
  };

  /**
   * Resetear todas las métricas del caché
   */
  window.resetCacheMetrics = function () {
    cacheMetrics.hits = {};
    cacheMetrics.misses = {};
    cacheMetrics.invalidations = {};
    cacheMetrics.saves = {};
    cacheMetrics.firebaseLoads = {};
    cacheMetrics.cacheLoadTimes = [];
    cacheMetrics.firebaseLoadTimes = [];
    cacheMetrics.startTime = Date.now();
    console.log('🔄 Métricas del caché reiniciadas');
  };

  console.log('✅ Sistema de caché inteligente listo');
})();
