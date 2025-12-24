// Operadores Manager - TitanFleet ERP
// Gestiona el módulo de control de operadores, gastos e incidencias

class OperadoresManager {
  constructor() {
    this.gastosStorageKey = 'erp_operadores_gastos';
    this.incidenciasStorageKey = 'erp_operadores_incidencias';
    this.operadoresStorageKey = 'erp_operadores_lista';
    this.initializeData();
  }

  initializeData() {
    // Inicializar datos si no existen
    if (!localStorage.getItem(this.gastosStorageKey)) {
      localStorage.setItem(this.gastosStorageKey, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.incidenciasStorageKey)) {
      localStorage.setItem(this.incidenciasStorageKey, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.operadoresStorageKey)) {
      // Datos de ejemplo de operadores
      const operadoresEjemplo = [
        { id: 1, nombre: 'Juan Pérez', licencia: 'A123456', telefono: '555-0001', activo: true },
        { id: 2, nombre: 'María García', licencia: 'B789012', telefono: '555-0002', activo: true },
        { id: 3, nombre: 'Carlos López', licencia: 'C345678', telefono: '555-0003', activo: true },
        { id: 4, nombre: 'Ana Martínez', licencia: 'D901234', telefono: '555-0004', activo: false }
      ];
      localStorage.setItem(this.operadoresStorageKey, JSON.stringify(operadoresEjemplo));
    }
  }

