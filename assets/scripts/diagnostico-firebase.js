// Diagnóstico completo de Firebase - TitanFleet ERP
// Esta función ayuda a identificar problemas de carga de datos en diferentes computadoras

window.diagnosticarFirebaseCompleto = async function () {
  console.log('🔍 === DIAGNÓSTICO COMPLETO DE FIREBASE ===');
  console.log('📅 Fecha/Hora:', new Date().toISOString());
  console.log('🌐 Navegador:', navigator.userAgent);
  console.log('🔗 URL:', window.location.href);

  const diagnosticos = {
    firebaseV10: {},
    autenticacion: {},
    repositorios: {},
    datos: {},
    red: {},
    errores: []
  };

  // 1. Verificar Firebase v10
  console.log('\n📊 1. VERIFICACIÓN DE FIREBASE V10:');
  diagnosticos.firebaseV10 = {
    firebaseDb: typeof window.firebaseDb,
    firebaseAuth: typeof window.firebaseAuth,
    fs: typeof window.fs,
    firebaseConfig: typeof window.firebaseConfig,
    firebaseApp: typeof window.firebaseApp
  };

  console.log(
    '  - window.firebaseDb:',
    diagnosticos.firebaseV10.firebaseDb,
    window.firebaseDb ? '✅' : '❌'
  );
  console.log(
    '  - window.firebaseAuth:',
    diagnosticos.firebaseV10.firebaseAuth,
    window.firebaseAuth ? '✅' : '❌'
  );
  console.log('  - window.fs:', diagnosticos.firebaseV10.fs, window.fs ? '✅' : '❌');
  console.log(
    '  - window.firebaseConfig:',
    diagnosticos.firebaseV10.firebaseConfig,
    window.firebaseConfig ? '✅' : '❌'
  );

  // Verificar funciones específicas de Firebase v10
  if (window.fs) {
    console.log('\n📊 Funciones de window.fs:');
    const funciones = [
      'doc',
      'setDoc',
      'getDoc',
      'deleteDoc',
      'collection',
      'getDocs',
      'query',
      'where',
      'onSnapshot'
    ];
    funciones.forEach(fn => {
      const existe = typeof window.fs[fn] === 'function';
      console.log(`  - fs.${fn}:`, existe ? '✅' : '❌');
    });
  }

  // 2. Verificar autenticación
  console.log('\n📊 2. VERIFICACIÓN DE AUTENTICACIÓN:');
  if (window.firebaseAuth) {
    const { currentUser } = window.firebaseAuth;
    diagnosticos.autenticacion = {
      tieneAuth: true,
      currentUser: currentUser
        ? {
          uid: currentUser.uid,
          isAnonymous: currentUser.isAnonymous,
          email: currentUser.email || 'N/A'
        }
        : null,
      onAuthReady: typeof window.__onAuthReady
    };

    console.log(
      '  - Usuario actual:',
      currentUser
        ? `✅ ${currentUser.uid} (${currentUser.isAnonymous ? 'Anónimo' : 'Email'})`
        : '❌ No hay usuario'
    );
    console.log(
      '  - __onAuthReady:',
      typeof window.__onAuthReady,
      window.__onAuthReady ? '✅' : '❌'
    );

    // Intentar obtener el usuario de __onAuthReady
    if (window.__onAuthReady) {
      try {
        const user = await Promise.race([
          window.__onAuthReady,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        console.log('  - Usuario de __onAuthReady:', user ? `✅ ${user.uid}` : '❌ No disponible');
      } catch (e) {
        console.warn('  - ⚠️ Error obteniendo usuario de __onAuthReady:', e.message);
      }
    }
  } else {
    diagnosticos.autenticacion = { tieneAuth: false };
    console.log('  - ❌ window.firebaseAuth no está disponible');
  }

  // 3. Verificar repositorios
  console.log('\n📊 3. VERIFICACIÓN DE REPOSITORIOS:');
  diagnosticos.repositorios = {
    tieneRepos: typeof window.firebaseRepos === 'object',
    reposDisponibles: []
  };

  if (window.firebaseRepos) {
    const repositorios = [
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
    repositorios.forEach(repoName => {
      const repo = window.firebaseRepos[repoName];
      if (repo) {
        const estado = {
          nombre: repoName,
          tieneDb: Boolean(repo.db),
          tieneTenantId: Boolean(repo.tenantId),
          tenantId: repo.tenantId || 'N/A',
          tieneDoc: typeof repo.doc === 'function',
          tieneGetAll: typeof repo.getAll === 'function',
          tieneGetAllRegistros: typeof repo.getAllRegistros === 'function',
          firebaseUnavailable: repo._firebaseUnavailable || false
        };
        diagnosticos.repositorios.reposDisponibles.push(estado);

        console.log(`  - ${repoName}:`, {
          db: estado.tieneDb ? '✅' : '❌',
          tenantId: estado.tieneTenantId ? `✅ (${estado.tenantId})` : '❌',
          doc: estado.tieneDoc ? '✅' : '❌',
          getAll: estado.tieneGetAll ? '✅' : '❌',
          getAllRegistros: estado.tieneGetAllRegistros ? '✅' : '❌',
          firebaseUnavailable: estado.firebaseUnavailable ? '⚠️' : '✅'
        });
      } else {
        console.log(`  - ${repoName}: ❌ No disponible`);
      }
    });
  } else {
    console.log('  - ❌ window.firebaseRepos no está disponible');
  }

  // 4. Verificar datos en localStorage
  console.log('\n📊 4. VERIFICACIÓN DE DATOS EN LOCALSTORAGE:');
  const storageKeys = [
    'erp_shared_data',
    'erp_logistica',
    'erp_trafico',
    'erp_facturacion',
    'erp_operadores',
    'erp_diesel',
    'erp_mantenimiento',
    'erp_tesoreria',
    'erp_cxc',
    'erp_cxp',
    'erp_inventario',
    'erpCurrentUser'
  ];

  diagnosticos.datos = {
    keys: {}
  };

  storageKeys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const count = Array.isArray(parsed)
          ? parsed.length
          : typeof parsed === 'object'
            ? Object.keys(parsed).length
            : 0;
        diagnosticos.datos.keys[key] = { existe: true, count };
        console.log(`  - ${key}: ✅ ${count} items`);
      } catch (e) {
        diagnosticos.datos.keys[key] = { existe: true, error: 'No parseable' };
        console.log(`  - ${key}: ⚠️ Existe pero no es JSON válido`);
      }
    } else {
      diagnosticos.datos.keys[key] = { existe: false };
      console.log(`  - ${key}: ❌ No existe`);
    }
  });

  // 5. Verificar conectividad de red
  console.log('\n📊 5. VERIFICACIÓN DE CONECTIVIDAD:');
  diagnosticos.red = {
    online: navigator.onLine,
    connection: navigator.connection
      ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      }
      : null
  };

  console.log('  - Estado online:', navigator.onLine ? '✅' : '❌');
  if (navigator.connection) {
    console.log('  - Tipo de conexión:', navigator.connection.effectiveType);
    console.log('  - Velocidad:', navigator.connection.downlink, 'Mbps');
  }

  // 6. Intentar una prueba de lectura de Firebase
  console.log('\n📊 6. PRUEBA DE LECTURA DE FIREBASE:');
  if (
    window.firebaseRepos?.logistica &&
    window.firebaseRepos.logistica.db &&
    window.firebaseRepos.logistica.tenantId
  ) {
    try {
      console.log('  - Intentando leer datos de logística desde Firebase...');
      const startTime = Date.now();
      const datos = await window.firebaseRepos.logistica.getAll();
      const endTime = Date.now();
      const tiempo = endTime - startTime;

      console.log(`  - ✅ Lectura exitosa: ${datos.length} registros en ${tiempo}ms`);
      diagnosticos.datos.pruebaFirebase = {
        exito: true,
        registros: datos.length,
        tiempo: tiempo
      };
    } catch (error) {
      console.error('  - ❌ Error leyendo de Firebase:', error);
      diagnosticos.datos.pruebaFirebase = {
        exito: false,
        error: error.message,
        code: error.code
      };
      diagnosticos.errores.push({
        tipo: 'Lectura Firebase',
        error: error.message,
        code: error.code
      });
    }
  } else {
    console.log('  - ⚠️ No se puede probar: repositorio de logística no está inicializado');
    diagnosticos.datos.pruebaFirebase = {
      exito: false,
      error: 'Repositorio no inicializado'
    };
  }

  // 7. Verificar errores en consola
  console.log('\n📊 7. RESUMEN DE ERRORES:');
  if (diagnosticos.errores.length > 0) {
    diagnosticos.errores.forEach((err, index) => {
      console.log(`  ${index + 1}. ${err.tipo}: ${err.error} (${err.code || 'N/A'})`);
    });
  } else {
    console.log('  - ✅ No se encontraron errores críticos');
  }

  // 8. Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  const recomendaciones = [];

  if (!window.firebaseDb) {
    recomendaciones.push('❌ Firebase no está inicializado. Recarga la página.');
  }

  if (!window.firebaseAuth?.currentUser && !window.__onAuthReady) {
    recomendaciones.push(
      '❌ No hay autenticación. Verifica que firebase-force.js se esté cargando.'
    );
  }

  if (window.firebaseRepos) {
    const reposSinTenant = diagnosticos.repositorios.reposDisponibles.filter(r => !r.tieneTenantId);
    if (reposSinTenant.length > 0) {
      recomendaciones.push(
        `⚠️ ${reposSinTenant.length} repositorios sin tenantId. Intenta recargar la página.`
      );
    }
  }

  if (!navigator.onLine) {
    recomendaciones.push('❌ No hay conexión a internet. Verifica tu conexión.');
  }

  if (diagnosticos.datos.pruebaFirebase && !diagnosticos.datos.pruebaFirebase.exito) {
    recomendaciones.push(
      '❌ No se pudo leer de Firebase. Verifica las reglas de Firestore y la conexión.'
    );
  }

  if (recomendaciones.length === 0) {
    recomendaciones.push('✅ Todo parece estar funcionando correctamente.');
  }

  recomendaciones.forEach(rec => console.log(`  ${rec}`));

  console.log('\n🔍 === FIN DIAGNÓSTICO ===');

  // Retornar objeto de diagnóstico para uso programático
  return diagnosticos;
};

