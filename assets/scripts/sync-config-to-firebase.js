// Script para sincronizar datos de configuración a Firebase
// Esto permite que los datos de configuración (tractocamiones, operadores, clientes, etc.)
// estén disponibles en todas las sesiones, incluyendo ventanas de incógnito

window.syncAllConfigToFirebase = async function () {
  console.log('🔄 === INICIANDO SINCRONIZACIÓN DE CONFIGURACIÓN A FIREBASE ===');

  if (!window.firebaseDb || !window.fs) {
    console.error('❌ Firebase no disponible');
    alert('❌ Firebase no está disponible. Asegúrate de estar conectado.');
    return;
  }

  if (!window.firebaseAuth?.currentUser?.isAnonymous) {
    console.warn('⚠️ Esta función está diseñada para usuarios anónimos (demo)');
  }

  let totalSynced = 0;
  const results = {
    economicos: 0,
    operadores: 0,
    clientes: 0,
    proveedores: 0,
    estancias: 0,
    almacenes: 0
  };

  try {
    // 1. SINCRONIZAR ECONÓMICOS (TRACTOCAMIONES)
    console.log('📊 1. Sincronizando económicos...');
    try {
      const economicos = JSON.parse(localStorage.getItem('erp_economicos') || '[]');
      console.log(`   Encontrados ${economicos.length} económicos en localStorage`);

      // Guardar en configuracion/tractocamiones como documento (estructura nueva)
      const tractocamionesDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'tractocamiones'
      );
      const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);

      let economicosArray = [];
      if (tractocamionesDoc.exists()) {
        const data = tractocamionesDoc.data();
        economicosArray = data.economicos || [];
      }

      // Agregar o actualizar económicos
      for (const economico of economicos) {
        const existingIndex = economicosArray.findIndex(
          e => e.numero === economico.numero || e.numero === economico.economico
        );
        if (existingIndex >= 0) {
          economicosArray[existingIndex] = {
            ...economico,
            numero: economico.numero || economico.economico,
            tenantId: window.DEMO_CONFIG?.tenantId || 'demo_tenant',
            syncedAt: new Date().toISOString()
          };
        } else {
          economicosArray.push({
            ...economico,
            numero: economico.numero || economico.economico,
            tenantId: window.DEMO_CONFIG?.tenantId || 'demo_tenant',
            syncedAt: new Date().toISOString()
          });
        }
        results.economicos++;
      }

      // Guardar el documento completo
      await window.fs.setDoc(
        tractocamionesDocRef,
        {
          economicos: economicosArray,
          tenantId: 'demo_tenant',
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // Invalidar caché de economicos después de sincronizar
      if (window.invalidateCache) {
        window.invalidateCache('economicos');
        console.log('   🗑️ Caché de economicos invalidado después de sincronizar');
      }

      console.log(
        `   ✅ ${results.economicos} económicos sincronizados en configuracion/tractocamiones`
      );
    } catch (error) {
      console.error('   ❌ Error sincronizando económicos:', error);
    }

    // 2. SINCRONIZAR OPERADORES
    console.log('📊 2. Sincronizando operadores...');
    try {
      const operadores = JSON.parse(localStorage.getItem('erp_operadores') || '[]');
      console.log(`   Encontrados ${operadores.length} operadores en localStorage`);

      // Guardar en configuracion/operadores como documento (estructura nueva)
      const operadoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
      const operadoresDoc = await window.fs.getDoc(operadoresDocRef);

      let operadoresArray = [];
      if (operadoresDoc.exists()) {
        const data = operadoresDoc.data();
        operadoresArray = data.operadores || [];
      }

      // Agregar o actualizar operadores
      for (const operador of operadores) {
        const existingIndex = operadoresArray.findIndex(o => o.licencia === operador.licencia);
        if (existingIndex >= 0) {
          operadoresArray[existingIndex] = {
            ...operador,
            tenantId: window.DEMO_CONFIG?.tenantId || 'demo_tenant',
            syncedAt: new Date().toISOString()
          };
        } else {
          operadoresArray.push({
            ...operador,
            tenantId: window.DEMO_CONFIG?.tenantId || 'demo_tenant',
            syncedAt: new Date().toISOString()
          });
        }
        results.operadores++;
      }

      // Guardar el documento completo
      await window.fs.setDoc(
        operadoresDocRef,
        {
          operadores: operadoresArray,
          tenantId: 'demo_tenant',
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // Invalidar caché de operadores después de sincronizar
      if (window.invalidateCache) {
        window.invalidateCache('operadores');
        console.log('   🗑️ Caché de operadores invalidado después de sincronizar');
      }

      console.log(
        `   ✅ ${results.operadores} operadores sincronizados en configuracion/operadores`
      );
    } catch (error) {
      console.error('   ❌ Error sincronizando operadores:', error);
    }

    // 3. SINCRONIZAR CLIENTES
    console.log('📊 3. Sincronizando clientes...');
    try {
      const clientes = JSON.parse(localStorage.getItem('erp_clientes') || '[]');
      console.log(`   Encontrados ${clientes.length} clientes en localStorage`);

      // Guardar en configuracion/clientes como documento (igual que operadores, tractocamiones, etc.)
      const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
      const clientesDoc = await window.fs.getDoc(clientesDocRef);

      let clientesArray = [];
      if (clientesDoc.exists()) {
        const data = clientesDoc.data();
        clientesArray = data.clientes || [];
      }

      // Agregar o actualizar clientes
      for (const cliente of clientes) {
        const existingIndex = clientesArray.findIndex(c => c.rfc === cliente.rfc);
        if (existingIndex >= 0) {
          clientesArray[existingIndex] = {
            ...cliente,
            tenantId: window.DEMO_CONFIG?.tenantId || 'demo_tenant',
            syncedAt: new Date().toISOString()
          };
        } else {
          clientesArray.push({
            ...cliente,
            tenantId: window.DEMO_CONFIG?.tenantId || 'demo_tenant',
            syncedAt: new Date().toISOString()
          });
        }
        results.clientes++;
      }

      // Guardar el documento completo
      await window.fs.setDoc(
        clientesDocRef,
        {
          clientes: clientesArray,
          tenantId: 'demo_tenant',
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // Invalidar caché de clientes después de sincronizar
      if (window.invalidateCache) {
        window.invalidateCache('clientes');
        console.log('   🗑️ Caché de clientes invalidado después de sincronizar');
      }

      console.log(`   ✅ ${results.clientes} clientes sincronizados en configuracion/clientes`);
    } catch (error) {
      console.error('   ❌ Error sincronizando clientes:', error);
    }

    // 4. SINCRONIZAR PROVEEDORES
    console.log('📊 4. Sincronizando proveedores...');
    try {
      const proveedores = JSON.parse(localStorage.getItem('erp_proveedores') || '[]');
      console.log(`   Encontrados ${proveedores.length} proveedores en localStorage`);

      // Guardar en configuracion/proveedores como documento (estructura nueva)
      const proveedoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'proveedores');
      const proveedoresDoc = await window.fs.getDoc(proveedoresDocRef);

      let proveedoresArray = [];
      if (proveedoresDoc.exists()) {
        const data = proveedoresDoc.data();
        proveedoresArray = data.proveedores || [];
      }

      // Agregar o actualizar proveedores
      for (const proveedor of proveedores) {
        const existingIndex = proveedoresArray.findIndex(p => p.rfc === proveedor.rfc);
        if (existingIndex >= 0) {
          proveedoresArray[existingIndex] = {
            ...proveedor,
            tenantId: window.DEMO_CONFIG?.tenantId || 'demo_tenant',
            syncedAt: new Date().toISOString()
          };
        } else {
          proveedoresArray.push({
            ...proveedor,
            tenantId: window.DEMO_CONFIG?.tenantId || 'demo_tenant',
            syncedAt: new Date().toISOString()
          });
        }
        results.proveedores++;
      }

      // Guardar el documento completo
      await window.fs.setDoc(
        proveedoresDocRef,
        {
          proveedores: proveedoresArray,
          tenantId: 'demo_tenant',
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // Invalidar caché de proveedores después de sincronizar
      if (window.invalidateCache) {
        window.invalidateCache('proveedores');
        console.log('   🗑️ Caché de proveedores invalidado después de sincronizar');
      }

      console.log(
        `   ✅ ${results.proveedores} proveedores sincronizados en configuracion/proveedores`
      );
    } catch (error) {
      console.error('   ❌ Error sincronizando proveedores:', error);
    }

    // 5. SINCRONIZAR ESTANCIAS
    console.log('📊 5. Sincronizando estancias...');
    try {
      const estancias = JSON.parse(localStorage.getItem('erp_estancias') || '[]');
      console.log(`   Encontrados ${estancias.length} estancias en localStorage`);

      for (const estancia of estancias) {
        const docRef = window.fs.doc(
          window.firebaseDb,
          'estancias',
          estancia.id || estancia.nombre
        );
        await window.fs.setDoc(docRef, {
          ...estancia,
          tenantId: 'demo_tenant',
          syncedAt: new Date().toISOString()
        });
        results.estancias++;
      }

      // Invalidar caché de estancias después de sincronizar
      if (window.invalidateCache) {
        window.invalidateCache('estancias');
        console.log('   🗑️ Caché de estancias invalidado después de sincronizar');
      }

      console.log(`   ✅ ${results.estancias} estancias sincronizadas`);
    } catch (error) {
      console.error('   ❌ Error sincronizando estancias:', error);
    }

    // 6. SINCRONIZAR ALMACENES
    console.log('📊 6. Sincronizando almacenes...');
    try {
      const almacenes = JSON.parse(localStorage.getItem('erp_almacenes') || '[]');
      console.log(`   Encontrados ${almacenes.length} almacenes en localStorage`);

      for (const almacen of almacenes) {
        const docRef = window.fs.doc(window.firebaseDb, 'almacenes', almacen.id || almacen.nombre);
        await window.fs.setDoc(docRef, {
          ...almacen,
          tenantId: 'demo_tenant',
          syncedAt: new Date().toISOString()
        });
        results.almacenes++;
      }
      console.log(`   ✅ ${results.almacenes} almacenes sincronizados`);
    } catch (error) {
      console.error('   ❌ Error sincronizando almacenes:', error);
    }

    // RESUMEN
    totalSynced = Object.values(results).reduce((a, b) => a + b, 0);

    console.log('🎉 === SINCRONIZACIÓN COMPLETADA ===');
    console.log('📊 Resumen:');
    console.log(`   - Económicos: ${results.economicos}`);
    console.log(`   - Operadores: ${results.operadores}`);
    console.log(`   - Clientes: ${results.clientes}`);
    console.log(`   - Proveedores: ${results.proveedores}`);
    console.log(`   - Estancias: ${results.estancias}`);
    console.log(`   - Almacenes: ${results.almacenes}`);
    console.log(`   📊 TOTAL: ${totalSynced} elementos sincronizados`);

    alert(
      `✅ Sincronización completada!\n\n📊 Datos sincronizados a Firebase:\n\n• Económicos: ${results.economicos}\n• Operadores: ${results.operadores}\n• Clientes: ${results.clientes}\n• Proveedores: ${results.proveedores}\n• Estancias: ${results.estancias}\n• Almacenes: ${results.almacenes}\n\n🎯 Total: ${totalSynced} elementos\n\nAhora estos datos estarán disponibles en todas las sesiones, incluyendo ventanas de incógnito.`
    );

    return results;
  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
    alert('❌ Error durante la sincronización. Revisa la consola para más detalles.');
    return null;
  }
};

// Función para verificar qué datos de configuración hay en Firebase
window.verifyConfigInFirebase = async function () {
  console.log('🔍 === VERIFICANDO CONFIGURACIÓN EN FIREBASE ===');

  if (!window.firebaseDb || !window.fs) {
    console.error('❌ Firebase no disponible');
    return;
  }

  const collections = [
    'economicos',
    'operadores',
    'clientes',
    'proveedores',
    'estancias',
    'almacenes'
  ];
  const counts = {};

  for (const collectionName of collections) {
    try {
      const collectionRef = window.fs.collection(window.firebaseDb, collectionName);
      const querySnapshot = await window.fs.getDocs(
        window.fs.query(
          collectionRef,
          window.fs.where('tenantId', '==', window.DEMO_CONFIG?.tenantId || 'demo_tenant')
        )
      );
      counts[collectionName] = querySnapshot.docs.length;
      console.log(`📊 ${collectionName}: ${counts[collectionName]} documentos`);
    } catch (error) {
      console.error(`❌ Error verificando ${collectionName}:`, error);
      counts[collectionName] = 'Error';
    }
  }

  console.log('🔍 === FIN VERIFICACIÓN ===');
  return counts;
};

console.log('✅ Script de sincronización de configuración cargado');
console.log('📋 Funciones disponibles:');
console.log('   - window.syncAllConfigToFirebase() - Sincroniza toda la configuración a Firebase');
console.log('   - window.verifyConfigInFirebase() - Verifica qué hay en Firebase');
