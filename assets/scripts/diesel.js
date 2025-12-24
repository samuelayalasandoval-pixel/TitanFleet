// ===== Diesel Manager =====
class DieselManager {
  constructor() {
    this.storageKey = 'erp_diesel_movimientos';
    this.initializeData();
  }

  initializeData() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
    // Inicializar timestamp de sincronización si no existe
    if (!localStorage.getItem(`${this.storageKey}_lastSync`)) {
      localStorage.setItem(`${this.storageKey}_lastSync`, '0');
    }
  }

  /**
   * Obtiene el timestamp de la última sincronización con Firebase
   */
  getLastSyncTimestamp() {
    try {
      const timestamp = localStorage.getItem(`${this.storageKey}_lastSync`);
      return timestamp ? parseInt(timestamp, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Guarda el timestamp de la última sincronización con Firebase
   */
  setLastSyncTimestamp() {
    try {
      localStorage.setItem(`${this.storageKey}_lastSync`, Date.now().toString());
    } catch (error) {
      console.warn('⚠️ Error guardando timestamp de sincronización:', error);
    }
  }

  /**
   * Verifica si Firebase está disponible
   */
  isFirebaseAvailable() {
    return (
      window.firebaseRepos &&
      window.firebaseRepos.diesel &&
      window.firebaseRepos.diesel.db &&
      window.firebaseRepos.diesel.tenantId &&
      window.firebaseAuth?.currentUser
    );
  }

  /**
   * Filtra movimientos por tenantId/userId
   */
  filterByTenant(movimientos) {
    const currentTenantId =
      window.firebaseRepos?.diesel?.tenantId ||
      localStorage.getItem('tenantId') ||
      JSON.parse(localStorage.getItem('erpCurrentUser') || '{}').tenantId;
    const currentUserId = window.firebaseAuth?.currentUser?.uid;

    if (!currentTenantId && !currentUserId) {
      return movimientos;
    }

    return movimientos.filter(mov => {
      const movTenantId = mov.tenantId || mov.tenant_id;
      const movUserId = mov.userId || mov.user_id;

      return (
        (currentTenantId && movTenantId === currentTenantId) ||
        (currentUserId && movUserId === currentUserId) ||
        (!movTenantId && !movUserId)
      ); // Incluir registros legacy sin tenantId/userId
    });
  }

  /**
   * Muestra indicador de modo offline/cache
   */
  showOfflineIndicator() {
    const indicator = document.getElementById('backendReadyIndicator');
    if (indicator) {
      indicator.innerHTML = `
        <span class="spinner-border spinner-border-sm text-warning" role="status" aria-hidden="true"></span>
        <span class="ms-2 text-warning">Modo offline - Datos en caché</span>
      `;
      indicator.style.display = 'inline-block';
    }
  }

  /**
   * Muestra indicador de Firebase conectado
   */
  showFirebaseIndicator() {
    const indicator = document.getElementById('backendReadyBadge');
    if (indicator) {
      indicator.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span class="ms-2">Sincronizado con Firebase</span>
      `;
      indicator.style.display = 'inline-block';
    }
    // Ocultar indicador de offline si existe
    const offlineIndicator = document.getElementById('backendReadyIndicator');
    if (offlineIndicator) {
      offlineIndicator.style.display = 'none';
    }
  }

  async getMovimientos() {
    try {
      let movimientosFirebase = [];
      let firebaseAvailable = false;
      let _firebaseError = null;

      // PRIORIDAD 1: Intentar cargar desde Firebase (SIEMPRE es la fuente de verdad)
      if (window.firebaseRepos && window.firebaseRepos.diesel) {
        try {
          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.diesel.db || !window.firebaseRepos.diesel.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
            await window.firebaseRepos.diesel.init();
          }

          if (this.isFirebaseAvailable()) {
            movimientosFirebase = await window.firebaseRepos.diesel.getAllMovimientos();
            movimientosFirebase = this.filterByTenant(movimientosFirebase || []);

            // Normalizar IDs: extraer el número del ID del documento de Firebase
            // IMPORTANTE: Guardar también el ID completo de Firebase para poder actualizarlo correctamente
            movimientosFirebase = movimientosFirebase.map(mov => {
              // Si el ID tiene el prefijo "movimiento_", extraer solo el número pero mantener el ID completo
              if (typeof mov.id === 'string' && mov.id.startsWith('movimiento_')) {
                const idCompletoFirebase = mov.id; // Guardar el ID completo original ANTES de cualquier modificación
                // Extraer solo el número base (todo antes del primer guión bajo después de "movimiento_")
                const partes = mov.id.replace(/^movimiento_/, '').split('_');
                const idNumerico = partes[0]; // El primer segmento es el número base

                console.log(
                  `🔧 Normalizando ID de Firebase: ${idCompletoFirebase} → id: ${idNumerico}, firebaseId: ${idCompletoFirebase}`
                );

                return {
                  ...mov,
                  id: idNumerico, // Guardar solo el número como ID interno
                  firebaseId: idCompletoFirebase // IMPORTANTE: Guardar el ID completo para actualizaciones
                };
              }

              // Si el movimiento ya tiene firebaseId, asegurarse de preservarlo
              if (mov.firebaseId) {
                return mov;
              }

              // Si no tiene prefijo ni firebaseId, pero tiene un ID numérico, puede ser un movimiento antiguo
              // En este caso, intentar buscar si hay un documento en Firebase con ese ID
              if (mov.id && typeof mov.id === 'string' && /^\d+$/.test(mov.id)) {
                // Es un ID numérico sin prefijo, probablemente viene de localStorage antiguo
                // No hacer nada, dejarlo como está (pero sin firebaseId, no se podrá actualizar directamente)
                // Esto es normal para movimientos antiguos que fueron creados antes de implementar firebaseId
              } else if (!mov.firebaseId && mov.id) {
                // Solo mostrar warning si realmente parece ser un error
                console.warn(
                  `⚠️ Movimiento sin firebaseId encontrado: ${mov.id} (esto es normal para movimientos antiguos)`
                );
              }

              return mov;
            });

            if (movimientosFirebase && movimientosFirebase.length >= 0) {
              firebaseAvailable = true;
              this.setLastSyncTimestamp();
              this.showFirebaseIndicator();
              console.log(
                `✅ ${movimientosFirebase.length} movimientos de diesel cargados desde Firebase (fuente de verdad)`
              );
            }
          }
        } catch (error) {
          _firebaseError = error;
          console.warn('⚠️ Error cargando movimientos desde Firebase:', error);

          // Verificar si es error de quota
          const isQuotaError =
            error &&
            (error.code === 'resource-exhausted' ||
              error.code === 'permission-denied' ||
              error.message?.includes('Quota exceeded') ||
              error.message?.includes('quota') ||
              error.message?.includes('exceeded'));

          if (isQuotaError) {
            console.error('🚫 ERROR: Cuota de Firebase excedida');
          }
        }
      }

      // PRIORIDAD 2: Cargar desde localStorage (solo como cache/fallback)
      let movimientosLocal = [];
      let _usingCache = false;

      try {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          movimientosLocal = JSON.parse(data);
          movimientosLocal = this.filterByTenant(movimientosLocal || []);
          console.log(`📋 ${movimientosLocal.length} movimientos en caché (localStorage)`);
        }
      } catch (error) {
        console.warn('⚠️ Error parseando movimientos de localStorage:', error);
      }

      // DECISIÓN: Firebase SIEMPRE es la fuente de verdad si está disponible
      let movimientosFinales = [];

      if (firebaseAvailable) {
        // FIREBASE DISPONIBLE: Usar Firebase como fuente de verdad
        console.log('🔥 Firebase disponible - usando como fuente de verdad');
        movimientosFinales = [...movimientosFirebase];

        // Agregar de localStorage solo los que no están en Firebase (datos pendientes de sincronizar)
        // IMPORTANTE: Normalizar IDs para comparación (pueden venir con o sin prefijo "movimiento_")
        const normalizarIdParaComparacion = id => {
          const idStr = String(id || '');
          return idStr.startsWith('movimiento_')
            ? idStr.replace(/^movimiento_/, '').split('_')[0]
            : idStr;
        };

        // IMPORTANTE: Crear un Map con los firebaseIds de los movimientos de Firebase
        // para poder preservarlos cuando se combinan con localStorage
        const firebaseIdsMap = new Map();
        movimientosFirebase.forEach(mov => {
          const idNormalizado = normalizarIdParaComparacion(mov.id);
          if (mov.firebaseId) {
            firebaseIdsMap.set(idNormalizado, mov.firebaseId);
          }
        });

        const idsFirebase = new Set(
          movimientosFirebase.map(m => normalizarIdParaComparacion(m.id))
        );
        const pendientes = movimientosLocal.filter(m => {
          const idNormalizado = normalizarIdParaComparacion(m.id);
          return !idsFirebase.has(idNormalizado);
        });

        // Restaurar firebaseId en los movimientos de localStorage si corresponde
        pendientes.forEach(mov => {
          const idNormalizado = normalizarIdParaComparacion(mov.id);
          if (firebaseIdsMap.has(idNormalizado) && !mov.firebaseId) {
            mov.firebaseId = firebaseIdsMap.get(idNormalizado);
            console.log(`🔧 Restaurando firebaseId para movimiento ${mov.id}: ${mov.firebaseId}`);
          }
        });

        if (pendientes.length > 0) {
          console.log(
            `📤 ${pendientes.length} movimientos pendientes de sincronización encontrados en caché`
          );
          movimientosFinales = [...movimientosFinales, ...pendientes];
        }

        // Asegurar que todos los movimientos de Firebase tengan su firebaseId preservado
        movimientosFinales = movimientosFinales.map(mov => {
          const idNormalizado = normalizarIdParaComparacion(mov.id);
          if (firebaseIdsMap.has(idNormalizado) && !mov.firebaseId) {
            mov.firebaseId = firebaseIdsMap.get(idNormalizado);
          }
          return mov;
        });

        // Actualizar cache con datos de Firebase (actualizar timestamp)
        this.setMovimientos(movimientosFinales, true);
      } else {
        // FIREBASE NO DISPONIBLE: Usar localStorage como fallback
        console.warn('⚠️ Firebase no disponible - usando caché (localStorage)');
        this.showOfflineIndicator();
        _usingCache = true;

        movimientosFinales = [...movimientosLocal];

        // Mostrar advertencia si hay datos en cache pero son antiguos
        const lastSync = this.getLastSyncTimestamp();
        const hoursSinceSync = (Date.now() - lastSync) / (1000 * 60 * 60);
        if (lastSync > 0 && hoursSinceSync > 24) {
          console.warn(
            `⚠️ Los datos en caché tienen más de ${Math.floor(hoursSinceSync)} horas de antigüedad`
          );
        }
      }

      // Ordenar por fecha de consumo más reciente primero
      movimientosFinales.sort((a, b) => {
        const fechaAStr = a.fechaConsumo || a.fecha || a.fechaconsumo || a.fechaCreacion || '';
        const fechaBStr = b.fechaConsumo || b.fecha || b.fechaconsumo || b.fechaCreacion || '';

        if (/^\d{4}-\d{2}-\d{2}$/.test(fechaAStr) && /^\d{4}-\d{2}-\d{2}$/.test(fechaBStr)) {
          return fechaBStr.localeCompare(fechaAStr);
        }

        const fechaA = new Date(fechaAStr || 0);
        const fechaB = new Date(fechaBStr || 0);
        return fechaB - fechaA;
      });

      console.log(
        `📊 Total movimientos: ${movimientosFinales.length} (${firebaseAvailable ? 'Firebase' : 'Caché'}: ${firebaseAvailable ? movimientosFirebase.length : movimientosLocal.length})`
      );

      return movimientosFinales;
    } catch (e) {
      console.error('❌ Error loading diesel movements:', e);
      // Fallback final a localStorage si todo falla
      try {
        const data = localStorage.getItem(this.storageKey);
        const fallback = data ? JSON.parse(data) : [];
        this.showOfflineIndicator();
        console.warn('⚠️ Usando fallback a localStorage debido a error');
        return this.filterByTenant(fallback);
      } catch (error) {
        return [];
      }
    }
  }

  /**
   * Guarda movimientos en localStorage (solo como cache)
   * @param {Array} movimientos - Array de movimientos a guardar
   * @param {boolean} fromFirebase - Indica si los datos vienen de Firebase (para actualizar timestamp)
   */
  setMovimientos(movimientos, fromFirebase = false) {
    try {
      // IMPORTANTE: Si NO viene de Firebase, preservar movimientos existentes que puedan estar pendientes de sincronización
      if (!fromFirebase) {
        // Leer movimientos existentes para preservar los que puedan estar pendientes
        try {
          const existingData = localStorage.getItem(this.storageKey);
          if (existingData) {
            const existingMovs = JSON.parse(existingData);
            // Combinar: priorizar los nuevos, pero mantener los existentes que no estén en los nuevos
            const idsNuevos = new Set(movimientos.map(m => String(m.id)));
            const pendientes = existingMovs.filter(m => !idsNuevos.has(String(m.id)));
            if (pendientes.length > 0) {
              console.log(`📋 Preservando ${pendientes.length} movimientos pendientes en caché`);
              movimientos = [...movimientos, ...pendientes];
            }
          }
        } catch (e) {
          console.warn('⚠️ Error al preservar movimientos pendientes:', e);
        }
      }

      localStorage.setItem(this.storageKey, JSON.stringify(movimientos));
      if (fromFirebase) {
        this.setLastSyncTimestamp();
      }
    } catch (e) {
      console.error('❌ Error saving diesel movements to cache:', e);
    }
  }

  async saveMovimiento(movimiento) {
    // Verificar si es una actualización o un nuevo movimiento
    const esActualizacion = movimiento.id && movimiento.id !== null && movimiento.id !== undefined;

    // IMPORTANTE: Extraer el ID numérico si viene con prefijo "movimiento_"
    let idNumerico = movimiento.id;
    if (typeof movimiento.id === 'string' && movimiento.id.startsWith('movimiento_')) {
      idNumerico = movimiento.id.replace('movimiento_', '');
      console.log(
        `🔧 ID con prefijo detectado, extrayendo ID numérico: ${movimiento.id} → ${idNumerico}`
      );
    }

    // Si no hay ID y es un nuevo movimiento, generar uno
    if (!idNumerico && !esActualizacion) {
      idNumerico = Date.now().toString();
      console.log(`🔧 Generando nuevo ID para movimiento: ${idNumerico}`);
    }

    // Asegurar que idNumerico siempre tenga un valor válido
    if (!idNumerico || idNumerico === undefined || idNumerico === null) {
      idNumerico = Date.now().toString();
      console.log(`🔧 ID era inválido, generando nuevo ID: ${idNumerico}`);
    }

    // El ID del documento en Firebase siempre tiene el prefijo "movimiento_"
    // IMPORTANTE: Si es una actualización, SIEMPRE obtener el firebaseId desde Firebase (fuente de verdad)
    let movimientoId;
    if (esActualizacion) {
      // IMPORTANTE: Para actualizaciones, SIEMPRE buscar el firebaseId directamente en Firebase
      // No depender de getMovimiento() que puede usar caché
      if (esActualizacion && this.isFirebaseAvailable() && !movimiento.firebaseId) {
        try {
          console.log(
            `🔍 Buscando firebaseId directamente en Firebase para movimiento ${idNumerico}...`
          );

          // Buscar directamente en Firebase sin usar caché
          const movimientosFirebase = await window.firebaseRepos.diesel.getAllMovimientos();
          const movimientosFiltrados = this.filterByTenant(movimientosFirebase || []);

          // IMPORTANTE: Log para ver qué IDs vienen directamente de getAllMovimientos()
          console.log(
            '🔍 [DEBUG] IDs obtenidos de getAllMovimientos() (primeros 3):',
            movimientosFiltrados.slice(0, 3).map(m => ({
              id: m.id,
              tipo: typeof m.id,
              idString: String(m.id),
              tieneFirebaseId: Boolean(m.firebaseId),
              idCompleto: m.id
            }))
          );

          // IMPORTANTE: Log para ver qué IDs vienen de Firebase
          console.log(
            '🔍 IDs obtenidos de Firebase (primeros 5):',
            movimientosFiltrados.slice(0, 5).map(m => ({
              id: m.id,
              tipo: typeof m.id,
              tieneFirebaseId: Boolean(m.firebaseId),
              idCompleto: String(m.id)
            }))
          );

          // Normalizar función
          const normalizarId = id => {
            const idStr = String(id || '');
            if (idStr.startsWith('movimiento_')) {
              return idStr.replace(/^movimiento_/, '').split('_')[0];
            }
            return idStr;
          };

          // IMPORTANTE: mov.id YA ES el ID completo del documento de Firebase (ej: "movimiento_1765561293515_0r5t9k6k2")
          // NO normalizar aquí, solo buscar usando el ID que viene
          // Buscar TODOS los movimientos con el mismo ID numérico
          const movimientosConMismoId = movimientosFiltrados.filter(mov => {
            // mov.id es el ID completo del documento (ej: "movimiento_1765561293515_0r5t9k6k2")
            const idMovStr = String(mov.id || '');
            if (!idMovStr.startsWith('movimiento_')) {
              console.warn(`⚠️ Movimiento sin prefijo "movimiento_": ${idMovStr}`);
              return false;
            }

            // Extraer el número base del ID completo
            const idMovNormalizado = idMovStr.replace(/^movimiento_/, '').split('_')[0];
            const idBuscadoNormalizado = normalizarId(idNumerico);
            const coincide = idMovNormalizado === idBuscadoNormalizado;

            if (coincide) {
              console.log(
                `✅ Movimiento encontrado: ID completo=${idMovStr}, ID normalizado=${idMovNormalizado}`
              );
            }

            return coincide;
          });

          console.log(
            `🔍 Total movimientos con ID ${idNumerico} encontrados: ${movimientosConMismoId.length}`
          );
          if (movimientosConMismoId.length > 0) {
            console.log(
              '🔍 IDs completos de movimientos encontrados:',
              movimientosConMismoId.map(m => ({
                id: m.id,
                tipo: typeof m.id,
                idString: String(m.id)
              }))
            );
          }

          if (movimientosConMismoId.length > 0) {
            // Si hay múltiples, preferir el que tiene sufijo (es el original)
            // El que tiene sufijo tiene más partes en el ID: "movimiento_123456_xxxxx" vs "movimiento_123456"
            const movimientoEncontrado =
              movimientosConMismoId.find(mov => {
                const idStr = String(mov.id);
                const partes = idStr.split('_');
                return partes.length > 2; // Tiene sufijo si tiene más de 2 partes (movimiento_123456_xxxxx)
              }) || movimientosConMismoId[0]; // Si no tiene sufijo, usar el primero

            if (movimientoEncontrado && movimientoEncontrado.id) {
              // IMPORTANTE: movimientoEncontrado.id YA ES el ID completo de Firebase
              // NO normalizar, usar directamente
              const firebaseIdCompleto = String(movimientoEncontrado.id);

              console.log('🔍 [DEBUG] movimientoEncontrado:', {
                id: movimientoEncontrado.id,
                tipo: typeof movimientoEncontrado.id,
                idString: String(movimientoEncontrado.id),
                firebaseIdCompleto: firebaseIdCompleto,
                tienePrefijo: firebaseIdCompleto.startsWith('movimiento_')
              });

              // Verificar que el ID tenga el formato correcto
              if (!firebaseIdCompleto.startsWith('movimiento_')) {
                console.error(
                  `❌ ERROR: El ID obtenido no tiene el formato correcto: ${firebaseIdCompleto}`
                );
                console.error(`   Debería ser: movimiento_${idNumerico}_xxxxx`);
                console.error('   movimientoEncontrado completo:', movimientoEncontrado);
                // Intentar construir el ID completo si es posible
                // Pero esto no debería pasar si getAllMovimientos() devuelve el ID correcto
              } else {
                movimiento.firebaseId = firebaseIdCompleto;
                console.log(
                  `✅ firebaseId obtenido directamente desde Firebase: ${movimiento.firebaseId} (de ${movimientosConMismoId.length} movimiento(s) encontrado(s))`
                );

                if (movimientosConMismoId.length > 1) {
                  console.warn(
                    `⚠️ ADVERTENCIA: Se encontraron ${movimientosConMismoId.length} movimientos con el mismo ID numérico. Usando el que tiene sufijo (original).`
                  );
                  console.log(
                    '   IDs encontrados:',
                    movimientosConMismoId.map(m => m.id)
                  );
                }
              }
            } else {
              console.error(
                '❌ ERROR: Movimiento encontrado pero sin ID válido:',
                movimientoEncontrado
              );
              console.error('   movimientosConMismoId:', movimientosConMismoId);
            }
          } else {
            console.warn(`⚠️ No se encontró movimiento con ID ${idNumerico} en Firebase`);
            console.log(
              '   IDs disponibles:',
              movimientosFiltrados.slice(0, 5).map(m => m.id)
            );
          }
        } catch (error) {
          console.warn('⚠️ Error obteniendo firebaseId desde Firebase:', error);
        }
      }

      if (movimiento.firebaseId) {
        // Usar el ID completo de Firebase que ya existe
        movimientoId = movimiento.firebaseId;
        console.log(
          `🔧 [saveMovimiento] Usando ID completo de Firebase para actualización: ${movimientoId}`
        );

        // DESTACAR SI ES EL REGISTRO ESPECÍFICO
        if (
          movimientoId === 'movimiento_1765562765957_th0hsd1xp' ||
          String(idNumerico) === '1765562765957'
        ) {
          console.log(
            '🎯🎯🎯 [saveMovimiento] ¡USANDO firebaseId CORRECTO DEL REGISTRO ESPECÍFICO! 🎯🎯🎯'
          );
          console.log('🎯 movimientoId:', movimientoId);
          console.log('🎯 idNumerico:', idNumerico);
        }
      } else {
        // Si aún no tiene firebaseId, intentar construir el ID (último recurso)
        movimientoId = `movimiento_${idNumerico}`;
        console.error(
          `❌ ERROR: Movimiento a actualizar no tiene firebaseId. Usando ID construido: ${movimientoId}. Esto CREARÁ UN DUPLICADO.`
        );
      }
    } else {
      // Nuevo movimiento: generar ID con sufijo aleatorio
      movimientoId = `movimiento_${idNumerico}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Guardar el ID numérico en los datos del movimiento (para consistencia)
    // IMPORTANTE: idNumerico ya está validado arriba, así que siempre será válido
    movimiento.id = idNumerico;

    console.log(`✅ ID asignado al movimiento: ${movimiento.id} (tipo: ${typeof movimiento.id})`);

    console.log(
      esActualizacion ? '🔄 Actualizando movimiento existente' : '➕ Creando nuevo movimiento',
      'ID numérico:',
      idNumerico,
      'ID Firebase:',
      movimientoId,
      '(tipo:',
      typeof idNumerico,
      ')'
    );

    // SIEMPRE priorizar fechaConsumo/fechaconsumo sobre fecha (fecha puede ser del sistema)
    // Solo usar fecha si está en formato YYYY-MM-DD (no ISO string)
    let fechaGuardar = movimiento.fechaConsumo || movimiento.fechaconsumo || '';

    // Si no hay fechaConsumo, solo usar fecha si está en formato YYYY-MM-DD
    if (!fechaGuardar && movimiento.fecha) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(movimiento.fecha)) {
        fechaGuardar = movimiento.fecha;
      } else {
        // Si fecha es un ISO string, ignorarlo y usar fecha actual como último recurso
        console.warn(
          '⚠️ Movimiento tiene fecha como ISO string, usando fecha actual:',
          movimiento.fecha
        );
        fechaGuardar = new Date().toISOString().split('T')[0];
      }
    }

    // Si aún no hay fecha, usar fecha actual como último recurso
    if (!fechaGuardar) {
      fechaGuardar = new Date().toISOString().split('T')[0];
    }

    console.log(
      '📅 Fecha capturada del formulario (fechaConsumo):',
      movimiento.fechaConsumo || movimiento.fechaconsumo
    );
    console.log('📅 Fecha que se guardará:', fechaGuardar);

    // SIEMPRE guardar en localStorage primero para asegurar persistencia
    const movimientos = await this.getMovimientos();
    console.log(`📊 Total de movimientos en cache: ${movimientos.length}`);

    let movimientoActualizado;
    let movimientosActualizados;

    if (esActualizacion) {
      // ACTUALIZAR movimiento existente
      // Normalizar IDs para comparación: extraer número si tiene prefijo "movimiento_"
      const normalizarId = id => {
        if (typeof id === 'string' && id.startsWith('movimiento_')) {
          return id.replace('movimiento_', '');
        }
        return String(id);
      };

      const idBuscadoNormalizado = normalizarId(movimiento.id);
      console.log(
        `🔍 Buscando movimiento con ID: ${movimiento.id} (normalizado: ${idBuscadoNormalizado}, tipo: ${typeof movimiento.id})`
      );

      // Buscar el movimiento existente de múltiples formas
      const movimientoExistente = movimientos.find(m => {
        const idMovNormalizado = normalizarId(m.id);
        const idMovNum = Number(idMovNormalizado);
        const idBuscadoNum = Number(idBuscadoNormalizado);

        return (
          idMovNormalizado === idBuscadoNormalizado ||
          String(m.id) === String(movimiento.id) ||
          (idMovNum === idBuscadoNum && !isNaN(idMovNum) && !isNaN(idBuscadoNum))
        );
      });

      if (movimientoExistente) {
        console.log('✅ Movimiento existente encontrado:', {
          id: movimientoExistente.id,
          firebaseId: movimientoExistente.firebaseId,
          tipo: typeof movimientoExistente.id,
          estacion: movimientoExistente.estacionServicio
        });

        // IMPORTANTE: Si el movimiento que viene del formulario tiene un firebaseId diferente,
        // usar el del movimiento existente (es el correcto)
        if (movimientoExistente.firebaseId && !movimiento.firebaseId) {
          movimiento.firebaseId = movimientoExistente.firebaseId;
          console.log(
            `🔧 Asignando firebaseId del movimiento existente: ${movimientoExistente.firebaseId}`
          );
        }
        // Mantener la fecha de creación original y todos los campos del movimiento actualizado
        // IMPORTANTE: El orden importa - primero movimientoExistente (mantiene campos no editados),
        // luego movimiento (sobrescribe con los nuevos datos del formulario)
        // IMPORTANTE: Preservar el firebaseId del movimiento existente (es el correcto)
        const firebaseIdCorrecto = movimientoExistente.firebaseId || movimiento.firebaseId;
        if (!firebaseIdCorrecto) {
          console.warn(
            `⚠️ ADVERTENCIA: Movimiento existente no tiene firebaseId. ID: ${movimientoExistente.id}`
          );
        } else {
          console.log(`✅ firebaseId encontrado en movimiento existente: ${firebaseIdCorrecto}`);
        }

        movimientoActualizado = {
          ...movimientoExistente, // Mantener todos los datos originales (incluyendo campos que no están en el formulario)
          ...movimiento, // Sobrescribir con los nuevos datos del formulario
          id: movimiento.id, // Asegurar que el ID se mantenga
          firebaseId: firebaseIdCorrecto, // IMPORTANTE: Mantener el firebaseId original (no puede ser undefined)
          fecha: fechaGuardar,
          fechaConsumo: movimiento.fechaConsumo || movimiento.fechaconsumo || fechaGuardar,
          fechaCreacion: movimientoExistente.fechaCreacion || new Date().toISOString(), // Mantener fecha de creación original
          fechaActualizacion: new Date().toISOString() // Agregar fecha de actualización
        };

        console.log('📝 Comparación de movimientos:');
        console.log('  ANTES:', {
          id: movimientoExistente.id,
          estacion: movimientoExistente.estacionServicio,
          operador: movimientoExistente.operadorPrincipal,
          litros: movimientoExistente.litros,
          costoTotal: movimientoExistente.costoTotal
        });
        console.log('  DESPUÉS:', {
          id: movimientoActualizado.id,
          estacion: movimientoActualizado.estacionServicio,
          operador: movimientoActualizado.operadorPrincipal,
          litros: movimientoActualizado.litros,
          costoTotal: movimientoActualizado.costoTotal
        });
        console.log('  DATOS DEL FORMULARIO:', {
          estacion: movimiento.estacionServicio,
          operador: movimiento.operadorPrincipal,
          litros: movimiento.litros,
          costoTotal: movimiento.costoTotal
        });

        // Actualizar el array removiendo el antiguo y agregando el actualizado
        // IMPORTANTE: Si hay firebaseId, usarlo para eliminar el movimiento correcto (evitar duplicados)
        const normalizarId = id => {
          if (typeof id === 'string' && id.startsWith('movimiento_')) {
            return id.replace(/^movimiento_/, '').split('_')[0]; // Extraer solo el número base
          }
          return String(id);
        };

        const idBuscadoNormalizado = normalizarId(movimiento.id);
        const firebaseIdABuscar = movimientoExistente.firebaseId || movimiento.firebaseId;

        const movimientosFiltrados = movimientos.filter(m => {
          // Si tenemos firebaseId, usar ese para la comparación exacta
          if (firebaseIdABuscar && m.firebaseId) {
            return m.firebaseId !== firebaseIdABuscar;
          }

          // Si no hay firebaseId, usar la lógica de normalización de ID
          const idMovNormalizado = normalizarId(m.id);
          const idMovNum = Number(idMovNormalizado);
          const idBuscadoNum = Number(idBuscadoNormalizado);

          // Mantener todos los que NO coincidan con el ID
          return !(
            idMovNormalizado === idBuscadoNormalizado ||
            String(m.id) === String(movimiento.id) ||
            (idMovNum === idBuscadoNum && !isNaN(idMovNum) && !isNaN(idBuscadoNum))
          );
        });

        // IMPORTANTE: Verificar si hay duplicados con el mismo ID numérico y eliminarlos todos
        const movimientosConMismoId = movimientos.filter(m => {
          const idMovNormalizado = normalizarId(m.id);
          const idBuscadoNormalizado2 = normalizarId(movimiento.id);
          return idMovNormalizado === idBuscadoNormalizado2;
        });

        if (movimientosConMismoId.length > 1) {
          console.warn(
            `⚠️ Se encontraron ${movimientosConMismoId.length} movimientos con el mismo ID numérico. Eliminando TODOS los duplicados.`
          );
          console.log(
            '   Duplicados encontrados:',
            movimientosConMismoId.map(m => ({ id: m.id, firebaseId: m.firebaseId }))
          );

          // Eliminar TODOS los movimientos con el mismo ID numérico del array filtrado
          // El movimiento actualizado se agregará después
          const idBuscadoNormalizado3 = normalizarId(movimiento.id);
          const movimientosSinDuplicados = movimientosFiltrados.filter(m => {
            const idMovNormalizado = normalizarId(m.id);
            return idMovNormalizado !== idBuscadoNormalizado3;
          });

          movimientosActualizados = [movimientoActualizado, ...movimientosSinDuplicados];
          console.log(
            `🔍 Eliminados ${movimientosConMismoId.length} duplicados. Movimientos: ${movimientos.length} → ${movimientosActualizados.length}`
          );
        } else {
          movimientosActualizados = [movimientoActualizado, ...movimientosFiltrados];
          console.log(
            `🔍 Movimientos filtrados: ${movimientos.length} → ${movimientosFiltrados.length} (+ 1 actualizado = ${movimientosActualizados.length})`
          );
        }

        // Verificar que no haya duplicados en el resultado final
        const duplicadosFinales = movimientosActualizados.filter((m, idx, arr) => {
          const idMovNormalizado = normalizarId(m.id);
          return (
            arr.findIndex(
              (m2, idx2) => idx2 !== idx && normalizarId(m2.id) === idMovNormalizado
            ) !== -1
          );
        });

        if (duplicadosFinales.length > 0) {
          console.error(
            `❌ ERROR: Todavía hay ${duplicadosFinales.length} duplicados después del filtrado!`
          );
          console.error(
            '   Duplicados:',
            duplicadosFinales.map(m => ({ id: m.id, firebaseId: m.firebaseId }))
          );
        }

        // Verificar que el movimiento actualizado esté en el array
        const movimientoVerificado = movimientosActualizados.find(
          m => String(m.id) === String(movimiento.id)
        );
        if (movimientoVerificado) {
          console.log(`✅ Movimiento actualizado correctamente en el array (ID: ${movimiento.id})`);
          console.log(
            `   Verificación: estacion=${movimientoVerificado.estacionServicio}, operador=${movimientoVerificado.operadorPrincipal}`
          );
        } else {
          console.error(
            '❌ ERROR: El movimiento actualizado NO se encontró en el array después de actualizar!'
          );
        }

        console.log(
          `📊 Resumen: Movimientos restantes: ${movimientosFiltrados.length}, Total después de actualizar: ${movimientosActualizados.length}`
        );
      } else {
        console.error('❌ Movimiento a actualizar NO encontrado!');
        console.log(
          '🔍 IDs disponibles en movimientos:',
          movimientos.slice(0, 5).map(m => ({ id: m.id, tipo: typeof m.id }))
        );
        console.warn(
          '⚠️ Como no se encontró, se creará como nuevo registro (esto causará duplicación)'
        );
        // Si no se encuentra, crear uno nuevo PERO mantener el ID original
        movimientoActualizado = {
          ...movimiento, // Incluir todos los campos del movimiento
          id: movimiento.id, // Mantener el ID original
          fecha: fechaGuardar,
          fechaConsumo: movimiento.fechaConsumo || movimiento.fechaconsumo || fechaGuardar,
          fechaCreacion: movimiento.fechaCreacion || new Date().toISOString(),
          fechaActualizacion: new Date().toISOString()
        };
        movimientosActualizados = [movimientoActualizado, ...movimientos];
        console.warn('⚠️ Nuevo movimiento creado con ID existente (esto causará duplicación)');
      }
    } else {
      // CREAR nuevo movimiento
      // IMPORTANTE: Asegurar que siempre tenga un ID válido
      // idNumerico ya está validado y siempre tiene un valor válido en este punto
      // movimientoId ya se generó arriba con el sufijo aleatorio para nuevos movimientos
      movimientoActualizado = {
        ...movimiento, // Incluir todos los campos primero
        id: idNumerico, // Usar idNumerico que ya está validado (no undefined)
        firebaseId: movimientoId, // Guardar el ID completo de Firebase para futuras actualizaciones
        fecha: fechaGuardar,
        fechaConsumo: movimiento.fechaConsumo || movimiento.fechaconsumo || fechaGuardar,
        fechaCreacion: new Date().toISOString()
      };

      // Verificar que el ID esté correcto
      if (
        !movimientoActualizado.id ||
        movimientoActualizado.id === undefined ||
        movimientoActualizado.id === null
      ) {
        console.error(
          '❌ ERROR: movimientoActualizado.id es inválido después de asignar idNumerico'
        );
        movimientoActualizado.id = idNumerico || Date.now().toString();
      }

      console.log(
        '🆕 Nuevo movimiento creado con ID:',
        movimientoActualizado.id,
        'firebaseId:',
        movimientoActualizado.firebaseId,
        '(tipo:',
        typeof movimientoActualizado.id,
        ')'
      );

      // Asegurar que fechaConsumo esté establecido
      if (!movimientoActualizado.fechaConsumo) {
        movimientoActualizado.fechaConsumo = fechaGuardar;
      }

      movimientosActualizados = [movimientoActualizado, ...movimientos];
      console.log('✅ Nuevo movimiento guardado en localStorage');
    }

    // Guardar en cache primero (para persistencia inmediata, no sincronizado aún)
    this.setMovimientos(movimientosActualizados, false);

    // PRIORIDAD: Guardar en Firebase (fuente de verdad)
    if (window.firebaseRepos && window.firebaseRepos.diesel) {
      // Verificar si el circuit breaker está activo
      if (window.FirebaseQuotaManager && !window.FirebaseQuotaManager.canRetry()) {
        const minutosRestantes = window.FirebaseQuotaManager.retryAfter
          ? Math.ceil((window.FirebaseQuotaManager.retryAfter - new Date()) / 1000 / 60)
          : 5;
        console.warn(
          `⚠️ Circuit breaker activo. No se intentará guardar en Firebase por ${minutosRestantes} minutos más.`
        );
        console.log('✅ Movimiento guardado solo en localStorage (Firebase en pausa por quota)');
        return movimientoActualizado;
      }

      try {
        // IMPORTANTE: Si es una actualización, eliminar duplicados (documentos sin sufijo) ANTES de guardar
        if (esActualizacion && movimiento.firebaseId && movimiento.firebaseId.includes('_')) {
          try {
            // Extraer el ID numérico del firebaseId
            const idNumerico = movimiento.firebaseId.replace(/^movimiento_/, '').split('_')[0];
            const idSinSufijo = `movimiento_${idNumerico}`;

            // Si el firebaseId tiene sufijo (es el original), eliminar el duplicado sin sufijo si existe
            if (movimiento.firebaseId !== idSinSufijo) {
              console.log(`🔍 Buscando duplicado sin sufijo para eliminar: ${idSinSufijo}`);

              // Verificar si existe el documento sin sufijo
              const docSinSufijo = await window.firebaseRepos.diesel.get(idSinSufijo);
              if (docSinSufijo) {
                console.log(`🗑️ Eliminando duplicado sin sufijo: ${idSinSufijo}`);
                await window.firebaseRepos.diesel.delete(idSinSufijo);
                console.log(`✅ Duplicado sin sufijo eliminado: ${idSinSufijo}`);
              } else {
                console.log(`✅ No existe duplicado sin sufijo: ${idSinSufijo}`);
              }
            }
          } catch (deleteError) {
            console.warn(
              '⚠️ Error intentando eliminar duplicado sin sufijo (continuando con el guardado):',
              deleteError
            );
            // Continuar con el guardado incluso si falla la eliminación del duplicado
          }
        }

        // Esperar a que el repositorio esté inicializado
        let attempts = 0;
        while (
          attempts < 10 &&
          (!window.firebaseRepos.diesel.db || !window.firebaseRepos.diesel.tenantId)
        ) {
          attempts++;
          console.log(`⏳ Esperando inicialización del repositorio diesel... (${attempts}/10)`);
          await new Promise(resolve => setTimeout(resolve, 500));
          await window.firebaseRepos.diesel.init();
        }

        if (window.firebaseRepos.diesel.db && window.firebaseRepos.diesel.tenantId) {
          console.log(
            esActualizacion
              ? '🔥 Intentando actualizar movimiento diesel en Firebase...'
              : '🔥 Intentando guardar movimiento diesel en Firebase...'
          );
          // IMPORTANTE: Asegurar que movimientoActualizado tenga un ID válido antes de guardar
          if (
            !movimientoActualizado.id ||
            movimientoActualizado.id === undefined ||
            movimientoActualizado.id === null
          ) {
            console.error(
              '❌ ERROR: movimientoActualizado no tiene ID válido:',
              movimientoActualizado
            );
            // Usar el idNumerico que ya tenemos
            movimientoActualizado.id = idNumerico || Date.now().toString();
            console.log('🔧 ID asignado a movimientoActualizado:', movimientoActualizado.id);
          }

          // Remover campos undefined del objeto antes de guardar en Firebase
          const movimientoParaFirebase = {};
          Object.keys(movimientoActualizado).forEach(key => {
            // IMPORTANTE: No incluir firebaseId en los datos del documento (solo se usa como ID del documento)
            if (
              key !== 'firebaseId' &&
              movimientoActualizado[key] !== undefined &&
              movimientoActualizado[key] !== null
            ) {
              movimientoParaFirebase[key] = movimientoActualizado[key];
            }
          });

          // Asegurar que el ID esté presente (no puede ser undefined ni null)
          // IMPORTANTE: Usar idNumerico como fuente de verdad, ya que está validado
          const idFinal = idNumerico || movimientoActualizado.id || Date.now().toString();
          if (
            !idFinal ||
            idFinal === undefined ||
            idFinal === null ||
            String(idFinal) === 'undefined' ||
            String(idFinal) === 'null'
          ) {
            console.error('❌ ERROR CRÍTICO: No se pudo obtener un ID válido para el movimiento');
            console.error(
              '   idNumerico:',
              idNumerico,
              'movimientoActualizado.id:',
              movimientoActualizado.id
            );
            throw new Error('No se pudo generar un ID válido para el movimiento');
          }
          movimientoParaFirebase.id = String(idFinal); // Asegurar que sea string

          // Verificar que el objeto no tenga campos undefined antes de enviar
          const tieneUndefined = Object.keys(movimientoParaFirebase).some(
            key => movimientoParaFirebase[key] === undefined
          );
          if (tieneUndefined) {
            console.error(
              '❌ ERROR: movimientoParaFirebase tiene campos undefined:',
              movimientoParaFirebase
            );
            // Eliminar campos undefined
            Object.keys(movimientoParaFirebase).forEach(key => {
              if (movimientoParaFirebase[key] === undefined) {
                delete movimientoParaFirebase[key];
              }
            });
          }

          console.log(`📋 Firebase ID: ${movimientoId}, Datos validados:`, {
            id: movimientoParaFirebase.id,
            tipoId: typeof movimientoParaFirebase.id,
            estacion: movimientoParaFirebase.estacionServicio,
            operador: movimientoParaFirebase.operadorPrincipal,
            tieneId: Boolean(movimientoParaFirebase.id),
            idNumerico: idNumerico
          });

          try {
            const resultado = await window.firebaseRepos.diesel.saveMovimiento(
              movimientoId,
              movimientoParaFirebase
            );
            if (resultado) {
              console.log(
                esActualizacion
                  ? '✅ Movimiento diesel actualizado en Firebase (fuente de verdad)'
                  : '✅ Movimiento diesel guardado en Firebase (fuente de verdad)'
              );
              console.log(`📋 Movimiento guardado en Firebase con ID: ${movimientoId}`);
              // Actualizar cache después de guardar en Firebase (marcar como sincronizado)
              // IMPORTANTE: Mantener movimientosActualizados porque ya incluye el movimiento guardado
              this.setMovimientos(movimientosActualizados, true);
              this.showFirebaseIndicator();

              // Esperar un poco antes de recargar para asegurar que Firebase haya actualizado
              console.log('⏳ Esperando 500ms para asegurar sincronización con Firebase...');
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              console.error(
                '❌ ERROR: saveMovimiento retornó false - No se pudo guardar en Firebase'
              );
              console.warn(
                '⚠️ No se pudo guardar en Firebase, pero ya está guardado en caché (localStorage)'
              );
              this.showOfflineIndicator();
            }
          } catch (firebaseError) {
            // Verificar si es error de quota
            const isQuotaError =
              firebaseError &&
              (firebaseError.code === 'resource-exhausted' ||
                firebaseError.message?.includes('Quota exceeded') ||
                firebaseError.message?.includes('quota'));

            if (isQuotaError) {
              console.warn('⚠️ Error de quota en Firebase. Movimiento guardado en localStorage.');
              if (window.FirebaseQuotaManager) {
                window.FirebaseQuotaManager.checkQuotaExceeded(firebaseError);
              }
            } else {
              console.error('❌ Error guardando movimiento diesel en Firebase:', firebaseError);
              console.log('⚠️ Movimiento ya guardado en localStorage como respaldo');
            }
          }
        } else {
          console.warn(
            '⚠️ Repositorio diesel no inicializado, movimiento guardado solo en localStorage'
          );
        }
      } catch (firebaseError) {
        console.error('❌ Error guardando movimiento diesel en Firebase:', firebaseError);
        console.log('✅ Movimiento ya guardado en localStorage como respaldo');
      }
    }

    return movimientoActualizado;
  }

  async deleteMovimiento(id) {
    console.log('🗑️ [deleteMovimiento] Iniciando eliminación del movimiento:', id);

    // PRIORIDAD 1: Buscar el movimiento en Firebase para obtener el firebaseId correcto
    let firebaseIdAEliminar = null;
    let movimientosEncontrados = []; // Declarar en scope amplio

    if (this.isFirebaseAvailable() && window.fs && window.firebaseRepos?.diesel?.db) {
      try {
        console.log(
          '🔍 [deleteMovimiento] Buscando movimiento en Firebase para obtener firebaseId...'
        );

        const normalizarId = id => {
          if (typeof id === 'string' && id.startsWith('movimiento_')) {
            return id.replace(/^movimiento_/, '').split('_')[0];
          }
          return String(id);
        };

        const idBuscadoNormalizado = normalizarId(id);
        const idCompleto = String(id || '');
        const buscarPorIdCompleto = idCompleto.startsWith('movimiento_');

        const collectionRef = window.fs.collection(window.firebaseRepos.diesel.db, 'diesel');
        const q = window.fs.query(
          collectionRef,
          window.fs.where('tipo', '==', 'movimiento'),
          window.fs.where('tenantId', '==', window.firebaseRepos.diesel.tenantId),
          window.fs.where('deleted', '==', false)
        );

        const snapshot = await window.fs.getDocs(q);
        movimientosEncontrados = []; // Inicializar

        snapshot.forEach(doc => {
          const data = doc.data();
          const docId = doc.id;
          const idNumerico = normalizarId(docId);

          const coincidePorDocId = idNumerico === idBuscadoNormalizado;
          const coincidePorCampoId =
            String(data.id || '') === String(id) ||
            String(data.id || '') === String(idBuscadoNormalizado);
          const coincidePorIdCompleto = buscarPorIdCompleto && docId === idCompleto;

          if (coincidePorDocId || coincidePorCampoId || coincidePorIdCompleto) {
            movimientosEncontrados.push({
              docId: docId,
              idNumerico: idNumerico,
              data: data
            });
          }
        });

        if (movimientosEncontrados.length > 0) {
          // Preferir el que tiene sufijo (es el original)
          const movimientoEncontrado =
            movimientosEncontrados.find(m => {
              const partes = m.docId.split('_');
              const tieneSufijo = partes.length > 2;

              if (buscarPorIdCompleto && m.docId === idCompleto) {
                return true; // Coincidencia exacta
              }

              return tieneSufijo;
            }) || movimientosEncontrados[0];

          firebaseIdAEliminar = movimientoEncontrado.docId;
          console.log('✅ [deleteMovimiento] firebaseId encontrado:', firebaseIdAEliminar);

          // Si hay múltiples, eliminar todos para evitar duplicados
          if (movimientosEncontrados.length > 1) {
            console.warn(
              `⚠️ [deleteMovimiento] Se encontraron ${movimientosEncontrados.length} movimientos con el mismo ID. Eliminando todos.`
            );
          }
        } else {
          console.warn(
            '⚠️ [deleteMovimiento] No se encontró movimiento en Firebase. Intentando eliminar con ID construido.'
          );
        }
      } catch (error) {
        console.error('❌ [deleteMovimiento] Error buscando en Firebase:', error);
      }
    }

    // Si no se encontró, intentar construir el ID
    if (!firebaseIdAEliminar) {
      firebaseIdAEliminar = `movimiento_${id}`;
      console.warn('⚠️ [deleteMovimiento] Usando ID construido:', firebaseIdAEliminar);
    }

    const movimientos = await this.getMovimientos();

    // Asegurar que movimientos sea un array
    if (!Array.isArray(movimientos)) {
      console.error('⚠️ getMovimientos no devolvió un array:', movimientos);
      return;
    }

    const filtered = movimientos.filter(m => m.id !== id && String(m.id) !== String(id));
    this.setMovimientos(filtered);
    console.log(`💾 Movimiento ${id} eliminado de localStorage`);

    // Eliminar también de Firebase
    if (window.firebaseRepos?.diesel) {
      try {
        // Asegurar que el repositorio esté inicializado
        let attempts = 0;
        while (
          attempts < 10 &&
          (!window.firebaseRepos.diesel.db || !window.firebaseRepos.diesel.tenantId)
        ) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 200));
          await window.firebaseRepos.diesel.init();
        }

        if (!window.firebaseRepos.diesel.db || !window.firebaseRepos.diesel.tenantId) {
          console.warn('⚠️ No se pudo inicializar el repositorio de diesel');
        } else {
          console.log(
            `🗑️ [deleteMovimiento] Eliminando de Firebase con ID: ${firebaseIdAEliminar}`
          );
          const resultado = await window.firebaseRepos.diesel.delete(firebaseIdAEliminar);
          if (resultado) {
            console.log(
              `✅ Movimiento ${firebaseIdAEliminar} eliminado de Firebase (fuente de verdad)`
            );
            // Actualizar cache después de eliminar en Firebase (marcar como sincronizado)
            this.setMovimientos(filtered, true);
            this.showFirebaseIndicator();

            // Si se encontraron múltiples movimientos, eliminar todos los duplicados
            if (movimientosEncontrados && movimientosEncontrados.length > 1) {
              console.log(
                `🗑️ [deleteMovimiento] Eliminando ${movimientosEncontrados.length - 1} duplicado(s) adicional(es)...`
              );
              for (const mov of movimientosEncontrados) {
                if (mov.docId !== firebaseIdAEliminar) {
                  try {
                    await window.firebaseRepos.diesel.delete(mov.docId);
                    console.log(`✅ [deleteMovimiento] Duplicado eliminado: ${mov.docId}`);
                  } catch (error) {
                    console.warn(
                      `⚠️ [deleteMovimiento] Error eliminando duplicado ${mov.docId}:`,
                      error
                    );
                  }
                }
              }
            }
          } else {
            console.warn(`⚠️ No se pudo eliminar el movimiento ${firebaseIdAEliminar} de Firebase`);
            this.showOfflineIndicator();
          }
        }
      } catch (firebaseError) {
        console.error('❌ Error eliminando de Firebase:', firebaseError);
        console.error('❌ Detalles del error:', firebaseError.message, firebaseError.stack);
      }
    } else {
      console.warn('⚠️ Repositorio de Firebase Diesel no disponible');
    }
  }

  async getMovimiento(id) {
    // PRIORIDAD 1: Buscar directamente en Firebase (fuente de verdad)
    if (this.isFirebaseAvailable()) {
      try {
        // Normalizar el ID para buscar
        const normalizarId = id => {
          if (typeof id === 'string' && id.startsWith('movimiento_')) {
            return id.replace(/^movimiento_/, '').split('_')[0]; // Extraer solo el número base
          }
          return String(id);
        };

        const idBuscadoNormalizado = normalizarId(id);

        // IMPORTANTE: Obtener directamente desde Firestore para tener acceso al ID del documento
        // getAllMovimientos() puede normalizar, necesitamos el ID completo del documento
        if (window.firebaseRepos.diesel.db && window.firebaseRepos.diesel.tenantId && window.fs) {
          try {
            console.log('🔍 [getMovimiento] ==========================================');
            console.log('🔍 [getMovimiento] INICIANDO BÚSQUEDA en Firestore');
            console.log(`🔍 [getMovimiento] ID recibido: ${id} (tipo: ${typeof id})`);
            console.log(`🔍 [getMovimiento] ID normalizado para búsqueda: ${idBuscadoNormalizado}`);

            // BUSCAR TAMBIÉN POR ID COMPLETO SI VIENE CON PREFIJO
            const idCompleto = String(id || '');
            const buscarPorIdCompleto = idCompleto.startsWith('movimiento_');

            console.log(
              `🔍 [getMovimiento] ¿Buscar por ID completo? ${buscarPorIdCompleto} (ID completo: ${idCompleto})`
            );

            const collectionRef = window.fs.collection(window.firebaseRepos.diesel.db, 'diesel');
            const q = window.fs.query(
              collectionRef,
              window.fs.where('tipo', '==', 'movimiento'),
              window.fs.where('tenantId', '==', window.firebaseRepos.diesel.tenantId),
              window.fs.where('deleted', '==', false)
            );

            const snapshot = await window.fs.getDocs(q);
            const movimientosEncontrados = [];

            console.log(`🔍 [getMovimiento] Total documentos en Firestore: ${snapshot.size}`);

            snapshot.forEach(doc => {
              const data = doc.data();
              const docId = doc.id; // ID completo del documento (ej: "movimiento_1765561836475_30y42u8d4")
              const idNumerico = normalizarId(docId); // Extraer número base

              // Comparar con el ID buscado (tanto por doc.id como por campo id dentro del documento)
              const coincidePorDocId = idNumerico === idBuscadoNormalizado;
              const coincidePorCampoId =
                String(data.id || '') === String(id) ||
                String(data.id || '') === String(idBuscadoNormalizado);

              // NUEVO: Si el ID buscado es completo (con prefijo), comparar directamente con doc.id
              const coincidePorIdCompleto = buscarPorIdCompleto && docId === idCompleto;

              if (coincidePorDocId || coincidePorCampoId || coincidePorIdCompleto) {
                console.log('✅ [getMovimiento] Movimiento ENCONTRADO:', {
                  docId: docId,
                  dataId: data.id,
                  idNumerico: idNumerico,
                  coincidePorDocId: coincidePorDocId,
                  coincidePorCampoId: coincidePorCampoId,
                  coincidePorIdCompleto: coincidePorIdCompleto
                });

                // DESTACAR SI ES EL REGISTRO ESPECÍFICO QUE BUSCAMOS
                if (
                  docId === 'movimiento_1765562765957_th0hsd1xp' ||
                  idCompleto === 'movimiento_1765562765957_th0hsd1xp'
                ) {
                  console.log('🎯🎯🎯 [getMovimiento] ¡ENCONTRADO EL REGISTRO ESPECÍFICO! 🎯🎯🎯');
                  console.log(`🎯 doc.id completo: ${docId}`);
                  console.log(`🎯 data.id: ${data.id}`);
                  console.log('🎯 data completo:', data);
                }

                movimientosEncontrados.push({
                  docId: docId, // ID completo del documento
                  idNumerico: idNumerico,
                  data: data,
                  campoId: data.id // Campo id dentro del documento
                });
              }
            });

            console.log(
              `🔍 [getMovimiento] Total movimientos encontrados: ${movimientosEncontrados.length}`
            );

            if (movimientosEncontrados.length > 0) {
              console.log(
                '📋 [getMovimiento] IDs de movimientos encontrados:',
                movimientosEncontrados.map(m => m.docId)
              );

              // Si hay múltiples, preferir el que tiene sufijo (es el original)
              // Un ID con sufijo tiene más de 2 partes: "movimiento_123456_xxxxx" vs "movimiento_123456"
              const movimientoEncontrado =
                movimientosEncontrados.find(m => {
                  const partes = m.docId.split('_');
                  const tieneSufijo = partes.length > 2;
                  console.log(
                    `🔍 [getMovimiento] Evaluando: docId=${m.docId}, partes=${partes.length}, tieneSufijo=${tieneSufijo}`
                  );

                  // PRIORIZAR EL ID EXACTO SI VIENE COMO PARÁMETRO
                  if (buscarPorIdCompleto && m.docId === idCompleto) {
                    console.log(`🎯 [getMovimiento] Coincidencia EXACTA encontrada: ${m.docId}`);
                    return true;
                  }

                  return tieneSufijo;
                }) || movimientosEncontrados[0];

              const movimiento = {
                ...movimientoEncontrado.data,
                id: movimientoEncontrado.idNumerico, // ID numérico para compatibilidad
                firebaseId: movimientoEncontrado.docId // ID completo del documento de Firebase
              };

              console.log('✅ [getMovimiento] Movimiento encontrado directamente en Firestore:', {
                id: movimiento.id,
                firebaseId: movimiento.firebaseId,
                estacion: movimiento.estacionServicio,
                totalEncontrados: movimientosEncontrados.length,
                docId: movimientoEncontrado.docId,
                campoId: movimientoEncontrado.campoId
              });

              // DESTACAR SI ES EL REGISTRO ESPECÍFICO
              if (movimiento.firebaseId === 'movimiento_1765562765957_th0hsd1xp') {
                console.log('🎯🎯🎯 [getMovimiento] ¡RETORNANDO EL REGISTRO ESPECÍFICO! 🎯🎯🎯');
                console.log(`🎯 firebaseId: ${movimiento.firebaseId}`);
                console.log(`🎯 id numérico: ${movimiento.id}`);
              }

              if (movimientosEncontrados.length > 1) {
                console.warn(
                  `⚠️ Se encontraron ${movimientosEncontrados.length} movimientos con el mismo ID. Usando el que tiene sufijo.`
                );
                console.warn(
                  '   IDs encontrados:',
                  movimientosEncontrados.map(m => m.docId)
                );
              }

              console.log('🔍 [getMovimiento] ==========================================');
              return movimiento;
            }
            console.warn(`⚠️ [getMovimiento] No se encontró movimiento en Firestore con ID: ${id}`);
            console.log(
              '🔍 [getMovimiento] IDs disponibles (primeros 5):',
              Array.from(snapshot.docs.slice(0, 5).map(doc => doc.id))
            );
            console.log('🔍 [getMovimiento] ==========================================');
          } catch (firestoreError) {
            console.error('❌ Error buscando directamente en Firestore:', firestoreError);
            console.warn('⚠️ Continuando con getAllMovimientos() como fallback');
          }
        } else {
          console.warn('⚠️ [getMovimiento] No se puede buscar directamente en Firestore:', {
            tieneDb: Boolean(window.firebaseRepos.diesel.db),
            tieneTenantId: Boolean(window.firebaseRepos.diesel.tenantId),
            tieneFs: Boolean(window.fs)
          });
        }

        // Fallback: usar getAllMovimientos() si la búsqueda directa falla
        const movimientosFirebase = await window.firebaseRepos.diesel.getAllMovimientos();
        const movimientosFiltrados = this.filterByTenant(movimientosFirebase || []);

        // IMPORTANTE: mov.id YA ES el ID completo del documento de Firebase (ej: "movimiento_1765560700896_xxxxx")
        // Normalizar correctamente para preservar el firebaseId
        const movimientosNormalizados = movimientosFiltrados.map(mov => {
          // El ID del documento es el ID completo de Firebase
          const idOriginal = String(mov.id || '');
          if (idOriginal.startsWith('movimiento_')) {
            const idCompletoFirebase = idOriginal; // Este es el ID completo del documento
            const idNumerico = idOriginal.replace(/^movimiento_/, '').split('_')[0]; // Extraer número base

            console.log(
              `🔧 [getMovimiento] Normalizando: ${idCompletoFirebase} → id: ${idNumerico}, firebaseId: ${idCompletoFirebase}`
            );

            return {
              ...mov,
              id: idNumerico, // ID numérico para compatibilidad
              firebaseId: idCompletoFirebase // IMPORTANTE: Preservar el ID completo
            };
          }
          // Si no tiene prefijo, puede que ya venga normalizado
          console.warn(`⚠️ [getMovimiento] Movimiento sin prefijo "movimiento_": ${idOriginal}`);
          return mov;
        });

        console.log(
          `🔍 Movimientos normalizados de Firebase (total: ${movimientosNormalizados.length}):`,
          movimientosNormalizados.map(m => ({
            id: m.id,
            firebaseId: m.firebaseId,
            tipo: typeof m.id,
            idOriginal: m.id
          }))
        );

        const movimiento = movimientosNormalizados.find(m => {
          const idMovNormalizado = normalizarId(m.id);
          const idMovNum = Number(idMovNormalizado);
          const idBuscadoNum = Number(idBuscadoNormalizado);

          return (
            idMovNormalizado === idBuscadoNormalizado ||
            String(m.id) === String(id) ||
            (idMovNum === idBuscadoNum && !isNaN(idMovNum) && !isNaN(idBuscadoNum))
          );
        });

        if (movimiento) {
          console.log('✅ Movimiento encontrado en Firebase (fuente de verdad):', {
            id: movimiento.id,
            firebaseId: movimiento.firebaseId,
            estacion: movimiento.estacionServicio
          });
          return movimiento;
        }
      } catch (error) {
        console.warn('⚠️ Error buscando movimiento en Firebase, usando fallback:', error);
      }
    }

    // PRIORIDAD 2: Fallback a cache/localStorage si Firebase no está disponible o no se encontró
    const movimientos = await this.getMovimientos();

    // Asegurar que movimientos sea un array
    if (!Array.isArray(movimientos)) {
      console.error('⚠️ getMovimientos no devolvió un array:', movimientos);
      return null;
    }

    // Normalizar el ID para buscar (extraer número si tiene prefijo "movimiento_")
    const normalizarId = id => {
      if (typeof id === 'string' && id.startsWith('movimiento_')) {
        return id.replace(/^movimiento_/, '').split('_')[0];
      }
      return String(id);
    };

    const idBuscadoNormalizado = normalizarId(id);
    const idBuscadoNum = Number(idBuscadoNormalizado);

    const movimiento = movimientos.find(m => {
      const idMovNormalizado = normalizarId(m.id);
      const idMovNum = Number(idMovNormalizado);

      return (
        idMovNormalizado === idBuscadoNormalizado ||
        String(m.id) === String(id) ||
        (idMovNum === idBuscadoNum && !isNaN(idMovNum) && !isNaN(idBuscadoNum))
      );
    });

    if (!movimiento) {
      console.warn(
        `⚠️ Movimiento con ID ${id} (normalizado: ${idBuscadoNormalizado}) no encontrado. Total movimientos: ${movimientos.length}`
      );
      console.log(
        '🔍 Primeros IDs disponibles:',
        movimientos.slice(0, 5).map(m => ({
          id: m.id,
          tipo: typeof m.id,
          idNormalizado: normalizarId(m.id),
          firebaseId: m.firebaseId || 'NO TIENE'
        }))
      );
    } else if (!movimiento.firebaseId) {
      console.warn('⚠️ Movimiento encontrado en cache pero SIN firebaseId:', movimiento.id);
    }

    return movimiento || null;
  }
}

