// Fuerza uso exclusivo de Firebase v10 en todos los módulos
(function () {
  window.FIREBASE_ONLY = true;

  async function ensureFirebaseV10() {
    try {
      // Si ya hay funciones v10, salir
      if (window.fs && window.fs.doc && window.firebaseDb) {
        return true;
      }

      // Intentar cargar vía inicialización existente
      if (typeof window.intentarCargarFirebaseV10 === 'function') {
        const ok = await window.intentarCargarFirebaseV10();
        return Boolean(ok);
      }

      // Carga directa como respaldo (mismo CDN que usa diagnostico)
      const { initializeApp, getApps, getApp } = await import(
        'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'
      );
      const {
        getFirestore,
        doc,
        setDoc,
        getDoc,
        deleteDoc,
        collection,
        getDocs,
        query,
        where,
        onSnapshot
      } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
      const { getAuth, signInAnonymously, onAuthStateChanged } = await import(
        'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
      );

      // Verificar si Firebase ya está inicializado
      let app;
      const existingApps = getApps();
      if (existingApps.length > 0) {
        // Si ya hay una app inicializada, usar la existente
        app = getApp();
        console.log('✅ firebase-force.js: Usando instancia de Firebase existente');
      } else {
        // Usa la config ya definida por firebase-init.js si existe
        const cfg = window.firebaseConfig || {
          apiKey: 'AIzaSyBh_x0zUdauLERfWn-LMC2xnbxftfTXhhg',
          authDomain: 'titanfleet-60931.firebaseapp.com',
          databaseURL: 'https://titanfleet-60931-default-rtdb.firebaseio.com',
          projectId: 'titanfleet-60931',
          storageBucket: 'titanfleet-60931.firebasestorage.app',
          messagingSenderId: '638195392578',
          appId: '1:638195392578:web:4afc3e07bf448dedb60ddb',
          measurementId: 'G-LB745PEHGV'
        };
        app = initializeApp(cfg);
        console.log('✅ firebase-force.js: Firebase v10 inicializado (nueva instancia)');
      }
      window.firebaseDb = getFirestore(app);
      window.firebaseAuth = getAuth(app);
      window.fs = { doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, where, onSnapshot };

      // Asegurar autenticación anónima (necesaria para reglas de Firestore)
      // Exponer helper de estado SIEMPRE
      window.__onAuthReady = new Promise(async resolve => {
        try {
          if (!window.firebaseAuth.currentUser) {
            await signInAnonymously(window.firebaseAuth);
            console.log('✅ Autenticación anónima exitosa');
          }
          onAuthStateChanged(window.firebaseAuth, user => {
            if (user) {
              console.log('✅ Usuario autenticado:', user.uid);
              resolve(user);
            }
          });
        } catch (authErr) {
          console.warn('⚠️ No se pudo autenticar anónimamente:', authErr);
          resolve(null); // Resolver con null si falla
        }
      });
      return true;
    } catch (e) {
      console.error('❌ No se pudo asegurar Firebase v10:', e);
      return false;
    }
  }

  async function updateRepos() {
    if (typeof window.actualizarRepositoriosConFirebaseV10 === 'function') {
      return window.actualizarRepositoriosConFirebaseV10();
    }
    // Fallback: actualizar campos mínimos si los repos existen
    if (window.firebaseRepos && window.fs && window.firebaseDb) {
      Object.values(window.firebaseRepos).forEach(repo => {
        if (!repo) {
          return;
        }
        repo.doc = window.fs.doc;
        repo.setDoc = window.fs.setDoc;
        repo.getDoc = window.fs.getDoc;
        repo.deleteDoc = window.fs.deleteDoc;
        repo.collection = window.fs.collection;
        repo.getDocs = window.fs.getDocs;
        repo.query = window.fs.query;
        repo.where = window.fs.where;
        repo.db = window.firebaseDb;
        repo._firebaseUnavailable = false;
      });
      return true;
    }
    return false;
  }

  async function boot() {
    const ok = await ensureFirebaseV10();
    if (!ok) {
      return;
    }
    await updateRepos();

    // Crear/actualizar documento de usuario con tenantId
    if (window.__onAuthReady) {
      try {
        const user = await window.__onAuthReady;
        if (user && window.fs && window.firebaseDb) {
          // Para usuarios anónimos, SIEMPRE usar DEMO_CONFIG.tenantId compartido
          // Esto permite que todos los usuarios demo vean los mismos datos
          const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          const userDocRef = window.fs.doc(window.firebaseDb, 'users', user.uid);
          const userDoc = await window.fs.getDoc(userDocRef);

          if (!userDoc.exists()) {
            await window.fs.setDoc(
              userDocRef,
              {
                tenantId: demoTenantId,
                isAnonymous: user.isAnonymous,
                createdAt: new Date().toISOString()
              },
              { merge: true }
            );
            console.log(
              `✅ Documento de usuario creado con tenantId: ${demoTenantId} (anónimo: ${user.isAnonymous})`
            );
          } else {
            // Si el usuario ya existe pero es anónimo, asegurar que use demoTenantId
            if (user.isAnonymous && userDoc.data()?.tenantId !== demoTenantId) {
              await window.fs.setDoc(
                userDocRef,
                {
                  tenantId: demoTenantId,
                  isAnonymous: true
                },
                { merge: true }
              );
              console.log(`✅ Usuario anónimo actualizado a tenantId: ${demoTenantId}`);
            } else {
              console.log(
                `✅ Documento de usuario ya existe con tenantId: ${userDoc.data()?.tenantId}`
              );
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Error creando/actualizando documento de usuario:', e);
      }
    }

    console.log('✅ Firebase-only habilitado');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
