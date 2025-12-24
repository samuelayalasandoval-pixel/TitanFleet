/**
 * Sistema de Limpieza Automática de localStorage
 * Elimina datos obsoletos, duplicados o de otros tenants
 */

(function () {
  'use strict';

  console.log('🧹 Sistema de limpieza de localStorage inicializado');

  /**
   * Limpiar datos obsoletos de localStorage
   * Elimina registros que:
   * 1. Tienen tenantId diferente al actual
   * 2. Están marcados como deleted en Firebase pero siguen en localStorage
   * 3. No tienen tenantId ni userId (datos huérfanos antiguos)
   */
  async function limpiarDatosObsoletos() {
    try {
      const currentTenantId =
        localStorage.getItem('tenantId') ||
        window.firebaseRepos?.logistica?.tenantId ||
        window.firebaseAuth?.currentUser?.uid;

      if (!currentTenantId) {
        console.log('ℹ️ No hay tenantId disponible, saltando limpieza');
        return;
      }

      // console.log(`🧹 Iniciando limpieza de localStorage (tenantId: ${currentTenantId})`);

      let totalEliminados = 0;

      // Limpiar erp_shared_data
      const sharedData = localStorage.getItem('erp_shared_data');
      if (sharedData) {
        try {
          const data = JSON.parse(sharedData);
          const sections = [
            'registros',
            'facturas',
            'facturacion',
            'trafico',
            'diesel',
            'mantenimiento',
            'tesoreria',
            'cxc',
            'cxp',
            'inventario',
            'incidencias'
          ];

          let cambios = false;
          sections.forEach(section => {
            if (data[section] && typeof data[section] === 'object') {
              const keys = Object.keys(data[section]);
              let eliminadosSeccion = 0;

              keys.forEach(key => {
                const item = data[section][key];

                // Eliminar si tiene tenantId diferente
                if (item.tenantId && item.tenantId !== currentTenantId) {
                  delete data[section][key];
                  eliminadosSeccion++;
                  cambios = true;
                }
                // Eliminar si está marcado como deleted
                else if (item.deleted === true) {
                  delete data[section][key];
                  eliminadosSeccion++;
                  cambios = true;
                }
                // Eliminar si no tiene tenantId ni userId (datos huérfanos antiguos)
                // PERO solo si el usuario actual tiene tenantId configurado
                else if (
                  !item.tenantId &&
                  !item.userId &&
                  currentTenantId !== (window.DEMO_CONFIG?.tenantId || 'demo_tenant')
                ) {
                  delete data[section][key];
                  eliminadosSeccion++;
                  cambios = true;
                }
              });

              if (eliminadosSeccion > 0) {
                console.log(`  ✅ ${section}: ${eliminadosSeccion} registros eliminados`);
                totalEliminados += eliminadosSeccion;
              }
            }
          });

          if (cambios) {
            localStorage.setItem('erp_shared_data', JSON.stringify(data));
          }
        } catch (e) {
          console.error('Error limpiando erp_shared_data:', e);
        }
      }

      // Limpiar otras claves de localStorage
      const keysToClean = [
        'erp_logistica',
        'erp_facturacion',
        'erp_trafico',
        'erp_diesel_movimientos',
        'erp_operadores_gastos',
        'erp_operadores_incidencias',
        'erp_mantenimientos',
        'erp_tesoreria_movimientos',
        'erp_cxc',
        'erp_cxp'
      ];

      keysToClean.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            const items = Array.isArray(parsed) ? parsed : Object.values(parsed);
            const originalLength = items.length;

            const filtered = items.filter(item => {
              // Mantener si tiene tenantId correcto
              if (item.tenantId && item.tenantId === currentTenantId) {
                return true;
              }
              // Mantener si tiene userId del usuario actual
              if (
                item.userId &&
                window.firebaseAuth?.currentUser?.uid &&
                item.userId === window.firebaseAuth.currentUser.uid
              ) {
                return true;
              }
              // Mantener si está marcado como deleted (se eliminará después)
              if (item.deleted === true) {
                return false; // Eliminar los marcados como deleted
              }
              // Mantener datos sin tenantId solo si es DEMO_CONFIG.tenantId
              const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
              if (!item.tenantId && !item.userId && currentTenantId === demoTenantId) {
                return true; // Para demo, mantener datos antiguos
              }
              // Eliminar el resto
              return false;
            });

            // Eliminar también los marcados como deleted
            const finalFiltered = filtered.filter(item => item.deleted !== true);

            if (finalFiltered.length !== originalLength) {
              const eliminados = originalLength - finalFiltered.length;
              totalEliminados += eliminados;

              // Guardar datos filtrados
              if (Array.isArray(parsed)) {
                localStorage.setItem(key, JSON.stringify(finalFiltered));
              } else {
                const filteredObj = {};
                finalFiltered.forEach(item => {
                  const id = item.id || item.numeroRegistro || item.registroId;
                  if (id) {
                    filteredObj[id] = item;
                  }
                });
                localStorage.setItem(key, JSON.stringify(filteredObj));
              }

              console.log(`  ✅ ${key}: ${eliminados} registros eliminados`);
            }
          } catch (e) {
            console.error(`Error limpiando ${key}:`, e);
          }
        }
      });

      if (totalEliminados > 0) {
        // console.log(`✅ Limpieza completada: ${totalEliminados} registros obsoletos eliminados`);
      } else {
        // console.log('✅ No se encontraron registros obsoletos para eliminar');
      }

      return totalEliminados;
    } catch (error) {
      console.error('❌ Error en limpieza de localStorage:', error);
      return 0;
    }
  }

  /**
   * Sincronizar localStorage con Firebase
   * Elimina de localStorage los registros que ya no existen en Firebase
   */
  async function sincronizarConFirebase() {
    if (!window.firebaseRepos || !window.firebaseAuth?.currentUser) {
      console.log('ℹ️ Firebase no disponible o usuario no autenticado, saltando sincronización');
      return;
    }

    try {
      // console.log('🔄 Sincronizando localStorage con Firebase...');
      let totalEliminados = 0;

      // Sincronizar cada repositorio
      const repos = [
        'logistica',
        'facturacion',
        'trafico',
        'diesel',
        'mantenimiento',
        'tesoreria',
        'cxc',
        'cxp'
      ];

      for (const repoName of repos) {
        const repo = window.firebaseRepos[repoName];
        if (!repo || !repo.db || !repo.tenantId) {
          continue;
        }

        try {
          // Obtener IDs de Firebase
          const firebaseData = await repo.getAll();
          const firebaseIds = new Set(
            firebaseData
              .map(item => item.id || item.numeroRegistro || item.registroId)
              .filter(Boolean)
          );

          // Obtener datos de localStorage
          const localData = repo.getAllFromLocalStorage();
          const localIds = new Set(
            localData.map(item => item.id || item.numeroRegistro || item.registroId).filter(Boolean)
          );

          // Encontrar IDs que están en localStorage pero no en Firebase
          const idsParaEliminar = [...localIds].filter(id => !firebaseIds.has(id));

          if (idsParaEliminar.length > 0) {
            // Eliminar de localStorage
            idsParaEliminar.forEach(id => {
              repo.deleteFromLocalStorage(id);
            });

            totalEliminados += idsParaEliminar.length;
            console.log(
              `  ✅ ${repoName}: ${idsParaEliminar.length} registros eliminados (no existen en Firebase)`
            );
          }
        } catch (error) {
          console.warn(`⚠️ Error sincronizando ${repoName}:`, error);
        }
      }

      if (totalEliminados > 0) {
        // console.log(`✅ Sincronización completada: ${totalEliminados} registros eliminados`);
      } else {
        // console.log('✅ localStorage ya está sincronizado con Firebase');
      }

      return totalEliminados;
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      return 0;
    }
  }

  /**
   * Ejecutar limpieza automática
   * Se ejecuta después de que Firebase esté listo
   */
  async function ejecutarLimpiezaAutomatica() {
    // Esperar a que Firebase esté listo
    if (window.firebaseReady) {
      await limpiarDatosObsoletos();
      await sincronizarConFirebase();
    } else {
      window.addEventListener(
        'firebaseReady',
        async () => {
          await limpiarDatosObsoletos();
          await sincronizarConFirebase();
        },
        { once: true }
      );
    }
  }

  // Exponer funciones globalmente
  window.localStorageCleanup = {
    limpiarObsoletos: limpiarDatosObsoletos,
    sincronizarFirebase: sincronizarConFirebase,
    ejecutar: ejecutarLimpiezaAutomatica
  };

  // Ejecutar limpieza automática después de un delay (para no interferir con la carga inicial)
  setTimeout(() => {
    ejecutarLimpiezaAutomatica();
  }, 10000); // 10 segundos después de cargar la página

  // También ejecutar cuando el usuario cambie (nuevo login)
  if (window.firebaseAuth) {
    window.firebaseAuth.onAuthStateChanged(() => {
      setTimeout(() => {
        ejecutarLimpiezaAutomatica();
      }, 5000);
    });
  }

  console.log('✅ Sistema de limpieza de localStorage configurado');
})();