// ===== Diesel UI Manager =====
class DieselUI {
  constructor() {
    this.dieselManager = new DieselManager();
  }

  async loadHistorialTable() {
    const tbody = document.getElementById('tablaHistorialDiesel');
    if (!tbody) {
      return;
    }

    tbody.innerHTML =
      '<tr><td colspan="11" class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

    const movimientos = await this.dieselManager.getMovimientos();
    tbody.innerHTML = '';

    if (movimientos.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="11" class="text-center text-muted">No hay registros de diesel</td></tr>';
      const contenedorPaginacion = document.getElementById('paginacionDiesel');
      if (contenedorPaginacion) {
        contenedorPaginacion.innerHTML = '';
      }
      return;
    }

    // Función auxiliar para normalizar fechas a formato YYYY-MM-DD
    const normalizarFecha = mov => {
      // Prioridad: fechaConsumo > fechaconsumo > fecha (solo si fecha está en formato YYYY-MM-DD)
      let fechaStr = mov.fechaConsumo || mov.fechaconsumo || '';

      // Solo usar fecha si está en formato YYYY-MM-DD (no ISO string)
      if (!fechaStr && mov.fecha) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(mov.fecha)) {
          fechaStr = mov.fecha;
        } else {
          // Si fecha es un ISO string, ignorarlo y usar fechaCreacion como último recurso
          console.warn('⚠️ Movimiento tiene fecha como ISO string, ignorando:', mov.id, mov.fecha);
        }
      }

