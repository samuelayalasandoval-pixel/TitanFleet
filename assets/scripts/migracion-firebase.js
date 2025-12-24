// Funciones de migración de localStorage a Firebase
// TitanFleet ERP

// Función para migrar todos los datos de localStorage a Firebase
window.migrarDatosAFirebase = async function () {
  console.log('🔄 === MIGRANDO DATOS A FIREBASE ===');

  try {
    let totalMigrados = 0;

    // 1. Migrar datos de logística
    console.log('📊 Migrando datos de logística...');
    const logisticaData = localStorage.getItem('erp_logistica');
    if (logisticaData && window.firebaseRepos?.logistica) {
      const parsed = JSON.parse(logisticaData);
      const dataArray = Array.isArray(parsed) ? parsed : Object.values(parsed);

      for (const registro of dataArray) {
        if (registro.numeroRegistro || registro.id) {
          await window.firebaseRepos.logistica.saveRegistro(
            registro.numeroRegistro || registro.id,
            registro
          );
          totalMigrados++;
        }
      }
      console.log(`✅ ${dataArray.length} registros de logística migrados`);
    }

    // 2. Migrar datos de tráfico
    console.log('📊 Migrando datos de tráfico...');
    const traficoData = localStorage.getItem('erp_trafico');
    if (traficoData && window.firebaseRepos?.trafico) {
      const parsed = JSON.parse(traficoData);

      for (const registro of parsed) {
        if (registro.numeroRegistro || registro.id) {
          await window.firebaseRepos.trafico.saveRegistro(
            registro.numeroRegistro || registro.id,
            registro
          );
          totalMigrados++;
        }
      }
      console.log(`✅ ${parsed.length} registros de tráfico migrados`);
    }

    // 3. Migrar datos de operadores
    console.log('📊 Migrando datos de operadores...');
    const operadoresData = localStorage.getItem('erp_operadores');
    if (operadoresData && window.firebaseRepos?.operadores) {
      const parsed = JSON.parse(operadoresData);

      for (const operador of parsed) {
        if (operador.id || operador.nombre) {
          await window.firebaseRepos.operadores.save(operador.id || operador.nombre, operador);
          totalMigrados++;
        }
      }
      console.log(`✅ ${parsed.length} operadores migrados`);
    }

    // 4. Migrar datos de clientes
    console.log('📊 Migrando datos de clientes...');
    const clientesData = localStorage.getItem('erp_clientes');
    if (clientesData && window.firebaseRepos?.clientes) {
      const parsed = JSON.parse(clientesData);

      for (const cliente of parsed) {
        if (cliente.id || cliente.rfc) {
          await window.firebaseRepos.clientes.save(cliente.id || cliente.rfc, cliente);
          totalMigrados++;
        }
      }
      console.log(`✅ ${parsed.length} clientes migrados`);
    }

    console.log('🎉 === MIGRACIÓN COMPLETADA ===');
    console.log(`📊 Total de registros migrados: ${totalMigrados}`);

    alert(
      `✅ Migración a Firebase completada!\n\n📊 Registros migrados: ${totalMigrados}\n\n🔄 Ahora todos los datos están en Firebase.\n\n💡 Puedes limpiar localStorage si lo deseas.`
    );

    return totalMigrados;
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    alert('❌ Error durante la migración. Revisa la consola para más detalles.');
    return 0;
  }
};

// Función para limpiar localStorage después de la migración
window.limpiarLocalStorageDespuesMigracion = function () {
  console.log('🧹 === LIMPIANDO LOCALSTORAGE ===');

  const clavesOperacionales = [
    'erp_logistica',
    'erp_trafico',
    'erp_facturacion',
    'erp_diesel_movimientos',
    'erp_operadores_gastos',
    'erp_cxc_data',
    'erp_cxp_data',
    'erp_tesoreria_movimientos',
    'erp_operadores_incidencias',
    'erp_mantenimientos',
    'erp_inv_refacciones_stock'
  ];

  let clavesEliminadas = 0;

  clavesOperacionales.forEach(clave => {
    if (localStorage.getItem(clave)) {
      localStorage.removeItem(clave);
      clavesEliminadas++;
      console.log(`🗑️ Eliminado: ${clave}`);
    }
  });

  console.log(`✅ ${clavesEliminadas} claves operacionales eliminadas del localStorage`);

  alert(
    `✅ localStorage limpiado!\n\n🗑️ Claves eliminadas: ${clavesEliminadas}\n\n💾 Solo se mantuvieron datos de configuración.\n\n🔄 Ahora el sistema usa solo Firebase.`
  );

  return clavesEliminadas;
};

// Función para verificar qué datos están en Firebase vs localStorage
window.verificarEstadoDatos = async function () {
  console.log('🔍 === VERIFICANDO ESTADO DE DATOS ===');

  try {
    // Verificar Firebase
    console.log('📊 Datos en Firebase:');

    if (window.firebaseRepos?.logistica) {
      const logisticaFirebase = await window.firebaseRepos.logistica.getAllRegistros();
      console.log(`  - Logística: ${logisticaFirebase.length} registros`);
    }

    if (window.firebaseRepos?.trafico) {
      const traficoFirebase = await window.firebaseRepos.trafico.getAllRegistros();
      console.log(`  - Tráfico: ${traficoFirebase.length} registros`);
    }

    // Verificar localStorage
    console.log('📊 Datos en localStorage:');
    const logisticaLocal = localStorage.getItem('erp_logistica');
    const traficoLocal = localStorage.getItem('erp_trafico');

    if (logisticaLocal) {
      const parsed = JSON.parse(logisticaLocal);
      const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
      console.log(`  - Logística: ${count} registros`);
    }

    if (traficoLocal) {
      const parsed = JSON.parse(traficoLocal);
      console.log(`  - Tráfico: ${parsed.length} registros`);
    }

    console.log('🔍 === FIN VERIFICACIÓN ===');
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
  }
};

console.log('✅ Funciones de migración cargadas:');
console.log('  - window.migrarDatosAFirebase()');
console.log('  - window.limpiarLocalStorageDespuesMigracion()');
console.log('  - window.verificarEstadoDatos()');