  // === GESTIÓN DE GASTOS ===
  async getGastos() {
    try {
      // PRIORIDAD: Cargar desde Firebase primero
      if (window.firebaseRepos?.operadores) {
        try {
          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId)
          ) {
            attempts++;
            // console.log(`⏳ Esperando inicialización del repositorio de operadores... (${attempts}/10)`);
            await new Promise(resolve => setTimeout(resolve, 500));

            // Intentar inicializar si aún no está listo
            if (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId) {
              await window.firebaseRepos.operadores.init();
            }
          }

          // console.log('🔥 Cargando gastos desde Firebase...');
          const gastosFirebase = await window.firebaseRepos.operadores.getAllGastos();
          // console.log(`📊 getAllGastos() retornó ${gastosFirebase?.length || 0} gastos desde Firebase`);
          if (gastosFirebase && Array.isArray(gastosFirebase) && gastosFirebase.length > 0) {
            // Eliminar duplicados basados en el ID
            const gastosUnicos = [];
            const idsVistos = new Set();

            gastosFirebase.forEach(gasto => {
              // El ID puede venir del documento de Firebase (gasto.id) o del campo id del objeto
              // Asegurar que siempre tenga un ID consistente
              const gastoId = gasto.id || gasto.gastoId;

              // Si el gasto tiene un ID del documento de Firebase pero no tiene campo id, usar el ID del documento
              if (!gasto.id && !gasto.gastoId && gasto.id) {
                gasto.id = gasto.id; // Ya está asignado por getAll()
              }

              // Normalizar el ID para comparación
              const idNormalizado = String(gastoId || gasto.id || '');

              if (idNormalizado && !idsVistos.has(idNormalizado)) {
                idsVistos.add(idNormalizado);
                // Asegurar que el gasto tenga el ID correcto
                if (!gasto.id) {
                  gasto.id = gastoId || gasto.id;
                }
                gastosUnicos.push(gasto);
              } else if (!idNormalizado) {
                // Si no tiene ID, generar uno temporal y agregarlo
                console.warn('⚠️ Gasto sin ID encontrado, generando ID temporal:', gasto);
                const idTemporal = `gasto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                gasto.id = idTemporal;
                gastosUnicos.push(gasto);
              } else {
                console.warn('⚠️ Gasto duplicado encontrado, omitiendo:', idNormalizado);
              }
            });

            if (gastosUnicos.length !== gastosFirebase.length) {
              console.log(
                `🧹 Eliminados ${gastosFirebase.length - gastosUnicos.length} gastos duplicados`
              );
            }

            // console.log(`✅ ${gastosUnicos.length} gastos únicos cargados desde Firebase`);

            // Combinar con gastos de localStorage que no están en Firebase (por si hay gastos locales sin sincronizar)
            const gastosLocal = JSON.parse(localStorage.getItem(this.gastosStorageKey) || '[]');
            console.log(
              `📦 Verificando ${gastosLocal.length} gastos en localStorage para combinar con Firebase`
            );

            // Filtrar gastos locales obsoletos o temporales
            const gastosLocalesValidos = [];
            const gastosLocalesObsoletos = [];

            gastosLocal.forEach(gastoLocal => {
              const existeEnFirebase = gastosUnicos.some(g => {
                const idLocal = String(gastoLocal.id || '');
                const idFirebase = String(g.id || '');
                return idLocal && idFirebase && idLocal === idFirebase;
              });

              if (!existeEnFirebase) {
                // Verificar si el gasto es obsoleto o temporal
                const esObsoleto =
                  // Gastos con origen "trafico" que no están en Firebase son temporales
                  gastoLocal.origen === 'trafico' ||
                  // Gastos con IDs que parecen temporales (formato: gasto_timestamp_*)
                  (String(gastoLocal.id || '').startsWith('gasto_') &&
                    String(gastoLocal.id).includes('_')) ||
                  // Gastos muy antiguos (más de 7 días sin sincronizar)
                  (gastoLocal.fechaCreacion &&
                    Date.now() - new Date(gastoLocal.fechaCreacion).getTime() >
                      7 * 24 * 60 * 60 * 1000);

                if (esObsoleto) {
                  gastosLocalesObsoletos.push(gastoLocal);
                  console.log(
                    `🗑️ Gasto local obsoleto detectado (será eliminado): ${gastoLocal.id} (origen: ${gastoLocal.origen || 'N/A'})`
                  );
                } else {
                  // Normalizar el gasto local antes de agregarlo
                  const gastoNormalizado = {
                    ...gastoLocal,
                    tipo: gastoLocal.tipo || 'gasto', // Asegurar tipo
                    operadorNombre: gastoLocal.operadorNombre || gastoLocal.operador,
                    tipoGasto: gastoLocal.tipoGasto || gastoLocal.motivo
                  };

                  // Solo agregar si es un gasto (no una incidencia)
                  if (gastoNormalizado.tipo === 'gasto' || !gastoNormalizado.tipo) {
                    gastosUnicos.push(gastoNormalizado);
                    gastosLocalesValidos.push(gastoNormalizado);
                    console.log(
                      `➕ Agregado gasto local válido no encontrado en Firebase: ${gastoNormalizado.id} (origen: ${gastoNormalizado.origen || 'N/A'})`
                    );
                  }
                }
              }
            });

            // Limpiar gastos obsoletos de localStorage
            if (gastosLocalesObsoletos.length > 0) {
              console.log(
                `🧹 Limpiando ${gastosLocalesObsoletos.length} gastos obsoletos de localStorage`
              );
              const _gastosLimpios = gastosLocal.filter(
                gastoLocal =>
                  !gastosLocalesObsoletos.some(
                    obsoleto => String(obsoleto.id) === String(gastoLocal.id)
                  )
              );
              // Guardar temporalmente los gastos limpios (sin los obsoletos)
              // Pero solo guardaremos los que están en Firebase al final
            }

            // console.log(`📊 Total después de combinar con localStorage: ${gastosUnicos.length} gastos`);

            // Sincronizar con localStorage SOLO los gastos que están en Firebase (fuente de verdad)
            // Los gastos locales válidos que no están en Firebase se mantendrán temporalmente
            // pero se limpiarán en la próxima carga si no se sincronizan
            const gastosParaGuardar = gastosUnicos.filter(g => {
              // Incluir todos los gastos que vinieron originalmente de Firebase
              // (los que están en gastosUnicos y fueron agregados desde gastosFirebase)
              const esDeFirebase = idsVistos.has(String(g.id || ''));
              if (esDeFirebase) {
                return true;
              }

              // Incluir gastos locales válidos que no son obsoletos (para sincronización pendiente)
              // pero solo si tienen menos de 24 horas de antigüedad
              const esLocalValido = gastosLocalesValidos.some(gv => String(gv.id) === String(g.id));
              if (esLocalValido) {
                // Solo mantener gastos locales válidos si tienen menos de 24 horas
                const fechaCreacion = g.fechaCreacion || g.fecha;
                if (fechaCreacion) {
                  const edad = Date.now() - new Date(fechaCreacion).getTime();
                  const maxEdad = 24 * 60 * 60 * 1000; // 24 horas
                  return edad < maxEdad;
                }
                // Si no tiene fecha, mantenerlo por ahora (será limpiado en próxima carga si no se sincroniza)
                return true;
              }
              return false;
            });

            localStorage.setItem(this.gastosStorageKey, JSON.stringify(gastosParaGuardar));
            console.log(
              `💾 Guardados ${gastosParaGuardar.length} gastos en localStorage (${gastosLocalesObsoletos.length} obsoletos eliminados)`
            );
            return gastosUnicos;
          } else if (gastosFirebase && Array.isArray(gastosFirebase)) {
            // Firebase retornó array vacío, cargar desde localStorage
            // console.log(`📋 0 gastos en Firebase, cargando desde localStorage...`);
          }
        } catch (firebaseError) {
          console.warn('⚠️ Error cargando gastos desde Firebase:', firebaseError);
          console.log('📦 Cargando desde localStorage como fallback...');
        }
      } else {
        console.log('⚠️ Repositorio de Firebase no disponible, cargando desde localStorage...');
      }

      // Fallback: Cargar desde localStorage
      let gastosLocal = JSON.parse(localStorage.getItem(this.gastosStorageKey) || '[]');
      console.log(
        `📦 Cargando desde localStorage: ${gastosLocal.length} gastos encontrados (antes de filtrar por tenantId)`
      );

      // Filtrar por tenantId o userId para asegurar aislamiento de datos
      const currentTenantId =
        window.firebaseRepos?.operadores?.tenantId ||
        localStorage.getItem('tenantId') ||
        JSON.parse(localStorage.getItem('erpCurrentUser') || '{}').tenantId;
      const currentUserId = window.firebaseAuth?.currentUser?.uid;

      if (currentTenantId || currentUserId) {
        const gastosFiltrados = gastosLocal.filter(gasto => {
          const gastoTenantId = gasto.tenantId || gasto.tenant_id;
          const gastoUserId = gasto.userId || gasto.user_id;

          // Incluir si coincide el tenantId o userId
          return (
            (currentTenantId && gastoTenantId === currentTenantId) ||
            (currentUserId && gastoUserId === currentUserId) ||
            (!gastoTenantId && !gastoUserId)
          ); // Incluir registros sin tenantId/userId (legacy)
        });

        console.log(
          `🔍 Filtrado por tenantId (${currentTenantId || 'N/A'}) o userId (${currentUserId || 'N/A'}): ${gastosFiltrados.length} de ${gastosLocal.length} gastos`
        );
        gastosLocal = gastosFiltrados;
      }

      // Normalizar gastos: asegurar que todos tengan el campo 'tipo' si no lo tienen
      const gastosNormalizados = gastosLocal.map(gasto => {
        // Normalizar campos
        const gastoNormalizado = { ...gasto };

        // Agregar tipo si falta
        if (!gasto.tipo) {
          gastoNormalizado.tipo = 'gasto';
        }

        // Mapear operador -> operadorNombre
        if (!gasto.operadorNombre && gasto.operador) {
          gastoNormalizado.operadorNombre = gasto.operador;
        }

        // Mapear motivo -> tipoGasto
        if (!gasto.tipoGasto && gasto.motivo) {
          gastoNormalizado.tipoGasto = gasto.motivo;
        }

        return gastoNormalizado;
      });

      // Si se normalizaron gastos, guardarlos de vuelta
      if (
        gastosNormalizados.length !== gastosLocal.length ||
        gastosNormalizados.some((g, i) => {
          const original = gastosLocal[i];
          return (
            g.tipo !== original?.tipo ||
            g.operadorNombre !== original?.operadorNombre ||
            g.tipoGasto !== original?.tipoGasto
          );
        })
      ) {
        localStorage.setItem(this.gastosStorageKey, JSON.stringify(gastosNormalizados));
        // console.log('✅ Gastos normalizados (agregado campo tipo donde faltaba)');
      }

      // Filtrar solo gastos (excluir incidencias)
      const gastosFiltrados = gastosNormalizados.filter(g => g.tipo === 'gasto' || !g.tipo);
      // console.log(`📊 Después de filtrar por tipo 'gasto': ${gastosFiltrados.length} gastos`);

      // if (gastosFiltrados.length > 0) {
      //     console.log(`✅ ${gastosFiltrados.length} gastos cargados desde localStorage`);
      // } else {
      //     console.log('📋 No hay gastos en localStorage después del filtrado');
      // }
      return gastosFiltrados;
    } catch (error) {
      console.error('❌ Error al cargar gastos:', error);
      // Último fallback: intentar desde localStorage
      try {
        const gastosLocal = JSON.parse(localStorage.getItem(this.gastosStorageKey) || '[]');
        // Normalizar gastos: asegurar que todos tengan el campo 'tipo'
        const gastosNormalizados = gastosLocal.map(gasto => {
          if (!gasto.tipo) {
            return {
              ...gasto,
              tipo: 'gasto'
            };
          }
          return gasto;
        });

        // Si se normalizaron, guardar de vuelta
        if (
          gastosNormalizados.length !== gastosLocal.length ||
          gastosNormalizados.some((g, i) => g.tipo !== gastosLocal[i]?.tipo)
        ) {
          localStorage.setItem(this.gastosStorageKey, JSON.stringify(gastosNormalizados));
        }

        return gastosNormalizados;
      } catch (e) {
        console.error('❌ Error crítico cargando gastos:', e);
        return [];
      }
    }
  }

  async saveGasto(gasto) {
    try {
      const gastos = await this.getGastos();
      const nuevoGasto = {
        id: Date.now(),
        fechaCreacion: new Date().toISOString(),
        ...gasto
      };
      gastos.unshift(nuevoGasto);
      localStorage.setItem(this.gastosStorageKey, JSON.stringify(gastos));

      // Guardar también en Firebase
      if (window.firebaseRepos?.operadores) {
        try {
          const gastoId = `gasto_${nuevoGasto.id}`;
          await window.firebaseRepos.operadores.saveGasto(gastoId, nuevoGasto);
          // console.log('✅ Gasto guardado en Firebase');
        } catch (firebaseError) {
          console.warn('⚠️ Error guardando en Firebase:', firebaseError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error al guardar gasto:', error);
      return false;
    }
  }

  async updateGasto(id, datosActualizados) {
    try {
      const gastos = await this.getGastos();
      const idString = String(id);
      const idNumber = parseInt(id, 10);

      // Buscar el gasto de manera flexible
      const index = gastos.findIndex(g => {
        const gId = g.id || g.gastoId;
        if (!gId) {
          return false;
        }

        const gIdString = String(gId);
        const gIdNumber = parseInt(gId, 10);

        // Comparar de múltiples formas
        return (
          gIdString === idString ||
          gIdString === String(id) ||
          gId === id ||
          gIdNumber === idNumber ||
          gIdNumber === id ||
          gId === idNumber ||
          String(gIdNumber) === idString ||
          String(gIdNumber) === String(id) ||
          // También buscar si el ID contiene el número (para IDs como "gasto_123456")
          gIdString.includes(idString) ||
          gIdString.endsWith(idString) ||
          gIdString.replace(/^gasto_/, '') === idString
        );
      });

      if (index === -1) {
        console.error('Gasto no encontrado para actualizar:', id);
        // console.log('📋 IDs disponibles:', gastos.slice(0, 5).map(g => ({ id: g.id, gastoId: g.gastoId })));
        return false;
      }

      // Actualizar el gasto manteniendo el ID y fecha de creación original
      const gastoOriginal = gastos[index];
      gastos[index] = {
        ...gastoOriginal,
        ...datosActualizados,
        id: gastoOriginal.id, // Mantener ID original
        fechaCreacion: gastoOriginal.fechaCreacion, // Mantener fecha de creación original
        fechaActualizacion: new Date().toISOString()
      };

      localStorage.setItem(this.gastosStorageKey, JSON.stringify(gastos));

      // Actualizar también en Firebase - usar el ID del documento de Firebase si está disponible
      if (window.firebaseRepos?.operadores) {
        try {
          // Determinar el ID correcto para Firebase
          let firebaseId = id;
          // Si el ID es numérico y no tiene prefijo, usar formato gasto_${id}
          if (!isNaN(id) && !String(id).startsWith('gasto_')) {
            firebaseId = `gasto_${id}`;
          }

          await window.firebaseRepos.operadores.saveGasto(firebaseId, gastos[index]);
          // console.log('✅ Gasto actualizado en Firebase con ID:', firebaseId);
        } catch (firebaseError) {
          console.warn('⚠️ Error actualizando en Firebase:', firebaseError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error al actualizar gasto:', error);
      return false;
    }
  }

  async updateIncidencia(id, datosActualizados) {
    try {
      const incidencias = await this.getIncidencias();
      const idString = String(id);
      const idNumber = parseInt(id, 10);

      // Buscar la incidencia de manera flexible
      const index = incidencias.findIndex(i => {
        const iId = i.id || i.incidenciaId;
        if (!iId) {
          return false;
        }

        const iIdString = String(iId);
        const iIdNumber = parseInt(iId, 10);

        // Comparar de múltiples formas
        return (
          iIdString === idString ||
          iIdString === String(id) ||
          iId === id ||
          iIdNumber === idNumber ||
          iIdNumber === id ||
          iId === idNumber ||
          String(iIdNumber) === idString ||
          String(iIdNumber) === String(id) ||
          // También buscar si el ID contiene el número (para IDs como "incidencia_123456")
          iIdString.includes(idString) ||
          iIdString.endsWith(idString) ||
          iIdString.replace(/^incidencia_/, '') === idString
        );
      });

      if (index === -1) {
        console.error('Incidencia no encontrada para actualizar:', id);
        // console.log('📋 IDs disponibles:', incidencias.slice(0, 5).map(i => ({ id: i.id, incidenciaId: i.incidenciaId })));
        return false;
      }

      // Actualizar la incidencia manteniendo el ID y fecha de creación original
      const incidenciaOriginal = incidencias[index];
      incidencias[index] = {
        ...incidenciaOriginal,
        ...datosActualizados,
        id: incidenciaOriginal.id, // Mantener ID original
        fechaCreacion: incidenciaOriginal.fechaCreacion, // Mantener fecha de creación original
        fechaActualizacion: new Date().toISOString()
      };

      localStorage.setItem(this.incidenciasStorageKey, JSON.stringify(incidencias));

      // Actualizar también en Firebase - usar el ID del documento de Firebase si está disponible
      if (window.firebaseRepos?.operadores) {
        try {
          // Determinar el ID correcto para Firebase
          let firebaseId = id;
          // Si el ID es numérico y no tiene prefijo, usar formato incidencia_${id}
          if (!isNaN(id) && !String(id).startsWith('incidencia_')) {
            firebaseId = `incidencia_${id}`;
          }

          await window.firebaseRepos.operadores.saveIncidencia(firebaseId, incidencias[index]);
          // console.log('✅ Incidencia actualizada en Firebase con ID:', firebaseId);
        } catch (firebaseError) {
          console.warn('⚠️ Error actualizando en Firebase:', firebaseError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error al actualizar incidencia:', error);
      return false;
    }
  }

  async deleteGasto(id) {
    try {
      const gastos = await this.getGastos();
      const gastosFiltrados = gastos.filter(g => g.id !== id);
      localStorage.setItem(this.gastosStorageKey, JSON.stringify(gastosFiltrados));
      console.log(`💾 Gasto ${id} eliminado de localStorage`);

      // Eliminar también de Firebase (físicamente)
      if (window.firebaseDb && window.fs) {
        try {
          console.log(`🔍 Buscando gasto ${id} en Firebase para eliminación física...`);

          // Intentar diferentes formatos de ID
          const posiblesIds = [`gasto_${id}`, `${id}`, `operador_gasto_${id}`, id];

          let eliminadoFirebase = false;

          for (const docId of posiblesIds) {
            try {
              const docRef = window.fs.doc(window.firebaseDb, 'operadores', docId);
              const docSnap = await window.fs.getDoc(docRef);

              if (docSnap.exists()) {
                // Eliminar físicamente el documento
                await window.fs.deleteDoc(docRef);
                console.log(`✅ Gasto ${docId} eliminado físicamente de Firebase`);
                eliminadoFirebase = true;
                break;
              }
            } catch (e) {
              // Continuar con el siguiente ID
              continue;
            }
          }

          // Si no se encontró con IDs directos, buscar en toda la colección (sin filtrar por tenantId)
          if (!eliminadoFirebase) {
            try {
              console.log(
                "🔍 Buscando en toda la colección 'operadores' sin filtro de tenantId..."
              );
              const collectionRef = window.fs.collection(window.firebaseDb, 'operadores');
              const snapshot = await window.fs.getDocs(collectionRef);

              console.log(
                `📊 Total de documentos en colección operadores: ${snapshot.docs.length}`
              );

              for (const doc of snapshot.docs) {
                const data = doc.data();
                const docId = doc.id;

                // Comparar como string para mayor flexibilidad
                const idStr = String(id);
                const dataIdStr = data.id ? String(data.id) : '';
                const gastoIdStr = data.gastoId ? String(data.gastoId) : '';
                const numeroRegistroStr = data.numeroRegistro ? String(data.numeroRegistro) : '';
                const docIdStr = String(docId);

                // Verificar si el documento es un gasto con el ID que buscamos
                if (
                  (dataIdStr === idStr ||
                    gastoIdStr === idStr ||
                    numeroRegistroStr === idStr ||
                    docIdStr === idStr ||
                    docIdStr.includes(idStr)) &&
                  (data.tipoGasto || data.tipo === 'gasto' || data.tipoGasto !== undefined)
                ) {
                  console.log(
                    `🎯 Gasto encontrado: ID=${docId}, id=${data.id}, gastoId=${data.gastoId}, data=`,
                    data
                  );
                  await window.fs.deleteDoc(doc.ref);
                  console.log(
                    `✅ Gasto ${id} encontrado y eliminado físicamente de Firebase (ID del doc: ${docId})`
                  );
                  eliminadoFirebase = true;
                  break;
                }
              }

              if (!eliminadoFirebase) {
                console.warn(`⚠️ Gasto ${id} no encontrado en ninguna colección de Firebase`);
              }
            } catch (e) {
              console.warn('⚠️ Error buscando en toda la colección:', e);
              console.error('❌ Detalles del error:', e.message, e.stack);
            }
          }

          // 3. Verificar que se eliminó de ambos lugares
          if (eliminadoFirebase) {
            console.log(`✅ Gasto ${id} eliminado completamente (localStorage + Firebase)`);
          } else {
            console.warn(
              `⚠️ Gasto ${id} eliminado de localStorage, pero no encontrado en Firebase`
            );
          }
        } catch (firebaseError) {
          console.error('❌ Error eliminando de Firebase:', firebaseError);
          console.error('❌ Detalles del error:', firebaseError.message, firebaseError.stack);
        }
      } else {
        console.warn('⚠️ Firebase no está disponible (firebaseDb o fs no disponibles)');
      }

      return true;
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      return false;
    }
  }

  // === GESTIÓN DE INCIDENCIAS ===
  async getIncidencias() {
    try {
      // PRIORIDAD 1: Intentar cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.operadores) {
        try {
          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
            await window.firebaseRepos.operadores.init();
          }

          if (window.firebaseRepos.operadores.db && window.firebaseRepos.operadores.tenantId) {
            const incidenciasFirebase = await window.firebaseRepos.operadores.getAllIncidencias();
            if (incidenciasFirebase && incidenciasFirebase.length > 0) {
              // console.log(`✅ ${incidenciasFirebase.length} incidencias cargadas desde Firebase`);
              // Sincronizar con localStorage para compatibilidad
              localStorage.setItem(this.incidenciasStorageKey, JSON.stringify(incidenciasFirebase));
              return incidenciasFirebase;
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando incidencias desde Firebase, usando localStorage:', error);
        }
      }

      // PRIORIDAD 2: Fallback a localStorage
      const incidenciasLocal = JSON.parse(localStorage.getItem(this.incidenciasStorageKey) || '[]');
      console.log(
        `📦 Cargando desde localStorage: ${incidenciasLocal.length} incidencias encontradas (antes de filtrar por tenantId)`
      );

      // Filtrar por tenantId o userId para asegurar aislamiento de datos
      const currentTenantId =
        window.firebaseRepos?.operadores?.tenantId ||
        localStorage.getItem('tenantId') ||
        JSON.parse(localStorage.getItem('erpCurrentUser') || '{}').tenantId;
      const currentUserId = window.firebaseAuth?.currentUser?.uid;

      if (currentTenantId || currentUserId) {
        const incidenciasFiltradas = incidenciasLocal.filter(incidencia => {
          const incidenciaTenantId = incidencia.tenantId || incidencia.tenant_id;
          const incidenciaUserId = incidencia.userId || incidencia.user_id;

          // Incluir si coincide el tenantId o userId
          return (
            (currentTenantId && incidenciaTenantId === currentTenantId) ||
            (currentUserId && incidenciaUserId === currentUserId) ||
            (!incidenciaTenantId && !incidenciaUserId)
          ); // Incluir registros sin tenantId/userId (legacy)
        });

        console.log(
          `🔍 Filtrado por tenantId (${currentTenantId || 'N/A'}) o userId (${currentUserId || 'N/A'}): ${incidenciasFiltradas.length} de ${incidenciasLocal.length} incidencias`
        );
        return incidenciasFiltradas;
      }

      return incidenciasLocal;
    } catch (error) {
      console.error('Error al cargar incidencias:', error);
      return [];
    }
  }

  async saveIncidencia(incidencia) {
    try {
      const incidenciaId = incidencia.id
        ? `incidencia_${incidencia.id}`
        : `incidencia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Asegurar que la fecha se guarde exactamente como viene, sin conversiones
      // Si la fecha viene como string "YYYY-MM-DD", mantenerla así
      const fechaOriginal = incidencia.fecha;
      console.log('📅 Fecha recibida en saveIncidencia:', fechaOriginal, typeof fechaOriginal);

      const nuevaIncidencia = {
        id: incidencia.id || Date.now(),
        fechaCreacion: new Date().toISOString(),
        ...incidencia,
        // Asegurar que la fecha se guarde como string en formato YYYY-MM-DD
        fecha:
          fechaOriginal && typeof fechaOriginal === 'string'
            ? fechaOriginal
            : fechaOriginal instanceof Date
              ? fechaOriginal.toISOString().split('T')[0]
              : fechaOriginal
      };

      console.log('📅 Fecha que se guardará en nuevaIncidencia:', nuevaIncidencia.fecha);

      // PRIORIDAD: Guardar en Firebase primero
      if (window.firebaseRepos && window.firebaseRepos.operadores) {
        try {
          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId)
          ) {
            attempts++;
            // console.log(`⏳ Esperando inicialización del repositorio operadores... (${attempts}/10)`);
            await new Promise(resolve => setTimeout(resolve, 500));
            await window.firebaseRepos.operadores.init();
          }

          if (window.firebaseRepos.operadores.db && window.firebaseRepos.operadores.tenantId) {
            console.log('🔥 Guardando incidencia en Firebase...');
            const resultado = await window.firebaseRepos.operadores.saveIncidencia(
              incidenciaId,
              nuevaIncidencia
            );
            if (resultado) {
              // console.log(`✅ Incidencia guardada en Firebase`);
            } else {
              console.warn('⚠️ No se pudo guardar en Firebase, continuando con localStorage...');
            }
          } else {
            console.warn(
              '⚠️ Repositorio operadores no inicializado, guardando solo en localStorage...'
            );
          }
        } catch (firebaseError) {
          console.error('❌ Error guardando incidencia en Firebase:', firebaseError);
          console.log('⚠️ Continuando con guardado en localStorage...');
        }
      }

      // También guardar en localStorage como respaldo
      const incidencias = await this.getIncidencias();
      const incidenciasActualizadas = [
        nuevaIncidencia,
        ...incidencias.filter(i => i.id !== nuevaIncidencia.id)
      ];
      localStorage.setItem(this.incidenciasStorageKey, JSON.stringify(incidenciasActualizadas));

      return true;
    } catch (error) {
      console.error('Error al guardar incidencia:', error);
      return false;
    }
  }

  async deleteIncidencia(id) {
    try {
      const incidencias = this.getIncidencias();
      const incidenciasFiltradas = incidencias.filter(i => i.id !== id);
      localStorage.setItem(this.incidenciasStorageKey, JSON.stringify(incidenciasFiltradas));
      console.log(`💾 Incidencia ${id} eliminada de localStorage`);

      // Eliminar también de Firebase
      if (window.firebaseRepos?.operadores) {
        try {
          // Asegurar que el repositorio esté inicializado
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
            await window.firebaseRepos.operadores.init();
          }

          if (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId) {
            console.warn('⚠️ No se pudo inicializar el repositorio de operadores');
          } else {
            const incidenciaId = `incidencia_${id}`;
            const resultado = await window.firebaseRepos.operadores.delete(incidenciaId);
            if (resultado) {
              // console.log(`✅ Incidencia ${incidenciaId} eliminada de Firebase (marcado como deleted: true)`);
            } else {
              console.warn(`⚠️ No se pudo eliminar la incidencia ${incidenciaId} de Firebase`);
            }
          }
        } catch (firebaseError) {
          console.error('❌ Error eliminando incidencia de Firebase:', firebaseError);
          console.error('❌ Detalles del error:', firebaseError.message, firebaseError.stack);
        }
      } else {
        console.warn('⚠️ Repositorio de Firebase Operadores no disponible');
      }

      return true;
    } catch (error) {
      console.error('Error al eliminar incidencia:', error);
      return false;
    }
  }

  // === GESTIÓN DE OPERADORES ===
  getOperadores() {
    try {
      return JSON.parse(localStorage.getItem(this.operadoresStorageKey)) || [];
    } catch (error) {
      console.error('Error al cargar operadores:', error);
      return [];
    }
  }

  // === REPORTES ===
  async generarReporteGastos(fechaInicio, fechaFin, operadorId) {
    const gastos = await this.getGastos();
    let gastosFiltrados = gastos;

    // Filtrar por fecha
    if (fechaInicio) {
      gastosFiltrados = gastosFiltrados.filter(g => g.fecha >= fechaInicio);
    }
    if (fechaFin) {
      gastosFiltrados = gastosFiltrados.filter(g => g.fecha <= fechaFin);
    }

    // Filtrar por operador
    if (operadorId) {
      gastosFiltrados = gastosFiltrados.filter(g => g.operadorId == operadorId);
    }

    return gastosFiltrados;
  }

  async generarReporteIncidencias(fechaInicio, fechaFin, operadorId) {
    const incidencias = await this.getIncidencias();

    // Asegurar que incidencias sea un array
    if (!Array.isArray(incidencias)) {
      console.error('⚠️ getIncidencias no devolvió un array:', incidencias);
      return [];
    }

    let incidenciasFiltradas = incidencias;

    // Filtrar por fecha
    if (fechaInicio) {
      incidenciasFiltradas = incidenciasFiltradas.filter(i => i.fecha >= fechaInicio);
    }
    if (fechaFin) {
      incidenciasFiltradas = incidenciasFiltradas.filter(i => i.fecha <= fechaFin);
    }

    // Filtrar por operador
    if (operadorId) {
      incidenciasFiltradas = incidenciasFiltradas.filter(i => i.operadorId == operadorId);
    }

    return incidenciasFiltradas;
  }
}

// Inicializar el manager
window.operadoresManager = new OperadoresManager();

// === FUNCIONES GLOBALES ===

// Cargar operadores en los selects desde Configuración
window.cargarOperadores = async function () {
  // console.log('🔄 Cargando operadores en selects...');
  let operadores = [];

  try {
    // PRIORIDAD: Intentar cargar desde configuracionManager usando getAllOperadores
    if (window.configuracionManager) {
      if (typeof window.configuracionManager.getAllOperadores === 'function') {
        operadores = window.configuracionManager.getAllOperadores() || [];
        // console.log('✅ Operadores cargados desde getAllOperadores:', operadores.length);
      } else if (typeof window.configuracionManager.getOperadores === 'function') {
        const operadoresData = window.configuracionManager.getOperadores();
        // Si es un objeto, convertirlo a array
        if (
          operadoresData &&
          typeof operadoresData === 'object' &&
          !Array.isArray(operadoresData)
        ) {
          operadores = Object.values(operadoresData);
        } else if (Array.isArray(operadoresData)) {
          operadores = operadoresData;
        }
        console.log('✅ Operadores cargados desde getOperadores:', operadores.length);
      }
    }

    // Si no hay operadores, intentar desde Firebase
    if (
      operadores.length === 0 &&
      window.firebaseDb &&
      window.fs &&
      window.firebaseAuth?.currentUser
    ) {
      try {
        console.log('📊 Intentando cargar operadores desde Firebase...');

        // PRIORIDAD 1: Intentar desde configuracion/operadores (documento con array)
        try {
          console.log('📊 [PRIORIDAD] Buscando en configuracion/operadores...');
          const operadoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
          const operadoresDoc = await window.fs.getDoc(operadoresDocRef);

          if (operadoresDoc.exists()) {
            const data = operadoresDoc.data();
            if (data.operadores && Array.isArray(data.operadores)) {
              operadores = data.operadores;
              console.log(
                '✅ Operadores cargados desde configuracion/operadores:',
                operadores.length
              );
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando desde configuracion/operadores:', error);
        }

        // PRIORIDAD 2: Si no hay datos, intentar desde la colección operadores
        if (operadores.length === 0) {
          try {
            console.log('📊 Buscando en colección operadores...');
            const operadoresRef = window.fs.collection(window.firebaseDb, 'operadores');
            const tenantId =
              window.firebaseAuth?.currentUser?.uid ||
              window.DEMO_CONFIG?.tenantId ||
              'demo_tenant';
            const querySnapshot = await window.fs.getDocs(
              window.fs.query(operadoresRef, window.fs.where('tenantId', '==', tenantId))
            );
            operadores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('✅ Operadores cargados desde colección operadores:', operadores.length);
          } catch (error) {
            console.warn('⚠️ Error cargando desde colección operadores:', error);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando operadores desde Firebase:', error);
      }
    }

    // Fallback: usar datos locales si configuracionManager no está disponible
    if (operadores.length === 0 && window.operadoresManager) {
      operadores = window.operadoresManager.getOperadores() || [];
      console.log('✅ Operadores cargados desde operadoresManager:', operadores.length);
    }

    // Fallback final: intentar desde localStorage directamente
    if (operadores.length === 0) {
      try {
        const operadoresData = localStorage.getItem('erp_operadores');
        if (operadoresData) {
          const parsed = JSON.parse(operadoresData);
          if (Array.isArray(parsed)) {
            operadores = parsed;
          } else if (typeof parsed === 'object') {
            operadores = Object.values(parsed);
          }
          console.log('✅ Operadores cargados desde localStorage:', operadores.length);
        }
      } catch (error) {
        console.warn('⚠️ Error cargando operadores desde localStorage:', error);
      }
    }
  } catch (error) {
    console.error('❌ Error cargando operadores desde configuración:', error);
    if (window.operadoresManager) {
      operadores = window.operadoresManager.getOperadores() || [];
    }
  }

  console.log('📋 Total de operadores encontrados:', operadores.length);

  const selects = ['operador', 'operadorIncidencia', 'operadorReporte'];

  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      // Limpiar opciones existentes (excepto la primera)
      const firstOption = select.firstElementChild;
      select.innerHTML = '';
      if (firstOption) {
        select.appendChild(firstOption);
      } else {
        select.innerHTML = '<option value="">Seleccionar operador...</option>';
      }

      // Agregar operadores activos
      const operadoresActivos = operadores.filter(
        op =>
          // Verificar que el operador tenga nombre y que esté activo (o no tenga campo activo)
          op && op.nombre && op.activo !== false && op.estado !== 'inactivo'
      );

      console.log(
        `📋 Agregando ${operadoresActivos.length} operadores activos al select ${selectId}`
      );

      operadoresActivos.forEach(operador => {
        const option = document.createElement('option');
        option.value = operador.id || operador.nombre || operador.numeroLicencia;
        const nombre = operador.nombre || operador.nombreCompleto || 'Sin nombre';
        const licencia = operador.licencia || operador.numeroLicencia || 'Sin Licencia';
        option.textContent = `${nombre} - ${licencia}`;
        select.appendChild(option);
      });

      console.log(`✅ Select ${selectId} actualizado con ${operadoresActivos.length} operadores`);
    } else {
      console.warn(`⚠️ Select ${selectId} no encontrado`);
    }
  });
};

// Cargar tractocamiones en los selects desde Configuración
window.cargarTractocamiones = async function () {
  console.log('🔄 Cargando tractocamiones en selects...');
  let tractocamiones = [];

  try {
    // 1. PRIORIDAD: Intentar desde el caché de Firestore (más actual)
    if (
      window.__economicosCache &&
      Array.isArray(window.__economicosCache) &&
      window.__economicosCache.length > 0
    ) {
      tractocamiones = window.__economicosCache;
      console.log('✅ Tractocamiones cargados desde Firestore cache:', tractocamiones.length);
    }

    // 2. Intentar cargar desde configuracionManager usando getAllEconomicos
    if (tractocamiones.length === 0 && window.configuracionManager) {
      if (typeof window.configuracionManager.getAllEconomicos === 'function') {
        const economicosData = window.configuracionManager.getAllEconomicos();
        if (Array.isArray(economicosData) && economicosData.length > 0) {
          tractocamiones = economicosData;
          console.log('✅ Tractocamiones cargados desde getAllEconomicos:', tractocamiones.length);
        }
      } else if (typeof window.configuracionManager.getEconomicos === 'function') {
        const economicosData = window.configuracionManager.getEconomicos();
        // Si es un objeto, convertirlo a array
        if (
          economicosData &&
          typeof economicosData === 'object' &&
          !Array.isArray(economicosData)
        ) {
          tractocamiones = Object.values(economicosData);
        } else if (Array.isArray(economicosData)) {
          tractocamiones = economicosData;
        }
        console.log('✅ Tractocamiones cargados desde getEconomicos:', tractocamiones.length);
      }
    }

    // 3. Si no hay datos, intentar desde Firebase
    if (
      tractocamiones.length === 0 &&
      window.firebaseDb &&
      window.fs &&
      window.firebaseAuth?.currentUser
    ) {
      try {
        console.log('📊 Intentando cargar tractocamiones desde Firebase...');

        // PRIORIDAD 1: Intentar desde configuracion/tractocamiones (documento con array)
        try {
          console.log('📊 [PRIORIDAD] Buscando en configuracion/tractocamiones...');
          const tractocamionesDocRef = window.fs.doc(
            window.firebaseDb,
            'configuracion',
            'tractocamiones'
          );
          const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);

          if (tractocamionesDoc.exists()) {
            const data = tractocamionesDoc.data();
            if (data.economicos && Array.isArray(data.economicos)) {
              tractocamiones = data.economicos;
              // Actualizar caché global
              window.__economicosCache = tractocamiones;
              console.log(
                '✅ Tractocamiones cargados desde configuracion/tractocamiones:',
                tractocamiones.length
              );
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando desde configuracion/tractocamiones:', error);
        }

        // PRIORIDAD 2: Si no hay datos, intentar desde la colección de económicos
        if (tractocamiones.length === 0) {
          try {
            console.log('📊 Buscando en colección economicos...');
            const economicosRef = window.fs.collection(window.firebaseDb, 'economicos');
            const tenantId =
              window.firebaseAuth?.currentUser?.uid ||
              window.DEMO_CONFIG?.tenantId ||
              'demo_tenant';
            const querySnapshot = await window.fs.getDocs(
              window.fs.query(economicosRef, window.fs.where('tenantId', '==', tenantId))
            );
            tractocamiones = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(
              '✅ Tractocamiones cargados desde colección economicos:',
              tractocamiones.length
            );

            // Actualizar caché global
            if (tractocamiones.length > 0) {
              window.__economicosCache = tractocamiones;
            }
          } catch (error) {
            console.warn('⚠️ Error cargando desde colección economicos:', error);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando tractocamiones desde Firebase:', error);
      }
    }

    // 4. Fallback: Intentar desde DataPersistence
    if (
      tractocamiones.length === 0 &&
      window.DataPersistence &&
      typeof window.DataPersistence.getAllEconomicos === 'function'
    ) {
      try {
        tractocamiones = window.DataPersistence.getAllEconomicos() || [];
        console.log('✅ Tractocamiones cargados desde DataPersistence:', tractocamiones.length);
      } catch (error) {
        console.warn('⚠️ Error cargando tractocamiones desde DataPersistence:', error);
      }
    }

    // 5. Fallback final: Intentar desde localStorage directamente
    if (tractocamiones.length === 0) {
      try {
        const economicosData = localStorage.getItem('erp_economicos');
        if (economicosData) {
          const parsed = JSON.parse(economicosData);
          if (Array.isArray(parsed)) {
            tractocamiones = parsed;
          } else if (typeof parsed === 'object') {
            tractocamiones = Object.values(parsed);
          }
          console.log('✅ Tractocamiones cargados desde localStorage:', tractocamiones.length);
        }
      } catch (error) {
        console.warn('⚠️ Error cargando tractocamiones desde localStorage:', error);
      }
    }

    // Si no hay datos, mostrar advertencia
    if (tractocamiones.length === 0) {
      console.warn('⚠️ No hay tractocamiones registrados en el sistema');
    }
  } catch (error) {
    console.error('❌ Error cargando tractocamiones:', error);
    tractocamiones = [];
  }

  console.log('📋 Total de tractocamiones encontrados:', tractocamiones.length);

  const selects = ['tractocamion', 'tractocamionIncidencia'];

  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      // Limpiar opciones existentes (excepto la primera)
      const firstOption = select.firstElementChild;
      select.innerHTML = '';
      if (firstOption) {
        select.appendChild(firstOption);
      } else {
        select.innerHTML = '<option value="">Seleccionar tractocamión...</option>';
      }

      // Filtrar solo tractocamiones activos
      const tractocamionesActivos = tractocamiones.filter(
        tracto =>
          // Verificar que tenga número y que esté activo (o no tenga campo estadoVehiculo inactivo)
          tracto &&
          tracto.numero &&
          tracto.estadoVehiculo !== 'inactivo' &&
          tracto.estadoVehiculo !== 'retirado'
      );

      console.log(
        `📋 Agregando ${tractocamionesActivos.length} tractocamiones activos al select ${selectId}`
      );

      // Agregar tractocamiones
      tractocamionesActivos.forEach(tracto => {
        const option = document.createElement('option');
        option.value = tracto.numero || tracto.id || tracto.economico;

        // Usar 'numero' para económicos o 'economico' para compatibilidad
        const economico = tracto.numero || tracto.economico || tracto.id || 'N/A';
        const placa = tracto.placaTracto || tracto.placa || '';
        const marca = tracto.marca || '';
        const modelo = tracto.modelo || '';

        // Formatear texto de la opción
        let texto = economico;
        if (placa) {
          texto += ` - ${placa}`;
        }
        if (marca || modelo) {
          texto += ` (${marca} ${modelo})`.trim();
        }

        option.textContent = texto;
        select.appendChild(option);
      });

      console.log(
        `✅ Select ${selectId} actualizado con ${tractocamionesActivos.length} tractocamiones`
      );
    } else {
      console.warn(`⚠️ Select ${selectId} no encontrado`);
    }
  });
};

// Guardar gasto
window.guardarGasto = async function () {
  // Obtener el botón y configurar estado de carga
  const btnGuardar =
    document.querySelector('[data-action="guardarGasto"]') ||
    document.getElementById('btnGuardarGasto');

  // Guardar estado original del botón
  const estadoOriginal = btnGuardar
    ? {
      disabled: btnGuardar.disabled,
      innerHTML: btnGuardar.innerHTML,
      text: btnGuardar.textContent,
      classes: btnGuardar.className,
      style: {
        opacity: btnGuardar.style.opacity || '',
        cursor: btnGuardar.style.cursor || ''
      }
    }
    : null;

  // Activar estado de carga INMEDIATAMENTE para evitar dobles clics
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.style.cursor = 'not-allowed';
    btnGuardar.style.opacity = '0.7';
    btnGuardar.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...';
    btnGuardar.classList.add('opacity-75');
    // Prevenir cualquier otro clic
    btnGuardar.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
  }

  try {
    const form = document.getElementById('gastosForm');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      // Restaurar botón antes de retornar
      if (btnGuardar && estadoOriginal) {
        btnGuardar.disabled = estadoOriginal.disabled;
        btnGuardar.innerHTML = estadoOriginal.innerHTML;
        btnGuardar.className = estadoOriginal.classes;
        btnGuardar.style.opacity = estadoOriginal.style.opacity;
        btnGuardar.style.cursor = estadoOriginal.style.cursor;
        btnGuardar.classList.remove('opacity-75');
        btnGuardar.onclick = null;
      }
      return false;
    }

    // Validar archivos
    const archivos = document.getElementById('evidenciaGasto').files;
    if (archivos.length > 5) {
      showNotification('Máximo 5 archivos permitidos', 'error');
      // Restaurar botón antes de retornar
      if (btnGuardar && estadoOriginal) {
        btnGuardar.disabled = estadoOriginal.disabled;
        btnGuardar.innerHTML = estadoOriginal.innerHTML;
        btnGuardar.className = estadoOriginal.classes;
        btnGuardar.style.opacity = estadoOriginal.style.opacity;
        btnGuardar.style.cursor = estadoOriginal.style.cursor;
        btnGuardar.classList.remove('opacity-75');
        btnGuardar.onclick = null;
      }
      return false;
    }

    // Obtener valores de operador y tractocamion (pueden ser select o input searchable)
    const operadorInput = document.getElementById('operador');
    const operadorHidden = document.getElementById('operador_value');
    const tractocamionInput = document.getElementById('tractocamion');
    const tractocamionHidden = document.getElementById('tractocamion_value');

    // Si es un select tradicional, usar su valor
    // Si es un input searchable, usar el hidden input
    let operadorId = null;
    let operadorNombre = '';
    let operadorLicencia = '';
    let tractocamionId = null;
    let tractocamionInfo = '';

    if (operadorInput) {
      if (operadorInput.tagName === 'SELECT') {
        // Es un select tradicional
        const operadorIdParsed = parseInt(operadorInput.value, 10);
        operadorId = !isNaN(operadorIdParsed) && operadorIdParsed > 0 ? operadorIdParsed : null;
        const textoCompleto = operadorInput.selectedOptions[0]?.textContent || '';

        // Extraer nombre y licencia del formato "Nombre - Licencia"
        if (textoCompleto.includes(' - ')) {
          const partes = textoCompleto.split(' - ');
          operadorNombre = partes[0].trim();
          operadorLicencia = partes[1]?.trim() || '';
        } else {
          // Si no tiene el formato, asumir que es solo el nombre
          operadorNombre = textoCompleto;
          // Intentar obtener la licencia del operador desde los datos
          if (operadorId && window.configuracionManager) {
            const operadores = window.configuracionManager.getAllOperadores() || [];
            const operador = operadores.find(
              op => op.id === operadorId || op.numeroLicencia === operadorId
            );
            if (operador) {
              operadorLicencia = operador.licencia || operador.numeroLicencia || '';
            }
          }
        }
      } else if (operadorInput.tagName === 'INPUT') {
        // Es un input searchable
        if (operadorHidden?.value) {
          const operadorIdParsed = parseInt(operadorHidden.value, 10);
          operadorId = !isNaN(operadorIdParsed) && operadorIdParsed > 0 ? operadorIdParsed : null;
        } else {
          operadorId = null;
        }
        const textoCompleto = operadorInput.value || '';

        // Extraer nombre y licencia del formato "Nombre - Licencia"
        if (textoCompleto.includes(' - ')) {
          const partes = textoCompleto.split(' - ');
          operadorNombre = partes[0].trim();
          operadorLicencia = partes[1]?.trim() || '';
        } else {
          // Si el input solo tiene la licencia, buscar el operador para obtener el nombre
          operadorLicencia = textoCompleto;
          if (operadorId && window.configuracionManager) {
            const operadores = window.configuracionManager.getAllOperadores() || [];
            const operador = operadores.find(
              op =>
                op.id === operadorId ||
                op.numeroLicencia === operadorId ||
                op.licencia === textoCompleto ||
                op.numeroLicencia === textoCompleto
            );
            if (operador) {
              operadorNombre = operador.nombre || operador.nombreCompleto || '';
              operadorLicencia = operador.licencia || operador.numeroLicencia || operadorLicencia;
            } else {
              // Si no se encuentra, usar el texto como nombre (fallback)
              operadorNombre = textoCompleto;
            }
          } else {
            // Si no hay ID, asumir que el texto es el nombre
            operadorNombre = textoCompleto;
          }
        }
      }
    }

    if (tractocamionInput) {
      if (tractocamionInput.tagName === 'SELECT') {
        // Es un select tradicional
        const tractocamionIdParsed = parseInt(tractocamionInput.value, 10);
        tractocamionId =
          !isNaN(tractocamionIdParsed) && tractocamionIdParsed > 0 ? tractocamionIdParsed : null;
        tractocamionInfo = tractocamionInput.selectedOptions[0]?.textContent || '';
      } else if (tractocamionInput.tagName === 'INPUT') {
        // Es un input searchable
        if (tractocamionHidden?.value) {
          const tractocamionIdParsed = parseInt(tractocamionHidden.value, 10);
          tractocamionId =
            !isNaN(tractocamionIdParsed) && tractocamionIdParsed > 0 ? tractocamionIdParsed : null;
        } else {
          tractocamionId = null;
        }
        tractocamionInfo = tractocamionInput.value || '';
      }
    }

    // Extraer placas del tractocamion del formato "económico - placas" o "101- Kenworth T680 (23-ABC-7)"
    let tractocamionPlacas = '';
    let tractocamionEconomico = '';

    if (tractocamionInfo) {
      // Formato 1: "101- Kenworth T680 (23-ABC-7)" - extraer placas de paréntesis
      const matchConParentesis = tractocamionInfo.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (matchConParentesis) {
        tractocamionEconomico = matchConParentesis[1].trim(); // "101- Kenworth T680"
        tractocamionPlacas = matchConParentesis[2].trim(); // "23-ABC-7"
      }
      // Formato 2: "económico - placas" (formato anterior)
      else if (tractocamionInfo.includes(' - ')) {
        const partes = tractocamionInfo.split(' - ');
        tractocamionEconomico = partes[0]?.trim() || '';
        tractocamionPlacas = partes[1]?.trim() || '';
      }
      // Formato 3: Solo económico, intentar obtener placas desde la configuración
      else {
        tractocamionEconomico = tractocamionInfo.trim();
        if (tractocamionId && window.configuracionManager) {
          const economicos = window.configuracionManager.getAllEconomicos() || [];
          const economico = economicos.find(
            ec => ec.numero === tractocamionId || ec.id === tractocamionId
          );
          if (economico) {
            tractocamionPlacas = economico.placaTracto || economico.placas || '';
          }
        }
      }
    }

    const gastoData = {
      fecha: document.getElementById('fechaGasto').value,
      // Solo incluir operadorId si es un número válido
      ...(operadorId !== null && !isNaN(operadorId) ? { operadorId: operadorId } : {}),
      operadorNombre: operadorNombre, // Nombre completo del operador
      operadorLicencia: operadorLicencia, // Licencia del operador (separada)
      // Solo incluir tractocamionId si es un número válido
      ...(tractocamionId !== null && !isNaN(tractocamionId)
        ? { tractocamionId: tractocamionId }
        : {}),
      tractocamionInfo: tractocamionInfo, // Información completa (para compatibilidad)
      tractocamionEconomico: tractocamionEconomico, // Número económico del tractocamion
      tractocamionPlacas: tractocamionPlacas, // Placas del tractocamion (separadas)
      tipoGasto: document.getElementById('tipoGasto').value,
      monto: parseFloat(document.getElementById('montoGasto').value),
      numeroRegistro: document.getElementById('numeroRegistroGasto').value,
      concepto: document.getElementById('conceptoGasto').value,
      evidencia: Array.from(archivos).map(file => ({
        nombre: file.name,
        tamaño: file.size,
        tipo: file.type,
        fecha: new Date().toISOString()
      })),
      observaciones: document.getElementById('observacionesGasto').value
    };

    const success = await window.operadoresManager.saveGasto(gastoData);

    if (success) {
      // Actualizar botón a estado de éxito antes de recargar
      if (btnGuardar) {
        btnGuardar.innerHTML = '<i class="fas fa-check me-2"></i>Guardado';
        btnGuardar.classList.remove('opacity-75');
        btnGuardar.classList.add('opacity-100');
      }

      showNotification('Gasto registrado exitosamente', 'success');
      form.reset();
      form.classList.remove('was-validated');
      await cargarGastos();

      // Recargar la página después de limpiar los datos
      setTimeout(() => {
        location.reload();
      }, 800);
    } else {
      // Restaurar botón en caso de error
      if (btnGuardar && estadoOriginal) {
        btnGuardar.disabled = estadoOriginal.disabled;
        btnGuardar.innerHTML = estadoOriginal.innerHTML;
        btnGuardar.className = estadoOriginal.classes;
        btnGuardar.style.opacity = estadoOriginal.style.opacity;
        btnGuardar.style.cursor = estadoOriginal.style.cursor;
        btnGuardar.classList.remove('opacity-75');
        btnGuardar.onclick = null;
      }
      showNotification('Error al registrar gasto', 'error');
    }
    return success;
  } catch (error) {
    console.error('❌ Error registrando gasto:', error);

    // Restaurar botón en caso de error
    if (btnGuardar && estadoOriginal) {
      btnGuardar.disabled = estadoOriginal.disabled;
      btnGuardar.innerHTML = estadoOriginal.innerHTML;
      btnGuardar.className = estadoOriginal.classes;
      btnGuardar.style.opacity = estadoOriginal.style.opacity;
      btnGuardar.style.cursor = estadoOriginal.style.cursor;
      btnGuardar.classList.remove('opacity-75');
      btnGuardar.onclick = null;
    }

    showNotification(`Error al registrar gasto: ${error.message || error}`, 'error');
    return false;
  }
};