      // Si la fecha está vacía, intentar extraer de fechaCreacion
      if (!fechaStr && mov.fechaCreacion) {
        try {
          const fechaCreacion = new Date(mov.fechaCreacion);
          if (!isNaN(fechaCreacion.getTime())) {
            fechaStr = fechaCreacion.toISOString().split('T')[0];
          }
        } catch (e) {
          // Ignorar errores
        }
      }

      return fechaStr || '';
    };

    // Ordenar movimientos por fecha de consumo descendente (más recientes primero)
    movimientos.sort((a, b) => {
      const fechaAStr = normalizarFecha(a);
      const fechaBStr = normalizarFecha(b);

      // Si ambas fechas están en formato YYYY-MM-DD, compararlas directamente como strings
      if (/^\d{4}-\d{2}-\d{2}$/.test(fechaAStr) && /^\d{4}-\d{2}-\d{2}$/.test(fechaBStr)) {
        // Comparar como strings en orden descendente (más reciente primero)
        // "2025-11-29" > "2025-11-28" > "2025-11-27"
        const comparacion = fechaBStr.localeCompare(fechaAStr);
        return comparacion;
      }

      // Si una fecha está vacía, ponerla al final
      if (!fechaAStr) {
        return 1;
      }
      if (!fechaBStr) {
        return -1;
      }

      // Para otros formatos, convertir a Date
      try {
        const fechaA = new Date(fechaAStr);
        const fechaB = new Date(fechaBStr);
        if (isNaN(fechaA.getTime())) {
          return 1;
        }
        if (isNaN(fechaB.getTime())) {
          return -1;
        }
        return fechaB.getTime() - fechaA.getTime(); // Orden descendente (más reciente primero)
      } catch (e) {
        // Si hay error, comparar como strings
        return fechaBStr.localeCompare(fechaAStr);
      }
    });

    console.log(
      '📅 Movimientos ordenados por fecha (todos):',
      movimientos.map(m => ({
        id: m.id,
        fechaConsumo: m.fechaConsumo,
        fecha: m.fecha,
        fechaconsumo: m.fechaconsumo,
        fechaNormalizada: normalizarFecha(m)
      }))
    );

    // Función auxiliar para obtener nombre del operador desde ID
    const obtenerNombreOperador = async operadorId => {
      if (!operadorId || operadorId === '-') {
        return '-';
      }

      // Si ya es un nombre (no parece un ID de Firebase), retornarlo directamente
      if (!/^[A-Za-z0-9]{20,}$/.test(operadorId)) {
        return operadorId;
      }

      // Usar sistema de caché inteligente: Firebase primero, luego caché
      try {
        const operadores = await window.getDataWithCache('operadores', async () => {
          let operadoresData = [];

          // Intentar desde configuracionManager
          if (
            window.configuracionManager &&
            typeof window.configuracionManager.getAllOperadores === 'function'
          ) {
            operadoresData = window.configuracionManager.getAllOperadores() || [];
          }

          // Si no hay datos, intentar desde Firebase
          if (operadoresData.length === 0 && window.firebaseDb && window.fs) {
            try {
              // Buscar en configuracion/operadores
              const operadoresDocRef = window.fs.doc(
                window.firebaseDb,
                'configuracion',
                'operadores'
              );
              const operadoresDoc = await window.fs.getDoc(operadoresDocRef);

              if (operadoresDoc.exists()) {
                const data = operadoresDoc.data();
                if (data.operadores && Array.isArray(data.operadores)) {
                  operadoresData = data.operadores;
                }
              }

              // Si aún no hay datos, buscar en colección operadores
              if (operadoresData.length === 0) {
                const operadoresRef = window.fs.collection(window.firebaseDb, 'operadores');
                const tenantId =
                  window.firebaseAuth?.currentUser?.uid ||
                  window.DEMO_CONFIG?.tenantId ||
                  'demo_tenant';
                const querySnapshot = await window.fs.getDocs(
                  window.fs.query(operadoresRef, window.fs.where('tenantId', '==', tenantId))
                );

                operadoresData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              }
            } catch (error) {
              console.warn('⚠️ Error obteniendo operadores desde Firebase:', error);
            }
          }

          return operadoresData;
        });

        const operador = operadores.find(
          op =>
            op.id === operadorId ||
            op.licencia === operadorId ||
            op.numeroLicencia === operadorId ||
            op.nombre === operadorId
        );

        if (operador && operador.nombre) {
          return operador.nombre;
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo operador desde caché:', error);
      }

      // Fallback: Intentar desde Firebase directamente (por si el caché falló)
      if (window.firebaseDb && window.fs) {
        try {
          const operadoresRef = window.fs.collection(window.firebaseDb, 'operadores');
          const tenantId = window.firebaseAuth?.currentUser?.uid || 'demo_tenant';
          const querySnapshot = await window.fs.getDocs(
            window.fs.query(operadoresRef, window.fs.where('tenantId', '==', tenantId))
          );

          const operador = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .find(
              op =>
                op.id === operadorId ||
                op.licencia === operadorId ||
                op.numeroLicencia === operadorId
            );

          if (operador && operador.nombre) {
            return operador.nombre;
          }
        } catch (error) {
          console.warn('⚠️ Error obteniendo operador desde Firebase:', error);
        }
      }

      // Fallback: buscar en localStorage
      try {
        const operadoresData = localStorage.getItem('erp_operadores');
        if (operadoresData) {
          const parsed = JSON.parse(operadoresData);
          const operadores = Array.isArray(parsed) ? parsed : Object.values(parsed);
          const operador = operadores.find(
            op =>
              op.id === operadorId ||
              op.licencia === operadorId ||
              op.numeroLicencia === operadorId ||
              op.nombre === operadorId
          );
          if (operador && operador.nombre) {
            return operador.nombre;
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo operador desde localStorage:', error);
      }

      // Si no se encuentra, retornar el ID original
      return operadorId;
    };

    // Función auxiliar para formatear fecha sin problemas de zona horaria
    const formatearFechaDiesel = fecha => {
      if (!fecha) {
        return 'N/A';
      }

      // Si la fecha ya está en formato YYYY-MM-DD, formatearla directamente sin conversión de zona horaria
      if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        const [year, month, day] = fecha.split('-');
        // Crear fecha en zona horaria local para evitar problemas de conversión UTC
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return date.toLocaleDateString('es-MX');
      }

      // Para otros formatos, usar el método original
      try {
        const date = new Date(fecha);
        if (isNaN(date.getTime())) {
          return fecha;
        }
        return date.toLocaleDateString('es-MX');
      } catch (e) {
        return fecha;
      }
    };

    // Procesar todos los movimientos en paralelo para obtener nombres de operadores
    const movimientosConOperadores = await Promise.all(
      movimientos.map(async mov => {
        const operadorNombre = await obtenerNombreOperador(mov.operadorPrincipal);
        return {
          ...mov,
          operadorNombre
        };
      })
    );

    // Re-ordenar después de procesar (por si acaso se perdió el orden)
    movimientosConOperadores.sort((a, b) => {
      const fechaAStr = normalizarFecha(a);
      const fechaBStr = normalizarFecha(b);

      if (/^\d{4}-\d{2}-\d{2}$/.test(fechaAStr) && /^\d{4}-\d{2}-\d{2}$/.test(fechaBStr)) {
        return fechaBStr.localeCompare(fechaAStr);
      }

      if (!fechaAStr) {
        return 1;
      }
      if (!fechaBStr) {
        return -1;
      }

      try {
        const fechaA = new Date(fechaAStr);
        const fechaB = new Date(fechaBStr);
        if (isNaN(fechaA.getTime())) {
          return 1;
        }
        if (isNaN(fechaB.getTime())) {
          return -1;
        }
        return fechaB.getTime() - fechaA.getTime();
      } catch (e) {
        return fechaBStr.localeCompare(fechaAStr);
      }
    });

    console.log(
      '📅 Movimientos FINALES ordenados (primeros 10):',
      movimientosConOperadores.slice(0, 10).map(m => ({
        id: m.id,
        fechaNormalizada: normalizarFecha(m),
        fechaConsumo: m.fechaConsumo,
        fecha: m.fecha,
        fechaFormateada: formatearFechaDiesel(m.fecha || m.fechaConsumo || m.fechaconsumo)
      }))
    );

    // Guardar movimientos completos globalmente para paginación y filtrado
    window._movimientosDieselSinFiltrar = movimientosConOperadores; // Guardar sin filtrar para filtros

    // Aplicar filtros si hay alguno activo
    let movimientosFiltrados = this.aplicarFiltros(movimientosConOperadores);
    window._movimientosDieselCompletos = movimientosFiltrados; // Guardar filtrados para paginación

    // Inicializar paginación
    const PaginacionManagerClass =
      typeof PaginacionManager !== 'undefined'
        ? PaginacionManager
        : typeof window.PaginacionManager !== 'undefined'
          ? window.PaginacionManager
          : null;

    if (!PaginacionManagerClass) {
      console.warn(
        '⚠️ PaginacionManager no está disponible, mostrando todos los registros sin paginación'
      );
      await this.renderizarMovimientosDiesel(movimientosFiltrados);
      return;
    }

    if (!window._paginacionDieselManager) {
      try {
        window._paginacionDieselManager = new PaginacionManagerClass();
        console.log('✅ Nueva instancia de PaginacionManager creada para diesel');
      } catch (error) {
        console.error('❌ Error creando instancia de PaginacionManager:', error);
        await this.renderizarMovimientosDiesel(movimientosFiltrados);
        return;
      }
    }

    try {
      // Crear array de IDs para paginación (usar movimientos filtrados)
      // IMPORTANTE: Filtrar movimientos sin ID válido
      const movimientosValidos = movimientosFiltrados.filter(m => {
        const tieneId = m.id !== null && m.id !== undefined && m.id !== '';
        if (!tieneId) {
          console.warn('⚠️ Movimiento sin ID válido encontrado:', m);
        }
        return tieneId;
      });

      const movimientosIds = movimientosValidos
        .map(m => {
          const idStr = String(m.id || '');
          if (!idStr || idStr === 'undefined' || idStr === 'null') {
            console.error('❌ Movimiento sin ID al convertir a string:', m);
            return null;
          }
          return idStr;
        })
        .filter(id => id !== null && id !== '' && id !== 'undefined' && id !== 'null'); // Filtrar IDs inválidos

      if (movimientosValidos.length !== movimientosFiltrados.length) {
        console.warn(
          `⚠️ Se filtraron ${movimientosFiltrados.length - movimientosValidos.length} movimientos sin ID válido`
        );
      }

      if (movimientosIds.length === 0) {
        console.error('❌ No hay movimientos con IDs válidos para paginar');
        tbody.innerHTML =
          '<tr><td colspan="11" class="text-center text-muted">No hay registros de diesel con IDs válidos</td></tr>';
        return;
      }

      // Usar movimientos válidos para la paginación
      movimientosFiltrados = movimientosValidos;
      window._movimientosDieselCompletos = movimientosFiltrados; // Actualizar con filtros aplicados
      window._paginacionDieselManager.inicializar(movimientosIds, 15);
      window._paginacionDieselManager.paginaActual = 1;
      console.log(
        `✅ Paginación inicializada: ${window._paginacionDieselManager.totalRegistros} registros, ${window._paginacionDieselManager.obtenerTotalPaginas()} páginas`
      );

      // Renderizar registros de la página actual
      await this.renderizarMovimientosDiesel();

      // Generar controles de paginación
      const contenedorPaginacion = document.getElementById('paginacionDiesel');
      if (contenedorPaginacion && window._paginacionDieselManager) {
        contenedorPaginacion.innerHTML = window._paginacionDieselManager.generarControlesPaginacion(
          'paginacionDiesel',
          'cambiarPaginaDiesel'
        );
      }
    } catch (error) {
      console.error('❌ Error al inicializar paginación:', error);
      await this.renderizarMovimientosDiesel(movimientosFiltrados);
    }
  }

  async renderizarMovimientosDiesel(movimientosParaRenderizar = null) {
    const tbody = document.getElementById('tablaHistorialDiesel');
    if (!tbody) {
      return;
    }

    // Si se proporcionan movimientos específicos, renderizarlos directamente
    if (movimientosParaRenderizar) {
      tbody.innerHTML = '';
      if (movimientosParaRenderizar.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="11" class="text-center text-muted">No hay registros de diesel</td></tr>';
        return;
      }

      movimientosParaRenderizar.forEach(mov => {
        const tr = document.createElement('tr');
        const fechaParaMostrar =
          mov.fechaConsumo ||
          mov.fechaconsumo ||
          (mov.fecha && /^\d{4}-\d{2}-\d{2}$/.test(mov.fecha) ? mov.fecha : null) ||
          (mov.fechaCreacion ? new Date(mov.fechaCreacion).toISOString().split('T')[0] : '');
        tr.innerHTML = `
          <td>${mov.id}</td>
          <td>${this.formatearFechaDiesel(fechaParaMostrar)}</td>
          <td>${mov.estacionServicio || '-'}</td>
          <td>${mov.economico || '-'}</td>
          <td>${mov.placas || '-'}</td>
          <td>${mov.litros || 0}</td>
          <td>$${parseFloat(mov.costoPorLitro || 0).toFixed(2)}</td>
          <td>$${this.formatearNumeroConComas(mov.costoTotal)}</td>
          <td>${this.formatFormaPago(mov.formaPago)}</td>
          <td>${mov.operadorNombre || mov.operadorPrincipal || '-'}</td>
          <td>
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-outline-info" onclick="dieselUI.verDetalles(${mov.id})" title="Ver detalles">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-outline-warning" onclick="dieselUI.editarMovimiento(${mov.id})" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="dieselUI.descargarPDFDiesel(${mov.id})" title="Descargar PDF">
                <i class="fas fa-file-pdf"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="dieselUI.eliminarMovimiento(${mov.id})" title="Eliminar">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
      return;
    }

    // Si no se proporcionan, usar paginación
    if (!window._paginacionDieselManager || !window._movimientosDieselCompletos) {
      console.warn(
        '⚠️ No se puede renderizar: paginacion=',
        Boolean(window._paginacionDieselManager),
        'movimientos=',
        Boolean(window._movimientosDieselCompletos)
      );
      return;
    }

    const movimientosIds = window._paginacionDieselManager.obtenerRegistrosPagina();
    const movimientosMap = {};
    window._movimientosDieselCompletos.forEach(mov => {
      movimientosMap[mov.id.toString()] = mov;
    });

    const movimientosPagina = movimientosIds
      .map(id => movimientosMap[id])
      .filter(mov => mov !== undefined);

    tbody.innerHTML = '';

    if (movimientosPagina.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="11" class="text-center text-muted">No hay registros de diesel</td></tr>';
      return;
    }

    // Función auxiliar para formatear fecha
    const formatearFechaDiesel = fecha => {
      if (!fecha) {
        return 'N/A';
      }
      if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        const [year, month, day] = fecha.split('-');
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return date.toLocaleDateString('es-MX');
      }
      try {
        const date = new Date(fecha);
        if (isNaN(date.getTime())) {
          return fecha;
        }
        return date.toLocaleDateString('es-MX');
      } catch (e) {
        return fecha;
      }
    };

    movimientosPagina.forEach(mov => {
      const tr = document.createElement('tr');
      const fechaParaMostrar =
        mov.fechaConsumo ||
        mov.fechaconsumo ||
        (mov.fecha && /^\d{4}-\d{2}-\d{2}$/.test(mov.fecha) ? mov.fecha : null) ||
        (mov.fechaCreacion ? new Date(mov.fechaCreacion).toISOString().split('T')[0] : '');
      tr.innerHTML = `
        <td>${mov.id}</td>
        <td>${formatearFechaDiesel(fechaParaMostrar)}</td>
        <td>${mov.estacionServicio || '-'}</td>
        <td>${mov.economico || '-'}</td>
        <td>${mov.placas || '-'}</td>
        <td>${mov.litros || 0}</td>
        <td>$${parseFloat(mov.costoPorLitro || 0).toFixed(2)}</td>
        <td>$${this.formatearNumeroConComas(mov.costoTotal)}</td>
        <td>${this.formatFormaPago(mov.formaPago)}</td>
        <td>${mov.operadorNombre || mov.operadorPrincipal || '-'}</td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-info" onclick="dieselUI.verDetalles(${mov.id})" title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-warning" onclick="dieselUI.editarMovimiento(${mov.id})" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="dieselUI.descargarPDFDiesel(${mov.id})" title="Descargar PDF">
              <i class="fas fa-file-pdf"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="dieselUI.eliminarMovimiento(${mov.id})" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Actualizar controles de paginación
    const contenedorPaginacion = document.getElementById('paginacionDiesel');
    if (contenedorPaginacion && window._paginacionDieselManager) {
      contenedorPaginacion.innerHTML = window._paginacionDieselManager.generarControlesPaginacion(
        'paginacionDiesel',
        'cambiarPaginaDiesel'
      );
    }

    console.log(
      `✅ ${window._paginacionDieselManager.totalRegistros} movimientos de diesel cargados (página ${window._paginacionDieselManager.paginaActual} de ${window._paginacionDieselManager.obtenerTotalPaginas()})`
    );
  }

  formatearFechaDiesel(fecha) {
    if (!fecha) {
      return 'N/A';
    }
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const [year, month, day] = fecha.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return date.toLocaleDateString('es-MX');
    }
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) {
        return fecha;
      }
      return date.toLocaleDateString('es-MX');
    } catch (e) {
      return fecha;
    }
  }

  /**
   * Formatea un número con separadores de miles
   * @param {number|string} numero - El número a formatear
   * @param {number} decimales - Número de decimales (default: 2)
   * @returns {string} - Número formateado con comas (ej: "20,096.00")
   */
  formatearNumeroConComas(numero, decimales = 2) {
    const num = parseFloat(numero || 0);
    if (isNaN(num)) {
      return '0.00';
    }

    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    });
  }

  formatFormaPago(formaPago) {
    const formas = {
      efectivo: 'Efectivo',
      transferencia: 'Transferencia',
      tarjeta_credito: 'Tarjeta Crédito',
      tarjeta_debito: 'Tarjeta Débito',
      cheque: 'Cheque',
      vale: 'Vale',
      monedero: 'Monedero',
      otro: 'Otro'
    };
    return formas[formaPago] || formaPago || '-';
  }

  async guardarMovimiento() {
    console.log('🚀 Iniciando guardado de movimiento diesel...');

    // Obtener el botón de guardar y bloquearlo para evitar dobles clics
    const guardarBtn = document.querySelector('[data-action="guardarMovimientoDiesel"]');
    const estadoOriginal = {
      disabled: guardarBtn?.disabled || false,
      innerHTML: guardarBtn?.innerHTML || '',
      classes: guardarBtn?.className || ''
    };

    // Bloquear botón y mostrar "Procesando..."
    if (guardarBtn) {
      guardarBtn.disabled = true;
      guardarBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Procesando...';
      guardarBtn.classList.add('opacity-75');
      guardarBtn.style.cursor = 'not-allowed';
    }

    // Función para restaurar el botón
    const restaurarBoton = () => {
      if (guardarBtn) {
        guardarBtn.disabled = estadoOriginal.disabled;
        guardarBtn.innerHTML = estadoOriginal.innerHTML;
        guardarBtn.className = estadoOriginal.classes;
        guardarBtn.classList.remove('opacity-75');
        guardarBtn.style.cursor = '';
      }
    };

    const form = document.querySelector('.needs-validation');
    if (!form) {
      console.error('❌ Formulario no encontrado');
      this.showNotification('Error: Formulario no encontrado', 'error');
      restaurarBoton();
      return false;
    }

    // Validar formulario
    if (!form.checkValidity()) {
      console.log('⚠️ Formulario no válido, agregando validación visual...');
      form.classList.add('was-validated');
      this.showNotification('Por favor completa todos los campos requeridos', 'error');
      restaurarBoton();
      return false;
    }

    // Obtener nombre del operador desde el input searchable
    const obtenerNombreOperadorDesdeInput = inputId => {
      const visibleInput = document.getElementById(inputId);

      // Prioridad 1: Extraer del texto visible (formato: "Nombre - Licencia")
      // El visible input siempre tiene el formato correcto: "Nombre - Licencia"
      if (visibleInput && visibleInput.value) {
        const partes = visibleInput.value.split(' - ');
        if (partes.length > 0) {
          // Retornar solo la primera parte (el nombre), sin la licencia
          return partes[0].trim();
        }
        return visibleInput.value.trim();
      }

      // Prioridad 2: Si no hay visible input, intentar obtener el nombre desde el caché usando el ID
      // (Este es un fallback, normalmente no debería llegar aquí)
      const hiddenInput = document.getElementById(`${inputId}_value`);
      if (hiddenInput && hiddenInput.value) {
        // El hidden input ahora contiene el ID, no el nombre
        // Intentar buscar el operador en el caché para obtener el nombre
        const operadorId = hiddenInput.value;
        if (window._operadoresCache && Array.isArray(window._operadoresCache)) {
          const operador = window._operadoresCache.find(
            op =>
              op.id === operadorId ||
              op.numeroLicencia === operadorId ||
              op.licencia === operadorId ||
              op.nombre === operadorId
          );
          if (operador) {
            return operador.nombre || operador.nombreOperador || operador.nombreCompleto || '';
          }
        }
      }

      return '';
    };

    // Obtener el número del económico desde el input searchable
    const obtenerNumeroEconomico = () => {
      const hiddenInput = document.getElementById('economico_value');
      const visibleInput = document.getElementById('economico');

      // Prioridad 1: Usar el hidden input (contiene el número)
      if (hiddenInput && hiddenInput.value) {
        return hiddenInput.value;
      }

      // Prioridad 2: Extraer del texto visible (formato: "numero - marca modelo (placa)")
      if (visibleInput && visibleInput.value) {
        const match = visibleInput.value.match(/^(\d+)/);
        if (match) {
          return match[1];
        }
        return visibleInput.value.trim();
      }

      return '';
    };

    // Recopilar datos del formulario
    const operadorPrincipalInput = document.getElementById('operadorprincipal');
    const operadorPrincipalHidden = document.getElementById('operadorprincipal_value');
    const operadorPrincipalNombre = obtenerNombreOperadorDesdeInput('operadorprincipal');
    const operadorPrincipalId =
      operadorPrincipalHidden?.value || operadorPrincipalInput?.value || '';

    const operadorSecundarioInput = document.getElementById('operadorsecundario');
    const operadorSecundarioHidden = document.getElementById('operadorsecundario_value');
    const operadorSecundarioNombre = operadorSecundarioInput?.value
      ? obtenerNombreOperadorDesdeInput('operadorsecundario')
      : '';
    const operadorSecundarioId =
      operadorSecundarioHidden?.value || operadorSecundarioInput?.value || '';

    const economicoNumero = obtenerNumeroEconomico();

    const movimiento = {
      estacionServicio: document.getElementById('estacionservicio')?.value || '',
      fechaConsumo: document.getElementById('fechaconsumo')?.value || '',
      economico: economicoNumero,
      kilometraje: document.getElementById('kilometraje')?.value || '',
      placas: document.getElementById('Placas')?.value || '',
      litros: parseFloat(document.getElementById('Litros')?.value || 0),
      costoPorLitro: parseFloat(document.getElementById('costoporlitro')?.value || 0),
      costoTotal: parseFloat(
        document.getElementById('costototal')?.value?.replace(/[$,]/g, '') || 0
      ),
      formaPago: document.getElementById('formapago')?.value || '',
      operadorPrincipal: operadorPrincipalNombre || operadorPrincipalId, // Guardar nombre, no ID
      operadorPrincipalId: operadorPrincipalId, // Guardar también el ID por si acaso
      operadorSecundario: operadorSecundarioNombre || operadorSecundarioId, // Guardar nombre, no ID
      operadorSecundarioId: operadorSecundarioId, // Guardar también el ID por si acaso
      observaciones: document.querySelector('input[name="Observaciones"]:checked')?.value || 'no',
      descripcionObservaciones: document.getElementById('descripcion')?.value || ''
    };

    console.log('📝 Datos del movimiento:', movimiento);

    // Validar datos críticos
    if (
      !movimiento.estacionServicio ||
      !movimiento.fechaConsumo ||
      !movimiento.economico ||
      !movimiento.litros ||
      !movimiento.costoPorLitro
    ) {
      console.error('❌ Datos críticos faltantes');
      this.showNotification('Por favor completa todos los campos requeridos', 'error');
      restaurarBoton();
      return false;
    }

    try {
      // Verificar si estamos editando un movimiento existente
      const form = document.querySelector('.needs-validation');
      const editingId = form?.dataset?.editingId;

      if (editingId) {
        // Actualizar movimiento existente
        console.log(`💾 Actualizando movimiento diesel: ${editingId}`);
        movimiento.id = parseInt(editingId, 10);
        await this.dieselManager.saveMovimiento(movimiento);
        console.log('✅ Movimiento actualizado exitosamente');

        // Esperar un poco para asegurar que Firebase haya actualizado antes de recargar
        console.log('⏳ Esperando sincronización con Firebase antes de recargar tabla...');
        await new Promise(resolve => setTimeout(resolve, 800));

        await this.loadHistorialTable();
        this.clearForm();
        this.showNotification('Movimiento de diesel actualizado exitosamente', 'success');
      } else {
        // Crear nuevo movimiento
        console.log('💾 Guardando nuevo movimiento...');
        await this.dieselManager.saveMovimiento(movimiento);
        console.log('✅ Movimiento guardado exitosamente');

        // Esperar un poco para asegurar que Firebase haya actualizado antes de recargar
        console.log('⏳ Esperando sincronización con Firebase antes de recargar tabla...');
        await new Promise(resolve => setTimeout(resolve, 800));

        await this.loadHistorialTable();
        this.clearForm();
        this.showNotification('Movimiento de diesel guardado exitosamente', 'success');
      }

      // NO restaurar el botón aquí porque la página se va a recargar
      // Recargar la página después de limpiar los datos
      setTimeout(() => {
        location.reload();
      }, 500);
      return true;
    } catch (e) {
      console.error('❌ Error saving diesel movement:', e);
      this.showNotification(`Error al guardar el movimiento: ${e.message}`, 'error');
      // Restaurar el botón en caso de error
      restaurarBoton();
      return false;
    }
  }

  clearForm() {
    console.log('🧹 Limpiando formulario...');

    const form = document.querySelector('.needs-validation');
    if (form) {
      form.reset();
      form.classList.remove('was-validated');
      // Remover el ID de edición si existe
      if (form.dataset.editingId) {
        delete form.dataset.editingId;
      }
    }

    // Limpiar campos específicos
    const placas = document.getElementById('Placas');
    if (placas) {
      placas.value = '';
    }

    const costoTotal = document.getElementById('costototal');
    if (costoTotal) {
      costoTotal.value = '';
    }

    // Limpiar campos de searchable selects
    const economicoInput = document.getElementById('economico');
    const economicoValue = document.getElementById('economico_value');
    if (economicoInput) {
      economicoInput.value = '';
    }
    if (economicoValue) {
      economicoValue.value = '';
    }

    const operadorPrincipalInput = document.getElementById('operadorprincipal');
    const operadorPrincipalValue = document.getElementById('operadorprincipal_value');
    if (operadorPrincipalInput) {
      operadorPrincipalInput.value = '';
    }
    if (operadorPrincipalValue) {
      operadorPrincipalValue.value = '';
    }

    const operadorSecundarioInput = document.getElementById('operadorsecundario');
    const operadorSecundarioValue = document.getElementById('operadorsecundario_value');
    if (operadorSecundarioInput) {
      operadorSecundarioInput.value = '';
    }
    if (operadorSecundarioValue) {
      operadorSecundarioValue.value = '';
    }

    // Ocultar observaciones
    const observacionesDiv = document.getElementById('Observaciones');
    if (observacionesDiv) {
      observacionesDiv.style.display = 'none';
    }

    // Resetear radio buttons de observaciones
    const observacionesNo = document.getElementById('observacionesNo');
    if (observacionesNo) {
      observacionesNo.checked = true;
    }

    // Restaurar el botón de guardar
    const guardarBtn = document.querySelector('[data-action="guardarMovimientoDiesel"]');
    if (guardarBtn) {
      guardarBtn.innerHTML = '<i class="fas fa-check"></i> Registrar Consumo';
      guardarBtn.classList.remove('btn-warning');
      guardarBtn.classList.add('btn-primary');
    }

    console.log('✅ Formulario limpiado');
  }

  // Función para aplicar filtros a los movimientos
  aplicarFiltros(movimientos) {
    if (!movimientos || movimientos.length === 0) {
      return movimientos;
    }

    const filtroId = document.getElementById('filtroIdDiesel')?.value.trim().toLowerCase() || '';
    const filtroEstacion =
      document.getElementById('filtroEstacionDiesel')?.value.trim().toLowerCase() || '';
    const filtroEconomico =
      document.getElementById('filtroEconomicoDiesel')?.value.trim().toLowerCase() || '';
    const filtroFormaPago = document.getElementById('filtroFormaPagoDiesel')?.value || '';
    const filtroFechaDesde = document.getElementById('filtroFechaDesdeDiesel')?.value || '';
    const filtroFechaHasta = document.getElementById('filtroFechaHastaDiesel')?.value || '';

    // Si no hay filtros activos, retornar todos los movimientos
    if (
      !filtroId &&
      !filtroEstacion &&
      !filtroEconomico &&
      !filtroFormaPago &&
      !filtroFechaDesde &&
      !filtroFechaHasta
    ) {
      return movimientos;
    }

    // Función auxiliar para normalizar fecha
    const normalizarFecha = mov => {
      let fechaStr = mov.fechaConsumo || mov.fechaconsumo || '';
      if (!fechaStr && mov.fecha && /^\d{4}-\d{2}-\d{2}$/.test(mov.fecha)) {
        fechaStr = mov.fecha;
      }
      if (!fechaStr && mov.fechaCreacion) {
        try {
          const fechaCreacion = new Date(mov.fechaCreacion);
          if (!isNaN(fechaCreacion.getTime())) {
            fechaStr = fechaCreacion.toISOString().split('T')[0];
          }
        } catch (e) {
          // Ignorar error intencionalmente
        }
      }
      return fechaStr || '';
    };

    return movimientos.filter(mov => {
      // Filtro por ID
      if (filtroId) {
        const idStr = String(mov.id || '').toLowerCase();
        if (!idStr.includes(filtroId)) {
          return false;
        }
      }

      // Filtro por Estación
      if (filtroEstacion) {
        const estacion = (mov.estacionServicio || mov.estacionservicio || '').toLowerCase();
        if (!estacion.includes(filtroEstacion)) {
          return false;
        }
      }

      // Filtro por Económico
      if (filtroEconomico) {
        const economico = String(mov.economico || mov.numero || '').toLowerCase();
        if (!economico.includes(filtroEconomico)) {
          return false;
        }
      }

      // Filtro por Forma de Pago
      if (filtroFormaPago) {
        const formaPago = (mov.formaPago || mov.formapago || '').toLowerCase();
        if (formaPago !== filtroFormaPago.toLowerCase()) {
          return false;
        }
      }

      // Filtro por Fecha Desde
      if (filtroFechaDesde) {
        const fechaMov = normalizarFecha(mov);
        if (!fechaMov || fechaMov < filtroFechaDesde) {
          return false;
        }
      }

      // Filtro por Fecha Hasta
      if (filtroFechaHasta) {
        const fechaMov = normalizarFecha(mov);
        if (!fechaMov || fechaMov > filtroFechaHasta) {
          return false;
        }
      }

      return true;
    });
  }

  async verDetalles(id) {
    const movimiento = await this.dieselManager.getMovimiento(id);
    if (!movimiento) {
      this.showNotification('Movimiento no encontrado', 'error');
      return;
    }

    // Función auxiliar para obtener nombre del operador (similar a loadHistorialTable)
    const obtenerNombreOperador = async operadorId => {
      if (!operadorId || operadorId === '-') {
        return '-';
      }

      // Si ya es un nombre (no parece un ID de Firebase), retornarlo directamente
      if (!/^[A-Za-z0-9]{20,}$/.test(operadorId)) {
        return operadorId;
      }

      // Intentar obtener desde configuracionManager
      if (window.configuracionManager) {
        try {
          const operadores = window.configuracionManager.getAllOperadores() || [];
          const operador = operadores.find(
            op =>
              op.id === operadorId ||
              op.licencia === operadorId ||
              op.numeroLicencia === operadorId ||
              op.nombre === operadorId
          );
          if (operador && operador.nombre) {
            return operador.nombre;
          }
        } catch (error) {
          console.warn('⚠️ Error obteniendo operador desde configuracionManager:', error);
        }
      }

      // Intentar desde Firebase
      if (window.firebaseDb && window.fs) {
        try {
          const operadoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
          const operadoresDoc = await window.fs.getDoc(operadoresDocRef);

          if (operadoresDoc.exists()) {
            const data = operadoresDoc.data();
            if (data.operadores && Array.isArray(data.operadores)) {
              const operador = data.operadores.find(
                op =>
                  op.id === operadorId ||
                  op.licencia === operadorId ||
                  op.numeroLicencia === operadorId
              );
              if (operador && operador.nombre) {
                return operador.nombre;
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Error obteniendo operador desde Firebase:', error);
        }
      }

      return operadorId;
    };

    const operadorPrincipalNombre = await obtenerNombreOperador(movimiento.operadorPrincipal);
    const operadorSecundarioNombre = movimiento.operadorSecundario
      ? await obtenerNombreOperador(movimiento.operadorSecundario)
      : '-';

    // Formatear fecha (sin hora, solo fecha)
    let fechaFormateada = 'N/A';
    try {
      // Priorizar fechaConsumo sobre fecha
      const fecha = movimiento.fechaConsumo || movimiento.fechaconsumo || movimiento.fecha;
      if (fecha) {
        // Si la fecha está en formato YYYY-MM-DD, formatearla directamente sin conversión de zona horaria
        if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
          const [year, month, day] = fecha.split('-');
          const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          fechaFormateada = date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        } else {
          // Para otros formatos, convertir a Date pero solo mostrar fecha
          const date = new Date(fecha);
          if (!isNaN(date.getTime())) {
            fechaFormateada = date.toLocaleDateString('es-MX', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
          } else {
            fechaFormateada = fecha;
          }
        }
      }
    } catch (e) {
      fechaFormateada =
        movimiento.fechaConsumo || movimiento.fechaconsumo || movimiento.fecha || 'N/A';
    }

    // Limpiar nombres de operadores (quitar " - Licencia")
    let operadorPrincipalLimpio = operadorPrincipalNombre;
    if (operadorPrincipalLimpio && operadorPrincipalLimpio.includes(' - ')) {
      operadorPrincipalLimpio = operadorPrincipalLimpio.split(' - ')[0].trim();
    }

    let operadorSecundarioLimpio = operadorSecundarioNombre;
    if (
      operadorSecundarioLimpio &&
      operadorSecundarioLimpio !== '-' &&
      operadorSecundarioLimpio.includes(' - ')
    ) {
      operadorSecundarioLimpio = operadorSecundarioLimpio.split(' - ')[0].trim();
    }

    const detallesHTML = `
      <div class="row">
        <div class="col-md-6">
          <p><strong>ID:</strong> ${movimiento.id || 'N/A'}</p>
          <p><strong>Fecha:</strong> ${fechaFormateada}</p>
          <p><strong>Estación de Servicio:</strong> ${movimiento.estacionServicio || '-'}</p>
          <p><strong>Económico/Tractocamion:</strong> ${movimiento.economico || '-'}</p>
          <p><strong>Placas:</strong> ${movimiento.placas || '-'}</p>
          <p><strong>Kilometraje:</strong> ${movimiento.kilometraje || '-'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Litros Consumidos:</strong> ${movimiento.litros || 0}</p>
          <p><strong>Costo por Litro:</strong> $${parseFloat(movimiento.costoPorLitro || 0).toFixed(2)}</p>
          <p><strong>Costo Total:</strong> $${this.formatearNumeroConComas(movimiento.costoTotal)}</p>
          <p><strong>Forma de Pago:</strong> ${this.formatFormaPago(movimiento.formaPago)}</p>
          <p><strong>Operador Principal:</strong> ${operadorPrincipalLimpio}</p>
          <p><strong>Operador Secundario:</strong> ${operadorSecundarioLimpio}</p>
        </div>
      </div>
      ${
  movimiento.observaciones === 'si' && movimiento.descripcionObservaciones
    ? `
        <div class="row mt-3">
          <div class="col-12">
            <p><strong>Observaciones:</strong> Sí</p>
            <p><strong>Descripción:</strong> ${movimiento.descripcionObservaciones}</p>
          </div>
        </div>
      `
    : ''
}
    `;

    // Mostrar en modal
    const modalBody = document.getElementById('modalDetalleDieselBody');
    if (modalBody) {
      modalBody.innerHTML = detallesHTML;
      const modal = new bootstrap.Modal(document.getElementById('modalDetalleDiesel'));
      modal.show();
    } else {
      // Fallback a alert si el modal no existe
      alert(
        `ID: ${movimiento.id}\nFecha: ${fechaFormateada}\nEstación: ${movimiento.estacionServicio || '-'}\nEconómico: ${movimiento.economico || '-'}\nPlacas: ${movimiento.placas || '-'}\nKilometraje: ${movimiento.kilometraje || '-'}\nLitros: ${movimiento.litros || 0}\nCosto por Litro: $${parseFloat(movimiento.costoPorLitro || 0).toFixed(2)}\nCosto Total: $${this.formatearNumeroConComas(movimiento.costoTotal)}\nForma de Pago: ${this.formatFormaPago(movimiento.formaPago)}\nOperador Principal: ${operadorPrincipalLimpio}\nOperador Secundario: ${operadorSecundarioLimpio}`
      );
    }
  }

  async descargarPDFDiesel(id) {
    console.log(`📄 Descargando PDF del movimiento diesel: ${id}`);

    const movimientos = await this.dieselManager.getMovimientos();

    if (!Array.isArray(movimientos)) {
      this.showNotification('Error al cargar movimientos', 'error');
      return;
    }

    const movimiento = movimientos.find(m => m.id === id || String(m.id) === String(id));

    if (!movimiento) {
      this.showNotification('Movimiento no encontrado', 'error');
      return;
    }

    try {
      // Cargar jsPDF si no está disponible
      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Configuración
      const margin = 20;
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const col1X = margin + 5;
      const col2X = pageWidth / 2 + 10;

      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('REGISTRO DE CONSUMO DIESEL', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // ID del movimiento
      doc.setFontSize(12);
      doc.text(`ID: ${id}`, margin, yPosition);
      yPosition += 10;

      // Fecha - Usar fechaConsumo directamente en formato ISO (YYYY-MM-DD) como está en Firebase
      const fechaConsumo =
        movimiento.fechaConsumo || movimiento.fechaconsumo || movimiento.fecha || 'N/A';
      let fechaFormateada = 'N/A';

      if (fechaConsumo && fechaConsumo !== 'N/A') {
        // Si ya está en formato ISO (YYYY-MM-DD), usarla directamente
        if (typeof fechaConsumo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaConsumo)) {
          fechaFormateada = fechaConsumo;
        } else {
          // Si no está en formato ISO, intentar convertirla
          try {
            const date = new Date(fechaConsumo);
            if (!isNaN(date.getTime())) {
              // Convertir a formato ISO YYYY-MM-DD
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              fechaFormateada = `${year}-${month}-${day}`;
            } else {
              fechaFormateada = fechaConsumo;
            }
          } catch (e) {
            fechaFormateada = fechaConsumo;
          }
        }
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de Consumo: ${fechaFormateada}`, margin, yPosition);
      yPosition += 15;

      // Línea separadora
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Información de la Estación
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN DE LA ESTACIÓN', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Guardar posición inicial para ambas columnas
      const startY = yPosition;
      let leftY = startY;
      let rightY = startY;

      // Columna izquierda
      doc.text(`Estación de Servicio: ${movimiento.estacionServicio || 'N/A'}`, col1X, leftY);
      leftY += 6;
      doc.text(`Económico/Tractocamion: ${movimiento.economico || 'N/A'}`, col1X, leftY);
      leftY += 6;
      doc.text(`Placas: ${movimiento.placas || 'N/A'}`, col1X, leftY);
      leftY += 6;
      doc.text(`Kilometraje: ${movimiento.kilometraje || 'N/A'}`, col1X, leftY);
      leftY += 6;

      // Columna derecha
      doc.text(`Litros Consumidos: ${movimiento.litros || 0}`, col2X, rightY);
      rightY += 6;
      doc.text(
        `Costo por Litro: $${parseFloat(movimiento.costoPorLitro || 0).toFixed(2)}`,
        col2X,
        rightY
      );
      rightY += 6;
      doc.text(
        `Costo Total: $${this.formatearNumeroConComas(movimiento.costoTotal)}`,
        col2X,
        rightY
      );
      rightY += 6;
      doc.text(`Forma de Pago: ${this.formatFormaPago(movimiento.formaPago)}`, col2X, rightY);
      rightY += 6;

      // Usar la posición más baja de las dos columnas para continuar
      yPosition = Math.max(leftY, rightY) + 10;

      // Información de Operadores
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN DE OPERADORES', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Limpiar nombres de operadores (quitar " - Licencia")
      let operadorPrincipal = movimiento.operadorPrincipal || 'N/A';
      if (operadorPrincipal.includes(' - ')) {
        operadorPrincipal = operadorPrincipal.split(' - ')[0].trim();
      }

      let operadorSecundario = movimiento.operadorSecundario || 'N/A';
      if (
        operadorSecundario &&
        operadorSecundario !== 'N/A' &&
        operadorSecundario.includes(' - ')
      ) {
        operadorSecundario = operadorSecundario.split(' - ')[0].trim();
      }

      doc.text(`Operador Principal: ${operadorPrincipal}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Operador Secundario: ${operadorSecundario}`, margin, yPosition);
      yPosition += 10;

      // Observaciones (si existen)
      if (movimiento.observaciones === 'si' && movimiento.descripcionObservaciones) {
        doc.text('Observaciones:', margin, yPosition);
        yPosition += 6;
        const splitObservaciones = doc.splitTextToSize(
          movimiento.descripcionObservaciones,
          pageWidth - 2 * margin
        );
        doc.text(splitObservaciones, margin, yPosition);
      }

      // Guardar PDF
      const nombreArchivo = `Diesel_${id}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);

      console.log(`✅ PDF generado exitosamente: ${nombreArchivo}`);
      this.showNotification('PDF del movimiento diesel generado exitosamente', 'success');
    } catch (error) {
      console.error('❌ Error generando PDF del movimiento diesel:', error);
      this.showNotification('Error al generar PDF del movimiento diesel', 'error');
    }
  }

  async editarMovimiento(id) {
    console.log(`✏️ Editando movimiento diesel: ${id}`);
    console.log('🔍 [EDITAR] ==========================================');
    console.log('🔍 [EDITAR] INICIANDO EDICIÓN');
    console.log('🔍 [EDITAR] ID recibido para editar:', id, '(tipo:', typeof id, ')');

    // DESTACAR SI ES EL REGISTRO ESPECÍFICO
    if (String(id) === '1765562765957' || String(id).includes('1765562765957')) {
      console.log('🎯🎯🎯 [EDITAR] ¡EDITANDO EL REGISTRO ESPECÍFICO! 🎯🎯🎯');
      console.log('🎯 ID recibido:', id);
      console.log('🎯 ID como string:', String(id));
    }

    // PASO 1: Buscar directamente en Firebase PRIMERO para obtener el firebaseId correcto
    let movimiento = null;
    let firebaseIdCorrecto = null;

    if (this.dieselManager.isFirebaseAvailable() && window.fs && window.firebaseRepos?.diesel?.db) {
      try {
        console.log('🔍 [EDITAR] PASO 1: Buscando directamente en Firebase antes de editar...');

        const normalizarId = id => {
          if (typeof id === 'string' && id.startsWith('movimiento_')) {
            return id.replace(/^movimiento_/, '').split('_')[0];
          }
          return String(id);
        };

        const idBuscadoNormalizado = normalizarId(id);
        const idCompleto = String(id || '');
        const buscarPorIdCompleto = idCompleto.startsWith('movimiento_');

        console.log('🔍 [EDITAR] Búsqueda:', {
          idOriginal: id,
          idNormalizado: idBuscadoNormalizado,
          buscarPorIdCompleto: buscarPorIdCompleto,
          idCompleto: idCompleto
        });

        const collectionRef = window.fs.collection(window.firebaseRepos.diesel.db, 'diesel');
        const q = window.fs.query(
          collectionRef,
          window.fs.where('tipo', '==', 'movimiento'),
          window.fs.where('tenantId', '==', window.firebaseRepos.diesel.tenantId),
          window.fs.where('deleted', '==', false)
        );

        const snapshot = await window.fs.getDocs(q);
        const movimientosEncontrados = [];

        console.log(`🔍 [EDITAR] Total documentos en Firestore: ${snapshot.size}`);

        snapshot.forEach(doc => {
          const data = doc.data();
          const docId = doc.id;
          const idNumerico = normalizarId(docId);

          const coincidePorDocId = idNumerico === idBuscadoNormalizado;
          const coincidePorCampoId =
            String(data.id || '') === String(id) ||
            String(data.id || '') === String(idBuscadoNormalizado);
          const coincidePorIdCompleto = buscarPorIdCompleto && docId === idCompleto;

          if (coincidePorDocId || coincidePorCampoId || coincidePorIdCompleto) {
            console.log('✅ [EDITAR] Movimiento encontrado en Firebase:', {
              docId: docId,
              dataId: data.id,
              idNumerico: idNumerico,
              coincidePorDocId: coincidePorDocId,
              coincidePorCampoId: coincidePorCampoId,
              coincidePorIdCompleto: coincidePorIdCompleto
            });

            if (
              docId === 'movimiento_1765562765957_th0hsd1xp' ||
              idCompleto === 'movimiento_1765562765957_th0hsd1xp'
            ) {
              console.log('🎯🎯🎯 [EDITAR] ¡REGISTRO ESPECÍFICO ENCONTRADO EN FIREBASE! 🎯🎯🎯');
            }

            movimientosEncontrados.push({
              docId: docId,
              idNumerico: idNumerico,
              data: data
            });
          }
        });

        if (movimientosEncontrados.length > 0) {
          // Preferir el que tiene sufijo (es el original)
          const movimientoEncontrado =
            movimientosEncontrados.find(m => {
              const partes = m.docId.split('_');
              const tieneSufijo = partes.length > 2;

              if (buscarPorIdCompleto && m.docId === idCompleto) {
                return true; // Coincidencia exacta
              }

              return tieneSufijo;
            }) || movimientosEncontrados[0];

          firebaseIdCorrecto = movimientoEncontrado.docId;
          movimiento = {
            ...movimientoEncontrado.data,
            id: movimientoEncontrado.idNumerico,
            firebaseId: movimientoEncontrado.docId
          };

          console.log('✅ [EDITAR] Movimiento encontrado en Firebase:', {
            id: movimiento.id,
            firebaseId: movimiento.firebaseId,
            estacion: movimiento.estacionServicio,
            totalEncontrados: movimientosEncontrados.length
          });

          if (movimiento.firebaseId === 'movimiento_1765562765957_th0hsd1xp') {
            console.log('🎯🎯🎯 [EDITAR] ¡REGISTRO ESPECÍFICO PREPARADO PARA EDICIÓN! 🎯🎯🎯');
            console.log('🎯 firebaseId:', movimiento.firebaseId);
          }

          if (movimientosEncontrados.length > 1) {
            console.warn(
              `⚠️ [EDITAR] Se encontraron ${movimientosEncontrados.length} movimientos. Usando el que tiene sufijo.`
            );
            console.warn(
              '   IDs encontrados:',
              movimientosEncontrados.map(m => m.docId)
            );
          }
        } else {
          console.warn(
            '⚠️ [EDITAR] No se encontró movimiento en Firebase. Usando getMovimiento() como fallback.'
          );
        }
      } catch (error) {
        console.error('❌ [EDITAR] Error buscando en Firebase:', error);
        console.warn('⚠️ [EDITAR] Continuando con getMovimiento() como fallback.');
      }
    } else {
      console.warn('⚠️ [EDITAR] Firebase no disponible. Usando getMovimiento() como fallback.');
    }

    // PASO 2: Si no se encontró en Firebase, usar getMovimiento() como fallback
    if (!movimiento) {
      console.log('🔍 [EDITAR] PASO 2: Usando getMovimiento() como fallback...');
      movimiento = await this.dieselManager.getMovimiento(id);
      console.log('🔍 [EDITAR] Movimiento obtenido de getMovimiento():', {
        id: movimiento?.id,
        firebaseId: movimiento?.firebaseId,
        estacion: movimiento?.estacionServicio
      });
    }

    if (!movimiento) {
      console.error('❌ [EDITAR] Movimiento no encontrado ni en Firebase ni en caché.');
      this.showNotification('Movimiento no encontrado', 'error');
      return;
    }

    // Asegurar que el movimiento tenga el firebaseId correcto
    if (firebaseIdCorrecto && !movimiento.firebaseId) {
      console.log('🔧 [EDITAR] Asignando firebaseId correcto:', firebaseIdCorrecto);
      movimiento.firebaseId = firebaseIdCorrecto;
    }

    console.log('✅ [EDITAR] Movimiento final preparado para editar:', {
      id: movimiento.id,
      firebaseId: movimiento.firebaseId,
      estacion: movimiento.estacionServicio
    });
    console.log('🔍 [EDITAR] ==========================================');

    // Cargar datos en el modal
    document.getElementById('editarDiesel_id').value = id;

    // IMPORTANTE: Guardar el firebaseId en un campo oculto para usarlo al guardar
    let firebaseIdInput = document.getElementById('editarDiesel_firebaseId');
    if (!firebaseIdInput) {
      // Si no existe el campo, crearlo
      firebaseIdInput = document.createElement('input');
      firebaseIdInput.type = 'hidden';
      firebaseIdInput.id = 'editarDiesel_firebaseId';
      const form = document.getElementById('formEditarDiesel');
      if (form) {
        form.appendChild(firebaseIdInput);
      }
    }
    firebaseIdInput.value = movimiento.firebaseId || '';
    console.log('🔧 [EDITAR] firebaseId guardado en campo oculto:', movimiento.firebaseId);
    document.getElementById('editarDiesel_estacionservicio').value =
      movimiento.estacionServicio || '';
    document.getElementById('editarDiesel_fechaconsumo').value =
      movimiento.fechaConsumo || movimiento.fechaconsumo || movimiento.fecha || '';
    document.getElementById('editarDiesel_kilometraje').value = movimiento.kilometraje || '';
    document.getElementById('editarDiesel_placas').value = movimiento.placas || '';
    document.getElementById('editarDiesel_litros').value = movimiento.litros || '';
    document.getElementById('editarDiesel_costoporlitro').value = movimiento.costoPorLitro || '';
    // Formatear el costo total con separadores de miles al cargar en el modal de edición
    const costoTotalFormateado = movimiento.costoTotal
      ? `$${this.formatearNumeroConComas(movimiento.costoTotal)}`
      : '';
    document.getElementById('editarDiesel_costototal').value = costoTotalFormateado;
    document.getElementById('editarDiesel_formapago').value = movimiento.formaPago || '';
    document.getElementById('editarDiesel_descripcion').value =
      movimiento.descripcionObservaciones || '';

    // Establecer observaciones
    const observacionesSi = document.getElementById('editarDiesel_observacionesSi');
    const observacionesNo = document.getElementById('editarDiesel_observacionesNo');
    const observacionesDiv = document.getElementById('editarDiesel_observacionesDiv');

    if (movimiento.observaciones === 'si') {
      if (observacionesSi) {
        observacionesSi.checked = true;
      }
      if (observacionesDiv) {
        observacionesDiv.style.display = 'block';
      }
    } else {
      if (observacionesNo) {
        observacionesNo.checked = true;
      }
      if (observacionesDiv) {
        observacionesDiv.style.display = 'none';
      }
    }

    // Cargar económico (usar el número)
    const economicoInput = document.getElementById('editarDiesel_economico');
    const economicoValue = document.getElementById('editarDiesel_economico_value');
    if (economicoInput && economicoValue) {
      const economicoNumero = movimiento.economico || '';
      economicoValue.value = economicoNumero;

      // Buscar el económico completo para mostrar el texto completo
      if (window.ERPState && window.ERPState.getCache('economicos')) {
        const economicos = window.ERPState.getCache('economicos');
        const economicoData = economicos.find(
          eco =>
            (eco.numero && eco.numero.toString() === economicoNumero.toString()) ||
            (eco.economico && eco.economico.toString() === economicoNumero.toString())
        );

        if (economicoData) {
          const numero = economicoData.numero || economicoData.economico || economicoNumero;
          const placa = economicoData.placaTracto || economicoData.placa || '';
          const marca = economicoData.marca || '';
          const modelo = economicoData.modelo || '';

          let texto = numero;
          if (marca || modelo) {
            texto += ` - ${marca} ${modelo}`.trim();
          }
          if (placa) {
            texto += ` (${placa})`;
          }
          economicoInput.value = texto;

          // Llenar placas automáticamente
          document.getElementById('editarDiesel_placas').value = placa;
        } else {
          economicoInput.value = economicoNumero;
        }
      } else {
        economicoInput.value = economicoNumero;
      }
    }

    // Cargar operador principal
    const operadorPrincipalInput = document.getElementById('editarDiesel_operadorprincipal');
    const operadorPrincipalValue = document.getElementById('editarDiesel_operadorprincipal_value');
    if (operadorPrincipalInput && operadorPrincipalValue) {
      const operadorPrincipal = movimiento.operadorPrincipal || '';
      operadorPrincipalValue.value = operadorPrincipal;
      operadorPrincipalInput.value = operadorPrincipal;
    }

    // Cargar operador secundario
    const operadorSecundarioInput = document.getElementById('editarDiesel_operadorsecundario');
    const operadorSecundarioValue = document.getElementById(
      'editarDiesel_operadorsecundario_value'
    );
    if (operadorSecundarioInput && operadorSecundarioValue) {
      const operadorSecundario = movimiento.operadorSecundario || '';
      if (operadorSecundario) {
        operadorSecundarioValue.value = operadorSecundario;
        operadorSecundarioInput.value = operadorSecundario;
      }
    }

    // Mostrar el modal
    const modalElement = document.getElementById('modalEditarDiesel');
    if (!modalElement) {
      this.showNotification('Error: Modal de edición no encontrado', 'error');
      return;
    }

    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Inicializar toggle de observaciones en el modal
    const observacionesRadios = document.querySelectorAll(
      'input[name="editarDiesel_observaciones"]'
    );
    observacionesRadios.forEach(radio => {
      // Remover listeners anteriores para evitar duplicados
      const newRadio = radio.cloneNode(true);
      radio.parentNode.replaceChild(newRadio, radio);

      newRadio.addEventListener('change', function () {
        const observacionesDiv = document.getElementById('editarDiesel_observacionesDiv');
        if (observacionesDiv) {
          if (this.value === 'si') {
            observacionesDiv.style.display = 'block';
          } else {
            observacionesDiv.style.display = 'none';
          }
        }
      });
    });

    // Calcular costo total inicial
    if (typeof window.calcularCostoTotalDieselEditar === 'function') {
      window.calcularCostoTotalDieselEditar();
    }

    this.showNotification('Movimiento cargado para editar', 'success');
    console.log('✅ Movimiento cargado en modal para editar');
  }

  async guardarDieselEditado() {
    console.log('💾 Guardando cambios del movimiento diesel editado...');

    const form = document.getElementById('formEditarDiesel');
    if (!form) {
      this.showNotification('Error: Formulario no encontrado', 'error');
      return false;
    }

    // Validar formulario
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      this.showNotification('Por favor completa todos los campos requeridos', 'error');
      return false;
    }

    const id = document.getElementById('editarDiesel_id').value;
    if (!id) {
      this.showNotification('Error: ID de movimiento no encontrado', 'error');
      return false;
    }

    // IMPORTANTE: Recuperar el firebaseId del campo oculto
    const firebaseIdInput = document.getElementById('editarDiesel_firebaseId');
    const firebaseId = firebaseIdInput?.value || '';
    console.log('🔍 [guardarDieselEditado] firebaseId recuperado del formulario:', firebaseId);

    if (firebaseId === 'movimiento_1765562765957_th0hsd1xp' || String(id) === '1765562765957') {
      console.log(
        '🎯🎯🎯 [guardarDieselEditado] ¡RECUPERANDO firebaseId DEL REGISTRO ESPECÍFICO! 🎯🎯🎯'
      );
      console.log('🎯 firebaseId:', firebaseId);
    }

    // Obtener nombre del operador desde el input searchable
    const obtenerNombreOperadorDesdeInput = inputId => {
      const visibleInput = document.getElementById(inputId);

      // Prioridad 1: Extraer del texto visible (formato: "Nombre - Licencia")
      // El visible input siempre tiene el formato correcto: "Nombre - Licencia"
      if (visibleInput && visibleInput.value) {
        const partes = visibleInput.value.split(' - ');
        if (partes.length > 0) {
          // Retornar solo la primera parte (el nombre), sin la licencia
          return partes[0].trim();
        }
        return visibleInput.value.trim();
      }

      // Prioridad 2: Si no hay visible input, intentar obtener el nombre desde el caché usando el ID
      // (Este es un fallback, normalmente no debería llegar aquí)
      const hiddenInput = document.getElementById(`${inputId}_value`);
      if (hiddenInput && hiddenInput.value) {
        // El hidden input ahora contiene el ID, no el nombre
        // Intentar buscar el operador en el caché para obtener el nombre
        const operadorId = hiddenInput.value;
        if (window._operadoresCache && Array.isArray(window._operadoresCache)) {
          const operador = window._operadoresCache.find(
            op =>
              op.id === operadorId ||
              op.numeroLicencia === operadorId ||
              op.licencia === operadorId ||
              op.nombre === operadorId
          );
          if (operador) {
            return operador.nombre || operador.nombreOperador || operador.nombreCompleto || '';
          }
        }
      }

      return '';
    };

    // Obtener el número del económico desde el input searchable
    const obtenerNumeroEconomico = () => {
      const hiddenInput = document.getElementById('editarDiesel_economico_value');
      const visibleInput = document.getElementById('editarDiesel_economico');

      if (hiddenInput && hiddenInput.value) {
        return hiddenInput.value;
      }

      if (visibleInput && visibleInput.value) {
        const match = visibleInput.value.match(/^(\d+)/);
        if (match) {
          return match[1];
        }
        return visibleInput.value.trim();
      }

      return '';
    };

    const operadorPrincipalNombre = obtenerNombreOperadorDesdeInput(
      'editarDiesel_operadorprincipal'
    );
    const operadorSecundarioNombre = obtenerNombreOperadorDesdeInput(
      'editarDiesel_operadorsecundario'
    );

    // Obtener también los IDs de los operadores (del hidden input)
    const operadorPrincipalHidden = document.getElementById('editarDiesel_operadorprincipal_value');
    const operadorSecundarioHidden = document.getElementById(
      'editarDiesel_operadorsecundario_value'
    );
    const operadorPrincipalId = operadorPrincipalHidden?.value || '';
    const operadorSecundarioId = operadorSecundarioHidden?.value || '';

    const economicoNumero = obtenerNumeroEconomico();

    // Mantener el ID tal como está (no convertir, para mantener el formato original)
    // El ID puede ser número o string, lo importante es mantener el mismo formato que tiene en el array
    const movimientoId = id; // Mantener el ID original sin conversión

    console.log(`🆔 ID del movimiento recibido del formulario: ${id} (tipo: ${typeof id})`);

    const movimiento = {
      id: movimientoId, // Usar el ID tal como está (sin conversión)
      firebaseId: firebaseId || undefined, // IMPORTANTE: Incluir el firebaseId si existe
      estacionServicio: document.getElementById('editarDiesel_estacionservicio').value || '',
      fechaConsumo: document.getElementById('editarDiesel_fechaconsumo').value || '',
      economico: economicoNumero,
      kilometraje: document.getElementById('editarDiesel_kilometraje').value || '',
      placas: document.getElementById('editarDiesel_placas').value || '',
      litros: parseFloat(document.getElementById('editarDiesel_litros').value || 0),
      costoPorLitro: parseFloat(document.getElementById('editarDiesel_costoporlitro').value || 0),
      costoTotal: parseFloat(
        document.getElementById('editarDiesel_costototal').value?.replace(/[$,]/g, '') || 0
      ),
      formaPago: document.getElementById('editarDiesel_formapago').value || '',
      operadorPrincipal: operadorPrincipalNombre,
      operadorPrincipalId: operadorPrincipalId,
      operadorSecundario: operadorSecundarioNombre,
      operadorSecundarioId: operadorSecundarioId,
      observaciones:
        document.querySelector('input[name="editarDiesel_observaciones"]:checked')?.value || 'no',
      descripcionObservaciones: document.getElementById('editarDiesel_descripcion').value || ''
    };

    console.log('📝 Datos del movimiento editado:', movimiento);
    console.log(
      '🆔 ID del movimiento a actualizar:',
      movimientoId,
      '(tipo:',
      typeof movimientoId,
      ')'
    );
    console.log('🔥 firebaseId del movimiento a actualizar:', firebaseId || 'NO ENCONTRADO');

    if (firebaseId === 'movimiento_1765562765957_th0hsd1xp') {
      console.log('🎯🎯🎯 [guardarDieselEditado] ¡MOVIMIENTO CON firebaseId CORRECTO! 🎯🎯🎯');
      console.log('🎯 movimiento.firebaseId:', movimiento.firebaseId);
    }

    // Validar datos críticos
    if (
      !movimiento.estacionServicio ||
      !movimiento.fechaConsumo ||
      !movimiento.economico ||
      !movimiento.litros ||
      !movimiento.costoPorLitro
    ) {
      this.showNotification('Por favor completa todos los campos requeridos', 'error');
      return false;
    }

    try {
      console.log('💾 [guardarDieselEditado] Iniciando actualización del movimiento...');
      console.log('📋 Datos completos del movimiento a guardar:', movimiento);

      const movimientoGuardado = await this.dieselManager.saveMovimiento(movimiento);

      if (movimientoGuardado) {
        console.log(
          '✅ [guardarDieselEditado] Movimiento actualizado exitosamente en dieselManager'
        );
        console.log('📋 Movimiento guardado retornado:', {
          id: movimientoGuardado.id,
          estacion: movimientoGuardado.estacionServicio,
          operador: movimientoGuardado.operadorPrincipal
        });
      } else {
        console.error(
          '❌ [guardarDieselEditado] dieselManager.saveMovimiento retornó null/undefined'
        );
      }

      // Cerrar el modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarDiesel'));
      if (modal) {
        modal.hide();
      }

      // Esperar un poco más para asegurar que Firebase haya actualizado antes de recargar
      console.log('⏳ Esperando sincronización con Firebase antes de recargar tabla...');
      await new Promise(resolve => setTimeout(resolve, 800));

      await this.loadHistorialTable();
      this.showNotification('Movimiento de diesel actualizado exitosamente', 'success');
      return true;
    } catch (e) {
      console.error('❌ Error actualizando movimiento diesel:', e);
      this.showNotification(`Error al actualizar el movimiento: ${e.message}`, 'error');
      return false;
    }
  }

  async eliminarMovimiento(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este movimiento de diesel?')) {
      await this.dieselManager.deleteMovimiento(id);
      await this.loadHistorialTable();
      this.showNotification('Movimiento eliminado exitosamente', 'success');
    }
  }

  showNotification(message, type = 'info') {
    // Crear notificación simple
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// ===== Global Instance =====
let dieselUI;
window.dieselUI = null; // Inicializar como null para que el event handler pueda verificar

// Exponer función globalmente para guardar desde el modal
window.guardarDieselEditado = async function () {
  if (window.dieselUI && typeof window.dieselUI.guardarDieselEditado === 'function') {
    await window.dieselUI.guardarDieselEditado();
  } else {
    console.error('dieselUI.guardarDieselEditado no está disponible');
  }
};

// ===== Función global para cambiar de página =====
window.cambiarPaginaDiesel = async function (accion) {
  if (!window._paginacionDieselManager) {
    console.warn('⚠️ window._paginacionDieselManager no está disponible');
    return;
  }

  let cambioExitoso = false;

  if (accion === 'anterior') {
    cambioExitoso = window._paginacionDieselManager.paginaAnterior();
  } else if (accion === 'siguiente') {
    cambioExitoso = window._paginacionDieselManager.paginaSiguiente();
  } else if (typeof accion === 'number') {
    cambioExitoso = window._paginacionDieselManager.irAPagina(accion);
  }

  if (cambioExitoso && dieselUI) {
    await dieselUI.renderizarMovimientosDiesel();
    // Scroll suave hacia la tabla
    const tabla = document.getElementById('tablaHistorialDiesel');
    if (tabla) {
      tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', async () => {
  // Esperar a que los repositorios de Firebase estén listos
  let attempts = 0;
  const maxAttempts = 20;
  while (attempts < maxAttempts && (!window.firebaseRepos || !window.firebaseRepos.diesel)) {
    attempts++;
    console.log(`⏳ Esperando repositorios de Firebase... (${attempts}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  dieselUI = new DieselUI();
  window.dieselUI = dieselUI; // Asegurar que esté disponible globalmente
  await dieselUI.loadHistorialTable();

  // Setup form submission
  const form = document.querySelector('.needs-validation');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      dieselUI.guardarMovimiento();
    });
  }

  // Setup observaciones toggle
  const observacionesRadios = document.querySelectorAll('input[name="Observaciones"]');
  const observacionesDiv = document.getElementById('Observaciones');

  observacionesRadios.forEach(radio => {
    radio.addEventListener('change', function () {
      if (this.value === 'si') {
        observacionesDiv.style.display = 'block';
      } else {
        observacionesDiv.style.display = 'none';
      }
    });
  });

  // Suscribirse a cambios en tiempo real de movimientos diesel
  if (window.firebaseRepos && window.firebaseRepos.diesel) {
    try {
      console.log('📡 Suscribiéndose a cambios en tiempo real de movimientos diesel...');
      const unsubscribe = window.firebaseRepos.diesel.subscribe(async items => {
        // Filtrar solo movimientos (tipo === 'movimiento')
        const movimientosFirebase = items.filter(item => item.tipo === 'movimiento');

        // Si Firebase está completamente vacío, verificar y sincronizar localStorage
        if (items.length === 0) {
          console.log('📡 Firebase está vacío para diesel. Verificando sincronización...');

          // Verificar si Firebase está realmente vacío
          try {
            const repoDiesel = window.firebaseRepos.diesel;
            if (repoDiesel && repoDiesel.db && repoDiesel.tenantId) {
              const firebaseData = await repoDiesel.getAll();
              const movimientosFirebaseVerificados = firebaseData.filter(
                item => item.tipo === 'movimiento'
              );

              if (movimientosFirebaseVerificados.length === 0) {
                console.log(
                  '✅ Firebase confirmado vacío. Sincronizando localStorage con Firebase (vacío).'
                );
                localStorage.setItem('erp_diesel_movimientos', JSON.stringify([]));
                console.log('🗑️ Firebase está vacío para diesel. localStorage limpiado.');

                // Recargar la tabla
                if (dieselUI && typeof dieselUI.loadHistorialTable === 'function') {
                  dieselUI.loadHistorialTable();
                }
                return;
              }
              console.log(
                '⚠️ Firebase no está vacío, hay',
                movimientosFirebaseVerificados.length,
                'movimientos. Continuando con actualización normal.'
              );
              // Continuar con el flujo normal usando los datos verificados
              items = firebaseData;
            }
          } catch (error) {
            console.warn('⚠️ Error verificando Firebase:', error);
            // Continuar con el flujo normal
          }
        }

        if (movimientosFirebase.length > 0 || items.length === 0) {
          console.log(
            '📡 Actualización en tiempo real: movimientos diesel recibidos desde Firebase:',
            movimientosFirebase.length
          );

          // Cargar movimientos existentes en localStorage
          let movimientosLocal = [];
          try {
            const data = localStorage.getItem('erp_diesel_movimientos');
            if (data) {
              movimientosLocal = JSON.parse(data);
              console.log(
                `📋 Movimientos en localStorage antes de combinar: ${movimientosLocal.length}`
              );
            }
          } catch (error) {
            console.warn('⚠️ Error parseando movimientos de localStorage:', error);
          }

          // Si Firebase está vacío después de la verificación, usar solo Firebase (vacío)
          if (movimientosFirebase.length === 0 && items.length === 0) {
            console.log('✅ Firebase está vacío. Sincronizando localStorage con Firebase (vacío).');
            localStorage.setItem('erp_diesel_movimientos', JSON.stringify([]));
            console.log('🗑️ localStorage limpiado para diesel (Firebase vacío).');

            // Recargar la tabla
            if (dieselUI && typeof dieselUI.loadHistorialTable === 'function') {
              dieselUI.loadHistorialTable();
            }
            return;
          }

          // NO combinar localStorage con Firebase para evitar restaurar datos eliminados
          // Firebase es la fuente de verdad. Si Firebase está vacío Y hay conexión, significa que los datos fueron eliminados
          // y no debemos restaurarlos desde localStorage
          const datosLimpios = localStorage.getItem('datos_operativos_limpiados');
          const hayConexion = navigator.onLine;
          const firebaseVacio = movimientosFirebase.length === 0;

          let movimientosCombinados = [];

          if (datosLimpios === 'true' || (firebaseVacio && hayConexion)) {
            const razon =
              datosLimpios === 'true'
                ? 'Datos operativos fueron limpiados (flag local)'
                : 'Firebase está vacío y hay conexión (datos eliminados intencionalmente)';
            console.log(`⚠️ ${razon}. Usando solo Firebase (no se combinará con localStorage).`);
            // Usar solo Firebase (puede estar vacío)
            movimientosCombinados = [...movimientosFirebase];
          } else if (!hayConexion && firebaseVacio) {
            // Solo en modo offline real, usar localStorage como fallback temporal
            console.log('📡 Modo offline detectado. Usando localStorage como fallback temporal.');
            movimientosCombinados = [...movimientosFirebase];
            movimientosLocal.forEach(movimiento => {
              if (!movimientosCombinados.find(m => m.id === movimiento.id)) {
                movimientosCombinados.push(movimiento);
              }
            });
          } else {
            // Usar Firebase como base (fuente de verdad)
            // NO combinar con localStorage para evitar restaurar datos eliminados
            movimientosCombinados = [...movimientosFirebase];
            console.log(
              '📋 Usando Firebase como fuente de verdad (no se combinará con localStorage para evitar restauración de datos eliminados)'
            );
          }

          // Ordenar por fecha más reciente primero
          movimientosCombinados.sort((a, b) => {
            const fechaA = new Date(a.fechaCreacion || a.fecha || 0);
            const fechaB = new Date(b.fechaCreacion || b.fecha || 0);
            return fechaB - fechaA;
          });

          console.log(
            `📊 Total movimientos combinados en tiempo real: ${movimientosCombinados.length} (${movimientosFirebase.length} Firebase + ${movimientosLocal.length} localStorage)`
          );

          // IMPORTANTE: Siempre actualizar localStorage con los datos de Firebase (fuente de verdad)
          // Si Firebase está vacío, localStorage también debe estar vacío
          // Esto asegura que los datos eliminados no se restauren desde localStorage
          localStorage.setItem('erp_diesel_movimientos', JSON.stringify(movimientosCombinados));

          // Log para debugging
          const eliminados = movimientosLocal.length - movimientosFirebase.length;
          if (eliminados > 0) {
            console.log(
              `🗑️ ${eliminados} movimiento(s) eliminado(s) del localStorage de diesel (sincronizado con Firebase)`
            );
          }

          console.log(
            `✅ localStorage actualizado con datos de Firebase: ${movimientosCombinados.length} movimiento(s) (${movimientosFirebase.length} de Firebase, ${movimientosLocal.length} locales previos - NO combinados para evitar restauración)`
          );

          // Recargar la tabla usando getMovimientos() que combina correctamente
          if (dieselUI && typeof dieselUI.loadHistorialTable === 'function') {
            dieselUI.loadHistorialTable();
          }
        }
      });

      // Guardar función de desuscripción
      window.__dieselUnsubscribe = unsubscribe;
      console.log('✅ Suscripción a cambios en tiempo real de movimientos diesel configurada');
    } catch (error) {
      console.warn(
        '⚠️ Error configurando suscripción en tiempo real de movimientos diesel:',
        error
      );
    }
  }
});

// ===== Global Functions =====
window.prepareNewRegistration = function () {
  if (dieselUI) {
    dieselUI.clearForm();
  }
};

window.clearCurrentForm = function () {
  if (dieselUI) {
    dieselUI.clearForm();
  }
};

// Función global para aplicar filtros
window.aplicarFiltrosDiesel = function () {
  if (!window._movimientosDieselSinFiltrar || window._movimientosDieselSinFiltrar.length === 0) {
    console.warn('⚠️ No hay movimientos cargados para filtrar');
    return;
  }

  if (!dieselUI) {
    console.warn('⚠️ dieselUI no está disponible');
    return;
  }

  // Aplicar filtros
  const movimientosFiltrados = dieselUI.aplicarFiltros(window._movimientosDieselSinFiltrar);
  window._movimientosDieselCompletos = movimientosFiltrados;

  // Reinicializar paginación con los movimientos filtrados
  if (window._paginacionDieselManager) {
    const movimientosIds = movimientosFiltrados.map(m => m.id.toString());
    window._paginacionDieselManager.inicializar(movimientosIds, 15);
    window._paginacionDieselManager.paginaActual = 1;

    // Renderizar
    dieselUI.renderizarMovimientosDiesel();

    // Actualizar controles de paginación
    const contenedorPaginacion = document.getElementById('paginacionDiesel');
    if (contenedorPaginacion && window._paginacionDieselManager) {
      contenedorPaginacion.innerHTML = window._paginacionDieselManager.generarControlesPaginacion(
        'paginacionDiesel',
        'cambiarPaginaDiesel'
      );
    }

    console.log(
      `✅ Filtros aplicados: ${movimientosFiltrados.length} de ${window._movimientosDieselSinFiltrar.length} movimientos`
    );
  } else {
    // Si no hay paginación, renderizar directamente
    dieselUI.renderizarMovimientosDiesel(movimientosFiltrados);
  }
};

// Función global para limpiar filtros
window.limpiarFiltrosDiesel = function () {
  document.getElementById('filtroIdDiesel').value = '';
  document.getElementById('filtroEstacionDiesel').value = '';
  document.getElementById('filtroEconomicoDiesel').value = '';
  document.getElementById('filtroFormaPagoDiesel').value = '';
  document.getElementById('filtroFechaDesdeDiesel').value = '';
  document.getElementById('filtroFechaHastaDiesel').value = '';

  // Recargar tabla sin filtros
  if (dieselUI && typeof dieselUI.loadHistorialTable === 'function') {
    dieselUI.loadHistorialTable();
  }
};
