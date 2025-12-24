// Repositorios Firebase para todos los módulos - TitanFleet ERP

// Función para verificar si Firebase está listo
function isFirebaseReady() {
  return window.firebaseDb && window.fs && window.fs.doc && window.firebaseAuth !== undefined;
}

// Función para inicializar repositorios cuando todo esté disponible
(function initFirebaseRepos() {
  // Verificar si FirebaseRepoBase está disponible
  if (typeof window.FirebaseRepoBase === 'undefined') {
    // Reintentar después de un breve delay (silenciosamente)
    setTimeout(initFirebaseRepos, 100);
    return;
  }

  // Verificar si Firebase está completamente inicializado
  if (!isFirebaseReady()) {
    // Esperar al evento firebaseReady o verificar periódicamente
    if (window.firebaseReady) {
      // Firebase ya está listo pero puede haber un pequeño delay
      setTimeout(initFirebaseRepos, 100);
    } else {
      // Esperar al evento firebaseReady
      window.addEventListener('firebaseReady', initFirebaseRepos, { once: true });
      // Timeout de seguridad
      setTimeout(() => {
        if (!isFirebaseReady()) {
          console.warn('⏳ Esperando a que Firebase se inicialice...');
          setTimeout(initFirebaseRepos, 500);
        }
      }, 1000);
    }
    return;
  }

  // console.log('✅ Firebase y FirebaseRepoBase disponibles, creando repositorios...');
  const { FirebaseRepoBase } = window;

  // Repositorio para Logística
  class LogisticaRepo extends FirebaseRepoBase {
    constructor() {
      super('logistica');
    }

    async saveRegistro(registroId, data) {
      return this.save(registroId, {
        ...data,
        tipo: 'registro',
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    async getRegistro(registroId) {
      try {
        if (!this.db || !this.tenantId) {
          await this.init();
        }
        if (this.doc && this.getDoc && this.db) {
          const docRef = this.doc(this.db, this.collectionName, registroId);
          const docSnap = await this.getDoc(docRef);
          if (docSnap.exists()) {
            return docSnap.data();
          }
        }
        return null;
      } catch (error) {
        console.warn('⚠️ Error obteniendo registro:', error);
        return null;
      }
    }

    async getAllRegistros() {
      const all = await this.getAll();
      return all.filter(item => item.tipo === 'registro');
    }
  }

  // Repositorio para Tráfico
  class TraficoRepo extends FirebaseRepoBase {
    constructor() {
      super('trafico');
    }

    async saveRegistro(registroId, data) {
      return this.save(registroId, {
        ...data,
        tipo: 'registro',
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    async getAllRegistros() {
      try {
        const all = await this.getAll();
        console.log(`📊 TraficoRepo.getAllRegistros(): ${all.length} documentos totales`);

        const registros = all.filter(item => item.tipo === 'registro');
        console.log(`📊 TraficoRepo.getAllRegistros(): ${registros.length} registros filtrados`);

        // Log de diagnóstico si no hay registros pero hay documentos
        if (registros.length === 0 && all.length > 0) {
          console.warn('⚠️ Hay documentos pero ninguno tiene tipo="registro"');
          console.log(
            '📋 Tipos encontrados:',
            all.map(item => item.tipo || 'sin tipo')
          );
        }

        return registros;
      } catch (error) {
        console.error('❌ Error en TraficoRepo.getAllRegistros():', error);
        return [];
      }
    }
  }

  // Repositorio para Facturación
  class FacturacionRepo extends FirebaseRepoBase {
    constructor() {
      super('facturacion');
    }

    async saveFactura(facturaId, data) {
      return this.save(facturaId, {
        ...data,
        tipo: 'factura',
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    async getAllFacturas() {
      const all = await this.getAll();
      return all.filter(item => item.tipo === 'factura');
    }

    async getAllRegistros() {
      const all = await this.getAll();
      // Filtrar registros (tipo 'registro') en lugar de facturas
      return all.filter(item => item.tipo === 'registro' || !item.tipo);
    }
  }

  // Repositorio para Cuentas por Cobrar (CXC)
  class CXCRepo extends FirebaseRepoBase {
    constructor() {
      super('cxc');
    }

    async saveFactura(facturaId, data) {
      return this.save(facturaId, {
        ...data,
        tipo: 'factura',
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    async getAllFacturas() {
      const all = await this.getAll();
      return all.filter(item => item.tipo === 'factura');
    }
  }

  // Repositorio para Cuentas por Pagar (CXP)
  class CXPRepo extends FirebaseRepoBase {
    constructor() {
      super('cxp');
    }

    async saveFactura(facturaId, data) {
      // Prevenir guardado de registros problemáticos conocidos
      const idsProblematicos = this._getIdsProblematicos();
      if (idsProblematicos.some(problema => String(facturaId || '').includes(problema))) {
        console.warn(`🚫 Intento de guardar registro problemático bloqueado: ${facturaId}`);
        return false;
      }

      return this.save(facturaId, {
        ...data,
        tipo: 'factura',
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    async saveSolicitud(solicitudId, data) {
      return this.save(solicitudId, {
        ...data,
        tipo: 'solicitud',
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    _getIdsProblematicos() {
      try {
        const guardados = localStorage.getItem('cxp_ids_problematicos');
        if (guardados) {
          const parsed = JSON.parse(guardados);
          // Solo retornar si hay IDs guardados y es un array válido
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('⚠️ Error cargando IDs problemáticos:', e);
      }
      // No retornar valores hardcodeados por defecto - solo usar localStorage
      return [];
    }

    /**
     * Remueve un ID de la lista de IDs problemáticos
     * @param {string} id - ID a remover de la lista de problemáticos
     */
    removerIdProblematico(id) {
      if (!id || typeof id !== 'string') {
        console.warn('⚠️ ID inválido para remover de problemáticos:', id);
        return false;
      }

      try {
        const idsProblematicos = this._getIdsProblematicos();
        const idStr = String(id).trim();

        // Remover todas las variantes del ID
        const idsParaRemover = [idStr, `factura_${idStr}`, idStr.replace('factura_', '')];

        let removido = false;
        const listaActualizada = idsProblematicos.filter(problema => {
          const problemaStr = String(problema || '').trim();
          const deberiaRemover = idsParaRemover.some(
            remover =>
              problemaStr === remover ||
              problemaStr.includes(remover) ||
              remover.includes(problemaStr)
          );

          if (deberiaRemover) {
            removido = true;
            console.log(`✅ ID problemático removido: ${problemaStr}`);
            return false; // No incluir en la lista actualizada
          }
          return true; // Mantener en la lista
        });

        if (removido) {
          localStorage.setItem('cxp_ids_problematicos', JSON.stringify(listaActualizada));
          console.log(
            `✅ Lista de IDs problemáticos actualizada. Total restante: ${listaActualizada.length}`
          );
          return true;
        }
        console.log(`ℹ️ El ID ${idStr} no estaba en la lista de problemáticos`);
        return false;
      } catch (e) {
        console.error('❌ Error removiendo ID problemático:', e);
        return false;
      }
    }

    async getAllFacturas() {
      const all = await this.getAll();
      const facturas = all.filter(item => item.tipo === 'factura');

      // Filtrar registros problemáticos conocidos de CXP
      const idsProblematicos = this._getIdsProblematicos();
      return facturas.filter(item => {
        const itemId = String(item.id || '');
        const esProblematico = idsProblematicos.some(
          problema =>
            itemId === problema || itemId === `factura_${problema}` || itemId.includes(problema)
        );
        if (esProblematico) {
          console.warn(`🚫 Factura problemática filtrada en getAllFacturas: ${itemId}`);
          console.log('💡 Para remover este ID de la lista de problemáticos, ejecuta en consola:');
          console.log(`   window.firebaseRepos.cxp.removerIdProblematico('${itemId}')`);
          // NO intentar eliminarla automáticamente - solo filtrarla
          // Si el usuario quiere eliminarla, debe hacerlo manualmente
        }
        return !esProblematico;
      });
    }

    async getAllSolicitudes() {
      const all = await this.getAll();
      return all.filter(item => item.tipo === 'solicitud');
    }
  }

  // Repositorio para Diesel
  class DieselRepo extends FirebaseRepoBase {
    constructor() {
      super('diesel');
    }

    async saveMovimiento(movimientoId, data) {
      return this.save(movimientoId, {
        ...data,
        tipo: 'movimiento',
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    async getAllMovimientos() {
      const all = await this.getAll();
      return all.filter(item => item.tipo === 'movimiento');
    }
  }

  // Repositorio para Mantenimiento
  class MantenimientoRepo extends FirebaseRepoBase {
    constructor() {
      super('mantenimiento');
    }

    async saveRegistro(registroId, data) {
      return this.save(registroId, {
        ...data,
        tipo: 'registro',
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    async getAllRegistros() {
      const all = await this.getAll();
      return all.filter(item => item.tipo === 'registro');
    }
  }

  // Repositorio para Tesorería
  class TesoreriaRepo extends FirebaseRepoBase {
    constructor() {
      super('tesoreria');
    }

    async saveMovimiento(movimientoId, data) {
      return this.save(movimientoId, {
        ...data,
        // Preservar el tipo original (ingreso/egreso) si existe, de lo contrario usar 'movimiento'
        tipo: data.tipo || 'movimiento',
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    async saveOrdenPago(ordenId, data) {
      return this.save(ordenId, {
        ...data,
        tipo: 'orden_pago',
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    async getAllMovimientos() {
      const all = await this.getAll();
      // Incluir movimientos de tipo 'movimiento', 'ingreso', 'egreso' y movimientos con origen 'CXC' o 'CXP'
      return all.filter(
        item =>
          item.tipo === 'movimiento' ||
          item.tipo === 'ingreso' ||
          item.tipo === 'egreso' ||
          item.origen === 'CXC' ||
          item.origen === 'CXP'
      );
    }

    async getAllOrdenesPago() {
      const all = await this.getAll();
      console.log(`📊 getAllOrdenesPago: ${all.length} items totales en tesorería`);

      // Log detallado de TODOS los items para diagnóstico
      if (all.length > 0) {
        console.log(
          '📋 Todos los items en tesorería:',
          all.map(item => ({
            id: item.id,
            tipo: item.tipo || 'SIN TIPO',
            solicitudId: item.solicitudId || 'N/A',
            proveedor: item.proveedor || 'N/A',
            monto: item.monto || 'N/A',
            estado: item.estado || 'N/A',
            tieneProveedor: Boolean(item.proveedor),
            tieneMonto: item.monto !== undefined,
            tieneSolicitudId: Boolean(item.solicitudId)
          }))
        );
      }

      // Filtrar órdenes de pago:
      // 1. Items con tipo 'orden_pago'
      // 2. Items con solicitudId (vienen de CXP) - PERO excluir movimientos (egreso/ingreso)
      // 3. Items con campos típicos de orden de pago (proveedor, monto) pero sin tipo - PERO excluir movimientos
      const ordenes = all
        .filter(item => {
          // EXCLUIR movimientos explícitamente (egreso, ingreso, movimiento)
          if (item.tipo === 'egreso' || item.tipo === 'ingreso' || item.tipo === 'movimiento') {
            console.log(`❌ Item ${item.id} excluido: es un movimiento (${item.tipo})`);
            return false;
          }

          // EXCLUIR items que tienen origen 'CXP' o 'CXC' y son movimientos
          // Los movimientos tienen: categoria, descripcion con [CXP] o [CXC], identificador, ordenPagoId
          if (item.origen === 'CXP' || item.origen === 'CXC') {
            // Si tiene ordenPagoId, es un movimiento relacionado con una orden, no una orden
            if (item.ordenPagoId) {
              console.log(
                `❌ Item ${item.id} excluido: es un movimiento relacionado con orden ${item.ordenPagoId}`
              );
              return false;
            }
            // Si tiene categoria o identificador, es un movimiento
            if (item.categoria || item.identificador) {
              console.log(
                `❌ Item ${item.id} excluido: es un movimiento (tiene categoria o identificador)`
              );
              return false;
            }
            // Si tiene descripcion con [CXP] o [CXC], es un movimiento
            if (
              item.descripcion &&
              (item.descripcion.includes('[CXP]') || item.descripcion.includes('[CXC]'))
            ) {
              console.log(
                `❌ Item ${item.id} excluido: es un movimiento (descripcion contiene [CXP] o [CXC])`
              );
              return false;
            }
          }

          // Si tiene tipo 'orden_pago', incluirlo
          if (item.tipo === 'orden_pago') {
            console.log(`✅ Item ${item.id} incluido: tiene tipo 'orden_pago'`);
            return true;
          }

          // Si tiene solicitudId Y NO es un movimiento, es una orden de CXP, incluirlo
          if (item.solicitudId) {
            // Verificar que no sea un movimiento verificando si tiene campos típicos de movimiento
            const esMovimiento =
              item.categoria ||
              item.identificador ||
              item.ordenPagoId ||
              (item.descripcion &&
                (item.descripcion.includes('[CXP]') || item.descripcion.includes('[CXC]')));
            if (!esMovimiento) {
              console.log(
                `✅ Item ${item.id} incluido: tiene solicitudId (${item.solicitudId}) y no es movimiento`
              );
              return true;
            }
            console.log(`❌ Item ${item.id} excluido: tiene solicitudId pero es un movimiento`);
            return false;
          }

          // Si tiene campos típicos de orden de pago pero sin tipo, incluirlo (solo si no es movimiento)
          if (item.proveedor && item.monto !== undefined && !item.tipo) {
            const esMovimiento =
              item.categoria ||
              item.identificador ||
              item.ordenPagoId ||
              (item.descripcion &&
                (item.descripcion.includes('[CXP]') || item.descripcion.includes('[CXC]')));
            if (!esMovimiento) {
              console.log(
                `✅ Item ${item.id} incluido: tiene proveedor y monto pero sin tipo (no es movimiento)`
              );
              return true;
            }
            console.log(
              `❌ Item ${item.id} excluido: tiene proveedor y monto pero es un movimiento`
            );
            return false;
          }

          console.log(`❌ Item ${item.id} excluido:`, {
            tipo: item.tipo || 'SIN TIPO',
            tieneSolicitudId: Boolean(item.solicitudId),
            tieneProveedor: Boolean(item.proveedor),
            tieneMonto: item.monto !== undefined,
            tieneCategoria: Boolean(item.categoria),
            tieneOrdenPagoId: Boolean(item.ordenPagoId),
            tieneIdentificador: Boolean(item.identificador),
            origen: item.origen || 'N/A'
          });
          return false;
        })
        .map(item => {
          // Asegurar que todas las órdenes tengan el tipo correcto
          if (!item.tipo) {
            item.tipo = 'orden_pago';
          }
          return item;
        });

      // Log detallado
      const ordenesConSolicitudId = ordenes.filter(o => o.solicitudId);
      console.log(
        `📊 getAllOrdenesPago: ${ordenes.length} órdenes encontradas (${ordenesConSolicitudId.length} de CXP)`
      );
      if (ordenesConSolicitudId.length > 0) {
        console.log(
          '📋 Órdenes de CXP encontradas:',
          ordenesConSolicitudId.map(o => ({
            id: o.id,
            solicitudId: o.solicitudId,
            proveedor: o.proveedor,
            monto: o.monto,
            estado: o.estado
          }))
        );
      }

      return ordenes;
    }
  }

  // Repositorio para Operadores
  class OperadoresRepo extends FirebaseRepoBase {
    constructor() {
      super('operadores');
    }

    async saveGasto(gastoId, data) {
      return this.save(gastoId, {
        ...data,
        tipo: 'gasto',
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    async saveIncidencia(incidenciaId, data) {
      return this.save(incidenciaId, {
        ...data,
        tipo: 'incidencia',
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    async getAllGastos() {
      const all = await this.getAll();
      return all.filter(item => item.tipo === 'gasto');
    }

    async getAllIncidencias() {
      const all = await this.getAll();
      return all.filter(item => item.tipo === 'incidencia');
    }
  }

  // Repositorio para Inventario
  class InventarioRepo extends FirebaseRepoBase {
    constructor() {
      super('inventario');
    }

    async saveMovimiento(movimientoId, data) {
      // Preservar el tipo original del movimiento (entrada/salida) si existe
      // Solo usar 'movimiento' como tipo si no se especifica uno válido
      const tipoMovimiento =
        data.tipo && (data.tipo === 'entrada' || data.tipo === 'salida')
          ? data.tipo
          : data.tipo || 'movimiento';

      return this.save(movimientoId, {
        ...data,
        tipo: tipoMovimiento,
        tipoDocumento: 'movimiento', // Agregar tipoDocumento para identificar que es un movimiento de inventario
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    async saveStock(codigo, data) {
      return this.save(`stock_${codigo}`, {
        ...data,
        tipo: 'stock',
        codigo: codigo,
        fechaCreacion: data.fechaCreacion || new Date().toISOString()
      });
    }

    async getAllMovimientos() {
      const all = await this.getAll();
      // Filtrar movimientos: pueden ser tipo 'movimiento' o tener tipoDocumento 'movimiento'
      // También incluir 'entrada' y 'salida' que son movimientos de inventario
      return all.filter(
        item =>
          item.tipo === 'movimiento' ||
          item.tipoDocumento === 'movimiento' ||
          item.tipo === 'entrada' ||
          item.tipo === 'salida'
      );
    }

    async getAllStock() {
      const all = await this.getAll();
      return all.filter(item => item.tipo === 'stock');
    }
  }

  // Repositorio para Blog
  class BlogRepo extends FirebaseRepoBase {
    constructor() {
      super('blog');
    }

    async savePost(postId, data) {
      return this.save(postId, {
        ...data,
        tipo: 'entrada',
        fechaCreacion: data.fechaCreacion || new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      });
    }

    async getAllPosts() {
      const all = await this.getAll();
      return all.filter(item => item.tipo === 'entrada' || !item.tipo);
    }
  }

  // Inicializar repositorios globales
  try {
    // console.log('🔄 Inicializando repositorios Firebase...');
    // console.log('  - FirebaseRepoBase disponible:', typeof FirebaseRepoBase !== 'undefined' || typeof window.FirebaseRepoBase !== 'undefined');

    window.firebaseRepos = {
      logistica: new LogisticaRepo(),
      trafico: new TraficoRepo(),
      facturacion: new FacturacionRepo(),
      cxc: new CXCRepo(),
      cxp: new CXPRepo(),
      diesel: new DieselRepo(),
      mantenimiento: new MantenimientoRepo(),
      tesoreria: new TesoreriaRepo(),
      operadores: new OperadoresRepo(),
      inventario: new InventarioRepo(),
      blog: new BlogRepo()
    };

    console.log('✅ Repositorios Firebase inicializados para todos los módulos');
    console.log('  - Repositorios creados:', Object.keys(window.firebaseRepos));
  } catch (error) {
    console.error('❌ Error inicializando repositorios Firebase:', error);
    console.error('Stack:', error.stack);
    // Crear objeto vacío para evitar errores
    window.firebaseRepos = window.firebaseRepos || {};
  }
})(); // Cerrar la función auto-ejecutable

// Crear promesa que se resuelve cuando los repositorios estén listos
window.__firebaseReposReady = new Promise(resolve => {
  let checks = 0;
  // Esperar a que al menos el repositorio de logística esté listo
  const checkReady = setInterval(() => {
    checks++;
    const hasDb = Boolean(window.firebaseRepos?.logistica?.db);
    const hasTenantId = Boolean(window.firebaseRepos?.logistica?.tenantId);

    if (checks % 10 === 0) {
      console.log(`🔄 Verificando repositorios (intento ${checks}):`, { hasDb, hasTenantId });
    }

    if (hasDb && hasTenantId) {
      clearInterval(checkReady);
      console.log('✅ __firebaseReposReady resuelto (db y tenantId listos)');
      resolve(true);
    }
  }, 100);

  // Timeout de seguridad (10 segundos)
  setTimeout(() => {
    clearInterval(checkReady);
    const hasDb = Boolean(window.firebaseRepos?.logistica?.db);
    const hasTenantId = Boolean(window.firebaseRepos?.logistica?.tenantId);

    // Solo mostrar warning si realmente no están listos
    if (!hasDb || !hasTenantId) {
      console.warn(`⚠️ Timeout esperando repositorios después de ${checks} intentos`);
      console.warn(`   Estado final: db=${hasDb}, tenantId=${hasTenantId}`);
    } else {
      // Si están listos, solo log informativo
      // console.log(`✅ Repositorios listos después de ${checks} intentos (db=${hasDb}, tenantId=${hasTenantId})`);
    }

    // Resolver de todos modos para no bloquear la página
    resolve(hasDb);
  }, 10000);
});

/**
 * Helper centralizado para esperar a que un repositorio específico esté listo
 * Evita race conditions y proporciona manejo consistente de inicialización
 *
 * @param {string} repoName - Nombre del repositorio (ej: 'logistica', 'cxp', 'facturacion')
 * @param {Object} options - Opciones de espera
 * @param {number} options.timeout - Timeout en ms (default: 10000)
 * @param {boolean} options.autoInit - Inicializar automáticamente si no está listo (default: true)
 * @returns {Promise<boolean>} - true si el repositorio está listo, false si timeout
 */
window.waitForRepo = async function (repoName, options = {}) {
  const { timeout = 10000, autoInit = true } = options;

  // Verificar que el repositorio exista
  if (!window.firebaseRepos || !window.firebaseRepos[repoName]) {
    console.warn(`⚠️ Repositorio '${repoName}' no existe en window.firebaseRepos`);
    return false;
  }

  const repo = window.firebaseRepos[repoName];

  // Si ya está inicializado y tiene db y tenantId, retornar inmediatamente
  if (repo.db && repo.tenantId && repo._initialized) {
    return true;
  }

  // Intentar inicializar si autoInit está habilitado
  if (autoInit && typeof repo.init === 'function') {
    try {
      // Usar _initPromise si existe para evitar múltiples inicializaciones simultáneas
      if (repo._initPromise) {
        await repo._initPromise;
      } else {
        await repo.init();
      }
    } catch (error) {
      console.warn(`⚠️ Error inicializando repositorio '${repoName}':`, error);
    }
  }

  // Verificar periódicamente si está listo
  const startTime = Date.now();
  const checkInterval = 100; // Verificar cada 100ms

  return new Promise(resolve => {
    const checkReady = setInterval(() => {
      const hasDb = Boolean(repo.db);
      const hasTenantId = Boolean(repo.tenantId);
      const elapsed = Date.now() - startTime;

      if (hasDb && hasTenantId) {
        clearInterval(checkReady);
        resolve(true);
      } else if (elapsed >= timeout) {
        clearInterval(checkReady);
        console.warn(
          `⚠️ Timeout esperando repositorio '${repoName}' después de ${timeout}ms (db=${hasDb}, tenantId=${hasTenantId})`
        );
        resolve(false);
      }
    }, checkInterval);

    // Verificar inmediatamente también
    if (repo.db && repo.tenantId) {
      clearInterval(checkReady);
      resolve(true);
    }
  });
};

/**
 * Helper para esperar múltiples repositorios a la vez
 *
 * @param {string[]} repoNames - Array de nombres de repositorios
 * @param {Object} options - Opciones (mismo formato que waitForRepo)
 * @returns {Promise<Object>} - Objeto con resultado de cada repositorio
 */
window.waitForRepos = async function (repoNames, options = {}) {
  const results = {};

  await Promise.all(
    repoNames.map(async repoName => {
      results[repoName] = await window.waitForRepo(repoName, options);
    })
  );

  return results;
};

console.log('✅ Helpers waitForRepo y waitForRepos disponibles');