// Guardar incidencia
window.guardarIncidencia = async function () {
  // Obtener el botón y configurar estado de carga
  const btnGuardar =
    document.querySelector('[data-action="guardarIncidencia"]') ||
    document.getElementById('btnGuardarIncidencia');

  // Guardar estado original del botón
  const estadoOriginal = btnGuardar
    ? {
      disabled: btnGuardar.disabled,
      innerHTML: btnGuardar.innerHTML,
      text: btnGuardar.textContent,
      classes: btnGuardar.className,
      style: {
        opacity: btnGuardar.style.opacity || '',
        cursor: btnGuardar.style.cursor || ''
      }
    }
    : null;

  // Activar estado de carga INMEDIATAMENTE para evitar dobles clics
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.style.cursor = 'not-allowed';
    btnGuardar.style.opacity = '0.7';
    btnGuardar.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...';
    btnGuardar.classList.add('opacity-75');
    // Prevenir cualquier otro clic
    btnGuardar.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
  }

  try {
    const form = document.getElementById('incidenciasForm');

    // Validar número de registro antes de validar el formulario
    const numeroRegistroInput = document.getElementById('numeroRegistroIncidencia');
    if (numeroRegistroInput && typeof window.validarNumeroRegistro === 'function') {
      window.validarNumeroRegistro(numeroRegistroInput, 'numeroRegistroIncidencia');
      if (!numeroRegistroInput.checkValidity()) {
        numeroRegistroInput.reportValidity();
        form.classList.add('was-validated');
        // Restaurar botón antes de retornar
        if (btnGuardar && estadoOriginal) {
          btnGuardar.disabled = estadoOriginal.disabled;
          btnGuardar.innerHTML = estadoOriginal.innerHTML;
          btnGuardar.className = estadoOriginal.classes;
          btnGuardar.style.opacity = estadoOriginal.style.opacity;
          btnGuardar.style.cursor = estadoOriginal.style.cursor;
          btnGuardar.classList.remove('opacity-75');
          btnGuardar.onclick = null;
        }
        return false;
      }
    }

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      // Restaurar botón antes de retornar
      if (btnGuardar && estadoOriginal) {
        btnGuardar.disabled = estadoOriginal.disabled;
        btnGuardar.innerHTML = estadoOriginal.innerHTML;
        btnGuardar.className = estadoOriginal.classes;
        btnGuardar.style.opacity = estadoOriginal.style.opacity;
        btnGuardar.style.cursor = estadoOriginal.style.cursor;
        btnGuardar.classList.remove('opacity-75');
        btnGuardar.onclick = null;
      }
      return false;
    }

    // Validar archivos
    const archivos = document.getElementById('evidenciaIncidencia').files;
    if (archivos.length > 5) {
      showNotification('Máximo 5 archivos permitidos', 'error');
      // Restaurar botón antes de retornar
      if (btnGuardar && estadoOriginal) {
        btnGuardar.disabled = estadoOriginal.disabled;
        btnGuardar.innerHTML = estadoOriginal.innerHTML;
        btnGuardar.className = estadoOriginal.classes;
        btnGuardar.style.opacity = estadoOriginal.style.opacity;
        btnGuardar.style.cursor = estadoOriginal.style.cursor;
        btnGuardar.classList.remove('opacity-75');
        btnGuardar.onclick = null;
      }
      return false;
    }

    // Capturar fecha del input y asegurarse de que se guarde correctamente
    const fechaInput = document.getElementById('fechaIncidencia').value;
    // Asegurar que la fecha se guarde en formato YYYY-MM-DD sin conversiones de zona horaria
    const fechaGuardar = fechaInput || new Date().toISOString().split('T')[0];

    // Obtener valores de operador y tractocamion (pueden ser select o input searchable)
    const operadorIncidenciaInput = document.getElementById('operadorIncidencia');
    const operadorIncidenciaHidden = document.getElementById('operadorIncidencia_value');
    const tractocamionIncidenciaInput = document.getElementById('tractocamionIncidencia');
    const tractocamionIncidenciaHidden = document.getElementById('tractocamionIncidencia_value');

    // Si es un select tradicional, usar su valor
    // Si es un input searchable, usar el hidden input
    let operadorIncidenciaId = null;
    let operadorIncidenciaNombre = '';
    let operadorIncidenciaLicencia = '';
    let tractocamionIncidenciaId = null;
    let tractocamionIncidenciaInfo = '';

    if (operadorIncidenciaInput) {
      if (operadorIncidenciaInput.tagName === 'SELECT') {
        // Es un select tradicional
        const operadorIncidenciaIdParsed = parseInt(operadorIncidenciaInput.value, 10);
        operadorIncidenciaId =
          !isNaN(operadorIncidenciaIdParsed) && operadorIncidenciaIdParsed > 0
            ? operadorIncidenciaIdParsed
            : null;
        const textoCompleto = operadorIncidenciaInput.selectedOptions[0]?.textContent || '';

        // Extraer nombre y licencia del formato "Nombre - Licencia"
        if (textoCompleto.includes(' - ')) {
          const partes = textoCompleto.split(' - ');
          operadorIncidenciaNombre = partes[0].trim();
          operadorIncidenciaLicencia = partes[1]?.trim() || '';
        } else {
          // Si no tiene el formato, asumir que es solo el nombre
          operadorIncidenciaNombre = textoCompleto;
          // Intentar obtener la licencia del operador desde los datos
          if (operadorIncidenciaId && window.configuracionManager) {
            const operadores = window.configuracionManager.getAllOperadores() || [];
            const operador = operadores.find(
              op => op.id === operadorIncidenciaId || op.numeroLicencia === operadorIncidenciaId
            );
            if (operador) {
              operadorIncidenciaLicencia = operador.licencia || operador.numeroLicencia || '';
            }
          }
        }
      } else if (operadorIncidenciaInput.tagName === 'INPUT') {
        // Es un input searchable
        if (operadorIncidenciaHidden?.value) {
          const operadorIncidenciaIdParsed = parseInt(operadorIncidenciaHidden.value, 10);
          operadorIncidenciaId =
            !isNaN(operadorIncidenciaIdParsed) && operadorIncidenciaIdParsed > 0
              ? operadorIncidenciaIdParsed
              : null;
        } else {
          operadorIncidenciaId = null;
        }
        const textoCompleto = operadorIncidenciaInput.value || '';

        // Extraer nombre y licencia del formato "Nombre - Licencia"
        if (textoCompleto.includes(' - ')) {
          const partes = textoCompleto.split(' - ');
          operadorIncidenciaNombre = partes[0].trim();
          operadorIncidenciaLicencia = partes[1]?.trim() || '';
        } else {
          // Si el input solo tiene la licencia, buscar el operador para obtener el nombre
          operadorIncidenciaLicencia = textoCompleto;
          if (operadorIncidenciaId && window.configuracionManager) {
            const operadores = window.configuracionManager.getAllOperadores() || [];
            const operador = operadores.find(
              op =>
                op.id === operadorIncidenciaId ||
                op.numeroLicencia === operadorIncidenciaId ||
                op.licencia === textoCompleto ||
                op.numeroLicencia === textoCompleto
            );
            if (operador) {
              operadorIncidenciaNombre = operador.nombre || operador.nombreCompleto || '';
              operadorIncidenciaLicencia =
                operador.licencia || operador.numeroLicencia || operadorIncidenciaLicencia;
            } else {
              // Si no se encuentra, usar el texto como nombre (fallback)
              operadorIncidenciaNombre = textoCompleto;
            }
          } else {
            // Si no hay ID, asumir que el texto es el nombre
            operadorIncidenciaNombre = textoCompleto;
          }
        }
      }
    }

    if (tractocamionIncidenciaInput) {
      if (tractocamionIncidenciaInput.tagName === 'SELECT') {
        // Es un select tradicional
        const tractocamionIncidenciaIdParsed = parseInt(tractocamionIncidenciaInput.value, 10);
        tractocamionIncidenciaId =
          !isNaN(tractocamionIncidenciaIdParsed) && tractocamionIncidenciaIdParsed > 0
            ? tractocamionIncidenciaIdParsed
            : null;
        tractocamionIncidenciaInfo =
          tractocamionIncidenciaInput.selectedOptions[0]?.textContent || '';
      } else if (tractocamionIncidenciaInput.tagName === 'INPUT') {
        // Es un input searchable
        if (tractocamionIncidenciaHidden?.value) {
          const tractocamionIncidenciaIdParsed = parseInt(tractocamionIncidenciaHidden.value, 10);
          tractocamionIncidenciaId =
            !isNaN(tractocamionIncidenciaIdParsed) && tractocamionIncidenciaIdParsed > 0
              ? tractocamionIncidenciaIdParsed
              : null;
        } else {
          tractocamionIncidenciaId = null;
        }
        tractocamionIncidenciaInfo = tractocamionIncidenciaInput.value || '';
      }
    }

    // Extraer placas del tractocamion del formato "económico - placas" o "101- Kenworth T680 (23-ABC-7)"
    let tractocamionIncidenciaPlacas = '';
    let tractocamionIncidenciaEconomico = '';

    if (tractocamionIncidenciaInfo) {
      // Formato 1: "101- Kenworth T680 (23-ABC-7)" - extraer placas de paréntesis
      const matchConParentesis = tractocamionIncidenciaInfo.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (matchConParentesis) {
        tractocamionIncidenciaEconomico = matchConParentesis[1].trim(); // "101- Kenworth T680"
        tractocamionIncidenciaPlacas = matchConParentesis[2].trim(); // "23-ABC-7"
      }
      // Formato 2: "económico - placas" (formato anterior)
      else if (tractocamionIncidenciaInfo.includes(' - ')) {
        const partes = tractocamionIncidenciaInfo.split(' - ');
        tractocamionIncidenciaEconomico = partes[0]?.trim() || '';
        tractocamionIncidenciaPlacas = partes[1]?.trim() || '';
      }
      // Formato 3: Solo económico, intentar obtener placas desde la configuración
      else {
        tractocamionIncidenciaEconomico = tractocamionIncidenciaInfo.trim();
        if (tractocamionIncidenciaId && window.configuracionManager) {
          const economicos = window.configuracionManager.getAllEconomicos() || [];
          const economico = economicos.find(
            ec => ec.numero === tractocamionIncidenciaId || ec.id === tractocamionIncidenciaId
          );
          if (economico) {
            tractocamionIncidenciaPlacas = economico.placaTracto || economico.placas || '';
          }
        }
      }
    }

    const incidenciaData = {
      fecha: fechaGuardar,
      // Solo incluir operadorId si es un número válido
      ...(operadorIncidenciaId !== null && !isNaN(operadorIncidenciaId)
        ? { operadorId: operadorIncidenciaId }
        : {}),
      operadorNombre: operadorIncidenciaNombre, // Nombre completo del operador
      operadorLicencia: operadorIncidenciaLicencia, // Licencia del operador (separada)
      // Solo incluir tractocamionId si es un número válido
      ...(tractocamionIncidenciaId !== null && !isNaN(tractocamionIncidenciaId)
        ? { tractocamionId: tractocamionIncidenciaId }
        : {}),
      tractocamionInfo: tractocamionIncidenciaInfo, // Información completa (para compatibilidad)
      tractocamionEconomico: tractocamionIncidenciaEconomico, // Número económico del tractocamion
      tractocamionPlacas: tractocamionIncidenciaPlacas, // Placas del tractocamion (separadas)
      tipoIncidencia: document.getElementById('tipoIncidencia').value,
      numeroRegistro: document.getElementById('numeroRegistroIncidencia').value,
      descripcion: document.getElementById('descripcionIncidencia').value,
      evidencia: Array.from(archivos).map(file => ({
        nombre: file.name,
        tamaño: file.size,
        tipo: file.type,
        fecha: new Date().toISOString()
      })),
      ubicacion: document.getElementById('ubicacionIncidencia').value,
      severidad: document.getElementById('severidadIncidencia').value,
      accionesTomadas: document.getElementById('accionesTomadas').value
    };

    console.log('📅 Fecha capturada del input:', fechaInput);
    console.log('📅 Fecha que se guardará:', fechaGuardar);

    const success = await window.operadoresManager.saveIncidencia(incidenciaData);

    if (success) {
      // Actualizar botón a estado de éxito antes de recargar
      if (btnGuardar) {
        btnGuardar.innerHTML = '<i class="fas fa-check me-2"></i>Guardado';
        btnGuardar.classList.remove('opacity-75');
        btnGuardar.classList.add('opacity-100');
      }

      showNotification('Incidencia registrada exitosamente', 'success');
      form.reset();
      form.classList.remove('was-validated');
      await cargarIncidencias();

      // Recargar la página después de limpiar los datos
      setTimeout(() => {
        location.reload();
      }, 800);
    } else {
      // Restaurar botón en caso de error
      if (btnGuardar && estadoOriginal) {
        btnGuardar.disabled = estadoOriginal.disabled;
        btnGuardar.innerHTML = estadoOriginal.innerHTML;
        btnGuardar.className = estadoOriginal.classes;
        btnGuardar.style.opacity = estadoOriginal.style.opacity;
        btnGuardar.style.cursor = estadoOriginal.style.cursor;
        btnGuardar.classList.remove('opacity-75');
        btnGuardar.onclick = null;
      }
      showNotification('Error al registrar incidencia', 'error');
    }
    return success;
  } catch (error) {
    console.error('❌ Error registrando incidencia:', error);

    // Restaurar botón en caso de error
    if (btnGuardar && estadoOriginal) {
      btnGuardar.disabled = estadoOriginal.disabled;
      btnGuardar.innerHTML = estadoOriginal.innerHTML;
      btnGuardar.className = estadoOriginal.classes;
      btnGuardar.style.opacity = estadoOriginal.style.opacity;
      btnGuardar.style.cursor = estadoOriginal.style.cursor;
      btnGuardar.classList.remove('opacity-75');
      btnGuardar.onclick = null;
    }

    showNotification(`Error al registrar incidencia: ${error.message || error}`, 'error');
    return false;
  }
};

// Variable global para almacenar todos los gastos sin filtrar
window._gastosCompletos = [];

// Función para normalizar gastos existentes (agregar campo 'tipo' si falta)
function normalizarGastosExistentes() {
  try {
    const gastosLocal = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    let hayCambios = false;

    const gastosNormalizados = gastosLocal.map(gasto => {
      const gastoNormalizado = { ...gasto };
      let cambioRealizado = false;

      // Normalizar campo 'tipo'
      if (!gasto.tipo) {
        if (
          gasto.origen === 'trafico' ||
          gasto.tipoGasto ||
          gasto.motivo ||
          gasto.monto !== undefined
        ) {
          gastoNormalizado.tipo = 'gasto';
          cambioRealizado = true;
        }
      }

      // Normalizar campo 'operadorNombre' (mapear desde 'operador' si existe)
      if (!gasto.operadorNombre && gasto.operador) {
        gastoNormalizado.operadorNombre = gasto.operador;
        cambioRealizado = true;
      }

      // Normalizar campo 'tipoGasto' (mapear desde 'motivo' si existe)
      if (!gasto.tipoGasto && gasto.motivo) {
        gastoNormalizado.tipoGasto = gasto.motivo;
        cambioRealizado = true;
      }

      if (cambioRealizado) {
        hayCambios = true;
      }

      return gastoNormalizado;
    });

    if (hayCambios) {
      localStorage.setItem('erp_operadores_gastos', JSON.stringify(gastosNormalizados));
      console.log('✅ Gastos existentes normalizados (agregado campo tipo donde faltaba)');
    }
  } catch (error) {
    console.warn('⚠️ Error normalizando gastos existentes:', error);
  }
}

