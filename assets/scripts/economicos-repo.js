// Firestore repository for Económicos
// Compatible with both Firebase v8 and v10

(function () {
  const ensure = () => {
    // Verificar Firebase v10 primero, luego v8
    if (window.fs && window.firebaseDb) {
      return 'v10';
    }
    if (window.firebase && window.firebase.db) {
      return 'v8';
    }
    throw new Error('Firebase not initialized');
  };

  function getTenantId() {
    try {
      const current = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
      return current?.tenantId || localStorage.getItem('tenantId') || 'demo';
    } catch (_) {
      return 'demo';
    }
  }

  async function getAllEconomicos() {
    const version = ensure();
    const tenantId = getTenantId();

    if (version === 'v10') {
      // Firebase v10 - Usar configuracion/tractocamiones (estructura nueva)
      try {
        const docRef = window.fs.doc(window.firebaseDb, 'configuracion', 'tractocamiones');
        const doc = await window.fs.getDoc(docRef);

        if (doc.exists()) {
          const data = doc.data();
          if (data.economicos && Array.isArray(data.economicos)) {
            // Filtrar por tenantId y deleted
            return data.economicos
              .filter(e => (!e.tenantId || e.tenantId === tenantId) && e.deleted !== true)
              .map(e => ({ id: e.numero?.toString() || e.id, ...e }));
          }
        }
        return [];
      } catch (error) {
        console.warn('⚠️ Error cargando económicos desde configuracion/tractocamiones:', error);
        return [];
      }
    } else {
      // Firebase v8 - Usar configuracion/tractocamiones (estructura nueva)
      try {
        const doc = await window.firebase.db
          .collection('configuracion')
          .doc('tractocamiones')
          .get();
        if (doc.exists && doc.data().economicos) {
          const economicos = doc.data().economicos || [];
          return economicos
            .filter(e => (!e.tenantId || e.tenantId === tenantId) && e.deleted !== true)
            .map(e => ({ id: e.numero?.toString() || e.id, ...e }));
        }
        return [];
      } catch (error) {
        console.warn('⚠️ Error cargando económicos desde configuracion/tractocamiones:', error);
        return [];
      }
    }
  }

  async function saveEconomicoCloud(e) {
    const version = ensure();
    const tenantId = getTenantId();
    const payload = {
      ...e,
      numero: e.numero || e.economico,
      tenantId,
      deleted: false,
      updatedAt: new Date().toISOString()
    };

    if (version === 'v10') {
      // Firebase v10 - Usar configuracion/tractocamiones (estructura nueva)
      try {
        const docRef = window.fs.doc(window.firebaseDb, 'configuracion', 'tractocamiones');
        const doc = await window.fs.getDoc(docRef);

        let economicosArray = [];
        if (doc.exists()) {
          const data = doc.data();
          economicosArray = data.economicos || [];
        }

        // Buscar si ya existe
        const existingIndex = economicosArray.findIndex(eco => eco.numero === payload.numero);
        if (existingIndex >= 0) {
          economicosArray[existingIndex] = payload;
        } else {
          economicosArray.push(payload);
        }

        await window.fs.setDoc(
          docRef,
          {
            economicos: economicosArray,
            tenantId: tenantId,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );

        // Invalidar caché de economicos después de guardar
        if (window.invalidateCache) {
          window.invalidateCache('economicos');
          console.log('🗑️ Caché de economicos invalidado después de guardar (economicos-repo)');
        }

        return true;
      } catch (error) {
        console.error('❌ Error guardando económico en configuracion/tractocamiones:', error);
        return false;
      }
    } else {
      // Firebase v8 - Usar configuracion/tractocamiones (estructura nueva)
      try {
        const docRef = window.firebase.db.collection('configuracion').doc('tractocamiones');
        const doc = await docRef.get();

        let economicosArray = [];
        if (doc.exists && doc.data().economicos) {
          economicosArray = doc.data().economicos || [];
        }

        const existingIndex = economicosArray.findIndex(eco => eco.numero === payload.numero);
        if (existingIndex >= 0) {
          economicosArray[existingIndex] = payload;
        } else {
          economicosArray.push(payload);
        }

        await docRef.set(
          {
            economicos: economicosArray,
            tenantId: tenantId,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );

        // Invalidar caché de economicos después de guardar
        if (window.invalidateCache) {
          window.invalidateCache('economicos');
          console.log('🗑️ Caché de economicos invalidado después de guardar (economicos-repo v8)');
        }

        return true;
      } catch (error) {
        console.error('❌ Error guardando económico en configuracion/tractocamiones:', error);
        return false;
      }
    }
  }

  async function deleteEconomicoCloud(numero) {
    const version = ensure();
    const tenantId = getTenantId();

    if (version === 'v10') {
      // Firebase v10 - Usar configuracion/tractocamiones (estructura nueva)
      try {
        const docRef = window.fs.doc(window.firebaseDb, 'configuracion', 'tractocamiones');
        const doc = await window.fs.getDoc(docRef);

        if (doc.exists()) {
          const data = doc.data();
          const economicosArray = data.economicos || [];

          // Marcar como eliminado
          const index = economicosArray.findIndex(
            eco => eco.numero === numero || eco.numero?.toString() === numero.toString()
          );
          if (index >= 0) {
            economicosArray[index] = {
              ...economicosArray[index],
              deleted: true,
              updatedAt: new Date().toISOString()
            };

            await window.fs.setDoc(
              docRef,
              {
                economicos: economicosArray,
                tenantId: tenantId,
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            );
          }
        }
        return true;
      } catch (error) {
        console.error('❌ Error eliminando económico de configuracion/tractocamiones:', error);
        return false;
      }
    } else {
      // Firebase v8 - Usar configuracion/tractocamiones (estructura nueva)
      try {
        const docRef = window.firebase.db.collection('configuracion').doc('tractocamiones');
        const doc = await docRef.get();

        if (doc.exists && doc.data().economicos) {
          const economicosArray = doc.data().economicos || [];

          const index = economicosArray.findIndex(
            eco => eco.numero === numero || eco.numero?.toString() === numero.toString()
          );
          if (index >= 0) {
            economicosArray[index] = {
              ...economicosArray[index],
              deleted: true,
              updatedAt: new Date().toISOString()
            };

            await docRef.set(
              {
                economicos: economicosArray,
                tenantId: tenantId,
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            );
          }
        }
        return true;
      } catch (error) {
        console.error('❌ Error eliminando económico de configuracion/tractocamiones:', error);
        return false;
      }
    }
  }

  function subscribeEconomicos(callback) {
    const version = ensure();
    const tenantId = getTenantId();

    if (version === 'v10') {
      // Firebase v10 - Usar configuracion/tractocamiones (estructura nueva)
      const docRef = window.fs.doc(window.firebaseDb, 'configuracion', 'tractocamiones');
      return window.fs.onSnapshot(docRef, doc => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.economicos && Array.isArray(data.economicos)) {
            const list = data.economicos
              .filter(e => (!e.tenantId || e.tenantId === tenantId) && e.deleted !== true)
              .map(e => ({ id: e.numero?.toString() || e.id, ...e }));
            callback(list);
          } else {
            callback([]);
          }
        } else {
          callback([]);
        }
      });
    }
    // Firebase v8 - Usar configuracion/tractocamiones (estructura nueva)
    return window.firebase.db
      .collection('configuracion')
      .doc('tractocamiones')
      .onSnapshot(doc => {
        if (doc.exists && doc.data().economicos) {
          const economicos = doc.data().economicos || [];
          const list = economicos
            .filter(e => (!e.tenantId || e.tenantId === tenantId) && e.deleted !== true)
            .map(e => ({ id: e.numero?.toString() || e.id, ...e }));
          callback(list);
        } else {
          callback([]);
        }
      });
  }

  window.economicosRepo = {
    getAll: getAllEconomicos,
    save: saveEconomicoCloud,
    delete: deleteEconomicoCloud,
    subscribe: subscribeEconomicos
  };
})();
