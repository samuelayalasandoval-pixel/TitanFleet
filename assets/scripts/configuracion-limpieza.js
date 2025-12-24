/**
 * Limpia todos los datos operativos de los módulos del sistema
 * Elimina datos de: Logística, Tráfico, Facturación, Operadores, Diesel,
 * Mantenimiento, Tesorería, CXC, CXP e Inventarios
 * También resetea el contador a 2500001
 */
window.limpiarTodosLosDatosOperativos = async function () {
  // Confirmación doble para evitar borrados accidentales
  const confirmacion1 = confirm(
    '⚠️ ADVERTENCIA: Esta acción eliminará TODOS los registros operativos del sistema.\n\n' +
      'Módulos afectados:\n' +
      '• Logística\n' +
      '• Tráfico\n' +
      '• Facturación\n' +
      '• Operadores\n' +
      '• Diesel\n' +
      '• Mantenimiento\n' +
      '• Tesorería\n' +
      '• Cuentas por Cobrar (CXC)\n' +
      '• Cuentas por Pagar (CXP)\n' +
      '• Inventarios\n\n' +
      'También se reseteará el contador a 2500001.\n\n' +
      '¿Estás SEGURO de que deseas continuar?'
  );

  if (!confirmacion1) {
    console.log('❌ Limpieza cancelada por el usuario');
    return;
  }

  const confirmacion2 = confirm(
    '⚠️ ÚLTIMA CONFIRMACIÓN\n\n' +
      'Esta acción NO se puede deshacer.\n\n' +
      '¿Confirmas que deseas eliminar TODOS los datos operativos?'
  );

  if (!confirmacion2) {
    console.log('❌ Limpieza cancelada por el usuario');
    return;
  }

  try {
    console.log('🧹 Iniciando limpieza completa de datos operativos...');

    // Lista de módulos a limpiar
    const modulos = [
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

    let totalEliminadosFirebase = 0;
    let totalEliminadosLocalStorage = 0;

    // 1. Limpiar de Firebase
    if (window.firebaseDb && window.fs) {
      console.log('🔥 Limpiando datos de Firebase...');

      // Obtener tenantId de los repositorios (que usan DEMO_CONFIG.tenantId) o usar DEMO_CONFIG.tenantId directamente
      let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant'; // Por defecto para modo demo

      // Intentar obtener el tenantId de los repositorios si están disponibles
      if (
        window.firebaseRepos &&
        window.firebaseRepos.logistica &&
        window.firebaseRepos.logistica.tenantId
      ) {
        tenantId = window.firebaseRepos.logistica.tenantId;
        console.log(`🔍 Usando tenantId de repositorios: ${tenantId}`);
      } else {
        console.log(`🔍 Usando tenantId por defecto (demo): ${tenantId}`);
      }

      for (const modulo of modulos) {
        try {
          console.log(`🔍 Limpiando módulo: ${modulo}`);
          // Obtener todos los documentos de la colección
          const collectionRef = window.fs.collection(window.firebaseDb, modulo);

          // Primero intentar filtrar por tenantId
          let snapshot;
          let eliminadosConFiltro = 0;

          try {
            const q = window.fs.query(collectionRef, window.fs.where('tenantId', '==', tenantId));
            snapshot = await window.fs.getDocs(q);
            eliminadosConFiltro = snapshot.docs.length;
            console.log(
              `📊 Encontrados ${eliminadosConFiltro} documentos con tenantId ${tenantId} en ${modulo}`
            );
          } catch (error) {
            console.warn(
              '⚠️ Error filtrando por tenantId, obteniendo todos los documentos:',
              error
            );
            snapshot = await window.fs.getDocs(collectionRef);
            console.log(
              `📊 Encontrados ${snapshot.docs.length} documentos (sin filtro) en ${modulo}`
            );
          }

          // Si no encontró nada con el filtro, buscar sin filtro (para eliminar registros de otros tenantIds)
          if (snapshot.empty) {
            console.log(
              `🔍 No se encontraron registros con tenantId ${tenantId}, buscando todos los registros...`
            );
            snapshot = await window.fs.getDocs(collectionRef);
            console.log(
              `📊 Encontrados ${snapshot.docs.length} documentos (sin filtro) en ${modulo}`
            );
          }

          if (!snapshot.empty) {
            // Eliminar documentos uno por uno (más compatible)
            const { docs } = snapshot;
            console.log(`🗑️ Eliminando ${docs.length} documentos de Firebase/${modulo}...`);

            // Usar Promise.all para eliminar en paralelo (máximo 50 a la vez para evitar sobrecarga)
            const batchSize = 50;
            let eliminadosExitosos = 0;

            for (let i = 0; i < docs.length; i += batchSize) {
              const batchDocs = docs.slice(i, i + batchSize);
              const deletePromises = batchDocs.map(async doc => {
                try {
                  // Eliminar físicamente el documento
                  await window.fs.deleteDoc(doc.ref);

                  // Verificar que fue eliminado
                  const docSnap = await window.fs.getDoc(doc.ref);
                  if (!docSnap.exists()) {
                    eliminadosExitosos++;
                    return { id: doc.id, eliminado: true };
                  }
                  console.warn(
                    `⚠️ Documento ${doc.id} aún existe después de eliminar, reintentando...`
                  );
                  // Reintentar eliminación
                  await window.fs.deleteDoc(doc.ref);
                  const docSnap2 = await window.fs.getDoc(doc.ref);
                  if (!docSnap2.exists()) {
                    eliminadosExitosos++;
                    return { id: doc.id, eliminado: true };
                  }
                  console.error(`❌ No se pudo eliminar documento ${doc.id} después de 2 intentos`);
                  return { id: doc.id, eliminado: false };
                } catch (error) {
                  console.warn(`⚠️ Error eliminando documento ${doc.id}:`, error);
                  return { id: doc.id, eliminado: false, error: error.message };
                }
              });

              const resultados = await Promise.all(deletePromises);
              const exitosos = resultados.filter(r => r.eliminado).length;
              console.log(
                `✅ Eliminados ${exitosos}/${batchDocs.length} documentos de Firebase/${modulo} (lote ${Math.floor(i / batchSize) + 1})`
              );
            }

            console.log(
              `✅ ${eliminadosExitosos}/${docs.length} registros eliminados definitivamente de Firebase/${modulo}${eliminadosConFiltro < snapshot.docs.length ? ' (incluyendo registros de otros tenantIds)' : ''}`
            );
            totalEliminadosFirebase += eliminadosExitosos;
          } else {
            console.log(`ℹ️ No hay registros en Firebase/${modulo}`);
          }
        } catch (error) {
          console.error(`❌ Error limpiando Firebase/${modulo}:`, error);
        }
      }

      // Limpiar también erp_shared_data si existe
      try {
        const sharedDataRef = window.fs.collection(window.firebaseDb, 'erp_shared_data');
        let sharedSnapshot;

        try {
          const q = window.fs.query(sharedDataRef, window.fs.where('tenantId', '==', tenantId));
          sharedSnapshot = await window.fs.getDocs(q);
        } catch (error) {
          sharedSnapshot = await window.fs.getDocs(sharedDataRef);
        }

        // Si no encontró nada con el filtro, buscar sin filtro
        if (sharedSnapshot.empty) {
          console.log(
            `🔍 No se encontraron registros en erp_shared_data con tenantId ${tenantId}, buscando todos...`
          );
          sharedSnapshot = await window.fs.getDocs(sharedDataRef);
        }

        if (!sharedSnapshot.empty) {
          const { docs } = sharedSnapshot;
          console.log(`🗑️ Eliminando ${docs.length} documentos de erp_shared_data...`);

          // Usar Promise.all para eliminar en paralelo (máximo 50 a la vez)
          const batchSize = 50;
          for (let i = 0; i < docs.length; i += batchSize) {
            const batchDocs = docs.slice(i, i + batchSize);
            const deletePromises = batchDocs.map(doc =>
              window.fs.deleteDoc(doc.ref).catch(error => {
                console.warn(`⚠️ Error eliminando documento ${doc.id}:`, error);
                return null; // Continuar aunque falle uno
              })
            );

            await Promise.all(deletePromises);
            console.log(
              `✅ Eliminados ${Math.min(i + batchSize, docs.length)}/${docs.length} documentos de erp_shared_data`
            );
          }

          console.log(`✅ ${sharedSnapshot.docs.length} documentos eliminados de erp_shared_data`);
          totalEliminadosFirebase += sharedSnapshot.docs.length;
        }
      } catch (error) {
        console.warn('⚠️ Error limpiando erp_shared_data:', error);
      }

      console.log(`✅ Total eliminados de Firebase: ${totalEliminadosFirebase} documentos`);

      // Verificar que los documentos fueron eliminados (esperar un poco para que Firebase procese)
      console.log('🔍 Verificando que los documentos fueron eliminados...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      let aunExisten = 0;

      for (const modulo of modulos) {
        try {
          const collectionRef = window.fs.collection(window.firebaseDb, modulo);
          const snapshot = await window.fs.getDocs(collectionRef);

          if (!snapshot.empty) {
            console.warn(
              `⚠️ Aún existen ${snapshot.docs.length} documentos en Firebase/${modulo} después de eliminar`
            );
            aunExisten += snapshot.docs.length;

            // Intentar eliminar nuevamente los que quedaron
            const deletePromises = snapshot.docs.map(async doc => {
              try {
                await window.fs.deleteDoc(doc.ref);
                const docSnap = await window.fs.getDoc(doc.ref);
                if (!docSnap.exists()) {
                  return true;
                }
              } catch (e) {
                console.warn(`⚠️ Error eliminando ${doc.id} en segundo intento:`, e);
              }
              return false;
            });

            const resultados = await Promise.all(deletePromises);
            const eliminados = resultados.filter(r => r).length;
            console.log(`✅ ${eliminados} documentos adicionales eliminados de Firebase/${modulo}`);
          } else {
            console.log(`✅ Firebase/${modulo} está completamente limpio`);
          }
        } catch (error) {
          console.warn(`⚠️ Error verificando Firebase/${modulo}:`, error);
        }
      }

      if (aunExisten > 0) {
        console.warn(
          `⚠️ Advertencia: Aún existen ${aunExisten} documentos en Firebase después de la limpieza`
        );
      } else {
        console.log('✅ Verificación completada: Todos los módulos están limpios');
      }

      // NO sincronizar después de limpiar - esto podría restaurar datos desde localStorage
      // En su lugar, asegurarse de que localStorage esté limpio
      console.log(
        '⚠️ Sincronización automática deshabilitada después de limpieza para evitar restauración de datos'
      );
    } else {
      console.warn('⚠️ Firebase no está disponible');
    }

    // 2. Limpiar de localStorage
    console.log('💾 Limpiando datos de localStorage...');

    const keysToDelete = [
      // Logística
      'erp_logistica',
      'erp_logistica_registros',
      'erp_logistica_data',
      'erp_shared_data',
      // Tráfico
      'erp_trafico',
      'erp_trafico_data',
      // Facturación
      'erp_facturacion',
      'erp_facturacion_data',
      // Operadores
      'erp_operadores',
      'erp_operadores_gastos',
      'erp_operadores_incidencias',
      'erp_operadores_data',
      // Diesel
      'erp_diesel',
      'erp_diesel_movimientos',
      'erp_diesel_data',
      // Mantenimiento
      'erp_mantenimiento',
      'erp_mantenimiento_data',
      // Tesorería
      'erp_tesoreria',
      'erp_tesoreria_movimientos',
      'erp_tesoreria_data',
      // CXC
      'erp_cxc',
      'erp_cxc_data',
      'erp_cxc_facturas',
      // CXP
      'erp_cxp',
      'erp_cxp_data',
      'erp_cxp_facturas',
      // Inventario
      'erp_inventario',
      'erp_inv',
      'erp_inv_refacciones',
      'erp_inv_refacciones_movs',
      'erp_inventario_data',
      // Contadores
      'erp_logistica_contador',
      'erp_facturacion_contador',
      'erp_trafico_contador',
      'erp_cxp_contador',
      'erp_cxc_contador',
      'erp_tesoreria_contador',
      'erp_diesel_contador',
      'erp_mantenimiento_contador',
      'erp_inv_contador',
      // Números de registro
      'registrationNumbers',
      'activeRegistrationNumber'
    ];

    keysToDelete.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        totalEliminadosLocalStorage++;
        console.log(`🗑️ Eliminado de localStorage: ${key}`);
      }
    });

    // Limpiar cualquier otra clave que empiece con 'erp_' (excepto las de configuración)
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      // Excluir solo las claves de configuración, pero incluir operadores_gastos e incidencias
      if (
        key.startsWith('erp_') &&
        !key.includes('configuracion') &&
        !key.includes('economicos') &&
        !key.includes('operadores_lista') && // Mantener la lista de operadores (configuración)
        !key.includes('clientes') &&
        !key.includes('proveedores') &&
        !key.includes('estancias') &&
        !key.includes('almacenes') &&
        !key.includes('usuarios')
      ) {
        localStorage.removeItem(key);
        totalEliminadosLocalStorage++;
        console.log(`🗑️ Eliminado adicional de localStorage: ${key}`);
      }
    });

    console.log(`✅ Total eliminados de localStorage: ${totalEliminadosLocalStorage} claves`);

    // Marcar que se limpiaron los datos operativos para evitar sincronización automática
    localStorage.setItem('datos_operativos_limpiados', 'true');
    console.log(
      '🏷️ Marcado: datos operativos limpiados (sincronización automática deshabilitada temporalmente)'
    );

    // 3. Resetear contador a 2500001
    console.log('🔄 Reseteando contador a 2500001...');
    if (typeof window.resetRegistrationCounter === 'function') {
      // Llamar a la función de reset pero sin confirmación adicional
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);
      const targetNumber = 1;
      const newNumber = `${yearSuffix}${String(targetNumber).padStart(5, '0')}`;

      localStorage.setItem('activeRegistrationNumber', newNumber);
      localStorage.removeItem('registrationNumbers');

      if (window.saveNumberToHistory) {
        window.saveNumberToHistory(newNumber);
      }

      // Actualizar en Firebase si está disponible
      if (window.firebaseDb && window.fs && window.firebaseAuth?.currentUser) {
        try {
          const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          const activeRef = window.fs.doc(
            window.firebaseDb,
            'system',
            `${demoTenantId}_active_number`
          );
          await window.fs.setDoc(activeRef, {
            number: newNumber,
            createdAt: new Date().toISOString(),
            tenantId: demoTenantId
          });
          console.log('✅ Contador actualizado en Firebase');
        } catch (error) {
          console.warn('⚠️ Error actualizando contador en Firebase:', error);
        }
      }

      console.log(`✅ Contador reseteado a ${newNumber}`);
    } else {
      console.warn('⚠️ Función resetRegistrationCounter no disponible');
    }

    // Resumen final
    const mensaje =
      '✅ Limpieza completada exitosamente\n\n' +
      '📊 Resumen:\n' +
      `• Firebase: ${totalEliminadosFirebase} documentos eliminados\n` +
      `• localStorage: ${totalEliminadosLocalStorage} claves eliminadas\n` +
      '• Contador reseteado a 2500001\n\n' +
      'La página se recargará automáticamente.';

    alert(mensaje);
    console.log('✅ Limpieza completa finalizada');

    // Recargar la página
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    alert(`❌ Error durante la limpieza: ${error.message}\n\nRevisa la consola para más detalles.`);
  }
};

console.log('✅ Función limpiarTodosLosDatosOperativos() definida');