// Cargar gastos en la tabla
window.cargarGastos = async function () {
  const tbody = document.getElementById('gastosTableBody');
  if (!tbody) {
    return;
  }

  tbody.innerHTML =
    '<tr><td colspan="8" class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

  // Normalizar gastos existentes antes de cargar
  normalizarGastosExistentes();

  const gastos = await window.operadoresManager.getGastos();
  console.log(`📊 Total de gastos cargados: ${gastos.length}`);

  // Guardar gastos completos para filtrado
  window._gastosCompletos = gastos;

  // Ordenar por fecha descendente (más recientes primero)
  const gastosOrdenados = gastos.sort((a, b) => {
    const fechaA = new Date(a.fecha || a.fechaCreacion || a.fechaActualizacion || 0);
    const fechaB = new Date(b.fecha || b.fechaCreacion || b.fechaActualizacion || 0);
    return fechaB - fechaA; // Orden descendente (más recientes primero)
  });

  tbody.innerHTML = '';

  if (gastosOrdenados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Sin registros</td></tr>';
    document.getElementById('paginacionGastos').innerHTML = '';
    return;
  }

  // Inicializar paginación
  const PaginacionManagerClass =
    typeof PaginacionManager !== 'undefined'
      ? PaginacionManager
      : typeof window.PaginacionManager !== 'undefined'
        ? window.PaginacionManager
        : null;

  if (!PaginacionManagerClass) {
    console.warn(
      '⚠️ PaginacionManager no está disponible, mostrando todos los gastos sin paginación'
    );
    // Mostrar todos los gastos sin paginación
    gastosOrdenados.forEach(gasto => {
      const tr = document.createElement('tr');
      const evidenciaCount = gasto.evidencia ? gasto.evidencia.length : 0;
      const evidenciaBadge =
        evidenciaCount > 0
          ? `<span class="badge bg-success">${evidenciaCount} archivo${evidenciaCount > 1 ? 's' : ''}</span>`
          : '<span class="badge bg-secondary">Sin evidencia</span>';

      const esDeTrafico = gasto.origen === 'trafico';
      const origenBadge = esDeTrafico
        ? '<span class="badge bg-warning text-dark ms-1">Tráfico</span>'
        : '';

      // Normalizar campos para compatibilidad
      const operadorNombre = gasto.operadorNombre || gasto.operador || 'N/A';
      const tipoGasto = gasto.tipoGasto || gasto.motivo || 'N/A';
      const monto = gasto.monto || 0;

      const tractocamionTexto =
        gasto.economico || gasto.tractocamionInfo || gasto.tractocamion || '';
      const tractocamion = tractocamionTexto
        ? `<span class="badge bg-primary">${tractocamionTexto}</span>`
        : '<span class="badge bg-secondary">Sin asignar</span>';

      tr.innerHTML = `
                <td>${formatearFecha(gasto.fecha || gasto.fechaCreacion)}</td>
                <td>${gasto.numeroRegistro || 'N/A'}</td>
                <td>${operadorNombre}</td>
                <td>${tractocamion}</td>
                <td><span class="badge bg-info">${tipoGasto}</span>${origenBadge}</td>
                <td>$${monto.toFixed(2)}</td>
                <td>${evidenciaBadge}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="verDetalleGasto('${gasto.id}')" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${
  !esDeTrafico
    ? `<button class="btn btn-sm btn-outline-danger" onclick="descargarPDFGasto('${gasto.id}')" title="Descargar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>`
    : ''
}
                        ${
  !esDeTrafico
    ? `<button class="btn btn-sm btn-outline-danger" onclick="eliminarGasto('${gasto.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>`
    : ''
}
                    </div>
                </td>
            `;
      tbody.appendChild(tr);
    });
    document.getElementById('paginacionGastos').innerHTML = '';
    window.cargarOpcionesFiltrosGastos();
    return;
  }

  if (!window._paginacionGastosManager) {
    try {
      window._paginacionGastosManager = new PaginacionManagerClass();
      console.log('✅ Nueva instancia de PaginacionManager creada para gastos');
    } catch (error) {
      console.error('❌ Error creando instancia de PaginacionManager:', error);
      return;
    }
  }

  try {
    window._paginacionGastosManager.inicializar(gastosOrdenados, 15);
    window._paginacionGastosManager.paginaActual = 1;
    console.log(
      `✅ Paginación inicializada: ${window._paginacionGastosManager.totalRegistros} gastos, ${window._paginacionGastosManager.obtenerTotalPaginas()} páginas`
    );
    console.log(
      `📊 _gastosCompletos tiene ${window._gastosCompletos.length} gastos antes de renderizar`
    );
    renderizarGastos();
    console.log('✅ renderizarGastos() ejecutado');
  } catch (error) {
    console.error('❌ Error al inicializar paginación:', error);
  }

  // Cargar opciones de filtros después de cargar los gastos
  window.cargarOpcionesFiltrosGastos();
};

// Función para renderizar los gastos de la página actual
function renderizarGastos() {
  console.log('🎨 renderizarGastos() llamado');
  const tbody = document.getElementById('gastosTableBody');
  if (!tbody) {
    console.warn('⚠️ tbody no encontrado');
    return;
  }
  if (!window._paginacionGastosManager) {
    console.warn('⚠️ PaginacionManager no disponible');
    return;
  }
  if (!window._gastosCompletos) {
    console.warn('⚠️ _gastosCompletos no disponible');
    return;
  }

  console.log(`📊 Renderizando gastos: ${window._gastosCompletos.length} gastos totales`);
  const gastosPagina = window._paginacionGastosManager.obtenerRegistrosPagina();
  console.log(`📄 Gastos de la página actual: ${gastosPagina.length}`);

  if (gastosPagina.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    <i class="fas fa-inbox"></i> No hay gastos
                </td>
            </tr>
        `;
    document.getElementById('paginacionGastos').innerHTML = '';
    return;
  }

  tbody.innerHTML = gastosPagina
    .map(gasto => {
      const evidenciaCount = gasto.evidencia ? gasto.evidencia.length : 0;
      const evidenciaBadge =
        evidenciaCount > 0
          ? `<span class="badge bg-success">${evidenciaCount} archivo${evidenciaCount > 1 ? 's' : ''}</span>`
          : '<span class="badge bg-secondary">Sin evidencia</span>';

      const esDeTrafico = gasto.origen === 'trafico';
      const origenBadge = esDeTrafico
        ? '<span class="badge bg-warning text-dark ms-1">Tráfico</span>'
        : '';

      // Normalizar campos para compatibilidad
      const operadorNombre = gasto.operadorNombre || gasto.operador || 'N/A';
      const tipoGasto = gasto.tipoGasto || gasto.motivo || 'N/A';
      const monto = gasto.monto || 0;

      // Limpiar nombre del operador (remover licencia si viene en formato "Nombre - Licencia")
      let operadorNombreLimpio = operadorNombre;
      if (operadorNombreLimpio.includes(' - ')) {
        operadorNombreLimpio = operadorNombreLimpio.split(' - ')[0].trim();
      }

      // Limpiar tractocamión (remover placa duplicada si viene en formato "102- Nombre (Placa) - Placa")
      let tractocamionTexto = gasto.economico || gasto.tractocamionInfo || gasto.tractocamion || '';
      if (tractocamionTexto) {
        // Si tiene formato "XXX - YYY - ZZZ", tomar solo "XXX - YYY" (remover la última parte duplicada)
        const partes = tractocamionTexto.split(' - ');
        if (partes.length >= 3) {
          // Si hay 3 o más partes, tomar solo las primeras 2
          tractocamionTexto = partes.slice(0, 2).join(' - ').trim();
        } else if (partes.length === 2) {
          // Si hay 2 partes, verificar si la segunda parte es igual a una placa al final de la primera
          const primeraParte = partes[0].trim();
          const segundaParte = partes[1].trim();
          // Si la primera parte termina con la segunda parte entre paréntesis, solo mostrar la primera
          if (primeraParte.includes(`(${segundaParte})`)) {
            tractocamionTexto = primeraParte;
          }
        }
      }

      const tractocamion = tractocamionTexto
        ? `<span class="badge bg-primary">${tractocamionTexto}</span>`
        : '<span class="badge bg-secondary">Sin asignar</span>';

      // Botón de editar solo para registros que NO vienen de tráfico
      // Usar el ID del documento de Firebase si está disponible, sino usar el campo id del objeto
      const gastoIdParaEditar = gasto.id || gasto.gastoId || String(gasto.id || '');
      const botonEditar = !esDeTrafico
        ? `
                        <button class="btn btn-sm btn-outline-warning" onclick="editarGasto('${gastoIdParaEditar}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
        `
        : '';

      return `
            <tr>
                <td>${formatearFecha(gasto.fecha || gasto.fechaCreacion)}</td>
                <td>${gasto.numeroRegistro || 'N/A'}</td>
                <td>${operadorNombreLimpio}</td>
                <td>${tractocamion}</td>
                <td><span class="badge bg-info">${tipoGasto}</span>${origenBadge}</td>
                <td>$${monto.toFixed(2)}</td>
                <td>${evidenciaBadge}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="verDetalleGasto('${gasto.id}')" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${botonEditar}
                        <button class="btn btn-sm btn-outline-danger" onclick="descargarPDFGasto('${gasto.id}')" title="Descargar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarGasto('${gasto.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    })
    .join('');

  console.log(`✅ ${gastosPagina.length} gastos renderizados en la tabla`);

  // Mostrar controles de paginación
  const contenedorPaginacion = document.getElementById('paginacionGastos');
  if (contenedorPaginacion && window._paginacionGastosManager) {
    contenedorPaginacion.innerHTML = window._paginacionGastosManager.generarControlesPaginacion(
      'paginacionGastos',
      'cambiarPaginaGastos'
    );
  }

  console.log(
    `✅ ${window._paginacionGastosManager.totalRegistros} gastos cargados (página ${window._paginacionGastosManager.paginaActual} de ${window._paginacionGastosManager.obtenerTotalPaginas()})`
  );
}

// Función para cambiar de página
window.cambiarPaginaGastos = function (accion) {
  if (!window._paginacionGastosManager) {
    console.warn('⚠️ window._paginacionGastosManager no está disponible');
    return;
  }

  let cambioExitoso = false;

  if (accion === 'anterior') {
    cambioExitoso = window._paginacionGastosManager.paginaAnterior();
  } else if (accion === 'siguiente') {
    cambioExitoso = window._paginacionGastosManager.paginaSiguiente();
  } else if (typeof accion === 'number') {
    cambioExitoso = window._paginacionGastosManager.irAPagina(accion);
  }

  if (cambioExitoso) {
    renderizarGastos();
    // Scroll suave hacia la tabla
    const tabla = document.getElementById('gastosTable');
    if (tabla) {
      tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

// Cargar opciones de filtros
window.cargarOpcionesFiltrosGastos = async function () {
  const gastos = await window.operadoresManager.getGastos();

  // Cargar operadores únicos - limpiar formato "Nombre - Licencia" para mostrar solo el nombre
  const operadoresUnicos = [
    ...new Set(
      gastos
        .map(gasto => {
          if (!gasto.operadorNombre) {
            return null;
          }
          // Si tiene formato "Nombre - Licencia", tomar solo el nombre
          if (gasto.operadorNombre.includes(' - ')) {
            return gasto.operadorNombre.split(' - ')[0].trim();
          }
          return gasto.operadorNombre;
        })
        .filter(op => op)
    )
  ];
  const selectOperador = document.getElementById('filtroOperadorGastos');
  if (selectOperador) {
    selectOperador.innerHTML = '<option value="">Todos los operadores</option>';
    operadoresUnicos.sort().forEach(operador => {
      const option = document.createElement('option');
      option.value = operador;
      option.textContent = operador;
      selectOperador.appendChild(option);
    });
  }

  // Cargar tractocamiones únicos - buscar en múltiples campos y también desde configuración
  const tractocamionesDeGastos = new Set();
  gastos.forEach(gasto => {
    // Buscar en múltiples campos
    const tractocamion =
      gasto.economico || gasto.tractocamionInfo || gasto.tractocamion || gasto.numeroEconomico;
    if (tractocamion) {
      // Si tiene formato "550 - ABC-123", tomar solo el número
      if (tractocamion.includes(' - ')) {
        tractocamionesDeGastos.add(tractocamion.split(' - ')[0].trim());
      } else {
        tractocamionesDeGastos.add(tractocamion);
      }
    }
  });

  // También cargar desde configuración
  const tractocamionesDeConfig = [];
  if (window.configuracionManager) {
    try {
      const economicosData = window.configuracionManager.getAllEconomicos();
      if (Array.isArray(economicosData) && economicosData.length > 0) {
        economicosData.forEach(eco => {
          const numero = eco.numero || eco.economico || eco.id || '';
          if (numero) {
            tractocamionesDeConfig.push(String(numero));
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Error cargando tractocamiones desde configuración:', error);
    }
  }

  // Combinar ambos conjuntos
  const tractocamionesUnicos = [...new Set([...tractocamionesDeGastos, ...tractocamionesDeConfig])];
  const selectTractocamion = document.getElementById('filtroTractocamionGastos');
  if (selectTractocamion) {
    selectTractocamion.innerHTML = '<option value="">Todos los tractocamiones</option>';
    tractocamionesUnicos.sort().forEach(tractocamion => {
      const option = document.createElement('option');
      option.value = tractocamion;
      option.textContent = tractocamion;
      selectTractocamion.appendChild(option);
    });
  }

  // Cargar todos los tipos de gastos disponibles (no solo los que están en los gastos)
  const tiposDisponibles = [
    'combustible',
    'alimentacion',
    'hospedaje',
    'peaje',
    'mantenimiento',
    'otros',
    'Viáticos',
    'Destajos',
    'Talachas',
    'Multas',
    'Ajustes'
  ];

  // También incluir tipos que ya están en los gastos pero no están en la lista
  const tiposDeGastos = [...new Set(gastos.map(gasto => gasto.tipoGasto).filter(tipo => tipo))];
  tiposDeGastos.forEach(tipo => {
    if (!tiposDisponibles.includes(tipo)) {
      tiposDisponibles.push(tipo);
    }
  });

  const selectTipo = document.getElementById('filtroTipoGastos');
  if (selectTipo) {
    selectTipo.innerHTML = '<option value="">Todos los tipos</option>';
    tiposDisponibles.sort().forEach(tipo => {
      const option = document.createElement('option');
      option.value = tipo;
      option.textContent = tipo;
      selectTipo.appendChild(option);
    });
  }
};

// Aplicar filtros a los gastos
window.aplicarFiltrosGastos = async function () {
  const filtroOperador = document.getElementById('filtroOperadorGastos')?.value || '';
  const filtroTractocamion = document.getElementById('filtroTractocamionGastos')?.value || '';
  const filtroTipo = document.getElementById('filtroTipoGastos')?.value || '';
  const filtroFecha = document.getElementById('filtroFechaGastos')?.value || '';

  const gastos = await window.operadoresManager.getGastos();
  const tbody = document.getElementById('gastosTableBody');
  if (!tbody) {
    return;
  }

  // Filtrar gastos
  const gastosFiltrados = gastos.filter(gasto => {
    // Filtrar por operador - comparar solo el nombre (antes del " - ")
    let cumpleOperador = true;
    if (filtroOperador) {
      const nombreGasto = gasto.operadorNombre || '';
      const nombreLimpio = nombreGasto.includes(' - ')
        ? nombreGasto.split(' - ')[0].trim()
        : nombreGasto;
      cumpleOperador = nombreLimpio === filtroOperador;
    }

    // Filtrar por tractocamion - buscar en múltiples campos
    let cumpleTractocamion = true;
    if (filtroTractocamion) {
      const tractocamionGasto =
        gasto.economico ||
        gasto.tractocamionInfo ||
        gasto.tractocamion ||
        gasto.numeroEconomico ||
        '';
      let tractocamionLimpio = tractocamionGasto;
      if (tractocamionGasto.includes(' - ')) {
        tractocamionLimpio = tractocamionGasto.split(' - ')[0].trim();
      }
      cumpleTractocamion = tractocamionLimpio === filtroTractocamion;
    }

    const cumpleTipo = !filtroTipo || gasto.tipoGasto === filtroTipo;
    const cumpleFecha = !filtroFecha || gasto.fecha.startsWith(filtroFecha);

    return cumpleOperador && cumpleTractocamion && cumpleTipo && cumpleFecha;
  });

  // Ordenar gastos filtrados por fecha descendente (más recientes primero)
  const gastosOrdenados = gastosFiltrados.sort((a, b) => {
    const fechaA = new Date(a.fecha || a.fechaCreacion || a.fechaActualizacion || 0);
    const fechaB = new Date(b.fecha || b.fechaCreacion || b.fechaActualizacion || 0);
    return fechaB - fechaA; // Orden descendente (más recientes primero)
  });

  // Actualizar gastos completos con los filtrados
  window._gastosCompletos = gastosOrdenados;

  // Limpiar tabla
  tbody.innerHTML = '';

  if (gastosOrdenados.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center text-muted">No se encontraron gastos con los filtros aplicados</td></tr>';
    document.getElementById('paginacionGastos').innerHTML = '';
    return;
  }

  // Inicializar paginación con gastos filtrados
  const PaginacionManagerClass =
    typeof PaginacionManager !== 'undefined'
      ? PaginacionManager
      : typeof window.PaginacionManager !== 'undefined'
        ? window.PaginacionManager
        : null;

  if (!PaginacionManagerClass) {
    console.warn(
      '⚠️ PaginacionManager no está disponible, mostrando todos los gastos sin paginación'
    );
    // Mostrar todos los gastos filtrados sin paginación
    gastosOrdenados.forEach(gasto => {
      const tr = document.createElement('tr');
      const evidenciaCount = gasto.evidencia ? gasto.evidencia.length : 0;
      const evidenciaBadge =
        evidenciaCount > 0
          ? `<span class="badge bg-success">${evidenciaCount} archivo${evidenciaCount > 1 ? 's' : ''}</span>`
          : '<span class="badge bg-secondary">Sin evidencia</span>';

      // Determinar si el gasto viene de tráfico
      const esDeTrafico = gasto.origen === 'trafico';
      const origenBadge = esDeTrafico
        ? '<span class="badge bg-warning text-dark ms-1">Tráfico</span>'
        : '';

      // Limpiar nombre del operador (remover licencia si viene en formato "Nombre - Licencia")
      let operadorNombreLimpio = gasto.operadorNombre || 'N/A';
      if (operadorNombreLimpio.includes(' - ')) {
        operadorNombreLimpio = operadorNombreLimpio.split(' - ')[0].trim();
      }

      // Limpiar tractocamión (remover placa duplicada si viene en formato "102- Nombre (Placa) - Placa")
      let tractocamionLimpio =
        gasto.economico || gasto.tractocamionInfo || gasto.tractocamion || '';
      if (tractocamionLimpio) {
        // Si tiene formato "XXX - YYY - ZZZ", tomar solo "XXX - YYY" (remover la última parte duplicada)
        const partes = tractocamionLimpio.split(' - ');
        if (partes.length >= 3) {
          // Si hay 3 o más partes, tomar solo las primeras 2
          tractocamionLimpio = partes.slice(0, 2).join(' - ').trim();
        } else if (partes.length === 2) {
          // Si hay 2 partes, verificar si la segunda parte es igual a una placa al final de la primera
          const primeraParte = partes[0].trim();
          const segundaParte = partes[1].trim();
          // Si la primera parte termina con la segunda parte entre paréntesis, solo mostrar la primera
          if (primeraParte.includes(`(${segundaParte})`)) {
            tractocamionLimpio = primeraParte;
          } else {
            tractocamionLimpio = tractocamionLimpio;
          }
        }
      }

      // Mostrar tractocamión o "Sin asignar"
      const tractocamion = tractocamionLimpio
        ? `<span class="badge bg-primary">${tractocamionLimpio}</span>`
        : '<span class="badge bg-secondary">Sin asignar</span>';

      tr.innerHTML = `
            <td>${formatearFecha(gasto.fecha)}</td>
            <td>${gasto.numeroRegistro || 'N/A'}</td>
            <td>${operadorNombreLimpio}</td>
            <td>${tractocamion}</td>
            <td><span class="badge bg-info">${gasto.tipoGasto}</span>${origenBadge}</td>
            <td>$${gasto.monto.toFixed(2)}</td>
            <td>${evidenciaBadge}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="verDetalleGasto('${gasto.id}')" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="descargarPDFGasto('${gasto.id}')" title="Descargar PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarGasto('${gasto.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
      tbody.appendChild(tr);
    });
    document.getElementById('paginacionGastos').innerHTML = '';
    return;
  }

  if (!window._paginacionGastosManager) {
    try {
      window._paginacionGastosManager = new PaginacionManagerClass();
      console.log('✅ Nueva instancia de PaginacionManager creada para gastos (filtros)');
    } catch (error) {
      console.error('❌ Error creando instancia de PaginacionManager:', error);
      return;
    }
  }

  try {
    window._paginacionGastosManager.inicializar(gastosOrdenados, 15);
    window._paginacionGastosManager.paginaActual = 1;
    console.log(
      `✅ Paginación inicializada con filtros: ${window._paginacionGastosManager.totalRegistros} gastos, ${window._paginacionGastosManager.obtenerTotalPaginas()} páginas`
    );
    renderizarGastos();
  } catch (error) {
    console.error('❌ Error al inicializar paginación:', error);
  }
};

// Limpiar filtros
window.limpiarFiltrosGastos = function () {
  document.getElementById('filtroOperadorGastos').value = '';
  document.getElementById('filtroTractocamionGastos').value = '';
  document.getElementById('filtroTipoGastos').value = '';
  document.getElementById('filtroFechaGastos').value = '';

  // Recargar tabla sin filtros
  window.cargarGastos();
};

// Variable global para almacenar todas las incidencias sin filtrar
window._incidenciasCompletas = [];

