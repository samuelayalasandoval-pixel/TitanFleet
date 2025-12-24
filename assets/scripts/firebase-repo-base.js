// Repositorio base para Firebase - TitanFleet ERP
// Proporciona funcionalidad común para todos los módulos

// Prevenir carga duplicada
if (window.FirebaseRepoBase) {
  console.warn('⚠️ firebase-repo-base.js ya está cargado, omitiendo carga duplicada');
} else {
  // OPTIMIZACIÓN: Cache de escrituras para evitar duplicados
  window.FirebaseWriteCache = {
    cache: new Map(), // Cache de escrituras recientes (id -> {data, timestamp})
    cacheTimeout: 5 * 60 * 1000, // 5 minutos

    shouldWrite(id, newData) {
      const cached = this.cache.get(id);
      if (!cached) {
        return true;
      }

      // Si pasaron más de 5 minutos, permitir escritura
      if (Date.now() - cached.timestamp > this.cacheTimeout) {
        this.cache.delete(id);
        return true;
      }

      // Comparar datos (ignorando metadata)
      const ignoreFields = [
        'updatedAt',
        'userId',
        'tenantId',
        'fechaActualizacion',
        'ultimaActualizacion'
      ];
      const cleanNew = { ...newData };
      const cleanCached = { ...cached.data };
      ignoreFields.forEach(field => {
        delete cleanNew[field];
        delete cleanCached[field];
      });

      const areEqual = JSON.stringify(cleanNew) === JSON.stringify(cleanCached);
      if (areEqual) {
        // console.log(`⏭️ Escritura omitida (cache): ${id} no ha cambiado en los últimos 5 minutos`);
        return false;
      }

      return true;
    },

    markWritten(id, data) {
      this.cache.set(id, {
        data: { ...data },
        timestamp: Date.now()
      });

      // Limpiar cache antiguo periódicamente
      if (this.cache.size > 100) {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
          if (now - value.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
          }
        }
      }
    },

    clear() {
      this.cache.clear();
    }
  };

  // Sistema global para controlar verbosidad de warnings
  window.FirebaseWarningManager = {
    shownWarnings: new Set(),

    shouldShowWarning(key) {
      // Si el usuario se autentica, resetear los warnings
      if (window.firebaseAuth?.currentUser && this.shownWarnings.has('no-auth')) {
        this.shownWarnings.clear();
      }

      if (this.shownWarnings.has(key)) {
        return false;
      }
      this.shownWarnings.add(key);
      return true;
    },

    reset() {
      this.shownWarnings.clear();
    }
  };

  // Sistema global de "circuit breaker" para manejar cuota excedida
  window.FirebaseQuotaManager = {
    quotaExceeded: false,
    lastQuotaError: null,
    retryAfter: null, // Timestamp para reintentar después de este tiempo

    checkQuotaExceeded(error) {
      if (
        error &&
        (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded'))
      ) {
        this.quotaExceeded = true;
        this.lastQuotaError = new Date();
        // Intentar de nuevo después de 5 minutos
        this.retryAfter = new Date(Date.now() + 5 * 60 * 1000);
        console.warn(
          '⚠️ Cuota de Firebase excedida. Deshabilitando escrituras a Firebase por 5 minutos.'
        );
        return true;
      }
      return false;
    },

    canRetry() {
      if (!this.quotaExceeded) {
        return true;
      }
      if (this.retryAfter && new Date() > this.retryAfter) {
        // console.log('✅ Reintentando conexión a Firebase después del período de espera...');
        this.quotaExceeded = false;
        this.retryAfter = null;
        return true;
      }
      return false;
    },

    reset() {
      this.quotaExceeded = false;
      this.lastQuotaError = null;
      this.retryAfter = null;
    },

    getStatus() {
      const status = {
        quotaExceeded: this.quotaExceeded,
        lastQuotaError: this.lastQuotaError,
        retryAfter: this.retryAfter,
        canRetry: this.canRetry()
      };

      if (this.retryAfter) {
        const minutosRestantes = Math.ceil((this.retryAfter - new Date()) / 1000 / 60);
        status.minutosRestantes = minutosRestantes > 0 ? minutosRestantes : 0;
      }

      return status;
    },

    showStatus() {
      const status = this.getStatus();
      let mensaje = '📊 Estado de Cuota de Firebase:\n\n';

      if (status.quotaExceeded) {
        mensaje += '⚠️ Cuota EXCEDIDA\n';
        mensaje += `⏰ Último error: ${status.lastQuotaError ? new Date(status.lastQuotaError).toLocaleString('es-ES') : 'N/A'}\n`;
        if (status.minutosRestantes !== undefined) {
          mensaje += `🔄 Reintento disponible en: ${status.minutosRestantes} minutos\n`;
        }
        mensaje += '\n💡 Los datos se están guardando solo en localStorage.\n';
        mensaje += '💡 Para ver el uso real de cuota, visita:\n';
        mensaje += '   https://console.firebase.google.com/project/titanfleet-60931/usage\n';
      } else {
        mensaje += '✅ Cuota DISPONIBLE\n';
        mensaje += '✅ Los datos se pueden guardar en Firebase.\n';
      }

      alert(mensaje);
      console.log('📊 Estado de Cuota de Firebase:', status);
      return status;
    }
  };

  class FirebaseRepoBase {
    constructor(collectionName) {
      this.collectionName = collectionName;
      this.db = null;
      this.userId = null;
      this.tenantId = null;
      this._initialized = false;
      this._initPromise = null;

      // Usar solo Firebase v10 (window.fs está disponible)
      this.doc = window.fs?.doc;
      this.setDoc = window.fs?.setDoc;
      this.getDoc = window.fs?.getDoc;
      this.collection = window.fs?.collection;
      this.getDocs = window.fs?.getDocs;
      this.query = window.fs?.query;
      this.where = window.fs?.where;
      this.onSnapshot = window.fs?.onSnapshot;

      // Inicializar solo si Firebase está listo, de lo contrario esperar
      if (window.firebaseDb && window.fs && window.fs.doc) {
        // Firebase está listo, inicializar inmediatamente
        this.init();
      } else {
        // Firebase no está listo, inicializar cuando esté disponible
        this._deferredInit();
      }
    }

    _deferredInit() {
      // Esperar a que Firebase esté listo antes de inicializar
      const checkFirebase = () => {
        if (window.firebaseDb && window.fs && window.fs.doc) {
          this.init();
        } else {
          // Reintentar después de un breve delay (silenciosamente)
          setTimeout(checkFirebase, 200);
        }
      };

      // Si ya hay un evento firebaseReady, esperarlo
      if (window.firebaseReady) {
        // Firebase puede estar listo pero con un pequeño delay
        setTimeout(checkFirebase, 100);
      } else {
        // Esperar al evento firebaseReady
        window.addEventListener(
          'firebaseReady',
          () => {
            setTimeout(() => this.init(), 100);
          },
          { once: true }
        );
        // Timeout de seguridad: verificar periódicamente
        setTimeout(checkFirebase, 500);
      }
    }

    async init() {
      // Si es un usuario recién creado y aún no tenemos el tenantId correcto, forzar reinicialización
      const newUserCreated = localStorage.getItem('newUserCreated');
      const newUserTenantId = localStorage.getItem('newUserTenantId');
      if (newUserCreated === 'true' && newUserTenantId) {
        if (this.tenantId !== newUserTenantId) {
          console.log(
            `🔄 [${this.collectionName}] Usuario recién creado detectado, reinicializando tenantId: ${this.tenantId} -> ${newUserTenantId}`
          );
          this.tenantId = null; // Forzar reinicialización
          this._initialized = false; // Permitir reinicialización
        }
      }

      // Evitar inicializaciones duplicadas - verificar si ya está inicializado
      if (this._initialized && this.db && this.tenantId) {
        return;
      }

      try {
        // Usar solo Firebase v10 (window.firebaseDb está disponible)
        if (!window.firebaseDb || !window.fs || !window.fs.doc) {
          if (!this._retryCount) {
            this._retryCount = 0;
          }
          this._retryCount++;

          if (this._retryCount <= 10) {
            // Solo mostrar mensaje en intentos específicos o en modo debug
            const shouldLog =
              this._retryCount === 1 ||
              this._retryCount === 5 ||
              this._retryCount === 10 ||
              (window.DEBUG_FIREBASE && this._retryCount % 3 === 0);

            if (shouldLog && this._retryCount <= 5) {
              // console.log(`⏳ ${this.collectionName}: Esperando Firebase v10... (${this._retryCount}/10)`);
            }

            // Reintentar con intervalo más corto para respuesta más rápida
            setTimeout(() => this.init(), 500);
          } else {
            console.warn(
              `⚠️ ${this.collectionName}: Firebase v10 no disponible después de 10 intentos. Usando solo localStorage.`
            );
            this._firebaseUnavailable = true;
          }
          return;
        }

        // Marcar como inicializando para evitar llamadas concurrentes
        // Si ya hay una inicialización en progreso, retornar esa promesa
        if (this._initPromise) {
          return this._initPromise;
        }

        // Crear nueva promesa de inicialización
        this._initPromise = this._doInit()
          .then(() => {
            this._initialized = true;
            this._initPromise = null;
          })
          .catch(error => {
            if (window.errorHandler) {
              window.errorHandler.critical(
                `Error inicializando FirebaseRepoBase para ${this.collectionName}`,
                {
                  context: { collectionName: this.collectionName },
                  error: error
                }
              );
            } else {
              console.error(
                `❌ Error inicializando FirebaseRepoBase para ${this.collectionName}:`,
                error
              );
            }
            this._initPromise = null;
            throw error;
          });

        await this._initPromise;
      } catch (error) {
        // Error ya manejado en el catch de la promesa, pero asegurar que _initPromise se limpie
        if (this._initPromise) {
          this._initPromise = null;
        }
        throw error;
      }
    }

    async _doInit() {
      // Usar la instancia de Firestore v10
      this.db = window.firebaseDb;

      if (!this.db) {
        throw new Error('Firestore no está disponible');
      }

      // Actualizar referencias a funciones de Firebase v10 (por si no estaban disponibles en el constructor)
      if (window.fs) {
        this.doc = window.fs.doc;
        this.setDoc = window.fs.setDoc;
        this.getDoc = window.fs.getDoc;
        this.deleteDoc = window.fs.deleteDoc;
        this.collection = window.fs.collection;
        this.getDocs = window.fs.getDocs;
        this.query = window.fs.query;
        this.where = window.fs.where;
        this.onSnapshot = window.fs.onSnapshot;
      }

      // Obtener información del usuario primero
      const auth = window.firebaseAuth || window.firebase?.auth;

      // Verificar si es un usuario recién creado ANTES de obtener tenantId
      // Esto previene que se asigne demo_tenant cuando hay un tenantId válido
      const newUserCreated = localStorage.getItem('newUserCreated');
      const newUserTenantId = localStorage.getItem('newUserTenantId');
      const isNewUser = newUserCreated === 'true' && newUserTenantId;
      if (auth && auth.currentUser) {
        this.userId = auth.currentUser.uid;
        await this.getTenantId();

        // Si es un usuario recién creado y aún no tenemos el tenantId correcto, forzarlo
        if (isNewUser && this.tenantId !== newUserTenantId) {
          console.log(
            `🔧 [${this.collectionName}] Corrigiendo tenantId después de getTenantId: ${this.tenantId} -> ${newUserTenantId}`
          );
          this.tenantId = newUserTenantId;
        }
      } else if (window.__onAuthReady) {
        // Esperar a que la autenticación esté lista (sin log innecesario)
        try {
          const user = await window.__onAuthReady;
          if (user) {
            this.userId = user.uid;
            await this.getTenantId();

            // Si es un usuario recién creado y aún no tenemos el tenantId correcto, forzarlo
            if (isNewUser && this.tenantId !== newUserTenantId) {
              console.log(
                `🔧 [${this.collectionName}] Corrigiendo tenantId después de getTenantId (auth ready): ${this.tenantId} -> ${newUserTenantId}`
              );
              this.tenantId = newUserTenantId;
            }
          } else {
            // Fallback si no hay usuario - pero verificar usuario recién creado primero
            if (isNewUser) {
              this.userId = 'demo_user';
              this.tenantId = newUserTenantId;
              console.log(
                `✅ [${this.collectionName}] Usando tenantId de usuario recién creado (sin auth): ${this.tenantId}`
              );
            } else {
              this.userId = 'demo_user';
              this.tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
            }
          }
        } catch (e) {
          console.warn(`⚠️ ${this.collectionName}: Error esperando autenticación:`, e);
          // Verificar usuario recién creado antes de usar demo_tenant
          if (isNewUser) {
            this.userId = 'demo_user';
            this.tenantId = newUserTenantId;
            console.log(
              `✅ [${this.collectionName}] Usando tenantId de usuario recién creado (error auth): ${this.tenantId}`
            );
          } else {
            this.userId = 'demo_user';
            this.tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          }
        }
      } else {
        // Si no hay usuario autenticado ni promesa de auth, verificar usuario recién creado antes de usar demo
        if (isNewUser) {
          this.userId = 'demo_user';
          this.tenantId = newUserTenantId;
          console.log(
            `✅ [${this.collectionName}] Usando tenantId de usuario recién creado (sin auth ni promise): ${this.tenantId}`
          );
        } else {
          this.userId = 'demo_user';
          this.tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        }
      }

      // VERIFICACIÓN FINAL: Si es un usuario recién creado, asegurar que el tenantId sea correcto
      const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
      if (
        isNewUser &&
        this.tenantId !== newUserTenantId &&
        (this.tenantId === demoTenantId || this.tenantId === 'demo' || !this.tenantId)
      ) {
        console.log(
          `🔧 [${this.collectionName}] CORRECCIÓN FINAL: Cambiando tenantId de ${this.tenantId} a ${newUserTenantId}`
        );
        this.tenantId = newUserTenantId;
      }

      // Mostrar mensaje con el tenantId que se está usando
      if (window.DEBUG_FIREBASE || this.collectionName === 'logistica') {
        console.log(
          `✅ [${this.collectionName}] Repositorio inicializado con tenantId: ${this.tenantId}`
        );
      }
    }

    async getTenantId() {
      try {
        // PRIORIDAD 1: Verificar si es un usuario recién creado (marcado en index-activation-flow.js)
        const newUserCreated = localStorage.getItem('newUserCreated');
        const newUserTenantId = localStorage.getItem('newUserTenantId');
        if (newUserCreated === 'true' && newUserTenantId) {
          this.tenantId = newUserTenantId;
          console.log(
            `✅ [${this.collectionName}] Usando tenantId de usuario recién creado: ${this.tenantId}`
          );
          // NO limpiar la marca aquí - se limpiará después de que la página se cargue completamente
          return;
        }

        // PRIORIDAD 2: Verificar si hay una licencia activa (sistema de venta/renta)
        if (window.licenseManager && window.licenseManager.isLicenseActive()) {
          const licenseTenantId = window.licenseManager.getTenantId();
          if (licenseTenantId) {
            this.tenantId = licenseTenantId;
            console.log(
              `✅ [${this.collectionName}] Usando tenantId de licencia: ${this.tenantId}`
            );
            return;
          }
        }

        // PRIORIDAD 3: Verificar tenantId guardado en localStorage o erpCurrentUser
        const savedTenantId = localStorage.getItem('tenantId');
        const currentUser = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
        const userTenantId = currentUser?.tenantId || savedTenantId;

        if (userTenantId) {
          this.tenantId = userTenantId;
          console.log(
            `✅ [${this.collectionName}] Usando tenantId guardado en localStorage: ${this.tenantId}`
          );
          return;
        }

        // PRIORIDAD 4: Para usuarios anónimos, decidir según configuración
        if (window.firebaseAuth?.currentUser?.isAnonymous) {
          // Para modo demo/prueba, usar DEMO_CONFIG.tenantId compartido
          // Para clientes reales, cada usuario usaría su uid (privacidad)
          const useSharedDemo = localStorage.getItem('useSharedDemo') !== 'false';
          if (useSharedDemo) {
            this.tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
            // console.log(`✅ Usuario anónimo usando tenantId compartido (demo): ${this.tenantId}`);
          } else {
            this.tenantId = window.firebaseAuth.currentUser.uid;
            // console.log(`✅ Usuario anónimo usando tenantId único (privado): ${this.tenantId}`);
          }
          return;
        }

        // PRIORIDAD 5: Para usuarios autenticados normales, obtener su tenantId
        if (this.userId && this.doc && this.getDoc && this.db) {
          // Usar Firebase v10
          const userDocRef = this.doc(this.db, 'users', this.userId);
          const userDoc = await this.getDoc(userDocRef);
          if (userDoc.exists()) {
            const docTenantId = userDoc.data().tenantId;
            if (docTenantId) {
              this.tenantId = docTenantId;
              console.log(
                `✅ [${this.collectionName}] Usando tenantId del documento users/{uid}: ${this.tenantId}`
              );
            } else {
              // Si el documento no tiene tenantId, usar userId
              this.tenantId = this.userId;
              console.log(
                `✅ [${this.collectionName}] Usando userId como tenantId (documento no tiene tenantId): ${this.tenantId}`
              );
            }
          } else {
            // Si no existe el documento de usuario, usar el userId como tenantId
            this.tenantId = this.userId;
            console.log(
              `✅ [${this.collectionName}] Usando userId como tenantId (documento no existe): ${this.tenantId}`
            );
          }
        } else if (this.userId) {
          // Si no hay db disponible pero hay userId, usar userId como tenantId
          this.tenantId = this.userId;
          console.log(
            `✅ [${this.collectionName}] Usando userId como tenantId (Firebase no disponible): ${this.tenantId}`
          );
        } else {
          // Último fallback: DEMO_CONFIG.tenantId si está disponible
          this.tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          console.warn(
            `⚠️ [${this.collectionName}] Usando tenantId ${this.tenantId} como último recurso`
          );
        }
      } catch (error) {
        console.error(`❌ [${this.collectionName}] Error obteniendo tenantId:`, error);
        // Fallback: usar userId si está disponible, sino DEMO_CONFIG.tenantId
        this.tenantId =
          this.userId ||
          window.firebaseAuth?.currentUser?.uid ||
          window.DEMO_CONFIG?.tenantId ||
          'demo_tenant';
        console.warn(`⚠️ [${this.collectionName}] Usando tenantId de fallback: ${this.tenantId}`);
      }
    }

    // Función auxiliar para comparar si dos objetos son iguales (ignorando metadata)
    _areDataEqual(newData, existingData) {
      if (!existingData) {
        return false;
      }

      // Si hay un flag para forzar actualización, siempre retornar false (diferentes)
      if (newData._forceUpdate) {
        return false;
      }

      // Campos a ignorar en la comparación (metadata que cambia automáticamente)
      const ignoreFields = [
        'updatedAt',
        'userId',
        'tenantId',
        'fechaActualizacion',
        'ultimaActualizacion',
        '_forceUpdate'
      ];

      // Crear copias sin metadata
      const cleanNew = { ...newData };
      const cleanExisting = { ...existingData };

      ignoreFields.forEach(field => {
        delete cleanNew[field];
        delete cleanExisting[field];
      });

      // Comparar JSON strings (método simple pero efectivo)
      // NOTA: Ordenar las claves para comparación más precisa
      const sortedNew = Object.keys(cleanNew)
        .sort()
        .reduce((obj, key) => {
          obj[key] = cleanNew[key];
          return obj;
        }, {});
      const sortedExisting = Object.keys(cleanExisting)
        .sort()
        .reduce((obj, key) => {
          obj[key] = cleanExisting[key];
          return obj;
        }, {});

      return JSON.stringify(sortedNew) === JSON.stringify(sortedExisting);
    }

    // Guardar documento (OPTIMIZADO: evita escrituras duplicadas)
    async save(id, data) {
      // Verificar conexión a internet antes de intentar guardar
      const isOnline = window.connectionMonitor
        ? window.connectionMonitor.isOnline()
        : navigator.onLine;
      if (!isOnline) {
        console.warn(
          `⚠️ Sin conexión a internet. Guardando en localStorage para ${this.collectionName}/${id}`
        );
        console.warn('⚠️ Los datos se sincronizarán con Firebase cuando se restaure la conexión.');
        // Guardar en localStorage como caché temporal
        const saved = this.saveToLocalStorage(id, data);
        if (saved) {
          // Marcar como pendiente de sincronización
          this.markPendingSync(id);
          return true;
        }
        throw new Error('No se pudo guardar en localStorage');
      }

      // Verificar si la cuota está excedida antes de intentar
      if (!window.FirebaseQuotaManager.canRetry()) {
        const minutosRestantes = window.FirebaseQuotaManager.retryAfter
          ? Math.ceil((window.FirebaseQuotaManager.retryAfter - new Date()) / 1000 / 60)
          : 0;
        console.warn('⚠️ Circuit breaker activo: Cuota de Firebase excedida.');
        console.warn(`⚠️ Guardando solo en localStorage para ${this.collectionName}/${id}`);
        console.warn(`⚠️ Reintento disponible en ${minutosRestantes} minutos.`);
        if (window.FIREBASE_ONLY) {
          throw new Error(
            `Cuota de Firebase excedida. Intente más tarde (en ${minutosRestantes} minutos).`
          );
        }
        return this.saveToLocalStorage(id, data);
      }

      try {
        // Esperar a que el repositorio esté completamente inicializado
        let attempts = 0;
        while ((!this.db || !this.tenantId) && attempts < 10) {
          attempts++;
          // console.log(`⏳ Esperando inicialización del repositorio ${this.collectionName}... (intento ${attempts}/10)`);
          await new Promise(resolve => setTimeout(resolve, 500));

          // Intentar inicializar si aún no está listo
          if (!this.db || !this.tenantId) {
            await this.init();
          }
        }

        if ((this._firebaseUnavailable || !this.db || !this.tenantId) && !window.FIREBASE_ONLY) {
          console.warn(`⚠️ Firebase no está listo para ${this.collectionName}:`, {
            _firebaseUnavailable: this._firebaseUnavailable,
            tieneDb: Boolean(this.db),
            tieneTenantId: Boolean(this.tenantId),
            tenantId: this.tenantId
          });
          // console.log('💾 Guardando en localStorage como fallback');
          return this.saveToLocalStorage(id, data);
        } else if (
          (this._firebaseUnavailable || !this.db || !this.tenantId) &&
          window.FIREBASE_ONLY
        ) {
          throw new Error('Firebase requerido y no disponible');
        }

        // OPTIMIZACIÓN 1: Verificar cache de escrituras recientes
        if (
          window.FirebaseWriteCache &&
          !window.FirebaseWriteCache.shouldWrite(`${this.collectionName}/${id}`, data)
        ) {
          // Aún así actualizar cache local
          this.updateLocalCache(id, data);
          return true; // Retornar true porque los datos ya están actualizados
        }

        // OPTIMIZACIÓN 2: Verificar si el documento ya existe y si los datos son iguales
        let shouldWrite = true;
        let existingData = null;

        if (this.doc && this.getDoc && this.db) {
          try {
            const docRef = this.doc(this.db, this.collectionName, id);
            const docSnap = await this.getDoc(docRef);

            if (docSnap.exists()) {
              existingData = docSnap.data();

              // Comparar datos (ignorando metadata)
              if (this._areDataEqual(data, existingData)) {
                // console.log(`⏭️ Documento ${this.collectionName}/${id} no ha cambiado, omitiendo escritura a Firebase`);
                shouldWrite = false;

                // Marcar en cache para evitar futuras escrituras
                if (window.FirebaseWriteCache) {
                  window.FirebaseWriteCache.markWritten(`${this.collectionName}/${id}`, data);
                }

                // Aún así actualizar cache local
                this.updateLocalCache(id, data);
                return true; // Retornar true porque los datos ya están actualizados
              }
            }
          } catch (readError) {
            // Si falla la lectura, continuar con la escritura
            console.warn(
              '⚠️ Error leyendo documento existente, continuando con escritura:',
              readError
            );
          }
        }

        // Solo escribir si hay cambios o es un documento nuevo
        if (!shouldWrite) {
          return true;
        }

        // Función para limpiar valores undefined y strings vacíos
        const limpiarUndefined = obj => {
          if (obj === null || obj === undefined) {
            return null;
          }
          if (Array.isArray(obj)) {
            return obj.map(item => limpiarUndefined(item));
          }
          if (typeof obj === 'object') {
            const cleaned = {};
            for (const key in obj) {
              if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                // Solo incluir si no es undefined y no es string vacío
                if (value !== undefined) {
                  // Si es string vacío, omitir (no guardar en Firebase)
                  if (typeof value === 'string' && value.trim() === '') {
                    continue; // Omitir este campo
                  }
                  cleaned[key] = limpiarUndefined(value);
                }
              }
            }
            return cleaned;
          }
          // Si es string vacío, retornar undefined para que se omita
          if (typeof obj === 'string' && obj.trim() === '') {
            return undefined;
          }
          return obj;
        };

        // Limpiar datos antes de guardar (eliminar campos undefined y campos temporales)
        const dataLimpio = limpiarUndefined(data);

        // Remover campo temporal _forceUpdate antes de guardar
        if (dataLimpio._forceUpdate) {
          delete dataLimpio._forceUpdate;
        }

        // OPTIMIZACIÓN 2: Solo actualizar updatedAt si realmente hay cambios
        const docData = {
          ...dataLimpio,
          tenantId: this.tenantId,
          userId: this.userId,
          deleted: false
        };

        // Si es un documento nuevo o hay cambios significativos, actualizar timestamp
        if (!existingData || !this._areDataEqual(dataLimpio, existingData)) {
          docData.updatedAt = new Date().toISOString();
        } else {
          // Mantener el timestamp existente si no hay cambios
          docData.updatedAt = existingData.updatedAt || new Date().toISOString();
        }

        // console.log(`💾 Guardando en Firebase ${this.collectionName}/${id} (${existingData ? 'actualización' : 'nuevo'}):`, {
        //     tenantId: this.tenantId,
        //     userId: this.userId,
        //     tipo: data.tipo || 'sin tipo',
        //     tieneDoc: !!this.doc,
        //     tieneSetDoc: !!this.setDoc,
        //     tieneDb: !!this.db
        // });

        // Validar que db sea una instancia válida de Firestore
        if (!this.db) {
          throw new Error('Firestore db no está inicializado');
        }

        // Verificar que db sea una instancia válida de Firestore
        if (typeof this.db !== 'object' || this.db === null) {
          throw new Error(`Firestore db no es válido. Tipo: ${typeof this.db}, Valor: ${this.db}`);
        }

        // Verificar que collection esté disponible
        if (!this.collection || typeof this.collection !== 'function') {
          throw new Error(
            `this.collection no está disponible o no es una función. Tipo: ${typeof this.collection}`
          );
        }

        // Usar solo Firebase v10
        if (this.doc && this.setDoc && this.collection) {
          // Sintaxis Firebase v10
          if (typeof this.doc !== 'function') {
            throw new Error(`this.doc no es una función. Tipo: ${typeof this.doc}`);
          }
          if (typeof this.setDoc !== 'function') {
            throw new Error(`this.setDoc no es una función. Tipo: ${typeof this.setDoc}`);
          }

          const docRef = this.doc(this.db, this.collectionName, id);
          await this.setDoc(docRef, docData, { merge: true });
          // console.log(`✅ Documento guardado en Firebase: ${this.collectionName}/${id} (tenantId: ${this.tenantId})`);

          // Marcar en cache de escrituras para evitar duplicados
          if (window.FirebaseWriteCache) {
            window.FirebaseWriteCache.markWritten(`${this.collectionName}/${id}`, data);
          }
        } else {
          throw new Error('Firebase v10 no está disponible (doc/setDoc functions)');
        }

        // También actualizar cache local
        this.updateLocalCache(id, data);

        return true;
      } catch (error) {
        // Verificar si es error de cuota excedida
        const isQuotaError =
          error &&
          (error.code === 'resource-exhausted' ||
            error.message?.includes('Quota exceeded') ||
            error.message?.includes('quota'));

        if (isQuotaError) {
          // Activar circuit breaker
          window.FirebaseQuotaManager.checkQuotaExceeded(error);
          if (window.errorHandler) {
            window.errorHandler.critical(
              'Cuota de Firebase excedida. Circuit breaker activado. Los datos se guardarán solo localmente.',
              {
                context: {
                  collectionName: this.collectionName,
                  documentId: id
                },
                userMessage:
                  '⚠️ Cuota de Firebase excedida. Los datos se guardarán localmente hasta que se recupere la conexión.'
              }
            );
          } else {
            console.warn(
              '⚠️ ⚠️ ⚠️ Cuota de Firebase excedida detectada. Circuit breaker activado.'
            );
            console.warn(`⚠️ Guardando solo en localStorage para ${this.collectionName}/${id}`);
          }
          console.warn('⚠️ No se intentará guardar en Firebase durante los próximos 5 minutos.');

          if (window.FIREBASE_ONLY) {
            throw error; // Re-lanzar el error si FIREBASE_ONLY está activo
          }
          // Guardar en localStorage y retornar true para indicar éxito
          const saved = this.saveToLocalStorage(id, data);
          if (saved) {
            console.log(`✅ Datos guardados en localStorage para ${this.collectionName}/${id}`);
            return true; // Retornar true porque se guardó en localStorage
          }
          throw error; // Si no se pudo guardar en localStorage, re-lanzar el error
        } else {
          // Si no es error de quota, intentar guardar en localStorage como fallback
          console.error(`❌ Error guardando en Firebase ${this.collectionName}:`, error);
          console.error('❌ Código de error:', error.code);
          console.error('❌ Mensaje:', error.message);

          if (window.FIREBASE_ONLY) {
            throw error; // Si FIREBASE_ONLY está activo, re-lanzar el error
          }

          // Fallback a localStorage si no está forzado Firebase
          console.log(`💾 Fallback: Guardando en localStorage para ${this.collectionName}/${id}`);
          const saved = this.saveToLocalStorage(id, data);
          if (saved) {
            console.log('✅ Datos guardados en localStorage como respaldo');
            // Marcar como pendiente de sincronización
            this.markPendingSync(id);
            return true;
          }
          throw error; // Si no se pudo guardar en localStorage, re-lanzar el error
        }
      }
    }

    // Obtener documento por ID
    async get(id) {
      try {
        if ((this._firebaseUnavailable || !this.db || !this.tenantId) && !window.FIREBASE_ONLY) {
          return this.getFromLocalStorage(id);
        } else if (
          (this._firebaseUnavailable || !this.db || !this.tenantId) &&
          window.FIREBASE_ONLY
        ) {
          throw new Error('Firebase requerido y no disponible');
        }

        // Usar Firebase v10
        const docRef = this.doc(this.db, this.collectionName, id);
        const doc = await this.getDoc(docRef);
        if (doc.exists() && doc.data().tenantId === this.tenantId && !doc.data().deleted) {
          return { id: doc.id, ...doc.data() };
        }
        return null;
      } catch (error) {
        // Si es error de permisos, solo loggear en debug (es esperado cuando no hay autenticación)
        const isPermissionError =
          error?.code === 'permission-denied' ||
          error?.message?.includes('Missing or insufficient permissions') ||
          error?.message?.includes('permission');

        if (isPermissionError) {
          // Error de permisos esperado, solo loggear en debug
          console.debug(
            `ℹ️ Error de permisos obteniendo de Firebase ${this.collectionName}, usando localStorage:`,
            id
          );
        } else {
          // Otros errores, mostrar warning
          if (window.errorHandler) {
            window.errorHandler.warning(`Error obteniendo de Firebase ${this.collectionName}`, {
              context: { collectionName: this.collectionName, documentId: id },
              error: error
            });
          } else {
            console.warn(`⚠️ Error obteniendo de Firebase ${this.collectionName}:`, error);
          }
        }
        return this.getFromLocalStorage(id);
      }
    }

    // Obtener todos los documentos (PRIORIDAD: Firebase primero, localStorage como caché/fallback)
    // OPTIMIZADO: Usa consultas limitadas y caché cuando está disponible
    async getAll(options = {}) {
      const { useOptimizer = true, limit = null, useCache = true } = options;

      // Si hay un optimizador disponible y se solicita optimización, usarlo
      if (useOptimizer && window.FirebaseQueryOptimizer && limit) {
        try {
          return window.FirebaseQueryOptimizer.getLimited(this, {
            limit,
            useCache,
            orderBy: 'fechaCreacion',
            orderDirection: 'desc'
          });
        } catch (error) {
          console.warn('⚠️ Error en consulta optimizada, usando método estándar:', error);
          // Continuar con método estándar
        }
      }

      // PRIORIDAD 1: Intentar cargar desde Firebase si está disponible
      if (this.db && this.tenantId && !this._firebaseUnavailable) {
        // Verificar que el usuario esté autenticado antes de hacer consultas
        // Esperar un momento para que onAuthStateChanged haya ejecutado
        let usuarioAutenticado = window.firebaseAuth && window.firebaseAuth.currentUser;

        // Si no hay usuario inmediatamente, esperar un poco (puede ser timing)
        if (!usuarioAutenticado && window.firebaseAuth) {
          // Esperar hasta 1 segundo para que onAuthStateChanged ejecute
          await new Promise(resolve => setTimeout(resolve, 100));
          usuarioAutenticado = window.firebaseAuth && window.firebaseAuth.currentUser;
        }

        if (!usuarioAutenticado) {
          const warningKey = `no-auth-getall-${this.collectionName}`;
          if (window.FirebaseWarningManager?.shouldShowWarning(warningKey)) {
            console.debug(
              `⚠️ Usuario no autenticado después de esperar, usando localStorage para ${this.collectionName}`
            );
          }
          // Continuar con fallback a localStorage
        } else {
          try {
            // Validar que db sea una instancia válida de Firestore
            if (!this.db) {
              throw new Error('Firestore db no está inicializado');
            }

            // Verificar que collection sea una función válida
            if (typeof this.collection !== 'function') {
              throw new Error(`this.collection no es una función. Tipo: ${typeof this.collection}`);
            }

            // Usar Firebase v10
            const collectionRef = this.collection(this.db, this.collectionName);

            // Validar que collectionRef sea válido
            if (!collectionRef) {
              throw new Error(`No se pudo crear collectionRef para ${this.collectionName}`);
            }

            // IMPORTANTE: NO usar filtro de tenantId en la consulta para evitar problemas
            // con las reglas de Firestore. Filtrar por tenantId después de obtener los documentos.
            // Construir consulta base (sin filtro de tenantId)
            let q = this.query(collectionRef, this.where('deleted', '==', false));

            // Aplicar límite si está disponible y se especifica
            if (limit && this.limit) {
              q = this.query(q, this.limit(limit));
            }

            const snapshot = await this.getDocs(q);

            const documents = [];
            snapshot.forEach(doc => {
              const data = doc.data();
              const docTenantId = data.tenantId;

              // CRÍTICO: Filtrar por tenantId para mantener privacidad entre clientes
              // Todos los módulos deben filtrar por tenantId para evitar que clientes vean datos de otros clientes
              let shouldInclude = false;

              // Verificar si el documento pertenece al tenantId actual
              // CRÍTICO: Todos los usuarios solo ven documentos con su tenantId exacto
              // Esto previene que clientes vean datos de otros clientes
              shouldInclude = docTenantId === this.tenantId;

              // Log para diagnóstico (solo si hay discrepancia)
              if (!shouldInclude && this.collectionName === 'logistica') {
                console.debug(`🔒 [${this.collectionName}] Documento filtrado por tenantId:`, {
                  docId: doc.id,
                  docTenantId: docTenantId,
                  currentTenantId: this.tenantId
                });
              }

              if (shouldInclude) {
                documents.push({ id: doc.id, ...data });
              }
            });

            // if (!limit || documents.length < limit) {
            //     console.log(`✅ ${documents.length} documentos obtenidos de Firebase ${this.collectionName}`);
            // } else {
            //     console.log(`✅ ${documents.length} documentos obtenidos de Firebase ${this.collectionName} (limitado a ${limit})`);
            // }

            // Actualizar caché local con datos de Firebase (Firebase es la fuente de verdad)
            this.updateLocalCacheAll(documents);

            return documents;
          } catch (firebaseError) {
            // Si es error de permisos, cargar desde localStorage inmediatamente
            if (
              firebaseError.code === 'permission-denied' ||
              firebaseError.message?.includes('permission') ||
              firebaseError.message?.includes('Missing or insufficient permissions')
            ) {
              console.warn(
                `⚠️ Error de permisos cargando desde Firebase ${this.collectionName}, cargando desde localStorage:`,
                firebaseError
              );
              // Cargar desde localStorage cuando hay error de permisos
              const localData = this.getAllFromLocalStorage();
              if (limit && localData.length > limit) {
                return localData.slice(0, limit);
              }
              return localData;
            }
            console.warn(
              `⚠️ Error cargando desde Firebase ${this.collectionName}, usando localStorage como fallback:`,
              firebaseError
            );

            // Continuar con fallback a localStorage
          }
        }
      }

      // PRIORIDAD 2: Fallback a localStorage si Firebase no está disponible
      if ((this._firebaseUnavailable || !this.db || !this.tenantId) && !window.FIREBASE_ONLY) {
        console.log(
          `📋 Cargando desde localStorage para ${this.collectionName} (Firebase no disponible)`
        );
        const localData = this.getAllFromLocalStorage();
        // Aplicar límite si se especifica
        if (limit && localData.length > limit) {
          return localData.slice(0, limit);
        }
        return localData;
      } else if (
        (this._firebaseUnavailable || !this.db || !this.tenantId) &&
        window.FIREBASE_ONLY
      ) {
        throw new Error('Firebase requerido y no disponible');
      }

      // Si llegamos aquí, deberíamos haber retornado ya, pero por seguridad retornar localStorage
      const localData = this.getAllFromLocalStorage();
      if (limit && localData.length > limit) {
        return localData.slice(0, limit);
      }
      return localData;
    }

    // Suscribirse a cambios en tiempo real
    async subscribe(callback) {
      try {
        if (this._firebaseUnavailable || !this.db || !this.tenantId) {
          console.log('Firebase no disponible, usando datos locales');
          // Llamar callback inmediatamente con datos locales
          const localData = this.getAllFromLocalStorage();
          callback(localData);
          return () => {};
        }

        // Esperar a que onSnapshot esté disponible
        let attempts = 0;
        let onSnapshot = window.fs?.onSnapshot || this.onSnapshot;
        while (!onSnapshot && attempts < 20) {
          attempts++;
          console.log(`⏳ Esperando onSnapshot... (${attempts}/20)`);
          await new Promise(resolve => setTimeout(resolve, 200));
          onSnapshot = window.fs?.onSnapshot || this.onSnapshot;
        }

        if (!onSnapshot) {
          console.warn(
            '⚠️ onSnapshot no está disponible después de esperar, intentando cargar desde Firebase una vez...'
          );
          // Intentar cargar desde Firebase una vez en lugar de usar localStorage vacío
          try {
            const firebaseData = await this.getAll();
            if (firebaseData && firebaseData.length > 0) {
              console.log(
                `✅ Cargados ${firebaseData.length} documentos desde Firebase (sin listener)`
              );
              callback(firebaseData);
            } else {
              console.log('⚠️ No hay datos en Firebase, usando datos locales');
              const localData = this.getAllFromLocalStorage();
              callback(localData);
            }
          } catch (error) {
            if (window.errorHandler) {
              window.errorHandler.warning(
                'Error cargando desde Firebase. Usando datos locales como respaldo',
                {
                  context: { collectionName: this.collectionName },
                  error: error
                }
              );
            } else {
              console.error('❌ Error cargando desde Firebase:', error);
              console.log('⚠️ Usando datos locales como respaldo');
            }
            const localData = this.getAllFromLocalStorage();
            callback(localData);
          }
          return () => {};
        }

        // Verificar que el usuario esté autenticado (con espera para timing)
        let usuarioAutenticado = window.firebaseAuth && window.firebaseAuth.currentUser;
        if (!usuarioAutenticado && window.firebaseAuth) {
          // Esperar un momento para que onAuthStateChanged ejecute
          await new Promise(resolve => setTimeout(resolve, 100));
          usuarioAutenticado = window.firebaseAuth && window.firebaseAuth.currentUser;
        }

        if (!usuarioAutenticado) {
          const warningKey = `no-auth-subscribe-${this.collectionName}`;
          if (window.FirebaseWarningManager?.shouldShowWarning(warningKey)) {
            console.debug(
              `⚠️ Usuario no autenticado después de esperar, usando datos locales para suscripción de ${this.collectionName}`
            );
          }
          const localData = this.getAllFromLocalStorage();
          callback(localData);
          // Retornar función vacía (no hay suscripción activa)
          return () => {};
        }

        // Verificar que collection esté disponible
        if (!this.collection || typeof this.collection !== 'function') {
          console.warn(
            `⚠️ this.collection no está disponible para ${this.collectionName}, usando datos locales`
          );
          const localData = this.getAllFromLocalStorage();
          callback(localData);
          return () => {};
        }

        // Usar Firebase v10: collection() es una función, no un método de db
        const collectionRef = this.collection(this.db, this.collectionName);
        // En Firebase v10, where() no recibe collectionRef como primer argumento
        const q = this.query(
          collectionRef,
          this.where('tenantId', '==', this.tenantId),
          this.where('deleted', '==', false)
        );

        return onSnapshot(
          q,
          snapshot => {
            const documents = [];
            snapshot.forEach(doc => {
              documents.push({ id: doc.id, ...doc.data() });
            });

            // Actualizar cache local
            this.updateLocalCacheAll(documents);

            console.log(
              `📡 Actualización en tiempo real de ${this.collectionName}: ${documents.length} documentos`
            );
            callback(documents);
          },
          error => {
            // Si es error de permisos, no es crítico - el usuario puede no estar autenticado aún
            if (error.code === 'permission-denied' || error.message?.includes('permission')) {
              console.warn(
                `⚠️ Error de permisos en suscripción de ${this.collectionName} (usuario puede no estar autenticado):`,
                error
              );
              // Retornar datos locales como fallback
              const localData = this.getAllFromLocalStorage();
              callback(localData);
            } else {
              console.error(`❌ Error en suscripción de ${this.collectionName}:`, error);
            }
          }
        );
      } catch (error) {
        if (window.errorHandler) {
          window.errorHandler.warning(`Error configurando suscripción de ${this.collectionName}`, {
            context: { collectionName: this.collectionName },
            error: error
          });
        } else {
          console.error(`❌ Error configurando suscripción de ${this.collectionName}:`, error);
        }
        // Fallback a datos locales
        const localData = this.getAllFromLocalStorage();
        callback(localData);
        return () => {};
      }
    }

    // Eliminar documento (hard delete - elimina físicamente el documento)
    async delete(id) {
      try {
        // PRIMERO eliminar de localStorage para evitar que se restaure
        this.deleteFromLocalStorage(id);

        // También eliminar de otras posibles ubicaciones en localStorage
        this.deleteFromAllLocalStorageLocations(id);

        if (this._firebaseUnavailable || !this.db || !this.tenantId) {
          console.log(`✅ Documento eliminado de localStorage: ${this.collectionName}/${id}`);
          return true;
        }

        // Usar Firebase v10 para eliminar físicamente el documento
        if (this.doc && this.deleteDoc) {
          const docRef = this.doc(this.db, this.collectionName, id);
          await this.deleteDoc(docRef);
          console.log(
            `✅ Documento eliminado físicamente de Firebase: ${this.collectionName}/${id}`
          );

          // Verificar que fue eliminado
          const docSnap = await this.getDoc(docRef);
          if (!docSnap.exists()) {
            console.log(`✅ Confirmado: ${this.collectionName}/${id} eliminado de Firebase`);
          } else {
            console.warn(
              `⚠️ ${this.collectionName}/${id} aún existe después de eliminar, reintentando...`
            );
            // Reintentar eliminación
            await this.deleteDoc(docRef);
          }

          return true;
        } else if (this.doc && this.setDoc) {
          // Fallback: soft delete si deleteDoc no está disponible
          const docRef = this.doc(this.db, this.collectionName, id);
          await this.setDoc(
            docRef,
            {
              deleted: true,
              deletedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
          console.log(
            `✅ Documento marcado como eliminado en Firebase: ${this.collectionName}/${id}`
          );

          return true;
        }
        throw new Error('Firebase v10 no está disponible (doc/deleteDoc o doc/setDoc functions)');
      } catch (error) {
        if (window.errorHandler) {
          window.errorHandler.warning(`Error eliminando de Firebase ${this.collectionName}/${id}`, {
            context: { collectionName: this.collectionName, documentId: id },
            error: error,
            userMessage: 'Error al eliminar el registro en la nube. Se eliminó localmente.'
          });
        } else {
          console.error(`❌ Error eliminando de Firebase ${this.collectionName}/${id}:`, error);
        }
        // Asegurar que al menos se eliminó de localStorage
        this.deleteFromLocalStorage(id);
        this.deleteFromAllLocalStorageLocations(id);
        return false;
      }
    }

    // Eliminar de todas las posibles ubicaciones en localStorage
    deleteFromAllLocalStorageLocations(id) {
      try {
        const { collectionName } = this;

        // Eliminar de la ubicación principal
        this.deleteFromLocalStorage(id);

        // Eliminar de ubicaciones específicas según la colección
        if (collectionName === 'cxc') {
          // Eliminar de erp_cxc_data (array)
          try {
            const cxcData = JSON.parse(localStorage.getItem('erp_cxc_data') || '[]');
            const filtered = cxcData.filter(
              item => item.id !== id && item.numeroFactura !== id && item.facturaId !== id
            );
            if (filtered.length < cxcData.length) {
              localStorage.setItem('erp_cxc_data', JSON.stringify(filtered));
              console.log(`🗑️ ${id} eliminado de erp_cxc_data`);
            }
          } catch (e) {
            console.warn('⚠️ Error limpiando erp_cxc_data:', e);
          }
        } else if (collectionName === 'diesel') {
          // Eliminar de erp_diesel_movimientos (array)
          try {
            const dieselData = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
            const filtered = dieselData.filter(item => item.id !== id && item.movimientoId !== id);
            if (filtered.length < dieselData.length) {
              localStorage.setItem('erp_diesel_movimientos', JSON.stringify(filtered));
              console.log(`🗑️ ${id} eliminado de erp_diesel_movimientos`);
            }
          } catch (e) {
            console.warn('⚠️ Error limpiando erp_diesel_movimientos:', e);
          }
        } else if (collectionName === 'tesoreria') {
          // Eliminar de erp_tesoreria_movimientos (array)
          try {
            const tesoreriaData = JSON.parse(
              localStorage.getItem('erp_tesoreria_movimientos') || '[]'
            );
            const filtered = tesoreriaData.filter(
              item => item.id !== id && item.movimientoId !== id
            );
            if (filtered.length < tesoreriaData.length) {
              localStorage.setItem('erp_tesoreria_movimientos', JSON.stringify(filtered));
              console.log(`🗑️ ${id} eliminado de erp_tesoreria_movimientos`);
            }
          } catch (e) {
            console.warn('⚠️ Error limpiando erp_tesoreria_movimientos:', e);
          }
        }
      } catch (error) {
        console.warn(
          `⚠️ Error eliminando de todas las ubicaciones de localStorage para ${this.collectionName}/${id}:`,
          error
        );
      }
    }

    // Métodos de fallback para localStorage
    saveToLocalStorage(id, data) {
      try {
        const key = `erp_${this.collectionName}`;
        const existing = JSON.parse(localStorage.getItem(key) || '{}');
        existing[id] = { ...data, id, updatedAt: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(existing));
        console.log(`💾 Guardado en localStorage como fallback: ${key}/${id}`);
        return true;
      } catch (error) {
        if (window.errorHandler) {
          window.errorHandler.warning('Error guardando en localStorage', {
            context: { collectionName: this.collectionName, documentId: id },
            error: error
          });
        } else {
          console.error('❌ Error guardando en localStorage:', error);
        }
        return false;
      }
    }

    getFromLocalStorage(id) {
      try {
        const key = `erp_${this.collectionName}`;
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        return data[id] || null;
      } catch (error) {
        console.error('❌ Error obteniendo de localStorage:', error);
        return null;
      }
    }

    getAllFromLocalStorage() {
      try {
        const key = `erp_${this.collectionName}`;
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        const allDocuments = Object.values(data);

        // CRÍTICO: Filtrar por tenantId para mantener privacidad entre clientes
        if (!this.tenantId) {
          console.warn(
            `⚠️ [${this.collectionName}] getAllFromLocalStorage: No hay tenantId, retornando todos los documentos (riesgo de privacidad)`
          );
          return allDocuments;
        }

        // Filtrar documentos por tenantId
        // CRÍTICO: Todos los usuarios solo ven documentos con su tenantId exacto
        const filtered = allDocuments.filter(doc => {
          const docTenantId = doc.tenantId;
          return docTenantId === this.tenantId;
        });

        if (filtered.length < allDocuments.length && this.collectionName === 'logistica') {
          console.log(
            `🔒 [${this.collectionName}] getAllFromLocalStorage: Filtrados ${allDocuments.length - filtered.length} documentos por tenantId (de ${allDocuments.length} totales)`
          );
        }

        return filtered;
      } catch (error) {
        console.error('❌ Error obteniendo todos de localStorage:', error);
        return [];
      }
    }

    deleteFromLocalStorage(id) {
      try {
        const key = `erp_${this.collectionName}`;
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        delete data[id];
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`🗑️ Eliminado de localStorage: ${key}/${id}`);
        return true;
      } catch (error) {
        console.error('❌ Error eliminando de localStorage:', error);
        return false;
      }
    }

    // Marcar documento como pendiente de sincronización
    markPendingSync(id) {
      try {
        const pendingKey = `erp_pending_sync_${this.collectionName}`;
        const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
        if (!pending.includes(id)) {
          pending.push(id);
          localStorage.setItem(pendingKey, JSON.stringify(pending));
          console.log(`📝 Marcado como pendiente de sincronización: ${this.collectionName}/${id}`);
        }
      } catch (error) {
        console.error('❌ Error marcando como pendiente de sincronización:', error);
      }
    }

    // Actualizar cache local
    updateLocalCache(id, data) {
      try {
        const key = `erp_${this.collectionName}`;
        const existing = JSON.parse(localStorage.getItem(key) || '{}');
        existing[id] = { ...data, id, updatedAt: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(existing));
      } catch (error) {
        console.error('❌ Error actualizando cache local:', error);
      }
    }

    updateLocalCacheAll(documents) {
      try {
        const key = `erp_${this.collectionName}`;

        // Obtener datos previos ANTES de actualizar para detectar eliminaciones
        const previousData = JSON.parse(localStorage.getItem(key) || '{}');
        const previousIds = new Set(Object.keys(previousData));

        const cache = {};
        const documentIds = new Set();

        // Crear nuevo cache solo con los documentos que vienen de Firebase
        // Si documents está vacío, cache también estará vacío (esto borrará localStorage)
        documents.forEach(doc => {
          cache[doc.id] = { ...doc, updatedAt: new Date().toISOString() };
          documentIds.add(doc.id);
        });

        // IMPORTANTE: Reemplazar completamente el localStorage con los datos de Firebase
        // Esto asegura que los documentos eliminados también se eliminen del localStorage
        // Si Firebase está vacío, localStorage también se vaciará (Firebase es la fuente de verdad)
        localStorage.setItem(key, JSON.stringify(cache));

        // Detectar documentos eliminados comparando IDs previos con los nuevos
        const deletedIds = [...previousIds].filter(id => !documentIds.has(id));

        if (deletedIds.length > 0) {
          console.log(
            `🗑️ ${deletedIds.length} documento(s) eliminado(s) del localStorage de ${this.collectionName}:`,
            deletedIds
          );
        }

        // Si Firebase está vacío y había datos en localStorage, loguear la limpieza
        if (documents.length === 0 && previousIds.size > 0) {
          console.log(
            `🗑️ Firebase está vacío para ${this.collectionName}. localStorage limpiado (${previousIds.size} documento(s) eliminado(s)).`
          );
        }

        // console.log(`✅ Cache local actualizado para ${this.collectionName}: ${documents.length} documento(s) (${deletedIds.length} eliminado(s))`);
      } catch (error) {
        console.error('❌ Error actualizando cache local completo:', error);
      }
    }

    // Marcar documento como pendiente de sincronización
    markPendingSync(id) {
      try {
        const pendingKey = `erp_pending_sync_${this.collectionName}`;
        const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
        if (!pending.includes(id)) {
          pending.push(id);
          localStorage.setItem(pendingKey, JSON.stringify(pending));
          console.log(`📝 Marcado como pendiente de sincronización: ${this.collectionName}/${id}`);
        }
      } catch (error) {
        console.error('❌ Error marcando como pendiente de sincronización:', error);
      }
    }
  }

  // Exportar para uso global
  window.FirebaseRepoBase = FirebaseRepoBase;
} // Fin de la verificación de carga duplicada
