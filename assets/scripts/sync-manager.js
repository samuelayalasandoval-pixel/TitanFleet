// SyncManager - Servicio centralizado de sincronización bidireccional
// Gestiona la sincronización entre Firebase y localStorage para todos los módulos

class SyncManager {
  constructor() {
    this.syncQueue = [];
    this.isSyncing = false;
    this.syncInterval = null;
    this.retryDelay = 5000; // 5 segundos entre reintentos
    this.maxRetries = 3;
  }

  /**
   * Inicializar el servicio de sincronización
   */
  init() {
    console.log('🔄 SyncManager inicializado');

    // OPTIMIZACIÓN: Sincronización periódica desactivada para reducir lecturas
    // La sincronización ahora solo ocurre:
    // 1. Al iniciar la aplicación (una vez)
    // 2. Cuando el usuario guarda datos (automático)
    // 3. Cada 5 minutos si está activa (en lugar de cada 30 segundos)
    //
    // Para activar sincronización periódica, descomentar la siguiente línea:
    // this.startPeriodicSync();

    // Sincronizar al iniciar después de un delay (solo una vez)
    setTimeout(() => {
      this.syncAllModules();
    }, 3000);
  }

  /**
   * Sincronizar todos los módulos
   */
  async syncAllModules() {
    if (this.isSyncing) {
      console.log('⏳ Sincronización ya en progreso, omitiendo...');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Iniciando sincronización de todos los módulos...');

    const modules = [
      'logistica',
      'trafico',
      'facturacion',
      'operadores',
      'diesel',
      'mantenimiento',
      'tesoreria',
      'cxc',
      'cxp',
      'inventario'
    ];

    for (const module of modules) {
      try {
        await this.syncModule(module);
      } catch (error) {
        console.error(`❌ Error sincronizando módulo ${module}:`, error);
      }
    }

    // Procesar cola de sincronización pendiente
    await this.processSyncQueue();

    this.isSyncing = false;
    console.log('✅ Sincronización completa');
  }

  /**
   * Sincronizar un módulo específico
   */
  async syncModule(moduleName) {
    console.log(`🔄 Sincronizando módulo: ${moduleName}`);

    try {
      // Obtener datos de Firebase primero (fuente de verdad)
      const firebaseData = await this.getFirebaseData(moduleName);

      // Verificar si se limpiaron los datos operativos (flag local)
      const datosLimpios = localStorage.getItem('datos_operativos_limpiados');

      // Si Firebase está vacío Y hay conexión, NO restaurar desde localStorage
      // (asumir que los datos fueron eliminados intencionalmente)
      const hayConexion = navigator.onLine;
      const firebaseVacio = !firebaseData || firebaseData.length === 0;

      if (datosLimpios === 'true' || (firebaseVacio && hayConexion)) {
        const razon =
          datosLimpios === 'true'
            ? 'Datos operativos fueron limpiados (flag local)'
            : 'Firebase está vacío y hay conexión (datos eliminados intencionalmente)';
        console.log(
          `⚠️ ${razon}. No se sincronizará desde localStorage a Firebase para ${moduleName}.`
        );
        // Solo sincronizar desde Firebase a localStorage (no al revés)
        await this.syncMissingData([], firebaseData, moduleName); // localData vacío para no sincronizar desde localStorage
        return;
      }

      // Obtener datos de localStorage solo si no se cumplen las condiciones anteriores
      const localData = this.getLocalStorageData(moduleName);

      // Detectar inconsistencias
      const inconsistencies = this.detectInconsistencies(localData, firebaseData, moduleName);

      if (inconsistencies.length > 0) {
        console.log(`⚠️ Detectadas ${inconsistencies.length} inconsistencias en ${moduleName}`);
        // NO resolver inconsistencias si Firebase está vacío y hay conexión
        if (!(firebaseVacio && hayConexion)) {
          await this.resolveInconsistencies(inconsistencies, moduleName);
        } else {
          console.log(
            '⚠️ Firebase vacío con conexión. Firebase es la fuente de verdad. No se restaurarán datos desde localStorage.'
          );
        }
      } else {
        console.log(`✅ Módulo ${moduleName} está sincronizado`);
      }

      // Sincronizar datos faltantes (solo desde Firebase a localStorage si Firebase está vacío y hay conexión)
      if (firebaseVacio && hayConexion) {
        // Solo sincronizar desde Firebase a localStorage
        await this.syncMissingData([], firebaseData, moduleName);
      } else {
        // Sincronización normal (bidireccional)
        await this.syncMissingData(localData, firebaseData, moduleName);
      }
    } catch (error) {
      console.error(`❌ Error en syncModule para ${moduleName}:`, error);
      // Agregar a la cola para reintentar
      this.addToSyncQueue(moduleName);
    }
  }

  /**
   * Obtener datos de localStorage para un módulo
   */
  getLocalStorageData(moduleName) {
    const storageKeys = {
      logistica: ['erp_logistica', 'erp_shared_data'],
      trafico: ['erp_trafico', 'erp_shared_data'],
      facturacion: ['erp_facturacion', 'erp_shared_data'],
      operadores: ['erp_operadores_gastos', 'erp_operadores_incidencias'],
      diesel: ['erp_diesel_movimientos'],
      mantenimiento: ['erp_mantenimiento'],
      tesoreria: ['erp_tesoreria_movimientos'],
      cxc: ['erp_cxc_data'],
      cxp: ['erp_cxp_data'],
      inventario: ['erp_inventario', 'erp_inv']
    };

    const keys = storageKeys[moduleName] || [];
    const data = [];

    keys.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);

          if (key === 'erp_shared_data') {
            // Extraer datos del módulo específico
            if (moduleName === 'logistica' && parsed.registros) {
              Object.values(parsed.registros).forEach(item => {
                data.push({ ...item, _source: 'localStorage', _key: key });
              });
            } else if (moduleName === 'trafico' && parsed.trafico) {
              Object.values(parsed.trafico).forEach(item => {
                data.push({ ...item, _source: 'localStorage', _key: key });
              });
            } else if (moduleName === 'facturacion' && parsed.facturas) {
              Object.values(parsed.facturas).forEach(item => {
                data.push({ ...item, _source: 'localStorage', _key: key });
              });
            }
          } else if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              data.push({ ...item, _source: 'localStorage', _key: key });
            });
          } else if (typeof parsed === 'object') {
            Object.values(parsed).forEach(item => {
              data.push({ ...item, _source: 'localStorage', _key: key });
            });
          }
        }
      } catch (e) {
        console.warn(`⚠️ Error parseando ${key}:`, e);
      }
    });

    return data;
  }

  /**
   * Obtener datos de Firebase para un módulo
   */
  async getFirebaseData(moduleName) {
    if (!window.firebaseRepos || !window.firebaseRepos[moduleName]) {
      return [];
    }

    try {
      const repo = window.firebaseRepos[moduleName];

      // Asegurar que el repositorio esté inicializado
      if (!repo.db || !repo.tenantId) {
        await repo.init();
      }

      if (!repo.db || !repo.tenantId) {
        return [];
      }

      // Obtener todos los registros
      const allData = await repo.getAll();

      return allData.map(item => ({
        ...item,
        _source: 'firebase',
        _id: item.id || item.numeroRegistro || item.registroId
      }));
    } catch (error) {
      console.warn(`⚠️ Error obteniendo datos de Firebase para ${moduleName}:`, error);
      return [];
    }
  }

  /**
   * Detectar inconsistencias entre localStorage y Firebase
   */
  detectInconsistencies(localData, firebaseData, moduleName) {
    const inconsistencies = [];
    const localIds = new Set();
    const firebaseIds = new Set();

    // Mapear IDs de localStorage
    localData.forEach(item => {
      const id = item.id || item.numeroRegistro || item.registroId || item.gastoId;
      if (id) {
        localIds.add(String(id));
      }
    });

    // Mapear IDs de Firebase
    firebaseData.forEach(item => {
      const id = item.id || item.numeroRegistro || item.registroId || item.gastoId || item._id;
      if (id) {
        firebaseIds.add(String(id));
      }
    });

    // Encontrar datos solo en localStorage
    localData.forEach(item => {
      const id = String(item.id || item.numeroRegistro || item.registroId || item.gastoId);
      if (id && !firebaseIds.has(id)) {
        inconsistencies.push({
          type: 'missing_in_firebase',
          id: id,
          data: item,
          module: moduleName
        });
      }
    });

    // Encontrar datos solo en Firebase
    firebaseData.forEach(item => {
      const id = String(
        item.id || item.numeroRegistro || item.registroId || item.gastoId || item._id
      );
      if (id && !localIds.has(id)) {
        inconsistencies.push({
          type: 'missing_in_localstorage',
          id: id,
          data: item,
          module: moduleName
        });
      }
    });

    return inconsistencies;
  }

  /**
   * Resolver inconsistencias detectadas
   */
  async resolveInconsistencies(inconsistencies, moduleName) {
    // Verificar si se limpiaron los datos operativos (flag local)
    const datosLimpios = localStorage.getItem('datos_operativos_limpiados');

    // Verificar si Firebase está vacío y hay conexión
    const hayConexion = navigator.onLine;
    let firebaseVacio = false;
    try {
      const firebaseData = await this.getFirebaseData(moduleName);
      firebaseVacio = !firebaseData || firebaseData.length === 0;
    } catch (error) {
      console.warn(`⚠️ Error verificando Firebase para ${moduleName}:`, error);
    }

    if (datosLimpios === 'true' || (firebaseVacio && hayConexion)) {
      const razon =
        datosLimpios === 'true'
          ? 'Datos operativos fueron limpiados (flag local)'
          : 'Firebase está vacío y hay conexión (datos eliminados intencionalmente)';
      console.log(
        `⚠️ ${razon}. Firebase es la fuente de verdad. No se restaurarán datos desde localStorage para ${moduleName}.`
      );
      // Solo sincronizar desde Firebase a localStorage (no al revés)
      for (const inconsistency of inconsistencies) {
        try {
          if (inconsistency.type === 'missing_in_localstorage') {
            // Solo sincronizar desde Firebase a localStorage
            await this.syncToLocalStorage(inconsistency.data, moduleName, inconsistency.id);
          } else if (inconsistency.type === 'missing_in_firebase') {
            // NO sincronizar desde localStorage a Firebase si se limpiaron los datos o Firebase está vacío
            console.log(
              `⚠️ Ignorando inconsistencia: ${inconsistency.id} existe en localStorage pero no en Firebase (${razon})`
            );
          }
        } catch (error) {
          console.error(`❌ Error resolviendo inconsistencia ${inconsistency.id}:`, error);
        }
      }
      return;
    }

    // Sincronización normal (bidireccional)
    for (const inconsistency of inconsistencies) {
      try {
        if (inconsistency.type === 'missing_in_firebase') {
          // Sincronizar desde localStorage a Firebase
          await this.syncToFirebase(inconsistency.data, moduleName, inconsistency.id);
        } else if (inconsistency.type === 'missing_in_localstorage') {
          // Sincronizar desde Firebase a localStorage
          await this.syncToLocalStorage(inconsistency.data, moduleName, inconsistency.id);
        }
      } catch (error) {
        console.error(`❌ Error resolviendo inconsistencia ${inconsistency.id}:`, error);
        // Agregar a la cola para reintentar
        this.addToSyncQueue(moduleName, inconsistency);
      }
    }
  }

  /**
   * Sincronizar datos faltantes
   */
  async syncMissingData(localData, firebaseData, moduleName) {
    const localIds = new Set();
    const firebaseIds = new Set();

    localData.forEach(item => {
      const id = item.id || item.numeroRegistro || item.registroId || item.gastoId;
      if (id) {
        localIds.add(String(id));
      }
    });

    firebaseData.forEach(item => {
      const id = item.id || item.numeroRegistro || item.registroId || item.gastoId || item._id;
      if (id) {
        firebaseIds.add(String(id));
      }
    });

    // Verificar si se debe sincronizar desde localStorage a Firebase
    const datosLimpios = localStorage.getItem('datos_operativos_limpiados');
    const hayConexion = navigator.onLine;
    const firebaseVacio = !firebaseData || firebaseData.length === 0;
    const noSincronizarDesdeLocal = datosLimpios === 'true' || (firebaseVacio && hayConexion);

    // Sincronizar desde localStorage a Firebase (solo si no se limpiaron los datos)
    if (!noSincronizarDesdeLocal) {
      for (const item of localData) {
        const id = String(item.id || item.numeroRegistro || item.registroId || item.gastoId);
        if (id && !firebaseIds.has(id)) {
          await this.syncToFirebase(item, moduleName, id);
        }
      }
    } else {
      const razon =
        datosLimpios === 'true'
          ? 'datos operativos fueron limpiados'
          : 'Firebase está vacío y hay conexión (datos eliminados intencionalmente)';
      console.log(
        `⚠️ No se sincronizará desde localStorage a Firebase para ${moduleName} (${razon})`
      );
    }

    // Sincronizar desde Firebase a localStorage (siempre)
    for (const item of firebaseData) {
      const id = String(
        item.id || item.numeroRegistro || item.registroId || item.gastoId || item._id
      );
      if (id && !localIds.has(id)) {
        await this.syncToLocalStorage(item, moduleName, id);
      }
    }
  }

  /**
   * Sincronizar un item a Firebase
   */
  async syncToFirebase(item, moduleName, id) {
    if (!window.firebaseRepos || !window.firebaseRepos[moduleName]) {
      console.warn(`⚠️ Repositorio ${moduleName} no disponible para sincronización`);
      return false;
    }

    try {
      const repo = window.firebaseRepos[moduleName];

      // Limpiar metadatos de sincronización
      const cleanItem = { ...item };
      delete cleanItem._source;
      delete cleanItem._key;
      delete cleanItem._id;

      // Guardar en Firebase
      if (moduleName === 'operadores') {
        // Para operadores, usar el método específico según el tipo
        if (item.tipoGasto || item.tipo === 'gasto') {
          const gastoId = `gasto_${id}`;
          await repo.save(gastoId, cleanItem);
        } else if (item.tipoIncidencia || item.tipo === 'incidencia') {
          const incidenciaId = `incidencia_${id}`;
          await repo.save(incidenciaId, cleanItem);
        }
      } else if (moduleName === 'logistica') {
        await repo.saveRegistro(id, cleanItem);
      } else {
        await repo.save(id, cleanItem);
      }

      console.log(`✅ Sincronizado a Firebase: ${moduleName}/${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sincronizando a Firebase ${moduleName}/${id}:`, error);
      return false;
    }
  }

  /**
   * Sincronizar un item a localStorage
   */
  async syncToLocalStorage(item, moduleName, id) {
    try {
      const storageKeys = {
        logistica: 'erp_shared_data',
        trafico: 'erp_shared_data',
        facturacion: 'erp_shared_data',
        operadores: item.tipoGasto ? 'erp_operadores_gastos' : 'erp_operadores_incidencias',
        diesel: 'erp_diesel_movimientos',
        mantenimiento: 'erp_mantenimiento',
        tesoreria: 'erp_tesoreria_movimientos',
        cxc: 'erp_cxc_data',
        cxp: 'erp_cxp_data',
        inventario: 'erp_inventario'
      };

      const key = storageKeys[moduleName];
      if (!key) {
        console.warn(`⚠️ No hay clave de almacenamiento definida para ${moduleName}`);
        return false;
      }

      // Limpiar metadatos
      const cleanItem = { ...item };
      delete cleanItem._source;
      delete cleanItem._id;

      if (key === 'erp_shared_data') {
        // Manejar erp_shared_data
        const sharedData = JSON.parse(localStorage.getItem(key) || '{}');

        if (moduleName === 'logistica') {
          sharedData.registros = sharedData.registros || {};
          sharedData.registros[id] = cleanItem;
        } else if (moduleName === 'trafico') {
          sharedData.trafico = sharedData.trafico || {};
          sharedData.trafico[id] = cleanItem;
        } else if (moduleName === 'facturacion') {
          sharedData.facturas = sharedData.facturas || {};
          sharedData.facturas[id] = cleanItem;
        }

        localStorage.setItem(key, JSON.stringify(sharedData));
      } else {
        // Manejar arrays
        const rawData = localStorage.getItem(key);
        let existing = [];

        if (rawData) {
          try {
            const parsed = JSON.parse(rawData);
            // Asegurar que sea un array
            if (Array.isArray(parsed)) {
              existing = parsed;
            } else if (typeof parsed === 'object' && parsed !== null) {
              // Si es un objeto, convertirlo a array de valores
              existing = Object.values(parsed);
              console.warn(`⚠️ ${moduleName}: localStorage contenía un objeto, convertido a array`);
            } else {
              console.warn(
                `⚠️ ${moduleName}: Formato inesperado en localStorage, inicializando como array vacío`
              );
              existing = [];
            }
          } catch (e) {
            console.warn(
              `⚠️ ${moduleName}: Error parseando localStorage, inicializando como array vacío:`,
              e
            );
            existing = [];
          }
        }

        const existingIds = new Set(
          existing.map(i => String(i.id || i.numeroRegistro || i.registroId || i.gastoId))
        );

        if (!existingIds.has(String(id))) {
          existing.push(cleanItem);
          localStorage.setItem(key, JSON.stringify(existing));
        }
      }

      console.log(`✅ Sincronizado a localStorage: ${moduleName}/${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sincronizando a localStorage ${moduleName}/${id}:`, error);
      return false;
    }
  }

  /**
   * Agregar a la cola de sincronización
   */
  addToSyncQueue(moduleName, inconsistency = null) {
    const queueItem = {
      module: moduleName,
      inconsistency: inconsistency,
      retries: 0,
      timestamp: Date.now()
    };

    this.syncQueue.push(queueItem);
    console.log(`📋 Agregado a cola de sincronización: ${moduleName}`);
  }

  /**
   * Procesar cola de sincronización
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0) {
      return;
    }

    console.log(`🔄 Procesando cola de sincronización (${this.syncQueue.length} items)...`);

    const itemsToRetry = [];

    for (const item of this.syncQueue) {
      if (item.retries >= this.maxRetries) {
        console.warn(`⚠️ Item ${item.module} excedió máximo de reintentos, removiendo de cola`);
        continue;
      }

      try {
        if (item.inconsistency) {
          await this.resolveInconsistencies([item.inconsistency], item.module);
        } else {
          await this.syncModule(item.module);
        }

        console.log(`✅ Item ${item.module} sincronizado exitosamente`);
      } catch (error) {
        item.retries++;
        itemsToRetry.push(item);
        console.warn(
          `⚠️ Error en reintento ${item.retries}/${this.maxRetries} para ${item.module}:`,
          error
        );
      }
    }

    // Actualizar cola con items que necesitan reintento
    this.syncQueue = itemsToRetry;
  }

  /**
   * Iniciar sincronización periódica
   */
  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sincronizar cada 5 minutos (300,000 ms) para reducir lecturas de Firebase
    // ANTES: cada 30 segundos = ~1,440,000 lecturas/día
    // AHORA: cada 5 minutos = ~144,000 lecturas/día (90% reducción)
    this.syncInterval = setInterval(() => {
      if (!this.isSyncing) {
        this.syncAllModules();
      }
    }, 300000); // 5 minutos = 300,000 ms

    console.log('✅ Sincronización periódica iniciada (cada 5 minutos)');
  }

  /**
   * Detener sincronización periódica
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Sincronización periódica detenida');
    }
  }

  /**
   * Forzar sincronización inmediata de un módulo
   */
  async forceSyncModule(moduleName) {
    console.log(`🔄 Forzando sincronización de ${moduleName}...`);
    await this.syncModule(moduleName);
  }
}

// Crear instancia global
window.SyncManager = SyncManager;
window.syncManager = new SyncManager();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.syncManager.init();
  });
} else {
  window.syncManager.init();
}

console.log('✅ SyncManager cargado');