// Cargar incidencias en la tabla
window.cargarIncidencias = async function () {
  const tbody = document.getElementById('incidenciasTableBody');
  if (!tbody) {
    return;
  }

  tbody.innerHTML =
    '<tr><td colspan="7" class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

  const incidencias = await window.operadoresManager.getIncidencias();

  // Guardar incidencias completas para filtrado
  window._incidenciasCompletas = incidencias;

  // Ordenar incidencias por fecha descendente (más recientes primero)
  const incidenciasOrdenadas = incidencias.sort((a, b) => {
    const fechaA = new Date(a.fecha || a.fechaCreacion || 0);
    const fechaB = new Date(b.fecha || b.fechaCreacion || 0);
    return fechaB - fechaA; // Orden descendente
  });

  tbody.innerHTML = '';

  if (incidenciasOrdenadas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Sin registros</td></tr>';
    document.getElementById('paginacionIncidencias').innerHTML = '';
    return;
  }

  // Inicializar paginación
  const PaginacionManagerClass =
    typeof PaginacionManager !== 'undefined'
      ? PaginacionManager
      : typeof window.PaginacionManager !== 'undefined'
        ? window.PaginacionManager
        : null;

  if (!PaginacionManagerClass) {
    console.warn(
      '⚠️ PaginacionManager no está disponible, mostrando todas las incidencias sin paginación'
    );
    // Mostrar todas las incidencias sin paginación
    incidenciasOrdenadas.forEach(incidencia => {
      const tr = document.createElement('tr');
      const severidadClass =
        {
          baja: 'bg-success',
          media: 'bg-warning',
          alta: 'bg-danger',
          critica: 'bg-dark'
        }[incidencia.severidad] || 'bg-secondary';

      const evidenciaCount = incidencia.evidencia ? incidencia.evidencia.length : 0;
      const evidenciaBadge =
        evidenciaCount > 0
          ? `<span class="badge bg-success">${evidenciaCount} archivo${evidenciaCount > 1 ? 's' : ''}</span>`
          : '<span class="badge bg-secondary">Sin evidencia</span>';

      // Limpiar nombre del operador (remover licencia si viene en formato "Nombre - Licencia")
      let operadorNombreLimpio = incidencia.operadorNombre || 'N/A';
      if (operadorNombreLimpio.includes(' - ')) {
        operadorNombreLimpio = operadorNombreLimpio.split(' - ')[0].trim();
      }

      tr.innerHTML = `
                <td>${formatearFecha(incidencia.fecha)}</td>
                <td>${incidencia.numeroRegistro || 'N/A'}</td>
                <td>${operadorNombreLimpio}</td>
                <td><span class="badge bg-info">${incidencia.tipoIncidencia}</span></td>
                <td><span class="badge ${severidadClass}">${incidencia.severidad}</span></td>
                <td>${evidenciaBadge}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="verDetalleIncidencia('${incidencia.id}')" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="descargarPDFIncidencia('${incidencia.id}')" title="Descargar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarIncidencia('${incidencia.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
      tbody.appendChild(tr);
    });
    document.getElementById('paginacionIncidencias').innerHTML = '';
    window.cargarOpcionesFiltrosIncidencias();
    return;
  }

  if (!window._paginacionIncidenciasManager) {
    try {
      window._paginacionIncidenciasManager = new PaginacionManagerClass();
      console.log('✅ Nueva instancia de PaginacionManager creada para incidencias');
    } catch (error) {
      console.error('❌ Error creando instancia de PaginacionManager:', error);
      return;
    }
  }

  try {
    window._paginacionIncidenciasManager.inicializar(incidenciasOrdenadas, 15);
    window._paginacionIncidenciasManager.paginaActual = 1;
    console.log(
      `✅ Paginación inicializada: ${window._paginacionIncidenciasManager.totalRegistros} incidencias, ${window._paginacionIncidenciasManager.obtenerTotalPaginas()} páginas`
    );
    renderizarIncidencias();
  } catch (error) {
    console.error('❌ Error al inicializar paginación:', error);
  }

  // Cargar opciones de filtros después de cargar las incidencias
  window.cargarOpcionesFiltrosIncidencias();
};

// Función para renderizar las incidencias de la página actual
function renderizarIncidencias() {
  const tbody = document.getElementById('incidenciasTableBody');
  if (!tbody || !window._paginacionIncidenciasManager || !window._incidenciasCompletas) {
    console.warn(
      '⚠️ No se puede renderizar: tbody=',
      Boolean(tbody),
      'paginacion=',
      Boolean(window._paginacionIncidenciasManager),
      'incidencias=',
      Boolean(window._incidenciasCompletas)
    );
    return;
  }

  const incidenciasPagina = window._paginacionIncidenciasManager.obtenerRegistrosPagina();

  if (incidenciasPagina.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="fas fa-inbox"></i> No hay incidencias
                </td>
            </tr>
        `;
    document.getElementById('paginacionIncidencias').innerHTML = '';
    return;
  }

  tbody.innerHTML = incidenciasPagina
    .map(incidencia => {
      const severidadClass =
        {
          baja: 'bg-success',
          media: 'bg-warning',
          alta: 'bg-danger',
          critica: 'bg-dark'
        }[incidencia.severidad] || 'bg-secondary';

      const evidenciaCount = incidencia.evidencia ? incidencia.evidencia.length : 0;
      const evidenciaBadge =
        evidenciaCount > 0
          ? `<span class="badge bg-success">${evidenciaCount} archivo${evidenciaCount > 1 ? 's' : ''}</span>`
          : '<span class="badge bg-secondary">Sin evidencia</span>';

      // Limpiar nombre del operador (remover licencia si viene en formato "Nombre - Licencia")
      let operadorNombreLimpio = incidencia.operadorNombre || 'N/A';
      if (operadorNombreLimpio.includes(' - ')) {
        operadorNombreLimpio = operadorNombreLimpio.split(' - ')[0].trim();
      }

      // ID para editar
      const incidenciaIdParaEditar =
        incidencia.id || incidencia.incidenciaId || String(incidencia.id || '');

      return `
            <tr>
                <td>${formatearFecha(incidencia.fecha)}</td>
                <td>${incidencia.numeroRegistro || 'N/A'}</td>
                <td>${operadorNombreLimpio}</td>
                <td><span class="badge bg-info">${incidencia.tipoIncidencia}</span></td>
                <td><span class="badge ${severidadClass}">${incidencia.severidad}</span></td>
                <td>${evidenciaBadge}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="verDetalleIncidencia('${incidencia.id}')" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="editarIncidencia('${incidenciaIdParaEditar}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="descargarPDFIncidencia('${incidencia.id}')" title="Descargar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarIncidencia('${incidencia.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    })
    .join('');

  // Mostrar controles de paginación
  const contenedorPaginacion = document.getElementById('paginacionIncidencias');
  if (contenedorPaginacion && window._paginacionIncidenciasManager) {
    contenedorPaginacion.innerHTML =
      window._paginacionIncidenciasManager.generarControlesPaginacion(
        'paginacionIncidencias',
        'cambiarPaginaIncidencias'
      );
  }

  console.log(
    `✅ ${window._paginacionIncidenciasManager.totalRegistros} incidencias cargadas (página ${window._paginacionIncidenciasManager.paginaActual} de ${window._paginacionIncidenciasManager.obtenerTotalPaginas()})`
  );
}

// Función para cambiar de página
window.cambiarPaginaIncidencias = function (accion) {
  if (!window._paginacionIncidenciasManager) {
    console.warn('⚠️ window._paginacionIncidenciasManager no está disponible');
    return;
  }

  let cambioExitoso = false;

  if (accion === 'anterior') {
    cambioExitoso = window._paginacionIncidenciasManager.paginaAnterior();
  } else if (accion === 'siguiente') {
    cambioExitoso = window._paginacionIncidenciasManager.paginaSiguiente();
  } else if (typeof accion === 'number') {
    cambioExitoso = window._paginacionIncidenciasManager.irAPagina(accion);
  }

  if (cambioExitoso) {
    renderizarIncidencias();
    // Scroll suave hacia la tabla
    const tabla = document.getElementById('incidenciasTableBody');
    if (tabla && tabla.closest('.table-responsive')) {
      tabla.closest('.table-responsive').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

// Eliminar gasto
window.eliminarGasto = function (id) {
  if (confirm('¿Está seguro de eliminar este gasto?')) {
    const success = window.operadoresManager.deleteGasto(id);
    if (success) {
      showNotification('Gasto eliminado exitosamente', 'success');
      cargarGastos();
    } else {
      showNotification('Error al eliminar gasto', 'error');
    }
  }
};

// Eliminar incidencia
window.eliminarIncidencia = function (id) {
  if (confirm('¿Está seguro de eliminar esta incidencia?')) {
    const success = window.operadoresManager.deleteIncidencia(id);
    if (success) {
      showNotification('Incidencia eliminada exitosamente', 'success');
      cargarIncidencias();
    } else {
      showNotification('Error al eliminar incidencia', 'error');
    }
  }
};

// Ver detalle de gasto
// Función para normalizar el tipo de gasto (mapear valores antiguos a nuevos)
function normalizarTipoGasto(tipoGasto) {
  if (!tipoGasto) {
    return '';
  }

  const tipoGastoLower = tipoGasto.toLowerCase().trim();

  // Mapeo de valores antiguos (minúsculas) a valores del select de editar (con mayúscula inicial)
  const mapeo = {
    combustible: 'Combustible',
    alimentacion: 'Alimentos',
    alimentos: 'Alimentos',
    hospedaje: 'Hospedaje',
    peaje: 'Peaje',
    mantenimiento: 'Reparación',
    reparación: 'Reparación',
    reparacion: 'Reparación',
    estacionamiento: 'Estacionamiento',
    otros: 'Otro',
    otro: 'Otro'
  };

  // Si hay un mapeo directo, usarlo
  if (mapeo[tipoGastoLower]) {
    return mapeo[tipoGastoLower];
  }

  // Si el valor ya está en el formato correcto (con mayúscula inicial), devolverlo tal cual
  // Verificar si coincide con alguna opción del select (case-insensitive)
  const opcionesSelect = [
    'Combustible',
    'Alimentos',
    'Hospedaje',
    'Peaje',
    'Estacionamiento',
    'Reparación',
    'Otro'
  ];
  const opcionEncontrada = opcionesSelect.find(opt => opt.toLowerCase() === tipoGastoLower);
  if (opcionEncontrada) {
    return opcionEncontrada;
  }

  // Si no hay coincidencia, devolver el valor original (puede que ya esté en el formato correcto)
  return tipoGasto;
}

// Función para editar un gasto
window.editarGasto = async function (id) {
  console.log('✏️ Editando gasto:', id);
  console.log('🔍 Tipo de ID recibido:', typeof id, 'Valor:', id);

  try {
    // Obtener el gasto - buscar de manera flexible por diferentes formatos de ID
    const gastos = await window.operadoresManager.getGastos();
    console.log(`📋 Total de gastos cargados: ${gastos.length}`);
    console.log(
      '🔍 IDs de gastos disponibles:',
      gastos.slice(0, 5).map(g => ({ id: g.id, gastoId: g.gastoId, tipo: typeof g.id }))
    );

    // Buscar el gasto por múltiples campos de ID posibles
    const idString = String(id);
    const idNumber = parseInt(id, 10);

    const gasto = gastos.find(g => {
      // Buscar en múltiples campos posibles de ID
      const gId = g.id || g.gastoId;
      if (!gId) {
        return false;
      }

      const gIdString = String(gId);
      const gIdNumber = parseInt(gId, 10);

      // Comparar de múltiples formas
      return (
        gIdString === idString ||
        gIdString === String(id) ||
        gId === id ||
        gIdNumber === idNumber ||
        gIdNumber === id ||
        gId === idNumber ||
        String(gIdNumber) === idString ||
        String(gIdNumber) === String(id)
      );
    });

    // Si no se encuentra, intentar buscar también en los IDs de los documentos de Firebase
    // (que pueden tener formato diferente como "gasto_123456")
    if (!gasto) {
      const gastoAlternativo = gastos.find(g => {
        const gId = g.id || g.gastoId;
        if (!gId) {
          return false;
        }

        // Buscar si el ID contiene el número buscado
        const gIdString = String(gId);
        const idString = String(id);
        const idNumber = parseInt(id, 10);

        // Verificar si el ID termina con el número buscado o si contiene el número
        return (
          gIdString.endsWith(idString) ||
          gIdString.includes(idString) ||
          gIdString.replace(/^gasto_/, '') === idString ||
          gIdString.replace(/^gasto_/, '') === String(id) ||
          parseInt(gIdString.replace(/^gasto_/, ''), 10) === idNumber ||
          parseInt(gIdString, 10) === idNumber
        );
      });

      if (gastoAlternativo) {
        console.log('✅ Gasto encontrado con búsqueda alternativa:', gastoAlternativo);
        // Usar el gasto alternativo encontrado
        const gastoFinal = gastoAlternativo;

        // Continuar con el código de llenado del formulario
        console.log('✅ Gasto encontrado:', gastoFinal);

        // Verificar que no sea de tráfico
        if (gastoFinal.origen === 'trafico') {
          showNotification(
            'Los gastos de tráfico deben editarse desde la hoja de tráfico',
            'warning'
          );
          return;
        }

        // Llenar el formulario del modal
        document.getElementById('editarGasto_id').value = gastoFinal.id || gastoFinal.gastoId || id;
        document.getElementById('editarGasto_numeroRegistro').value =
          gastoFinal.numeroRegistro || '';
        document.getElementById('editarGasto_fecha').value = gastoFinal.fecha
          ? gastoFinal.fecha.split('T')[0]
          : '';
        document.getElementById('editarGasto_tipoGasto').value = gastoFinal.tipoGasto || '';
        document.getElementById('editarGasto_monto').value = gastoFinal.monto || '';
        document.getElementById('editarGasto_concepto').value = gastoFinal.concepto || '';
        document.getElementById('editarGasto_observaciones').value = gastoFinal.observaciones || '';

        // Llenar operador
        const operadorNombre = gastoFinal.operadorNombre || '';
        const operadorInput = document.getElementById('editarGasto_operador');
        const operadorHidden = document.getElementById('editarGasto_operador_value');
        if (operadorInput) {
          operadorInput.value = operadorNombre;
          if (operadorHidden) {
            operadorHidden.value = operadorNombre;
          }
        }

        // Llenar tractocamión
        const tractocamionTexto =
          gastoFinal.economico || gastoFinal.tractocamionInfo || gastoFinal.tractocamion || '';
        const tractocamionInput = document.getElementById('editarGasto_tractocamion');
        const tractocamionHidden = document.getElementById('editarGasto_tractocamion_value');
        if (tractocamionInput) {
          tractocamionInput.value = tractocamionTexto;
          if (tractocamionHidden) {
            tractocamionHidden.value = tractocamionTexto;
          }
        }

        // Mostrar evidencia existente
        const evidenciaContainer = document.getElementById('editarGasto_evidencia_existente');
        if (evidenciaContainer && gastoFinal.evidencia && gastoFinal.evidencia.length > 0) {
          evidenciaContainer.innerHTML = `
                        <div class="alert alert-info">
                            <strong>Evidencia actual:</strong>
                            <ul class="mb-0 mt-2">
                                ${gastoFinal.evidencia
    .map(
      (ev, idx) => `
                                    <li>${ev.nombre || `Archivo ${idx + 1}`} 
                                        <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="eliminarEvidenciaExistente('${gastoFinal.id || id}', ${idx})" title="Eliminar">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </li>
                                `
    )
    .join('')}
                            </ul>
                            <small class="text-muted">Puede agregar nuevos archivos o eliminar los existentes</small>
                        </div>
                    `;
        } else if (evidenciaContainer) {
          evidenciaContainer.innerHTML = '';
        }

        // Guardar evidencia existente en una variable global para el guardado
        window._evidenciaExistenteGasto = gastoFinal.evidencia || [];

        // Abrir el modal
        const modal = new bootstrap.Modal(document.getElementById('modalEditarGasto'));
        modal.show();

        return;
      }
    }

    if (!gasto) {
      console.error(`❌ Gasto no encontrado con ID: ${id}`);
      console.log(
        '📋 IDs disponibles en gastos:',
        gastos
          .map(g => ({
            id: g.id,
            gastoId: g.gastoId,
            idString: String(g.id || g.gastoId || 'sin id'),
            tipo: typeof g.id
          }))
          .slice(0, 10)
      );
      showNotification(`Gasto no encontrado con ID: ${id}. Por favor recarga la página.`, 'error');
      return;
    }

    // Si llegamos aquí, el gasto fue encontrado en la búsqueda principal
    const gastoFinal = gasto;
    console.log('✅ Gasto encontrado:', gastoFinal);

    // Verificar que no sea de tráfico
    if (gastoFinal.origen === 'trafico') {
      showNotification('Los gastos de tráfico deben editarse desde la hoja de tráfico', 'warning');
      return;
    }

    // Llenar el formulario del modal
    document.getElementById('editarGasto_id').value = gastoFinal.id || gastoFinal.gastoId || id;
    document.getElementById('editarGasto_numeroRegistro').value = gastoFinal.numeroRegistro || '';
    document.getElementById('editarGasto_fecha').value = gastoFinal.fecha
      ? gastoFinal.fecha.split('T')[0]
      : '';

    // Normalizar tipo de gasto para que coincida con las opciones del select
    const tipoGastoRaw = gastoFinal.tipoGasto || '';
    const tipoGastoNormalizado = normalizarTipoGasto(tipoGastoRaw);
    const tipoGastoSelect = document.getElementById('editarGasto_tipoGasto');
    if (tipoGastoSelect) {
      tipoGastoSelect.value = tipoGastoNormalizado;
      // Si no se encontró coincidencia exacta, intentar búsqueda case-insensitive
      if (!tipoGastoSelect.value && tipoGastoRaw) {
        const opciones = Array.from(tipoGastoSelect.options);
        const opcionEncontrada = opciones.find(
          opt =>
            opt.value.toLowerCase() === tipoGastoRaw.toLowerCase() ||
            opt.textContent.toLowerCase() === tipoGastoRaw.toLowerCase()
        );
        if (opcionEncontrada) {
          tipoGastoSelect.value = opcionEncontrada.value;
        }
      }
    }

    document.getElementById('editarGasto_monto').value = gastoFinal.monto || '';
    document.getElementById('editarGasto_concepto').value = gastoFinal.concepto || '';
    document.getElementById('editarGasto_observaciones').value = gastoFinal.observaciones || '';

    // Llenar operador
    const operadorNombre = gastoFinal.operadorNombre || '';
    const operadorInput = document.getElementById('editarGasto_operador');
    const operadorHidden = document.getElementById('editarGasto_operador_value');
    if (operadorInput) {
      operadorInput.value = operadorNombre;
      if (operadorHidden) {
        operadorHidden.value = operadorNombre;
      }
    }

    // Llenar tractocamión
    const tractocamionTexto =
      gastoFinal.economico || gastoFinal.tractocamionInfo || gastoFinal.tractocamion || '';
    const tractocamionInput = document.getElementById('editarGasto_tractocamion');
    const tractocamionHidden = document.getElementById('editarGasto_tractocamion_value');
    if (tractocamionInput) {
      tractocamionInput.value = tractocamionTexto;
      if (tractocamionHidden) {
        tractocamionHidden.value = tractocamionTexto;
      }
    }

    // Mostrar evidencia existente
    const evidenciaContainer = document.getElementById('editarGasto_evidencia_existente');
    if (evidenciaContainer && gastoFinal.evidencia && gastoFinal.evidencia.length > 0) {
      evidenciaContainer.innerHTML = `
                <div class="alert alert-info">
                    <strong>Evidencia actual:</strong>
                    <ul class="mb-0 mt-2">
                        ${gastoFinal.evidencia
    .map(
      (ev, idx) => `
                            <li>${ev.nombre || `Archivo ${idx + 1}`} 
                                <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="eliminarEvidenciaExistente('${gastoFinal.id || id}', ${idx})" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </li>
                        `
    )
    .join('')}
                    </ul>
                    <small class="text-muted">Puede agregar nuevos archivos o eliminar los existentes</small>
                </div>
            `;
    } else if (evidenciaContainer) {
      evidenciaContainer.innerHTML = '';
    }

    // Guardar evidencia existente en una variable global para el guardado
    window._evidenciaExistenteGasto = gastoFinal.evidencia || [];

    // Abrir el modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditarGasto'));
    modal.show();
  } catch (error) {
    console.error('❌ Error editando gasto:', error);
    showNotification('Error al cargar el gasto para editar', 'error');
  }
};

// Función para eliminar evidencia existente
window.eliminarEvidenciaExistente = function (gastoId, indice) {
  if (window._evidenciaExistenteGasto && window._evidenciaExistenteGasto[indice]) {
    window._evidenciaExistenteGasto.splice(indice, 1);
    // Recargar la lista de evidencia
    const gastos = window._gastosCompletos || [];
    const gasto = gastos.find(g => g.id === gastoId);
    if (gasto) {
      gasto.evidencia = window._evidenciaExistenteGasto;
      window.editarGasto(gastoId);
    }
  }
};

// Función para guardar el gasto editado
window.guardarGastoEditado = async function () {
  console.log('💾 Guardando gasto editado...');

  const form = document.getElementById('formEditarGasto');
  if (!form) {
    showNotification('Formulario no encontrado', 'error');
    return;
  }

  // Validar formulario
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    showNotification('Por favor complete todos los campos requeridos', 'error');
    return;
  }

  try {
    const gastoId = document.getElementById('editarGasto_id').value;
    if (!gastoId) {
      showNotification('ID de gasto no encontrado', 'error');
      return;
    }

    // Obtener datos del formulario
    const numeroRegistro = document.getElementById('editarGasto_numeroRegistro').value;
    const fecha = document.getElementById('editarGasto_fecha').value;
    const operadorNombre =
      document.getElementById('editarGasto_operador_value').value ||
      document.getElementById('editarGasto_operador').value;
    const tractocamionInfo =
      document.getElementById('editarGasto_tractocamion_value').value ||
      document.getElementById('editarGasto_tractocamion').value;

    // Extraer placas del tractocamion del formato "económico - placas" o "101- Kenworth T680 (23-ABC-7)"
    let tractocamionPlacas = '';
    let tractocamionEconomico = '';

    if (tractocamionInfo) {
      // Formato 1: "101- Kenworth T680 (23-ABC-7)" - extraer placas de paréntesis
      const matchConParentesis = tractocamionInfo.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (matchConParentesis) {
        tractocamionEconomico = matchConParentesis[1].trim(); // "101- Kenworth T680"
        tractocamionPlacas = matchConParentesis[2].trim(); // "23-ABC-7"
      }
      // Formato 2: "económico - placas" (formato anterior)
      else if (tractocamionInfo.includes(' - ')) {
        const partes = tractocamionInfo.split(' - ');
        tractocamionEconomico = partes[0]?.trim() || '';
        tractocamionPlacas = partes[1]?.trim() || '';
      }
      // Formato 3: Solo económico
      else {
        tractocamionEconomico = tractocamionInfo.trim();
      }
    }

    const tipoGasto = document.getElementById('editarGasto_tipoGasto').value;
    const monto = parseFloat(document.getElementById('editarGasto_monto').value);
    const concepto = document.getElementById('editarGasto_concepto').value;
    const observaciones = document.getElementById('editarGasto_observaciones').value;

    // Obtener evidencia (combinar existente con nueva)
    let evidencia = window._evidenciaExistenteGasto || [];
    const archivosNuevos = document.getElementById('editarGasto_evidencia').files;
    if (archivosNuevos && archivosNuevos.length > 0) {
      const nuevasEvidencias = Array.from(archivosNuevos).map(file => ({
        nombre: file.name,
        tamaño: file.size,
        tipo: file.type,
        fecha: new Date().toISOString()
      }));
      evidencia = [...evidencia, ...nuevasEvidencias];
    }

    // Preparar datos actualizados
    const gastoActualizado = {
      numeroRegistro: numeroRegistro,
      fecha: fecha,
      operadorNombre: operadorNombre,
      tractocamionInfo: tractocamionInfo, // Información completa (para compatibilidad)
      tractocamionEconomico: tractocamionEconomico, // Número económico del tractocamion
      tractocamionPlacas: tractocamionPlacas, // Placas del tractocamion (separadas)
      economico: tractocamionInfo, // Para compatibilidad
      tipoGasto: tipoGasto,
      monto: monto,
      concepto: concepto,
      observaciones: observaciones,
      evidencia: evidencia,
      fechaActualizacion: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString()
    };

    // Determinar el ID correcto para Firebase (puede ser gasto_${id} o el id directamente)
    let firebaseGastoId = gastoId;
    // Si el ID es numérico, usar el formato gasto_${id} para Firebase
    if (!isNaN(gastoId) && !gastoId.toString().startsWith('gasto_')) {
      firebaseGastoId = `gasto_${gastoId}`;
    }

    // Guardar en Firebase primero
    if (window.firebaseRepos?.operadores) {
      try {
        await window.firebaseRepos.operadores.saveGasto(firebaseGastoId, gastoActualizado);
        console.log('✅ Gasto actualizado en Firebase con ID:', firebaseGastoId);
      } catch (error) {
        console.warn('⚠️ Error guardando en Firebase:', error);
      }
    }

    // Guardar usando operadoresManager (buscar por ID original o Firebase ID)
    let success = false;
    // Intentar actualizar con el ID original primero
    success = await window.operadoresManager.updateGasto(gastoId, gastoActualizado);

    // Si falla, intentar con el ID de Firebase
    if (!success && firebaseGastoId !== gastoId) {
      console.log('🔄 Intentando actualizar con ID de Firebase:', firebaseGastoId);
      success = await window.operadoresManager.updateGasto(firebaseGastoId, gastoActualizado);
    }

    if (success) {
      showNotification('Gasto actualizado exitosamente', 'success');

      // Cerrar modal
      const modalElement = document.getElementById('modalEditarGasto');
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }

      // Recargar gastos
      await window.cargarGastos();

      // Limpiar variables temporales
      window._evidenciaExistenteGasto = null;
    } else {
      showNotification('Error al actualizar el gasto', 'error');
    }
  } catch (error) {
    console.error('❌ Error guardando gasto editado:', error);
    showNotification('Error al guardar los cambios', 'error');
  }
};

// Función para editar una incidencia
window.editarIncidencia = async function (id) {
  console.log('✏️ Editando incidencia:', id);
  console.log('🔍 Tipo de ID recibido:', typeof id, 'Valor:', id);

  try {
    // Obtener la incidencia - buscar de manera flexible por diferentes formatos de ID
    const incidencias = await window.operadoresManager.getIncidencias();
    console.log(`📋 Total de incidencias cargadas: ${incidencias.length}`);
    console.log(
      '🔍 IDs de incidencias disponibles:',
      incidencias
        .slice(0, 5)
        .map(i => ({ id: i.id, incidenciaId: i.incidenciaId, tipo: typeof i.id }))
    );

    // Buscar la incidencia por múltiples campos de ID posibles
    const idString = String(id);
    const idNumber = parseInt(id, 10);

    const incidencia = incidencias.find(i => {
      // Buscar en múltiples campos posibles de ID
      const iId = i.id || i.incidenciaId;
      if (!iId) {
        return false;
      }

      const iIdString = String(iId);
      const iIdNumber = parseInt(iId, 10);

      // Comparar de múltiples formas
      return (
        iIdString === idString ||
        iIdString === String(id) ||
        iId === id ||
        iIdNumber === idNumber ||
        iIdNumber === id ||
        iId === idNumber ||
        String(iIdNumber) === idString ||
        String(iIdNumber) === String(id)
      );
    });

    // Si no se encuentra, intentar buscar también en los IDs de los documentos de Firebase
    if (!incidencia) {
      const incidenciaAlternativa = incidencias.find(i => {
        const iId = i.id || i.incidenciaId;
        if (!iId) {
          return false;
        }

        // Buscar si el ID contiene el número buscado
        const iIdString = String(iId);
        const idString = String(id);
        const idNumber = parseInt(id, 10);

        // Verificar si el ID termina con el número buscado o si contiene el número
        return (
          iIdString.endsWith(idString) ||
          iIdString.includes(idString) ||
          iIdString.replace(/^incidencia_/, '') === idString ||
          iIdString.replace(/^incidencia_/, '') === String(id) ||
          parseInt(iIdString.replace(/^incidencia_/, ''), 10) === idNumber ||
          parseInt(iIdString, 10) === idNumber
        );
      });

      if (incidenciaAlternativa) {
        console.log('✅ Incidencia encontrada con búsqueda alternativa:', incidenciaAlternativa);
        // Usar la incidencia alternativa encontrada
        const incidenciaFinal = incidenciaAlternativa;

        // Continuar con el código de llenado del formulario
        console.log('✅ Incidencia encontrada:', incidenciaFinal);

        // Llenar el formulario del modal
        document.getElementById('editarIncidencia_id').value =
          incidenciaFinal.id || incidenciaFinal.incidenciaId || id;
        document.getElementById('editarIncidencia_numeroRegistro').value =
          incidenciaFinal.numeroRegistro || '';
        document.getElementById('editarIncidencia_fecha').value = incidenciaFinal.fecha
          ? incidenciaFinal.fecha.split('T')[0]
          : '';
        document.getElementById('editarIncidencia_tipoIncidencia').value =
          incidenciaFinal.tipoIncidencia || '';
        document.getElementById('editarIncidencia_severidad').value =
          incidenciaFinal.severidad || 'baja';
        document.getElementById('editarIncidencia_descripcion').value =
          incidenciaFinal.descripcion || '';
        document.getElementById('editarIncidencia_ubicacion').value =
          incidenciaFinal.ubicacion || '';
        document.getElementById('editarIncidencia_accionesTomadas').value =
          incidenciaFinal.accionesTomadas || '';

        // Llenar operador
        const operadorNombre = incidenciaFinal.operadorNombre || '';
        const operadorInput = document.getElementById('editarIncidencia_operador');
        const operadorHidden = document.getElementById('editarIncidencia_operador_value');
        if (operadorInput) {
          operadorInput.value = operadorNombre;
          if (operadorHidden) {
            operadorHidden.value = operadorNombre;
          }
        }

        // Llenar tractocamión
        const tractocamionTexto =
          incidenciaFinal.economico ||
          incidenciaFinal.tractocamionInfo ||
          incidenciaFinal.tractocamion ||
          '';
        const tractocamionInput = document.getElementById('editarIncidencia_tractocamion');
        const tractocamionHidden = document.getElementById('editarIncidencia_tractocamion_value');
        if (tractocamionInput) {
          tractocamionInput.value = tractocamionTexto;
          if (tractocamionHidden) {
            tractocamionHidden.value = tractocamionTexto;
          }
        }

        // Mostrar evidencia existente
        window._evidenciaExistenteIncidencia = incidenciaFinal.evidencia || [];
        const evidenciaExistenteDiv = document.getElementById(
          'editarIncidencia_evidencia_existente'
        );
        if (evidenciaExistenteDiv && window._evidenciaExistenteIncidencia.length > 0) {
          evidenciaExistenteDiv.innerHTML = `
                        <small class="text-muted">Evidencia existente:</small>
                        <ul class="list-unstyled mt-1">
                            ${window._evidenciaExistenteIncidencia
    .map(
      (ev, idx) => `
                                <li>
                                    <i class="fas fa-file"></i> ${ev.nombre || ev} 
                                    <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-2" onclick="eliminarEvidenciaIncidenciaExistente(${idx})">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </li>
                            `
    )
    .join('')}
                        </ul>
                    `;
        } else if (evidenciaExistenteDiv) {
          evidenciaExistenteDiv.innerHTML = '';
        }

        // Mostrar el modal
        const modalElement = document.getElementById('modalEditarIncidencia');
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }

        return;
      }
    }

    if (!incidencia) {
      console.error('❌ Incidencia no encontrada con ID:', id);
      showNotification('Incidencia no encontrada', 'error');
      return;
    }

    console.log('✅ Incidencia encontrada:', incidencia);

    // Llenar el formulario del modal
    document.getElementById('editarIncidencia_id').value =
      incidencia.id || incidencia.incidenciaId || id;
    document.getElementById('editarIncidencia_numeroRegistro').value =
      incidencia.numeroRegistro || '';
    document.getElementById('editarIncidencia_fecha').value = incidencia.fecha
      ? incidencia.fecha.split('T')[0]
      : '';
    document.getElementById('editarIncidencia_tipoIncidencia').value =
      incidencia.tipoIncidencia || '';
    document.getElementById('editarIncidencia_severidad').value = incidencia.severidad || 'baja';
    document.getElementById('editarIncidencia_descripcion').value = incidencia.descripcion || '';
    document.getElementById('editarIncidencia_ubicacion').value = incidencia.ubicacion || '';
    document.getElementById('editarIncidencia_accionesTomadas').value =
      incidencia.accionesTomadas || '';

    // Llenar operador
    const operadorNombre = incidencia.operadorNombre || '';
    const operadorInput = document.getElementById('editarIncidencia_operador');
    const operadorHidden = document.getElementById('editarIncidencia_operador_value');
    if (operadorInput) {
      operadorInput.value = operadorNombre;
      if (operadorHidden) {
        operadorHidden.value = operadorNombre;
      }
    }

    // Llenar tractocamión
    const tractocamionTexto =
      incidencia.economico || incidencia.tractocamionInfo || incidencia.tractocamion || '';
    const tractocamionInput = document.getElementById('editarIncidencia_tractocamion');
    const tractocamionHidden = document.getElementById('editarIncidencia_tractocamion_value');
    if (tractocamionInput) {
      tractocamionInput.value = tractocamionTexto;
      if (tractocamionHidden) {
        tractocamionHidden.value = tractocamionTexto;
      }
    }

    // Mostrar evidencia existente
    window._evidenciaExistenteIncidencia = incidencia.evidencia || [];
    const evidenciaExistenteDiv = document.getElementById('editarIncidencia_evidencia_existente');
    if (evidenciaExistenteDiv && window._evidenciaExistenteIncidencia.length > 0) {
      evidenciaExistenteDiv.innerHTML = `
                <small class="text-muted">Evidencia existente:</small>
                <ul class="list-unstyled mt-1">
                    ${window._evidenciaExistenteIncidencia
    .map(
      (ev, idx) => `
                        <li>
                            <i class="fas fa-file"></i> ${ev.nombre || ev} 
                            <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-2" onclick="eliminarEvidenciaIncidenciaExistente(${idx})">
                                <i class="fas fa-times"></i>
                            </button>
                        </li>
                    `
    )
    .join('')}
                </ul>
            `;
    } else if (evidenciaExistenteDiv) {
      evidenciaExistenteDiv.innerHTML = '';
    }

    // Mostrar el modal
    const modalElement = document.getElementById('modalEditarIncidencia');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  } catch (error) {
    console.error('❌ Error editando incidencia:', error);
    showNotification('Error al cargar la incidencia para editar', 'error');
  }
};

// Función para eliminar evidencia existente de incidencia
window.eliminarEvidenciaIncidenciaExistente = function (index) {
  if (window._evidenciaExistenteIncidencia && window._evidenciaExistenteIncidencia[index]) {
    window._evidenciaExistenteIncidencia.splice(index, 1);
    // Actualizar la visualización
    const evidenciaExistenteDiv = document.getElementById('editarIncidencia_evidencia_existente');
    if (evidenciaExistenteDiv) {
      if (window._evidenciaExistenteIncidencia.length > 0) {
        evidenciaExistenteDiv.innerHTML = `
                    <small class="text-muted">Evidencia existente:</small>
                    <ul class="list-unstyled mt-1">
                        ${window._evidenciaExistenteIncidencia
    .map(
      (ev, idx) => `
                            <li>
                                <i class="fas fa-file"></i> ${ev.nombre || ev} 
                                <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-2" onclick="eliminarEvidenciaIncidenciaExistente(${idx})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </li>
                        `
    )
    .join('')}
                    </ul>
                `;
      } else {
        evidenciaExistenteDiv.innerHTML = '';
      }
    }
  }
};

// Función para guardar la incidencia editada
window.guardarIncidenciaEditada = async function () {
  console.log('💾 Guardando incidencia editada...');

  const form = document.getElementById('formEditarIncidencia');
  if (!form) {
    showNotification('Formulario no encontrado', 'error');
    return;
  }

  // Validar formulario
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    showNotification('Por favor complete todos los campos requeridos', 'error');
    return;
  }

  try {
    const incidenciaId = document.getElementById('editarIncidencia_id').value;
    if (!incidenciaId) {
      showNotification('ID de incidencia no encontrado', 'error');
      return;
    }

    // Obtener datos del formulario
    const numeroRegistro = document.getElementById('editarIncidencia_numeroRegistro').value;
    const fecha = document.getElementById('editarIncidencia_fecha').value;
    const operadorNombre =
      document.getElementById('editarIncidencia_operador_value').value ||
      document.getElementById('editarIncidencia_operador').value;
    const tractocamionInfo =
      document.getElementById('editarIncidencia_tractocamion_value').value ||
      document.getElementById('editarIncidencia_tractocamion').value;
    const tipoIncidencia = document.getElementById('editarIncidencia_tipoIncidencia').value;
    const severidad = document.getElementById('editarIncidencia_severidad').value;
    const descripcion = document.getElementById('editarIncidencia_descripcion').value;
    const ubicacion = document.getElementById('editarIncidencia_ubicacion').value;
    const accionesTomadas = document.getElementById('editarIncidencia_accionesTomadas').value;

    // Obtener evidencia (combinar existente con nueva)
    let evidencia = window._evidenciaExistenteIncidencia || [];
    const archivosNuevos = document.getElementById('editarIncidencia_evidencia').files;
    if (archivosNuevos && archivosNuevos.length > 0) {
      const nuevasEvidencias = Array.from(archivosNuevos).map(file => ({
        nombre: file.name,
        tamaño: file.size,
        tipo: file.type,
        fecha: new Date().toISOString()
      }));
      evidencia = [...evidencia, ...nuevasEvidencias];
    }

    // Preparar datos actualizados
    const incidenciaActualizada = {
      numeroRegistro: numeroRegistro,
      fecha: fecha,
      operadorNombre: operadorNombre,
      tractocamionInfo: tractocamionInfo,
      economico: tractocamionInfo, // Para compatibilidad
      tipoIncidencia: tipoIncidencia,
      severidad: severidad,
      descripcion: descripcion,
      ubicacion: ubicacion,
      accionesTomadas: accionesTomadas,
      evidencia: evidencia,
      fechaActualizacion: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString()
    };

    // Determinar el ID correcto para Firebase (puede ser incidencia_${id} o el id directamente)
    let firebaseIncidenciaId = incidenciaId;
    // Si el ID es numérico, usar el formato incidencia_${id} para Firebase
    if (!isNaN(incidenciaId) && !incidenciaId.toString().startsWith('incidencia_')) {
      firebaseIncidenciaId = `incidencia_${incidenciaId}`;
    }

    // Guardar en Firebase primero
    if (window.firebaseRepos?.operadores) {
      try {
        await window.firebaseRepos.operadores.saveIncidencia(
          firebaseIncidenciaId,
          incidenciaActualizada
        );
        console.log('✅ Incidencia actualizada en Firebase con ID:', firebaseIncidenciaId);
      } catch (error) {
        console.warn('⚠️ Error guardando en Firebase:', error);
      }
    }

    // Guardar usando operadoresManager (buscar por ID original o Firebase ID)
    let success = false;
    // Intentar actualizar con el ID original primero
    success = await window.operadoresManager.updateIncidencia(incidenciaId, incidenciaActualizada);

    // Si falla, intentar con el ID de Firebase
    if (!success && firebaseIncidenciaId !== incidenciaId) {
      console.log('🔄 Intentando actualizar con ID de Firebase:', firebaseIncidenciaId);
      success = await window.operadoresManager.updateIncidencia(
        firebaseIncidenciaId,
        incidenciaActualizada
      );
    }

    if (success) {
      showNotification('Incidencia actualizada exitosamente', 'success');

      // Cerrar el modal
      const modalElement = document.getElementById('modalEditarIncidencia');
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }

      // Recargar incidencias
      await window.cargarIncidencias();

      // Limpiar variables temporales
      window._evidenciaExistenteIncidencia = null;
    } else {
      showNotification('Error al actualizar la incidencia', 'error');
    }
  } catch (error) {
    console.error('❌ Error guardando incidencia editada:', error);
    showNotification('Error al guardar los cambios', 'error');
  }
};

window.verDetalleGasto = async function (id) {
  console.log(`🔍 Buscando detalle del gasto con ID: ${id} (tipo: ${typeof id})`);

  const gastos = await window.operadoresManager.getGastos();
  console.log(`📋 Total de gastos cargados: ${gastos.length}`);

  // Buscar el gasto por múltiples campos de ID posibles
  // Convertir ambos a string para comparación flexible
  const idString = String(id);
  const gasto = gastos.find(g => {
    const gId = g.id || g.gastoId;
    if (!gId) {
      return false;
    }

    // Comparar como strings y números
    return (
      String(gId) === idString || String(gId) === String(id) || gId === id || gId === parseInt(id, 10)
    );
  });

  if (!gasto) {
    console.error(`❌ Gasto no encontrado con ID: ${id}`);
    console.log('📋 IDs disponibles en gastos:', gastos.map(g => g.id || g.gastoId).slice(0, 10));
    alert(`No se pudo encontrar el gasto con ID: ${id}`);
    return;
  }

  console.log('✅ Gasto encontrado:', gasto);

  // Obtener tractocamion/economico y placas
  // PRIORIDAD 1: Usar campos separados si existen (nuevo formato)
  let tractocamionInfo =
    gasto.tractocamionEconomico ||
    gasto.tractocamionInfo ||
    gasto.economico ||
    gasto.tractocamion ||
    'N/A';
  let placasTractocamion = gasto.tractocamionPlacas || 'N/A';

  // PRIORIDAD 2: Si no hay placas separadas, intentar extraerlas del formato antiguo
  if (placasTractocamion === 'N/A' || !placasTractocamion) {
    const tractocamionInfoCompleto =
      gasto.tractocamionInfo || gasto.economico || gasto.tractocamion || '';

    if (tractocamionInfoCompleto) {
      // Formato 1: "101- Kenworth T680 (23-ABC-7)" - extraer placas de paréntesis
      const matchConParentesis = tractocamionInfoCompleto.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (matchConParentesis) {
        tractocamionInfo = matchConParentesis[1].trim(); // "101- Kenworth T680"
        placasTractocamion = matchConParentesis[2].trim(); // "23-ABC-7"
      }
      // Formato 2: "económico - placas" (formato anterior)
      else if (tractocamionInfoCompleto.includes(' - ')) {
        const partes = tractocamionInfoCompleto.split(' - ');
        tractocamionInfo = partes[0].trim() || 'N/A';
        placasTractocamion = partes[1] ? partes[1].trim() : 'N/A';
      }
    }
  }

  // Limpiar concepto y observaciones
  let conceptoLimpio = gasto.concepto || 'N/A';
  if (conceptoLimpio && conceptoLimpio !== 'N/A') {
    conceptoLimpio = conceptoLimpio.replace(/^Gasto de tráfico\s*-\s*/i, '').trim();
    if (!conceptoLimpio) {
      conceptoLimpio = 'N/A';
    }
  }

  let observacionesLimpio = gasto.observaciones || 'N/A';
  if (observacionesLimpio && observacionesLimpio !== 'N/A') {
    observacionesLimpio = observacionesLimpio
      .replace(/^Registrado desde tráfico\s*-\s*Registro:\s*\d+\s*/i, '')
      .trim();
    if (!observacionesLimpio) {
      observacionesLimpio = 'N/A';
    }
  }

  const detalle = `
        <strong>Número de Registro:</strong> ${gasto.numeroRegistro || 'N/A'}<br>
        <strong>Fecha:</strong> ${formatearFecha(gasto.fecha)}<br>
        <strong>Operador:</strong> ${gasto.operadorNombre || 'N/A'}<br>
        <strong>Tractocamión/Económico:</strong> ${tractocamionInfo}<br>
        <strong>Placas Tractocamion:</strong> ${placasTractocamion}<br>
        <strong>Tipo de Gasto:</strong> ${gasto.tipoGasto || 'N/A'}<br>
        <strong>De Donde Proviene:</strong> ${gasto.origen === 'trafico' ? 'Tráfico' : 'Gasto General'}<br>
        <strong>Monto:</strong> $${(gasto.monto || 0).toFixed(2)}<br>
        <strong>Concepto:</strong> ${conceptoLimpio}<br>
        <strong>Observaciones:</strong> ${observacionesLimpio}
    `;

  showModal('Detalle del Gasto', detalle);
};

// Funciones de búsqueda para el modal de edición de gastos
// Reutilizar funciones existentes pero con IDs del modal
window.filtrarOperadoresGastosEditar = function (busqueda) {
  const input = document.getElementById('editarGasto_operador');
  const dropdown = document.getElementById('editarGasto_operador_dropdown');
  if (!input || !dropdown) {
    return;
  }

  // Reutilizar la lógica de filtrarOperadoresOperadores pero con los IDs del modal
  const termino = busqueda.toLowerCase().trim();
  dropdown.innerHTML = '';

  if (termino.length === 0) {
    dropdown.classList.remove('show');
    return;
  }

  const operadores = (window.ERPState && window.ERPState.getCache('operadores')) || [];
  const filtrados = operadores.filter(op => {
    const nombre = (op.nombre || '').toString().toLowerCase();
    const licencia = (op.licencia || '').toString().toLowerCase();
    return nombre.includes(termino) || licencia.includes(termino);
  });

  if (filtrados.length === 0) {
    dropdown.innerHTML =
      '<div class="searchable-select-no-results">No se encontraron resultados</div>';
    dropdown.classList.add('show');
    return;
  }

  const limitados = filtrados.slice(0, 20);
  limitados.forEach(operador => {
    const item = document.createElement('div');
    item.className = 'searchable-select-item';
    const nombre = operador.nombre || 'N/A';
    const licencia = operador.licencia || '';
    item.innerHTML = `
            <div class="item-text">${nombre}</div>
            ${licencia ? `<div class="item-subtext">Licencia: ${licencia}</div>` : ''}
        `;
    item.addEventListener('click', () => {
      input.value = nombre;
      document.getElementById('editarGasto_operador_value').value = nombre;
      dropdown.classList.remove('show');
    });
    dropdown.appendChild(item);
  });

  dropdown.classList.add('show');
};

window.mostrarDropdownOperadoresGastosEditar = function () {
  const input = document.getElementById('editarGasto_operador');
  if (input && input.value.trim().length > 0) {
    window.filtrarOperadoresGastosEditar(input.value);
  }
};

window.ocultarDropdownOperadoresGastosEditar = function () {
  setTimeout(() => {
    const dropdown = document.getElementById('editarGasto_operador_dropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
    }
  }, 200);
};

window.desplegarListaOperadoresGastosEditar = function () {
  const input = document.getElementById('editarGasto_operador');
  if (input) {
    input.focus();
    window.mostrarDropdownOperadoresGastosEditar();
  }
};

window.manejarTecladoOperadoresGastosEditar = function (event) {
  const dropdown = document.getElementById('editarGasto_operador_dropdown');
  const items = dropdown?.querySelectorAll('.searchable-select-item');
  if (!items || items.length === 0) {
    return;
  }

  let currentIndex = -1;
  items.forEach((item, index) => {
    if (item.classList.contains('highlighted')) {
      currentIndex = index;
    }
  });

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    const newIndex = Math.min(currentIndex + 1, items.length - 1);
    items.forEach((item, index) => {
      item.classList.toggle('highlighted', index === newIndex);
    });
    items[newIndex]?.scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    const newIndex = Math.max(currentIndex - 1, -1);
    items.forEach((item, index) => {
      item.classList.toggle('highlighted', index === newIndex);
    });
    if (newIndex >= 0) {
      items[newIndex]?.scrollIntoView({ block: 'nearest' });
    }
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (currentIndex >= 0 && items[currentIndex]) {
      items[currentIndex].click();
    }
  } else if (event.key === 'Escape') {
    window.ocultarDropdownOperadoresGastosEditar();
  }
};

// Funciones para tractocamiones en el modal de edición
window.filtrarTractocamionesGastosEditar = function (busqueda) {
  const input = document.getElementById('editarGasto_tractocamion');
  const dropdown = document.getElementById('editarGasto_tractocamion_dropdown');
  if (!input || !dropdown) {
    return;
  }

  const termino = busqueda.toLowerCase().trim();
  dropdown.innerHTML = '';

  if (termino.length === 0) {
    dropdown.classList.remove('show');
    return;
  }

  // Obtener tractocamiones desde configuración
  let tractocamiones = [];
  if (
    window.configuracionManager &&
    typeof window.configuracionManager.getAllEconomicos === 'function'
  ) {
    tractocamiones = window.configuracionManager.getAllEconomicos() || [];
  }

  const filtrados = tractocamiones.filter(t => {
    const numero = (t.numero || '').toString().toLowerCase();
    const placa = (t.placaTracto || t.placa || '').toString().toLowerCase();
    return numero.includes(termino) || placa.includes(termino);
  });

  if (filtrados.length === 0) {
    dropdown.innerHTML =
      '<div class="searchable-select-no-results">No se encontraron resultados</div>';
    dropdown.classList.add('show');
    return;
  }

  const limitados = filtrados.slice(0, 20);
  limitados.forEach(tracto => {
    const item = document.createElement('div');
    item.className = 'searchable-select-item';
    const numero = tracto.numero || 'N/A';
    const placa = tracto.placaTracto || tracto.placa || '';
    const texto = placa ? `${numero} (${placa})` : numero;
    item.innerHTML = `<div class="item-text">${texto}</div>`;
    item.addEventListener('click', () => {
      input.value = texto;
      document.getElementById('editarGasto_tractocamion_value').value = numero;
      dropdown.classList.remove('show');
    });
    dropdown.appendChild(item);
  });

  dropdown.classList.add('show');
};

window.mostrarDropdownTractocamionesGastosEditar = function () {
  const input = document.getElementById('editarGasto_tractocamion');
  if (input && input.value.trim().length > 0) {
    window.filtrarTractocamionesGastosEditar(input.value);
  }
};

window.ocultarDropdownTractocamionesGastosEditar = function () {
  setTimeout(() => {
    const dropdown = document.getElementById('editarGasto_tractocamion_dropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
    }
  }, 200);
};

window.desplegarListaTractocamionesGastosEditar = function () {
  const input = document.getElementById('editarGasto_tractocamion');
  if (input) {
    input.focus();
    window.mostrarDropdownTractocamionesGastosEditar();
  }
};

window.manejarTecladoTractocamionesGastosEditar = function (event) {
  const dropdown = document.getElementById('editarGasto_tractocamion_dropdown');
  const items = dropdown?.querySelectorAll('.searchable-select-item');
  if (!items || items.length === 0) {
    return;
  }

  let currentIndex = -1;
  items.forEach((item, index) => {
    if (item.classList.contains('highlighted')) {
      currentIndex = index;
    }
  });

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    const newIndex = Math.min(currentIndex + 1, items.length - 1);
    items.forEach((item, index) => {
      item.classList.toggle('highlighted', index === newIndex);
    });
    items[newIndex]?.scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    const newIndex = Math.max(currentIndex - 1, -1);
    items.forEach((item, index) => {
      item.classList.toggle('highlighted', index === newIndex);
    });
    if (newIndex >= 0) {
      items[newIndex]?.scrollIntoView({ block: 'nearest' });
    }
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (currentIndex >= 0 && items[currentIndex]) {
      items[currentIndex].click();
    }
  } else if (event.key === 'Escape') {
    window.ocultarDropdownTractocamionesGastosEditar();
  }
};

// Cargar opciones de filtros para incidencias
window.cargarOpcionesFiltrosIncidencias = async function () {
  const incidencias = await window.operadoresManager.getIncidencias();

  // Cargar operadores únicos - limpiar formato "Nombre - Licencia" para mostrar solo el nombre
  const operadoresUnicos = [
    ...new Set(
      incidencias
        .map(incidencia => {
          if (!incidencia.operadorNombre) {
            return null;
          }
          // Si tiene formato "Nombre - Licencia", tomar solo el nombre
          if (incidencia.operadorNombre.includes(' - ')) {
            return incidencia.operadorNombre.split(' - ')[0].trim();
          }
          return incidencia.operadorNombre;
        })
        .filter(op => op)
    )
  ];
  const selectOperador = document.getElementById('filtroOperadorIncidencias');
  if (selectOperador) {
    selectOperador.innerHTML = '<option value="">Todos los operadores</option>';
    operadoresUnicos.sort().forEach(operador => {
      const option = document.createElement('option');
      option.value = operador;
      option.textContent = operador;
      selectOperador.appendChild(option);
    });
  }

  // Cargar tractocamiones únicos - buscar en múltiples campos y también desde configuración
  const tractocamionesDeIncidencias = new Set();
  incidencias.forEach(incidencia => {
    // Buscar en múltiples campos
    const tractocamion =
      incidencia.tractocamionInfo ||
      incidencia.economico ||
      incidencia.tractocamion ||
      incidencia.numeroEconomico;
    if (tractocamion) {
      // Si tiene formato "550 - ABC-123", tomar solo el número
      if (tractocamion.includes(' - ')) {
        tractocamionesDeIncidencias.add(tractocamion.split(' - ')[0].trim());
      } else {
        tractocamionesDeIncidencias.add(tractocamion);
      }
    }
  });

  // También cargar desde configuración
  const tractocamionesDeConfig = [];
  if (window.configuracionManager) {
    try {
      const economicosData = window.configuracionManager.getAllEconomicos();
      if (Array.isArray(economicosData) && economicosData.length > 0) {
        economicosData.forEach(eco => {
          const numero = eco.numero || eco.economico || eco.id || '';
          if (numero) {
            tractocamionesDeConfig.push(String(numero));
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Error cargando tractocamiones desde configuración:', error);
    }
  }

  // Combinar ambos conjuntos
  const tractocamionesUnicos = [
    ...new Set([...tractocamionesDeIncidencias, ...tractocamionesDeConfig])
  ];
  const selectTractocamion = document.getElementById('filtroTractocamionIncidencias');
  if (selectTractocamion) {
    selectTractocamion.innerHTML = '<option value="">Todos los tractocamiones</option>';
    tractocamionesUnicos.sort().forEach(tractocamion => {
      const option = document.createElement('option');
      option.value = tractocamion;
      option.textContent = tractocamion;
      selectTractocamion.appendChild(option);
    });
  }

  // Cargar tipos de incidencias únicos
  const tiposUnicos = [
    ...new Set(incidencias.map(incidencia => incidencia.tipoIncidencia).filter(tipo => tipo))
  ];
  const selectTipo = document.getElementById('filtroTipoIncidencias');
  if (selectTipo) {
    selectTipo.innerHTML = '<option value="">Todos los tipos</option>';
    tiposUnicos.sort().forEach(tipo => {
      const option = document.createElement('option');
      option.value = tipo;
      option.textContent = tipo;
      selectTipo.appendChild(option);
    });
  }

  // Cargar severidades únicas
  const severidadesUnicas = [
    ...new Set(incidencias.map(incidencia => incidencia.severidad).filter(sev => sev))
  ];
  const selectSeveridad = document.getElementById('filtroSeveridadIncidencias');
  if (selectSeveridad) {
    selectSeveridad.innerHTML = '<option value="">Todas las severidades</option>';
    severidadesUnicas.sort().forEach(severidad => {
      const option = document.createElement('option');
      option.value = severidad;
      option.textContent = severidad;
      selectSeveridad.appendChild(option);
    });
  }
};

// Aplicar filtros a las incidencias
window.aplicarFiltrosIncidencias = async function () {
  const filtroOperador = document.getElementById('filtroOperadorIncidencias')?.value || '';
  const filtroTractocamion = document.getElementById('filtroTractocamionIncidencias')?.value || '';
  const filtroTipo = document.getElementById('filtroTipoIncidencias')?.value || '';
  const filtroSeveridad = document.getElementById('filtroSeveridadIncidencias')?.value || '';
  const filtroFecha = document.getElementById('filtroFechaIncidencias')?.value || '';

  const incidencias = await window.operadoresManager.getIncidencias();
  const tbody = document.getElementById('incidenciasTableBody');
  if (!tbody) {
    return;
  }

  // Filtrar incidencias
  const incidenciasFiltradas = incidencias.filter(incidencia => {
    // Filtrar por operador - comparar solo el nombre (antes del " - ")
    let cumpleOperador = true;
    if (filtroOperador) {
      const nombreIncidencia = incidencia.operadorNombre || '';
      const nombreLimpio = nombreIncidencia.includes(' - ')
        ? nombreIncidencia.split(' - ')[0].trim()
        : nombreIncidencia;
      cumpleOperador = nombreLimpio === filtroOperador;
    }

    // Filtrar por tractocamion - buscar en múltiples campos
    let cumpleTractocamion = true;
    if (filtroTractocamion) {
      const tractocamionIncidencia =
        incidencia.tractocamionInfo ||
        incidencia.economico ||
        incidencia.tractocamion ||
        incidencia.numeroEconomico ||
        '';
      let tractocamionLimpio = tractocamionIncidencia;
      if (tractocamionIncidencia.includes(' - ')) {
        tractocamionLimpio = tractocamionIncidencia.split(' - ')[0].trim();
      }
      cumpleTractocamion = tractocamionLimpio === filtroTractocamion;
    }

    const cumpleTipo = !filtroTipo || incidencia.tipoIncidencia === filtroTipo;
    const cumpleSeveridad = !filtroSeveridad || incidencia.severidad === filtroSeveridad;
    const cumpleFecha = !filtroFecha || incidencia.fecha.startsWith(filtroFecha);

    return cumpleOperador && cumpleTractocamion && cumpleTipo && cumpleSeveridad && cumpleFecha;
  });

  // Ordenar incidencias filtradas por fecha descendente (más recientes primero)
  incidenciasFiltradas.sort((a, b) => {
    const fechaA = new Date(a.fecha || a.fechaCreacion || 0);
    const fechaB = new Date(b.fecha || b.fechaCreacion || 0);
    return fechaB - fechaA; // Orden descendente
  });

  // Actualizar incidencias completas con las filtradas
  window._incidenciasCompletas = incidenciasFiltradas;

  // Limpiar tabla
  tbody.innerHTML = '';

  if (incidenciasFiltradas.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted">No se encontraron incidencias con los filtros aplicados</td></tr>';
    document.getElementById('paginacionIncidencias').innerHTML = '';
    return;
  }

  // Inicializar paginación con incidencias filtradas
  const PaginacionManagerClass =
    typeof PaginacionManager !== 'undefined'
      ? PaginacionManager
      : typeof window.PaginacionManager !== 'undefined'
        ? window.PaginacionManager
        : null;

  if (!PaginacionManagerClass) {
    console.warn(
      '⚠️ PaginacionManager no está disponible, mostrando todas las incidencias filtradas sin paginación'
    );
    // Mostrar todas las incidencias filtradas sin paginación
    incidenciasFiltradas.forEach(incidencia => {
      const tr = document.createElement('tr');
      const severidadClass =
        {
          baja: 'bg-success',
          media: 'bg-warning',
          alta: 'bg-danger',
          critica: 'bg-dark'
        }[incidencia.severidad] || 'bg-secondary';

      const evidenciaCount = incidencia.evidencia ? incidencia.evidencia.length : 0;
      const evidenciaBadge =
        evidenciaCount > 0
          ? `<span class="badge bg-success">${evidenciaCount} archivo${evidenciaCount > 1 ? 's' : ''}</span>`
          : '<span class="badge bg-secondary">Sin evidencia</span>';

      tr.innerHTML = `
                <td>${formatearFecha(incidencia.fecha)}</td>
                <td>${incidencia.numeroRegistro || 'N/A'}</td>
                <td>${incidencia.operadorNombre}</td>
                <td><span class="badge bg-info">${incidencia.tipoIncidencia}</span></td>
                <td><span class="badge ${severidadClass}">${incidencia.severidad}</span></td>
                <td>${evidenciaBadge}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="verDetalleIncidencia('${incidencia.id}')" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="descargarPDFIncidencia('${incidencia.id}')" title="Descargar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarIncidencia('${incidencia.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
      tbody.appendChild(tr);
    });
    document.getElementById('paginacionIncidencias').innerHTML = '';
    return;
  }

  if (!window._paginacionIncidenciasManager) {
    try {
      window._paginacionIncidenciasManager = new PaginacionManagerClass();
      console.log('✅ Nueva instancia de PaginacionManager creada para incidencias (filtros)');
    } catch (error) {
      console.error('❌ Error creando instancia de PaginacionManager:', error);
      return;
    }
  }

  try {
    window._paginacionIncidenciasManager.inicializar(incidenciasFiltradas, 15);
    window._paginacionIncidenciasManager.paginaActual = 1;
    console.log(
      `✅ Paginación inicializada con filtros: ${window._paginacionIncidenciasManager.totalRegistros} incidencias, ${window._paginacionIncidenciasManager.obtenerTotalPaginas()} páginas`
    );
    renderizarIncidencias();
  } catch (error) {
    console.error('❌ Error al inicializar paginación:', error);
  }

  const totalIncidencias = incidencias.length;
  const incidenciasMostradas = incidenciasFiltradas.length;
  console.log(
    `📊 Filtros aplicados: ${incidenciasMostradas} de ${totalIncidencias} incidencias mostradas`
  );
};

// Limpiar filtros de incidencias
window.limpiarFiltrosIncidencias = function () {
  document.getElementById('filtroOperadorIncidencias').value = '';
  document.getElementById('filtroTractocamionIncidencias').value = '';
  document.getElementById('filtroTipoIncidencias').value = '';
  document.getElementById('filtroSeveridadIncidencias').value = '';
  document.getElementById('filtroFechaIncidencias').value = '';

  // Recargar tabla sin filtros
  window.cargarIncidencias();
};

// Descargar PDF de un Gasto individual
window.descargarPDFGasto = async function (gastoId) {
  console.log(`📄 Descargando PDF del gasto: ${gastoId}`);

  const gastos = await window.operadoresManager.getGastos();

  if (!Array.isArray(gastos)) {
    showNotification('Error al cargar gastos', 'error');
    return;
  }

  const gasto = gastos.find(g => {
    const gId = g.id || g.gastoId;
    return String(gId) === String(gastoId) || gId === gastoId;
  });

  if (!gasto) {
    showNotification('Gasto no encontrado', 'error');
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

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO DE GASTO DE OPERADOR', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Número de Registro (más legible que el ID interno)
    const numeroRegistro = gasto.numeroRegistro || 'N/A';
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Número de Registro: ${numeroRegistro}`, margin, yPosition);
    yPosition += 10;

    // Fecha
    const fecha = formatearFecha(gasto.fecha) || 'N/A';
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${fecha}`, margin, yPosition);
    yPosition += 15;

    // Línea separadora
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Información del Gasto
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INFORMACIÓN DEL GASTO', margin, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Limpiar operador
    let operadorNombre = gasto.operadorNombre || 'N/A';
    if (operadorNombre.includes(' - ')) {
      operadorNombre = operadorNombre.split(' - ')[0].trim();
    }

    // Limpiar tractocamion
    // PRIORIDAD 1: Usar campos separados si existen (nuevo formato)
    let tractocamion =
      gasto.tractocamionEconomico ||
      gasto.economico ||
      gasto.tractocamionInfo ||
      gasto.tractocamion ||
      'N/A';
    let placasTractocamion = gasto.tractocamionPlacas || 'N/A';

    // PRIORIDAD 2: Si no hay placas separadas, intentar extraerlas del formato antiguo
    if (placasTractocamion === 'N/A' || !placasTractocamion) {
      const tractocamionInfoCompleto =
        gasto.tractocamionInfo || gasto.economico || gasto.tractocamion || '';

      if (tractocamionInfoCompleto) {
        // Formato 1: "101- Kenworth T680 (23-ABC-7)" - extraer placas de paréntesis
        const matchConParentesis = tractocamionInfoCompleto.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
        if (matchConParentesis) {
          tractocamion = matchConParentesis[1].trim(); // "101- Kenworth T680"
          placasTractocamion = matchConParentesis[2].trim(); // "23-ABC-7"
        }
        // Formato 2: "económico - placas" (formato anterior)
        else if (tractocamionInfoCompleto.includes(' - ')) {
          const partes = tractocamionInfoCompleto.split(' - ');
          tractocamion = partes[0].trim();
          placasTractocamion = partes[1] ? partes[1].trim() : 'N/A';
        }
      }
    }

    // Limpiar concepto
    let concepto = gasto.concepto || 'N/A';
    if (concepto && concepto !== 'N/A') {
      concepto = concepto.replace(/^Gasto de tráfico\s*-\s*/i, '').trim();
      if (!concepto) {
        concepto = 'N/A';
      }
    }

    // Limpiar observaciones
    let observaciones = gasto.observaciones || 'N/A';
    if (observaciones && observaciones !== 'N/A') {
      observaciones = observaciones
        .replace(/^Registrado desde tráfico\s*-\s*Registro:\s*\d+\s*/i, '')
        .trim();
      if (!observaciones) {
        observaciones = 'N/A';
      }
    }

    // Toda la información en la columna izquierda
    let leftY = yPosition;

    doc.text(`Operador: ${operadorNombre}`, col1X, leftY);
    leftY += 6;
    doc.text(`Tractocamión/Económico: ${tractocamion}`, col1X, leftY);
    leftY += 6;
    doc.text(`Placas Tractocamión: ${placasTractocamion}`, col1X, leftY);
    leftY += 6;
    doc.text(`Tipo de Gasto: ${gasto.tipoGasto || 'N/A'}`, col1X, leftY);
    leftY += 6;
    doc.text(
      `De Donde Proviene: ${gasto.origen === 'trafico' ? 'Tráfico' : 'Gasto General'}`,
      col1X,
      leftY
    );
    leftY += 6;
    doc.text(`Monto: $${(gasto.monto || 0).toFixed(2)}`, col1X, leftY);
    leftY += 6;
    doc.text(
      `Evidencia: ${gasto.evidencia ? `${gasto.evidencia.length} archivo(s)` : 'Sin evidencia'}`,
      col1X,
      leftY
    );
    leftY += 6;

    // Continuar desde la posición final
    yPosition = leftY + 10;

    // Concepto y Observaciones (ancho completo)
    doc.text(`Concepto: ${concepto}`, margin, yPosition);
    yPosition += 10;

    // Observaciones (puede ser largo, usar text con maxWidth)
    const observacionesText = `Observaciones: ${observaciones}`;
    const splitObservaciones = doc.splitTextToSize(observacionesText, pageWidth - 2 * margin);
    doc.text(splitObservaciones, margin, yPosition);

    // Guardar PDF
    const nombreArchivo = `Gasto_${gastoId}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);

    console.log(`✅ PDF generado exitosamente: ${nombreArchivo}`);
    showNotification('PDF del gasto generado exitosamente', 'success');
  } catch (error) {
    console.error('❌ Error generando PDF del gasto:', error);
    showNotification('Error al generar PDF del gasto', 'error');
  }
};

// Descargar PDF de todos los Gastos (función antigua, mantenida por compatibilidad)
window.descargarPDFGastos = async function () {
  console.log('📄 Generando PDF de Gastos de Operadores...');

  const gastos = await window.operadoresManager.getGastos();

  if (!Array.isArray(gastos) || gastos.length === 0) {
    showNotification('No hay gastos para generar PDF', 'warning');
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
    const pageHeight = doc.internal.pageSize.height;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE GASTOS DE OPERADORES', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Fecha de generación
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Fecha de Generación: ${fechaGeneracion}`, margin, yPosition);
    yPosition += 10;

    doc.text(`Total de Gastos: ${gastos.length}`, margin, yPosition);
    yPosition += 15;

    // Línea separadora
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Encabezados de tabla
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const colWidths = [25, 20, 30, 25, 30, 25, 25];
    const headers = ['Fecha', 'N° Reg.', 'Operador', 'Tractoc.', 'Tipo', 'Monto', 'Origen'];
    let xPosition = margin;

    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 8;

    // Línea debajo de encabezados
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    // Datos de gastos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    let totalMonto = 0;

    gastos.forEach((gasto, index) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      // Limpiar operador (quitar " - Licencia")
      let operadorNombre = gasto.operadorNombre || 'N/A';
      if (operadorNombre.includes(' - ')) {
        operadorNombre = operadorNombre.split(' - ')[0].trim();
      }

      // Limpiar tractocamion
      let tractocamion = gasto.economico || gasto.tractocamionInfo || gasto.tractocamion || 'N/A';
      if (tractocamion.includes(' - ')) {
        tractocamion = tractocamion.split(' - ')[0].trim();
      }

      // Limpiar concepto
      let concepto = gasto.concepto || 'N/A';
      if (concepto && concepto !== 'N/A') {
        concepto = concepto.replace(/^Gasto de tráfico\s*-\s*/i, '').trim();
        if (!concepto) {
          concepto = 'N/A';
        }
      }

      const fecha = formatearFecha(gasto.fecha) || 'N/A';
      const numeroRegistro = gasto.numeroRegistro || 'N/A';
      const tipoGasto = gasto.tipoGasto || 'N/A';
      const monto = gasto.monto || 0;
      const origen =
        gasto.origen === 'trafico' || gasto.origen === 'Tráfico' ? 'Tráfico' : 'General';

      totalMonto += monto;

      // Truncar textos largos
      const maxLength = 15;
      const truncar = text =>
        text.length > maxLength ? `${text.substring(0, maxLength - 3)}...` : text;

      xPosition = margin;
      const rowData = [
        truncar(fecha),
        truncar(String(numeroRegistro)),
        truncar(operadorNombre),
        truncar(String(tractocamion)),
        truncar(tipoGasto),
        `$${monto.toFixed(2)}`,
        origen
      ];

      rowData.forEach((data, colIndex) => {
        doc.text(data, xPosition, yPosition);
        xPosition += colWidths[colIndex];
      });

      yPosition += 6;
    });

    // Línea separadora antes del total
    yPosition += 5;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`TOTAL: $${totalMonto.toFixed(2)}`, pageWidth - margin - 30, yPosition, {
      align: 'right'
    });

    // Guardar PDF
    const nombreArchivo = `Gastos_Operadores_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);

    console.log(`✅ PDF generado exitosamente: ${nombreArchivo}`);
    showNotification('PDF de gastos generado exitosamente', 'success');
  } catch (error) {
    console.error('❌ Error generando PDF de gastos:', error);
    showNotification('Error al generar PDF de gastos', 'error');
  }
};

// Descargar PDF de una Incidencia individual
window.descargarPDFIncidencia = async function (incidenciaId) {
  console.log(`📄 Descargando PDF de la incidencia: ${incidenciaId}`);

  const incidencias = await window.operadoresManager.getIncidencias();

  if (!Array.isArray(incidencias)) {
    showNotification('Error al cargar incidencias', 'error');
    return;
  }

  const incidencia = incidencias.find(
    i => i.id === incidenciaId || String(i.id) === String(incidenciaId)
  );

  if (!incidencia) {
    showNotification('Incidencia no encontrada', 'error');
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
    doc.text('REGISTRO DE INCIDENCIA DE OPERADOR', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Número de Registro (más legible que el ID interno)
    const numeroRegistro = incidencia.numeroRegistro || 'N/A';
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Número de Registro: ${numeroRegistro}`, margin, yPosition);
    yPosition += 10;

    // Fecha
    const fecha = formatearFecha(incidencia.fecha) || 'N/A';
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${fecha}`, margin, yPosition);
    yPosition += 15;

    // Línea separadora
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Información de la Incidencia
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INFORMACIÓN DE LA INCIDENCIA', margin, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Limpiar operador
    let operadorNombre = incidencia.operadorNombre || 'N/A';
    if (operadorNombre.includes(' - ')) {
      operadorNombre = operadorNombre.split(' - ')[0].trim();
    }

    // Limpiar tractocamion
    let tractocamion =
      incidencia.tractocamionInfo || incidencia.economico || incidencia.tractocamion || 'N/A';
    if (tractocamion.includes(' - ')) {
      tractocamion = tractocamion.split(' - ')[0].trim();
    }

    // Guardar posición inicial para ambas columnas
    const startY = yPosition;
    let leftY = startY;
    let rightY = startY;

    // Columna izquierda (ya mostramos el número de registro arriba, así que lo omitimos aquí)
    doc.text(`Operador: ${operadorNombre}`, col1X, leftY);
    leftY += 6;
    doc.text(`Tractocamión: ${tractocamion}`, col1X, leftY);
    leftY += 6;
    doc.text(`Tipo de Incidencia: ${incidencia.tipoIncidencia || 'N/A'}`, col1X, leftY);
    leftY += 6;
    doc.text(`Severidad: ${incidencia.severidad || 'N/A'}`, col1X, leftY);
    leftY += 6;

    // Columna derecha
    doc.text(`Ubicación: ${incidencia.ubicacion || 'N/A'}`, col2X, rightY);
    rightY += 6;
    doc.text(
      `Evidencia: ${incidencia.evidencia ? `${incidencia.evidencia.length} archivo(s)` : 'Sin evidencia'}`,
      col2X,
      rightY
    );
    rightY += 6;

    // Usar la posición más baja de las dos columnas para continuar
    yPosition = Math.max(leftY, rightY) + 10;

    // Descripción (ancho completo)
    const descripcion = incidencia.descripcion || 'N/A';
    doc.text('Descripción:', margin, yPosition);
    yPosition += 6;
    const splitDescripcion = doc.splitTextToSize(descripcion, pageWidth - 2 * margin);
    doc.text(splitDescripcion, margin, yPosition);
    yPosition += splitDescripcion.length * 5 + 10;

    // Acciones Tomadas (ancho completo) - siempre mostrar
    const accionesTomadas = incidencia.accionesTomadas || 'N/A';
    doc.text('Acciones Tomadas:', margin, yPosition);
    yPosition += 6;
    const splitAcciones = doc.splitTextToSize(accionesTomadas, pageWidth - 2 * margin);
    doc.text(splitAcciones, margin, yPosition);

    // Guardar PDF
    const nombreArchivo = `Incidencia_${incidenciaId}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);

    console.log(`✅ PDF generado exitosamente: ${nombreArchivo}`);
    showNotification('PDF de la incidencia generado exitosamente', 'success');
  } catch (error) {
    console.error('❌ Error generando PDF de la incidencia:', error);
    showNotification('Error al generar PDF de la incidencia', 'error');
  }
};

