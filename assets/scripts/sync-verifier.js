// SyncVerifier - Utilidad para verificar el estado de sincronización
// Muestra el estado de los datos en Firebase y localStorage

window.SyncVerifier = {
  /**
   * Verificar estado de sincronización de un módulo específico
   */
  async verifyModule(moduleName) {
    console.log(`\n🔍 === VERIFICANDO MÓDULO: ${moduleName.toUpperCase()} ===`);

    // 1. Obtener datos de localStorage
    const localData = this.getLocalStorageData(moduleName);
    console.log(`\n📦 localStorage (${moduleName}):`);
    console.log(`   - Total de registros: ${localData.length}`);
    if (localData.length > 0) {
      console.log(
        `   - IDs: ${localData.map(d => d.id || d.numeroRegistro || d.registroId || d.gastoId).join(', ')}`
      );
      console.log('   - Primer registro:', localData[0]);
    }

    // 2. Obtener datos de Firebase
    const firebaseData = await this.getFirebaseData(moduleName);
    console.log(`\n🔥 Firebase (${moduleName}):`);
    console.log(`   - Total de registros: ${firebaseData.length}`);
    if (firebaseData.length > 0) {
      console.log(
        `   - IDs: ${firebaseData.map(d => d.id || d.numeroRegistro || d.registroId || d.gastoId || d._id).join(', ')}`
      );
      console.log('   - Primer registro:', firebaseData[0]);
    }

    // 3. Comparar y detectar inconsistencias
    const inconsistencies = this.compareData(localData, firebaseData, moduleName);

    console.log('\n📊 RESUMEN:');
    console.log(`   - localStorage: ${localData.length} registros`);
    console.log(`   - Firebase: ${firebaseData.length} registros`);
    console.log(`   - Inconsistencias: ${inconsistencies.length}`);

    if (inconsistencies.length > 0) {
      console.log('\n⚠️ INCONSISTENCIAS DETECTADAS:');
      inconsistencies.forEach((inc, index) => {
        console.log(`   ${index + 1}. ${inc.type}: ID ${inc.id}`);
      });
    } else {
      console.log(`\n✅ Módulo ${moduleName} está sincronizado correctamente`);
    }

    return {
      module: moduleName,
      localCount: localData.length,
      firebaseCount: firebaseData.length,
      inconsistencies: inconsistencies,
      isSynced: inconsistencies.length === 0
    };
  },

  /**
   * Verificar todos los módulos
   */
  async verifyAll() {
    console.log('\n🔍 === VERIFICACIÓN COMPLETA DE SINCRONIZACIÓN ===\n');

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

    const results = [];

    for (const module of modules) {
      try {
        const result = await this.verifyModule(module);
        results.push(result);
      } catch (error) {
        console.error(`❌ Error verificando módulo ${module}:`, error);
        results.push({
          module: module,
          error: error.message,
          isSynced: false
        });
      }
    }

    // Resumen general
    console.log('\n\n📊 === RESUMEN GENERAL ===');
    const synced = results.filter(r => r.isSynced).length;
    const total = results.length;
    console.log(`   - Módulos sincronizados: ${synced}/${total}`);
    console.log(`   - Módulos con inconsistencias: ${total - synced}/${total}`);

    const totalLocal = results.reduce((sum, r) => sum + (r.localCount || 0), 0);
    const totalFirebase = results.reduce((sum, r) => sum + (r.firebaseCount || 0), 0);
    console.log(`   - Total registros localStorage: ${totalLocal}`);
    console.log(`   - Total registros Firebase: ${totalFirebase}`);

    return results;
  },

  /**
   * Obtener datos de localStorage
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
  },

  /**
   * Obtener datos de Firebase
   */
  async getFirebaseData(moduleName) {
    if (!window.firebaseRepos || !window.firebaseRepos[moduleName]) {
      return [];
    }

    try {
      const repo = window.firebaseRepos[moduleName];

      if (!repo.db || !repo.tenantId) {
        await repo.init();
      }

      if (!repo.db || !repo.tenantId) {
        return [];
      }

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
  },

  /**
   * Comparar datos y detectar inconsistencias
   */
  compareData(localData, firebaseData, moduleName) {
    const inconsistencies = [];
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

    // Encontrar datos solo en localStorage
    localData.forEach(item => {
      const id = String(item.id || item.numeroRegistro || item.registroId || item.gastoId);
      if (id && !firebaseIds.has(id)) {
        inconsistencies.push({
          type: 'missing_in_firebase',
          id: id,
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
          module: moduleName
        });
      }
    });

    return inconsistencies;
  },

  /**
   * Verificar un registro específico por ID
   */
  async verifyRecord(moduleName, recordId) {
    console.log(`\n🔍 Verificando registro ${recordId} en módulo ${moduleName}...`);

    // Buscar en localStorage
    const localData = this.getLocalStorageData(moduleName);
    const localRecord = localData.find(d => {
      const id = String(d.id || d.numeroRegistro || d.registroId || d.gastoId);
      return id === String(recordId);
    });

    // Buscar en Firebase
    const firebaseData = await this.getFirebaseData(moduleName);
    const firebaseRecord = firebaseData.find(d => {
      const id = String(d.id || d.numeroRegistro || d.registroId || d.gastoId || d._id);
      return id === String(recordId);
    });

    console.log('\n📦 localStorage:');
    if (localRecord) {
      console.log('   ✅ Registro encontrado');
      console.log('   - Datos:', localRecord);
    } else {
      console.log('   ❌ Registro NO encontrado');
    }

    console.log('\n🔥 Firebase:');
    if (firebaseRecord) {
      console.log('   ✅ Registro encontrado');
      console.log('   - Datos:', firebaseRecord);
    } else {
      console.log('   ❌ Registro NO encontrado');
    }

    const isSynced = (localRecord && firebaseRecord) || (!localRecord && !firebaseRecord);

    if (isSynced && localRecord && firebaseRecord) {
      console.log('\n✅ Registro está sincronizado correctamente');
    } else if (!localRecord && firebaseRecord) {
      console.log('\n⚠️ Registro solo está en Firebase, falta en localStorage');
    } else if (localRecord && !firebaseRecord) {
      console.log('\n⚠️ Registro solo está en localStorage, falta en Firebase');
    } else {
      console.log('\n❌ Registro no encontrado en ningún lugar');
    }

    return {
      recordId: recordId,
      module: moduleName,
      inLocalStorage: Boolean(localRecord),
      inFirebase: Boolean(firebaseRecord),
      isSynced: isSynced,
      localData: localRecord,
      firebaseData: firebaseRecord
    };
  }
};

console.log(
  '✅ SyncVerifier cargado. Usa window.SyncVerifier.verifyAll() para verificar todos los módulos'
);
console.log('   - window.SyncVerifier.verifyModule("logistica") - Verificar un módulo específico');
console.log(
  '   - window.SyncVerifier.verifyRecord("logistica", "2500001") - Verificar un registro específico'
);
