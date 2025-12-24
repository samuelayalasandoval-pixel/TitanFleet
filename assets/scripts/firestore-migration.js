// TitanFleet - Firestore Migration Helper
// Write-through: localStorage + Firestore con tenantId

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Obtener tenantId del usuario actual
function getCurrentTenantId() {
  try {
    const user = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
    return user?.tenantId || 'demo';
  } catch (_) {
    return 'demo';
  }
}

// Obtener instancia de Firestore
function getDb() {
  return window.firebaseDb || getFirestore(window.firebaseApp);
}

// Helper para escribir en Firestore con tenantId
async function writeToFirestore(collectionName, docId, data) {
  try {
    const db = getDb();
    const tenantId = getCurrentTenantId();
    const docRef = doc(db, collectionName, docId);

    const docData = {
      ...data,
      tenantId,
      updatedAt: new Date().toISOString(),
      updatedBy: JSON.parse(localStorage.getItem('erpCurrentUser') || '{}')?.email || 'unknown'
    };

    await setDoc(docRef, docData, { merge: true });
    console.log(`✅ Firestore write: ${collectionName}/${docId}`);
    return true;
  } catch (error) {
    console.error(`❌ Firestore write error: ${collectionName}/${docId}`, error);
    return false;
  }
}

// Helper para leer desde Firestore con tenantId
async function readFromFirestore(collectionName, filters = {}) {
  try {
    const db = getDb();
    const tenantId = getCurrentTenantId();
    const collectionRef = collection(db, collectionName);

    let q = query(collectionRef, where('tenantId', '==', tenantId));

    if (filters.orderBy) {
      q = query(q, orderBy(filters.orderBy, filters.orderDirection || 'desc'));
    }

    const snapshot = await getDocs(q);
    const results = [];

    snapshot.forEach(doc => {
      results.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Firestore read: ${collectionName} (${results.length} docs)`);
    return results;
  } catch (error) {
    console.error(`❌ Firestore read error: ${collectionName}`, error);
    return [];
  }
}

// ===== LOGÍSTICA =====
window.saveLogisticaToFirestore = async function (registroId, data) {
  // Guardar en localStorage (mantener compatibilidad)
  const existing = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
  existing.registros = existing.registros || {};
  existing.registros[registroId] = {
    ...data,
    fechaCreacion: new Date().toISOString(),
    ultimaActualizacion: new Date().toISOString()
  };
  localStorage.setItem('erp_shared_data', JSON.stringify(existing));

  // Escribir en Firestore
  return writeToFirestore('logistica', registroId, {
    ...data,
    tipo: 'logistica',
    fechaCreacion: new Date().toISOString()
  });
};

window.loadLogisticaFromFirestore = async function () {
  const results = await readFromFirestore('logistica', { orderBy: 'fechaCreacion' });

  // Sincronizar con localStorage
  const existing = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
  existing.registros = {};

  results.forEach(doc => {
    existing.registros[doc.id] = doc;
  });

  localStorage.setItem('erp_shared_data', JSON.stringify(existing));
  return results;
};

// ===== TRÁFICO =====
window.saveTraficoToFirestore = async function (registroId, data) {
  // Guardar en localStorage
  const existing = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
  existing.trafico = existing.trafico || {};
  existing.trafico[registroId] = {
    ...data,
    fechaCreacion: new Date().toISOString(),
    ultimaActualizacion: new Date().toISOString()
  };
  localStorage.setItem('erp_shared_data', JSON.stringify(existing));

  // Escribir en Firestore
  return writeToFirestore('trafico', registroId, {
    ...data,
    tipo: 'trafico',
    fechaCreacion: new Date().toISOString()
  });
};

window.loadTraficoFromFirestore = async function () {
  const results = await readFromFirestore('trafico', { orderBy: 'fechaCreacion' });

  // Sincronizar con localStorage
  const existing = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
  existing.trafico = {};

  results.forEach(doc => {
    existing.trafico[doc.id] = doc;
  });

  localStorage.setItem('erp_shared_data', JSON.stringify(existing));
  return results;
};

// ===== FACTURACIÓN =====
window.saveFacturacionToFirestore = async function (registroId, data) {
  // Guardar en localStorage
  const existing = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
  existing.facturas = existing.facturas || {};
  existing.facturas[registroId] = {
    ...data,
    fechaCreacion: new Date().toISOString(),
    ultimaActualizacion: new Date().toISOString()
  };
  localStorage.setItem('erp_shared_data', JSON.stringify(existing));

  // Escribir en Firestore
  return writeToFirestore('facturacion', registroId, {
    ...data,
    tipo: 'facturacion',
    fechaCreacion: new Date().toISOString()
  });
};

window.loadFacturacionFromFirestore = async function () {
  const results = await readFromFirestore('facturacion', { orderBy: 'fechaCreacion' });

  // Sincronizar con localStorage
  const existing = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
  existing.facturas = {};

  results.forEach(doc => {
    existing.facturas[doc.id] = doc;
  });

  localStorage.setItem('erp_shared_data', JSON.stringify(existing));
  return results;
};

// ===== DIESEL =====
window.saveDieselToFirestore = async function (registroId, data) {
  // Guardar en localStorage
  const existing = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
  const movimientos = Array.isArray(existing) ? existing : [];

  const nuevoMovimiento = {
    id: registroId,
    ...data,
    fechaCreacion: new Date().toISOString()
  };

  // Actualizar o agregar
  const index = movimientos.findIndex(m => m.id === registroId);
  if (index >= 0) {
    movimientos[index] = nuevoMovimiento;
  } else {
    movimientos.push(nuevoMovimiento);
  }

  localStorage.setItem('erp_diesel_movimientos', JSON.stringify(movimientos));

  // Escribir en Firestore
  return writeToFirestore('diesel', registroId, {
    ...data,
    tipo: 'diesel',
    fechaCreacion: new Date().toISOString()
  });
};

window.loadDieselFromFirestore = async function () {
  const results = await readFromFirestore('diesel', { orderBy: 'fechaCreacion' });

  // Sincronizar con localStorage
  const movimientos = results.map(doc => ({
    id: doc.id,
    ...doc
  }));

  localStorage.setItem('erp_diesel_movimientos', JSON.stringify(movimientos));
  return results;
};

// ===== MIGRACIÓN MASIVA =====
window.migrateAllToFirestore = async function () {
  console.log('🚀 Iniciando migración masiva a Firestore...');

  const results = {
    logistica: 0,
    trafico: 0,
    facturacion: 0,
    diesel: 0,
    errors: []
  };

  try {
    // Migrar Logística
    const logisticaData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    if (logisticaData.registros) {
      for (const [id, data] of Object.entries(logisticaData.registros)) {
        const success = await writeToFirestore('logistica', id, {
          ...data,
          tipo: 'logistica',
          migratedAt: new Date().toISOString()
        });
        if (success) {
          results.logistica++;
        } else {
          results.errors.push(`logistica/${id}`);
        }
      }
    }

    // Migrar Tráfico
    if (logisticaData.trafico) {
      for (const [id, data] of Object.entries(logisticaData.trafico)) {
        const success = await writeToFirestore('trafico', id, {
          ...data,
          tipo: 'trafico',
          migratedAt: new Date().toISOString()
        });
        if (success) {
          results.trafico++;
        } else {
          results.errors.push(`trafico/${id}`);
        }
      }
    }

    // Migrar Facturación
    if (logisticaData.facturas) {
      for (const [id, data] of Object.entries(logisticaData.facturas)) {
        const success = await writeToFirestore('facturacion', id, {
          ...data,
          tipo: 'facturacion',
          migratedAt: new Date().toISOString()
        });
        if (success) {
          results.facturacion++;
        } else {
          results.errors.push(`facturacion/${id}`);
        }
      }
    }

    // Migrar Diesel
    const dieselData = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
    if (Array.isArray(dieselData)) {
      for (const data of dieselData) {
        const id = data.id || `diesel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const success = await writeToFirestore('diesel', id, {
          ...data,
          tipo: 'diesel',
          migratedAt: new Date().toISOString()
        });
        if (success) {
          results.diesel++;
        } else {
          results.errors.push(`diesel/${id}`);
        }
      }
    }

    console.log('✅ Migración completada:', results);
    return results;
  } catch (error) {
    console.error('❌ Error en migración masiva:', error);
    results.errors.push(`migration_error: ${error.message}`);
    return results;
  }
};

// ===== SINCRONIZACIÓN BIDIRECCIONAL =====
window.syncAllFromFirestore = async function () {
  console.log('🔄 Sincronizando todos los módulos desde Firestore...');

  try {
    const [logistica, trafico, facturacion, diesel] = await Promise.all([
      loadLogisticaFromFirestore(),
      loadTraficoFromFirestore(),
      loadFacturacionFromFirestore(),
      loadDieselFromFirestore()
    ]);

    console.log('✅ Sincronización completada:', {
      logistica: logistica.length,
      trafico: trafico.length,
      facturacion: facturacion.length,
      diesel: diesel.length
    });

    return { logistica, trafico, facturacion, diesel };
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return null;
  }
};

// Auto-cargar al inicializar
document.addEventListener('DOMContentLoaded', () => {
  // Cargar datos desde Firestore si no hay datos locales
  setTimeout(async () => {
    const hasLocalData =
      localStorage.getItem('erp_shared_data') || localStorage.getItem('erp_diesel_movimientos');
    if (!hasLocalData) {
      console.log('📥 No hay datos locales, cargando desde Firestore...');
      await syncAllFromFirestore();
    }
  }, 1000);
});

console.log('✅ Firestore Migration Helper cargado');