// Descargar PDF de todas las Incidencias (función antigua, mantenida por compatibilidad)
window.descargarPDFIncidencias = async function () {
  console.log('📄 Generando PDF de Incidencias de Operadores...');

  const incidencias = await window.operadoresManager.getIncidencias();

  if (!Array.isArray(incidencias) || incidencias.length === 0) {
    showNotification('No hay incidencias para generar PDF', 'warning');
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
    const pageHeight = doc.internal.pageSize.height;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE INCIDENCIAS DE OPERADORES', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Fecha de generación
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Fecha de Generación: ${fechaGeneracion}`, margin, yPosition);
    yPosition += 10;

    doc.text(`Total de Incidencias: ${incidencias.length}`, margin, yPosition);
    yPosition += 15;

    // Línea separadora
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Encabezados de tabla
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const colWidths = [25, 20, 30, 25, 25, 30, 35];
    const headers = ['Fecha', 'N° Reg.', 'Operador', 'Tractoc.', 'Tipo', 'Severidad', 'Ubicación'];
    let xPosition = margin;

    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 8;

    // Línea debajo de encabezados
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    // Datos de incidencias
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    incidencias.forEach((incidencia, index) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      // Limpiar operador (quitar " - Licencia")
      let operadorNombre = incidencia.operadorNombre || 'N/A';
      if (operadorNombre.includes(' - ')) {
        operadorNombre = operadorNombre.split(' - ')[0].trim();
      }

      // Limpiar tractocamion
      let tractocamion =
        incidencia.tractocamionInfo || incidencia.economico || incidencia.tractocamion || 'N/A';
      if (tractocamion.includes(' - ')) {
        tractocamion = tractocamion.split(' - ')[0].trim();
      }

      const fecha = formatearFecha(incidencia.fecha) || 'N/A';
      const numeroRegistro = incidencia.numeroRegistro || 'N/A';
      const tipoIncidencia = incidencia.tipoIncidencia || 'N/A';
      const severidad = incidencia.severidad || 'N/A';
      const ubicacion = incidencia.ubicacion || 'N/A';

      // Truncar textos largos
      const maxLength = 15;
      const truncar = text =>
        text.length > maxLength ? `${text.substring(0, maxLength - 3)}...` : text;

      xPosition = margin;
      const rowData = [
        truncar(fecha),
        truncar(String(numeroRegistro)),
        truncar(operadorNombre),
        truncar(String(tractocamion)),
        truncar(tipoIncidencia),
        truncar(severidad),
        truncar(ubicacion)
      ];

      rowData.forEach((data, colIndex) => {
        doc.text(data, xPosition, yPosition);
        xPosition += colWidths[colIndex];
      });

      yPosition += 6;
    });

    // Guardar PDF
    const nombreArchivo = `Incidencias_Operadores_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);

    console.log(`✅ PDF generado exitosamente: ${nombreArchivo}`);
    showNotification('PDF de incidencias generado exitosamente', 'success');
  } catch (error) {
    console.error('❌ Error generando PDF de incidencias:', error);
    showNotification('Error al generar PDF de incidencias', 'error');
  }
};

