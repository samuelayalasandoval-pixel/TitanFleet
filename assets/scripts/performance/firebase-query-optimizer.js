/**
 * Firebase Query Optimizer
 * Optimiza las consultas a Firebase con paginación, límites y caché
 */

class FirebaseQueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
    this.defaultPageSize = 50;
    this.maxPageSize = 100;
  }

  /**
   * Obtiene todos los documentos con paginación
   * @param {Object} repo - Instancia del repositorio Firebase
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Array>} - Array de documentos
   */
  async getAllPaginated(repo, options = {}) {
    const {
      pageSize = this.defaultPageSize,
      page = 1,
      useCache = true,
      filters = [],
      orderBy = null,
      orderDirection = 'desc'
    } = options;

    // Validar tamaño de página
    const validPageSize = Math.min(Math.max(1, pageSize), this.maxPageSize);
    const cacheKey = this._generateCacheKey(repo.collectionName, {
      pageSize: validPageSize,
      page,
      filters,
      orderBy,
      orderDirection
    });

    // Verificar caché
    if (useCache && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        if (window.DEBUG_PERFORMANCE) {
          console.log(`✅ Consulta desde caché: ${repo.collectionName} (página ${page})`);
        }
        return cached.data;
      }
      this.queryCache.delete(cacheKey);
    }

    try {
      // Verificar que el usuario esté autenticado antes de hacer consultas
      if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
        console.warn(
          `⚠️ Usuario no autenticado, no se puede ejecutar consulta paginada para ${repo.collectionName}`
        );
        // Retornar array vacío si no hay autenticación
        return [];
      }

      if (!repo.db || !repo.tenantId) {
        await repo.init();
      }

      // Construir consulta base
      const collectionRef = repo.collection(repo.db, repo.collectionName);
      let q = repo.query(
        collectionRef,
        repo.where('tenantId', '==', repo.tenantId),
        repo.where('deleted', '==', false)
      );

      // Aplicar filtros adicionales
      filters.forEach(filter => {
        q = repo.query(q, repo.where(filter.field, filter.operator, filter.value));
      });

      // Aplicar ordenamiento si está disponible
      if (orderBy && repo.orderBy) {
        q = repo.query(q, repo.orderBy(repo.orderBy, orderDirection));
      }

      // Aplicar límite y offset para paginación
      if (repo.limit && repo.startAfter) {
        const limit = repo.limit(validPageSize);
        q = repo.query(q, limit);

        // Si no es la primera página, necesitamos el último documento de la página anterior
        // Por simplicidad, cargamos todos y paginamos en memoria
        // En producción, deberías usar startAfter con el último documento
      }

      const snapshot = await repo.getDocs(q);
      const documents = [];
      snapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });

      // Paginación en memoria (temporal - idealmente usar startAfter)
      const startIndex = (page - 1) * validPageSize;
      const endIndex = startIndex + validPageSize;
      const paginatedDocs = documents.slice(startIndex, endIndex);

      // Guardar en caché
      if (useCache) {
        this.queryCache.set(cacheKey, {
          data: paginatedDocs,
          timestamp: Date.now(),
          total: documents.length
        });
      }

      if (window.DEBUG_PERFORMANCE) {
        console.log(
          `✅ Consulta paginada: ${repo.collectionName} - ${paginatedDocs.length} documentos (página ${page}/${Math.ceil(documents.length / validPageSize)})`
        );
      }

      return paginatedDocs;
    } catch (error) {
      // Si es error de permisos, no es crítico - el usuario puede no estar autenticado aún
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        console.warn(
          `⚠️ Error de permisos en consulta paginada ${repo.collectionName} (usuario puede no estar autenticado):`,
          error
        );
        // Retornar array vacío como fallback
        return [];
      }
      console.error(`❌ Error en consulta paginada ${repo.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene documentos con límite (para listas iniciales)
   * @param {Object} repo - Instancia del repositorio Firebase
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Array>} - Array de documentos limitados
   */
  async getLimited(repo, options = {}) {
    const {
      limit = 20,
      useCache = true,
      filters = [],
      orderBy = 'fechaCreacion',
      orderDirection = 'desc'
    } = options;

    const cacheKey = this._generateCacheKey(repo.collectionName, {
      limit,
      filters,
      orderBy,
      orderDirection,
      type: 'limited'
    });

    // Verificar caché
    if (useCache && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        if (window.DEBUG_PERFORMANCE) {
          console.log(`✅ Consulta limitada desde caché: ${repo.collectionName}`);
        }
        return cached.data;
      }
      this.queryCache.delete(cacheKey);
    }

    try {
      // Verificar que el usuario esté autenticado antes de hacer consultas
      if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
        const warningKey = `no-auth-query-${repo.collectionName}`;
        if (window.FirebaseWarningManager?.shouldShowWarning(warningKey)) {
          console.debug(
            `⚠️ Usuario no autenticado, no se puede ejecutar consulta limitada para ${repo.collectionName}`
          );
        }
        // Retornar array vacío si no hay autenticación
        return [];
      }

      if (!repo.db || !repo.tenantId) {
        await repo.init();
      }

      const collectionRef = repo.collection(repo.db, repo.collectionName);

      // IMPORTANTE: Para evitar problemas de permisos con Firestore rules,
      // NO usar filtro de tenantId en la consulta. En su lugar, filtrar después.
      // Esto es necesario porque las reglas de Firestore no pueden evaluar
      // dinámicamente los where clauses en las consultas.
      let q = repo.query(collectionRef, repo.where('deleted', '==', false));

      // Aplicar filtros adicionales (excepto tenantId que se filtra después)
      filters.forEach(filter => {
        // No aplicar filtro de tenantId aquí, se filtra después
        if (filter.field !== 'tenantId') {
          q = repo.query(q, repo.where(filter.field, filter.operator, filter.value));
        }
      });

      // Aplicar ordenamiento
      if (orderBy && repo.orderBy) {
        q = repo.query(q, repo.orderBy(repo.orderBy, orderDirection));
      }

      // Aplicar límite
      if (repo.limit) {
        q = repo.query(q, repo.limit(limit));
      }

      const snapshot = await repo.getDocs(q);
      const documents = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const docTenantId = data.tenantId;

        // Filtrar por tenantId después de obtener los documentos
        // Usuario demo: permitir documentos sin tenantId o con tenantId demo/DEMO_CONFIG.tenantId
        // Otros usuarios: solo documentos con su tenantId
        const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        const isDemoUser = window.firebaseAuth?.currentUser?.email === 'demo@titanfleet.com';
        const shouldInclude = isDemoUser
          ? !docTenantId || docTenantId === 'demo' || docTenantId === demoTenantId
          : docTenantId === repo.tenantId;

        if (shouldInclude) {
          documents.push({ id: doc.id, ...data });
        }
      });

      // Guardar en caché
      if (useCache) {
        this.queryCache.set(cacheKey, {
          data: documents,
          timestamp: Date.now()
        });
      }

      if (window.DEBUG_PERFORMANCE) {
        console.log(
          `✅ Consulta limitada: ${repo.collectionName} - ${documents.length} documentos`
        );
      }

      return documents;
    } catch (error) {
      // Si es error de permisos, manejar de forma no crítica
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        // Si el usuario no está autenticado, retornar array vacío
        if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
          console.warn(
            `⚠️ Error de permisos en consulta limitada ${repo.collectionName} (usuario no autenticado):`,
            error
          );
          return [];
        }

        console.warn(
          `⚠️ Error de permisos en consulta limitada ${repo.collectionName}, intentando sin filtro de tenantId...`
        );

        // Solo para usuario demo, intentar sin filtro de tenantId
        if (window.firebaseAuth?.currentUser?.email === 'demo@titanfleet.com') {
          try {
            const collectionRef = repo.collection(repo.db, repo.collectionName);
            let qFallback = repo.query(collectionRef, repo.where('deleted', '==', false));

            // Aplicar filtros
            filters.forEach(filter => {
              qFallback = repo.query(
                qFallback,
                repo.where(filter.field, filter.operator, filter.value)
              );
            });

            // Aplicar ordenamiento
            if (orderBy && repo.orderBy) {
              qFallback = repo.query(qFallback, repo.orderBy(repo.orderBy, orderDirection));
            }

            // Aplicar límite
            if (repo.limit) {
              qFallback = repo.query(qFallback, repo.limit(limit));
            }

            const snapshotFallback = await repo.getDocs(qFallback);
            const documentsFallback = [];
            snapshotFallback.forEach(doc => {
              const data = doc.data();
              // Filtrar solo documentos del tenant demo o sin tenantId
              const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
              if (!data.tenantId || data.tenantId === 'demo' || data.tenantId === demoTenantId) {
                documentsFallback.push({ id: doc.id, ...data });
              }
            });

            console.log(
              `✅ Consulta limitada (fallback): ${repo.collectionName} - ${documentsFallback.length} documentos`
            );
            return documentsFallback;
          } catch (fallbackError) {
            // Si el fallback también falla, retornar array vacío en lugar de lanzar error
            console.warn(
              `⚠️ Error en consulta limitada (fallback) ${repo.collectionName}:`,
              fallbackError
            );
            return [];
          }
        } else {
          // Para otros usuarios, retornar array vacío en lugar de lanzar error
          console.warn(
            `⚠️ Error de permisos en consulta limitada ${repo.collectionName}, retornando array vacío`
          );
          return [];
        }
      }

      console.error(`❌ Error en consulta limitada ${repo.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Invalida el caché de una colección
   * @param {string} collectionName - Nombre de la colección
   */
  invalidateCache(collectionName) {
    const keysToDelete = [];
    this.queryCache.forEach((value, key) => {
      if (key.startsWith(collectionName)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.queryCache.delete(key));

    if (window.DEBUG_PERFORMANCE) {
      console.log(`🗑️ Caché invalidado para: ${collectionName} (${keysToDelete.length} entradas)`);
    }
  }

  /**
   * Limpia todo el caché
   */
  clearCache() {
    this.queryCache.clear();
    if (window.DEBUG_PERFORMANCE) {
      console.log('🗑️ Caché de consultas limpiado');
    }
  }

  /**
   * Genera una clave de caché única
   */
  _generateCacheKey(collectionName, options) {
    const optionsStr = JSON.stringify(options);
    return `${collectionName}:${btoa(optionsStr)}`;
  }

  /**
   * Obtiene estadísticas del caché
   */
  getCacheStats() {
    const stats = {
      totalEntries: this.queryCache.size,
      collections: new Set(),
      oldestEntry: null,
      newestEntry: null
    };

    let oldestTime = Infinity;
    let newestTime = 0;

    this.queryCache.forEach((value, key) => {
      const collection = key.split(':')[0];
      stats.collections.add(collection);

      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        stats.oldestEntry = { key, timestamp: value.timestamp };
      }
      if (value.timestamp > newestTime) {
        newestTime = value.timestamp;
        stats.newestEntry = { key, timestamp: value.timestamp };
      }
    });

    stats.collections = Array.from(stats.collections);
    return stats;
  }
}

// Crear instancia global
window.FirebaseQueryOptimizer = new FirebaseQueryOptimizer();

// Limpiar caché automáticamente cada 10 minutos
setInterval(
  () => {
    const now = Date.now();
    window.FirebaseQueryOptimizer.queryCache.forEach((value, key) => {
      if (now - value.timestamp > window.FirebaseQueryOptimizer.cacheExpiry) {
        window.FirebaseQueryOptimizer.queryCache.delete(key);
      }
    });
  },
  10 * 60 * 1000
);