// Función para intentar reparar problemas comunes
window.repararFirebase = async function () {
  console.log('🔧 === INTENTANDO REPARAR FIREBASE ===');

  // 1. Intentar inicializar Firebase si no está disponible
  if (!window.firebaseDb && typeof window.intentarCargarFirebaseV10 === 'function') {
    console.log('📦 Intentando cargar Firebase v10...');
    try {
      const ok = await window.intentarCargarFirebaseV10();
      if (ok) {
        console.log('✅ Firebase v10 cargado exitosamente');
      } else {
        console.error('❌ No se pudo cargar Firebase v10');
      }
    } catch (e) {
      console.error('❌ Error cargando Firebase v10:', e);
    }
  }

  // 2. Intentar reinicializar repositorios
  if (window.firebaseRepos && window.fs && window.firebaseDb) {
    console.log('🔄 Reinicializando repositorios...');
    Object.values(window.firebaseRepos).forEach(async repo => {
      if (repo && typeof repo.init === 'function') {
        try {
          await repo.init();
          console.log(`✅ Repositorio ${repo.collectionName} reinicializado`);
        } catch (e) {
          console.error(`❌ Error reinicializando ${repo.collectionName}:`, e);
        }
      }
    });
  }

  // 3. Limpiar cache problemático
  console.log('🧹 Limpiando cache problemático...');
  try {
    // No limpiar todo, solo verificar
    console.log('✅ Cache verificado (no se limpió nada)');
  } catch (e) {
    console.error('❌ Error limpiando cache:', e);
  }

  console.log('🔧 === FIN REPARACIÓN ===');
  console.log('💡 Recarga la página si los problemas persisten.');
};