// Ver detalle de incidencia
window.verDetalleIncidencia = async function (id) {
  const incidencias = await window.operadoresManager.getIncidencias();

  // Asegurar que incidencias sea un array
  if (!Array.isArray(incidencias)) {
    console.error('⚠️ getIncidencias no devolvió un array:', incidencias);
    showNotification('Error al cargar incidencias', 'error');
    return;
  }

  const incidencia = incidencias.find(i => i.id === id || String(i.id) === String(id));

  if (incidencia) {
    // Obtener tractocamion/economico - puede venir en formato "550 - ABC-123" o solo el número
    const tractocamionInfo =
      incidencia.tractocamionInfo || incidencia.economico || incidencia.tractocamion || 'N/A';

    const detalle = `
            <strong>Número de Registro:</strong> ${incidencia.numeroRegistro || 'N/A'}<br>
            <strong>Fecha:</strong> ${formatearFecha(incidencia.fecha)}<br>
            <strong>Operador:</strong> ${incidencia.operadorNombre || 'N/A'}<br>
            <strong>Tractocamión:</strong> ${tractocamionInfo}<br>
            <strong>Tipo de Incidencia:</strong> ${incidencia.tipoIncidencia || 'N/A'}<br>
            <strong>Severidad:</strong> ${incidencia.severidad || 'N/A'}<br>
            <strong>Ubicación:</strong> ${incidencia.ubicacion || 'N/A'}<br>
            <strong>Descripción:</strong> ${incidencia.descripcion || 'N/A'}<br>
            <strong>Acciones Tomadas:</strong> ${incidencia.accionesTomadas || 'N/A'}
        `;

    showModal('Detalle de la Incidencia', detalle);
  } else {
    console.warn(`❌ Incidencia con ID ${id} no encontrada.`);
    showNotification(`No se encontró la incidencia con ID: ${id}`, 'warning');
  }
};

