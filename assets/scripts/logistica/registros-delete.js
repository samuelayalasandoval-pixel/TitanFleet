/**
 * Eliminación de Registros de Logística - logistica.html
 * Operaciones de eliminación: Eliminar registros de Firebase y localStorage
 */

(function () {
  'use strict';

  // ============================================================
  // FUNCIÓN: Eliminar un registro con confirmación
  // ============================================================
  window.eliminarRegistroLogistica = async function (regId) {
    console.log(`🗑️ Eliminando registro de Logística: ${regId}`);

    const confirmacion = confirm(
      `¿Estás seguro de que deseas eliminar el registro ${regId}?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmacion) {
      console.log('❌ Eliminación cancelada por el usuario');
      return;
    }

    try {
      let _eliminado = false;
      let eliminadoFirebase = false;

      // 1. Eliminar de Firebase (físicamente)
      if (window.firebaseDb && window.fs) {
        try {
          console.log(`🔍 Buscando registro ${regId} en Firebase para eliminación física...`);

          const posiblesIds = [regId, `${regId}`, `registro_${regId}`, `logistica_${regId}`];

          for (const docId of posiblesIds) {
            try {
              const docRef = window.fs.doc(window.firebaseDb, 'logistica', docId);
              const docSnap = await window.fs.getDoc(docRef);

              if (docSnap.exists()) {
                await window.fs.deleteDoc(docRef);
                console.log(`✅ Registro ${docId} eliminado físicamente de Firebase`);
                eliminadoFirebase = true;
                _eliminado = true;
                break;
              }
            } catch (e) {
              continue;
            }
          }

          if (!eliminadoFirebase) {
            try {
              console.log("🔍 Buscando en toda la colección 'logistica' sin filtro de tenantId...");
              const collectionRef = window.fs.collection(window.firebaseDb, 'logistica');
              const snapshot = await window.fs.getDocs(collectionRef);

              console.log(`📊 Total de documentos en colección logistica: ${snapshot.docs.length}`);

              for (const doc of snapshot.docs) {
                const data = doc.data();
                const docId = doc.id;

                const regIdStr = String(regId);
                const numeroRegistroStr = data.numeroRegistro ? String(data.numeroRegistro) : '';
                const idStr = data.id ? String(data.id) : '';
                const registroIdStr = data.registroId ? String(data.registroId) : '';
                const docIdStr = String(docId);

                if (
                  numeroRegistroStr === regIdStr ||
                  idStr === regIdStr ||
                  registroIdStr === regIdStr ||
                  docIdStr === regIdStr ||
                  docIdStr.includes(regIdStr) ||
                  numeroRegistroStr.includes(regIdStr)
                ) {
                  console.log(
                    `🎯 Documento encontrado: ID=${docId}, numeroRegistro=${data.numeroRegistro}`
                  );
                  await window.fs.deleteDoc(doc.ref);
                  console.log(
                    `✅ Registro ${regId} encontrado y eliminado físicamente de Firebase (ID del doc: ${docId})`
                  );
                  eliminadoFirebase = true;
                  _eliminado = true;
                  break;
                }
              }

              if (!eliminadoFirebase) {
                console.warn(`⚠️ Registro ${regId} no encontrado en ninguna colección de Firebase`);
              }
            } catch (e) {
              console.warn('⚠️ Error buscando en toda la colección:', e);
              console.error('❌ Detalles del error:', e.message, e.stack);
            }
          }

          if (!eliminadoFirebase) {
            try {
              console.log("🔍 Buscando en colección 'erp_shared_data'...");
              const sharedCollectionRef = window.fs.collection(
                window.firebaseDb,
                'erp_shared_data'
              );
              const sharedSnapshot = await window.fs.getDocs(sharedCollectionRef);

              for (const doc of sharedSnapshot.docs) {
                const data = doc.data();
                if (data.registros && typeof data.registros === 'object') {
                  const regIdStr = String(regId);
                  if (
                    data.registros[regIdStr] ||
                    Object.keys(data.registros).some(key => key.includes(regIdStr))
                  ) {
                    if (data.registros[regIdStr]) {
                      delete data.registros[regIdStr];
                      await window.fs.setDoc(doc.ref, data, { merge: true });
                      console.log(`✅ Registro ${regId} eliminado de erp_shared_data/${doc.id}`);
                      eliminadoFirebase = true;
                      _eliminado = true;
                      break;
                    }
                  }
                }
              }
            } catch (e) {
              console.warn('⚠️ Error buscando en erp_shared_data:', e);
            }
          }

          if (!eliminadoFirebase) {
            console.warn(`⚠️ No se encontró el registro ${regId} en Firebase para eliminar`);
          }
        } catch (error) {
          console.error('❌ Error eliminando de Firebase:', error);
          console.error('❌ Detalles del error:', error.message, error.stack);
        }
      } else {
        console.warn('⚠️ Firebase no está disponible (firebaseDb o fs no disponibles)');
      }

      // NO USAR localStorage - Solo Firebase es la fuente de verdad
      // Eliminado eliminación de localStorage para evitar inconsistencias entre navegadores
      // El registro solo existe en Firebase ahora

      // 3. Eliminar de registrationNumbers
      try {
        const registrationNumbers = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
        const filtrado = registrationNumbers.filter(item => item.number !== regId);
        if (filtrado.length < registrationNumbers.length) {
          localStorage.setItem('registrationNumbers', JSON.stringify(filtrado));
          console.log(`✅ Número de registro ${regId} eliminado de registrationNumbers`);
        }
      } catch (e) {
        console.warn('⚠️ Error eliminando de registrationNumbers:', e);
      }

      // 4. Usar método del repositorio
      if (window.firebaseRepos && window.firebaseRepos.logistica) {
        try {
          const repoLogistica = window.firebaseRepos.logistica;

          let attempts = 0;
          while (attempts < 10 && (!repoLogistica.db || !repoLogistica.tenantId)) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 300));
            if (typeof repoLogistica.init === 'function') {
              try {
                await repoLogistica.init();
              } catch (e) {
                // Ignorar error intencionalmente
              }
            }
          }

          if (repoLogistica.db && repoLogistica.tenantId) {
            const resultado = await repoLogistica.delete(regId);
            if (resultado) {
              console.log(`✅ Registro ${regId} eliminado usando método del repositorio`);
              eliminadoFirebase = true;
            }
          }
        } catch (e) {
          console.warn('⚠️ Error usando método del repositorio:', e);
          try {
            const docRef = window.fs.doc(window.firebaseDb, 'logistica', regId);
            const docSnap = await window.fs.getDoc(docRef);
            if (docSnap.exists()) {
              await window.fs.deleteDoc(docRef);
              console.log(`✅ Registro ${regId} eliminado directamente`);
              eliminadoFirebase = true;
            }
          } catch (e2) {
            console.warn('⚠️ Error eliminando directamente:', e2);
          }
        }
      }

      // 5. Limpiar caché local
      try {
        const key = 'erp_logistica';
        const cacheData = JSON.parse(localStorage.getItem(key) || '{}');
        if (typeof cacheData === 'object' && cacheData[regId]) {
          delete cacheData[regId];
          localStorage.setItem(key, JSON.stringify(cacheData));
          console.log(`✅ Registro ${regId} eliminado del caché erp_logistica`);
        }

        const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
        if (sharedData.registros && sharedData.registros[regId]) {
          delete sharedData.registros[regId];
          localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));
          console.log(`✅ Registro ${regId} eliminado de erp_shared_data`);
        }
      } catch (e) {
        console.warn('⚠️ Error limpiando caché local:', e);
      }

      // Verificar resultado
      if (eliminadoFirebase && eliminadoLocal) {
        alert(`✅ Registro ${regId} eliminado exitosamente (Firebase + localStorage)`);
      } else if (eliminadoFirebase) {
        alert(`✅ Registro ${regId} eliminado de Firebase (no encontrado en localStorage)`);
      } else if (eliminadoLocal) {
        alert(`✅ Registro ${regId} eliminado de localStorage (no encontrado en Firebase)`);
      } else {
        alert('⚠️ No se pudo encontrar el registro para eliminar');
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      await window.cargarRegistrosLogistica();
    } catch (error) {
      console.error('❌ Error eliminando registro:', error);
      alert(`Error al eliminar el registro: ${error.message}`);
    }
  };

  console.log('✅ Módulo registros-delete.js cargado');
})();
