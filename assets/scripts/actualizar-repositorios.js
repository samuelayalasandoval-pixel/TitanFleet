// Actualizar repositorios existentes con Firebase v10 - TitanFleet ERP

window.actualizarRepositoriosConFirebaseV10 = function () {
  console.log('🔄 === ACTUALIZANDO REPOSITORIOS CON FIREBASE V10 ===');

  if (!window.fs || !window.firebaseDb) {
    console.error('❌ Firebase v10 no está disponible');
    return false;
  }

  if (!window.firebaseRepos) {
    console.error('❌ No hay repositorios para actualizar');
    return false;
  }

  // Actualizar cada repositorio
  Object.keys(window.firebaseRepos).forEach(key => {
    const repo = window.firebaseRepos[key];
    if (repo) {
      console.log(`🔄 Actualizando ${key}...`);

      // Actualizar las funciones de Firebase v10
      repo.doc = window.fs.doc;
      repo.setDoc = window.fs.setDoc;
      repo.getDoc = window.fs.getDoc;
      repo.collection = window.fs.collection;
      repo.getDocs = window.fs.getDocs;
      repo.query = window.fs.query;
      repo.where = window.fs.where;

      // Actualizar la base de datos
      repo.db = window.firebaseDb;

      // Marcar como disponible
      repo._firebaseUnavailable = false;

      console.log(`✅ ${key} actualizado con Firebase v10`);
    }
  });

  console.log('✅ Todos los repositorios actualizados con Firebase v10');
  return true;
};

window.probarRepositorios = async function () {
  console.log('🧪 === PROBANDO REPOSITORIOS ===');

  if (!window.firebaseRepos?.logistica) {
    console.error('❌ Repositorio de logística no disponible');
    return;
  }

  try {
    // Probar guardar un documento de prueba
    const testData = {
      test: true,
      timestamp: new Date().toISOString()
    };

    console.log('🧪 Probando guardar documento de prueba...');
    const resultado = await window.firebaseRepos.logistica.save('test_doc', testData);

    if (resultado === true) {
      console.log('✅ Repositorio funciona correctamente');
    } else {
      console.log('⚠️ Repositorio guardó en localStorage como fallback');
    }

    // Probar obtener documentos
    console.log('🧪 Probando obtener todos los documentos...');
    const documentos = await window.firebaseRepos.logistica.getAll();
    console.log(`📊 Documentos encontrados: ${documentos.length}`);
  } catch (error) {
    console.error('❌ Error probando repositorio:', error);
  }

  console.log('🧪 === FIN PRUEBA ===');
};

window.migrarDatosAFirebaseV10 = async function () {
  console.log('🔄 === MIGRACIÓN COMPLETA A FIREBASE V10 ===');

  // 1. Cargar Firebase v10
  console.log('1️⃣ Cargando Firebase v10...');
  const firebaseCargado = await window.intentarCargarFirebaseV10();
  if (!firebaseCargado) {
    console.error('❌ No se pudo cargar Firebase v10');
    return false;
  }

  // 2. Actualizar repositorios
  console.log('2️⃣ Actualizando repositorios...');
  const reposActualizados = window.actualizarRepositoriosConFirebaseV10();
  if (!reposActualizados) {
    console.error('❌ No se pudieron actualizar los repositorios');
    return false;
  }

  // 3. Probar repositorios
  console.log('3️⃣ Probando repositorios...');
  await window.probarRepositorios();

  // 4. Migrar datos
  console.log('4️⃣ Migrando datos...');
  const totalMigrados = await window.migrarDatosAFirebase();

  console.log('🎉 === MIGRACIÓN COMPLETADA ===');
  console.log(`📊 Total de registros migrados: ${totalMigrados}`);

  return true;
};

console.log('✅ Funciones de actualización cargadas:');
console.log('  - window.actualizarRepositoriosConFirebaseV10()');
console.log('  - window.probarRepositorios()');
console.log('  - window.migrarDatosAFirebaseV10()');