// Generar reporte
window.generarReporte = async function () {
  const fechaInicio = document.getElementById('fechaInicioReporte').value;
  const fechaFin = document.getElementById('fechaFinReporte').value;
  const operadorId = document.getElementById('operadorReporte').value;
  const tipoReporte = document.getElementById('tipoReporte').value;

  let contenido = '';

  if (tipoReporte === 'gastos') {
    const gastos = await window.operadoresManager.generarReporteGastos(
      fechaInicio,
      fechaFin,
      operadorId
    );

    // Asegurar que gastos sea un array
    if (!Array.isArray(gastos)) {
      console.error('⚠️ generarReporteGastos no devolvió un array:', gastos);
      showNotification('Error al generar reporte de gastos', 'error');
      return;
    }

    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

    contenido = `
            <h5>Reporte de Gastos</h5>
            <p><strong>Período:</strong> ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}</p>
            <p><strong>Total de gastos:</strong> $${totalGastos.toFixed(2)}</p>
            <p><strong>Número de registros:</strong> ${gastos.length}</p>
            
            <div class="table-responsive mt-3">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Operador</th>
                            <th>Tipo</th>
                            <th>Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gastos
    .map(
      g => `
                            <tr>
                                <td>${formatearFecha(g.fecha)}</td>
                                <td>${g.operadorNombre}</td>
                                <td>${g.tipoGasto}</td>
                                <td>$${g.monto.toFixed(2)}</td>
                            </tr>
                        `
    )
    .join('')}
                    </tbody>
                </table>
            </div>
        `;
  } else if (tipoReporte === 'incidencias') {
    const incidencias = await window.operadoresManager.generarReporteIncidencias(
      fechaInicio,
      fechaFin,
      operadorId
    );

    // Asegurar que incidencias sea un array
    if (!Array.isArray(incidencias)) {
      console.error('⚠️ generarReporteIncidencias no devolvió un array:', incidencias);
      showNotification('Error al generar reporte de incidencias', 'error');
      return;
    }

    contenido = `
            <h5>Reporte de Incidencias</h5>
            <p><strong>Período:</strong> ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}</p>
            <p><strong>Número de incidencias:</strong> ${incidencias.length}</p>
            
            <div class="table-responsive mt-3">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Operador</th>
                            <th>Tipo</th>
                            <th>Severidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${incidencias
    .map(
      i => `
                            <tr>
                                <td>${formatearFecha(i.fecha)}</td>
                                <td>${i.operadorNombre}</td>
                                <td>${i.tipoIncidencia}</td>
                                <td><span class="badge bg-${i.severidad === 'critica' ? 'dark' : i.severidad === 'alta' ? 'danger' : i.severidad === 'media' ? 'warning' : 'success'}">${i.severidad}</span></td>
                            </tr>
                        `
    )
    .join('')}
                    </tbody>
                </table>
            </div>
        `;
  }

  document.getElementById('contenidoReporte').innerHTML = contenido;
  document.getElementById('resultadosReporte').style.display = 'block';
};

// Limpiar formulario
window.limpiarFormulario = function () {
  const forms = ['gastosForm', 'incidenciasForm'];
  forms.forEach(formId => {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
      form.classList.remove('was-validated');
    }
  });

  // Restablecer fechas a hoy
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('fechaGasto').value = today;
  document.getElementById('fechaIncidencia').value = today;
};

// === FUNCIONES DE UTILIDAD ===

// Formatear fecha
function formatearFecha(fecha) {
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
  const date = new Date(fecha);
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleDateString('es-MX');
}

// Mostrar modal
function showModal(titulo, contenido) {
  const modalHtml = `
        <div class="modal fade" id="detalleModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${titulo}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${contenido}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Remover modal existente
  const existingModal = document.getElementById('detalleModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Agregar nuevo modal
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('detalleModal'));
  modal.show();
}

// Mostrar notificación
function showNotification(mensaje, tipo = 'info') {
  const notification = document.createElement('div');
  notification.className = `alert alert-${tipo === 'error' ? 'danger' : tipo} alert-dismissible fade show notification`;
  notification.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

// === EXPORTAR A EXCEL ===

// Exportar gastos a Excel
window.exportarGastosExcel = async function () {
  const gastos = await window.operadoresManager.getGastos();
  const datos = gastos.map(g => {
    // Obtener tractocamion/economico de múltiples campos posibles
    // PRIORIDAD 1: Usar campos separados si existen (nuevo formato)
    let tractocamionEconomico = g.tractocamionEconomico || 'N/A';
    let placasTractocamion = g.tractocamionPlacas || 'N/A';

    // PRIORIDAD 2: Si no hay campos separados, intentar extraerlos del formato antiguo
    if (
      tractocamionEconomico === 'N/A' ||
      placasTractocamion === 'N/A' ||
      !tractocamionEconomico ||
      !placasTractocamion
    ) {
      const tractocamionInfoCompleto =
        g.economico || g.tractocamionInfo || g.tractocamion || g.numeroEconomico || '';

      if (tractocamionInfoCompleto) {
        // Formato 1: "101- Kenworth T680 (23-ABC-7)" - extraer placas de paréntesis
        const matchConParentesis = tractocamionInfoCompleto.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
        if (matchConParentesis) {
          tractocamionEconomico = matchConParentesis[1].trim(); // "101- Kenworth T680"
          placasTractocamion = matchConParentesis[2].trim(); // "23-ABC-7"
        }
        // Formato 2: "económico - placas" (formato anterior)
        else if (tractocamionInfoCompleto.includes(' - ')) {
          const partes = tractocamionInfoCompleto.split(' - ');
          tractocamionEconomico = partes[0].trim() || 'N/A';
          placasTractocamion = partes[1] ? partes[1].trim() : 'N/A';
        }
        // Formato 3: Solo económico
        else {
          tractocamionEconomico = tractocamionInfoCompleto;
          placasTractocamion = 'N/A';
        }
      }
    }

    // Determinar de dónde proviene (trafico o gasto general)
    const esDeTrafico = g.origen === 'trafico' || g.origen === 'Tráfico' || g.origen === 'TRÁFICO';
    const deDondeProviene = esDeTrafico ? 'Tráfico' : 'Gasto General';

    // Limpiar concepto: remover prefijos como "Gasto de tráfico - "
    let conceptoLimpio = g.concepto || '';
    if (conceptoLimpio) {
      // Remover prefijos comunes
      conceptoLimpio = conceptoLimpio.replace(/^Gasto de tráfico\s*-\s*/i, '');
      conceptoLimpio = conceptoLimpio.replace(/^Gasto de tráfico\s*/i, '');
      conceptoLimpio = conceptoLimpio.trim();
    }
    if (!conceptoLimpio) {
      conceptoLimpio = 'N/A';
    }

    // Limpiar observaciones: remover prefijos como "Registrado desde tráfico - Registro: X"
    let observacionesLimpio = g.observaciones || '';
    if (observacionesLimpio) {
      // Remover prefijos comunes
      observacionesLimpio = observacionesLimpio.replace(
        /^Registrado desde tráfico\s*-\s*Registro:\s*\d+\s*/i,
        ''
      );
      observacionesLimpio = observacionesLimpio.replace(/^Registrado desde tráfico\s*/i, '');
      observacionesLimpio = observacionesLimpio.trim();
    }
    if (!observacionesLimpio) {
      observacionesLimpio = 'N/A';
    }

    return {
      'Numero de Registro': g.numeroRegistro || 'N/A',
      Fecha: formatearFecha(g.fecha),
      Operador: g.operadorNombre || 'N/A',
      'Tractocamion o Economico': tractocamionEconomico,
      'Placas Tractocamion': placasTractocamion,
      'Tipo de Gastos': g.tipoGasto || 'N/A',
      'De Donde Proviene': deDondeProviene,
      Monto: g.monto || 0,
      Concepto: conceptoLimpio,
      Observaciones: observacionesLimpio
    };
  });

  exportarAExcel(datos, 'Gastos_Operadores');
};

// Exportar incidencias a Excel
window.exportarIncidenciasExcel = async function () {
  const incidencias = await window.operadoresManager.getIncidencias();

  // Asegurar que incidencias sea un array
  if (!Array.isArray(incidencias)) {
    console.error('⚠️ getIncidencias no devolvió un array:', incidencias);
    showNotification('Error al cargar incidencias para exportar', 'error');
    return;
  }

  const datos = incidencias.map(i => {
    // Obtener tractocamion/economico - puede venir en formato "550 - ABC-123" o solo el número
    let tractocamionInfo = i.tractocamionInfo || i.economico || i.tractocamion || '';

    // Si tiene formato "550 - ABC-123", tomar solo la primera parte
    if (tractocamionInfo && tractocamionInfo.includes(' - ')) {
      tractocamionInfo = tractocamionInfo.split(' - ')[0].trim();
    }

    return {
      'Numero de Registro': i.numeroRegistro || 'N/A',
      Fecha: formatearFecha(i.fecha),
      Operador: i.operadorNombre || 'N/A',
      Tractocamion: tractocamionInfo || 'N/A',
      'Tipo de Incidencia': i.tipoIncidencia || 'N/A',
      Descripcion: i.descripcion || 'N/A',
      Ubicacion: i.ubicacion || 'N/A',
      Severidad: i.severidad || 'N/A',
      'Acciones Tomadas': i.accionesTomadas || 'N/A'
    };
  });

  exportarAExcel(datos, 'Incidencias_Operadores');
};

// Exportar reporte a Excel
window.exportarReporteExcel = async function () {
  const fechaInicio = document.getElementById('fechaInicioReporte').value;
  const fechaFin = document.getElementById('fechaFinReporte').value;
  const operadorId = document.getElementById('operadorReporte').value;
  const tipoReporte = document.getElementById('tipoReporte').value;

  let datos = [];
  let nombreArchivo = '';

  if (tipoReporte === 'gastos') {
    const gastos = await window.operadoresManager.generarReporteGastos(
      fechaInicio,
      fechaFin,
      operadorId
    );

    // Asegurar que gastos sea un array
    if (!Array.isArray(gastos)) {
      console.error('⚠️ generarReporteGastos no devolvió un array:', gastos);
      showNotification('Error al generar reporte de gastos', 'error');
      return;
    }

    datos = gastos.map(g => {
      // Obtener tractocamion/economico de múltiples campos posibles
      // PRIORIDAD 1: Usar campos separados si existen (nuevo formato)
      let tractocamionEconomico = g.tractocamionEconomico || 'N/A';
      let placasTractocamion = g.tractocamionPlacas || 'N/A';

      // PRIORIDAD 2: Si no hay campos separados, intentar extraerlos del formato antiguo
      if (
        tractocamionEconomico === 'N/A' ||
        placasTractocamion === 'N/A' ||
        !tractocamionEconomico ||
        !placasTractocamion
      ) {
        const tractocamionInfoCompleto =
          g.economico || g.tractocamionInfo || g.tractocamion || g.numeroEconomico || '';

        if (tractocamionInfoCompleto) {
          // Formato 1: "101- Kenworth T680 (23-ABC-7)" - extraer placas de paréntesis
          const matchConParentesis = tractocamionInfoCompleto.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
          if (matchConParentesis) {
            tractocamionEconomico = matchConParentesis[1].trim(); // "101- Kenworth T680"
            placasTractocamion = matchConParentesis[2].trim(); // "23-ABC-7"
          }
          // Formato 2: "económico - placas" (formato anterior)
          else if (tractocamionInfoCompleto.includes(' - ')) {
            const partes = tractocamionInfoCompleto.split(' - ');
            tractocamionEconomico = partes[0].trim() || 'N/A';
            placasTractocamion = partes[1] ? partes[1].trim() : 'N/A';
          }
          // Formato 3: Solo económico
          else {
            tractocamionEconomico = tractocamionInfoCompleto;
            placasTractocamion = 'N/A';
          }
        }
      }

      // Determinar de dónde proviene (trafico o gasto general)
      const esDeTrafico =
        g.origen === 'trafico' || g.origen === 'Tráfico' || g.origen === 'TRÁFICO';
      const deDondeProviene = esDeTrafico ? 'Tráfico' : 'Gasto General';

      // Limpiar concepto: remover prefijos como "Gasto de tráfico - "
      let conceptoLimpio = g.concepto || '';
      if (conceptoLimpio) {
        // Remover prefijos comunes
        conceptoLimpio = conceptoLimpio.replace(/^Gasto de tráfico\s*-\s*/i, '');
        conceptoLimpio = conceptoLimpio.replace(/^Gasto de tráfico\s*/i, '');
        conceptoLimpio = conceptoLimpio.trim();
      }
      if (!conceptoLimpio) {
        conceptoLimpio = 'N/A';
      }

      // Limpiar observaciones: remover prefijos como "Registrado desde tráfico - Registro: X"
      let observacionesLimpio = g.observaciones || '';
      if (observacionesLimpio) {
        // Remover prefijos comunes
        observacionesLimpio = observacionesLimpio.replace(
          /^Registrado desde tráfico\s*-\s*Registro:\s*\d+\s*/i,
          ''
        );
        observacionesLimpio = observacionesLimpio.replace(/^Registrado desde tráfico\s*/i, '');
        observacionesLimpio = observacionesLimpio.trim();
      }
      if (!observacionesLimpio) {
        observacionesLimpio = 'N/A';
      }

      return {
        'Numero de Registro': g.numeroRegistro || 'N/A',
        Fecha: formatearFecha(g.fecha),
        Operador: g.operadorNombre || 'N/A',
        'Tractocamion o Economico': tractocamionEconomico,
        'Placas Tractocamion': placasTractocamion,
        'Tipo de Gastos': g.tipoGasto || 'N/A',
        'De Donde Proviene': deDondeProviene,
        Monto: g.monto || 0,
        Concepto: conceptoLimpio,
        Observaciones: observacionesLimpio
      };
    });
    nombreArchivo = 'Reporte_Gastos_Operadores';
  } else if (tipoReporte === 'incidencias') {
    const incidencias = await window.operadoresManager.generarReporteIncidencias(
      fechaInicio,
      fechaFin,
      operadorId
    );

    // Asegurar que incidencias sea un array
    if (!Array.isArray(incidencias)) {
      console.error('⚠️ generarReporteIncidencias no devolvió un array:', incidencias);
      showNotification('Error al generar reporte de incidencias', 'error');
      return;
    }

    datos = incidencias.map(i => {
      // Obtener tractocamion/economico - puede venir en formato "550 - ABC-123" o solo el número
      let tractocamionInfo = i.tractocamionInfo || i.economico || i.tractocamion || '';

      // Si tiene formato "550 - ABC-123", tomar solo la primera parte
      if (tractocamionInfo && tractocamionInfo.includes(' - ')) {
        tractocamionInfo = tractocamionInfo.split(' - ')[0].trim();
      }

      return {
        'Numero de Registro': i.numeroRegistro || 'N/A',
        Fecha: formatearFecha(i.fecha),
        Operador: i.operadorNombre || 'N/A',
        Tractocamion: tractocamionInfo || 'N/A',
        'Tipo de Incidencia': i.tipoIncidencia || 'N/A',
        Descripcion: i.descripcion || 'N/A',
        Ubicacion: i.ubicacion || 'N/A',
        Severidad: i.severidad || 'N/A',
        'Acciones Tomadas': i.accionesTomadas || 'N/A'
      };
    });
    nombreArchivo = 'Reporte_Incidencias_Operadores';
  }

  if (datos.length > 0) {
    exportarAExcel(datos, nombreArchivo);
  } else {
    showNotification('No hay datos para exportar', 'warning');
  }
};

// Función genérica para exportar a Excel
function exportarAExcel(datos, nombreArchivo) {
  try {
    // Intentar cargar SheetJS dinámicamente
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = function () {
      try {
        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Datos');

        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `${nombreArchivo}_${fecha}.xlsx`);

        showNotification('Archivo Excel exportado exitosamente', 'success');
      } catch (error) {
        console.error('Error exportando a Excel:', error);
        exportarACSV(datos, nombreArchivo);
      }
    };
    script.onerror = function () {
      console.warn('SheetJS no disponible, exportando a CSV');
      exportarACSV(datos, nombreArchivo);
    };
    document.head.appendChild(script);
  } catch (error) {
    console.error('Error cargando SheetJS:', error);
    exportarACSV(datos, nombreArchivo);
  }
}

// Función de respaldo para exportar a CSV
function exportarACSV(datos, nombreArchivo) {
  if (datos.length === 0) {
    showNotification('No hay datos para exportar', 'warning');
    return;
  }

  const headers = Object.keys(datos[0]);
  const csvContent = [
    headers.join(','),
    ...datos.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);

  const fecha = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${nombreArchivo}_${fecha}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showNotification('Archivo CSV exportado exitosamente', 'success');
}

// Función para validar números de registro únicos
function validarNumeroRegistroUnico(inputId, _tipoRegistro) {
  const input = document.getElementById(inputId);
  if (!input) {
    return;
  }

  input.addEventListener('blur', function () {
    const inputValue = this.value.trim();

    // Limpiar estado previo
    this.classList.remove('is-invalid', 'is-valid');
    const errorDiv = document.getElementById(`${inputId}-error`);
    if (errorDiv) {
      errorDiv.remove();
    }

    // Si el campo está vacío, no validar
    if (!inputValue) {
      return;
    }

    // Verificar si el número ya existe en el historial
    const history = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
    const existingNumber = history.find(item => item.number === inputValue);

    if (existingNumber) {
      // En Operadores siempre se permite usar cualquier número (gastos imprevistos en ruta)
      this.classList.add('is-valid');

      // Crear mensaje informativo
      const infoDiv = document.createElement('div');
      infoDiv.id = `${inputId}-info`;
      infoDiv.className = 'valid-feedback';

      const moduleName = existingNumber.page
        ? existingNumber.page.includes('logistica')
          ? 'Logística'
          : existingNumber.page.includes('trafico')
            ? 'Tráfico'
            : existingNumber.page.includes('facturacion')
              ? 'Facturación'
              : 'otro módulo'
        : 'otro módulo';

      infoDiv.textContent = `✅ Número encontrado en ${moduleName}. Registrando gasto imprevisto en Operadores...`;

      // Limpiar mensaje anterior si existe
      const existingInfo = document.getElementById(`${inputId}-info`);
      if (existingInfo) {
        existingInfo.remove();
      }

      this.parentNode.appendChild(infoDiv);

      // Mostrar notificación informativa
      if (typeof window.showNotification === 'function') {
        window.showNotification(
          `Número ${inputValue} encontrado en ${moduleName}. Registrando gasto...`,
          'info'
        );
      }

      return true;
    }
    // Número es único - marcar como válido
    this.classList.add('is-valid');
  });
}

// ===== FUNCIONES DE LIMPIEZA DE DATOS =====

// Función para limpiar datos de ejemplo de operadores
function limpiarDatosEjemploOperadores() {
  console.log('🧹 Limpiando datos de ejemplo de operadores...');

  try {
    // Limpiar gastos de ejemplo
    const gastos = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    const gastosReales = gastos.filter(
      gasto =>
        // Mantener solo gastos que no sean de ejemplo
        !gasto.descripcion?.includes('Ejemplo') &&
        !gasto.descripcion?.includes('Prueba') &&
        !gasto.descripcion?.includes('Test')
    );

    // Guardar solo gastos reales
    localStorage.setItem('erp_operadores_gastos', JSON.stringify(gastosReales));
    console.log(`✅ Gastos limpiados: ${gastos.length} → ${gastosReales.length}`);

    // Limpiar incidencias de ejemplo
    const incidencias = JSON.parse(localStorage.getItem('erp_operadores_incidencias') || '[]');
    const incidenciasReales = incidencias.filter(
      incidencia =>
        !incidencia.descripcion?.includes('Ejemplo') &&
        !incidencia.descripcion?.includes('Prueba') &&
        !incidencia.descripcion?.includes('Test')
    );

    // Guardar solo incidencias reales
    localStorage.setItem('erp_operadores_incidencias', JSON.stringify(incidenciasReales));
    console.log(`✅ Incidencias limpiadas: ${incidencias.length} → ${incidenciasReales.length}`);

    // Limpiar operadores de ejemplo (mantener solo los reales)
    const operadores = JSON.parse(localStorage.getItem('erp_operadores_lista') || '[]');
    const operadoresReales = operadores.filter(
      operador =>
        // Mantener solo operadores que no sean de ejemplo
        !operador.nombre?.includes('Ejemplo') &&
        !operador.nombre?.includes('Prueba') &&
        !operador.nombre?.includes('Test')
    );

    // Guardar solo operadores reales
    localStorage.setItem('erp_operadores_lista', JSON.stringify(operadoresReales));
    console.log(`✅ Operadores limpiados: ${operadores.length} → ${operadoresReales.length}`);

    console.log('🎉 Limpieza de operadores completada. Solo datos reales permanecen.');

    return {
      gastos: gastosReales.length,
      incidencias: incidenciasReales.length,
      operadores: operadoresReales.length
    };
  } catch (error) {
    console.error('❌ Error durante la limpieza de operadores:', error);
    return null;
  }
}

// Hacer función disponible globalmente
window.limpiarDatosEjemploOperadores = limpiarDatosEjemploOperadores;

// Función para limpiar gastos obsoletos de localStorage
window.limpiarGastosObsoletosOperadores = async function () {
  try {
    console.log('🧹 Iniciando limpieza de gastos obsoletos...');

    // Obtener gastos de localStorage
    const gastosLocal = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    console.log(`📋 Gastos en localStorage antes de limpiar: ${gastosLocal.length}`);

    // Obtener gastos de Firebase (fuente de verdad)
    let gastosFirebase = [];
    if (window.firebaseRepos?.operadores) {
      try {
        let attempts = 0;
        while (
          attempts < 10 &&
          (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId)
        ) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
          if (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId) {
            await window.firebaseRepos.operadores.init();
          }
        }

        gastosFirebase = (await window.firebaseRepos.operadores.getAllGastos()) || [];
        console.log(`📊 Gastos en Firebase: ${gastosFirebase.length}`);
      } catch (error) {
        console.warn('⚠️ Error cargando gastos desde Firebase:', error);
      }
    }

    // Crear set de IDs de Firebase para búsqueda rápida
    const idsFirebase = new Set(gastosFirebase.map(g => String(g.id || '')));

    // Filtrar gastos obsoletos
    const gastosLimpios = gastosLocal.filter(gastoLocal => {
      const idLocal = String(gastoLocal.id || '');

      // Si está en Firebase, mantenerlo
      if (idsFirebase.has(idLocal)) {
        return true;
      }

      // Verificar si es obsoleto
      const esObsoleto =
        // Gastos con origen "trafico" que no están en Firebase son temporales
        gastoLocal.origen === 'trafico' ||
        // Gastos con IDs que parecen temporales (formato: gasto_timestamp_*)
        (idLocal.startsWith('gasto_') && idLocal.includes('_') && idLocal.split('_').length >= 3) ||
        // Gastos muy antiguos (más de 7 días sin sincronizar)
        (gastoLocal.fechaCreacion &&
          Date.now() - new Date(gastoLocal.fechaCreacion).getTime() > 7 * 24 * 60 * 60 * 1000);

      if (esObsoleto) {
        console.log(
          `🗑️ Eliminando gasto obsoleto: ${idLocal} (origen: ${gastoLocal.origen || 'N/A'})`
        );
        return false;
      }

      // Mantener gastos locales válidos que no son obsoletos (menos de 24 horas)
      if (gastoLocal.fechaCreacion) {
        const edad = Date.now() - new Date(gastoLocal.fechaCreacion).getTime();
        const maxEdad = 24 * 60 * 60 * 1000; // 24 horas
        if (edad < maxEdad) {
          return true;
        }
      }

      // Si no tiene fecha y no es obsoleto, mantenerlo por ahora
      return true;
    });

    // Guardar gastos limpios
    localStorage.setItem('erp_operadores_gastos', JSON.stringify(gastosLimpios));

    const eliminados = gastosLocal.length - gastosLimpios.length;
    console.log(
      `✅ Limpieza completada: ${eliminados} gastos obsoletos eliminados, ${gastosLimpios.length} gastos válidos mantenidos`
    );

    return {
      eliminados: eliminados,
      mantenidos: gastosLimpios.length,
      totalAntes: gastosLocal.length
    };
  } catch (error) {
    console.error('❌ Error durante la limpieza de gastos obsoletos:', error);
    return null;
  }
};

// Inicializar validaciones cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  // Validar número de registro para gastos
  validarNumeroRegistroUnico('numeroRegistroGasto', 'gasto');

  // Validar número de registro para incidencias
  validarNumeroRegistroUnico('numeroRegistroIncidencia', 'incidencia');
});

// Función de debug para verificar números de registro
window.verificarNumerosRegistro = function () {
  console.log('🔍 Verificando números de registro...');

  const history = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
  console.log('📋 Total números registrados:', history.length);
  console.log(
    'ℹ️ NOTA: En Operadores se permite usar cualquier número (gastos imprevistos en ruta)'
  );

  history.forEach((item, index) => {
    console.log(`📄 Registro ${index + 1}:`, {
      numero: item.number,
      modulo: item.page,
      fecha: new Date(item.timestamp).toLocaleDateString('es-ES'),
      timestamp: item.timestamp
    });
  });

  // Verificar números específicos
  const numerosEspecificos = ['2025-09-0001', '2025-09-0002'];
  numerosEspecificos.forEach(numero => {
    const existe = history.find(item => item.number === numero);
    if (existe) {
      console.log(`🎯 Número ${numero} encontrado:`, existe);
    } else {
      console.log(`❌ Número ${numero} no encontrado`);
    }
  });
};

console.log('✅ OperadoresManager inicializado');