// Función para intentar cargar Firebase v10 manualmente
window.intentarCargarFirebaseV10 = async function () {
  console.log('🔄 === INTENTANDO CARGAR FIREBASE V10 ===');

  try {
    // Verificar si ya está cargado
    if (window.fs && window.fs.doc && window.firebaseDb) {
      console.log('✅ Firebase v10 ya está disponible');
      return true;
    }

    // Intentar cargar desde CDN
    console.log('📦 Cargando Firebase v10 desde CDN...');

    // Importar Firebase v10
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
    let firebaseConfig;
    const existingApps = getApps();
    if (existingApps.length > 0) {
      // Si ya hay una app inicializada, usar la existente
      app = getApp();
      firebaseConfig = window.firebaseConfig;
      console.log('✅ Usando instancia de Firebase existente');
    } else {
      // Usar configuración existente o la del sistema
      firebaseConfig = window.firebaseConfig || {
        apiKey: 'AIzaSyBh_x0zUdauLERfWn-LMC2xnbxftfTXhhg',
        authDomain: 'titanfleet-60931.firebaseapp.com',
        databaseURL: 'https://titanfleet-60931-default-rtdb.firebaseio.com',
        projectId: 'titanfleet-60931',
        storageBucket: 'titanfleet-60931.firebasestorage.app',
        messagingSenderId: '638195392578',
        appId: '1:638195392578:web:4afc3e07bf448dedb60ddb',
        measurementId: 'G-LB745PEHGV'
      };

      // Inicializar Firebase solo si no existe
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase v10 inicializado (nueva instancia)');
    }
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Asignar a window (solo si no están ya definidos)
    if (!window.fs) {
      window.fs = { doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, where, onSnapshot };
    }
    if (!window.firebaseDb) {
      window.firebaseDb = db;
    }
    if (!window.firebaseAuth) {
      window.firebaseAuth = auth;
    }
    if (!window.firebaseConfig && firebaseConfig) {
      window.firebaseConfig = firebaseConfig;
    }
    if (!window.firebaseApp) {
      window.firebaseApp = app;
    }

    console.log('✅ Firebase v10 disponible');

    // Intentar autenticación anónima
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
        console.log('✅ Autenticación anónima exitosa');
      } catch (authErr) {
        console.warn('⚠️ No se pudo autenticar anónimamente:', authErr);
      }
    }

    // Crear promesa de autenticación
    window.__onAuthReady = new Promise(resolve => {
      onAuthStateChanged(auth, user => {
        if (user) {
          console.log('✅ Usuario autenticado:', user.uid);
          resolve(user);
        } else {
          resolve(null);
        }
      });
    });

    return true;
  } catch (e) {
    console.error('❌ No se pudo cargar Firebase v10:', e);
    return false;
  }
};
